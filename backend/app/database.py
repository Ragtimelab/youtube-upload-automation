from typing import Any, Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from .config import get_settings

# 설정을 통해 데이터베이스 URL 가져오기
settings = get_settings()

engine = create_engine(
    settings.database_url,
    connect_args=(
        {"check_same_thread": False}
        if settings.database_url.startswith("sqlite")
        else {}
    ),
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# SQLAlchemy Base 클래스 (mypy 호환성을 위해 Any로 타입 설정)
Base: Any = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """데이터베이스 세션 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_database() -> None:
    """데이터베이스 초기화 - 테이블 생성"""
    from .models import script  # Import here to avoid circular imports  # noqa: F401

    Base.metadata.create_all(bind=engine)
