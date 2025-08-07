# Enhanced PDF Processing Migration Guide

## Overview
This document outlines the enhanced PDF processing system that handles large documents (200+ pages) efficiently with chunking, background processing, and progress tracking.

## New Components Added

### 1. Enhanced Parsers (`app/enhanced_parsers.py`)
- Implements chunked PDF processing for large documents
- Handles overlapping chunks to preserve context
- Progress tracking during text extraction
- Memory-efficient processing of large files

### 2. Enhanced Groq Client (`app/enhanced_groq_client.py`)
- Chunk-based AI processing with batching
- Intelligent aggregation of results from multiple chunks
- Rate limiting and error handling
- Backward compatibility with existing processing

### 3. Background Task Manager (`app/task_manager.py`)
- Redis-based task persistence and progress tracking
- Background task execution with decorators
- User-specific task management
- Task lifecycle management (pending → processing → completed/failed)

### 4. Memory Manager (`app/memory_manager.py`)
- Real-time memory monitoring and optimization
- Dynamic processing limits based on available memory
- Garbage collection and cleanup strategies
- Memory-managed processing contexts

### 5. Enhanced Documents Router (`app/routers/enhanced_documents.py`)
- New `/enhanced-documents` endpoints for large file processing
- Progress tracking endpoints for background tasks
- Enhanced upload handling with background processing
- Task cancellation and management

## Configuration Updates

### Settings Added to `config.py`:
```python
# Enhanced processing settings
max_chunk_size: int = 2000  # words per chunk
chunk_overlap: int = 200    # word overlap between chunks
max_concurrent_chunks: int = 3  # concurrent AI processing
processing_timeout: int = 1800  # 30 minutes for large documents

# Background task settings
task_retention_hours: int = 24  # how long to keep completed tasks
max_user_tasks: int = 10  # max concurrent tasks per user
```

### New Dependencies:
- `redis==5.0.1` - For task persistence and progress tracking
- `psutil==5.9.6` - For memory monitoring and management

## How It Works

### For Small Documents (< 10MB)
- Uses existing processing pipeline for backward compatibility
- Direct AI processing without chunking
- Immediate response

### For Large Documents (≥ 10MB)
1. **Upload Phase**: File is uploaded and text extracted with chunking
2. **Background Processing**: AI processing happens in background with progress tracking
3. **Chunked Analysis**: Document split into overlapping chunks
4. **Batch Processing**: Chunks processed in batches to respect API limits
5. **Result Aggregation**: Intelligent combination of chunk results
6. **Memory Management**: Dynamic limits based on system resources

## API Endpoints

### New Enhanced Endpoints:
- `POST /enhanced-documents/upload` - Upload with background processing
- `GET /enhanced-documents/task/{task_id}/progress` - Get processing progress
- `GET /enhanced-documents/tasks` - Get user's background tasks
- `POST /enhanced-documents/task/{task_id}/cancel` - Cancel background task
- `GET /enhanced-documents/vendor/{vendor_id}` - Get documents (with task info)

### Progress Tracking Response:
```json
{
  "task_id": "uuid",
  "status": "processing",
  "progress_percentage": 65.0,
  "current_stage": "Processing 5/8 document chunks",
  "total_steps": 10,
  "completed_steps": 6,
  "estimated_duration": 120
}
```

## Memory Management Features

### Dynamic Processing Limits:
- **Normal**: 2000 word chunks, 3 concurrent tasks
- **Medium Pressure**: 1500 word chunks, 2 concurrent tasks
- **High Pressure**: 1000 word chunks, 1 concurrent task

### Automatic Cleanup:
- Garbage collection when memory usage > 75%
- Cleanup every 5 minutes or on demand
- Memory monitoring during processing

## Background Task System

### Task States:
- `PENDING` - Task created, waiting to start
- `PROCESSING` - Currently being processed
- `COMPLETED` - Successfully finished
- `FAILED` - Processing failed with error
- `CANCELLED` - User cancelled the task

### Redis Storage:
- Task progress stored with 24-hour expiration
- User task lists managed automatically
- Fallback to in-memory storage if Redis unavailable

## Testing the System

1. **Start Redis** (if not running):
   ```bash
   redis-server
   ```

2. **Start the API**:
   ```bash
   cd venxtra-backend
   ./venv/bin/python start.py
   ```

3. **Test with Large PDF**:
   ```bash
   # Upload a large PDF (>10MB)
   curl -X POST "http://localhost:8000/enhanced-documents/upload" \
        -H "Authorization: Bearer YOUR_TOKEN" \
        -F "vendor_id=VENDOR_ID" \
        -F "file=@large_document.pdf"
   
   # Track progress
   curl "http://localhost:8000/enhanced-documents/task/TASK_ID/progress" \
        -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Benefits

1. **Scalability**: Can handle very large documents (200+ pages)
2. **Performance**: Background processing doesn't block the UI
3. **Memory Efficiency**: Dynamic limits prevent OOM errors
4. **User Experience**: Progress tracking shows processing status
5. **Reliability**: Redis persistence survives server restarts
6. **Compatibility**: Backward compatible with existing processing

## Migration Steps

1. ✅ Install new dependencies (`redis`, `psutil`)
2. ✅ Update `main.py` to include enhanced router
3. ✅ Configure Redis connection in `.env`
4. 🔄 Test with sample large documents
5. 🔄 Update frontend to use enhanced endpoints for large files

## Environment Variables

Add to `.env`:
```env
REDIS_URL=redis://localhost:6379
```

## Next Steps

1. Test the enhanced processing system with actual large PDFs
2. Update frontend to show progress indicators for background tasks
3. Consider adding email notifications for completed tasks
4. Monitor system performance and adjust limits as needed