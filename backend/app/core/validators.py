"""
유효성 검증 모듈
"""

import os

from fastapi import UploadFile

from ..config import get_settings
from .exceptions import FileValidationError, ValidationError


class FileValidator:
    """파일 검증기"""

    def __init__(self):
        self.settings = get_settings()

    def validate_script_file(self, file: UploadFile) -> None:
        """대본 파일 검증"""
        if not file.filename:
            raise FileValidationError("파일명이 없습니다.")

        # 파일 확장자 검증
        allowed_extensions = [".md"]
        file_extension = (
            "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
        )

        if file_extension not in allowed_extensions:
            raise FileValidationError(
                f"지원되지 않는 파일 형식입니다. 지원 형식: {', '.join(allowed_extensions)}"
            )

    def validate_video_file(self, file: UploadFile) -> None:
        """비디오 파일 검증"""
        if not file.filename:
            raise FileValidationError("파일명이 없습니다.")

        # 파일 확장자 검증
        file_extension = (
            "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
        )

        if file_extension not in self.settings.allowed_video_extensions:
            raise FileValidationError(
                (
                    f"지원되지 않는 비디오 형식입니다. "
                    f"지원 형식: {', '.join(self.settings.allowed_video_extensions)}"
                )
            )

        # 파일 크기 검증 (예상 크기 체크)
        # 실제 파일 크기는 업로드 중에 체크됨
        if hasattr(file, "size") and file.size:
            if file.size > self.settings.max_video_size_bytes:
                raise FileValidationError(
                    f"파일 크기가 너무 큽니다. 최대 크기: {self.settings.max_video_size_mb}MB"
                )

    def validate_file_path(self, file_path: str) -> None:
        """파일 경로 검증"""
        if not file_path:
            raise FileValidationError("파일 경로가 지정되지 않았습니다.")

        if not os.path.exists(file_path):
            raise FileValidationError(f"파일을 찾을 수 없습니다: {file_path}")

        if not os.path.isfile(file_path):
            raise FileValidationError(f"지정된 경로가 파일이 아닙니다: {file_path}")


class ScriptDataValidator:
    """대본 데이터 검증기"""

    @staticmethod
    def validate_parsed_script_data(parsed_data: dict) -> None:
        """파싱된 대본 데이터 검증"""
        required_fields = ["content", "title"]

        for field in required_fields:
            if not parsed_data.get(field):
                raise ValidationError(f"필수 필드가 누락되었습니다: {field}")

        # 제목 길이 제한 (YouTube 제목 최대 100자)
        title = parsed_data.get("title", "")
        if len(title) > 100:
            raise ValidationError("제목이 너무 깁니다. 최대 100자까지 가능합니다.")

        # 설명 길이 제한 (YouTube 설명 최대 5000 바이트)
        description = parsed_data.get("description", "")
        if len(description.encode("utf-8")) > 5000:
            raise ValidationError(
                "설명이 너무 깁니다. 최대 5000 바이트까지 가능합니다."
            )

        # 태그 검증 (YouTube API: 최대 500자)
        tags = parsed_data.get("tags", "")
        if tags and isinstance(tags, str):
            if len(tags) > 500:
                raise ValidationError("태그가 너무 깁니다. 최대 500자까지 가능합니다.")


class YouTubeDataValidator:
    """YouTube 관련 데이터 검증기"""

    @staticmethod
    def validate_privacy_status(privacy_status: str) -> None:
        """공개 설정 검증"""
        valid_statuses = ["private", "unlisted", "public"]
        if privacy_status not in valid_statuses:
            raise ValidationError(
                f"잘못된 공개 설정입니다. 가능한 값: {', '.join(valid_statuses)}"
            )

    @staticmethod
    def validate_category_id(category_id: int) -> None:
        """카테고리 ID 검증"""
        # YouTube 카테고리 ID는 1-44 범위
        if not 1 <= category_id <= 44:
            raise ValidationError(
                "잘못된 카테고리 ID입니다. 1-44 범위의 값을 사용하세요."
            )

    @staticmethod
    def validate_upload_metadata(metadata: dict) -> None:
        """업로드 메타데이터 검증"""
        # 필수 필드 검증
        if not metadata.get("title"):
            raise ValidationError("비디오 제목이 필요합니다.")

        # 제목 길이 검증
        title = metadata["title"]
        if len(title) > 100:
            raise ValidationError("제목이 너무 깁니다. 최대 100자까지 가능합니다.")

        # 설명 길이 검증 (최대 5000 바이트)
        description = metadata.get("description", "")
        if len(description.encode("utf-8")) > 5000:
            raise ValidationError(
                "설명이 너무 깁니다. 최대 5000 바이트까지 가능합니다."
            )

        # 공개 설정 검증
        privacy_status = metadata.get("privacy_status", "private")
        YouTubeDataValidator.validate_privacy_status(privacy_status)

        # 카테고리 ID 검증
        category_id = metadata.get("category_id", 24)
        YouTubeDataValidator.validate_category_id(category_id)

    @staticmethod
    def validate_scheduled_time(scheduled_time: str) -> None:
        """예약 발행 시간 검증"""
        try:
            from datetime import datetime

            datetime.fromisoformat(scheduled_time.replace("Z", "+00:00"))
        except ValueError:
            raise ValidationError(
                "잘못된 날짜 형식입니다. ISO 8601 형식을 사용하세요 (예: 2025-01-20T14:00:00)"
            )


class ScriptStatusValidator:
    """대본 상태 검증기"""

    VALID_STATUSES = ["script_ready", "video_ready", "uploaded", "scheduled", "error"]

    VALID_STATUS_TRANSITIONS = {
        "script_ready": ["video_ready", "error"],
        "video_ready": [
            "uploaded",
            "scheduled",
            "error",
            "script_ready",
        ],  # script_ready는 비디오 파일 삭제시
        "uploaded": [],  # 업로드 완료 상태에서는 변경 불가
        "scheduled": ["uploaded", "error"],  # 예약 -> 업로드 완료 또는 에러
        "error": ["script_ready", "video_ready"],  # 에러에서 복구 가능
    }

    @classmethod
    def validate_status(cls, status: str) -> None:
        """상태 값 검증"""
        if status not in cls.VALID_STATUSES:
            raise ValidationError(
                f"잘못된 상태입니다. 가능한 값: {', '.join(cls.VALID_STATUSES)}"
            )

    @classmethod
    def validate_status_transition(cls, current_status: str, new_status: str) -> None:
        """상태 전환 검증"""
        cls.validate_status(current_status)
        cls.validate_status(new_status)

        if new_status not in cls.VALID_STATUS_TRANSITIONS.get(current_status, []):
            raise ValidationError(
                f"상태 전환이 불가능합니다: {current_status} -> {new_status}"
            )


# 편의를 위한 글로벌 인스턴스
file_validator = FileValidator()
script_data_validator = ScriptDataValidator()
youtube_data_validator = YouTubeDataValidator()
script_status_validator = ScriptStatusValidator()
