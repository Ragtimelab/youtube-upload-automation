"""
CLI 설정 관리
"""

import os
from pathlib import Path
from typing import Dict, Any


class CLIConfig:
    """CLI 설정 관리"""
    
    def __init__(self):
        self.api_base_url = os.getenv('YOUTUBE_AUTOMATION_API_URL', 'http://localhost:8000')
        self.default_video_formats = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
        self.default_script_formats = ['.txt', '.md']
        self.max_file_size_mb = 2048  # 2GB
    
    @property
    def config_dir(self) -> Path:
        """설정 디렉토리"""
        return Path.home() / '.youtube-automation'
    
    def ensure_config_dir(self):
        """설정 디렉토리 생성"""
        self.config_dir.mkdir(exist_ok=True)
    
    def get_cache_file(self, name: str) -> Path:
        """캐시 파일 경로"""
        self.ensure_config_dir()
        return self.config_dir / f"{name}.json"


# 전역 설정 인스턴스
config = CLIConfig()