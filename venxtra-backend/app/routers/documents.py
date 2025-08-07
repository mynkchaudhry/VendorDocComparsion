from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks, Response
from fastapi.responses import StreamingResponse
from typing import List, Optional
from app.models import Document, Vendor, Project, User, StructuredData
from app.auth import get_current_user
from app.parsers import extract_text
from app.groq_client import groq_client
from app.document_processor import document_processor
from app.file_security import secure_file_upload
from app.validators import FileUploadValidator
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
import os
import hashlib
import io

router = APIRouter(prefix="/documents", tags=["documents"])

class DocumentResponse(BaseModel):
    id: str
    project_id: str
    vendor_id: str
    filename: str
    file_type: str
    file_hash: Optional[str] = None
    file_size: Optional[int] = None
    processing_status: str
    structured_data: Optional[StructuredData] = None
    error_message: Optional[str] = None
    uploaded_at: datetime
    processed_at: Optional[datetime] = None

class DocumentPreviewResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    raw_text: str
    file_size: Optional[int] = None

async def process_document(document_id: str):
    try:
        print(f"Starting processing for document {document_id}")
        document = await Document.find_one(Document.id == ObjectId(document_id))
        if not document:
            print(f"Document {document_id} not found")
            return
        
        print(f"Setting document {document_id} status to processing")
        document.processing_status = "processing"
        await document.save()
        
        print(f"Extracting structured data for document {document_id}")
        structured_data = await groq_client.extract_structured_data(document.raw_text)
        
        if structured_data:
            print(f"Successfully extracted data for document {document_id}")
            document.structured_data = structured_data
            document.processing_status = "completed"
        else:
            print(f"Failed to extract data for document {document_id}")
            document.processing_status = "failed"
            document.error_message = "Failed to extract structured data"
            
        document.processed_at = datetime.utcnow()
        await document.save()
        print(f"Finished processing document {document_id}")
        
    except Exception as e:
        print(f"Error processing document {document_id}: {str(e)}")
        document = await Document.find_one(Document.id == ObjectId(document_id))
        if document:
            document.processing_status = "failed"
            document.error_message = str(e)
            await document.save()

@router.post("/upload")
async def upload_document(
    vendor_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a document to a vendor with duplicate detection.
    
    - Prevents uploading the same document to the same vendor
    - Allows uploading the same document to different vendors
    """
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
    
    # Validate file type and size
    try:
        file_content = await file.read()
        file_size = len(file_content)
        FileUploadValidator.validate_file(
            filename=file.filename,
            content_type=file.content_type,
            file_size=file_size
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File validation failed: {str(e)}"
        )
    
    # Generate file hash for duplicate detection
    file_hash = hashlib.sha256(file_content).hexdigest()
    
    # Check if this exact file is already uploaded for this vendor (only for files with hashes)
    existing_document = await Document.find_one(
        Document.vendor_id == vendor_id,
        Document.file_hash == file_hash
    )
    
    if existing_document:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document '{existing_document.filename}' already exists for this vendor. Same document cannot be uploaded twice to the same vendor."
        )
    
    # Security scan
    is_safe, scan_results, _ = await secure_file_upload(
        file_content=file_content,
        filename=file.filename,
        content_type=file.content_type,
        user_id=str(current_user.id)
    )
    
    if not is_safe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File failed security scan: {scan_results.get('checks', {})}"
        )
    
    # Extract text from validated file
    file_extension = os.path.splitext(file.filename)[1].lower()
    try:
        raw_text = await extract_text(file_content, file_extension)
        
        new_document = Document(
            project_id=vendor.project_id,
            vendor_id=vendor_id,
            filename=scan_results["sanitized_filename"],
            file_type=file_extension,
            file_hash=file_hash,
            file_size=file_size,
            file_content=file_content,
            raw_text=raw_text,
            processing_status="pending"
        )
        await new_document.insert()
        
        # Use enhanced document processor
        background_tasks.add_task(document_processor.process_document, str(new_document.id))
        
        return DocumentResponse(
            id=str(new_document.id),
            project_id=new_document.project_id,
            vendor_id=new_document.vendor_id,
            filename=new_document.filename,
            file_type=new_document.file_type,
            file_hash=new_document.file_hash,
            file_size=new_document.file_size,
            processing_status=new_document.processing_status,
            uploaded_at=new_document.uploaded_at
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )

@router.get("/vendor/{vendor_id}", response_model=List[DocumentResponse])
async def get_documents_by_vendor(
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
    
    documents = await Document.find(Document.vendor_id == vendor_id).to_list()
    return [
        DocumentResponse(
            id=str(d.id),
            project_id=d.project_id,
            vendor_id=d.vendor_id,
            filename=d.filename,
            file_type=d.file_type,
            file_hash=d.file_hash,
            file_size=d.file_size,
            processing_status=d.processing_status,
            structured_data=d.structured_data,
            error_message=d.error_message,
            uploaded_at=d.uploaded_at,
            processed_at=d.processed_at
        ) for d in documents
    ]

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        document = await Document.find_one(Document.id == ObjectId(document_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid document ID"
        )
        
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    try:
        project = await Project.find_one(Project.id == ObjectId(document.project_id))
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
    
    return DocumentResponse(
        id=str(document.id),
        project_id=document.project_id,
        vendor_id=document.vendor_id,
        filename=document.filename,
        file_type=document.file_type,
        file_hash=document.file_hash,
        file_size=document.file_size,
        processing_status=document.processing_status,
        structured_data=document.structured_data,
        error_message=document.error_message,
        uploaded_at=document.uploaded_at,
        processed_at=document.processed_at
    )

@router.get("/", response_model=List[DocumentResponse])
async def get_all_documents(
    current_user: User = Depends(get_current_user)
):
    # Get all user's projects
    user_projects = await Project.find(Project.user_id == str(current_user.id)).to_list()
    user_project_ids = [str(p.id) for p in user_projects]
    
    # Find all documents belonging to user's projects
    all_documents = []
    for project_id in user_project_ids:
        documents = await Document.find(Document.project_id == project_id).to_list()
        all_documents.extend(documents)
    
    return [
        DocumentResponse(
            id=str(d.id),
            project_id=d.project_id,
            vendor_id=d.vendor_id,
            filename=d.filename,
            file_type=d.file_type,
            file_hash=d.file_hash,
            file_size=d.file_size,
            processing_status=d.processing_status,
            structured_data=d.structured_data,
            error_message=d.error_message,
            uploaded_at=d.uploaded_at,
            processed_at=d.processed_at
        ) for d in all_documents
    ]

@router.delete("/")
async def delete_all_documents(
    current_user: User = Depends(get_current_user)
):
    # Get all user's projects
    user_projects = await Project.find(Project.user_id == str(current_user.id)).to_list()
    user_project_ids = [str(p.id) for p in user_projects]
    
    # Delete all documents belonging to user's projects
    deleted_count = 0
    for project_id in user_project_ids:
        documents = await Document.find(Document.project_id == project_id).to_list()
        for document in documents:
            await document.delete()
            deleted_count += 1
    
    return {"message": f"Deleted {deleted_count} documents successfully"}

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        document = await Document.find_one(Document.id == ObjectId(document_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid document ID"
        )
        
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    try:
        project = await Project.find_one(Project.id == ObjectId(document.project_id))
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
    
    await document.delete()
    return {"message": "Document deleted successfully"}

@router.get("/{document_id}/preview", response_model=DocumentPreviewResponse)
async def preview_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get document content for preview with text content."""
    try:
        document = await Document.find_one(Document.id == ObjectId(document_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid document ID"
        )
        
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    try:
        project = await Project.find_one(Project.id == ObjectId(document.project_id))
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
    
    return DocumentPreviewResponse(
        id=str(document.id),
        filename=document.filename,
        file_type=document.file_type,
        raw_text=document.raw_text,
        file_size=document.file_size
    )

@router.get("/{document_id}/duplicates")
async def check_document_duplicates(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Check if this document exists in other vendors within the same project."""
    try:
        document = await Document.find_one(Document.id == ObjectId(document_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid document ID"
        )
        
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    try:
        project = await Project.find_one(Project.id == ObjectId(document.project_id))
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
    
    # Find all documents with the same hash in the same project (only if document has a hash)
    duplicate_documents = []
    if document.file_hash:
        duplicate_documents = await Document.find(
            Document.project_id == document.project_id,
            Document.file_hash == document.file_hash,
            Document.id != ObjectId(document_id)
        ).to_list()
    
    # Get vendor information for duplicates
    duplicates_info = []
    for dup_doc in duplicate_documents:
        try:
            vendor = await Vendor.find_one(Vendor.id == ObjectId(dup_doc.vendor_id))
            if vendor:
                duplicates_info.append({
                    "document_id": str(dup_doc.id),
                    "vendor_id": str(vendor.id),
                    "vendor_name": vendor.name,
                    "filename": dup_doc.filename,
                    "uploaded_at": dup_doc.uploaded_at
                })
        except:
            continue
    
    return {
        "has_duplicates": len(duplicates_info) > 0,
        "duplicate_count": len(duplicates_info),
        "duplicates": duplicates_info
    }

@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Download the original document file."""
    try:
        document = await Document.find_one(Document.id == ObjectId(document_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid document ID"
        )
        
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    try:
        project = await Project.find_one(Project.id == ObjectId(document.project_id))
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
    
    if not document.file_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original file content not available"
        )
    
    # Determine content type based on file extension
    content_type_map = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xls': 'application/vnd.ms-excel'
    }
    
    content_type = content_type_map.get(document.file_type, 'application/octet-stream')
    
    return StreamingResponse(
        io.BytesIO(document.file_content),
        media_type=content_type,
        headers={
            "Content-Disposition": f"attachment; filename={document.filename}",
            "Content-Length": str(len(document.file_content))
        }
    )