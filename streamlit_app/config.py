"""
Streamlit 앱 설정 관리
"""
import os
from typing import Dict, Any


class Config:
    """애플리케이션 설정"""
    
    # API 서버 설정
    API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
    API_TIMEOUT = int(os.getenv("API_TIMEOUT", "30"))
    
    # UI 설정
    PAGE_TITLE = "YouTube 자동화 대시보드"
    PAGE_ICON = "🎬"
    LAYOUT = "wide"
    
    # 업로드 설정
    MAX_FILE_SIZE_MB = 100
    ALLOWED_SCRIPT_FORMATS = [".txt", ".md"]
    ALLOWED_VIDEO_FORMATS = [".mp4", ".avi", ".mov", ".mkv", ".webm"]
    
    # 새로고침 설정
    DEFAULT_REFRESH_INTERVAL = 30
    
    # 상태 표시 설정
    STATUS_ICONS = {
        "script_ready": "📝",
        "video_ready": "🎥", 
        "uploaded": "✅",
        "scheduled": "⏰",
        "error": "❌",
        "unknown": "❓"
    }
    
    STATUS_COLORS = {
        "script_ready": "blue",
        "video_ready": "orange",
        "uploaded": "green", 
        "scheduled": "purple",
        "error": "red",
        "unknown": "gray"
    }
    
    @classmethod
    def get_status_display(cls, status: str) -> Dict[str, Any]:
        """상태에 따른 표시 정보 반환"""
        return {
            "icon": cls.STATUS_ICONS.get(status, cls.STATUS_ICONS["unknown"]),
            "color": cls.STATUS_COLORS.get(status, cls.STATUS_COLORS["unknown"])
        }