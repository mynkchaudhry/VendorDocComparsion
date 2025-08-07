from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models import Project, User
from app.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/projects", tags=["projects"])

class ProjectCreate(BaseModel):
    name: str
    description: str = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str = None
    user_id: str
    created_at: datetime
    updated_at: datetime

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user)
):
    new_project = Project(
        name=project.name,
        description=project.description,
        user_id=str(current_user.id)
    )
    await new_project.insert()
    
    return ProjectResponse(
        id=str(new_project.id),
        name=new_project.name,
        description=new_project.description,
        user_id=new_project.user_id,
        created_at=new_project.created_at,
        updated_at=new_project.updated_at
    )

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(current_user: User = Depends(get_current_user)):
    projects = await Project.find(Project.user_id == str(current_user.id)).to_list()
    return [
        ProjectResponse(
            id=str(p.id),
            name=p.name,
            description=p.description,
            user_id=p.user_id,
            created_at=p.created_at,
            updated_at=p.updated_at
        ) for p in projects
    ]

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
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
    
    return ProjectResponse(
        id=str(project.id),
        name=project.name,
        description=project.description,
        user_id=project.user_id,
        created_at=project.created_at,
        updated_at=project.updated_at
    )

@router.delete("/{project_id}")
async def delete_project(
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
    
    await project.delete()
    return {"message": "Project deleted successfully"}