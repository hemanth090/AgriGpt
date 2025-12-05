"""
AgriGPT Service - Gemini Vision + RAG

Flow:
1. PDF Ingestion: PDF → text extraction → CLIP embeddings → Pinecone
2. Image Query: Image → GEMINI VISION (diagnosis) → RAG (treatment) → Response
3. Text Query: Query → CLIP embedding → search → LLM response

Uses TWO separate Pinecone indexes:
- agrigpt-crops: For crop disease/agriculture data
- agrigpt-schemes: For government scheme data
"""

import os
import io
import base64
from typing import List, Dict, Any, Optional

# PDF and Image processing
import fitz  # PyMuPDF
from PIL import Image

# LangChain imports
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

# Google Generative AI for Vision
import google.generativeai as genai

# CLIP for text embeddings
from transformers import CLIPProcessor, CLIPModel
import torch

# Pinecone
from pinecone import Pinecone, ServerlessSpec

# Config
from app.config import (
    GOOGLE_API_KEY, PINECONE_API_KEY,
    INDEX_CROP_DATA, INDEX_GOV_SCHEMES,
    CLIP_MODEL, CLIP_EMBEDDING_DIM,
    CHUNK_SIZE, CHUNK_OVERLAP,
    LLM_MODEL, LLM_TEMPERATURE, VISION_MODEL
)


class AgriService:
    """
    AgriGPT Service using Gemini Vision + CLIP RAG.
    """
    
    def __init__(self):
        self.clip_model = None
        self.clip_processor = None
        self.llm = None
        self.vision_model = None
        self.pc = None
        self.crop_index = None
        self.schemes_index = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len,
        )
        
    async def initialize(self):
        """Initialize CLIP, Gemini Vision, LLM, and Pinecone indexes."""
        # Initialize CLIP for text embeddings
        print("⏳ Loading CLIP model...")
        self.clip_model = CLIPModel.from_pretrained(CLIP_MODEL)
        self.clip_processor = CLIPProcessor.from_pretrained(CLIP_MODEL)
        self.clip_model.to(self.device)
        self.clip_model.eval()
        print(f"✓ CLIP initialized ({CLIP_EMBEDDING_DIM}-dim)")
        
        # Initialize Gemini Vision
        genai.configure(api_key=GOOGLE_API_KEY)
        self.vision_model = genai.GenerativeModel(VISION_MODEL)
        print(f"✓ Gemini Vision initialized ({VISION_MODEL})")
        
        # Initialize LLM for response generation
        self.llm = ChatGoogleGenerativeAI(
            model=LLM_MODEL,
            google_api_key=GOOGLE_API_KEY,
            temperature=LLM_TEMPERATURE,
        )
        print(f"✓ LLM initialized ({LLM_MODEL})")
        
        # Initialize Pinecone
        self.pc = Pinecone(api_key=PINECONE_API_KEY)
        existing_indexes = [idx.name for idx in self.pc.list_indexes()]
        
        # Create/Connect to CROPS index
        if INDEX_CROP_DATA not in existing_indexes:
            self.pc.create_index(
                name=INDEX_CROP_DATA,
                dimension=CLIP_EMBEDDING_DIM,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
            print(f"✓ Created index: {INDEX_CROP_DATA}")
        self.crop_index = self.pc.Index(INDEX_CROP_DATA)
        print(f"✓ Connected to: {INDEX_CROP_DATA}")
        
        # Create/Connect to SCHEMES index
        if INDEX_GOV_SCHEMES not in existing_indexes:
            self.pc.create_index(
                name=INDEX_GOV_SCHEMES,
                dimension=CLIP_EMBEDDING_DIM,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
            print(f"✓ Created index: {INDEX_GOV_SCHEMES}")
        self.schemes_index = self.pc.Index(INDEX_GOV_SCHEMES)
        print(f"✓ Connected to: {INDEX_GOV_SCHEMES}")
    
    # ===========================
    # GEMINI VISION
    # ===========================
    
    def analyze_image(self, image: Image.Image) -> str:
        """
        Use Gemini Vision to analyze crop image and identify diseases.
        """
        prompt = """Analyze this crop/plant image and identify:
1. What crop/plant is shown
2. Any diseases, infections, or problems visible
3. Visible symptoms (spots, lesions, discoloration, etc.)

Be specific about the disease name if you can identify it.
If the image doesn't show a plant or crop, say so.

Provide a concise analysis."""

        response = self.vision_model.generate_content([prompt, image])
        return response.text
    
    # ===========================
    # CLIP TEXT EMBEDDINGS
    # ===========================
    
    def _get_text_embedding(self, text: str) -> List[float]:
        """Get CLIP text embedding."""
        with torch.no_grad():
            inputs = self.clip_processor(
                text=[text[:300]],
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=77
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            features = self.clip_model.get_text_features(**inputs)
            features = features / features.norm(dim=-1, keepdim=True)
            return features.cpu().numpy().flatten().tolist()
    
    # ===========================
    # PDF INGESTION
    # ===========================
    
    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF using PyMuPDF."""
        doc = fitz.open(file_path)
        text = ""
        for page_num, page in enumerate(doc):
            page_text = page.get_text()
            if page_text.strip():
                text += f"\n--- Page {page_num + 1} ---\n{page_text}"
        doc.close()
        return text
    
    async def ingest_pdf(self, file_path: str, filename: str, index_type: str = "schemes") -> Dict[str, Any]:
        """Ingest PDF into specified index."""
        if not self.crop_index or not self.schemes_index:
            await self.initialize()
        
        index = self.schemes_index if index_type == "schemes" else self.crop_index
        index_name = INDEX_GOV_SCHEMES if index_type == "schemes" else INDEX_CROP_DATA
        
        print(f"\n{'='*50}")
        print(f"Ingesting: {filename} → {index_name}")
        print(f"{'='*50}")
        
        # Extract text
        text = self._extract_text_from_pdf(file_path)
        if not text.strip():
            return {"filename": filename, "text_chunks": 0, "message": "No text found"}
        
        # Chunk text
        chunks = self.text_splitter.split_text(text)
        print(f"📄 Created {len(chunks)} chunks")
        
        # Create embeddings and upsert
        vectors = []
        for i, chunk in enumerate(chunks):
            embedding = self._get_text_embedding(chunk)
            vectors.append({
                "id": f"{filename}_chunk_{i}",
                "values": embedding,
                "metadata": {
                    "source": filename,
                    "chunk_index": i,
                    "content": chunk[:500],
                }
            })
        
        # Batch upsert
        for i in range(0, len(vectors), 100):
            batch = vectors[i:i + 100]
            index.upsert(vectors=batch)
        
        print(f"✅ Ingested {len(vectors)} vectors")
        
        return {
            "filename": filename,
            "text_chunks": len(chunks),
            "vectors_stored": len(vectors),
            "index": index_name,
        }
    
    # ===========================
    # SEARCH & QUERY
    # ===========================
    
    def _search(self, embedding: List[float], top_k: int, index_type: str) -> List[Dict[str, Any]]:
        """Search Pinecone with embedding."""
        index = self.schemes_index if index_type == "schemes" else self.crop_index
        
        results = index.query(
            vector=embedding,
            top_k=top_k,
            include_metadata=True
        )
        
        matches = []
        for match in results.get("matches", []):
            matches.append({
                "id": match["id"],
                "score": match["score"],
                "content": match.get("metadata", {}).get("content", ""),
                "source": match.get("metadata", {}).get("source", "Unknown"),
            })
        return matches
    
    async def query(
        self, 
        query: str, 
        image_base64: Optional[str] = None,
        index_type: str = "schemes"
    ) -> Dict[str, Any]:
        """
        Main query endpoint.
        
        NEW FLOW with Gemini Vision:
        1. If image: Gemini Vision analyzes it → gets disease diagnosis
        2. Use diagnosis + query to search RAG
        3. Combine vision analysis + RAG context → final response
        """
        if not self.crop_index or not self.schemes_index:
            await self.initialize()
        
        index_name = INDEX_GOV_SCHEMES if index_type == "schemes" else INDEX_CROP_DATA
        
        vision_analysis = None
        search_query = query
        
        # STEP 1: If image provided, analyze with Gemini Vision
        if image_base64:
            print(f"\n🖼️ Analyzing image with Gemini Vision...")
            image_bytes = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_bytes))
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            vision_analysis = self.analyze_image(image)
            print(f"   Vision: {vision_analysis[:100]}...")
            
            # Use vision analysis for better RAG search
            search_query = f"{query} {vision_analysis}"
        
        # STEP 2: RAG Search
        print(f"🔍 Searching: {search_query[:50]}... → {index_name}")
        embedding = self._get_text_embedding(search_query)
        matches = self._search(embedding, top_k=5, index_type=index_type)
        relevant = [m for m in matches if m["score"] > 0.2]
        print(f"   Found {len(relevant)} relevant matches")
        
        # STEP 3: Generate combined response
        if vision_analysis and relevant:
            # Image + RAG context
            context = "\n\n".join([f"[{m['source']}]\n{m['content']}" for m in relevant])
            prompt = f"""You are an agricultural expert.

IMAGE ANALYSIS (from Gemini Vision):
{vision_analysis}

KNOWLEDGE BASE (from documents):
{context}

USER QUESTION: {query}

Based on the image analysis and knowledge base, provide:
1. The diagnosis (what disease/problem)
2. Treatment recommendations
3. Prevention tips

Include citations to sources."""
        
        elif vision_analysis:
            # Image only, no RAG matches
            prompt = f"""You are an agricultural expert.

IMAGE ANALYSIS:
{vision_analysis}

USER QUESTION: {query}

Based on the image analysis, provide your best diagnosis and recommendations."""
        
        elif relevant:
            # Text only with RAG
            context = "\n\n".join([f"[{m['source']}]\n{m['content']}" for m in relevant])
            prompt = f"""Based on this context:
{context}

Answer: {query}

Provide a helpful response with citations."""
        
        else:
            return {
                "response": "No relevant information found. Please upload related documents first.",
                "sources": [],
                "matches_found": 0,
                "vision_analysis": vision_analysis,
            }
        
        print("💬 Generating response...")
        response = self.llm.invoke([HumanMessage(content=prompt)])
        sources = list(set([m["source"] for m in relevant])) if relevant else []
        
        return {
            "response": response.content,
            "sources": sources,
            "matches_found": len(relevant),
            "vision_analysis": vision_analysis,
        }


# Singleton instance
agri_service = AgriService()
