"""
전역 에러 핸들링 미들웨어
"""

import logging

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from ..core.exceptions import BaseAppException

logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """전역 에러 핸들링 미들웨어"""

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except BaseAppException as e:
            logger.warning(f"Application error: {e.message}")
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "error": "Application Error",
                    "message": e.message,
                    "status_code": e.status_code,
                },
            )
        except HTTPException as e:
            logger.warning(f"HTTP error: {e.detail}")
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "error": "HTTP Error",
                    "message": e.detail,
                    "status_code": e.status_code,
                },
            )
        except Exception as e:
            logger.error(f"Unhandled error: {str(e)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "message": "예기치 않은 오류가 발생했습니다.",
                    "status_code": 500,
                },
            )


def create_error_response(message: str, status_code: int = 400) -> JSONResponse:
    """표준화된 에러 응답 생성"""
    return JSONResponse(
        status_code=status_code,
        content={
            "error": "Request Error",
            "message": message,
            "status_code": status_code,
        },
    )
