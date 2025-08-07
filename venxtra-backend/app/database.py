# Database initialization module for VenXtra application
# Sets up MongoDB connection and Beanie ODM models

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models import Project, Vendor, Document, User, RefreshToken
from app.config import settings

async def init_db():
    """Initialize database connection and Beanie ODM models.
    
    This function:
    1. Creates MongoDB client connection
    2. Initializes Beanie ODM with all document models
    3. Sets up database indexes automatically
    """
    # Create async MongoDB client
    client = AsyncIOMotorClient(settings.mongodb_url)
    
    # Initialize Beanie ODM with all document models
    await init_beanie(
        database=client[settings.database_name], 
        document_models=[Project, Vendor, Document, User, RefreshToken]
    )