"""
Base Manager Class - 공통 기능
"""

from abc import ABC
from typing import Dict, Any, List, Tuple
import gradio as gr

from ..utils import (
    ScriptChoiceParser, 
    APIResponseProcessor, 
    html_renderer,
    DataFormatter
)
from ..config import Messages


class BaseManager(ABC):
    """매니저 클래스의 기본 클래스"""
    
    def __init__(self, api_client):
        self.api = api_client
        self.parser = ScriptChoiceParser()
        self.response_processor = APIResponseProcessor()
        self.formatter = DataFormatter()
    
    def _validate_script_choice(self, script_choice: str) -> bool:
        """스크립트 선택 유효성 검증"""
        return self.parser.validate_script_choice(script_choice)
    
    def _extract_script_id(self, script_choice: str) -> int:
        """스크립트 ID 추출"""
        script_id = self.parser.extract_script_id(script_choice)
        if script_id is None:
            raise ValueError(Messages.ERROR_NO_SCRIPT)
        return script_id
    
    def _handle_api_error(self, error: Exception, context: str = "API 호출") -> str:
        """API 에러 처리"""
        return html_renderer.render_error_message(
            f"{context} 실패: {str(error)}",
            "API_ERROR"
        )
    
    def _render_no_data_message(self, message: str) -> str:
        """데이터 없음 메시지"""
        return f"""
        <div style="text-align: center; padding: 40px; color: #6b7280;">
            {message}
        </div>
        """