"""
Core Validators 단위 테스트
"""

import pytest
import io
import tempfile
from datetime import datetime, timezone
from fastapi import UploadFile

from app.core.validators import (
    FileValidator,
    ScriptDataValidator,
    YouTubeDataValidator,
    ScriptStatusValidator
)
from app.core.exceptions import (
    FileValidationError,
    ValidationError
)


class TestFileValidator:
    """FileValidator 단위 테스트 클래스"""
    
    @pytest.fixture
    def file_validator(self):
        """FileValidator 인스턴스"""
        return FileValidator()
    
    def test_validate_script_file_success(self, file_validator):
        """대본 파일 검증 - 성공 케이스"""
        # 유효한 마크다운 파일
        script_content = b"# Test Script\nThis is a test script content."
        script_file = UploadFile(
            filename="test_script.md",
            file=io.BytesIO(script_content),
            size=len(script_content)
        )
        script_file.content_type = "text/markdown"
        
        # 검증 메서드 테스트 (예외가 발생하지 않아야 함)
        try:
            file_validator.validate_script_file(script_file)
        except Exception as e:
            pytest.fail(f"Valid script file validation failed: {e}")
    
    def test_validate_script_file_no_filename(self, file_validator):
        """대본 파일 검증 - 파일명 없음 에러"""
        script_file = UploadFile(
            filename=None,
            file=io.BytesIO(b"content"),
            size=7
        )
        
        with pytest.raises(FileValidationError) as exc_info:
            file_validator.validate_script_file(script_file)
        
        assert "파일명이 없습니다" in str(exc_info.value)
    
    def test_validate_script_file_invalid_extension(self, file_validator):
        """대본 파일 검증 - 잘못된 확장자"""
        script_file = UploadFile(
            filename="test_script.txt",  # .md가 아닌 확장자
            file=io.BytesIO(b"content"),
            size=7
        )
        
        with pytest.raises(FileValidationError) as exc_info:
            file_validator.validate_script_file(script_file)
        
        assert "마크다운 파일만 지원" in str(exc_info.value) or "지원하지 않는 파일 형식" in str(exc_info.value)
    
    def test_validate_script_file_no_extension(self, file_validator):
        """대본 파일 검증 - 확장자 없음"""
        script_file = UploadFile(
            filename="test_script",  # 확장자 없음
            file=io.BytesIO(b"content"),
            size=7
        )
        
        with pytest.raises(FileValidationError) as exc_info:
            file_validator.validate_script_file(script_file)
        
        assert "마크다운 파일만 지원" in str(exc_info.value) or "지원하지 않는 파일 형식" in str(exc_info.value)
    
    def test_validate_video_file_success(self, file_validator):
        """비디오 파일 검증 - 성공 케이스"""
        video_content = b"fake video content for testing"
        video_file = UploadFile(
            filename="test_video.mp4",
            file=io.BytesIO(video_content),
            size=len(video_content)
        )
        video_file.content_type = "video/mp4"
        
        # 검증 메서드 테스트 (예외가 발생하지 않아야 함)
        try:
            file_validator.validate_video_file(video_file)
        except Exception as e:
            pytest.fail(f"Valid video file validation failed: {e}")
    
    def test_validate_video_file_no_filename(self, file_validator):
        """비디오 파일 검증 - 파일명 없음 에러"""
        video_file = UploadFile(
            filename=None,
            file=io.BytesIO(b"content"),
            size=7
        )
        
        with pytest.raises(FileValidationError) as exc_info:
            file_validator.validate_video_file(video_file)
        
        assert "파일명이 없습니다" in str(exc_info.value)
    
    def test_validate_video_file_invalid_extension(self, file_validator):
        """비디오 파일 검증 - 잘못된 확장자"""
        video_file = UploadFile(
            filename="test_video.txt",  # 비디오가 아닌 확장자
            file=io.BytesIO(b"content"),
            size=7
        )
        
        with pytest.raises(FileValidationError) as exc_info:
            file_validator.validate_video_file(video_file)
        
        assert "지원하지 않는 비디오 형식" in str(exc_info.value) or "비디오 파일만 지원" in str(exc_info.value)
    
    def test_validate_video_file_too_large(self, file_validator):
        """비디오 파일 검증 - 파일 크기 초과"""
        # 최대 크기보다 큰 파일 크기 설정
        large_size = file_validator.settings.max_video_size_bytes + 1
        video_file = UploadFile(
            filename="large_video.mp4",
            file=io.BytesIO(b"x" * 1000),  # 실제 내용은 작지만 size 속성을 큰 값으로 설정
            size=large_size
        )
        video_file.content_type = "video/mp4"
        
        with pytest.raises(FileValidationError) as exc_info:
            file_validator.validate_video_file(video_file)
        
        assert "파일 크기가 너무 큽니다" in str(exc_info.value)
    
    def test_validate_file_path_exists(self, file_validator):
        """파일 경로 검증 - 존재하는 파일"""
        # 임시 파일 생성
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(b"test content")
            temp_path = temp_file.name
        
        try:
            # 검증 메서드 테스트 (예외가 발생하지 않아야 함)
            file_validator.validate_file_path(temp_path)
        except Exception as e:
            pytest.fail(f"Valid file path validation failed: {e}")
        finally:
            # 임시 파일 정리
            import os
            os.unlink(temp_path)
    
    def test_validate_file_path_not_exists(self, file_validator):
        """파일 경로 검증 - 존재하지 않는 파일"""
        nonexistent_path = "/fake/nonexistent/file.mp4"
        
        with pytest.raises(FileValidationError) as exc_info:
            file_validator.validate_file_path(nonexistent_path)
        
        assert "파일을 찾을 수 없습니다" in str(exc_info.value)


class TestScriptDataValidator:
    """스크립트 데이터 검증 테스트"""
    
    def test_validate_parsed_script_data_success(self):
        """파싱된 스크립트 데이터 검증 - 성공 케이스"""
        valid_data = {
            "title": "테스트 제목",
            "description": "테스트 설명",
            "content": "테스트 내용",
            "tags": ["태그1", "태그2"],
            "thumbnail": {
                "text": "썸네일 텍스트",
                "prompt": "AI generation prompt"
            }
        }
        
        # 검증 메서드 테스트 (예외가 발생하지 않아야 함)
        try:
            ScriptDataValidator.validate_parsed_script_data(valid_data)
        except Exception as e:
            pytest.fail(f"Valid script data validation failed: {e}")
    
    def test_validate_parsed_script_data_missing_title(self):
        """파싱된 스크립트 데이터 검증 - 제목 누락"""
        invalid_data = {
            "description": "테스트 설명",
            "content": "테스트 내용"
        }
        
        with pytest.raises(ValidationError) as exc_info:
            ScriptDataValidator.validate_parsed_script_data(invalid_data)
        
        assert "제목이 필요합니다" in str(exc_info.value) or "title" in str(exc_info.value).lower()
    
    def test_validate_parsed_script_data_empty_title(self):
        """파싱된 스크립트 데이터 검증 - 빈 제목"""
        invalid_data = {
            "title": "",  # 빈 제목
            "description": "테스트 설명",
            "content": "테스트 내용"
        }
        
        with pytest.raises(ValidationError) as exc_info:
            ScriptDataValidator.validate_parsed_script_data(invalid_data)
        
        assert "제목이 비어있습니다" in str(exc_info.value) or "제목이 필요합니다" in str(exc_info.value)
    
    def test_validate_parsed_script_data_missing_content(self):
        """파싱된 스크립트 데이터 검증 - 내용 누락"""
        invalid_data = {
            "title": "테스트 제목",
            "description": "테스트 설명"
            # content 누락
        }
        
        with pytest.raises(ValidationError) as exc_info:
            ScriptDataValidator.validate_parsed_script_data(invalid_data)
        
        assert "내용이 필요합니다" in str(exc_info.value) or "content" in str(exc_info.value).lower()


class TestYouTubeValidators:
    """YouTube 관련 검증 테스트"""
    
    def test_validate_privacy_status_success(self):
        """개인정보 설정 검증 - 성공 케이스들"""
        valid_statuses = ["public", "private", "unlisted"]
        
        for status in valid_statuses:
            try:
                YouTubeDataValidator.validate_privacy_status(status)
            except Exception as e:
                pytest.fail(f"Valid privacy status '{status}' validation failed: {e}")
    
    def test_validate_privacy_status_invalid(self):
        """개인정보 설정 검증 - 잘못된 값"""
        invalid_status = "invalid_status"
        
        with pytest.raises(ValidationError) as exc_info:
            YouTubeDataValidator.validate_privacy_status(invalid_status)
        
        assert "잘못된 개인정보 설정" in str(exc_info.value) or "개인정보 설정이 유효하지 않습니다" in str(exc_info.value)
    
    def test_validate_category_id_success(self):
        """카테고리 ID 검증 - 성공 케이스들"""
        valid_categories = [1, 2, 10, 15, 17, 19, 20, 22, 23, 24, 25, 26, 27, 28]
        
        for category_id in valid_categories:
            try:
                YouTubeDataValidator.validate_category_id(category_id)
            except Exception as e:
                pytest.fail(f"Valid category ID '{category_id}' validation failed: {e}")
    
    def test_validate_category_id_invalid(self):
        """카테고리 ID 검증 - 잘못된 값"""
        invalid_category = 999  # 존재하지 않는 카테고리
        
        with pytest.raises(ValidationError) as exc_info:
            YouTubeDataValidator.validate_category_id(invalid_category)
        
        assert "잘못된 카테고리 ID" in str(exc_info.value) or "카테고리 ID가 유효하지 않습니다" in str(exc_info.value)
    
    def test_validate_upload_metadata_success(self):
        """업로드 메타데이터 검증 - 성공 케이스"""
        valid_metadata = {
            "title": "유효한 제목",
            "description": "유효한 설명",
            "tags": ["태그1", "태그2"],
            "privacy_status": "private",
            "category_id": 22
        }
        
        try:
            YouTubeDataValidator.validate_upload_metadata(valid_metadata)
        except Exception as e:
            pytest.fail(f"Valid upload metadata validation failed: {e}")
    
    def test_validate_upload_metadata_title_too_long(self):
        """업로드 메타데이터 검증 - 제목이 너무 긴 경우"""
        invalid_metadata = {
            "title": "A" * 101,  # 100자 초과
            "description": "설명",
            "privacy_status": "private",
            "category_id": 22
        }
        
        with pytest.raises(ValidationError) as exc_info:
            YouTubeDataValidator.validate_upload_metadata(invalid_metadata)
        
        assert "제목이 너무 깁니다" in str(exc_info.value) or "제목 길이" in str(exc_info.value)
    
    def test_validate_upload_metadata_description_too_long(self):
        """업로드 메타데이터 검증 - 설명이 너무 긴 경우"""
        invalid_metadata = {
            "title": "제목",
            "description": "A" * 5001,  # 5000바이트 초과
            "privacy_status": "private",
            "category_id": 22
        }
        
        with pytest.raises(ValidationError) as exc_info:
            YouTubeDataValidator.validate_upload_metadata(invalid_metadata)
        
        assert "설명이 너무 깁니다" in str(exc_info.value) or "설명 길이" in str(exc_info.value)
    
    def test_validate_scheduled_time_success(self):
        """예약 시간 검증 - 성공 케이스"""
        # 미래 시간 (ISO 형식)
        future_time = "2025-12-31T23:59:59Z"
        
        try:
            YouTubeDataValidator.validate_scheduled_time(future_time)
        except Exception as e:
            pytest.fail(f"Valid scheduled time validation failed: {e}")
    
    def test_validate_scheduled_time_invalid_format(self):
        """예약 시간 검증 - 잘못된 형식"""
        invalid_time = "2025-13-32 25:70:80"  # 잘못된 날짜/시간
        
        with pytest.raises(ValidationError) as exc_info:
            YouTubeDataValidator.validate_scheduled_time(invalid_time)
        
        assert "잘못된 시간 형식" in str(exc_info.value) or "시간 형식이 유효하지 않습니다" in str(exc_info.value)
    
    def test_validate_scheduled_time_past_time(self):
        """예약 시간 검증 - 과거 시간"""
        past_time = "2020-01-01T00:00:00Z"  # 과거 시간
        
        with pytest.raises(ValidationError) as exc_info:
            YouTubeDataValidator.validate_scheduled_time(past_time)
        
        assert "과거 시간으로 예약할 수 없습니다" in str(exc_info.value) or "예약 시간이 과거입니다" in str(exc_info.value)


class TestScriptStatusValidator:
    """StatusValidator 테스트"""
    
    def test_validate_status_success(self):
        """상태 검증 - 성공 케이스들"""
        valid_statuses = [
            "script_ready", 
            "video_ready", 
            "uploading", 
            "uploaded", 
            "error"
        ]
        
        for status in valid_statuses:
            try:
                ScriptStatusValidator.validate_status(status)
            except Exception as e:
                pytest.fail(f"Valid status '{status}' validation failed: {e}")
    
    def test_validate_status_invalid(self):
        """상태 검증 - 잘못된 상태"""
        invalid_status = "invalid_status"
        
        with pytest.raises(ValidationError) as exc_info:
            ScriptStatusValidator.validate_status(invalid_status)
        
        assert "잘못된 상태" in str(exc_info.value) or "상태가 유효하지 않습니다" in str(exc_info.value)
    
    def test_validate_status_transition_success(self):
        """상태 전환 검증 - 성공 케이스들"""
        valid_transitions = [
            ("script_ready", "video_ready"),
            ("video_ready", "uploading"),
            ("uploading", "uploaded"),
            ("script_ready", "error"),
            ("video_ready", "error"),
            ("uploading", "error")
        ]
        
        for current, new in valid_transitions:
            try:
                ScriptStatusValidator.validate_status_transition(current, new)
            except Exception as e:
                pytest.fail(f"Valid status transition '{current}' -> '{new}' validation failed: {e}")
    
    def test_validate_status_transition_invalid(self):
        """상태 전환 검증 - 잘못된 전환"""
        # uploaded -> script_ready는 불가능한 전환
        with pytest.raises(ValidationError) as exc_info:
            ScriptStatusValidator.validate_status_transition("uploaded", "script_ready")
        
        assert "잘못된 상태 전환" in str(exc_info.value) or "상태 전환이 유효하지 않습니다" in str(exc_info.value)
    
    def test_validate_status_transition_same_status(self):
        """상태 전환 검증 - 동일한 상태로의 전환"""
        # 동일한 상태로의 전환은 허용되지 않을 수 있음
        with pytest.raises(ValidationError) as exc_info:
            ScriptStatusValidator.validate_status_transition("script_ready", "script_ready")
        
        assert "동일한 상태" in str(exc_info.value) or "상태가 변경되지 않았습니다" in str(exc_info.value)
    
    def test_edge_cases(self):
        """에지 케이스 테스트"""
        file_validator = FileValidator()
        
        # 빈 문자열 파일명
        with pytest.raises(FileValidationError):
            empty_file = UploadFile(filename="", file=io.BytesIO(b"content"), size=7)
            file_validator.validate_script_file(empty_file)
        
        # 점으로만 구성된 파일명
        with pytest.raises(FileValidationError):
            dot_file = UploadFile(filename="...", file=io.BytesIO(b"content"), size=7)
            file_validator.validate_script_file(dot_file)
        
        # None 값들에 대한 검증
        with pytest.raises(ValidationError):
            YouTubeDataValidator.validate_privacy_status(None)
        
        with pytest.raises(ValidationError):
            YouTubeDataValidator.validate_category_id(None)