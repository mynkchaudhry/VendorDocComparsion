from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from app.models import User
from app.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: str
    username: str
    name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return UserProfileResponse(
        id=str(current_user.id),
        username=current_user.username,
        name=getattr(current_user, 'name', None),
        email=getattr(current_user, 'email', None),
        avatar_url=getattr(current_user, 'avatar_url', None),
        created_at=current_user.created_at
    )

@router.put("/me", response_model=UserProfileResponse)
async def update_current_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user)
):
    try:
        # Update user fields if provided
        if profile_data.name is not None:
            current_user.name = profile_data.name
        if profile_data.email is not None:
            current_user.email = profile_data.email
        if profile_data.avatar_url is not None:
            current_user.avatar_url = profile_data.avatar_url
        
        # Save the updated user
        await current_user.save()
        
        return UserProfileResponse(
            id=str(current_user.id),
            username=current_user.username,
            name=getattr(current_user, 'name', None),
            email=getattr(current_user, 'email', None),
            avatar_url=getattr(current_user, 'avatar_url', None),
            created_at=current_user.created_at
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )