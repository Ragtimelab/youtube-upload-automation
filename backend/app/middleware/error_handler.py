"""
전역 에러 핸들링 미들웨어
"""

from typing import Optional

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from ..core.exceptions import BaseAppException, ValidationError
from ..core.logging import get_logger
from ..core.responses import ErrorResponse, ValidationErrorResponse

logger = get_logger("error_handler")


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """전역 에러 핸들링 미들웨어"""

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except BaseAppException as e:
            logger.warning(f"Application error: {e.message} (path: {request.url.path})")

            # 에러 타입별 응답 처리
            if isinstance(e, ValidationError):
                error_response: ErrorResponse = ValidationErrorResponse.create(
                    e.message
                )
            else:
                error_response = ErrorResponse.create(
                    message=e.message, error_code=e.__class__.__name__
                )

            return JSONResponse(
                status_code=e.status_code, content=error_response.model_dump()
            )
        except HTTPException as e:
            logger.warning(f"HTTP error: {e.detail} (path: {request.url.path})")
            http_error_response = ErrorResponse.create(
                message=str(e.detail), error_code="HTTP_EXCEPTION"
            )
            return JSONResponse(
                status_code=e.status_code, content=http_error_response.model_dump()
            )
        except Exception as e:
            logger.error(
                f"Unhandled error: {str(e)} (path: {request.url.path})", exc_info=True
            )
            general_error_response = ErrorResponse.create(
                message="예기치 않은 서버 오류가 발생했습니다.",
                error_code="INTERNAL_SERVER_ERROR",
                error_details=(
                    {"original_error": str(e)} if logger.level <= 10 else None
                ),  # DEBUG 레벨에서만 상세 에러 포함
            )
            return JSONResponse(
                status_code=500, content=general_error_response.model_dump()
            )


def create_error_response(
    message: str, status_code: int = 400, error_code: Optional[str] = None
) -> JSONResponse:
    """표준화된 에러 응답 생성"""
    error_response = ErrorResponse.create(
        message=message, error_code=error_code or "REQUEST_ERROR"
    )
    return JSONResponse(status_code=status_code, content=error_response.model_dump())
