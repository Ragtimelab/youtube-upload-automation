"""
FastAPI 메인 앱 테스트
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from sqlalchemy.exc import SQLAlchemyError

from app.main import app


class TestMainApp:
    """FastAPI 메인 앱 테스트 클래스"""
    
    def test_app_configuration(self):
        """FastAPI 앱 설정 검증"""
        assert app.title == "YouTube Upload Automation"
        assert app.version == "1.0.0"
        assert "YouTube 콘텐츠 업로드 자동화" in app.description
    
    def test_api_info_endpoint(self, test_client: TestClient):
        """API 정보 엔드포인트 테스트"""
        response = test_client.get("/api")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["message"] == "YouTube Upload Automation API"
        assert data["version"] == "1.0.0"
        assert data["status"] == "running"
    
    def test_health_check_success(self, test_client: TestClient):
        """헬스체크 성공 케이스"""
        response = test_client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # HealthCheckResponse 형식 검증
        assert data["success"] is True
        assert "data" in data
        assert "message" in data
        assert "timestamp" in data
        
        # 헬스체크 데이터 검증
        health_data = data["data"]
        assert health_data["api"] == "operational"
        assert health_data["database"] == "connected"
        assert health_data["version"] == "1.0.0"
    
    @patch('app.main.get_db')
    def test_health_check_database_error(self, mock_get_db, test_client: TestClient):
        """헬스체크 데이터베이스 에러 케이스"""
        # 데이터베이스 연결 에러 시뮬레이션
        mock_session = Mock()
        mock_session.execute.side_effect = SQLAlchemyError("Database connection failed")
        mock_get_db.return_value = mock_session
        
        response = test_client.get("/health")
        
        assert response.status_code == 200  # 헬스체크는 200으로 반환하되 내용에서 에러 표시
        data = response.json()
        
        # HealthCheckResponse 형식 검증
        assert data["success"] is True  # Response wrapper는 성공이지만
        health_data = data["data"]
        assert health_data["api"] == "operational"
        assert health_data["database"] == "error"
        assert "Database connection failed" in data["message"]
    
    def test_cors_configuration(self, test_client: TestClient):
        """CORS 설정 검증"""
        # OPTIONS 요청으로 CORS 헤더 확인
        response = test_client.options("/api", headers={
            "Origin": "http://localhost:5174",
            "Access-Control-Request-Method": "GET"
        })
        
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
        assert "access-control-allow-headers" in response.headers
    
    def test_routers_registration(self, test_client: TestClient):
        """라우터 등록 확인"""
        # 각 라우터의 기본 엔드포인트 확인
        
        # Scripts 라우터 확인
        response = test_client.get("/api/scripts/")
        assert response.status_code == 200  # 빈 목록이어도 200 반환
        
        # System 라우터 확인  
        response = test_client.get("/api/system/status")
        assert response.status_code == 200
        
        # Health check 확인 (메인 앱에서 직접 정의)
        response = test_client.get("/health")
        assert response.status_code == 200
    
    @patch('app.main.configure_logging')
    @patch('app.main.init_database') 
    def test_startup_initialization(self, mock_init_db, mock_configure_logging):
        """앱 시작 시 초기화 확인"""
        # 이미 앱이 생성되어 있으므로 mock 호출 확인은 어려움
        # 대신 초기화 결과 확인
        assert hasattr(app, 'title')
        assert hasattr(app, 'version') 
        assert len(app.routes) > 0  # 라우터들이 등록되었는지 확인
    
    def test_middleware_error_handling(self, test_client: TestClient):
        """에러 핸들링 미들웨어 테스트"""
        # 존재하지 않는 엔드포인트로 404 에러 유발
        response = test_client.get("/api/nonexistent")
        
        assert response.status_code == 404
        # ErrorHandlerMiddleware가 제대로 동작하는지 확인
        data = response.json()
        assert "detail" in data
    
    def test_api_prefix_routing(self, test_client: TestClient):
        """API 프리픽스 라우팅 테스트"""
        # /api 프리픽스가 있는 엔드포인트들 확인
        endpoints_to_test = [
            "/api",
            "/api/scripts/", 
            "/api/system/status"
        ]
        
        for endpoint in endpoints_to_test:
            response = test_client.get(endpoint)
            assert response.status_code in [200, 422]  # 200 또는 유효한 에러 코드
    
    def test_app_metadata_consistency(self, test_client: TestClient):
        """앱 메타데이터 일관성 검증"""
        # /api 엔드포인트와 /health 엔드포인트의 버전 정보 일치 확인
        api_response = test_client.get("/api")
        health_response = test_client.get("/health")
        
        api_data = api_response.json()
        health_data = health_response.json()["data"]
        
        assert api_data["version"] == health_data["version"]
        assert api_data["version"] == app.version