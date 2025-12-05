"""
Pydantic Models for API Request/Response
"""
from pydantic import BaseModel
from typing import List, Optional


class ChatRequest(BaseModel):
    """Request model for chat endpoints"""
    query: str
    image_base64: Optional[str] = None
    chat_history: Optional[List[dict]] = []


class ChatResponse(BaseModel):
    """Response model for chat endpoints"""
    response: str
    sources: List[str]
    matches_found: Optional[int] = None


class UploadResponse(BaseModel):
    """Response model for PDF upload endpoints"""
    message: str
    filename: str
    text_chunks: int
    index: str
