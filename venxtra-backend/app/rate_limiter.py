from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
import redis.asyncio as redis
from app.config import settings
import logging
import json

logger = logging.getLogger("app.security")

class RateLimiter:
    """Redis-based rate limiter with sliding window algorithm"""
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.default_limits = {
            "global": (1000, 3600),      # 1000 requests per hour
            "auth": (10, 300),           # 10 auth attempts per 5 minutes
            "upload": (50, 3600),        # 50 uploads per hour
            "api": (100, 60),            # 100 API calls per minute
            "heavy": (10, 300)           # 10 heavy operations per 5 minutes
        }
        
    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis_client = await redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis_client.ping()
            logger.info("Rate limiter connected to Redis")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            self.redis_client = None
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
    
    def get_identifier(self, request: Request) -> str:
        """Get unique identifier for rate limiting"""
        # Use IP address as identifier
        if request.client:
            return f"ip:{request.client.host}"
        return "ip:unknown"
    
    async def check_rate_limit(
        self, 
        identifier: str, 
        limit_type: str = "api",
        custom_limit: Optional[Tuple[int, int]] = None
    ) -> Tuple[bool, Dict[str, int]]:
        """
        Check if request is within rate limit
        Returns: (is_allowed, limit_info)
        """
        if not self.redis_client:
            # If Redis is not available, allow requests but log warning
            logger.warning("Rate limiting disabled - Redis not available")
            return True, {"limit": 0, "remaining": 0, "reset": 0}
        
        try:
            # Get limit configuration
            limit, window = custom_limit or self.default_limits.get(limit_type, (100, 60))
            
            # Create key for this identifier and limit type
            key = f"rate_limit:{limit_type}:{identifier}"
            
            # Get current timestamp
            now = datetime.utcnow()
            window_start = now - timedelta(seconds=window)
            
            # Remove old entries
            await self.redis_client.zremrangebyscore(
                key, 
                "-inf", 
                window_start.timestamp()
            )
            
            # Count requests in current window
            current_count = await self.redis_client.zcard(key)
            
            # Check if limit exceeded
            if current_count >= limit:
                # Calculate reset time
                oldest_timestamp = await self.redis_client.zrange(
                    key, 0, 0, withscores=True
                )
                if oldest_timestamp:
                    reset_time = int(oldest_timestamp[0][1] + window)
                else:
                    reset_time = int(now.timestamp() + window)
                
                limit_info = {
                    "limit": limit,
                    "remaining": 0,
                    "reset": reset_time
                }
                
                return False, limit_info
            
            # Add current request
            await self.redis_client.zadd(
                key, 
                {str(now.timestamp()): now.timestamp()}
            )
            
            # Set expiry on key
            await self.redis_client.expire(key, window)
            
            # Calculate remaining requests
            remaining = limit - current_count - 1
            reset_time = int(now.timestamp() + window)
            
            limit_info = {
                "limit": limit,
                "remaining": remaining,
                "reset": reset_time
            }
            
            return True, limit_info
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {str(e)}")
            # On error, allow request but log
            return True, {"limit": 0, "remaining": 0, "reset": 0}
    
    async def is_blocked(self, identifier: str) -> bool:
        """Check if identifier is temporarily blocked"""
        if not self.redis_client:
            return False
        
        try:
            block_key = f"blocked:{identifier}"
            is_blocked = await self.redis_client.exists(block_key)
            return bool(is_blocked)
        except Exception as e:
            logger.error(f"Block check failed: {str(e)}")
            return False
    
    async def block_identifier(self, identifier: str, duration: int = 3600):
        """Temporarily block an identifier"""
        if not self.redis_client:
            return
        
        try:
            block_key = f"blocked:{identifier}"
            await self.redis_client.setex(block_key, duration, "1")
            logger.warning(f"Blocked identifier: {identifier} for {duration} seconds")
        except Exception as e:
            logger.error(f"Failed to block identifier: {str(e)}")

# Global rate limiter instance
rate_limiter = RateLimiter()

async def rate_limit_middleware(
    request: Request,
    limit_type: str = "api",
    custom_limit: Optional[Tuple[int, int]] = None
):
    """Middleware function for rate limiting"""
    identifier = rate_limiter.get_identifier(request)
    
    # Check if blocked
    if await rate_limiter.is_blocked(identifier):
        logger.warning(f"Blocked request from {identifier}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. You have been temporarily blocked."
        )
    
    # Check rate limit
    is_allowed, limit_info = await rate_limiter.check_rate_limit(
        identifier, limit_type, custom_limit
    )
    
    # Add rate limit headers to request state
    request.state.rate_limit_headers = {
        "X-RateLimit-Limit": str(limit_info["limit"]),
        "X-RateLimit-Remaining": str(limit_info["remaining"]),
        "X-RateLimit-Reset": str(limit_info["reset"])
    }
    
    if not is_allowed:
        logger.warning(
            f"Rate limit exceeded for {identifier} on {limit_type}",
            extra={
                "identifier": identifier,
                "limit_type": limit_type,
                "limit": limit_info["limit"]
            }
        )
        
        # Check if should block (multiple violations)
        violation_key = f"violations:{identifier}"
        if rate_limiter.redis_client:
            try:
                violations = await rate_limiter.redis_client.incr(violation_key)
                await rate_limiter.redis_client.expire(violation_key, 3600)
                
                if violations > 5:
                    await rate_limiter.block_identifier(identifier)
            except Exception as e:
                logger.error(f"Failed to track violations: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
            headers={
                "X-RateLimit-Limit": str(limit_info["limit"]),
                "X-RateLimit-Remaining": str(limit_info["remaining"]),
                "X-RateLimit-Reset": str(limit_info["reset"]),
                "Retry-After": str(limit_info["reset"] - int(datetime.utcnow().timestamp()))
            }
        )

class RateLimitMiddleware:
    """FastAPI middleware for rate limiting"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            # Determine rate limit type based on path
            path = request.url.path
            limit_type = "api"
            
            if path.startswith("/auth/"):
                limit_type = "auth"
            elif path.endswith("/upload"):
                limit_type = "upload"
            elif path.startswith("/comparison/"):
                limit_type = "heavy"
            
            try:
                # Apply global rate limit
                identifier = rate_limiter.get_identifier(request)
                is_allowed, _ = await rate_limiter.check_rate_limit(
                    identifier, "global"
                )
                
                if not is_allowed:
                    response = JSONResponse(
                        status_code=429,
                        content={
                            "error": {
                                "message": "Global rate limit exceeded",
                                "status_code": 429,
                                "type": "rate_limit_error"
                            }
                        }
                    )
                    await response(scope, receive, send)
                    return
                
            except Exception as e:
                logger.error(f"Rate limit middleware error: {str(e)}")
            
        await self.app(scope, receive, send)