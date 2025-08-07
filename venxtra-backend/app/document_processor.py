import asyncio
from typing import List, Dict, Optional, Tuple
from app.models import Document, StructuredData
from app.config import settings
from app.groq_client import groq_client
import logging
from datetime import datetime
import json
from bson import ObjectId

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Enhanced document processor with chunking, retry logic, and better error handling"""
    
    def __init__(self):
        self.max_chunk_size = settings.max_chunk_size
        self.chunk_overlap = settings.chunk_overlap
        self.max_retries = 3
        self.retry_delay = 2  # seconds
        
    def split_into_chunks(self, text: str) -> List[str]:
        """Split document into overlapping chunks for processing"""
        words = text.split()
        chunks = []
        
        if len(words) <= self.max_chunk_size:
            return [text]
        
        start = 0
        while start < len(words):
            end = start + self.max_chunk_size
            chunk = ' '.join(words[start:end])
            chunks.append(chunk)
            
            # Move start position with overlap
            start = end - self.chunk_overlap
            
        logger.info(f"Split document into {len(chunks)} chunks")
        return chunks
    
    async def process_chunk_with_retry(self, chunk: str, chunk_index: int, total_chunks: int) -> Optional[Dict]:
        """Process a single chunk with retry logic"""
        for attempt in range(self.max_retries):
            try:
                # Enhanced prompt with chunk context
                enhanced_prompt = f"""
                You are processing chunk {chunk_index + 1} of {total_chunks} from a vendor document.
                Extract relevant vendor information from this chunk.
                If this chunk contains partial information, extract what you can.
                
                Document chunk:
                {chunk}
                """
                
                result = await groq_client.extract_structured_data(enhanced_prompt)
                if result:
                    return result.dict()
                    
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed for chunk {chunk_index}: {str(e)}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay * (attempt + 1))
                else:
                    logger.error(f"All retries failed for chunk {chunk_index}")
                    
        return None
    
    def merge_chunk_results(self, chunk_results: List[Dict]) -> StructuredData:
        """Merge results from multiple chunks into a single structured data object"""
        merged = {
            'vendor_name': '',
            'document_type': '',
            'pricing': [],
            'products_or_services': [],
            'delivery_terms': '',
            'payment_terms': '',
            'special_clauses': '',
            'notes': ''
        }
        
        # Collect all unique values
        all_products = set()
        all_pricing = []
        delivery_terms_list = []
        payment_terms_list = []
        special_clauses_list = []
        notes_list = []
        
        for result in chunk_results:
            if not result:
                continue
                
            # Vendor name - use the most common non-empty value
            if result.get('vendor_name') and not merged['vendor_name']:
                merged['vendor_name'] = result['vendor_name']
                
            # Document type - use the first non-empty value
            if result.get('document_type') and not merged['document_type']:
                merged['document_type'] = result['document_type']
                
            # Collect pricing items
            if result.get('pricing'):
                all_pricing.extend(result['pricing'])
                
            # Collect unique products/services
            if result.get('products_or_services'):
                all_products.update(result['products_or_services'])
                
            # Collect terms and clauses
            if result.get('delivery_terms'):
                delivery_terms_list.append(result['delivery_terms'])
            if result.get('payment_terms'):
                payment_terms_list.append(result['payment_terms'])
            if result.get('special_clauses'):
                special_clauses_list.append(result['special_clauses'])
            if result.get('notes'):
                notes_list.append(result['notes'])
        
        # Merge collected data
        merged['pricing'] = self._deduplicate_pricing(all_pricing)
        merged['products_or_services'] = list(all_products)
        merged['delivery_terms'] = ' | '.join(filter(None, delivery_terms_list))
        merged['payment_terms'] = ' | '.join(filter(None, payment_terms_list))
        merged['special_clauses'] = ' | '.join(filter(None, special_clauses_list))
        merged['notes'] = ' | '.join(filter(None, notes_list))
        
        return StructuredData(**merged)
    
    def _deduplicate_pricing(self, pricing_items: List[Dict]) -> List[Dict]:
        """Remove duplicate pricing items based on item name and price"""
        seen = set()
        unique_items = []
        
        for item in pricing_items:
            key = (item.get('item', ''), item.get('total_price', ''))
            if key not in seen and key[0]:  # Ensure item name is not empty
                seen.add(key)
                unique_items.append(item)
                
        return unique_items
    
    async def process_document(self, document_id: str):
        """Process a document with enhanced chunking and retry logic"""
        try:
            logger.info(f"Starting enhanced processing for document {document_id}")
            
            # Fetch document
            document = await Document.find_one(Document.id == ObjectId(document_id))
            if not document:
                logger.error(f"Document {document_id} not found")
                return
            
            # Update status
            document.processing_status = "processing"
            await document.save()
            
            # Split into chunks
            chunks = self.split_into_chunks(document.raw_text)
            
            # Process chunks concurrently with limited concurrency
            chunk_results = []
            semaphore = asyncio.Semaphore(settings.max_concurrent_chunks)
            
            async def process_with_semaphore(chunk, index):
                async with semaphore:
                    return await self.process_chunk_with_retry(chunk, index, len(chunks))
            
            tasks = [
                process_with_semaphore(chunk, i) 
                for i, chunk in enumerate(chunks)
            ]
            
            chunk_results = await asyncio.gather(*tasks)
            
            # Filter out None results (failed chunks)
            valid_results = [r for r in chunk_results if r is not None]
            
            if not valid_results:
                raise Exception("All chunks failed to process")
            
            logger.info(f"Successfully processed {len(valid_results)} out of {len(chunks)} chunks")
            
            # Merge results
            structured_data = self.merge_chunk_results(valid_results)
            
            # Update document
            document.structured_data = structured_data
            document.processing_status = "completed"
            document.processed_at = datetime.utcnow()
            await document.save()
            
            logger.info(f"Successfully completed processing for document {document_id}")
            
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}")
            
            # Update document with error
            try:
                document = await Document.find_one(Document.id == ObjectId(document_id))
                if document:
                    document.processing_status = "failed"
                    document.error_message = str(e)
                    await document.save()
            except Exception as save_error:
                logger.error(f"Failed to save error status: {str(save_error)}")

# Create singleton instance
document_processor = DocumentProcessor()