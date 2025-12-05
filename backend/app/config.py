"""
AgriGPT Configuration Module
All configurable values are loaded from environment variables.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# ===========================
# ENVIRONMENT VALIDATION
# ===========================

def validate_env():
    """Validate required environment variables on startup."""
    required_vars = ["GOOGLE_API_KEY", "PINECONE_API_KEY"]
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing:
        print(f"❌ Missing required environment variables: {', '.join(missing)}")
        print("Please check your .env file.")
        sys.exit(1)
    
    print("✓ Environment variables validated")

# ===========================
# API KEYS
# ===========================
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

# ===========================
# PINECONE INDEXES
# ===========================
INDEX_CROP_DATA = os.getenv("CROP_INDEX_NAME", "agrigpt-crops")
INDEX_GOV_SCHEMES = os.getenv("SCHEMES_INDEX_NAME", "agrigpt-schemes")

# ===========================
# AI MODELS (configurable via env)
# ===========================
CLIP_MODEL = os.getenv("CLIP_MODEL", "openai/clip-vit-base-patch32")
CLIP_EMBEDDING_DIM = int(os.getenv("CLIP_EMBEDDING_DIM", "512"))

LLM_MODEL = os.getenv("LLM_MODEL", "gemini-2.5-flash")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.3"))

VISION_MODEL = os.getenv("VISION_MODEL", "gemini-2.0-flash")

# ===========================
# TEXT CHUNKING
# ===========================
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "500"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))

# ===========================
# RATE LIMITS
# ===========================
RATE_LIMIT_UPLOAD = os.getenv("RATE_LIMIT_UPLOAD", "5/minute")
RATE_LIMIT_QUERY = os.getenv("RATE_LIMIT_QUERY", "20/minute")
RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "60/minute")
