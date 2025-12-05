"""
Auth Routes - User authentication utilities
"""
from fastapi import APIRouter, Depends

from app.security import verify_supabase_token, ADMIN_EMAILS

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/check-admin")
async def check_admin(payload: dict = Depends(verify_supabase_token)):
    """Check if current user is an admin."""
    user_email = payload.get("email", "")
    is_admin = user_email in ADMIN_EMAILS and ADMIN_EMAILS != [""]
    return {"is_admin": is_admin, "email": user_email}


@router.get("/me")
async def get_current_user(payload: dict = Depends(verify_supabase_token)):
    """Get current user info from token."""
    return {
        "email": payload.get("email", ""),
        "sub": payload.get("sub", ""),
        "role": payload.get("role", "")
    }
