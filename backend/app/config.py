"""
설정 관리 모듈

환경 변수를 통해 애플리케이션 설정을 관리합니다.
Pydantic Settings를 사용하여 타입 안전성과 검증을 제공합니다.
"""

from pathlib import Path
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

from .core.constants import (
    FileConstants,
    NetworkConstants,
    PathConstants,
    YouTubeConstants,
)

# 프로젝트 루트 디렉토리 계산 (app/config.py -> 프로젝트 루트)
PROJECT_ROOT = Path(__file__).parent.parent.parent


class Settings(BaseSettings):
    """애플리케이션 설정 클래스

    환경 변수(.env 파일 포함)에서 설정을 로드하고 검증합니다.
    """

    # ===========================================
    # Server Configuration
    # ===========================================
    backend_host: str = Field(
        default=NetworkConstants.DEFAULT_API_HOST, validation_alias="BACKEND_HOST"
    )
    backend_port: int = Field(
        default=NetworkConstants.DEFAULT_API_PORT, validation_alias="BACKEND_PORT"
    )
    backend_reload: bool = Field(default=True, validation_alias="BACKEND_RELOAD")

    # Frontend Configuration
    frontend_url: str = Field(
        default="http://localhost:3000", validation_alias="FRONTEND_URL"
    )
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5174", "http://127.0.0.1:5174"],
        validation_alias="CORS_ORIGINS",
    )

    # Gradio Web Interface Configuration
    gradio_port: int = Field(default=7860, validation_alias="GRADIO_PORT")
    gradio_host: str = Field(default="0.0.0.0", validation_alias="GRADIO_HOST")
    gradio_share: bool = Field(default=False, validation_alias="GRADIO_SHARE")
    gradio_inbrowser: bool = Field(default=True, validation_alias="GRADIO_INBROWSER")
    gradio_theme: str = Field(default="soft", validation_alias="GRADIO_THEME")

    # ===========================================
    # File Paths & Storage
    # ===========================================
    upload_dir: str = Field(
        default=PathConstants.DEFAULT_UPLOAD_DIR, validation_alias="UPLOAD_DIR"
    )
    credentials_path: str = Field(
        default=str(PROJECT_ROOT / PathConstants.CREDENTIALS_RELATIVE_PATH),
        validation_alias="CREDENTIALS_PATH",
    )
    token_path: str = Field(
        default=str(PROJECT_ROOT / PathConstants.TOKEN_RELATIVE_PATH),
        validation_alias="TOKEN_PATH",
    )

    # ===========================================
    # YouTube API Configuration
    # ===========================================
    default_privacy_status: str = Field(
        default=YouTubeConstants.DEFAULT_PRIVACY_STATUS,
        validation_alias="DEFAULT_PRIVACY_STATUS",
    )
    default_category_id: int = Field(
        default=YouTubeConstants.DEFAULT_CATEGORY_ID,
        validation_alias="DEFAULT_CATEGORY_ID",
    )
    youtube_api_scope_upload: str = Field(
        default="https://www.googleapis.com/auth/youtube.upload",
        validation_alias="YOUTUBE_API_SCOPE_UPLOAD",
    )
    youtube_api_scope_readonly: str = Field(
        default="https://www.googleapis.com/auth/youtube.readonly",
        validation_alias="YOUTUBE_API_SCOPE_READONLY",
    )

    # API 프로젝트 인증 상태 (2020년 7월 28일 이후 프로젝트 제한)
    youtube_project_verified: bool = Field(
        default=True, validation_alias="YOUTUBE_PROJECT_VERIFIED"
    )
    youtube_project_created_after_2020_07_28: bool = Field(
        default=False, validation_alias="YOUTUBE_PROJECT_CREATED_AFTER_2020_07_28"
    )

    # ===========================================
    # Application Metadata
    # ===========================================
    app_name: str = Field(
        default="YouTube Upload Automation", validation_alias="APP_NAME"
    )
    app_version: str = Field(default="1.0.0", validation_alias="APP_VERSION")
    app_description: str = Field(
        default="1인 개발자를 위한 YouTube 콘텐츠 업로드 자동화 시스템",
        validation_alias="APP_DESCRIPTION",
    )

    # ===========================================
    # Database Configuration
    # ===========================================
    database_url: str = Field(
        default=f"sqlite:///{PROJECT_ROOT}/backend/youtube_automation.db",
        validation_alias="DATABASE_URL",
    )

    # ===========================================
    # Development Settings
    # ===========================================
    debug: bool = Field(default=True, validation_alias="DEBUG")
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")

    # ===========================================
    # File Upload Limits (YouTube FHD 최적화 권장사항)
    # ===========================================
    max_video_size_mb: int = Field(
        default=FileConstants.MAX_VIDEO_SIZE_MB, validation_alias="MAX_VIDEO_SIZE_MB"
    )
    allowed_video_extensions: List[str] = Field(
        default=FileConstants.ALLOWED_VIDEO_EXTENSIONS,
        validation_alias="ALLOWED_VIDEO_EXTENSIONS",
    )
    allowed_script_extensions: List[str] = Field(
        default=FileConstants.ALLOWED_SCRIPT_EXTENSIONS,
        validation_alias="ALLOWED_SCRIPT_EXTENSIONS",
    )

    # ===========================================
    # YouTube FHD 최적화 권장사항 (2025)
    # ===========================================
    # Video: H.264, 1920×1080, 8Mbps@30fps/12Mbps@60fps
    # Audio: AAC-LC, 48kHz, 128kbps, Stereo
    # GOP: 2초 간격, VBR 2-Pass 권장
    recommended_video_bitrate_mbps: int = Field(
        default=FileConstants.RECOMMENDED_VIDEO_BITRATE_MBPS,
        validation_alias="RECOMMENDED_VIDEO_BITRATE_MBPS",
    )
    recommended_audio_bitrate_kbps: int = Field(
        default=FileConstants.RECOMMENDED_AUDIO_BITRATE_KBPS,
        validation_alias="RECOMMENDED_AUDIO_BITRATE_KBPS",
    )
    max_video_duration_hours: int = Field(
        default=FileConstants.MAX_VIDEO_DURATION_HOURS,
        validation_alias="MAX_VIDEO_DURATION_HOURS",
    )

    # ===========================================
    # Computed Properties
    # ===========================================
    @property
    def max_video_size_bytes(self) -> int:
        """비디오 파일 최대 크기를 바이트 단위로 반환"""
        return self.max_video_size_mb * FileConstants.BYTES_PER_MB

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
        if v not in YouTubeConstants.PRIVACY_STATUSES:
            raise ValueError(
                f"Invalid privacy status. Must be one of: "
                f"{YouTubeConstants.PRIVACY_STATUSES}"
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

    @field_validator("backend_port", "gradio_port")
    @classmethod
    def validate_port(cls, v):
        """포트 번호 검증"""
        if not 1 <= v <= 65535:
            raise ValueError("Port must be between 1 and 65535")
        return v

    @field_validator("gradio_theme")
    @classmethod
    def validate_gradio_theme(cls, v):
        """Gradio 테마 검증"""
        valid_themes = [
            "default",
            "huggingface",
            "grass",
            "peach",
            "base",
            "soft",
            "monochrome",
        ]
        if v not in valid_themes:
            raise ValueError(f"Invalid Gradio theme. Must be one of: {valid_themes}")
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
        "case_sensitive": False,
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

    credentials_path = settings.credentials_file_path
    if not credentials_path.exists():
        required_files.append(
            f"{credentials_path} (절대경로: {credentials_path.absolute()})"
        )

    if required_files:
        print(f"🔍 프로젝트 루트: {PROJECT_ROOT}")
        print(f"🔍 백엔드 secrets 디렉토리: {PROJECT_ROOT / 'backend/secrets'}")
        print(f"🔍 credentials.json 경로: {credentials_path}")
        print(f"🔍 파일 존재 여부: {credentials_path.exists()}")

        raise FileNotFoundError(
            f"Required files not found: {', '.join(required_files)}. "
            f"Please check your configuration and ensure these files exist."
        )


# 애플리케이션 시작 시 디렉토리 생성
create_directories()
