"""
Security Module - Supabase JWT Auth, Rate Limiting, Prompt Guardrails
"""
import os
import re
import jwt
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter
from slowapi.util import get_remote_address

# ===========================
# SUPABASE JWT AUTHENTICATION
# ===========================

# Supabase JWT secret (get from Supabase dashboard -> Settings -> API -> JWT Secret)
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")

# Admin emails (add your admin emails here)
ADMIN_EMAILS = os.getenv("ADMIN_EMAILS", "").split(",")

security = HTTPBearer(auto_error=False)

async def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Verify Supabase JWT token from Authorization header."""
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization header. Please login."
        )
    
    token = credentials.credentials
    
    try:
        # Check environment - development vs production
        is_production = os.getenv("ENVIRONMENT", "development") == "production"
        
        if is_production and not SUPABASE_JWT_SECRET:
            raise HTTPException(
                status_code=500,
                detail="Server configuration error: JWT secret not set."
            )
        
        if not SUPABASE_JWT_SECRET:
            # Decode without verification (development only)
            payload = jwt.decode(token, options={"verify_signature": False})
        else:
            # Production: verify with secret
            payload = jwt.decode(
                token, 
                SUPABASE_JWT_SECRET, 
                algorithms=["HS256"],
                audience="authenticated"
            )
        
        # Check if token is for authenticated user
        if payload.get("role") != "authenticated":
            raise HTTPException(status_code=401, detail="Invalid token role")
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please login again.")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def verify_admin(
    payload: dict = Depends(verify_supabase_token)
):
    """Verify user is an admin. Must be used after verify_supabase_token."""
    user_email = payload.get("email", "")
    
    # Check if user email is in admin list
    if user_email not in ADMIN_EMAILS and ADMIN_EMAILS != [""]:
        raise HTTPException(
            status_code=403,
            detail="Admin access required. Contact administrator."
        )
    
    return payload


# ===========================
# RATE LIMITING
# ===========================

from app.config import RATE_LIMIT_UPLOAD, RATE_LIMIT_QUERY, RATE_LIMIT_DEFAULT

limiter = Limiter(key_func=get_remote_address)


# ===========================
# PROMPT GUARDRAILS
# ===========================

# Blocked patterns for prompt injection
BLOCKED_PATTERNS = [
    r"ignore\s+(previous|all|above)\s+instructions",
    r"forget\s+(everything|all|your\s+instructions)",
    r"you\s+are\s+now\s+a",
    r"pretend\s+to\s+be",
    r"jailbreak",
    r"bypass\s+(filter|restriction|safety)",
    r"act\s+as\s+(if\s+you|an?\s+evil)",
    r"disregard\s+(all|previous)",
]

# Compile patterns for efficiency
COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in BLOCKED_PATTERNS]


def sanitize_prompt(text: str) -> str:
    """
    Check prompt for injection attempts and sanitize.
    Raises HTTPException if malicious content detected.
    """
    if not text:
        return text
    
    # Check for blocked patterns
    for pattern in COMPILED_PATTERNS:
        if pattern.search(text):
            raise HTTPException(
                status_code=400,
                detail="Invalid prompt detected. Please rephrase your question."
            )
    
    # Basic sanitization - remove excessive whitespace
    text = " ".join(text.split())
    
    # Limit prompt length (prevent token stuffing)
    MAX_PROMPT_LENGTH = 2000
    if len(text) > MAX_PROMPT_LENGTH:
        text = text[:MAX_PROMPT_LENGTH]
    
    return text


def validate_query(query: str) -> str:
    """Validate and sanitize user query."""
    if not query or not query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query cannot be empty."
        )
    return sanitize_prompt(query.strip())
