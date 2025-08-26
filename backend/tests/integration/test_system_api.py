"""
시스템 API 통합 테스트
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from sqlalchemy.exc import SQLAlchemyError


class TestSystemAPI:
    """시스템 API 통합 테스트 클래스"""
    
    def test_system_status_success(self, test_client: TestClient, sample_script_content: str):
        """시스템 상태 조회 - 성공 케이스"""
        # 먼저 테스트 데이터 생성 (스크립트 통계를 위해)
        files = {"file": ("test_script.md", sample_script_content, "text/markdown")}
        test_client.post("/api/scripts/upload", files=files)
        
        response = test_client.get("/api/system/status")
        
        assert response.status_code == 200
        data = response.json()
        
        # SuccessResponse 형식 검증
        assert data["success"] is True
        assert "data" in data
        assert "message" in data
        assert "timestamp" in data
        
        # 시스템 상태 데이터 검증
        system_data = data["data"]
        assert system_data["api_server"] == "operational"
        assert system_data["database"] == "connected"
        
        # 서비스 상태 검증
        services = system_data["services"]
        assert services["script_service"] == "operational"
        assert services["upload_service"] == "operational"
        assert services["youtube_service"] == "operational"
        
        # 스크립트 통계 검증
        assert "script_stats" in system_data
        script_stats = system_data["script_stats"]
        assert "total" in script_stats
        assert script_stats["total"] >= 1
    
    @patch('app.routers.system.ScriptService')
    def test_system_status_database_error(self, mock_script_service, test_client: TestClient):
        """시스템 상태 조회 - 데이터베이스 에러"""
        # ScriptService에서 에러 발생 시뮬레이션
        mock_service_instance = Mock()
        mock_service_instance.get_statistics.side_effect = SQLAlchemyError("Database connection failed")
        mock_script_service.return_value = mock_service_instance
        
        response = test_client.get("/api/system/status")
        
        assert response.status_code == 200  # 에러 상황에서도 200 반환
        data = response.json()
        
        # SuccessResponse 형식 검증 (에러 케이스)
        assert data["success"] is True
        system_data = data["data"]
        
        # 에러 상태 검증
        assert system_data["api_server"] == "operational"
        assert system_data["database"] == "error"
        assert "error" in system_data
        assert "Database connection failed" in system_data["error"]
        
        # 서비스 상태가 에러로 표시되는지 확인
        services = system_data["services"]
        assert services["script_service"] == "error"
        assert services["upload_service"] == "unknown"
        assert services["youtube_service"] == "unknown"
    
    def test_detailed_health_check_success(self, test_client: TestClient, sample_script_content: str):
        """상세 헬스체크 - 성공 케이스"""
        # 테스트 데이터 생성
        files = {"file": ("health_test.md", sample_script_content, "text/markdown")}
        test_client.post("/api/scripts/upload", files=files)
        
        response = test_client.get("/api/system/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # SuccessResponse 형식 검증
        assert data["success"] is True
        health_data = data["data"]
        
        # 헬스체크 메타데이터 검증
        assert "timestamp" in health_data
        assert health_data["status"] == "healthy"
        assert health_data["version"] == "1.0.0"
        
        # 개별 체크 항목 검증
        checks = health_data["checks"]
        assert checks["database"]["status"] == "pass"
        assert "response_time_ms" in checks["database"]
        
        assert checks["script_service"]["status"] == "pass"
        assert "total_scripts" in checks["script_service"]
        assert checks["script_service"]["total_scripts"] >= 1
        
        assert checks["upload_service"]["status"] == "pass"
        assert checks["youtube_api"]["status"] == "pass"
    
    @patch('app.routers.system.ScriptService')
    def test_detailed_health_check_database_error(self, mock_script_service, test_client: TestClient):
        """상세 헬스체크 - 데이터베이스 에러"""
        # ScriptService에서 에러 발생 시뮬레이션
        mock_service_instance = Mock()
        mock_service_instance.get_all_scripts.side_effect = SQLAlchemyError("Connection timeout")
        mock_script_service.return_value = mock_service_instance
        
        response = test_client.get("/api/system/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # SuccessResponse 형식 검증 (에러 케이스)
        assert data["success"] is True
        health_data = data["data"]
        
        # 에러 상태 검증
        assert health_data["status"] == "unhealthy"
        assert health_data["version"] == "1.0.0"
        
        # 에러 체크 항목 검증
        checks = health_data["checks"]
        assert checks["database"]["status"] == "fail"
        assert "Connection timeout" in checks["database"]["error"]
        
        # 다른 서비스들은 unknown 상태
        assert checks["script_service"]["status"] == "unknown"
        assert checks["upload_service"]["status"] == "unknown"
        assert checks["youtube_api"]["status"] == "unknown"
    
    def test_system_endpoints_authentication_not_required(self, test_client: TestClient):
        """시스템 엔드포인트는 인증 불필요 확인"""
        # 시스템 상태 엔드포인트는 인증 없이 접근 가능해야 함
        response = test_client.get("/api/system/status")
        assert response.status_code == 200
        
        # 상세 헬스체크도 인증 없이 접근 가능해야 함
        response = test_client.get("/api/system/health")
        assert response.status_code == 200
    
    def test_system_status_response_consistency(self, test_client: TestClient):
        """시스템 상태 응답 일관성 검증"""
        # 여러 번 호출해도 일관된 응답 구조
        responses = []
        for _ in range(3):
            response = test_client.get("/api/system/status")
            assert response.status_code == 200
            responses.append(response.json())
        
        # 모든 응답이 동일한 구조를 가져야 함
        for data in responses:
            assert data["success"] is True
            assert "data" in data
            system_data = data["data"]
            assert "api_server" in system_data
            assert "database" in system_data
            assert "services" in system_data
    
    def test_health_check_response_consistency(self, test_client: TestClient):
        """헬스체크 응답 일관성 검증"""
        # 여러 번 호출해도 일관된 응답 구조
        responses = []
        for _ in range(3):
            response = test_client.get("/api/system/health")
            assert response.status_code == 200
            responses.append(response.json())
        
        # 모든 응답이 동일한 구조를 가져야 함
        for data in responses:
            assert data["success"] is True
            health_data = data["data"]
            assert "timestamp" in health_data
            assert "status" in health_data
            assert "checks" in health_data
            assert "version" in health_data
    
    def test_system_api_performance(self, test_client: TestClient):
        """시스템 API 성능 테스트"""
        import time
        
        # 시스템 상태 조회 성능
        start_time = time.time()
        response = test_client.get("/api/system/status")
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 1.0  # 1초 이내 응답
        
        # 상세 헬스체크 성능
        start_time = time.time()
        response = test_client.get("/api/system/health")
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 1.0  # 1초 이내 응답
    
    def test_system_api_content_type(self, test_client: TestClient):
        """시스템 API 응답 Content-Type 검증"""
        response = test_client.get("/api/system/status")
        assert response.status_code == 200
        assert "application/json" in response.headers.get("content-type", "")
        
        response = test_client.get("/api/system/health")
        assert response.status_code == 200
        assert "application/json" in response.headers.get("content-type", "")