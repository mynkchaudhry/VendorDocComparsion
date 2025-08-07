import hashlib
import magic
import os
import tempfile
from typing import Optional, Tuple, Dict
from pathlib import Path
import asyncio
import logging
from datetime import datetime
import mimetypes

logger = logging.getLogger("app.security")

class FileSecurityScanner:
    """Comprehensive file security scanning"""
    
    # File signatures (magic numbers)
    FILE_SIGNATURES = {
        b'%PDF': 'pdf',
        b'\x50\x4B\x03\x04': 'docx/xlsx',  # ZIP format (Office files)
        b'\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1': 'doc/xls',  # OLE format
        b'\x50\x4B\x05\x06': 'docx/xlsx',  # ZIP format variant
        b'\x50\x4B\x07\x08': 'docx/xlsx',  # ZIP format variant
    }
    
    # Dangerous patterns to check in files
    DANGEROUS_PATTERNS = [
        b'<script',
        b'javascript:',
        b'onclick=',
        b'onerror=',
        b'eval(',
        b'exec(',
        b'system(',
        b'<?php',
        b'<%',
        b'<jsp:',
        b'../../../',
        b'\\x00',  # Null byte
    ]
    
    # Maximum allowed file sizes by type (in bytes)
    MAX_FILE_SIZES = {
        'pdf': 50 * 1024 * 1024,      # 50MB
        'doc': 30 * 1024 * 1024,      # 30MB
        'docx': 30 * 1024 * 1024,     # 30MB
        'xls': 20 * 1024 * 1024,      # 20MB
        'xlsx': 20 * 1024 * 1024,     # 20MB
    }
    
    def __init__(self):
        self.quarantine_dir = Path("quarantine")
        self.quarantine_dir.mkdir(exist_ok=True)
        
    def verify_file_signature(self, file_content: bytes, expected_extension: str) -> Tuple[bool, str]:
        """Verify file signature matches expected type"""
        # Check first few bytes for file signature
        for signature, file_type in self.FILE_SIGNATURES.items():
            if file_content.startswith(signature):
                if expected_extension.lower() in file_type:
                    return True, f"Valid {file_type} signature"
                else:
                    return False, f"File signature mismatch: expected {expected_extension}, got {file_type}"
        
        # For Office files, additional check
        if expected_extension.lower() in ['docx', 'xlsx']:
            # These are ZIP files, check for specific content
            if file_content.startswith(b'PK'):
                return True, "Valid Office file signature"
        
        return False, f"Unknown or invalid file signature for {expected_extension}"
    
    def check_file_content(self, file_content: bytes) -> Tuple[bool, str]:
        """Check file content for dangerous patterns"""
        content_lower = file_content.lower()
        
        for pattern in self.DANGEROUS_PATTERNS:
            if pattern in content_lower:
                return False, f"Dangerous pattern detected: {pattern.decode('utf-8', errors='ignore')}"
        
        # Check for excessive null bytes (possible obfuscation)
        null_byte_count = file_content.count(b'\x00')
        if null_byte_count > len(file_content) * 0.3:  # More than 30% null bytes
            return False, "Suspicious file content: too many null bytes"
        
        return True, "Content appears safe"
    
    def check_file_size(self, file_size: int, file_extension: str) -> Tuple[bool, str]:
        """Validate file size against limits"""
        max_size = self.MAX_FILE_SIZES.get(file_extension.lower(), 10 * 1024 * 1024)  # Default 10MB
        
        if file_size > max_size:
            return False, f"File too large: {file_size} bytes (max: {max_size} bytes)"
        
        if file_size == 0:
            return False, "Empty file not allowed"
        
        return True, "File size acceptable"
    
    async def simulate_virus_scan(self, file_content: bytes, filename: str) -> Tuple[bool, str]:
        """Simulate virus scanning (replace with actual AV integration in production)"""
        # Calculate file hash
        file_hash = hashlib.sha256(file_content).hexdigest()
        
        logger.info(f"Simulating virus scan for {filename} (hash: {file_hash})")
        
        # Simulate scan time
        await asyncio.sleep(0.5)
        
        # Check against simulated malware hashes (in production, use real AV)
        known_malware_patterns = [
            "eicar",  # EICAR test file
            "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
        ]
        
        content_str = file_content.decode('utf-8', errors='ignore')
        for pattern in known_malware_patterns:
            if pattern in content_str:
                return False, f"Malware detected: {pattern[:20]}..."
        
        # Random false positive for testing (1% chance)
        import random
        if random.random() < 0.01:
            return False, "Suspicious file behavior detected"
        
        return True, f"No threats detected (hash: {file_hash[:16]}...)"
    
    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to prevent directory traversal and other attacks"""
        # Remove any path components
        filename = os.path.basename(filename)
        
        # Remove dangerous characters
        dangerous_chars = ['/', '\\', '..', '~', '$', '|', ';', '&', '>', '<', '`', '\n', '\r', '\0']
        for char in dangerous_chars:
            filename = filename.replace(char, '')
        
        # Limit filename length
        name, ext = os.path.splitext(filename)
        if len(name) > 100:
            name = name[:100]
        
        # Ensure extension is safe
        safe_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
        if ext.lower() not in safe_extensions:
            ext = '.bin'  # Default safe extension
        
        sanitized = name + ext
        
        # Add timestamp if filename is empty or suspicious
        if not sanitized or sanitized == '.bin':
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            sanitized = f"file_{timestamp}{ext}"
        
        return sanitized
    
    async def scan_file(
        self, 
        file_content: bytes, 
        filename: str, 
        expected_mime_type: Optional[str] = None
    ) -> Tuple[bool, Dict[str, any]]:
        """Comprehensive file security scan"""
        scan_results = {
            "filename": filename,
            "sanitized_filename": self.sanitize_filename(filename),
            "size": len(file_content),
            "checks": {},
            "passed": True,
            "quarantined": False
        }
        
        # Extract extension
        _, extension = os.path.splitext(filename)
        extension = extension.lstrip('.').lower()
        
        # 1. Check file size
        size_ok, size_msg = self.check_file_size(len(file_content), extension)
        scan_results["checks"]["file_size"] = {"passed": size_ok, "message": size_msg}
        if not size_ok:
            scan_results["passed"] = False
            
        # 2. Verify file signature
        sig_ok, sig_msg = self.verify_file_signature(file_content, extension)
        scan_results["checks"]["file_signature"] = {"passed": sig_ok, "message": sig_msg}
        if not sig_ok:
            scan_results["passed"] = False
            
        # 3. Check MIME type if provided
        if expected_mime_type:
            detected_mime = magic.from_buffer(file_content, mime=True)
            mime_ok = detected_mime == expected_mime_type
            scan_results["checks"]["mime_type"] = {
                "passed": mime_ok,
                "message": f"Expected: {expected_mime_type}, Got: {detected_mime}"
            }
            if not mime_ok:
                scan_results["passed"] = False
                
        # 4. Content security check
        content_ok, content_msg = self.check_file_content(file_content)
        scan_results["checks"]["content_security"] = {"passed": content_ok, "message": content_msg}
        if not content_ok:
            scan_results["passed"] = False
            
        # 5. Virus scan
        virus_ok, virus_msg = await self.simulate_virus_scan(file_content, filename)
        scan_results["checks"]["virus_scan"] = {"passed": virus_ok, "message": virus_msg}
        if not virus_ok:
            scan_results["passed"] = False
            
        # If any check failed, quarantine the file
        if not scan_results["passed"]:
            quarantine_path = await self.quarantine_file(file_content, filename, scan_results)
            scan_results["quarantined"] = True
            scan_results["quarantine_path"] = str(quarantine_path)
            
            logger.warning(
                f"File failed security scan and was quarantined: {filename}",
                extra={"scan_results": scan_results}
            )
        else:
            logger.info(
                f"File passed all security checks: {filename}",
                extra={"scan_results": scan_results}
            )
            
        return scan_results["passed"], scan_results
    
    async def quarantine_file(
        self, 
        file_content: bytes, 
        original_filename: str, 
        scan_results: Dict
    ) -> Path:
        """Move dangerous file to quarantine"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        file_hash = hashlib.sha256(file_content).hexdigest()[:16]
        
        quarantine_filename = f"{timestamp}_{file_hash}_{self.sanitize_filename(original_filename)}"
        quarantine_path = self.quarantine_dir / quarantine_filename
        
        # Save file
        with open(quarantine_path, 'wb') as f:
            f.write(file_content)
        
        # Save scan results
        results_path = quarantine_path.with_suffix('.json')
        import json
        with open(results_path, 'w') as f:
            json.dump({
                "original_filename": original_filename,
                "quarantine_time": timestamp,
                "scan_results": scan_results
            }, f, indent=2)
        
        logger.warning(f"File quarantined: {quarantine_path}")
        
        return quarantine_path

# Global scanner instance
file_scanner = FileSecurityScanner()

async def secure_file_upload(
    file_content: bytes,
    filename: str,
    content_type: Optional[str] = None,
    user_id: Optional[str] = None
) -> Tuple[bool, Dict[str, any], bytes]:
    """
    Secure file upload with comprehensive checks
    Returns: (is_safe, scan_results, sanitized_content)
    """
    # Log upload attempt
    logger.info(
        f"File upload security check started",
        extra={
            "upload_filename": filename,
            "size": len(file_content),
            "content_type": content_type,
            "user_id": user_id
        }
    )
    
    # Perform security scan
    is_safe, scan_results = await file_scanner.scan_file(
        file_content,
        filename,
        content_type
    )
    
    if not is_safe:
        logger.warning(
            f"File upload blocked due to security concerns",
            extra={
                "upload_filename": filename,
                "user_id": user_id,
                "scan_results": scan_results
            }
        )
        
    return is_safe, scan_results, file_content  # In production, might return sanitized content