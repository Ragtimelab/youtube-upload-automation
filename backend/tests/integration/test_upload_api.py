"""
업로드 API 통합 테스트
"""

import pytest
import io
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock


class TestUploadAPI:
    """업로드 API 통합 테스트 클래스"""
    
    @patch('app.routers.upload.UploadService')
    def test_upload_video_file_success(self, mock_upload_service, test_client: TestClient, sample_script_content: str):
        """비디오 파일 업로드 - 성공 케이스"""
        # 테스트 스크립트 생성
        files = {"file": ("test_script.md", sample_script_content, "text/markdown")}
        script_response = test_client.post("/api/scripts/upload", files=files)
        script_id = script_response.json()["data"]["id"]
        
        # UploadService 모킹
        mock_service_instance = Mock()
        mock_service_instance.upload_video_file = AsyncMock(return_value={
            "script_id": script_id,
            "filename": "test_video.mp4",
            "file_size": 1024000,
            "video_path": "/uploads/videos/test_video.mp4",
            "status": "video_ready",
            "message": "비디오 파일 업로드가 완료되었습니다."
        })
        mock_upload_service.return_value = mock_service_instance
        
        # 비디오 파일 업로드
        video_content = b"fake video content"
        video_files = {"video_file": ("test_video.mp4", io.BytesIO(video_content), "video/mp4")}
        
        response = test_client.post(f"/api/upload/video/{script_id}", files=video_files)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["script_id"] == script_id
        assert data["filename"] == "test_video.mp4"
        assert data["file_size"] == 1024000
        assert data["status"] == "video_ready"
        
        # UploadService가 올바르게 호출되었는지 확인
        mock_service_instance.upload_video_file.assert_called_once_with(script_id, pytest.ANY)
    
    @patch('app.routers.upload.UploadService')
    def test_upload_video_file_script_not_found(self, mock_upload_service, test_client: TestClient):
        """비디오 파일 업로드 - 스크립트 없음 에러"""
        from app.core.exceptions import ScriptNotFoundError
        
        # UploadService에서 ScriptNotFoundError 발생 시뮬레이션
        mock_service_instance = Mock()
        mock_service_instance.upload_video_file = AsyncMock(side_effect=ScriptNotFoundError(999))
        mock_upload_service.return_value = mock_service_instance
        
        # 존재하지 않는 스크립트 ID로 업로드 시도
        video_content = b"fake video content"
        video_files = {"video_file": ("test_video.mp4", io.BytesIO(video_content), "video/mp4")}
        
        response = test_client.post("/api/upload/video/999", files=video_files)
        
        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        assert "ScriptNotFoundError" in data["error_code"]
    
    @patch('app.routers.upload.UploadService')
    def test_batch_upload_to_youtube_success(self, mock_upload_service, test_client: TestClient, sample_script_content: str):
        """YouTube 배치 업로드 - 성공 케이스"""
        # 여러 테스트 스크립트 생성
        script_ids = []
        for i in range(3):
            files = {"file": (f"test_script_{i}.md", sample_script_content.replace("시니어의 지혜 이야기", f"테스트 스크립트 {i}"), "text/markdown")}
            script_response = test_client.post("/api/scripts/upload", files=files)
            script_ids.append(script_response.json()["data"]["id"])
        
        # UploadService 모킹
        mock_service_instance = Mock()
        mock_service_instance.batch_upload_to_youtube = AsyncMock(return_value={
            "batch_id": "batch_12345",
            "summary": {
                "success_count": 3,
                "failed_count": 0,
                "total_count": 3
            },
            "results": [
                {"script_id": script_ids[0], "status": "success", "youtube_id": "video123"},
                {"script_id": script_ids[1], "status": "success", "youtube_id": "video456"},
                {"script_id": script_ids[2], "status": "success", "youtube_id": "video789"}
            ],
            "quota_used": 4800  # 3 * 1600
        })
        mock_upload_service.return_value = mock_service_instance
        
        # 배치 업로드 요청
        batch_request = {
            "script_ids": script_ids,
            "privacy_status": "private",
            "category_id": 24,
            "delay_seconds": 30
        }
        
        response = test_client.post("/api/upload/youtube/batch", json=batch_request)
        
        assert response.status_code == 200
        data = response.json()
        
        # BatchUploadResponse 형식 검증
        assert data["success"] is True
        assert data["data"]["batch_id"] == "batch_12345"
        assert data["data"]["summary"]["success_count"] == 3
        assert data["data"]["summary"]["failed_count"] == 0
        
        # UploadService가 올바르게 호출되었는지 확인
        mock_service_instance.batch_upload_to_youtube.assert_called_once_with(
            script_ids=script_ids,
            privacy_status="private",
            category_id=24,
            delay_seconds=30,
            publish_at=None
        )
    
    def test_batch_upload_quota_limit_validation(self, test_client: TestClient):
        """배치 업로드 - 할당량 제한 검증"""
        # 6개 이상의 스크립트 ID (제한 초과)
        batch_request = {
            "script_ids": [1, 2, 3, 4, 5, 6],  # MAX_BATCH_SIZE(5) 초과
            "privacy_status": "private",
            "category_id": 24,
            "delay_seconds": 30
        }
        
        response = test_client.post("/api/upload/youtube/batch", json=batch_request)
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "배치 크기가 너무 큽니다" in data["message"]
        assert "최대 5개까지" in data["message"]
    
    def test_batch_upload_delay_validation(self, test_client: TestClient):
        """배치 업로드 - 업로드 간격 검증"""
        batch_request = {
            "script_ids": [1, 2, 3],
            "privacy_status": "private", 
            "category_id": 24,
            "delay_seconds": 10  # MIN_BATCH_DELAY_SECONDS(30) 미만
        }
        
        response = test_client.post("/api/upload/youtube/batch", json=batch_request)
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "업로드 간격이 너무 짧습니다" in data["message"]
        assert "최소 30초" in data["message"]
    
    @patch('app.routers.upload.UploadService')
    def test_single_upload_to_youtube_success(self, mock_upload_service, test_client: TestClient, sample_script_content: str):
        """YouTube 단일 업로드 - 성공 케이스"""
        # 테스트 스크립트 생성
        files = {"file": ("test_script.md", sample_script_content, "text/markdown")}
        script_response = test_client.post("/api/scripts/upload", files=files)
        script_id = script_response.json()["data"]["id"]
        
        # UploadService 모킹
        mock_service_instance = Mock()
        mock_service_instance.upload_to_youtube = AsyncMock(return_value={
            "script_id": script_id,
            "youtube_id": "abc123xyz",
            "title": "시니어의 지혜 이야기",
            "status": "uploaded",
            "privacy_status": "private",
            "upload_timestamp": "2025-08-26T12:00:00Z",
            "quota_used": 1600
        })
        mock_upload_service.return_value = mock_service_instance
        
        response = test_client.post(f"/api/upload/youtube/{script_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["script_id"] == script_id
        assert data["youtube_id"] == "abc123xyz"
        assert data["status"] == "uploaded"
        assert data["quota_used"] == 1600
        
        # UploadService가 올바르게 호출되었는지 확인
        mock_service_instance.upload_to_youtube.assert_called_once_with(
            script_id=script_id,
            publish_at=None,
            privacy_status=None,
            category_id=None
        )
    
    @patch('app.routers.upload.UploadService')
    def test_single_upload_with_scheduled_publishing(self, mock_upload_service, test_client: TestClient, sample_script_content: str):
        """YouTube 단일 업로드 - 예약 발행"""
        # 테스트 스크립트 생성
        files = {"file": ("test_script.md", sample_script_content, "text/markdown")}
        script_response = test_client.post("/api/scripts/upload", files=files)
        script_id = script_response.json()["data"]["id"]
        
        # UploadService 모킹
        mock_service_instance = Mock()
        mock_service_instance.upload_to_youtube = AsyncMock(return_value={
            "script_id": script_id,
            "youtube_id": "scheduled123",
            "title": "시니어의 지혜 이야기",
            "status": "scheduled",
            "privacy_status": "private",
            "publish_at": "2025-08-27T09:00:00Z",
            "upload_timestamp": "2025-08-26T12:00:00Z"
        })
        mock_upload_service.return_value = mock_service_instance
        
        # 예약 발행 데이터
        form_data = {
            "publish_at": "2025-08-27T09:00:00Z",
            "privacy_status": "private",
            "category_id": "24"
        }
        
        response = test_client.post(f"/api/upload/youtube/{script_id}", data=form_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["script_id"] == script_id
        assert data["status"] == "scheduled"
        assert data["publish_at"] == "2025-08-27T09:00:00Z"
        
        # UploadService가 올바른 매개변수로 호출되었는지 확인
        mock_service_instance.upload_to_youtube.assert_called_once_with(
            script_id=script_id,
            publish_at="2025-08-27T09:00:00Z",
            privacy_status="private",
            category_id=24
        )
    
    def test_upload_endpoints_validation(self, test_client: TestClient):
        """업로드 엔드포인트 매개변수 검증"""
        # 잘못된 script_id (문자열)
        response = test_client.post("/api/upload/video/invalid", files={})
        assert response.status_code == 422
        
        # 배치 업로드 - 잘못된 JSON 구조
        response = test_client.post("/api/upload/youtube/batch", json={"invalid": "data"})
        assert response.status_code == 422
        
        # 배치 업로드 - script_ids 누락
        response = test_client.post("/api/upload/youtube/batch", json={
            "privacy_status": "private",
            "category_id": 24,
            "delay_seconds": 30
        })
        assert response.status_code == 422
    
    def test_upload_api_content_types(self, test_client: TestClient):
        """업로드 API Content-Type 검증"""
        # 모든 업로드 엔드포인트는 JSON 응답
        response = test_client.post("/api/upload/youtube/batch", json={
            "script_ids": [1, 2, 3],
            "privacy_status": "private",
            "category_id": 24,
            "delay_seconds": 30
        })
        
        # 400 에러라도 JSON Content-Type이어야 함
        assert response.status_code == 400
        assert "application/json" in response.headers.get("content-type", "")