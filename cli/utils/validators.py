"""
CLI 입력 검증 유틸리티
"""

import os
from pathlib import Path
from typing import List, Optional


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
        
        if path.suffix.lower() not in ['.txt', '.md']:
            raise ValueError(f"지원하지 않는 파일 형식입니다. (.txt, .md만 지원): {path.suffix}")
        
        # 파일 크기 체크 (10MB 제한)
        if path.stat().st_size > 10 * 1024 * 1024:
            raise ValueError("스크립트 파일은 10MB를 초과할 수 없습니다.")
        
        return True
    
    @staticmethod
    def validate_video_file(file_path: str) -> bool:
        """비디오 파일 검증"""
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"비디오 파일을 찾을 수 없습니다: {file_path}")
        
        if not path.is_file():
            raise ValueError(f"디렉토리가 아닌 파일을 지정해주세요: {file_path}")
        
        allowed_extensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
        if path.suffix.lower() not in allowed_extensions:
            raise ValueError(f"지원하지 않는 비디오 형식입니다. 지원 형식: {', '.join(allowed_extensions)}")
        
        # 파일 크기 체크 (2GB 제한)
        file_size_mb = path.stat().st_size / (1024 * 1024)
        if file_size_mb > 2048:
            raise ValueError(f"비디오 파일은 2GB를 초과할 수 없습니다. 현재 크기: {file_size_mb:.1f}MB")
        
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