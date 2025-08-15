"""
설정 관리 모듈

환경 변수를 통해 애플리케이션 설정을 관리합니다.
Pydantic Settings를 사용하여 타입 안전성과 검증을 제공합니다.
"""

import os
from pathlib import Path
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """애플리케이션 설정 클래스

    환경 변수(.env 파일 포함)에서 설정을 로드하고 검증합니다.
    """

    # ===========================================
    # Server Configuration
    # ===========================================
    backend_host: str = Field(default="0.0.0.0", validation_alias="BACKEND_HOST")
    backend_port: int = Field(default=8000, validation_alias="BACKEND_PORT")
    backend_reload: bool = Field(default=True, validation_alias="BACKEND_RELOAD")

    # Frontend Configuration
    frontend_url: str = Field(default="http://localhost:3000", validation_alias="FRONTEND_URL")
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"], validation_alias="CORS_ORIGINS"
    )

    # ===========================================
    # File Paths & Storage
    # ===========================================
    upload_dir: str = Field(default="uploads/videos", validation_alias="UPLOAD_DIR")
    credentials_path: str = Field(default="credentials.json", validation_alias="CREDENTIALS_PATH")
    token_path: str = Field(default="token.pickle", validation_alias="TOKEN_PATH")

    # ===========================================
    # YouTube API Configuration
    # ===========================================
    default_privacy_status: str = Field(default="private", validation_alias="DEFAULT_PRIVACY_STATUS")
    default_category_id: int = Field(default=22, validation_alias="DEFAULT_CATEGORY_ID")
    youtube_api_scope_upload: str = Field(
        default="https://www.googleapis.com/auth/youtube.upload", validation_alias="YOUTUBE_API_SCOPE_UPLOAD"
    )
    youtube_api_scope_readonly: str = Field(
        default="https://www.googleapis.com/auth/youtube.readonly",
        validation_alias="YOUTUBE_API_SCOPE_READONLY",
    )

    # API 프로젝트 인증 상태 (2020년 7월 28일 이후 프로젝트 제한)
    youtube_project_verified: bool = Field(default=True, validation_alias="YOUTUBE_PROJECT_VERIFIED")
    youtube_project_created_after_2020_07_28: bool = Field(
        default=False, validation_alias="YOUTUBE_PROJECT_CREATED_AFTER_2020_07_28"
    )

    # ===========================================
    # Application Metadata
    # ===========================================
    app_name: str = Field(default="YouTube Upload Automation", validation_alias="APP_NAME")
    app_version: str = Field(default="1.0.0", validation_alias="APP_VERSION")
    app_description: str = Field(
        default="시니어 대상 YouTube 콘텐츠 업로드 자동화 시스템", validation_alias="APP_DESCRIPTION"
    )

    # ===========================================
    # Database Configuration
    # ===========================================
    database_url: str = Field(
        default="sqlite:///./backend/youtube_automation.db", validation_alias="DATABASE_URL"
    )

    # ===========================================
    # Development Settings
    # ===========================================
    debug: bool = Field(default=True, validation_alias="DEBUG")
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")

    # ===========================================
    # File Upload Limits
    # ===========================================
    max_video_size_mb: int = Field(default=2048, validation_alias="MAX_VIDEO_SIZE_MB")
    allowed_video_extensions: List[str] = Field(
        default=[".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm"],
        validation_alias="ALLOWED_VIDEO_EXTENSIONS",
    )
    allowed_script_extensions: List[str] = Field(
        default=[".txt", ".md"], validation_alias="ALLOWED_SCRIPT_EXTENSIONS"
    )

    # ===========================================
    # Computed Properties
    # ===========================================
    @property
    def max_video_size_bytes(self) -> int:
        """비디오 파일 최대 크기를 바이트 단위로 반환"""
        return self.max_video_size_mb * 1024 * 1024

    @property
    def youtube_api_scopes(self) -> List[str]:
        """YouTube API 스코프 목록 반환"""
        return [self.youtube_api_scope_upload, self.youtube_api_scope_readonly]

    @property
    def is_unverified_project_restricted(self) -> bool:
        """미인증 프로젝트 업로드 제한 여부 확인"""
        return (
            not self.youtube_project_verified
            and self.youtube_project_created_after_2020_07_28
        )

    @property
    def upload_dir_path(self) -> Path:
        """업로드 디렉토리 Path 객체 반환"""
        return Path(self.upload_dir)

    @property
    def credentials_file_path(self) -> Path:
        """인증 파일 Path 객체 반환"""
        return Path(self.credentials_path)

    @property
    def token_file_path(self) -> Path:
        """토큰 파일 Path 객체 반환"""
        return Path(self.token_path)

    # ===========================================
    # Validators
    # ===========================================
    @field_validator("default_privacy_status")
    @classmethod
    def validate_privacy_status(cls, v):
        """YouTube 공개 설정 검증"""
        valid_statuses = ["private", "unlisted", "public"]
        if v not in valid_statuses:
            raise ValueError(
                f"Invalid privacy status. Must be one of: {valid_statuses}"
            )
        return v

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v):
        """로그 레벨 검증"""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"Invalid log level. Must be one of: {valid_levels}")
        return v.upper()

    @field_validator("backend_port")
    @classmethod
    def validate_port(cls, v):
        """포트 번호 검증"""
        if not 1 <= v <= 65535:
            raise ValueError("Port must be between 1 and 65535")
        return v

    @field_validator("allowed_video_extensions", "allowed_script_extensions")
    @classmethod
    def validate_extensions(cls, v):
        """파일 확장자 형식 검증"""
        for ext in v:
            if not ext.startswith("."):
                raise ValueError(f"File extension must start with '.': {ext}")
        return v

    # ===========================================
    # Pydantic Settings Configuration
    # ===========================================
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8", 
        "case_sensitive": False
    }


# 전역 설정 인스턴스
settings = Settings()


def get_settings() -> Settings:
    """설정 인스턴스를 반환하는 팩토리 함수

    FastAPI Depends에서 사용하기 위한 함수입니다.

    Returns:
        Settings: 애플리케이션 설정 인스턴스
    """
    return settings


def create_directories():
    """필요한 디렉토리들을 생성합니다."""
    settings.upload_dir_path.mkdir(parents=True, exist_ok=True)

    # 로그 디렉토리도 필요하다면 생성
    if settings.debug:
        Path("logs").mkdir(exist_ok=True)


def validate_required_files():
    """필수 파일들의 존재 여부를 확인합니다."""
    required_files = []

    if not settings.credentials_file_path.exists():
        required_files.append(str(settings.credentials_file_path))

    if required_files:
        raise FileNotFoundError(
            f"Required files not found: {', '.join(required_files)}. "
            f"Please check your configuration and ensure these files exist."
        )


# 애플리케이션 시작 시 디렉토리 생성
create_directories()
