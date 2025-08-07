import psutil
import gc
import asyncio
from typing import Dict, Any, Optional
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
import weakref
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

@dataclass
class MemoryStats:
    """Memory usage statistics"""
    total_mb: float
    available_mb: float
    used_mb: float
    percent_used: float
    process_mb: float
    timestamp: datetime

@dataclass
class ProcessingLimits:
    """Dynamic processing limits based on memory"""
    max_chunk_size: int
    max_concurrent_tasks: int
    batch_size: int
    should_gc: bool

class MemoryManager:
    """Manages memory usage and prevents OOM during large document processing"""
    
    def __init__(self):
        self.process = psutil.Process()
        self._active_tasks: Dict[str, Any] = {}
        self._memory_cache = weakref.WeakValueDictionary()
        self._last_cleanup = datetime.utcnow()
        
    def get_memory_stats(self) -> MemoryStats:
        """Get current memory statistics"""
        memory = psutil.virtual_memory()
        process_memory = self.process.memory_info().rss / 1024 / 1024  # MB
        
        return MemoryStats(
            total_mb=memory.total / 1024 / 1024,
            available_mb=memory.available / 1024 / 1024,
            used_mb=memory.used / 1024 / 1024,
            percent_used=memory.percent,
            process_mb=process_memory,
            timestamp=datetime.utcnow()
        )
    
    def get_dynamic_limits(self) -> ProcessingLimits:
        """Get dynamic processing limits based on current memory usage"""
        stats = self.get_memory_stats()
        
        # Base limits
        max_chunk_size = 2000
        max_concurrent = 3
        batch_size = 10
        should_gc = False
        
        # Adjust based on memory pressure
        if stats.percent_used > 85:
            # High memory pressure - reduce limits
            max_chunk_size = 1000
            max_concurrent = 1
            batch_size = 5
            should_gc = True
            logger.warning(f"High memory usage ({stats.percent_used}%), reducing processing limits")
            
        elif stats.percent_used > 70:
            # Medium memory pressure - moderate limits
            max_chunk_size = 1500
            max_concurrent = 2
            batch_size = 7
            should_gc = True
            logger.info(f"Medium memory usage ({stats.percent_used}%), using moderate processing limits")
            
        elif stats.process_mb > 1000:  # Process using > 1GB
            # Process memory high - be conservative
            max_chunk_size = 1500
            max_concurrent = 2
            batch_size = 8
            should_gc = True
            logger.info(f"Process memory high ({stats.process_mb:.1f}MB), using conservative limits")
        
        return ProcessingLimits(
            max_chunk_size=max_chunk_size,
            max_concurrent_tasks=max_concurrent,
            batch_size=batch_size,
            should_gc=should_gc
        )
    
    async def cleanup_if_needed(self, force: bool = False) -> bool:
        """Perform memory cleanup if needed"""
        stats = self.get_memory_stats()
        now = datetime.utcnow()
        
        # Cleanup every 5 minutes or if memory is high
        should_cleanup = (
            force or 
            stats.percent_used > 75 or 
            stats.process_mb > 800 or
            (now - self._last_cleanup) > timedelta(minutes=5)
        )
        
        if should_cleanup:
            logger.info(f"Performing memory cleanup (usage: {stats.percent_used}%, process: {stats.process_mb:.1f}MB)")
            
            # Clear weak references that are no longer needed
            self._memory_cache.clear()
            
            # Force garbage collection
            collected = gc.collect()
            
            # Update cleanup time
            self._last_cleanup = now
            
            # Get stats after cleanup
            new_stats = self.get_memory_stats()
            saved_mb = stats.process_mb - new_stats.process_mb
            
            logger.info(f"Memory cleanup completed: collected {collected} objects, "
                       f"freed {saved_mb:.1f}MB, new usage: {new_stats.percent_used}%")
            
            return True
        
        return False
    
    @asynccontextmanager
    async def memory_managed_processing(self, task_id: str, estimated_memory_mb: float = 100):
        """Context manager for memory-managed processing"""
        initial_stats = self.get_memory_stats()
        
        # Check if we have enough memory
        if initial_stats.available_mb < estimated_memory_mb * 2:  # 2x safety margin
            logger.warning(f"Low memory available ({initial_stats.available_mb:.1f}MB) for task requiring {estimated_memory_mb:.1f}MB")
            await self.cleanup_if_needed(force=True)
        
        # Register task
        self._active_tasks[task_id] = {
            'start_time': datetime.utcnow(),
            'estimated_memory': estimated_memory_mb,
            'initial_memory': initial_stats.process_mb
        }
        
        try:
            yield self.get_dynamic_limits()
        finally:
            # Cleanup after task
            if task_id in self._active_tasks:
                task_info = self._active_tasks.pop(task_id)
                final_stats = self.get_memory_stats()
                
                memory_used = final_stats.process_mb - task_info['initial_memory']
                duration = datetime.utcnow() - task_info['start_time']
                
                logger.info(f"Task {task_id} completed: used {memory_used:.1f}MB over {duration.total_seconds():.1f}s")
                
                # Cleanup if memory usage was high
                if memory_used > 200:  # More than 200MB used
                    await self.cleanup_if_needed(force=True)
    
    def estimate_processing_memory(self, file_size_bytes: int, chunk_count: int) -> float:
        """Estimate memory usage for processing a document"""
        # Base memory per chunk (text + AI processing)
        base_memory_per_chunk = 50  # MB
        
        # File size factor (text extraction and storage)
        file_memory_factor = file_size_bytes / (1024 * 1024) * 1.5  # 1.5x file size
        
        # Concurrent processing overhead
        concurrent_overhead = chunk_count * 20  # 20MB per chunk for AI processing
        
        total_estimated = base_memory_per_chunk + file_memory_factor + concurrent_overhead
        
        # Cap at reasonable maximum
        return min(total_estimated, 2000)  # Max 2GB estimate
    
    async def monitor_memory_during_processing(self, task_id: str, 
                                             warning_threshold: float = 80,
                                             critical_threshold: float = 90) -> bool:
        """Monitor memory during processing and return if it's safe to continue"""
        stats = self.get_memory_stats()
        
        if stats.percent_used > critical_threshold:
            logger.error(f"Critical memory usage ({stats.percent_used}%) during task {task_id}")
            await self.cleanup_if_needed(force=True)
            
            # Check again after cleanup
            stats = self.get_memory_stats()
            if stats.percent_used > critical_threshold:
                logger.error(f"Memory still critical after cleanup, stopping task {task_id}")
                return False
        
        elif stats.percent_used > warning_threshold:
            logger.warning(f"High memory usage ({stats.percent_used}%) during task {task_id}")
            await self.cleanup_if_needed()
        
        return True
    
    def get_active_tasks_info(self) -> Dict[str, Any]:
        """Get information about currently active tasks"""
        current_time = datetime.utcnow()
        info = {}
        
        for task_id, task_info in self._active_tasks.items():
            duration = current_time - task_info['start_time']
            info[task_id] = {
                'duration_seconds': duration.total_seconds(),
                'estimated_memory_mb': task_info['estimated_memory'],
                'initial_memory_mb': task_info['initial_memory']
            }
        
        return info

# Global memory manager instance
memory_manager = MemoryManager()

# Decorator for memory-managed functions
def memory_managed(estimated_memory_mb: float = 100):
    """Decorator for memory-managed processing functions"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            task_id = kwargs.get('task_id', 'unknown')
            
            async with memory_manager.memory_managed_processing(task_id, estimated_memory_mb) as limits:
                # Update function with dynamic limits
                if 'processing_limits' not in kwargs:
                    kwargs['processing_limits'] = limits
                
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator