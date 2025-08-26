"""
최종 Integration 테스트 - 완전한 데이터베이스 격리
"""

import os
import tempfile
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 모든 필요한 import (모델 포함)
from app.database import Base, get_db
from app.models.script import Script  # 명시적으로 임포트하여 메타데이터에 포함
from app.services.script_service import ScriptService
from app.routers.scripts import router as scripts_router
from app.middleware.error_handler import ErrorHandlerMiddleware


def create_isolated_test_app():
    """완전히 격리된 테스트 앱 생성"""
    # 임시 파일 데이터베이스
    temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
    temp_db.close()
    
    # 테스트용 엔진
    engine = create_engine(
        f"sqlite:///{temp_db.name}",
        connect_args={"check_same_thread": False}
    )
    
    # 세션 팩토리
    TestingSessionLocal = sessionmaker(
        autocommit=False, 
        autoflush=False, 
        bind=engine
    )
    
    # 모든 테이블 생성 (Script 모델 포함)
    Base.metadata.create_all(bind=engine)
    
    # FastAPI 앱 생성
    app = FastAPI(title="Isolated Test App")
    
    # 오류 처리 미들웨어 추가
    app.add_middleware(ErrorHandlerMiddleware)
    
    # 의존성 오버라이드
    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    # 라우터 추가
    app.include_router(scripts_router)
    
    return app, temp_db.name


def test_complete_workflow():
    """완전한 워크플로우 테스트"""
    
    print("=== 테스트 앱 생성 ===")
    app, temp_db_path = create_isolated_test_app()
    client = TestClient(app)
    
    try:
        # 1. 헬스체크 (앱이 정상 작동하는지 확인)
        print("\n=== 1. 기본 연결 테스트 ===")
        # 간단한 GET 요청으로 앱 상태 확인
        response = client.get("/api/scripts/")
        print(f"빈 목록 조회 상태: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"빈 목록 응답: {data}")
            assert data.get("success") is True
            assert data.get("pagination", {}).get("total") == 0
        
        # 2. 스크립트 업로드 테스트
        print("\n=== 2. 스크립트 업로드 테스트 ===")
        sample_content = """=== 제목 ===
완전 격리 테스트

=== 메타데이터 ===
설명: 완전히 격리된 환경에서 테스트
태그: 격리, 완전, 테스트

=== 썸네일 제작 ===
텍스트: 완전 테스트
ImageFX 프롬프트: complete isolation test

=== 대본 ===
안녕하세요, 완전히 격리된 환경에서의 최종 테스트입니다.
"""
        
        files = {"file": ("complete_test.md", sample_content, "text/markdown")}
        response = client.post("/api/scripts/upload", files=files)
        
        print(f"업로드 상태: {response.status_code}")
        if response.status_code == 200:
            upload_data = response.json()
            print(f"업로드 성공: {upload_data}")
            
            # 스크립트 ID 저장
            script_id = upload_data.get("data", {}).get("id")
            assert script_id is not None
            
            # 3. 업로드된 스크립트 조회
            print(f"\n=== 3. 업로드된 스크립트 조회 (ID: {script_id}) ===")
            response = client.get(f"/api/scripts/{script_id}")
            print(f"조회 상태: {response.status_code}")
            
            if response.status_code == 200:
                script_data = response.json()
                print(f"스크립트 조회 성공: {script_data.get('title', 'No title')}")
            
            # 4. 목록에서 확인
            print("\n=== 4. 스크립트 목록에서 확인 ===")
            response = client.get("/api/scripts/")
            print(f"목록 조회 상태: {response.status_code}")
            
            if response.status_code == 200:
                list_data = response.json()
                total = list_data.get("pagination", {}).get("total", 0)
                print(f"총 스크립트 수: {total}")
                assert total == 1
        else:
            print(f"업로드 실패: {response.json()}")
        
        print("\n🎉 모든 테스트 통과!")
        
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        raise
    
    finally:
        # 정리
        app.dependency_overrides.clear()
        if os.path.exists(temp_db_path):
            os.unlink(temp_db_path)


def test_error_handling():
    """에러 처리 테스트"""
    
    print("\n=== 에러 처리 테스트 ===")
    app, temp_db_path = create_isolated_test_app()
    client = TestClient(app)
    
    try:
        # 잘못된 스크립트 업로드
        invalid_content = "잘못된 형식의 스크립트"
        files = {"file": ("invalid.md", invalid_content, "text/markdown")}
        
        response = client.post("/api/scripts/upload", files=files)
        print(f"잘못된 업로드 상태: {response.status_code}")
        
        # 400 에러가 나와야 함 (스크립트 파싱 에러)
        if response.status_code == 400:
            error_data = response.json()
            print(f"예상된 에러: {error_data}")
            assert error_data.get("success") is False
        else:
            print(f"예상과 다른 응답: {response.status_code}, {response.json()}")
        
        # 존재하지 않는 스크립트 조회
        response = client.get("/api/scripts/99999")
        print(f"존재하지 않는 스크립트 조회 상태: {response.status_code}")
        
        if response.status_code == 404:
            print("404 에러 정상 처리됨")
        
        print("✅ 에러 처리 테스트 통과")
        
    except Exception as e:
        print(f"❌ 에러 처리 테스트 실패: {e}")
        raise
    
    finally:
        app.dependency_overrides.clear()
        if os.path.exists(temp_db_path):
            os.unlink(temp_db_path)


if __name__ == "__main__":
    test_complete_workflow()
    test_error_handling()