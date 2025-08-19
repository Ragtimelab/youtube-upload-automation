"""
구조화된 로깅 시스템
"""

import json
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from functools import wraps

from ..config import get_settings


class StructuredFormatter(logging.Formatter):
    """구조화된 JSON 로그 포맷터"""
    
    def format(self, record):
        # 기본 로그 데이터
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # 추가 컨텍스트 정보가 있으면 포함
        if hasattr(record, 'context'):
            log_data['context'] = record.context
        
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
            
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
            
        if hasattr(record, 'script_id'):
            log_data['script_id'] = record.script_id
        
        # 예외 정보
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        # 성능 메트릭
        if hasattr(record, 'duration'):
            log_data['duration_ms'] = record.duration
            
        if hasattr(record, 'file_size'):
            log_data['file_size_bytes'] = record.file_size
        
        return json.dumps(log_data, ensure_ascii=False)


class PerformanceLogger:
    """성능 측정을 위한 로거"""
    
    def __init__(self, logger: logging.Logger):
        self.logger = logger
    
    def log_operation_time(self, operation: str, duration_ms: float, 
                          context: Optional[Dict[str, Any]] = None):
        """작업 시간 로깅"""
        extra = {
            'duration': duration_ms,
            'context': context or {}
        }
        
        if duration_ms > 5000:  # 5초 이상
            self.logger.warning(f"Slow operation: {operation}", extra=extra)
        elif duration_ms > 1000:  # 1초 이상
            self.logger.info(f"Operation completed: {operation}", extra=extra)
        else:
            self.logger.debug(f"Operation completed: {operation}", extra=extra)
    
    def log_file_operation(self, operation: str, file_path: str, 
                          file_size: int, duration_ms: float):
        """파일 작업 로깅"""
        extra = {
            'duration': duration_ms,
            'file_size': file_size,
            'context': {'file_path': file_path, 'operation': operation}
        }
        
        self.logger.info(f"File {operation}: {file_path} ({file_size} bytes)", extra=extra)


def performance_monitor(operation_name: str = None):
    """성능 모니터링 데코레이터"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            operation = operation_name or f"{func.__module__}.{func.__name__}"
            
            try:
                result = func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                
                logger = logging.getLogger(f"performance.{func.__module__}")
                perf_logger = PerformanceLogger(logger)
                perf_logger.log_operation_time(operation, duration)
                
                return result
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                logger = logging.getLogger(f"performance.{func.__module__}")
                logger.error(f"Operation failed: {operation}", extra={
                    'duration': duration,
                    'exception': str(e),
                    'context': {'operation': operation}
                })
                raise
        return wrapper
    return decorator


class ContextualLogger:
    """컨텍스트 정보를 포함한 로거"""
    
    def __init__(self, logger: logging.Logger, context: Dict[str, Any] = None):
        self.logger = logger
        self.context = context or {}
    
    def _log_with_context(self, level: int, message: str, **kwargs):
        """컨텍스트 정보와 함께 로그 기록"""
        extra = kwargs.get('extra', {})
        extra['context'] = {**self.context, **extra.get('context', {})}
        kwargs['extra'] = extra
        
        self.logger.log(level, message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        self._log_with_context(logging.DEBUG, message, **kwargs)
    
    def info(self, message: str, **kwargs):
        self._log_with_context(logging.INFO, message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self._log_with_context(logging.WARNING, message, **kwargs)
    
    def error(self, message: str, **kwargs):
        self._log_with_context(logging.ERROR, message, **kwargs)
    
    def critical(self, message: str, **kwargs):
        self._log_with_context(logging.CRITICAL, message, **kwargs)
    
    def with_context(self, **additional_context) -> 'ContextualLogger':
        """추가 컨텍스트와 함께 새로운 로거 생성"""
        new_context = {**self.context, **additional_context}
        return ContextualLogger(self.logger, new_context)


def get_contextual_logger(name: str, **context) -> ContextualLogger:
    """컨텍스트 정보를 포함한 로거 생성"""
    logger = logging.getLogger(name)
    return ContextualLogger(logger, context)


def get_performance_logger(name: str) -> PerformanceLogger:
    """성능 로거 생성"""
    logger = logging.getLogger(f"performance.{name}")
    return PerformanceLogger(logger)


# 스크립트 처리 전용 로거들
def get_script_logger(script_id: int) -> ContextualLogger:
    """스크립트 처리 전용 로거"""
    return get_contextual_logger("script_processing", script_id=script_id)


def get_upload_logger(script_id: int, upload_type: str) -> ContextualLogger:
    """업로드 전용 로거"""
    return get_contextual_logger("upload_processing", 
                                script_id=script_id, 
                                upload_type=upload_type)


def get_api_logger(endpoint: str, method: str = "GET") -> ContextualLogger:
    """API 요청 전용 로거"""
    return get_contextual_logger("api_requests", 
                                endpoint=endpoint, 
                                method=method)


# 로깅 통계 및 모니터링
class LoggingMetrics:
    """로깅 메트릭 수집기"""
    
    def __init__(self):
        self.metrics = {
            'total_requests': 0,
            'error_count': 0,
            'avg_response_time': 0,
            'slow_operations': 0,
        }
    
    def increment_requests(self):
        self.metrics['total_requests'] += 1
    
    def increment_errors(self):
        self.metrics['error_count'] += 1
    
    def record_response_time(self, duration_ms: float):
        current_avg = self.metrics['avg_response_time']
        total = self.metrics['total_requests']
        
        self.metrics['avg_response_time'] = (
            (current_avg * (total - 1) + duration_ms) / total
        )
        
        if duration_ms > 5000:  # 5초 이상
            self.metrics['slow_operations'] += 1
    
    def get_summary(self) -> Dict[str, Any]:
        return {
            **self.metrics,
            'error_rate': (
                self.metrics['error_count'] / max(self.metrics['total_requests'], 1)
            ) * 100,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }


# 전역 메트릭 인스턴스
logging_metrics = LoggingMetrics()