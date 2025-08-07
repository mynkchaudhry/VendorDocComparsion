"""
Dynamic Field Extractor
Automatically identifies relevant information from documents and creates dynamic key-value tables
No static fields - everything is determined by LLM analysis
"""

import json
import asyncio
import time
import logging
from typing import Dict, List, Any, Optional, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
from concurrent.futures import ThreadPoolExecutor

from groq import Groq
from app.config import settings
from app.enhanced_parsers_v2 import DocumentChunk, ProcessingProgress, ProcessingStatus

logger = logging.getLogger(__name__)

class DocumentCategory(Enum):
    """Auto-detected document categories"""
    FINANCIAL = "financial"
    LEGAL = "legal"
    TECHNICAL = "technical"
    BUSINESS = "business"
    MEDICAL = "medical"
    EDUCATIONAL = "educational"
    GOVERNMENT = "government"
    PERSONAL = "personal"
    UNKNOWN = "unknown"

@dataclass
class DynamicField:
    """Represents a dynamically discovered field"""
    key: str
    value: Union[str, int, float, List[str], Dict[str, Any]]
    confidence: float
    data_type: str  # 'text', 'number', 'date', 'list', 'table', 'boolean'
    category: str   # semantic category like 'identification', 'financial', 'contact'
    source_chunk_ids: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class DynamicTable:
    """Represents a dynamically created table"""
    title: str
    headers: List[str]
    rows: List[List[str]]
    category: str
    confidence: float
    source_chunk_ids: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class DynamicExtractionResult:
    """Complete result of dynamic extraction"""
    document_category: DocumentCategory
    confidence: float
    fields: List[DynamicField]
    tables: List[DynamicTable]
    key_insights: List[str]
    processing_metrics: Dict[str, Any]
    raw_llm_responses: List[Dict[str, Any]] = field(default_factory=list)

class DynamicFieldExtractor:
    """LLM-powered dynamic field extraction system"""
    
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.executor = ThreadPoolExecutor(max_workers=3)
        
    def _get_document_analysis_prompt(self) -> str:
        """Get prompt for initial document analysis and categorization"""
        return """You are an advanced document analysis AI. Your task is to analyze document content and identify what type of document it is and what kind of information should be extracted.

Analyze the document content and return a JSON response with:

1. document_category: One of [financial, legal, technical, business, medical, educational, government, personal, unknown]
2. document_subcategory: More specific type (e.g., "invoice", "contract", "manual", "report", etc.)
3. confidence: Your confidence in the categorization (0.0 to 1.0)
4. suggested_fields: List of field names that would be relevant for this document type
5. suggested_tables: List of table types that might be present
6. key_patterns: Important patterns or structures you notice
7. extraction_strategy: Brief description of how to extract information from this document type

Be creative and adaptive - don't limit yourself to predefined fields. Think about what information would be most valuable to extract from this type of document.

Example response:
{
  "document_category": "financial",
  "document_subcategory": "invoice",
  "confidence": 0.9,
  "suggested_fields": ["invoice_number", "vendor_name", "total_amount", "due_date", "billing_address"],
  "suggested_tables": ["line_items", "tax_breakdown"],
  "key_patterns": ["Currency amounts", "Date formats", "Item descriptions"],
  "extraction_strategy": "Focus on structured financial data, line items, and payment terms"
}

Return ONLY the JSON response without any markdown formatting."""

    def _get_field_extraction_prompt(self, analysis_result: Dict[str, Any]) -> str:
        """Get prompt for extracting specific fields based on document analysis"""
        return f"""You are extracting structured information from a document chunk. Based on the document analysis, this appears to be a {analysis_result.get('document_subcategory', 'document')} in the {analysis_result.get('document_category', 'unknown')} category.

Your task is to extract ALL relevant information as key-value pairs. Be comprehensive and dynamic - extract any meaningful information you find, not just predefined fields.

Guidelines:
- Extract factual information with clear key-value relationships
- Create logical groupings (e.g., contact_info, financial_data, dates, etc.)
- Use descriptive, human-readable keys
- Determine appropriate data types (text, number, date, list, boolean)
- Assign confidence scores for each extracted field
- Identify relationships between fields

Focus on these types of information:
{', '.join(analysis_result.get('suggested_fields', []))}

Return JSON in this format:
{{
  "extracted_fields": [
    {{
      "key": "field_name",
      "value": "field_value",
      "data_type": "text|number|date|list|boolean|table",
      "category": "identification|financial|contact|technical|legal|other",
      "confidence": 0.85,
      "notes": "Additional context about this field"
    }}
  ],
  "relationships": [
    {{
      "field1": "key_name_1", 
      "field2": "key_name_2", 
      "relationship": "description of relationship"
    }}
  ],
  "patterns_found": ["pattern1", "pattern2"]
}}

Be thorough and extract everything meaningful from this chunk. Return ONLY valid JSON."""

    def _get_table_extraction_prompt(self, analysis_result: Dict[str, Any]) -> str:
        """Get prompt for extracting dynamic tables"""
        return f"""You are identifying and extracting tabular data from a document chunk. This document is categorized as: {analysis_result.get('document_subcategory', 'document')}.

Your task is to find and extract ANY tabular or structured data, not just traditional tables. Look for:
- Traditional tables with rows and columns
- Lists with consistent structure
- Financial line items
- Specifications or parameters
- Any data that could be presented in tabular format

Expected table types for this document: {', '.join(analysis_result.get('suggested_tables', []))}

Return JSON in this format:
{{
  "tables": [
    {{
      "title": "descriptive_table_title",
      "category": "financial|technical|contact|identification|other",
      "confidence": 0.9,
      "headers": ["column1", "column2", "column3"],
      "rows": [
        ["row1_col1", "row1_col2", "row1_col3"],
        ["row2_col1", "row2_col2", "row2_col3"]
      ],
      "metadata": {{
        "notes": "Additional information about this table",
        "data_types": ["text", "number", "text"],
        "totals": {{"column2": "sum_value"}}
      }}
    }}
  ],
  "list_data": [
    {{
      "title": "list_title",
      "items": ["item1", "item2", "item3"],
      "category": "category_name",
      "confidence": 0.8
    }}
  ]
}}

Extract all structured data you can find. Return ONLY valid JSON."""

    def _get_insights_prompt(self) -> str:
        """Get prompt for generating key insights"""
        return """Analyze all the extracted fields and tables to generate key insights about this document.

Based on the extracted information, provide:
1. Key insights about the document's purpose and content
2. Important relationships between different pieces of information
3. Notable patterns or anomalies
4. Summary of the most critical information
5. Potential missing information that would normally be expected

Return JSON format:
{
  "key_insights": [
    "Insight 1 about the document",
    "Insight 2 about relationships",
    "Insight 3 about important data"
  ],
  "critical_information": [
    "Most important piece of info 1",
    "Most important piece of info 2"
  ],
  "data_quality": {
    "completeness": 0.85,
    "consistency": 0.9,
    "notes": "Assessment of data quality"
  },
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}

Return ONLY valid JSON."""

    async def _analyze_document_type(self, chunks: List[DocumentChunk]) -> Dict[str, Any]:
        """Analyze document type and suggest extraction strategy"""
        # Combine first few chunks for analysis
        sample_text = ""
        for chunk in chunks[:3]:  # Use first 3 chunks
            sample_text += chunk.content + "\n\n"
        
        # Limit text length for API
        sample_text = sample_text[:8000]
        
        try:
            completion = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": self._get_document_analysis_prompt()},
                    {"role": "user", "content": f"Analyze this document sample and determine extraction strategy:\n\n{sample_text}"}
                ],
                temperature=0.1,
                max_tokens=1500
            )
            
            response = self._clean_json_response(completion.choices[0].message.content)
            return json.loads(response)
            
        except Exception as e:
            logger.error(f"Error in document analysis: {str(e)}")
            # Return default analysis
            return {
                "document_category": "unknown",
                "document_subcategory": "general_document",
                "confidence": 0.5,
                "suggested_fields": ["title", "content", "dates", "names"],
                "suggested_tables": ["data_table"],
                "key_patterns": ["text_content"],
                "extraction_strategy": "Extract any available structured information"
            }

    def _clean_json_response(self, response: str) -> str:
        """Clean LLM response to extract valid JSON"""
        response = response.strip()
        
        # Remove markdown code blocks
        if response.startswith("```json"):
            response = response[7:]
        elif response.startswith("```"):
            response = response[3:]
        
        if response.endswith("```"):
            response = response[:-3]
        
        return response.strip()

    async def _extract_fields_from_chunk(self, chunk: DocumentChunk, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract dynamic fields from a single chunk"""
        try:
            user_prompt = f"""Extract structured information from this document chunk:

Chunk ID: {chunk.chunk_id}
Page/Section: {chunk.page_range}
Word Count: {chunk.word_count}

Content:
{chunk.content[:6000]}"""

            completion = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": self._get_field_extraction_prompt(analysis_result)},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                max_tokens=2000
            )
            
            response = self._clean_json_response(completion.choices[0].message.content)
            result = json.loads(response)
            
            # Add chunk ID to all extracted fields
            if "extracted_fields" in result:
                for field in result["extracted_fields"]:
                    field["source_chunk_id"] = chunk.chunk_id
            
            return result
            
        except Exception as e:
            logger.error(f"Error extracting fields from chunk {chunk.chunk_id}: {str(e)}")
            return {"extracted_fields": [], "relationships": [], "patterns_found": []}

    async def _extract_tables_from_chunk(self, chunk: DocumentChunk, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract dynamic tables from a single chunk"""
        try:
            user_prompt = f"""Find and extract tabular data from this document chunk:

Chunk ID: {chunk.chunk_id}
Page/Section: {chunk.page_range}

Content:
{chunk.content[:6000]}"""

            completion = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": self._get_table_extraction_prompt(analysis_result)},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                max_tokens=2500
            )
            
            response = self._clean_json_response(completion.choices[0].message.content)
            result = json.loads(response)
            
            # Add chunk ID to all extracted tables
            if "tables" in result:
                for table in result["tables"]:
                    table["source_chunk_id"] = chunk.chunk_id
                    
            if "list_data" in result:
                for list_item in result["list_data"]:
                    list_item["source_chunk_id"] = chunk.chunk_id
            
            return result
            
        except Exception as e:
            logger.error(f"Error extracting tables from chunk {chunk.chunk_id}: {str(e)}")
            return {"tables": [], "list_data": []}

    def _consolidate_fields(self, field_results: List[Dict[str, Any]]) -> List[DynamicField]:
        """Consolidate extracted fields from multiple chunks"""
        field_map = {}
        
        for result in field_results:
            for field_data in result.get("extracted_fields", []):
                key = field_data.get("key", "").lower().strip()
                if not key:
                    continue
                
                # If field already exists, merge or keep highest confidence
                if key in field_map:
                    existing = field_map[key]
                    current_conf = field_data.get("confidence", 0.5)
                    existing_conf = existing.confidence
                    
                    if current_conf > existing_conf:
                        # Update with higher confidence data
                        existing.value = field_data.get("value", existing.value)
                        existing.confidence = current_conf
                        existing.data_type = field_data.get("data_type", existing.data_type)
                    
                    # Add source chunk
                    if "source_chunk_id" in field_data:
                        existing.source_chunk_ids.append(field_data["source_chunk_id"])
                else:
                    # Create new field
                    field_map[key] = DynamicField(
                        key=field_data.get("key", key),
                        value=field_data.get("value", ""),
                        confidence=field_data.get("confidence", 0.5),
                        data_type=field_data.get("data_type", "text"),
                        category=field_data.get("category", "other"),
                        source_chunk_ids=[field_data.get("source_chunk_id", "unknown")],
                        metadata={
                            "notes": field_data.get("notes", ""),
                            "patterns": []
                        }
                    )
        
        return list(field_map.values())

    def _consolidate_tables(self, table_results: List[Dict[str, Any]]) -> List[DynamicTable]:
        """Consolidate extracted tables from multiple chunks"""
        tables = []
        
        for result in table_results:
            # Process regular tables
            for table_data in result.get("tables", []):
                table = DynamicTable(
                    title=table_data.get("title", "Extracted Table"),
                    headers=table_data.get("headers", []),
                    rows=table_data.get("rows", []),
                    category=table_data.get("category", "other"),
                    confidence=table_data.get("confidence", 0.7),
                    source_chunk_ids=[table_data.get("source_chunk_id", "unknown")],
                    metadata=table_data.get("metadata", {})
                )
                tables.append(table)
            
            # Process list data as simple tables
            for list_data in result.get("list_data", []):
                table = DynamicTable(
                    title=list_data.get("title", "List Data"),
                    headers=["Item"],
                    rows=[[item] for item in list_data.get("items", [])],
                    category=list_data.get("category", "other"),
                    confidence=list_data.get("confidence", 0.6),
                    source_chunk_ids=[list_data.get("source_chunk_id", "unknown")],
                    metadata={"type": "list", "item_count": len(list_data.get("items", []))}
                )
                tables.append(table)
        
        return tables

    async def _generate_insights(self, fields: List[DynamicField], tables: List[DynamicTable]) -> Dict[str, Any]:
        """Generate insights from extracted data"""
        try:
            # Prepare summary of extracted data
            fields_summary = []
            for field in fields[:20]:  # Limit to prevent prompt overflow
                fields_summary.append({
                    "key": field.key,
                    "value_type": field.data_type,
                    "category": field.category,
                    "confidence": field.confidence
                })
            
            tables_summary = []
            for table in tables[:10]:
                tables_summary.append({
                    "title": table.title,
                    "columns": len(table.headers),
                    "rows": len(table.rows),
                    "category": table.category
                })
            
            data_summary = {
                "fields_count": len(fields),
                "tables_count": len(tables),
                "fields_sample": fields_summary,
                "tables_sample": tables_summary
            }
            
            user_prompt = f"Generate insights from this extracted data:\n\n{json.dumps(data_summary, indent=2)}"
            
            completion = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": self._get_insights_prompt()},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=1500
            )
            
            response = self._clean_json_response(completion.choices[0].message.content)
            return json.loads(response)
            
        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")
            return {
                "key_insights": ["Document processed successfully"],
                "critical_information": ["Multiple data points extracted"],
                "data_quality": {"completeness": 0.7, "consistency": 0.8, "notes": "Standard extraction"},
                "recommendations": ["Review extracted data for accuracy"]
            }

    async def extract_dynamic_fields(self, chunks: List[DocumentChunk], 
                                   progress_callback=None) -> DynamicExtractionResult:
        """Main method to extract dynamic fields from document chunks"""
        start_time = time.time()
        
        if not chunks:
            raise ValueError("No chunks provided for processing")
        
        try:
            total_steps = 5  # Analysis, field extraction, table extraction, consolidation, insights
            current_step = 0
            
            # Step 1: Analyze document type
            if progress_callback:
                await progress_callback(ProcessingProgress(
                    total_pages=total_steps,
                    processed_pages=current_step,
                    total_chunks=len(chunks),
                    processed_chunks=0,
                    current_stage="Analyzing document type and extraction strategy",
                    status=ProcessingStatus.EXTRACTING_TEXT
                ))
            
            analysis_result = await self._analyze_document_type(chunks)
            current_step += 1
            
            # Determine document category
            doc_category = DocumentCategory.UNKNOWN
            try:
                doc_category = DocumentCategory(analysis_result.get("document_category", "unknown"))
            except ValueError:
                doc_category = DocumentCategory.UNKNOWN
            
            # Step 2: Extract fields from all chunks
            if progress_callback:
                await progress_callback(ProcessingProgress(
                    total_pages=total_steps,
                    processed_pages=current_step,
                    total_chunks=len(chunks),
                    processed_chunks=0,
                    current_stage="Extracting dynamic fields from document chunks",
                    status=ProcessingStatus.EXTRACTING_TEXT
                ))
            
            field_tasks = []
            batch_size = 3
            field_results = []
            
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i:i + batch_size]
                batch_tasks = [self._extract_fields_from_chunk(chunk, analysis_result) for chunk in batch]
                batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
                
                for result in batch_results:
                    if isinstance(result, dict):
                        field_results.append(result)
                    elif isinstance(result, Exception):
                        logger.error(f"Field extraction failed: {str(result)}")
                
                await asyncio.sleep(0.5)  # Rate limiting
            
            current_step += 1
            
            # Step 3: Extract tables from chunks
            if progress_callback:
                await progress_callback(ProcessingProgress(
                    total_pages=total_steps,
                    processed_pages=current_step,
                    total_chunks=len(chunks),
                    processed_chunks=len(chunks),
                    current_stage="Extracting dynamic tables and structured data",
                    status=ProcessingStatus.PROCESSING_TABLES
                ))
            
            table_results = []
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i:i + batch_size]
                batch_tasks = [self._extract_tables_from_chunk(chunk, analysis_result) for chunk in batch]
                batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
                
                for result in batch_results:
                    if isinstance(result, dict):
                        table_results.append(result)
                    elif isinstance(result, Exception):
                        logger.error(f"Table extraction failed: {str(result)}")
                
                await asyncio.sleep(0.5)  # Rate limiting
            
            current_step += 1
            
            # Step 4: Consolidate results
            if progress_callback:
                await progress_callback(ProcessingProgress(
                    total_pages=total_steps,
                    processed_pages=current_step,
                    total_chunks=len(chunks),
                    processed_chunks=len(chunks),
                    current_stage="Consolidating and organizing extracted data",
                    status=ProcessingStatus.FINALIZING
                ))
            
            consolidated_fields = self._consolidate_fields(field_results)
            consolidated_tables = self._consolidate_tables(table_results)
            current_step += 1
            
            # Step 5: Generate insights
            if progress_callback:
                await progress_callback(ProcessingProgress(
                    total_pages=total_steps,
                    processed_pages=current_step,
                    total_chunks=len(chunks),
                    processed_chunks=len(chunks),
                    current_stage="Generating insights and analysis",
                    status=ProcessingStatus.FINALIZING
                ))
            
            insights = await self._generate_insights(consolidated_fields, consolidated_tables)
            
            # Calculate overall confidence
            field_confidences = [f.confidence for f in consolidated_fields if f.confidence > 0]
            table_confidences = [t.confidence for t in consolidated_tables if t.confidence > 0]
            all_confidences = field_confidences + table_confidences
            
            overall_confidence = sum(all_confidences) / len(all_confidences) if all_confidences else 0.5
            
            # Create final result
            result = DynamicExtractionResult(
                document_category=doc_category,
                confidence=overall_confidence,
                fields=consolidated_fields,
                tables=consolidated_tables,
                key_insights=insights.get("key_insights", []),
                processing_metrics={
                    "processing_time": time.time() - start_time,
                    "chunks_processed": len(chunks),
                    "fields_extracted": len(consolidated_fields),
                    "tables_extracted": len(consolidated_tables),
                    "document_analysis": analysis_result,
                    "data_quality": insights.get("data_quality", {}),
                    "recommendations": insights.get("recommendations", [])
                },
                raw_llm_responses=[analysis_result, insights]
            )
            
            if progress_callback:
                await progress_callback(ProcessingProgress(
                    total_pages=total_steps,
                    processed_pages=total_steps,
                    total_chunks=len(chunks),
                    processed_chunks=len(chunks),
                    current_stage="Dynamic extraction completed",
                    status=ProcessingStatus.COMPLETED
                ))
            
            logger.info(f"Dynamic extraction completed: {len(consolidated_fields)} fields, "
                       f"{len(consolidated_tables)} tables, confidence: {overall_confidence:.2f}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in dynamic field extraction: {str(e)}")
            raise

# Create global instance
dynamic_extractor = DynamicFieldExtractor()