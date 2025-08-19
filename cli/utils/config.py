"""
CLI 설정 관리
"""

import os
import sys
from pathlib import Path

# 백엔드 constants 임포트
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))
    
from backend.app.core.constants import FileConstants, NetworkConstants


class CLIConfig:
    """CLI 설정 관리"""
    
    def __init__(self):
        self.api_base_url = os.getenv('YOUTUBE_AUTOMATION_API_URL', NetworkConstants.DEFAULT_API_BASE_URL)
        self.default_video_formats = FileConstants.ALLOWED_VIDEO_EXTENSIONS
        self.default_script_formats = FileConstants.ALLOWED_SCRIPT_EXTENSIONS
        self.max_file_size_mb = FileConstants.MAX_VIDEO_SIZE_MB
    
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