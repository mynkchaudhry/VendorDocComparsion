import redis
import json
import asyncio
import uuid
from typing import Dict, Any, Optional, Callable, List
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass, asdict
from enum import Enum
from app.config import settings
import traceback

logger = logging.getLogger(__name__)

class TaskStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class TaskProgress:
    task_id: str
    status: TaskStatus
    progress_percentage: float
    current_stage: str
    total_steps: int
    completed_steps: int
    error_message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_duration: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class BackgroundTaskManager:
    """Manages background tasks with Redis for persistence and progress tracking"""
    
    def __init__(self):
        try:
            self.redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
            # Test connection
            self.redis_client.ping()
            logger.info("Connected to Redis successfully")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Using in-memory storage.")
            self.redis_client = None
            self._memory_store = {}
    
    def _get_task_key(self, task_id: str) -> str:
        return f"task:{task_id}"
    
    def _get_user_tasks_key(self, user_id: str) -> str:
        return f"user_tasks:{user_id}"
    
    async def create_task(self, user_id: str, task_type: str, 
                         task_data: Dict[str, Any]) -> str:
        """Create a new background task"""
        task_id = str(uuid.uuid4())
        
        task_progress = TaskProgress(
            task_id=task_id,
            status=TaskStatus.PENDING,
            progress_percentage=0.0,
            current_stage="Task created",
            total_steps=1,
            completed_steps=0,
            started_at=datetime.utcnow(),
            metadata={
                'user_id': user_id,
                'task_type': task_type,
                'created_at': datetime.utcnow().isoformat(),
                **task_data
            }
        )
        
        await self._save_task_progress(task_progress)
        await self._add_task_to_user_list(user_id, task_id)
        
        logger.info(f"Created task {task_id} for user {user_id}")
        return task_id
    
    async def _save_task_progress(self, progress: TaskProgress):
        """Save task progress to storage"""
        task_key = self._get_task_key(progress.task_id)
        
        # Convert dataclass to dict for JSON serialization
        progress_dict = asdict(progress)
        
        # Handle datetime serialization
        if progress_dict['started_at']:
            progress_dict['started_at'] = progress_dict['started_at'].isoformat()
        if progress_dict['completed_at']:
            progress_dict['completed_at'] = progress_dict['completed_at'].isoformat()
        
        # Convert enum to string
        progress_dict['status'] = progress_dict['status'].value
        
        if self.redis_client:
            try:
                self.redis_client.setex(
                    task_key, 
                    timedelta(hours=24).total_seconds(),  # Expire after 24 hours
                    json.dumps(progress_dict)
                )
            except Exception as e:
                logger.error(f"Failed to save task progress to Redis: {e}")
                # Fallback to memory
                self._memory_store[task_key] = progress_dict
        else:
            self._memory_store[task_key] = progress_dict
    
    async def _add_task_to_user_list(self, user_id: str, task_id: str):
        """Add task to user's task list"""
        user_tasks_key = self._get_user_tasks_key(user_id)
        
        if self.redis_client:
            try:
                self.redis_client.sadd(user_tasks_key, task_id)
                self.redis_client.expire(user_tasks_key, timedelta(hours=24).total_seconds())
            except Exception as e:
                logger.error(f"Failed to add task to user list in Redis: {e}")
        
    async def update_task_progress(self, task_id: str, 
                                 progress_percentage: Optional[float] = None,
                                 current_stage: Optional[str] = None,
                                 completed_steps: Optional[int] = None,
                                 total_steps: Optional[int] = None,
                                 metadata: Optional[Dict[str, Any]] = None):
        """Update task progress"""
        task_progress = await self.get_task_progress(task_id)
        if not task_progress:
            logger.warning(f"Task {task_id} not found for progress update")
            return
        
        # Update fields
        if progress_percentage is not None:
            task_progress.progress_percentage = progress_percentage
        if current_stage is not None:
            task_progress.current_stage = current_stage
        if completed_steps is not None:
            task_progress.completed_steps = completed_steps
        if total_steps is not None:
            task_progress.total_steps = total_steps
        if metadata is not None:
            if task_progress.metadata is None:
                task_progress.metadata = {}
            task_progress.metadata.update(metadata)
        
        # Auto-calculate progress if steps are provided
        if task_progress.total_steps > 0:
            task_progress.progress_percentage = (task_progress.completed_steps / task_progress.total_steps) * 100
        
        await self._save_task_progress(task_progress)
    
    async def complete_task(self, task_id: str, result: Optional[Dict[str, Any]] = None):
        """Mark task as completed"""
        task_progress = await self.get_task_progress(task_id)
        if not task_progress:
            return
        
        task_progress.status = TaskStatus.COMPLETED
        task_progress.progress_percentage = 100.0
        task_progress.current_stage = "Completed"
        task_progress.completed_steps = task_progress.total_steps
        task_progress.completed_at = datetime.utcnow()
        task_progress.result = result
        
        await self._save_task_progress(task_progress)
        logger.info(f"Task {task_id} completed successfully")
    
    async def fail_task(self, task_id: str, error_message: str):
        """Mark task as failed"""
        task_progress = await self.get_task_progress(task_id)
        if not task_progress:
            return
        
        task_progress.status = TaskStatus.FAILED
        task_progress.current_stage = "Failed"
        task_progress.error_message = error_message
        task_progress.completed_at = datetime.utcnow()
        
        await self._save_task_progress(task_progress)
        logger.error(f"Task {task_id} failed: {error_message}")
    
    async def start_task_processing(self, task_id: str):
        """Mark task as started processing"""
        task_progress = await self.get_task_progress(task_id)
        if not task_progress:
            return
        
        task_progress.status = TaskStatus.PROCESSING
        task_progress.current_stage = "Processing started"
        task_progress.started_at = datetime.utcnow()
        
        await self._save_task_progress(task_progress)
    
    async def get_task_progress(self, task_id: str) -> Optional[TaskProgress]:
        """Get current task progress"""
        task_key = self._get_task_key(task_id)
        
        progress_dict = None
        if self.redis_client:
            try:
                progress_json = self.redis_client.get(task_key)
                if progress_json:
                    progress_dict = json.loads(progress_json)
            except Exception as e:
                logger.error(f"Failed to get task progress from Redis: {e}")
        
        # Fallback to memory store
        if not progress_dict and hasattr(self, '_memory_store'):
            progress_dict = self._memory_store.get(task_key)
        
        if not progress_dict:
            return None
        
        # Convert back to proper types
        if progress_dict['started_at']:
            progress_dict['started_at'] = datetime.fromisoformat(progress_dict['started_at'])
        if progress_dict['completed_at']:
            progress_dict['completed_at'] = datetime.fromisoformat(progress_dict['completed_at'])
        
        progress_dict['status'] = TaskStatus(progress_dict['status'])
        
        return TaskProgress(**progress_dict)
    
    async def get_user_tasks(self, user_id: str) -> List[TaskProgress]:
        """Get all tasks for a user"""
        user_tasks_key = self._get_user_tasks_key(user_id)
        task_ids = []
        
        if self.redis_client:
            try:
                task_ids = list(self.redis_client.smembers(user_tasks_key))
            except Exception as e:
                logger.error(f"Failed to get user tasks from Redis: {e}")
        
        tasks = []
        for task_id in task_ids:
            task_progress = await self.get_task_progress(task_id)
            if task_progress:
                tasks.append(task_progress)
        
        # Sort by creation time (newest first)
        tasks.sort(key=lambda x: x.started_at or datetime.min, reverse=True)
        return tasks
    
    async def cancel_task(self, task_id: str):
        """Cancel a pending or processing task"""
        task_progress = await self.get_task_progress(task_id)
        if not task_progress:
            return
        
        if task_progress.status in [TaskStatus.PENDING, TaskStatus.PROCESSING]:
            task_progress.status = TaskStatus.CANCELLED
            task_progress.current_stage = "Cancelled"
            task_progress.completed_at = datetime.utcnow()
            
            await self._save_task_progress(task_progress)
            logger.info(f"Task {task_id} cancelled")

# Global task manager instance
task_manager = BackgroundTaskManager()

# Decorator for background task execution
def background_task(task_type: str):
    """Decorator to convert a function into a background task"""
    def decorator(func: Callable):
        async def wrapper(task_id: str, *args, **kwargs):
            try:
                await task_manager.start_task_processing(task_id)
                result = await func(task_id, *args, **kwargs)
                await task_manager.complete_task(task_id, result)
                return result
            except Exception as e:
                error_msg = f"Task {task_type} failed: {str(e)}\n{traceback.format_exc()}"
                await task_manager.fail_task(task_id, error_msg)
                raise
        
        wrapper.task_type = task_type
        return wrapper
    
    return decorator