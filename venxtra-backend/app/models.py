# Database models for VenXtra application using Beanie ODM
# These models define the structure of MongoDB collections

from beanie import Document as BeanieDocument
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
import secrets
import hashlib

# User model - represents registered users in the system
class User(BeanieDocument):
    # Basic user information
    username: str                              # Unique username for login
    email: str                                 # User's email address
    hashed_password: str                       # Bcrypt hashed password
    
    # Optional profile information
    name: Optional[str] = None                 # User's display name
    avatar_url: Optional[str] = None           # Profile picture URL
    
    # Account status and verification
    is_active: bool = True                     # Account active status
    is_verified: bool = False                  # Email verification status
    
    # Timestamp tracking
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None      # Last successful login
    
    # Password reset functionality
    password_reset_token: Optional[str] = None
    password_reset_expires: Optional[datetime] = None
    email_verification_token: Optional[str] = None
    
    # Security features
    failed_login_attempts: int = 0             # Failed login counter
    locked_until: Optional[datetime] = None    # Account lockout timestamp
    
    class Settings:
        name = "users"  # MongoDB collection name

# Refresh token model - manages JWT refresh tokens for secure authentication
class RefreshToken(BeanieDocument):
    user_id: str                               # Reference to User document
    token: str                                 # The refresh token string
    expires_at: datetime                       # Token expiration timestamp
    created_at: datetime = Field(default_factory=datetime.utcnow)
    revoked: bool = False                      # Token revocation status
    device_info: Optional[str] = None          # Device identifier for security
    ip_address: Optional[str] = None           # IP address for audit logging
    
    class Settings:
        name = "refresh_tokens"
        # Database indexes for query performance
        indexes = [
            [("token", 1)],        # Fast token lookup
            [("user_id", 1)],      # Find tokens by user
            [("expires_at", 1)]    # Cleanup expired tokens
        ]

# Project model - represents vendor comparison projects
class Project(BeanieDocument):
    name: str                                  # Project name/title
    description: Optional[str] = None          # Optional project description
    user_id: str                              # Owner of the project
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "projects"  # MongoDB collection name

# Vendor model - represents vendors within a project
class Vendor(BeanieDocument):
    name: str                                  # Vendor company name
    project_id: str                           # Parent project reference
    contact_info: Optional[Dict[str, str]] = None  # Contact details (email, phone, etc.)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "vendors"  # MongoDB collection name

# Structured data model - AI-extracted information from documents
class StructuredData(BaseModel):
    vendor_name: str = ""                     # Extracted vendor name
    document_type: str = ""                   # Type of document (proposal, contract, etc.)
    pricing: List[Dict[str, str]] = []        # Pricing information
    products_or_services: List[str] = []      # List of offered products/services
    delivery_terms: str = ""                  # Delivery conditions
    payment_terms: str = ""                   # Payment conditions
    special_clauses: str = ""                 # Special terms and conditions
    notes: str = ""                          # Additional notes

# Document model - represents uploaded and processed documents
class Document(BeanieDocument):
    project_id: str                           # Parent project reference
    vendor_id: str                            # Associated vendor reference
    filename: str                             # Original filename
    file_type: str                           # File extension (pdf, docx, etc.)
    file_hash: Optional[str] = None          # SHA-256 hash of file content for duplicate detection
    file_size: Optional[int] = None          # File size in bytes
    file_content: Optional[bytes] = None     # Original file content for download
    raw_text: str                            # Extracted text content
    structured_data: Optional[StructuredData] = None  # AI-processed structured information
    processing_status: str = "pending"        # Processing state: pending, processing, completed, failed
    error_message: Optional[str] = None       # Error details if processing failed
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None   # When processing completed
    
    class Settings:
        name = "documents"  # MongoDB collection name
        # Database indexes for query performance
        indexes = [
            [("vendor_id", 1)],                    # Find documents by vendor
            [("project_id", 1)],                   # Find documents by project
            [("file_hash", 1), ("vendor_id", 1)],  # Check for duplicates per vendor
            [("processing_status", 1)]             # Query by status
        ]