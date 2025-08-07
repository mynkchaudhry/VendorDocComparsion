from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
import time
import uuid
import logging
from typing import Callable
from app.logging_config import get_logger
import traceback

# Performance logger
perf_logger = logging.getLogger("app.performance")
security_logger = logging.getLogger("app.security")
error_logger = logging.getLogger("app")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests with structured data"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Start timer
        start_time = time.time()
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Log request
        logger = get_logger("app.requests", request_id=request_id)
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "ip_address": client_ip,
                "request_id": request_id
            }
        )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate response time
            response_time = (time.time() - start_time) * 1000  # ms
            
            # Log response
            logger.info(
                f"Request completed: {request.method} {request.url.path} - {response.status_code}",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "response_time": response_time,
                    "ip_address": client_ip,
                    "request_id": request_id
                }
            )
            
            # Log performance metrics
            if response_time > 1000:  # Log slow requests (>1s)
                perf_logger.warning(
                    f"Slow request detected: {request.method} {request.url.path}",
                    extra={
                        "method": request.method,
                        "path": request.url.path,
                        "response_time": response_time,
                        "request_id": request_id
                    }
                )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Log error
            response_time = (time.time() - start_time) * 1000
            error_logger.exception(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "response_time": response_time,
                    "ip_address": client_ip,
                    "request_id": request_id,
                    "error": str(e)
                }
            )
            raise

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except HTTPException as e:
            # FastAPI HTTPException
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "error": {
                        "message": e.detail,
                        "status_code": e.status_code,
                        "request_id": getattr(request.state, "request_id", None)
                    }
                },
                headers=e.headers if hasattr(e, 'headers') else None
            )
        except StarletteHTTPException as e:
            # Starlette HTTPException
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "error": {
                        "message": e.detail,
                        "status_code": e.status_code,
                        "request_id": getattr(request.state, "request_id", None)
                    }
                }
            )
        except ValueError as e:
            # Validation errors
            error_logger.warning(
                f"Validation error: {str(e)}",
                extra={
                    "request_id": getattr(request.state, "request_id", None),
                    "path": request.url.path,
                    "method": request.method
                }
            )
            return JSONResponse(
                status_code=400,
                content={
                    "error": {
                        "message": str(e),
                        "status_code": 400,
                        "type": "validation_error",
                        "request_id": getattr(request.state, "request_id", None)
                    }
                }
            )
        except Exception as e:
            # Unexpected errors
            request_id = getattr(request.state, "request_id", None)
            error_logger.exception(
                f"Unhandled exception: {str(e)}",
                extra={
                    "request_id": request_id,
                    "path": request.url.path,
                    "method": request.method,
                    "traceback": traceback.format_exc()
                }
            )
            
            # Don't expose internal errors in production
            error_message = "An internal error occurred. Please try again later."
            if hasattr(request.app.state, "debug") and request.app.state.debug:
                error_message = str(e)
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "message": error_message,
                        "status_code": 500,
                        "type": "internal_error",
                        "request_id": request_id
                    }
                }
            )

class SecurityMiddleware(BaseHTTPMiddleware):
    """Security logging middleware"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Log authentication attempts
        if request.url.path in ["/auth/token", "/auth/login"]:
            security_logger.info(
                "Authentication attempt",
                extra={
                    "path": request.url.path,
                    "ip_address": request.client.host if request.client else "unknown",
                    "request_id": getattr(request.state, "request_id", None)
                }
            )
        
        # Log suspicious patterns
        suspicious_patterns = ["../", "..\\", "<script", "javascript:", "onclick=", "onerror="]
        url_str = str(request.url)
        for pattern in suspicious_patterns:
            if pattern in url_str.lower():
                security_logger.warning(
                    f"Suspicious pattern detected: {pattern}",
                    extra={
                        "pattern": pattern,
                        "url": url_str,
                        "ip_address": request.client.host if request.client else "unknown",
                        "request_id": getattr(request.state, "request_id", None)
                    }
                )
                break
        
        response = await call_next(request)
        
        # Log failed authentication
        if request.url.path in ["/auth/token", "/auth/login"] and response.status_code == 401:
            security_logger.warning(
                "Authentication failed",
                extra={
                    "path": request.url.path,
                    "ip_address": request.client.host if request.client else "unknown",
                    "request_id": getattr(request.state, "request_id", None)
                }
            )
        
        return response