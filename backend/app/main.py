from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .config import get_settings
from .core.logging import configure_logging, get_logger
from .database import SessionLocal, engine, get_db
from .middleware.error_handler import ErrorHandlerMiddleware
from .models import script
from .routers import scripts, upload, websocket, schedules, scheduler
from .services.scheduler_service import initialize_scheduler

# 로깅 시스템 초기화
configure_logging()
logger = get_logger("main")

# 설정 로드
settings = get_settings()

# 데이터베이스 테이블 생성
script.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=settings.app_description,
)

# 에러 핸들링 미들웨어 추가
app.add_middleware(ErrorHandlerMiddleware)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(scripts.router)
app.include_router(upload.router)
app.include_router(websocket.router)
app.include_router(schedules.router)
app.include_router(scheduler.router)

# 스케줄러 초기화
try:
    initialize_scheduler()
    logger.info("스케줄러 초기화 완료")
except Exception as e:
    logger.error(f"스케줄러 초기화 실패: {e}")
    # 스케줄러 실패가 앱 시작을 막지 않도록 함


@app.get("/")
def read_root():
    """API 상태 확인"""
    logger.info("루트 엔드포인트 접근")
    return {
        "message": f"{settings.app_name} API",
        "version": settings.app_version,
        "status": "running",
    }


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """헬스체크 엔드포인트"""
    try:
        # 데이터베이스 연결 테스트
        from sqlalchemy import text

        db.execute(text("SELECT 1"))

        logger.info("헬스체크 성공")
        return {"status": "healthy", "database": "connected", "api": "operational"}
    except Exception as e:
        logger.error(f"헬스체크 실패: {str(e)}")
        raise HTTPException(
            status_code=503, detail=f"Database connection failed: {str(e)}"
        )


@app.get("/api/scripts")
def get_scripts(db: Session = Depends(get_db)):
    """등록된 대본 목록 조회 (레거시 엔드포인트)"""
    try:
        from .models.script import Script

        scripts = db.query(Script).all()
        logger.info(f"레거시 대본 목록 조회: {len(scripts)}개")

        return {"scripts": scripts, "count": len(scripts)}
    except Exception as e:
        logger.error(f"레거시 대본 목록 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    logger.info(
        f"서버 시작: host={settings.backend_host}, port={settings.backend_port}"
    )

    uvicorn.run(
        "app.main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=settings.backend_reload,
    )
