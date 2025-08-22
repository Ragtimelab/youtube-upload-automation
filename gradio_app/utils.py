"""
Gradio App Utilities - 공통 함수들
"""

import os
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
from jinja2 import Environment, FileSystemLoader
from .config import HTMLTemplates, Messages, UIStyles


class ScriptChoiceParser:
    """스크립트 선택 문자열 파싱 유틸리티"""
    
    @staticmethod
    def extract_script_id(script_choice: str) -> Optional[int]:
        """스크립트 선택 문자열에서 ID 추출"""
        if not script_choice or script_choice.startswith("❌"):
            return None
        
        try:
            # "[ID] 제목" 형식에서 ID 추출
            return int(script_choice.split(']')[0].replace('[', ''))
        except (ValueError, IndexError):
            return None
    
    @staticmethod
    def validate_script_choice(script_choice: str) -> bool:
        """스크립트 선택 문자열 유효성 검증"""
        return ScriptChoiceParser.extract_script_id(script_choice) is not None


class APIResponseProcessor:
    """API 응답 처리 유틸리티"""
    
    @staticmethod
    def extract_scripts_data(response: Union[Dict, List]) -> List[Dict]:
        """API 응답에서 스크립트 데이터 추출"""
        if isinstance(response, dict):
            return response.get('data', []) or response.get('scripts', [])
        elif isinstance(response, list):
            return response
        else:
            return []
    
    @staticmethod
    def extract_statistics_data(response: Dict) -> Dict:
        """API 응답에서 통계 데이터 추출"""
        return response.get('statistics', {}) or response


class HTMLRenderer:
    """HTML 템플릿 렌더링 유틸리티"""
    
    def __init__(self):
        template_path = Path(__file__).parent / "templates"
        self.env = Environment(
            loader=FileSystemLoader(str(template_path)),
            autoescape=True
        )
    
    def render_template(self, template_name: str, **context) -> str:
        """템플릿 렌더링"""
        try:
            template = self.env.get_template(template_name)
            return template.render(**context)
        except Exception as e:
            return self.render_error_message(
                f"템플릿 렌더링 실패: {str(e)}",
                "TEMPLATE_ERROR"
            )
    
    def render_error_message(self, message: str, error_type: str = "ERROR") -> str:
        """에러 메시지 렌더링"""
        return f"""
        <div style="padding: 15px; border-radius: 8px; background: {UIStyles.BG_ERROR}; border: 1px solid {UIStyles.ERROR_RED};">
            <span style="color: {UIStyles.ERROR_RED}; font-weight: bold;">❌ {error_type}</span><br>
            {message}
        </div>
        """
    
    def render_success_message(self, message: str, title: str = "성공") -> str:
        """성공 메시지 렌더링"""
        return f"""
        <div style="padding: 15px; border-radius: 8px; background: {UIStyles.BG_SUCCESS}; border: 1px solid {UIStyles.SUCCESS_GREEN};">
            <span style="color: {UIStyles.SUCCESS_GREEN}; font-weight: bold;">✅ {title}</span><br>
            {message}
        </div>
        """


class StatusStyler:
    """상태별 스타일 유틸리티"""
    
    STATUS_CONFIG = {
        'script_ready': ('📝', UIStyles.WARNING_YELLOW, 'yellow'),
        'video_ready': ('🎥', UIStyles.PRIMARY_BLUE, 'blue'),
        'uploading': ('🔄', '#06b6d4', 'cyan'),
        'uploaded': ('✅', UIStyles.SUCCESS_GREEN, 'green'),
        'error': ('❌', UIStyles.ERROR_RED, 'red'),
        'scheduled': ('⏰', '#8b5cf6', 'magenta'),
        'operational': ('✅', UIStyles.SUCCESS_GREEN, 'green'),
        'connected': ('✅', UIStyles.SUCCESS_GREEN, 'green'),
        'disconnected': ('❌', UIStyles.ERROR_RED, 'red'),
        'unknown': ('❓', UIStyles.GRAY_LIGHT, 'gray')
    }
    
    @classmethod
    def get_status_style(cls, status: str) -> tuple:
        """상태에 따른 아이콘, 색상, 스타일 반환"""
        return cls.STATUS_CONFIG.get(status, ('❓', UIStyles.GRAY_LIGHT, 'gray'))
    
    @classmethod
    def get_status_icon(cls, status: str) -> str:
        """상태 아이콘 반환"""
        return cls.get_status_style(status)[0]
    
    @classmethod
    def get_status_color(cls, status: str) -> str:
        """상태 색상 반환"""
        return cls.get_status_style(status)[1]


class DataFormatter:
    """데이터 포맷팅 유틸리티"""
    
    @staticmethod
    def format_script_list(scripts: List[Dict]) -> List[List]:
        """스크립트 목록을 Gradio Dataframe 형식으로 변환"""
        return [
            [
                s['id'], 
                s['title'], 
                s['status'], 
                s.get('created_at', '')
            ] 
            for s in scripts
        ]
    
    @staticmethod
    def format_script_choices(scripts: List[Dict]) -> List[str]:
        """스크립트 목록을 선택지 형식으로 변환"""
        return [f"[{s['id']}] {s['title']}" for s in scripts]
    
    @staticmethod
    def truncate_text(text: str, max_length: int = 50) -> str:
        """텍스트 길이 제한"""
        if len(text) <= max_length:
            return text
        return text[:max_length] + '...'
    
    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        """파일 크기 포맷팅"""
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024**2:
            return f"{size_bytes/1024:.1f} KB"
        elif size_bytes < 1024**3:
            return f"{size_bytes/(1024**2):.1f} MB"
        else:
            return f"{size_bytes/(1024**3):.1f} GB"


# 전역 인스턴스
html_renderer = HTMLRenderer()