"""
표준화된 API 응답 모델들
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, field_serializer


class BaseResponse(BaseModel):
    """기본 API 응답 모델"""

    success: bool
    message: str
    timestamp: datetime = None

    def __init__(self, **data):
        if "timestamp" not in data:
            data["timestamp"] = datetime.now(timezone.utc)
        super().__init__(**data)

    @field_serializer("timestamp")
    def serialize_timestamp(self, value: datetime) -> Optional[str]:
        """datetime을 ISO 형식 문자열로 직렬화"""
        return value.isoformat() if value else None


class SuccessResponse(BaseResponse):
    """성공 응답 모델"""

    success: bool = True
    data: Optional[Any] = None

    @classmethod
    def create(
        cls, message: str = "작업이 성공적으로 완료되었습니다.", data: Any = None
    ) -> "SuccessResponse":
        return cls(message=message, data=data)


class ErrorResponse(BaseResponse):
    """에러 응답 모델"""

    success: bool = False
    error_code: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None

    @classmethod
    def create(
        cls, message: str, error_code: str = None, error_details: Dict[str, Any] = None
    ) -> "ErrorResponse":
        return cls(message=message, error_code=error_code, error_details=error_details)


class ValidationErrorResponse(ErrorResponse):
    """검증 에러 응답 모델"""

    error_code: str = "VALIDATION_ERROR"
    validation_errors: List[Dict[str, str]] = []

    @classmethod
    def create(
        cls,
        message: str = "입력 데이터 검증에 실패했습니다.",
        validation_errors: List[Dict[str, str]] = None,
    ) -> "ValidationErrorResponse":
        return cls(message=message, validation_errors=validation_errors or [])


class PaginatedResponse(SuccessResponse):
    """페이징된 응답 모델"""

    pagination: Dict[str, Any]

    @classmethod
    def create(
        cls,
        data: List[Any],
        total: int,
        skip: int = 0,
        limit: int = 100,
        message: str = "조회가 완료되었습니다.",
    ) -> "PaginatedResponse":
        return cls(
            message=message,
            data=data,
            pagination={
                "total": total,
                "count": len(data),
                "skip": skip,
                "limit": limit,
                "has_more": skip + len(data) < total,
            },
        )


class ScriptResponse(SuccessResponse):
    """스크립트 관련 응답 모델"""

    @classmethod
    def created(cls, script_data: Dict[str, Any]) -> "ScriptResponse":
        return cls.create(
            message="대본이 성공적으로 업로드되었습니다.", data=script_data
        )

    @classmethod
    def updated(cls, script_data: Dict[str, Any]) -> "ScriptResponse":
        return cls.create(message="대본이 성공적으로 수정되었습니다.", data=script_data)

    @classmethod
    def deleted(cls, script_id: int, title: str) -> "ScriptResponse":
        return cls.create(
            message=f"대본 '{title}'이 성공적으로 삭제되었습니다.",
            data={"id": script_id, "title": title},
        )


class UploadResponse(SuccessResponse):
    """업로드 관련 응답 모델"""

    @classmethod
    def video_uploaded(cls, upload_data: Dict[str, Any]) -> "UploadResponse":
        return cls.create(
            message="비디오가 성공적으로 업로드되었습니다.", data=upload_data
        )

    @classmethod
    def youtube_uploaded(cls, youtube_data: Dict[str, Any]) -> "UploadResponse":
        return cls.create(
            message="YouTube 업로드가 성공적으로 완료되었습니다.", data=youtube_data
        )

    @classmethod
    def progress_update(cls, progress_data: Dict[str, Any]) -> "UploadResponse":
        return cls.create(
            message="업로드 진행률이 업데이트되었습니다.", data=progress_data
        )


class BatchUploadResponse(SuccessResponse):
    """배치 업로드 응답 모델"""

    @classmethod
    def batch_completed(cls, batch_data: Dict[str, Any]) -> "BatchUploadResponse":
        success_count = batch_data.get('summary', {}).get('success_count', 0)
        failed_count = batch_data.get('summary', {}).get('failed_count', 0)
        total_count = success_count + failed_count
        
        message = f"배치 업로드 완료: {success_count}/{total_count}개 성공"
        if failed_count > 0:
            message += f", {failed_count}개 실패"
        
        return cls.create(message=message, data=batch_data)


class HealthCheckResponse(SuccessResponse):
    """헬스체크 응답 모델"""

    services: Dict[str, str]

    @classmethod
    def healthy(cls, services: Dict[str, str] = None) -> "HealthCheckResponse":
        return cls(
            message="시스템이 정상 동작 중입니다.",
            services=services or {"api": "healthy", "database": "connected"},
        )

    @classmethod
    def unhealthy(
        cls,
        services: Dict[str, str] = None,
        message: str = "시스템에 문제가 발생했습니다.",
    ) -> "HealthCheckResponse":
        response = cls(
            success=False,
            message=message,
            services=services or {"api": "error", "database": "disconnected"},
        )
        return response


# CLI 친화적 응답 변환 함수들
def to_cli_friendly_message(response: Union[SuccessResponse, ErrorResponse]) -> str:
    """API 응답을 CLI 친화적 메시지로 변환"""
    if response.success:
        return f"✅ {response.message}"
    else:
        return f"❌ {response.message}"


def extract_error_details(response: ErrorResponse) -> Dict[str, Any]:
    """에러 응답에서 상세 정보 추출"""
    details = {
        "message": response.message,
        "timestamp": response.timestamp.isoformat() if response.timestamp else None,
    }

    if response.error_code:
        details["error_code"] = response.error_code

    if response.error_details:
        details.update(response.error_details)

    if hasattr(response, "validation_errors") and response.validation_errors:
        details["validation_errors"] = response.validation_errors

    return details
