# Enhanced Document Parsers

A robust, high-performance document parsing system that can handle PDF, Excel, and DOCX files of any size with intelligent chunking, memory management, and comprehensive error handling.

## 🚀 Features

### Core Capabilities
- **Universal Format Support**: PDF, Excel (xlsx/xls), and DOCX files
- **Intelligent Chunking**: Automatically splits large documents into manageable chunks with configurable overlap
- **Memory Management**: Built-in memory monitoring and garbage collection to handle large files
- **Progress Tracking**: Real-time progress callbacks with detailed metrics
- **Error Resilience**: Comprehensive error handling with fallback mechanisms
- **Performance Metrics**: Detailed processing statistics and performance monitoring

### Advanced Features
- **Multiple PDF Engines**: Uses both pdfplumber and PyPDF2 for maximum compatibility
- **Pandas Integration**: High-performance Excel processing using pandas for large files
- **Table Extraction**: Automatic detection and extraction of tables from all document types
- **Quality Scoring**: Content quality assessment to filter low-quality chunks
- **Language Detection**: Basic language detection for extracted content
- **Batch Processing**: Efficient processing of multiple documents
- **Backward Compatibility**: Compatible with existing parsing interfaces

### Processing Options
- **Configurable Chunk Sizes**: Adjust chunk size based on your needs (default: 2000 words)
- **Overlap Control**: Control word overlap between chunks (default: 200 words)
- **Memory Limits**: Set memory limits to prevent system overload
- **Quality Thresholds**: Filter out low-quality content
- **Table Extraction**: Enable/disable table extraction as needed

## 📁 File Structure

```
venxtra-backend/
├── app/
│   ├── enhanced_parsers_v2.py    # Main enhanced parser implementation
│   ├── enhanced_parsers.py       # Original parser (legacy)
│   └── parsers.py               # Basic parsers (legacy)
├── requirements.txt              # Updated dependencies
├── test_enhanced_parsers.py     # Comprehensive test suite
├── usage_example.py             # Usage examples
└── ENHANCED_PARSERS_README.md   # This documentation
```

## 🛠 Installation

### 1. Install Dependencies

The enhanced parsers require additional Python packages. Add these to your requirements.txt:

```txt
# Existing dependencies
fastapi==0.109.0
uvicorn[standard]==0.27.0
pymongo==4.6.1
# ... other existing dependencies

# Enhanced parsing dependencies
pandas==2.1.4
xlrd==2.0.1
PyPDF2==3.0.1
tabula-py==2.9.0
camelot-py[cv]==0.11.0

# Already included
pdfplumber==0.10.3
python-docx==1.1.0
openpyxl==3.1.2
```

### 2. Install packages

If using a virtual environment:
```bash
pip install -r requirements.txt
```

If using system Python with external package management:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Install Additional System Dependencies (Optional)

For advanced PDF table extraction:
```bash
# Ubuntu/Debian
sudo apt-get install python3-tk ghostscript

# For camelot-py (advanced table extraction)
sudo apt-get install python3-opencv python3-tk
```

## 📖 Quick Start

### Basic Usage

```python
import asyncio
from enhanced_parsers_v2 import extract_text_chunked

async def process_document():
    # Read your document
    with open('your_document.pdf', 'rb') as f:
        file_content = f.read()
    
    # Process with chunking
    chunks, metrics = await extract_text_chunked(
        file_content=file_content,
        file_type='pdf',
        max_chunk_size=1000,
        enable_table_extraction=True
    )
    
    print(f"Extracted {len(chunks)} chunks in {metrics.total_processing_time:.2f}s")
    
    # Access chunk content
    for chunk in chunks:
        print(f"Chunk {chunk.chunk_id}: {chunk.word_count} words")
        print(f"Content: {chunk.content[:100]}...")

# Run the processing
asyncio.run(process_document())
```

### With Progress Tracking

```python
async def progress_callback(progress):
    print(f"{progress.current_stage}: {progress.processed_pages}/{progress.total_pages} pages")
    print(f"Memory usage: {progress.memory_usage_mb:.1f}MB")

chunks, metrics = await extract_text_chunked(
    file_content=file_content,
    file_type='pdf',
    progress_callback=progress_callback,
    max_chunk_size=2000,
    memory_limit_mb=500
)
```

### Document Validation

```python
from enhanced_parsers_v2 import validate_document, get_document_info

# Validate before processing
validation = await validate_document(file_content, 'pdf')
if not validation['is_valid']:
    print(f"Invalid document: {validation['errors']}")
    return

# Get document information
info = await get_document_info(file_content, 'pdf')
print(f"Document has {info['pages']} pages, estimated {info['estimated_chunks']} chunks")
```

## ⚙️ Configuration Options

### Processing Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_chunk_size` | int | 2000 | Maximum words per chunk |
| `overlap_size` | int | 200 | Word overlap between chunks |
| `memory_limit_mb` | int | 500 | Memory limit in MB |
| `enable_table_extraction` | bool | True | Extract tables from documents |
| `enable_image_extraction` | bool | False | Extract images (PDF only) |
| `quality_threshold` | float | 0.1 | Minimum quality score (0-1) |

### Example Configurations

```python
# Large document processing
large_doc_config = {
    'max_chunk_size': 3000,
    'overlap_size': 300,
    'memory_limit_mb': 1000,
    'enable_table_extraction': True,
    'quality_threshold': 0.05
}

# High-quality processing
quality_config = {
    'max_chunk_size': 1000,
    'overlap_size': 100,
    'memory_limit_mb': 200,
    'enable_table_extraction': True,
    'quality_threshold': 0.3
}

# Fast processing
fast_config = {
    'max_chunk_size': 5000,
    'overlap_size': 0,
    'memory_limit_mb': 1000,
    'enable_table_extraction': False,
    'quality_threshold': 0.0
}
```

## 📊 Data Structures

### DocumentChunk

```python
@dataclass
class DocumentChunk:
    chunk_id: str                    # Unique identifier
    page_range: str                  # Page or sheet range
    content: str                     # Extracted text content
    word_count: int                  # Number of words
    metadata: Dict[str, Any]         # Additional metadata
    tables: List[Dict[str, Any]]     # Extracted tables
    images: List[Dict[str, Any]]     # Extracted images
    processing_time: Optional[float] # Processing time for this chunk
    quality_score: Optional[float]   # Quality score (0-1)
```

### ProcessingMetrics

```python
@dataclass
class ProcessingMetrics:
    start_time: float
    end_time: Optional[float]
    total_processing_time: Optional[float]
    memory_peak_mb: float
    memory_average_mb: float
    pages_processed: int
    chunks_created: int
    tables_extracted: int
    errors_encountered: int
    avg_processing_speed_pages_per_sec: float
    file_size_mb: float
```

## 🔧 API Reference

### Main Functions

#### `extract_text_chunked()`
```python
async def extract_text_chunked(
    file_content: bytes,
    file_type: str,
    progress_callback=None,
    max_chunk_size: int = 2000,
    overlap_size: int = 200,
    memory_limit_mb: int = 500,
    enable_table_extraction: bool = True,
    quality_threshold: float = 0.1
) -> Tuple[List[DocumentChunk], ProcessingMetrics]
```

#### `validate_document()`
```python
async def validate_document(file_content: bytes, file_type: str) -> Dict[str, Any]
```

#### `get_document_info()`
```python
async def get_document_info(file_content: bytes, file_type: str) -> Dict[str, Any]
```

#### `extract_text_enhanced()` (Backward Compatible)
```python
async def extract_text_enhanced(file_content: bytes, file_type: str) -> str
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
python3 test_enhanced_parsers.py
```

Run usage examples:

```bash
python3 usage_example.py
```

### Test Coverage

The test suite includes:
- Document validation testing
- PDF processing with multiple engines
- Excel processing with pandas and openpyxl
- DOCX processing with table extraction
- Memory management testing
- Progress tracking validation
- Error handling verification
- Backward compatibility testing

## 🎯 Performance Optimization

### For Large Files
- Increase `memory_limit_mb` to 1000+ MB
- Use larger `max_chunk_size` (3000-5000 words)
- Enable progress callbacks for monitoring
- Process in batches for multiple files

### For Memory-Constrained Environments
- Decrease `memory_limit_mb` to 200-300 MB
- Use smaller `max_chunk_size` (500-1000 words)
- Disable table extraction if not needed
- Increase `quality_threshold` to filter content

### For Speed
- Disable table extraction
- Set `overlap_size` to 0
- Use higher `quality_threshold`
- Increase `max_chunk_size`

## 🔍 Troubleshooting

### Common Issues

1. **Memory Errors**
   - Reduce `memory_limit_mb`
   - Decrease `max_chunk_size`
   - Process smaller batches

2. **Import Errors**
   - Install missing dependencies: `pip install -r requirements.txt`
   - Check Python version (3.8+ required)

3. **PDF Processing Fails**
   - Uses fallback from pdfplumber to PyPDF2 automatically
   - Check if PDF is password-protected or corrupted

4. **Excel Processing Slow**
   - Pandas processing is attempted first for better performance
   - Large Excel files may require more memory

5. **Low Quality Chunks**
   - Adjust `quality_threshold` (lower = more permissive)
   - Check if document contains mostly images/scanned content

### Debug Mode

Enable detailed logging:

```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('enhanced_parsers_v2')
logger.setLevel(logging.DEBUG)
```

## 🚀 Production Deployment

### Integration with FastAPI

```python
from fastapi import FastAPI, UploadFile, File
from enhanced_parsers_v2 import extract_text_chunked, validate_document

app = FastAPI()

@app.post("/process-document/")
async def process_document(file: UploadFile = File(...)):
    # Read file content
    content = await file.read()
    
    # Validate
    validation = await validate_document(content, file.content_type)
    if not validation['is_valid']:
        return {"error": "Invalid document", "details": validation['errors']}
    
    # Process
    chunks, metrics = await extract_text_chunked(
        file_content=content,
        file_type=file.content_type,
        max_chunk_size=2000,
        enable_table_extraction=True
    )
    
    return {
        "chunks_count": len(chunks),
        "processing_time": metrics.total_processing_time,
        "memory_peak": metrics.memory_peak_mb,
        "chunks": [{"id": c.chunk_id, "content": c.content} for c in chunks]
    }
```

### Environment Variables

```bash
# Optional environment variables
PARSER_DEFAULT_CHUNK_SIZE=2000
PARSER_DEFAULT_MEMORY_LIMIT=500
PARSER_ENABLE_TABLE_EXTRACTION=true
PARSER_QUALITY_THRESHOLD=0.1
```

## 📈 Future Enhancements

### Planned Features (Advanced PDF Features - Todo Item #8)
- Form field extraction
- Annotation processing
- Image extraction with OCR
- Signature detection
- Bookmark extraction

### Potential Improvements
- Support for PowerPoint files
- OCR integration for scanned documents
- Language-specific optimization
- Cloud storage integration
- Streaming processing for very large files

## 🤝 Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Ensure backward compatibility
5. Test with various document types and sizes

## 📄 License

This implementation is part of the venxtra-backend project and follows the same licensing terms.

---

**Ready to parse any document, any size, with confidence! 🚀**