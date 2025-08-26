"""
Scripts API 통합 테스트
"""

import pytest
import io
from fastapi.testclient import TestClient


class TestScriptsAPI:
    """Scripts API 통합 테스트 클래스"""
    
    def test_upload_script_success(self, test_client: TestClient, sample_script_content: str):
        """스크립트 업로드 API - 성공"""
        
        # 파일 업로드 형태로 요청
        files = {"file": ("test_script.md", sample_script_content, "text/markdown")}
        
        response = test_client.post("/api/scripts/upload", files=files)
        
        assert response.status_code == 200
        data = response.json()
        
        # 새로운 표준화된 응답 형식 확인
        assert data["success"] is True
        assert "message" in data
        assert "timestamp" in data
        
        # 스크립트 데이터 확인
        script_data = data["data"]
        assert script_data["title"] == "시니어의 지혜 이야기"
        assert script_data["status"] == "script_ready"
        assert script_data["filename"] == "test_script.md"
        assert "id" in script_data
    
    def test_upload_script_invalid_file(self, test_client: TestClient):
        """스크립트 업로드 API - 잘못된 파일"""
        
        invalid_content = "잘못된 형식의 파일 내용"
        files = {"file": ("invalid.md", invalid_content, "text/markdown")}
        
        response = test_client.post("/api/scripts/upload", files=files)
        
        assert response.status_code == 400
        data = response.json()
        
        # 에러 응답 형식 확인
        assert data["success"] is False
        assert "message" in data
        assert "error_code" in data
    
    def test_upload_script_wrong_extension(self, test_client: TestClient):
        """스크립트 업로드 API - 잘못된 확장자"""
        
        files = {"file": ("test.pdf", "content", "application/pdf")}
        
        response = test_client.post("/api/scripts/upload", files=files)
        
        assert response.status_code == 400
    
    def test_get_scripts_empty(self, test_client: TestClient):
        """스크립트 목록 조회 API - 빈 목록"""
        
        response = test_client.get("/api/scripts/")
        
        assert response.status_code == 200
        data = response.json()
        
        # 페이징된 응답 형식 확인
        assert data["success"] is True
        assert "data" in data
        assert "pagination" in data
        
        assert data["pagination"]["total"] == 0
        assert len(data["data"]) == 0
    
    def test_get_scripts_with_data(self, test_client: TestClient, sample_script_content: str):
        """스크립트 목록 조회 API - 데이터 있음"""
        
        # 먼저 스크립트 업로드
        files = {"file": ("test1.md", sample_script_content, "text/markdown")}
        upload_response = test_client.post("/api/scripts/upload", files=files)
        assert upload_response.status_code == 200
        
        # 다른 제목으로 하나 더 업로드
        modified_content = sample_script_content.replace(
            "제목: 시니어의 지혜 이야기",
            "제목: 두 번째 이야기"
        )
        files = {"file": ("test2.md", modified_content, "text/markdown")}
        upload_response = test_client.post("/api/scripts/upload", files=files)
        assert upload_response.status_code == 200
        
        # 목록 조회
        response = test_client.get("/api/scripts/")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["pagination"]["total"] == 2
        assert len(data["data"]) == 2
        
        # 스크립트 데이터 확인
        scripts = data["data"]
        titles = [script["title"] for script in scripts]
        assert "시니어의 지혜 이야기" in titles
        assert "두 번째 이야기" in titles
    
    def test_get_scripts_with_status_filter(self, test_client: TestClient, sample_script_content: str):
        """스크립트 목록 조회 API - 상태 필터"""
        
        # 스크립트 업로드
        files = {"file": ("test.md", sample_script_content, "text/markdown")}
        upload_response = test_client.post("/api/scripts/upload", files=files)
        script_id = upload_response.json()["data"]["id"]
        
        # script_ready 상태로 조회
        response = test_client.get("/api/scripts/?status=script_ready")
        
        assert response.status_code == 200
        data = response.json()
        assert data["pagination"]["total"] == 1
        
        # video_ready 상태로 조회 (없어야 함)
        response = test_client.get("/api/scripts/?status=video_ready")
        
        assert response.status_code == 200
        data = response.json()
        assert data["pagination"]["total"] == 0
    
    def test_get_scripts_pagination(self, test_client: TestClient, sample_script_content: str):
        """스크립트 목록 조회 API - 페이징"""
        
        # 여러 스크립트 업로드
        for i in range(5):
            modified_content = sample_script_content.replace(
                "제목: 시니어의 지혜 이야기",
                f"제목: 테스트 스크립트 {i+1}"
            )
            files = {"file": (f"test{i+1}.md", modified_content, "text/markdown")}
            response = test_client.post("/api/scripts/upload", files=files)
            assert response.status_code == 200
        
        # 첫 번째 페이지 (limit=3)
        response = test_client.get("/api/scripts/?skip=0&limit=3")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["pagination"]["total"] == 5
        assert data["pagination"]["count"] == 3
        assert data["pagination"]["skip"] == 0
        assert data["pagination"]["limit"] == 3
        assert data["pagination"]["has_more"] is True
        
        # 두 번째 페이지
        response = test_client.get("/api/scripts/?skip=3&limit=3")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["pagination"]["count"] == 2  # 남은 2개
        assert data["pagination"]["has_more"] is False
    
    def test_get_script_by_id_success(self, test_client: TestClient, sample_script_content: str):
        """특정 스크립트 조회 API - 성공"""
        
        # 스크립트 업로드
        files = {"file": ("test.md", sample_script_content, "text/markdown")}
        upload_response = test_client.post("/api/scripts/upload", files=files)
        script_id = upload_response.json()["data"]["id"]
        
        # ID로 조회
        response = test_client.get(f"/api/scripts/{script_id}")
        
        assert response.status_code == 200
        response_data = response.json()
        
        # SuccessResponse 형식 확인
        assert response_data["success"] is True
        assert "data" in response_data
        
        script_data = response_data["data"]
        assert script_data["id"] == script_id
        assert script_data["title"] == "시니어의 지혜 이야기"
        assert script_data["status"] == "script_ready"
    
    def test_get_script_by_id_not_found(self, test_client: TestClient):
        """특정 스크립트 조회 API - 없는 ID"""
        
        response = test_client.get("/api/scripts/999")
        
        assert response.status_code == 404
        data = response.json()
        
        assert data["success"] is False
        assert "ScriptNotFoundError" in data["error_code"]
    
    def test_update_script_success(self, test_client: TestClient, sample_script_content: str):
        """스크립트 수정 API - 성공"""
        
        # 스크립트 업로드
        files = {"file": ("test.md", sample_script_content, "text/markdown")}
        upload_response = test_client.post("/api/scripts/upload", files=files)
        script_id = upload_response.json()["data"]["id"]
        
        # 수정
        update_data = {
            "title": "수정된 제목",
            "description": "수정된 설명",
            "tags": "수정된, 태그"
        }
        response = test_client.put(f"/api/scripts/{script_id}", data=update_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "message" in data
        
        # 수정된 데이터 확인
        get_response = test_client.get(f"/api/scripts/{script_id}")
        get_data = get_response.json()
        script_data = get_data["data"]
        
        assert script_data["title"] == "수정된 제목"
        assert script_data["description"] == "수정된 설명"
        assert script_data["tags"] == "수정된, 태그"
    
    def test_delete_script_success(self, test_client: TestClient, sample_script_content: str):
        """스크립트 삭제 API - 성공"""
        
        # 스크립트 업로드
        files = {"file": ("test.md", sample_script_content, "text/markdown")}
        upload_response = test_client.post("/api/scripts/upload", files=files)
        script_id = upload_response.json()["data"]["id"]
        
        # 삭제
        response = test_client.delete(f"/api/scripts/{script_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "message" in data
        
        # 삭제 확인
        get_response = test_client.get(f"/api/scripts/{script_id}")
        assert get_response.status_code == 404
    
    def test_get_scripts_stats(self, test_client: TestClient, sample_script_content: str):
        """스크립트 통계 조회 API"""
        
        # 스크립트 2개 업로드
        for i in range(2):
            modified_content = sample_script_content.replace(
                "제목: 시니어의 지혜 이야기",
                f"제목: 통계 테스트 {i+1}"
            )
            files = {"file": (f"stats_test{i+1}.md", modified_content, "text/markdown")}
            response = test_client.post("/api/scripts/upload", files=files)
            assert response.status_code == 200
        
        # 통계 조회
        response = test_client.get("/api/scripts/stats/summary")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        stats_data = data["data"]
        
        assert "statistics" in stats_data
        assert stats_data["statistics"]["total"] == 2
        assert stats_data["statistics"]["script_ready"] == 2
        assert stats_data["statistics"]["video_ready"] == 0
        
        assert "recent_script" in stats_data
        assert stats_data["recent_script"] is not None