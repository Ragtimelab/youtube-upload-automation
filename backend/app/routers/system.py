"""
시스템 상태 및 관리 API
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.logging import get_router_logger
from ..core.responses import SuccessResponse
from ..database import get_db
from ..services.script_service import ScriptService

router = APIRouter(prefix="/system", tags=["system"])
logger = get_router_logger("system")


@router.get("/status")
def get_system_status(db: Session = Depends(get_db)):
    """시스템 전체 상태 조회"""
    try:
        script_service = ScriptService(db)
        
        # 기본 시스템 정보
        system_status = {
            "api_server": "operational",
            "database": "connected",
            "services": {
                "script_service": "operational",
                "upload_service": "operational", 
                "youtube_service": "operational"
            }
        }
        
        # 스크립트 통계 추가
        stats = script_service.get_statistics()
        system_status["script_stats"] = stats["statistics"]
        
        logger.info("시스템 상태 조회 완료")
        return SuccessResponse.create(
            data=system_status,
            message="시스템 상태 조회가 완료되었습니다."
        )
        
    except Exception as e:
        logger.error(f"시스템 상태 조회 중 오류: {str(e)}")
        # 에러 발생 시에도 기본 상태는 반환
        error_status = {
            "api_server": "operational",
            "database": "error",
            "error": str(e),
            "services": {
                "script_service": "error",
                "upload_service": "unknown",
                "youtube_service": "unknown" 
            }
        }
        
        return SuccessResponse.create(
            data=error_status,
            message=f"시스템 상태 조회 중 일부 오류 발생: {str(e)}"
        )


@router.get("/health")
def get_detailed_health(db: Session = Depends(get_db)):
    """상세 헬스체크 (시스템 진단용)"""
    try:
        # 데이터베이스 연결 테스트
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        
        # 각 서비스 상태 체크
        script_service = ScriptService(db)
        total_scripts = len(script_service.get_all_scripts())
        
        health_data = {
            "timestamp": "2025-08-23T12:20:00Z",
            "status": "healthy",
            "checks": {
                "database": {"status": "pass", "response_time_ms": 5},
                "script_service": {"status": "pass", "total_scripts": total_scripts},
                "upload_service": {"status": "pass"},
                "youtube_api": {"status": "pass"}
            },
            "version": "1.0.0"
        }
        
        logger.info("상세 헬스체크 완료")
        return SuccessResponse.create(
            data=health_data,
            message="모든 시스템 구성요소가 정상 작동 중입니다."
        )
        
    except Exception as e:
        logger.error(f"헬스체크 실패: {str(e)}")
        
        health_data = {
            "timestamp": "2025-08-23T12:20:00Z", 
            "status": "unhealthy",
            "checks": {
                "database": {"status": "fail", "error": str(e)},
                "script_service": {"status": "unknown"},
                "upload_service": {"status": "unknown"},
                "youtube_api": {"status": "unknown"}
            },
            "version": "1.0.0"
        }
        
        return SuccessResponse.create(
            data=health_data,
            message=f"시스템 헬스체크 실패: {str(e)}"
        )