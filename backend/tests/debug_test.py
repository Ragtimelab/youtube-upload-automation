"""
디버깅용 테스트 파일
"""

import pytest
from fastapi.testclient import TestClient
from tests.test_app import create_test_app, setup_test_database
from app.database import get_db


def test_debug_database_setup():
    """데이터베이스 의존성 오버라이드가 제대로 작동하는지 테스트"""
    
    # 테스트용 앱 생성
    app = create_test_app()
    
    # 테스트용 데이터베이스 설정
    engine, TestingSessionLocal, override_get_db = setup_test_database()
    
    # 의존성 재정의
    app.dependency_overrides[get_db] = override_get_db
    
    print(f"App dependency overrides: {app.dependency_overrides}")
    print(f"get_db function: {get_db}")
    print(f"override function: {override_get_db}")
    
    # TestClient 생성
    client = TestClient(app)
    
    # 헬스체크 테스트
    response = client.get("/health")
    print(f"Health check response: {response.json()}")
    assert response.status_code == 200
    
    # 데이터베이스에 직접 접근해보기
    db_session = next(override_get_db())
    print(f"Database session: {db_session}")
    
    # 테이블 존재 여부 확인
    from app.models.script import Script
    from sqlalchemy import text
    with db_session.bind.connect() as conn:
        tables = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';")).fetchall()
    print(f"Available tables: {tables}")
    
    db_session.close()
    
    # 스크립트 업로드 시도
    sample_content = """=== 대본 ===
안녕하세요, 테스트입니다.

=== 메타데이터 ===
제목: 테스트 제목
설명: 테스트 설명
태그: 테스트, 디버깅

=== 썸네일 제작 ===
텍스트: 테스트 텍스트
ImageFX 프롬프트: test prompt
"""
    
    files = {"file": ("debug_test.txt", sample_content, "text/plain")}
    response = client.post("/api/scripts/upload", files=files)
    
    print(f"Upload response status: {response.status_code}")
    print(f"Upload response body: {response.text}")
    
    # 의존성 정리
    app.dependency_overrides.clear()


if __name__ == "__main__":
    test_debug_database_setup()