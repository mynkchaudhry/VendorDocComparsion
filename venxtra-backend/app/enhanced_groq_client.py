from groq import Groq
from app.config import settings
from app.models import StructuredData
from app.enhanced_parsers import DocumentChunk, ProcessingProgress
import json
import asyncio
from typing import Optional, List, Dict, Any
import logging
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import time

logger = logging.getLogger(__name__)

@dataclass
class ChunkAnalysis:
    """Analysis result for a single chunk"""
    chunk_id: str
    vendor_name: str
    document_type: str
    pricing: List[Dict[str, str]]
    products_or_services: List[str]
    delivery_terms: str
    payment_terms: str
    special_clauses: str
    notes: str
    confidence_score: float
    processing_time: float

class EnhancedGroqClient:
    """Enhanced Groq client with chunk-based processing and aggregation"""
    
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.executor = ThreadPoolExecutor(max_workers=3)  # Limit concurrent API calls
        
    def _get_chunk_prompt(self) -> str:
        """Get optimized prompt for chunk processing"""
        return """You are a document understanding AI that extracts structured vendor information from document chunks.
        This is a CHUNK of a larger document. Extract whatever information is available.
        
Extract the following information and return it as JSON:
- vendor_name: Name of the vendor/supplier (string, use "Unknown" if not found in this chunk)
- document_type: Type of document like quote, invoice, proposal, contract (string, use "Unknown" if not clear)
- pricing: Array of items with fields: item, quantity, unit_price, total_price (array, can be empty)
- products_or_services: List of products or services mentioned (array of strings, can be empty)
- delivery_terms: Delivery conditions mentioned in this chunk (string, use "" if none)
- payment_terms: Payment conditions mentioned in this chunk (string, use "" if none)
- special_clauses: Any special terms or clauses in this chunk (string, use "" if none)
- notes: Important information from this chunk (string, use "" if none)
- confidence_score: Your confidence in the extraction (0.0 to 1.0)

IMPORTANT: 
- This is only a CHUNK, not the complete document
- Extract only what's clearly present in this chunk
- Use empty strings/arrays for missing information
- Be conservative with vendor_name - only extract if clearly stated
- Return ONLY valid JSON without markdown formatting

Example format:
{
  "vendor_name": "Example Corp",
  "document_type": "quote",
  "pricing": [{"item": "Service A", "quantity": "1", "unit_price": "100", "total_price": "100"}],
  "products_or_services": ["Service A", "Service B"],
  "delivery_terms": "30 days",
  "payment_terms": "Net 30",
  "special_clauses": "Standard terms apply",
  "notes": "Additional notes here",
  "confidence_score": 0.85
}"""

    def _get_aggregation_prompt(self) -> str:
        """Get prompt for aggregating chunk results"""
        return """You are aggregating extracted information from multiple chunks of the same document.
        Combine and consolidate the information intelligently.
        
Rules for aggregation:
- vendor_name: Use the most confident/complete vendor name across chunks
- document_type: Use the most confident document type
- pricing: Combine all pricing items, remove duplicates
- products_or_services: Combine lists, remove duplicates
- delivery_terms: Combine into comprehensive terms
- payment_terms: Combine into comprehensive terms  
- special_clauses: Combine all clauses
- notes: Combine important notes

Return consolidated JSON in the same format.
IMPORTANT: Return ONLY valid JSON without markdown formatting."""

    async def _process_chunk(self, chunk: DocumentChunk) -> Optional[ChunkAnalysis]:
        """Process a single chunk with AI"""
        start_time = time.time()
        
        try:
            # Truncate chunk if too long (API limits)
            chunk_text = chunk.content[:6000]  # Leave room for prompt
            
            user_prompt = f"""Extract structured vendor information from this document chunk:

Chunk ID: {chunk.chunk_id}
Page/Section: {chunk.page_range}

Content:
{chunk_text}"""

            completion = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": self._get_chunk_prompt()},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                max_tokens=1500
            )
            
            response_text = completion.choices[0].message.content.strip()
            
            # Clean response
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            elif response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            structured_data = json.loads(response_text)
            
            processing_time = time.time() - start_time
            
            return ChunkAnalysis(
                chunk_id=chunk.chunk_id,
                vendor_name=structured_data.get('vendor_name', 'Unknown'),
                document_type=structured_data.get('document_type', 'Unknown'),
                pricing=structured_data.get('pricing', []),
                products_or_services=structured_data.get('products_or_services', []),
                delivery_terms=structured_data.get('delivery_terms', ''),
                payment_terms=structured_data.get('payment_terms', ''),
                special_clauses=structured_data.get('special_clauses', ''),
                notes=structured_data.get('notes', ''),
                confidence_score=structured_data.get('confidence_score', 0.5),
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error processing chunk {chunk.chunk_id}: {str(e)}")
            return None

    def _aggregate_chunk_results(self, chunk_analyses: List[ChunkAnalysis]) -> Dict[str, Any]:
        """Aggregate results from multiple chunks intelligently"""
        if not chunk_analyses:
            return {}
        
        # Find best vendor name (highest confidence, not "Unknown")
        vendor_names = [(ca.vendor_name, ca.confidence_score) for ca in chunk_analyses 
                       if ca.vendor_name and ca.vendor_name != "Unknown"]
        best_vendor = max(vendor_names, key=lambda x: x[1])[0] if vendor_names else "Unknown"
        
        # Find best document type
        doc_types = [(ca.document_type, ca.confidence_score) for ca in chunk_analyses 
                    if ca.document_type and ca.document_type != "Unknown"]
        best_doc_type = max(doc_types, key=lambda x: x[1])[0] if doc_types else "Unknown"
        
        # Aggregate pricing (remove duplicates based on item name)
        all_pricing = []
        seen_items = set()
        for ca in chunk_analyses:
            for price_item in ca.pricing:
                item_key = price_item.get('item', '').lower().strip()
                if item_key and item_key not in seen_items:
                    all_pricing.append(price_item)
                    seen_items.add(item_key)
        
        # Aggregate products/services (remove duplicates)
        all_products = set()
        for ca in chunk_analyses:
            for product in ca.products_or_services:
                if product and product.strip():
                    all_products.add(product.strip())
        
        # Combine text fields
        delivery_terms = []
        payment_terms = []
        special_clauses = []
        notes = []
        
        for ca in chunk_analyses:
            if ca.delivery_terms and ca.delivery_terms.strip():
                delivery_terms.append(ca.delivery_terms.strip())
            if ca.payment_terms and ca.payment_terms.strip():
                payment_terms.append(ca.payment_terms.strip())
            if ca.special_clauses and ca.special_clauses.strip():
                special_clauses.append(ca.special_clauses.strip())
            if ca.notes and ca.notes.strip():
                notes.append(ca.notes.strip())
        
        return {
            'vendor_name': best_vendor,
            'document_type': best_doc_type,
            'pricing': all_pricing,
            'products_or_services': list(all_products),
            'delivery_terms': ' | '.join(set(delivery_terms)) if delivery_terms else '',
            'payment_terms': ' | '.join(set(payment_terms)) if payment_terms else '',
            'special_clauses': ' | '.join(set(special_clauses)) if special_clauses else '',
            'notes': ' | '.join(set(notes)) if notes else ''
        }

    async def extract_structured_data_from_chunks(self, chunks: List[DocumentChunk], 
                                                progress_callback=None) -> Optional[StructuredData]:
        """Extract structured data from document chunks with progress tracking"""
        if not chunks:
            logger.warning("No chunks provided for processing")
            return None
        
        try:
            total_chunks = len(chunks)
            processed_chunks = 0
            chunk_analyses = []
            
            if progress_callback:
                await progress_callback(ProcessingProgress(
                    total_pages=1,
                    processed_pages=0,
                    total_chunks=total_chunks,
                    processed_chunks=0,
                    current_stage="Starting AI analysis of document chunks"
                ))
            
            # Process chunks in batches to avoid API rate limits
            batch_size = 3  # Process 3 chunks concurrently
            
            for i in range(0, total_chunks, batch_size):
                batch = chunks[i:i + batch_size]
                
                # Process batch concurrently
                tasks = [self._process_chunk(chunk) for chunk in batch]
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Collect successful results
                for result in batch_results:
                    if isinstance(result, ChunkAnalysis):
                        chunk_analyses.append(result)
                    elif isinstance(result, Exception):
                        logger.error(f"Chunk processing failed: {str(result)}")
                
                processed_chunks += len(batch)
                
                if progress_callback:
                    await progress_callback(ProcessingProgress(
                        total_pages=1,
                        processed_pages=0,
                        total_chunks=total_chunks,
                        processed_chunks=processed_chunks,
                        current_stage=f"Processed {processed_chunks}/{total_chunks} chunks"
                    ))
                
                # Small delay between batches to respect rate limits
                if i + batch_size < total_chunks:
                    await asyncio.sleep(1)
            
            if not chunk_analyses:
                logger.error("No chunks were successfully processed")
                return None
            
            # Aggregate results
            if progress_callback:
                await progress_callback(ProcessingProgress(
                    total_pages=1,
                    processed_pages=1,
                    total_chunks=total_chunks,
                    processed_chunks=processed_chunks,
                    current_stage="Aggregating results from all chunks"
                ))
            
            aggregated_data = self._aggregate_chunk_results(chunk_analyses)
            
            # Clean and validate aggregated data
            cleaned_data = {
                'vendor_name': aggregated_data.get('vendor_name', ''),
                'document_type': aggregated_data.get('document_type', ''),
                'pricing': aggregated_data.get('pricing', []),
                'products_or_services': aggregated_data.get('products_or_services', []),
                'delivery_terms': aggregated_data.get('delivery_terms', ''),
                'payment_terms': aggregated_data.get('payment_terms', ''),
                'special_clauses': aggregated_data.get('special_clauses', ''),
                'notes': aggregated_data.get('notes', '')
            }
            
            # Clean pricing data
            if cleaned_data['pricing']:
                cleaned_pricing = []
                for item in cleaned_data['pricing']:
                    if isinstance(item, dict):
                        clean_item = {}
                        for key, val in item.items():
                            clean_item[key] = str(val) if val is not None else ""
                        cleaned_pricing.append(clean_item)
                cleaned_data['pricing'] = cleaned_pricing
            
            logger.info(f"Successfully processed {len(chunks)} chunks into structured data")
            logger.info(f"Average confidence: {sum(ca.confidence_score for ca in chunk_analyses) / len(chunk_analyses):.2f}")
            
            return StructuredData(**cleaned_data)
            
        except Exception as e:
            logger.error(f"Error in chunk-based processing: {str(e)}")
            return None

    async def extract_structured_data(self, document_text: str) -> Optional[StructuredData]:
        """Legacy method for backward compatibility"""
        # For backward compatibility, process as single chunk
        from app.enhanced_parsers import DocumentChunk
        
        single_chunk = DocumentChunk(
            chunk_id="legacy_single",
            page_range="full_document",
            content=document_text[:8000],  # Truncate for API limits
            word_count=len(document_text.split()),
            metadata={'legacy_mode': True}
        )
        
        return await self.extract_structured_data_from_chunks([single_chunk])

# Create enhanced client instance
enhanced_groq_client = EnhancedGroqClient()