"""
Government Schemes Routes - with Security
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
import tempfile
import os

from app.models import ChatRequest, ChatResponse, UploadResponse
from app.services import agri_service
from app.config import INDEX_GOV_SCHEMES
from app.security import verify_supabase_token, verify_admin, limiter, validate_query, RATE_LIMIT_UPLOAD, RATE_LIMIT_QUERY

router = APIRouter(prefix="/schemes", tags=["Government Schemes"])


# Admin only - upload
@router.post("/upload", response_model=UploadResponse, dependencies=[Depends(verify_admin)])
@limiter.limit(RATE_LIMIT_UPLOAD)
async def upload_government_schemes(request: Request, file: UploadFile = File(...)):
    """Upload Government Schemes PDF."""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        result = await agri_service.ingest_pdf(
            temp_file_path, 
            file.filename,
            index_type="schemes"
        )
        os.unlink(temp_file_path)
        
        return UploadResponse(
            message="Government Schemes PDF uploaded successfully.",
            filename=result["filename"],
            text_chunks=result["text_chunks"],
            index=INDEX_GOV_SCHEMES,
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading PDF: {str(e)}")


@router.post("/query", response_model=ChatResponse, dependencies=[Depends(verify_supabase_token)])
@limiter.limit(RATE_LIMIT_QUERY)
async def query_government_schemes(request: Request, chat_request: ChatRequest):
    """Query Government Schemes (text only)."""
    try:
        # Validate and sanitize query
        safe_query = validate_query(chat_request.query)
        
        result = await agri_service.query(
            query=safe_query,
            image_base64=None,
            index_type="schemes"
        )
        
        return ChatResponse(
            response=result["response"],
            sources=result["sources"],
            matches_found=result["matches_found"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
