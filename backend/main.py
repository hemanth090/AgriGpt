"""
AgriGPT API - Main Entry Point
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.services import agri_service
from app.routes import crops, schemes, auth
from app.security import limiter
from app.config import validate_env

app = FastAPI(
    title="AgriGPT API",
    description="AI-Powered Agricultural Consultant",
    version="2.0.0"
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ===========================
# ISSUE 11: CENTRALIZED ERROR HANDLER
# ===========================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global error handler for uncaught exceptions."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again.",
            "error_type": type(exc).__name__
        }
    )


# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(crops.router)
app.include_router(schemes.router)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    validate_env()  # Issue 12: Validate env on startup
    await agri_service.initialize()


@app.get("/health")
async def health_check():
    """Health check endpoint (no auth required)"""
    return {"status": "healthy", "service": "AgriGPT API", "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)