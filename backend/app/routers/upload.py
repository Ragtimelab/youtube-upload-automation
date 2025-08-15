from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from ..core.exceptions import BaseAppException
from ..core.logging import get_router_logger
from ..database import get_db
from ..services.upload_service import UploadService

router = APIRouter(prefix="/api/upload", tags=["upload"])
logger = get_router_logger("upload")


@router.post("/video/{script_id}")
async def upload_video_file(
    script_id: int, video_file: UploadFile = File(...), db: Session = Depends(get_db)
):
    """영상 파일 업로드 및 대본과 매칭

    Args:
        script_id: 연결할 대본 ID
        video_file: 업로드할 비디오 파일
    """
    try:
        logger.info(
            f"비디오 파일 업로드 시작: script_id={script_id}, 파일명={video_file.filename}"
        )

        upload_service = UploadService(db)
        result = upload_service.upload_video_file(script_id, video_file)

        logger.info(
            f"비디오 파일 업로드 성공: script_id={script_id}, 파일크기={result['file_size']}"
        )
        return result

    except BaseAppException:
        raise
    except Exception as e:
        logger.error(f"비디오 파일 업로드 중 예기치 않은 오류: {str(e)}")
        raise BaseAppException(f"서버 오류: {str(e)}", 500)


@router.post("/youtube/{script_id}")
async def upload_to_youtube(
    script_id: int,
    scheduled_time: Optional[str] = Form(None),
    privacy_status: Optional[str] = Form(None),
    category_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    """YouTube에 비디오 업로드

    Args:
        script_id: 업로드할 대본 ID
        scheduled_time: 예약 발행 시간 (ISO 8601 형식, 선택사항)
        privacy_status: 공개 설정 (private, unlisted, public)
        category_id: YouTube 카테고리 ID (기본: 22 - People & Blogs)
    """
    try:
        logger.info(f"YouTube 업로드 시작: script_id={script_id}")

        upload_service = UploadService(db)
        result = upload_service.upload_to_youtube(
            script_id=script_id,
            scheduled_time=scheduled_time,
            privacy_status=privacy_status,
            category_id=category_id,
        )

        logger.info(
            f"YouTube 업로드 성공: script_id={script_id}, video_id={result['youtube_video_id']}"
        )
        return result

    except BaseAppException:
        raise
    except Exception as e:
        logger.error(f"YouTube 업로드 중 예기치 않은 오류: {str(e)}")
        raise BaseAppException(f"서버 오류: {str(e)}", 500)


@router.get("/status/{script_id}")
def get_upload_status(script_id: int, db: Session = Depends(get_db)):
    """업로드 상태 조회

    Args:
        script_id: 대본 ID

    Returns:
        업로드 상태 정보
    """
    try:
        upload_service = UploadService(db)
        result = upload_service.get_upload_status(script_id)

        logger.info(
            f"업로드 상태 조회: script_id={script_id}, status={result['status']}"
        )
        return result

    except BaseAppException:
        raise
    except Exception as e:
        logger.error(f"업로드 상태 조회 중 오류: {str(e)}")
        raise BaseAppException(f"서버 오류: {str(e)}", 500)


@router.delete("/video/{script_id}")
def delete_video_file(script_id: int, db: Session = Depends(get_db)):
    """업로드된 비디오 파일 삭제

    Args:
        script_id: 대본 ID

    Note:
        YouTube에 이미 업로드된 경우 파일만 삭제하고 YouTube 비디오는 유지됩니다.
    """
    try:
        logger.info(f"비디오 파일 삭제 시작: script_id={script_id}")

        upload_service = UploadService(db)
        result = upload_service.delete_video_file(script_id)

        logger.info(f"비디오 파일 삭제 완료: script_id={script_id}")
        return result

    except BaseAppException:
        raise
    except Exception as e:
        logger.error(f"비디오 파일 삭제 중 오류: {str(e)}")
        raise BaseAppException(f"서버 오류: {str(e)}", 500)
