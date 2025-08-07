# Main FastAPI application entry point for VenXtra API
# VenXtra is an AI-powered vendor comparison dashboard

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import auth, projects, vendors, documents, comparison, users, enhanced_documents
from app.logging_config import setup_logging
from app.middleware import RequestLoggingMiddleware, ErrorHandlingMiddleware, SecurityMiddleware
from app.rate_limiter import rate_limiter, RateLimitMiddleware
import logging

# Application lifecycle manager - handles startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup logging configuration
    setup_logging()
    logger = logging.getLogger("app")
    logger.info("Starting VenXtra API")
    
    # Initialize MongoDB database connection and models
    await init_db()
    logger.info("Database initialized")
    
    # Initialize Redis rate limiter for API protection
    await rate_limiter.connect()
    logger.info("Rate limiter initialized")
    
    yield
    
    # Cleanup resources on shutdown
    await rate_limiter.disconnect()
    logger.info("Shutting down VenXtra API")

app = FastAPI(
    title="VenXtra API",
    description="AI-powered vendor comparison dashboard",
    version="1.0.0",
    lifespan=lifespan
)

# Add custom middleware layers (order matters - last added is executed first)
app.add_middleware(RateLimitMiddleware)         # Rate limiting protection
app.add_middleware(ErrorHandlingMiddleware)    # Global error handling
app.add_middleware(SecurityMiddleware)         # Security headers and validation
app.add_middleware(RequestLoggingMiddleware)   # Request/response logging

# CORS middleware should be last (executed first)
# Allow requests from frontend development servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React/Vite dev servers
    allow_credentials=True,    # Allow cookies and auth headers
    allow_methods=["*"],      # Allow all HTTP methods
    allow_headers=["*"],      # Allow all headers
)

# Include API route handlers
app.include_router(auth.router)               # Authentication endpoints
app.include_router(users.router)              # User management
app.include_router(projects.router)           # Project CRUD operations
app.include_router(vendors.router)            # Vendor management
app.include_router(documents.router)          # Document upload and processing
app.include_router(enhanced_documents.router) # Advanced document processing
app.include_router(comparison.router)         # Vendor comparison features

# Root endpoint - basic API information
@app.get("/")
async def root():
    """Root endpoint returning basic API information"""
    return {"message": "VenXtra API is running"}

# Health check endpoint for monitoring and load balancers
@app.get("/health")
async def health_check():
    """Health check endpoint for service monitoring"""
    return {"status": "healthy"}

