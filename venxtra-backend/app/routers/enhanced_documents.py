from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks
from typing import List, Optional
from app.models import Document, Vendor, Project, User, StructuredData
from app.auth import get_current_user
from app.enhanced_parsers import extract_text_chunked, ProcessingProgress
from app.enhanced_groq_client import enhanced_groq_client
from app.task_manager import task_manager, background_task
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
import os
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/enhanced-documents", tags=["enhanced-documents"])

class DocumentResponse(BaseModel):
    id: str
    project_id: str
    vendor_id: str
    filename: str
    file_type: str
    processing_status: str
    structured_data: Optional[StructuredData] = None
    error_message: Optional[str] = None
    uploaded_at: datetime
    processed_at: Optional[datetime] = None
    task_id: Optional[str] = None  # For tracking background processing

class TaskProgressResponse(BaseModel):
    task_id: str
    status: str
    progress_percentage: float
    current_stage: str
    total_steps: int
    completed_steps: int
    error_message: Optional[str] = None
    estimated_duration: Optional[int] = None

@background_task("document_processing")
async def process_document_enhanced(task_id: str, document_id: str, user_id: str):
    """Enhanced document processing with chunking and progress tracking"""
    
    async def progress_callback(progress: ProcessingProgress):
        """Callback to update task progress"""
        await task_manager.update_task_progress(
            task_id,
            progress_percentage=(progress.processed_pages / max(progress.total_pages, 1)) * 50 +
                               (progress.processed_chunks / max(progress.total_chunks, 1)) * 50,
            current_stage=progress.current_stage,
            completed_steps=progress.processed_pages + progress.processed_chunks,
            total_steps=progress.total_pages + progress.total_chunks
        )
    
    try:
        logger.info(f"Starting enhanced processing for document {document_id}")
        
        document = await Document.find_one(Document.id == ObjectId(document_id))
        if not document:
            raise Exception(f"Document {document_id} not found")
        
        # Update document status
        document.processing_status = "processing"
        await document.save()
        
        await task_manager.update_task_progress(
            task_id,
            current_stage="Loading document content",
            completed_steps=1,
            total_steps=10
        )
        
        # Check if we have raw_text or need to re-extract
        if not document.raw_text:
            raise Exception("Document has no raw text - cannot process")
        
        # For large documents, we need to get the original file content and re-extract with chunking
        # For now, let's work with the existing raw_text and create artificial chunks
        text_length = len(document.raw_text)
        
        if text_length > 8000:  # Large document, use chunking
            logger.info(f"Large document detected ({text_length} chars), using chunked processing")
            
            # Create chunks from existing text (simplified chunking for backward compatibility)
            chunk_size = 6000
            overlap = 500
            chunks = []
            
            start = 0
            chunk_num = 0
            while start < text_length:
                end = min(start + chunk_size, text_length)
                chunk_text = document.raw_text[start:end]
                
                from app.enhanced_parsers import DocumentChunk
                chunk = DocumentChunk(
                    chunk_id=f"chunk_{chunk_num}",
                    page_range=f"chunk_{chunk_num}",
                    content=chunk_text,
                    word_count=len(chunk_text.split()),
                    metadata={'chunk_number': chunk_num}
                )
                chunks.append(chunk)
                
                start = end - overlap if end < text_length else end
                chunk_num += 1
            
            logger.info(f"Created {len(chunks)} chunks for processing")
            
            # Process chunks with AI
            await task_manager.update_task_progress(
                task_id,
                current_stage=f"Processing {len(chunks)} document chunks with AI",
                completed_steps=3,
                total_steps=10
            )
            
            structured_data = await enhanced_groq_client.extract_structured_data_from_chunks(
                chunks, progress_callback
            )
            
        else:
            # Small document, use traditional processing
            logger.info(f"Small document ({text_length} chars), using traditional processing")
            
            await task_manager.update_task_progress(
                task_id,
                current_stage="Processing document with AI",
                completed_steps=5,
                total_steps=10
            )
            
            structured_data = await enhanced_groq_client.extract_structured_data(document.raw_text)
        
        # Update document with results
        if structured_data:
            logger.info(f"Successfully extracted structured data for document {document_id}")
            document.structured_data = structured_data
            document.processing_status = "completed"
            
            await task_manager.update_task_progress(
                task_id,
                current_stage="Saving extracted data",
                completed_steps=9,
                total_steps=10
            )
        else:
            logger.warning(f"Failed to extract structured data for document {document_id}")
            document.processing_status = "failed"
            document.error_message = "Failed to extract structured data from document"
            
            await task_manager.update_task_progress(
                task_id,
                current_stage="Processing failed",
                completed_steps=5,
                total_steps=10
            )
        
        document.processed_at = datetime.utcnow()
        await document.save()
        
        # Final progress update
        await task_manager.update_task_progress(
            task_id,
            current_stage="Document processing completed",
            completed_steps=10,
            total_steps=10
        )
        
        logger.info(f"Finished enhanced processing for document {document_id}")
        
        return {
            'document_id': document_id,
            'status': document.processing_status,
            'has_structured_data': structured_data is not None
        }
        
    except Exception as e:
        logger.error(f"Error in enhanced document processing {document_id}: {str(e)}")
        
        # Update document status
        try:
            document = await Document.find_one(Document.id == ObjectId(document_id))
            if document:
                document.processing_status = "failed"
                document.error_message = str(e)
                document.processed_at = datetime.utcnow()
                await document.save()
        except Exception as save_error:
            logger.error(f"Failed to update document status: {save_error}")
        
        raise e

@router.post("/upload")
async def upload_document_enhanced(
    vendor_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Enhanced document upload with background processing"""
    try:
        # Validate vendor access (same as original)
        vendor = await Vendor.find_one(Vendor.id == ObjectId(vendor_id))
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        project = await Project.find_one(Project.id == ObjectId(vendor.project_id))
        if not project or project.user_id != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Validate file type
        allowed_extensions = ['.pdf', '.docx', '.doc', '.xlsx', '.xls']
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Check file size (increased limit for enhanced processing)
        max_size = 100 * 1024 * 1024  # 100MB for enhanced processing
        file_content = await file.read()
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {max_size // (1024*1024)}MB"
            )
        
        logger.info(f"Processing {file.filename} ({len(file_content)} bytes) with enhanced parser")
        
        # Extract text with progress callback
        progress_updates = []
        
        async def upload_progress_callback(progress: ProcessingProgress):
            progress_updates.append(progress)
            logger.info(f"Text extraction progress: {progress.current_stage}")
        
        # Extract text using enhanced parser
        try:
            if len(file_content) > 10 * 1024 * 1024:  # 10MB+ files use chunked extraction
                chunks = await extract_text_chunked(file_content, file_extension, upload_progress_callback)
                raw_text = "\n\n".join([chunk.content for chunk in chunks])
                logger.info(f"Extracted text from {len(chunks)} chunks, total length: {len(raw_text)}")
            else:
                # Use backward compatible extraction for smaller files
                from app.parsers import extract_text
                raw_text = await extract_text(file_content, file_extension)
                logger.info(f"Extracted text using traditional parser, length: {len(raw_text)}")
        except Exception as extraction_error:
            logger.error(f"Text extraction failed: {str(extraction_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to extract text from document: {str(extraction_error)}"
            )
        
        # Create document record
        new_document = Document(
            project_id=vendor.project_id,
            vendor_id=vendor_id,
            filename=file.filename,
            file_type=file_extension,
            raw_text=raw_text,
            processing_status="pending"
        )
        await new_document.insert()
        
        # Create background task for AI processing
        task_id = await task_manager.create_task(
            user_id=str(current_user.id),
            task_type="document_processing",
            task_data={
                'document_id': str(new_document.id),
                'filename': file.filename,
                'file_size': len(file_content),
                'vendor_id': vendor_id,
                'project_id': vendor.project_id
            }
        )
        
        # Start background processing
        asyncio.create_task(process_document_enhanced(
            task_id=task_id,
            document_id=str(new_document.id),
            user_id=str(current_user.id)
        ))
        
        return DocumentResponse(
            id=str(new_document.id),
            project_id=new_document.project_id,
            vendor_id=new_document.vendor_id,
            filename=new_document.filename,
            file_type=new_document.file_type,
            processing_status=new_document.processing_status,
            uploaded_at=new_document.uploaded_at,
            task_id=task_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.get("/task/{task_id}/progress")
async def get_task_progress(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get processing progress for a background task"""
    task_progress = await task_manager.get_task_progress(task_id)
    
    if not task_progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Verify user owns this task
    if task_progress.metadata and task_progress.metadata.get('user_id') != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return TaskProgressResponse(
        task_id=task_progress.task_id,
        status=task_progress.status.value,
        progress_percentage=task_progress.progress_percentage,
        current_stage=task_progress.current_stage,
        total_steps=task_progress.total_steps,
        completed_steps=task_progress.completed_steps,
        error_message=task_progress.error_message,
        estimated_duration=task_progress.estimated_duration
    )

@router.get("/tasks")
async def get_user_tasks(
    current_user: User = Depends(get_current_user)
):
    """Get all background tasks for the current user"""
    tasks = await task_manager.get_user_tasks(str(current_user.id))
    
    return [
        TaskProgressResponse(
            task_id=task.task_id,
            status=task.status.value,
            progress_percentage=task.progress_percentage,
            current_stage=task.current_stage,
            total_steps=task.total_steps,
            completed_steps=task.completed_steps,
            error_message=task.error_message,
            estimated_duration=task.estimated_duration
        ) for task in tasks
    ]

@router.post("/task/{task_id}/cancel")
async def cancel_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancel a background task"""
    task_progress = await task_manager.get_task_progress(task_id)
    
    if not task_progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Verify user owns this task
    if task_progress.metadata and task_progress.metadata.get('user_id') != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    await task_manager.cancel_task(task_id)
    
    return {"message": "Task cancelled successfully"}

# Include all the other endpoints from the original documents router
# (get_documents_by_vendor, get_document, get_all_documents, delete operations)
# These remain the same but return the enhanced DocumentResponse with task_id

@router.get("/vendor/{vendor_id}", response_model=List[DocumentResponse])
async def get_documents_by_vendor(
    vendor_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all documents for a vendor (same as original but with task_id)"""
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
            processing_status=d.processing_status,
            structured_data=d.structured_data,
            error_message=d.error_message,
            uploaded_at=d.uploaded_at,
            processed_at=d.processed_at,
            task_id=None  # Task ID not stored in document, would need separate tracking
        ) for d in documents
    ]