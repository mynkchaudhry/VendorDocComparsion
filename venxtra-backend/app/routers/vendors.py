from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Optional
from app.models import Vendor, Project, User
from app.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/vendors", tags=["vendors"])

class VendorCreate(BaseModel):
    name: str
    project_id: str
    contact_info: Optional[Dict[str, str]] = None

class VendorResponse(BaseModel):
    id: str
    name: str
    project_id: str
    contact_info: Optional[Dict[str, str]] = None
    created_at: datetime

@router.post("/", response_model=VendorResponse)
async def create_vendor(
    vendor: VendorCreate,
    current_user: User = Depends(get_current_user)
):
    try:
        project = await Project.find_one(Project.id == ObjectId(vendor.project_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid project ID"
        )
    
    if not project or project.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    new_vendor = Vendor(
        name=vendor.name,
        project_id=vendor.project_id,
        contact_info=vendor.contact_info
    )
    await new_vendor.insert()
    
    return VendorResponse(
        id=str(new_vendor.id),
        name=new_vendor.name,
        project_id=new_vendor.project_id,
        contact_info=new_vendor.contact_info,
        created_at=new_vendor.created_at
    )

@router.get("/project/{project_id}", response_model=List[VendorResponse])
async def get_vendors_by_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        project = await Project.find_one(Project.id == ObjectId(project_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid project ID"
        )
        
    if not project or project.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    vendors = await Vendor.find(Vendor.project_id == project_id).to_list()
    return [
        VendorResponse(
            id=str(v.id),
            name=v.name,
            project_id=v.project_id,
            contact_info=v.contact_info,
            created_at=v.created_at
        ) for v in vendors
    ]

@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        vendor = await Vendor.find_one(Vendor.id == ObjectId(vendor_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid vendor ID"
        )
        
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )
    
    try:
        project = await Project.find_one(Project.id == ObjectId(vendor.project_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid project ID"
        )
    if not project or project.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return VendorResponse(
        id=str(vendor.id),
        name=vendor.name,
        project_id=vendor.project_id,
        contact_info=vendor.contact_info,
        created_at=vendor.created_at
    )

@router.delete("/{vendor_id}")
async def delete_vendor(
    vendor_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        vendor = await Vendor.find_one(Vendor.id == ObjectId(vendor_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid vendor ID"
        )
        
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )
    
    try:
        project = await Project.find_one(Project.id == ObjectId(vendor.project_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid project ID"
        )
    if not project or project.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    await vendor.delete()
    return {"message": "Vendor deleted successfully"}

@router.get("/", response_model=List[VendorResponse])
async def get_all_vendors(
    current_user: User = Depends(get_current_user)
):
    vendors = await Vendor.find().to_list()
    # Filter vendors by user's projects
    user_projects = [str(p.id) for p in await Project.find(Project.user_id == str(current_user.id)).to_list()]
    user_vendors = [v for v in vendors if v.project_id in user_projects]
    
    return [
        VendorResponse(
            id=str(v.id),
            name=v.name,
            project_id=v.project_id,
            contact_info=v.contact_info,
            created_at=v.created_at
        ) for v in user_vendors
    ]

@router.delete("/")
async def delete_all_vendors(
    current_user: User = Depends(get_current_user)
):
    # Get all user's projects
    user_projects = await Project.find(Project.user_id == str(current_user.id)).to_list()
    user_project_ids = [str(p.id) for p in user_projects]
    
    # Delete all vendors belonging to user's projects
    deleted_count = 0
    for project_id in user_project_ids:
        vendors = await Vendor.find(Vendor.project_id == project_id).to_list()
        for vendor in vendors:
            await vendor.delete()
            deleted_count += 1
    
    return {"message": f"Deleted {deleted_count} vendors successfully"}