"""
간단한 integration 테스트 (완전히 격리된 환경)
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 최소한의 import만 사용
from app.database import Base, get_db
from app.models.script import Script
from app.routers.scripts import router as scripts_router


def test_isolated_script_upload():
    """완전히 격리된 환경에서 스크립트 업로드 테스트"""
    
    # 1. 테스트용 FastAPI 앱 생성 (최소한)
    app = FastAPI(title="Test App")
    app.include_router(scripts_router)
    
    # 2. 테스트용 인메모리 데이터베이스
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # 3. 테이블 생성 (Script 모델만)
    Base.metadata.create_all(bind=engine)
    
    # 4. 의존성 오버라이드
    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    # 5. TestClient 생성
    client = TestClient(app)
    
    # 6. 샘플 스크립트 데이터
    sample_content = """=== 제목 ===
격리 테스트 제목

=== 메타데이터 ===
설명: 격리된 환경에서 테스트
태그: 격리, 테스트

=== 썸네일 제작 ===
텍스트: 테스트 썸네일
ImageFX 프롬프트: isolated test

=== 대본 ===
안녕하세요, 격리된 환경에서의 테스트입니다.
"""
    
    # 7. 업로드 요청
    files = {"file": ("isolated_test.txt", sample_content, "text/plain")}
    response = client.post("/api/scripts/upload", files=files)
    
    # 8. 결과 확인
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.json()}")
    
    # 9. 데이터베이스 직접 확인
    db_session = TestingSessionLocal()
    scripts = db_session.query(Script).all()
    print(f"Scripts in database: {len(scripts)}")
    for script in scripts:
        print(f"Script ID: {script.id}, Title: {script.title}")
    db_session.close()
    
    # 10. 의존성 정리
    app.dependency_overrides.clear()
    
    # 11. 어서트
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert "격리 테스트 제목" in str(data)


if __name__ == "__main__":
    test_isolated_script_upload()