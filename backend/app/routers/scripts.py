from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from ..core.exceptions import BaseAppException
from ..core.logging import get_router_logger
from ..core.responses import PaginatedResponse, ScriptResponse, SuccessResponse
from ..core.validators import file_validator
from ..database import get_db
from ..services.script_service import ScriptService

router = APIRouter(prefix="/api/scripts", tags=["scripts"])
logger = get_router_logger("scripts")


@router.post("/upload")
async def upload_script(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """대본 파일 업로드 및 파싱

    지원 파일 형식: .txt, .md
    대본 파일 구조:
    === 대본 ===
    [대본 내용]

    === 메타데이터 ===
    제목: [제목]
    설명: [설명]
    태그: [태그1, 태그2, ...]

    === 썸네일 제작 ===
    텍스트: [썸네일 텍스트]
    ImageFX 프롬프트: [이미지 생성 프롬프트]
    """
    try:
        logger.info(f"대본 파일 업로드 시작: {file.filename}")

        # 파일 검증
        file_validator.validate_script_file(file)

        # 파일 내용 읽기
        content = await file.read()
        content_str = content.decode("utf-8")

        # 서비스를 통해 대본 생성
        script_service = ScriptService(db)
        script = script_service.create_script_from_file(content_str, file.filename)

        logger.info(f"대본 업로드 성공: ID={script.id}, 제목={script.title}")

        return ScriptResponse.created(
            {
                "id": script.id,
                "title": script.title,
                "status": script.status,
                "filename": file.filename,
                "created_at": (
                    script.created_at.isoformat() if script.created_at else None
                ),
            }
        )

    except UnicodeDecodeError:
        logger.error(f"파일 인코딩 오류: {file.filename}")
        raise BaseAppException("파일 인코딩이 UTF-8이 아닙니다.", 400)
    except BaseAppException:
        raise  # 이미 적절한 상태 코드가 설정된 예외는 그대로 전달
    except Exception as e:
        logger.error(f"대본 업로드 중 예기치 않은 오류: {str(e)}")
        raise BaseAppException(f"서버 오류: {str(e)}", 500)


@router.get("/")
def get_scripts(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """등록된 대본 목록 조회

    Args:
        skip: 건너뛸 개수 (페이지네이션)
        limit: 조회할 최대 개수 (기본: 100)
        status: 상태 필터 (script_ready, video_ready, uploaded, error, scheduled)
    """
    try:
        script_service = ScriptService(db)
        result = script_service.get_scripts(skip, limit, status)

        logger.info(f"대본 목록 조회: total={result['total']}, status_filter={status}")
        return PaginatedResponse.create(
            data=result["scripts"],
            total=result["total"],
            skip=skip,
            limit=limit,
            message=f"대본 목록을 조회했습니다. (총 {result['total']}개)",
        )

    except BaseAppException:
        raise
    except Exception as e:
        logger.error(f"대본 목록 조회 중 오류: {str(e)}")
        raise BaseAppException(f"서버 오류: {str(e)}", 500)


@router.get("/{script_id}")
def get_script(script_id: int, db: Session = Depends(get_db)):
    """특정 대본 상세 조회"""
    try:
        script_service = ScriptService(db)
        script_data = script_service.get_script_dict_by_id(script_id)

        logger.info(f"대본 상세 조회: ID={script_id}")
        return SuccessResponse.create(
            data=script_data, message=f"대본을 조회했습니다. (ID: {script_id})"
        )

    except BaseAppException:
        raise
    except Exception as e:
        logger.error(f"대본 상세 조회 중 오류: {str(e)}")
        raise BaseAppException(f"서버 오류: {str(e)}", 500)


@router.put("/{script_id}")
def update_script(
    script_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    thumbnail_text: Optional[str] = Form(None),
    imagefx_prompt: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """대본 정보 수정"""
    try:
        script_service = ScriptService(db)
        script = script_service.update_script(
            script_id=script_id,
            title=title,
            description=description,
            tags=tags,
            thumbnail_text=thumbnail_text,
            imagefx_prompt=imagefx_prompt,
        )

        logger.info(f"대본 정보 수정 완료: ID={script_id}")

        return ScriptResponse.updated(
            {
                "id": script.id,
                "title": script.title,
                "status": script.status,
                "updated_at": (
                    script.updated_at.isoformat() if script.updated_at else None
                ),
            }
        )

    except BaseAppException:
        raise
    except Exception as e:
        logger.error(f"대본 수정 중 오류: {str(e)}")
        raise BaseAppException(f"서버 오류: {str(e)}", 500)


@router.delete("/{script_id}")
def delete_script(script_id: int, db: Session = Depends(get_db)):
    """대본 삭제"""
    try:
        script_service = ScriptService(db)
        result = script_service.delete_script(script_id)

        logger.info(f"대본 삭제 완료: ID={script_id}, 제목={result['title']}")
        return ScriptResponse.deleted(script_id, result["title"])

    except BaseAppException:
        raise
    except Exception as e:
        logger.error(f"대본 삭제 중 오류: {str(e)}")
        raise BaseAppException(f"서버 오류: {str(e)}", 500)


@router.get("/stats/summary")
def get_scripts_stats(db: Session = Depends(get_db)):
    """대본 통계 정보 조회"""
    try:
        script_service = ScriptService(db)
        stats = script_service.get_statistics()

        logger.info("대본 통계 조회 완료")
        return SuccessResponse.create(
            data=stats, message="대본 통계 조회가 완료되었습니다."
        )

    except BaseAppException:
        raise
    except Exception as e:
        logger.error(f"통계 조회 중 오류: {str(e)}")
        raise BaseAppException(f"서버 오류: {str(e)}", 500)
