"""
로깅 설정 모듈
"""

import logging
import logging.config
import sys
from datetime import datetime
from pathlib import Path

from ..config import get_settings


def setup_logging():
    """로깅 시스템 설정"""
    settings = get_settings()

    # 로그 디렉토리 생성
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # 현재 날짜로 로그 파일명 생성
    today = datetime.now().strftime("%Y-%m-%d")

    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "[%(asctime)s] %(levelname)s in %(module)s: %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "detailed": {
                "format": "[%(asctime)s] %(levelname)s in %(name)s (%(filename)s:%(lineno)d): %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "json": {
                "format": '{"time": "%(asctime)s", "level": "%(levelname)s", "module": "%(module)s", "message": "%(message)s"}',
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": settings.log_level,
                "formatter": "default",
                "stream": sys.stdout,
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "INFO",
                "formatter": "detailed",
                "filename": f"logs/app-{today}.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "encoding": "utf8",
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "ERROR",
                "formatter": "detailed",
                "filename": f"logs/error-{today}.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "encoding": "utf8",
            },
        },
        "loggers": {
            "": {  # root logger
                "level": settings.log_level,
                "handlers": ["console", "file", "error_file"],
            },
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console", "file"],
                "propagate": False,
            },
            "uvicorn.error": {
                "level": "INFO",
                "handlers": ["console", "file", "error_file"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["file"],
                "propagate": False,
            },
            "app": {
                "level": settings.log_level,
                "handlers": ["console", "file", "error_file"],
                "propagate": False,
            },
            "app.services": {
                "level": settings.log_level,
                "handlers": ["console", "file", "error_file"],
                "propagate": False,
            },
            "app.repositories": {
                "level": settings.log_level,
                "handlers": ["file"],
                "propagate": False,
            },
        },
    }

    # 개발 모드에서는 더 자세한 로그
    if settings.debug:
        logging_config["loggers"][""]["level"] = "DEBUG"
        logging_config["loggers"]["app"]["level"] = "DEBUG"
        logging_config["loggers"]["app.services"]["level"] = "DEBUG"
        logging_config["handlers"]["console"]["formatter"] = "detailed"

    logging.config.dictConfig(logging_config)


def get_logger(name: str) -> logging.Logger:
    """특정 모듈용 로거 생성"""
    return logging.getLogger(f"app.{name}")


# 주요 컴포넌트별 로거
def get_service_logger(service_name: str) -> logging.Logger:
    """서비스용 로거"""
    return logging.getLogger(f"app.services.{service_name}")


def get_repository_logger(repository_name: str) -> logging.Logger:
    """레포지토리용 로거"""
    return logging.getLogger(f"app.repositories.{repository_name}")


def get_router_logger(router_name: str) -> logging.Logger:
    """라우터용 로거"""
    return logging.getLogger(f"app.routers.{router_name}")


class LoggerMixin:
    """로거 믹스인 클래스"""

    @property
    def logger(self) -> logging.Logger:
        """클래스명 기반 로거 반환"""
        class_name = self.__class__.__name__.lower()
        return get_logger(class_name)


# 글로벌 로거 설정 함수
def configure_logging():
    """애플리케이션 시작 시 호출할 로깅 설정 함수"""
    setup_logging()

    # 초기화 로그
    logger = get_logger("startup")
    logger.info("=== YouTube Upload Automation 시작 ===")
    logger.info("로깅 시스템 초기화 완료")
