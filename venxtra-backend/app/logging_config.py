import logging
import logging.config
import json
from datetime import datetime
from typing import Dict, Any
import traceback
from pathlib import Path
import os

# Create logs directory if it doesn't exist
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

class StructuredFormatter(logging.Formatter):
    """Custom formatter that outputs structured JSON logs"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add extra fields if present
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        if hasattr(record, 'ip_address'):
            log_data['ip_address'] = record.ip_address
        if hasattr(record, 'method'):
            log_data['method'] = record.method
        if hasattr(record, 'path'):
            log_data['path'] = record.path
        if hasattr(record, 'status_code'):
            log_data['status_code'] = record.status_code
        if hasattr(record, 'response_time'):
            log_data['response_time'] = record.response_time
            
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': traceback.format_exception(*record.exc_info)
            }
            
        return json.dumps(log_data)

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "structured": {
            "()": StructuredFormatter,
        },
        "standard": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        },
        "detailed": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(module)s:%(funcName)s:%(lineno)d - %(message)s"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "INFO",
            "formatter": "standard",
            "stream": "ext://sys.stdout"
        },
        "file_json": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "DEBUG",
            "formatter": "structured",
            "filename": "logs/app.json",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5
        },
        "file_error": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "ERROR",
            "formatter": "detailed",
            "filename": "logs/errors.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5
        },
        "file_security": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "INFO",
            "formatter": "structured",
            "filename": "logs/security.json",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5
        },
        "file_performance": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "INFO",
            "formatter": "structured",
            "filename": "logs/performance.json",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5
        }
    },
    "loggers": {
        "app": {
            "level": "DEBUG",
            "handlers": ["console", "file_json", "file_error"],
            "propagate": False
        },
        "app.security": {
            "level": "INFO",
            "handlers": ["file_security"],
            "propagate": False
        },
        "app.performance": {
            "level": "INFO",
            "handlers": ["file_performance"],
            "propagate": False
        },
        "uvicorn.access": {
            "level": "INFO",
            "handlers": ["console", "file_json"],
            "propagate": False
        }
    },
    "root": {
        "level": "INFO",
        "handlers": ["console", "file_json"]
    }
}

def setup_logging():
    """Initialize logging configuration"""
    logging.config.dictConfig(LOGGING_CONFIG)
    
    # Set third-party library log levels
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("motor").setLevel(logging.WARNING)
    
    logger = logging.getLogger("app")
    logger.info("Logging system initialized")
    
class LoggerAdapter(logging.LoggerAdapter):
    """Custom adapter to add context to logs"""
    
    def process(self, msg: str, kwargs: Dict[str, Any]) -> tuple:
        # Add any context from the extra dict
        if 'extra' in kwargs:
            for key, value in kwargs['extra'].items():
                if key not in ['user_id', 'request_id', 'ip_address', 'method', 'path', 'status_code', 'response_time']:
                    continue
                if hasattr(self, key):
                    kwargs['extra'][key] = getattr(self, key)
        return msg, kwargs

def get_logger(name: str, **context) -> LoggerAdapter:
    """Get a logger with optional context"""
    logger = logging.getLogger(name)
    return LoggerAdapter(logger, context)