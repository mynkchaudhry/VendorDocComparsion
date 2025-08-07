from pydantic import BaseModel, validator, EmailStr, constr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import re
from fastapi import HTTPException, status

# Regex patterns for validation
USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{3,32}$")
SAFE_STRING_PATTERN = re.compile(r"^[a-zA-Z0-9\s\-_.,!?()]+$")
FILENAME_PATTERN = re.compile(r"^[a-zA-Z0-9\-_.() ]+\.[a-zA-Z0-9]+$")

class SanitizedStr(str):
    """String type that removes potentially dangerous characters"""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not isinstance(v, str):
            raise TypeError("string required")
        
        # Remove dangerous characters
        dangerous_chars = ["<", ">", "&", '"', "'", "/", "\\", "\0", "\n", "\r", "\t"]
        cleaned = v
        for char in dangerous_chars:
            cleaned = cleaned.replace(char, "")
        
        # Limit length
        if len(cleaned) > 1000:
            cleaned = cleaned[:1000]
        
        return cls(cleaned.strip())

class ValidatedUsername(str):
    """Username with strict validation"""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not isinstance(v, str):
            raise TypeError("string required")
        
        if not USERNAME_PATTERN.match(v):
            raise ValueError(
                "Username must be 3-32 characters long and contain only letters, numbers, underscores, and hyphens"
            )
        
        return cls(v)

class SecurePassword(str):
    """Password with strength validation"""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not isinstance(v, str):
            raise TypeError("string required")
        
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        if len(v) > 128:
            raise ValueError("Password must not exceed 128 characters")
        
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", v):
            raise ValueError("Password must contain at least one special character")
        
        return cls(v)

class ValidatedEmail(EmailStr):
    """Email with additional validation"""
    
    @classmethod
    def validate(cls, v):
        email = super().validate(v)
        
        # Additional checks
        if len(email) > 254:
            raise ValueError("Email address too long")
        
        # Check for suspicious patterns
        suspicious_patterns = ["<script", "javascript:", "onclick="]
        email_lower = email.lower()
        for pattern in suspicious_patterns:
            if pattern in email_lower:
                raise ValueError("Invalid email format")
        
        return email

# Request validators
class PaginationParams(BaseModel):
    """Standard pagination parameters"""
    page: int = Field(1, ge=1, le=1000)
    limit: int = Field(20, ge=1, le=100)
    
    @property
    def skip(self) -> int:
        return (self.page - 1) * self.limit

class SortParams(BaseModel):
    """Standard sorting parameters"""
    sort_by: Optional[str] = Field(None, pattern="^[a-zA-Z_]+$")
    sort_order: Optional[str] = Field("asc", pattern="^(asc|desc)$")

class SearchParams(BaseModel):
    """Standard search parameters"""
    q: Optional[SanitizedStr] = Field(None, min_length=1, max_length=100)
    fields: Optional[List[str]] = Field(None, max_items=10)
    
    @validator("fields")
    def validate_fields(cls, v):
        if v:
            allowed_fields = ["name", "description", "email", "username", "filename"]
            for field in v:
                if field not in allowed_fields:
                    raise ValueError(f"Invalid search field: {field}")
        return v

class FileUploadValidator:
    """File upload validation"""
    
    ALLOWED_EXTENSIONS = {
        "pdf": "application/pdf",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xls": "application/vnd.ms-excel",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
    
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    
    @classmethod
    def validate_file(cls, filename: str, content_type: str, file_size: int):
        """Validate uploaded file"""
        
        # Check filename - TEMPORARILY DISABLED
        # if not FILENAME_PATTERN.match(filename):
        #     raise HTTPException(
        #         status_code=status.HTTP_400_BAD_REQUEST,
        #         detail="Invalid filename format"
        #     )
        
        # Check extension
        extension = filename.split(".")[-1].lower()
        if extension not in cls.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed types: {', '.join(cls.ALLOWED_EXTENSIONS.keys())}"
            )
        
        # Check content type
        expected_content_type = cls.ALLOWED_EXTENSIONS[extension]
        if content_type != expected_content_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content type does not match extension"
            )
        
        # Check file size
        if file_size > cls.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {cls.MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        return True

# Model validators with enhanced security
class UserCreateSecure(BaseModel):
    username: ValidatedUsername
    email: ValidatedEmail
    password: SecurePassword
    name: Optional[SanitizedStr] = None

class ProjectCreateSecure(BaseModel):
    name: SanitizedStr = Field(..., min_length=1, max_length=100)
    description: Optional[SanitizedStr] = Field(None, max_length=500)

class VendorCreateSecure(BaseModel):
    name: SanitizedStr = Field(..., min_length=1, max_length=100)
    project_id: str = Field(..., pattern="^[a-f0-9]{24}$")  # MongoDB ObjectId
    contact_info: Optional[Dict[str, SanitizedStr]] = None
    
    @validator("contact_info")
    def validate_contact_info(cls, v):
        if v:
            allowed_keys = ["email", "phone", "address", "website", "contact_person"]
            for key in v.keys():
                if key not in allowed_keys:
                    raise ValueError(f"Invalid contact info field: {key}")
        return v

class ComparisonRequestSecure(BaseModel):
    vendor_ids: List[str] = Field(..., min_items=2, max_items=10)
    project_id: str = Field(..., pattern="^[a-f0-9]{24}$")
    
    @validator("vendor_ids")
    def validate_vendor_ids(cls, v):
        for vendor_id in v:
            if not re.match(r"^[a-f0-9]{24}$", vendor_id):
                raise ValueError(f"Invalid vendor ID format: {vendor_id}")
        return v

def sanitize_input(data: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize dictionary input recursively"""
    sanitized = {}
    
    for key, value in data.items():
        # Sanitize key
        safe_key = re.sub(r"[^a-zA-Z0-9_]", "", key)[:50]
        
        # Sanitize value
        if isinstance(value, str):
            # Remove dangerous characters
            safe_value = SanitizedStr.validate(value)
            sanitized[safe_key] = safe_value
        elif isinstance(value, dict):
            sanitized[safe_key] = sanitize_input(value)
        elif isinstance(value, list):
            sanitized[safe_key] = [
                sanitize_input(item) if isinstance(item, dict) 
                else SanitizedStr.validate(item) if isinstance(item, str)
                else item
                for item in value
            ]
        else:
            sanitized[safe_key] = value
    
    return sanitized