"""
테스트용 FastAPI 애플리케이션 팩토리
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import get_settings
from app.core.logging import configure_logging
from app.database import Base, get_db
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.routers import scripts, upload, websocket


def create_test_app():
    """테스트용 FastAPI 애플리케이션 생성"""
    
    # 로깅 시스템 초기화 (테스트용)
    configure_logging()
    
    # 설정 로드
    settings = get_settings()
    
    # FastAPI 애플리케이션 생성 (데이터베이스 초기화 없이)
    app = FastAPI(
        title=f"{settings.app_name} (Test)",
        version=settings.app_version,
        description=f"{settings.app_description} - Test Environment",
    )
    
    # 에러 핸들링 미들웨어 추가
    app.add_middleware(ErrorHandlerMiddleware)
    
    # CORS 설정
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 테스트용으로 모든 origin 허용
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 라우터 등록
    app.include_router(scripts.router)
    app.include_router(upload.router) 
    app.include_router(websocket.router)
    
    # 헬스 체크 엔드포인트
    @app.get("/")
    def read_root():
        return {
            "app_name": "YouTube Upload Automation (Test)",
            "version": settings.app_version,
            "status": "healthy"
        }
    
    @app.get("/health")
    def health_check():
        return {
            "status": "healthy",
            "database": "test_sqlite",
            "environment": "test"
        }
    
    return app


def setup_test_database():
    """테스트용 데이터베이스 설정"""
    # 테스트용 인메모리 데이터베이스 엔진 생성
    engine = create_engine(
        "sqlite:///:memory:", 
        connect_args={"check_same_thread": False}
    )
    
    # 세션 로컬 클래스 생성
    TestingSessionLocal = sessionmaker(
        autocommit=False, 
        autoflush=False, 
        bind=engine
    )
    
    # 모든 모델들을 명시적으로 import (metadata 등록)
    from app.models.script import Script  # noqa: F401
    
    # 테이블 생성
    Base.metadata.create_all(bind=engine)
    
    # 데이터베이스 세션 의존성 오버라이드 함수
    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()
    
    return engine, TestingSessionLocal, override_get_db