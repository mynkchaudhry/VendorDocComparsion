# Configuration settings for VenXtra application
# Uses pydantic-settings for environment variable management

from pydantic_settings import BaseSettings
from typing import Optional

# Application settings loaded from environment variables and .env file
class Settings(BaseSettings):
    # Database configuration
    mongodb_url: str = "mongodb://localhost:27017/venxtra"  # MongoDB connection string
    database_name: str = "venextra"                          # Database name
    
    # External API keys
    groq_api_key: str                                       # Groq AI API key for document processing
    
    # JWT authentication settings
    secret_key: str                                         # JWT signing secret
    algorithm: str = "HS256"                                # JWT algorithm
    access_token_expire_minutes: int = 15                   # Short-lived access token
    refresh_token_expire_days: int = 30                     # Long-lived refresh token
    
    # Password reset and security
    password_reset_expire_hours: int = 24                   # Password reset token validity
    max_login_attempts: int = 5                             # Failed login attempts before lockout
    account_lockout_minutes: int = 30                       # Account lockout duration
    
    # Redis configuration for rate limiting
    redis_url: str = "redis://localhost:6379"               # Redis connection string
    
    # File upload settings
    upload_dir: str = "./uploads"                           # Directory for uploaded files
    max_file_size: int = 100000000                          # 100MB max file size for large PDFs
    
    # Document processing settings
    max_chunk_size: int = 2000                              # Words per chunk for AI processing
    chunk_overlap: int = 200                                # Word overlap between chunks
    max_concurrent_chunks: int = 3                          # Concurrent AI processing threads
    processing_timeout: int = 1800                          # 30 minutes timeout for large documents
    
    # Background task management
    task_retention_hours: int = 24                          # How long to keep completed tasks
    max_user_tasks: int = 10                                # Max concurrent tasks per user
    
    class Config:
        env_file = ".env"  # Load settings from .env file

# Global settings instance
settings = Settings()