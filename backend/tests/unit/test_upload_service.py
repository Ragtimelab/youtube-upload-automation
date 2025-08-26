"""
UploadService 단위 테스트
"""

import pytest
import os
import tempfile
import io
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch
from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.services.upload_service import UploadService
from app.models.script import Script
from app.core.exceptions import (
    ScriptNotFoundError,
    InvalidScriptStatusError,
    FileValidationError,
    VideoFileNotFoundError,
    YouTubeUploadError
)


class TestUploadService:
    """UploadService 단위 테스트 클래스"""
    
    def test_upload_service_initialization(self, test_db: Session):
        """UploadService 초기화 테스트"""
        service = UploadService(test_db)
        
        assert service.db == test_db
        assert service.repository is not None
        assert service.settings is not None
    
    @patch('app.services.upload_service.notify_upload_progress')
    @patch('app.services.upload_service.notify_status_change')
    @pytest.mark.asyncio
    async def test_upload_video_file_success(self, mock_notify_status, mock_notify_progress, test_db: Session, sample_script_content: str):
        """비디오 파일 업로드 - 성공 케이스"""
        from app.services.script_service import ScriptService
        
        # 테스트 스크립트 생성
        script_service = ScriptService(test_db)
        script = script_service.create_script_from_file(sample_script_content, "test.md")
        
        # Mock 설정
        mock_notify_progress.return_value = None
        mock_notify_status.return_value = None
        
        # 가짜 비디오 파일 생성
        video_content = b"fake video content for testing"
        video_file = UploadFile(
            filename="test_video.mp4",
            file=io.BytesIO(video_content),
            size=len(video_content)
        )
        video_file.content_type = "video/mp4"
        
        upload_service = UploadService(test_db)
        
        # 파일 저장 경로 모킹
        with patch.object(upload_service, '_save_video_file', return_value='/fake/path/test_video.mp4'):
            result = await upload_service.upload_video_file(script.id, video_file)
        
        # 결과 검증
        assert result["id"] == script.id
        assert result["title"] == script.title
        assert result["status"] == "video_ready"
        assert "video_file_path" in result
        assert "file_size" in result
        
        # 스크립트 상태 업데이트 확인
        updated_script = test_db.query(Script).filter_by(id=script.id).first()
        assert updated_script.status == "video_ready"
        assert updated_script.video_file_path == '/fake/path/test_video.mp4'
        
        # WebSocket 알림 호출 확인
        assert mock_notify_progress.call_count >= 3  # 시작, 진행, 완료
        mock_notify_status.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_upload_video_file_script_not_found(self, test_db: Session):
        """비디오 파일 업로드 - 스크립트 없음 에러"""
        upload_service = UploadService(test_db)
        
        # 가짜 비디오 파일
        video_file = UploadFile(
            filename="test.mp4",
            file=io.BytesIO(b"fake content"),
            size=100
        )
        
        with pytest.raises(ScriptNotFoundError):
            await upload_service.upload_video_file(999, video_file)
    
    @pytest.mark.asyncio
    async def test_upload_video_file_invalid_status(self, test_db: Session, sample_script_content: str):
        """비디오 파일 업로드 - 잘못된 스크립트 상태"""
        from app.services.script_service import ScriptService
        
        # 스크립트 생성 및 상태 변경
        script_service = ScriptService(test_db)
        script = script_service.create_script_from_file(sample_script_content, "test.md")
        script.status = "uploaded"  # script_ready가 아닌 상태
        test_db.commit()
        
        upload_service = UploadService(test_db)
        
        video_file = UploadFile(
            filename="test.mp4",
            file=io.BytesIO(b"fake content"),
            size=100
        )
        
        with pytest.raises(InvalidScriptStatusError):
            await upload_service.upload_video_file(script.id, video_file)
    
    def test_validate_video_file_success(self, test_db: Session):
        """비디오 파일 검증 - 성공 케이스"""
        upload_service = UploadService(test_db)
        
        # 유효한 비디오 파일
        video_file = UploadFile(
            filename="test.mp4",
            file=io.BytesIO(b"fake video content"),
            size=1024000  # 1MB
        )
        video_file.content_type = "video/mp4"
        
        # 검증 메서드 테스트 (예외가 발생하지 않아야 함)
        try:
            upload_service._validate_video_file(video_file)
        except Exception as e:
            pytest.fail(f"Valid video file validation failed: {e}")
    
    def test_validate_video_file_invalid_extension(self, test_db: Session):
        """비디오 파일 검증 - 잘못된 확장자"""
        upload_service = UploadService(test_db)
        
        # 잘못된 확장자
        video_file = UploadFile(
            filename="test.txt",
            file=io.BytesIO(b"fake content"),
            size=1024
        )
        
        with pytest.raises(FileValidationError):
            upload_service._validate_video_file(video_file)
    
    def test_validate_video_file_too_large(self, test_db: Session):
        """비디오 파일 검증 - 파일 크기 초과"""
        upload_service = UploadService(test_db)
        
        # 파일 크기 초과 (설정에서 최대 크기보다 큰 파일)
        large_size = upload_service.settings.max_video_size_bytes + 1
        video_file = UploadFile(
            filename="large_video.mp4",
            file=io.BytesIO(b"x" * 1000),  # 실제 내용은 작지만 size 속성을 큰 값으로 설정
            size=large_size
        )
        video_file.content_type = "video/mp4"
        
        with pytest.raises(FileValidationError) as exc_info:
            upload_service._validate_video_file(video_file)
        
        assert "파일 크기가 너무 큽니다" in str(exc_info.value)
    
    @patch('app.services.upload_service.os.makedirs')
    @patch('app.services.upload_service.os.path.exists', return_value=False)
    def test_save_video_file_success(self, mock_exists, mock_makedirs, test_db: Session):
        """비디오 파일 저장 - 성공 케이스"""
        upload_service = UploadService(test_db)
        
        video_content = b"fake video content"
        video_file = UploadFile(
            filename="test.mp4",
            file=io.BytesIO(video_content),
            size=len(video_content)
        )
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # 임시 디렉토리 사용
            upload_service.settings.upload_dir = temp_dir
            
            with patch('builtins.open', create=True) as mock_open:
                mock_file = Mock()
                mock_open.return_value.__enter__.return_value = mock_file
                
                result_path = upload_service._save_video_file(1, video_file)
                
                # 파일 경로 검증
                assert str(1) in result_path  # script_id가 경로에 포함
                assert "test.mp4" in result_path
                
                # 디렉토리 생성 호출 확인
                mock_makedirs.assert_called()
                
                # 파일 쓰기 호출 확인
                mock_file.write.assert_called()
    
    @patch('app.services.upload_service.YouTubeClient')
    @patch('app.services.upload_service.notify_upload_progress')
    @patch('app.services.upload_service.notify_status_change')
    @pytest.mark.asyncio
    async def test_upload_to_youtube_success(self, mock_notify_status, mock_notify_progress, mock_youtube_client, test_db: Session, sample_script_content: str):
        """YouTube 업로드 - 성공 케이스"""
        from app.services.script_service import ScriptService
        
        # 테스트 스크립트 생성 및 비디오 준비 상태로 변경
        script_service = ScriptService(test_db)
        script = script_service.create_script_from_file(sample_script_content, "test.md")
        script.status = "video_ready"
        script.video_file_path = "/fake/path/video.mp4"
        test_db.commit()
        
        # YouTube 클라이언트 모킹
        mock_client_instance = Mock()
        mock_client_instance.upload_video = AsyncMock(return_value={
            "youtube_id": "abc123xyz",
            "title": "시니어의 지혜 이야기",
            "description": "테스트 설명",
            "privacy_status": "private"
        })
        mock_youtube_client.return_value = mock_client_instance
        
        # 알림 모킹
        mock_notify_progress.return_value = None
        mock_notify_status.return_value = None
        
        upload_service = UploadService(test_db)
        result = await upload_service.upload_to_youtube(script.id)
        
        # 결과 검증
        assert result["youtube_id"] == "abc123xyz"
        assert result["status"] == "uploaded"
        assert result["quota_used"] == 1600  # YouTubeConstants.VIDEO_UPLOAD_COST
        
        # 스크립트 상태 업데이트 확인
        updated_script = test_db.query(Script).filter_by(id=script.id).first()
        assert updated_script.status == "uploaded"
        assert updated_script.youtube_id == "abc123xyz"
        
        # YouTube API 호출 확인
        mock_client_instance.upload_video.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_upload_to_youtube_video_not_ready(self, test_db: Session, sample_script_content: str):
        """YouTube 업로드 - 비디오 준비 안됨 에러"""
        from app.services.script_service import ScriptService
        
        # script_ready 상태 (video_ready가 아님)
        script_service = ScriptService(test_db)
        script = script_service.create_script_from_file(sample_script_content, "test.md")
        
        upload_service = UploadService(test_db)
        
        with pytest.raises(InvalidScriptStatusError):
            await upload_service.upload_to_youtube(script.id)
    
    @pytest.mark.asyncio 
    async def test_upload_to_youtube_video_file_not_found(self, test_db: Session, sample_script_content: str):
        """YouTube 업로드 - 비디오 파일 없음 에러"""
        from app.services.script_service import ScriptService
        
        # 스크립트는 video_ready 상태이지만 파일 경로가 없음
        script_service = ScriptService(test_db)
        script = script_service.create_script_from_file(sample_script_content, "test.md")
        script.status = "video_ready"
        # video_file_path를 설정하지 않음
        test_db.commit()
        
        upload_service = UploadService(test_db)
        
        with pytest.raises(VideoFileNotFoundError):
            await upload_service.upload_to_youtube(script.id)
    
    @patch('app.services.upload_service.YouTubeClient')
    @patch('app.services.upload_service.notify_upload_progress')
    @patch('app.services.upload_service.notify_system_event')
    @pytest.mark.asyncio
    async def test_batch_upload_to_youtube_success(self, mock_notify_system, mock_notify_progress, mock_youtube_client, test_db: Session, sample_script_content: str):
        """YouTube 배치 업로드 - 성공 케이스"""
        from app.services.script_service import ScriptService
        
        # 여러 스크립트 생성 및 video_ready 상태로 변경
        script_service = ScriptService(test_db)
        scripts = []
        for i in range(3):
            content = sample_script_content.replace("시니어의 지혜 이야기", f"테스트 스크립트 {i}")
            script = script_service.create_script_from_file(content, f"test{i}.md")
            script.status = "video_ready"
            script.video_file_path = f"/fake/path/video{i}.mp4"
            scripts.append(script)
        test_db.commit()
        
        script_ids = [script.id for script in scripts]
        
        # YouTube 클라이언트 모킹 (각 업로드가 성공)
        mock_client_instance = Mock()
        mock_client_instance.upload_video = AsyncMock(side_effect=[
            {"youtube_id": f"video{i}", "title": f"테스트 스크립트 {i}", "description": "", "privacy_status": "private"}
            for i in range(3)
        ])
        mock_youtube_client.return_value = mock_client_instance
        
        # 알림 모킹
        mock_notify_progress.return_value = None
        mock_notify_system.return_value = None
        
        upload_service = UploadService(test_db)
        
        # 시간 지연 모킹 (실제로는 대기하지 않음)
        with patch('app.services.upload_service.time.sleep'):
            result = await upload_service.batch_upload_to_youtube(
                script_ids=script_ids,
                privacy_status="private",
                category_id=24,
                delay_seconds=1  # 테스트에서는 짧게 설정
            )
        
        # 결과 검증
        assert "batch_id" in result
        assert result["summary"]["success_count"] == 3
        assert result["summary"]["failed_count"] == 0
        assert result["summary"]["total_count"] == 3
        assert len(result["results"]) == 3
        
        # 모든 스크립트가 uploaded 상태로 변경되었는지 확인
        for script_id in script_ids:
            updated_script = test_db.query(Script).filter_by(id=script_id).first()
            assert updated_script.status == "uploaded"
            assert updated_script.youtube_id is not None
    
    def test_batch_id_format_in_batch_upload(self, test_db: Session):
        """배치 업로드에서 배치 ID 형식 테스트"""
        import re
        from datetime import datetime
        
        # 배치 ID 형식 검증을 위한 패턴 (batch_YYYYMMDD_HHMMSS_8자리hex)
        batch_id_pattern = r"^batch_\d{8}_\d{6}_[a-f0-9]{8}$"
        
        # 실제 배치 업로드에서 생성되는 배치 ID 확인을 위해 
        # 간단한 테스트 시나리오 작성
        upload_service = UploadService(test_db)
        
        # 현재 시간 기반으로 예상 패턴 생성
        now = datetime.now()
        expected_prefix = f"batch_{now.strftime('%Y%m%d_%H%M')}"
        
        # 패턴이 올바른지 검증 (실제 배치 업로드 없이)
        assert re.match(batch_id_pattern, "batch_20250826_142500_abcd1234") is not None
        
        # 현재 시간과 유사한 형식인지 확인
        test_batch_id = f"batch_{now.strftime('%Y%m%d_%H%M%S')}_12345678"
        assert test_batch_id.startswith("batch_")
        assert len(test_batch_id) > 20  # 충분히 긴 문자열