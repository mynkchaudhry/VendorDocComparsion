# VenXtra API Server Startup Script
# Development server configuration using Uvicorn ASGI server

import uvicorn
import sys
import os

# Add current directory to Python path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    # Start development server with hot reload
    uvicorn.run(
        "app.main:app",           # FastAPI application location
        host="0.0.0.0",           # Listen on all interfaces
        port=8000,                # Default development port
        reload=True,              # Enable hot reload for development
        reload_dirs=["app"]       # Watch app directory for changes
    )