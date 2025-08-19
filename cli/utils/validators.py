"""
CLI 입력 검증 유틸리티
"""

import os
import sys
from pathlib import Path
from typing import List, Optional
from .date_mapping import date_mapper

# 백엔드 constants 임포트
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))
    
from backend.app.core.constants import FileConstants


class FileValidator:
    """파일 검증 유틸리티"""
    
    @staticmethod
    def validate_script_file(file_path: str) -> bool:
        """스크립트 파일 검증"""
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")
        
        if not path.is_file():
            raise ValueError(f"디렉토리가 아닌 파일을 지정해주세요: {file_path}")
        
        if path.suffix.lower() not in FileConstants.ALLOWED_SCRIPT_EXTENSIONS:
            raise ValueError(f"지원하지 않는 파일 형식입니다. ({', '.join(FileConstants.ALLOWED_SCRIPT_EXTENSIONS)}만 지원): {path.suffix}")
        
        # 파일 크기 체크
        if path.stat().st_size > FileConstants.MAX_SCRIPT_SIZE_MB * FileConstants.BYTES_PER_MB:
            raise ValueError(f"스크립트 파일은 {FileConstants.MAX_SCRIPT_SIZE_MB}MB를 초과할 수 없습니다.")
        
        return True
    
    @staticmethod
    def validate_video_file(file_path: str) -> bool:
        """비디오 파일 검증"""
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"비디오 파일을 찾을 수 없습니다: {file_path}")
        
        if not path.is_file():
            raise ValueError(f"디렉토리가 아닌 파일을 지정해주세요: {file_path}")
        
        if path.suffix.lower() not in FileConstants.ALLOWED_VIDEO_EXTENSIONS:
            raise ValueError(f"지원하지 않는 비디오 형식입니다. 지원 형식: {', '.join(FileConstants.ALLOWED_VIDEO_EXTENSIONS)}")
        
        # 파일 크기 체크
        file_size_mb = path.stat().st_size / FileConstants.BYTES_PER_MB
        if file_size_mb > FileConstants.MAX_VIDEO_SIZE_MB:
            raise ValueError(f"비디오 파일은 {FileConstants.MAX_VIDEO_SIZE_MB}MB를 초과할 수 없습니다. 현재 크기: {file_size_mb:.1f}MB")
        
        return True
    
    @staticmethod
    def find_files_in_directory(directory: str, extensions: List[str]) -> List[Path]:
        """디렉토리에서 특정 확장자 파일들 찾기"""
        dir_path = Path(directory)
        
        if not dir_path.exists():
            raise FileNotFoundError(f"디렉토리를 찾을 수 없습니다: {directory}")
        
        if not dir_path.is_dir():
            raise ValueError(f"파일이 아닌 디렉토리를 지정해주세요: {directory}")
        
        files = []
        for ext in extensions:
            files.extend(dir_path.glob(f"*{ext}"))
            files.extend(dir_path.glob(f"*{ext.upper()}"))
        
        return sorted(files)
    
    @staticmethod
    def find_date_files_in_directory(directory: str, extensions: List[str]) -> List[Path]:
        """디렉토리에서 날짜 형식 파일들 찾기 (YYYYMMDD_NN_name.ext)"""
        dir_path = Path(directory)
        
        if not dir_path.exists():
            raise FileNotFoundError(f"디렉토리를 찾을 수 없습니다: {directory}")
        
        if not dir_path.is_dir():
            raise ValueError(f"파일이 아닌 디렉토리를 지정해주세요: {directory}")
        
        date_files = date_mapper.find_date_files(directory, extensions)
        return [date_file.path / date_file.full_filename for date_file in date_files]
    
    @staticmethod
    def validate_date_filename(filename: str) -> bool:
        """날짜 형식 파일명 검증 (YYYYMMDD_NN_name.ext)"""
        date_file = date_mapper.parse_filename(filename)
        return date_file is not None
    
    @staticmethod
    def validate_date_format(date_str: str) -> bool:
        """날짜 형식 검증 (YYYYMMDD)"""
        return date_mapper.validate_date_format(date_str)


class InputValidator:
    """사용자 입력 검증"""
    
    @staticmethod
    def validate_script_id(script_id: str) -> int:
        """스크립트 ID 검증"""
        try:
            id_int = int(script_id)
            if id_int <= 0:
                raise ValueError("스크립트 ID는 양수여야 합니다.")
            return id_int
        except ValueError:
            raise ValueError(f"유효하지 않은 스크립트 ID입니다: {script_id}")
    
    @staticmethod
    def validate_status(status: str) -> str:
        """상태 값 검증"""
        valid_statuses = ['script_ready', 'video_ready', 'uploaded', 'error', 'scheduled']
        if status not in valid_statuses:
            raise ValueError(f"유효하지 않은 상태입니다. 사용 가능한 상태: {', '.join(valid_statuses)}")
        return status


# 인스턴스 생성
file_validator = FileValidator()
input_validator = InputValidator()