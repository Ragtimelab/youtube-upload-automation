"""
JSON 직렬화 수정 검증 테스트
"""

import os
import tempfile
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.models.script import Script
from app.routers.scripts import router as scripts_router
from app.middleware.error_handler import ErrorHandlerMiddleware


def test_json_serialization_fixed():
    """JSON 직렬화 문제가 해결되었는지 확인"""
    
    # 테스트 앱 생성
    temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
    temp_db.close()
    
    engine = create_engine(f"sqlite:///{temp_db.name}")
    TestingSessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    app = FastAPI(title="JSON Serialization Test")
    app.add_middleware(ErrorHandlerMiddleware)
    
    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    app.include_router(scripts_router, prefix="/api")
    
    client = TestClient(app)
    
    try:
        print("=== JSON 직렬화 테스트 ===")
        
        # 1. 스크립트 업로드
        sample_content = """=== 제목 ===
JSON 직렬화 테스트

=== 메타데이터 ===
설명: JSON 직렬화 문제 해결 확인
태그: JSON, 직렬화, 테스트

=== 썸네일 제작 ===
텍스트: JSON 테스트
ImageFX 프롬프트: json serialization test

=== 대본 ===
JSON 직렬화가 정상적으로 작동하는지 확인하는 테스트입니다.
"""
        
        files = {"file": ("json_test.md", sample_content, "text/markdown")}
        response = client.post("/api/scripts/upload", files=files)
        
        print(f"1. 업로드 상태: {response.status_code}")
        assert response.status_code == 200
        
        upload_data = response.json()
        script_id = upload_data["data"]["id"]
        print(f"   업로드된 스크립트 ID: {script_id}")
        print(f"   제목: {upload_data['data']['title']}")
        
        # 2. 단일 스크립트 조회 (JSON 직렬화 테스트)
        print(f"\n2. 단일 스크립트 조회 (ID: {script_id})")
        response = client.get(f"/api/scripts/{script_id}")
        
        print(f"   조회 상태: {response.status_code}")
        assert response.status_code == 200
        
        script_data = response.json()
        print(f"   응답 구조: {list(script_data.keys())}")
        print(f"   제목: {script_data['data']['title']}")
        print(f"   상태: {script_data['data']['status']}")
        print(f"   생성일: {script_data['data']['created_at']}")
        
        # 3. 스크립트 목록 조회 (JSON 직렬화 테스트)
        print(f"\n3. 스크립트 목록 조회")
        response = client.get("/api/scripts/")
        
        print(f"   목록 조회 상태: {response.status_code}")
        assert response.status_code == 200
        
        list_data = response.json()
        print(f"   총 개수: {list_data['pagination']['total']}")
        print(f"   첫 번째 스크립트 제목: {list_data['data'][0]['title']}")
        print(f"   응답 데이터 키: {list(list_data['data'][0].keys())}")
        
        # 4. 상태별 필터링 테스트
        print(f"\n4. 상태별 필터링 테스트")
        response = client.get("/api/scripts/?status=script_ready")
        
        print(f"   필터링 상태: {response.status_code}")
        assert response.status_code == 200
        
        filtered_data = response.json()
        print(f"   필터된 개수: {filtered_data['pagination']['total']}")
        
        print("\n✅ 모든 JSON 직렬화 테스트 통과!")
        
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        raise
    
    finally:
        app.dependency_overrides.clear()
        if os.path.exists(temp_db.name):
            os.unlink(temp_db.name)


if __name__ == "__main__":
    test_json_serialization_fixed()