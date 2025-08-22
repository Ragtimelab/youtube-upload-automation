"""
Script Management - 스크립트 관리 기능
"""

from typing import List, Tuple, Dict, Any
import gradio as gr

from gradio_app.managers.base import BaseManager
from gradio_app.utils import html_renderer
from gradio_app.config import Messages


class ScriptManager(BaseManager):
    """스크립트 관리 매니저"""
    
    def upload_script(self, file) -> Tuple[str, List[List]]:
        """스크립트 업로드"""
        if file is None:
            return Messages.ERROR_NO_FILE, []
        
        try:
            result = self.api.upload_script(file.name)
            scripts = self.get_scripts_list()
            return f"✅ 스크립트 업로드 성공: {result.get('title', '알 수 없음')}", scripts
        except Exception as e:
            return self._handle_api_error(e, "스크립트 업로드"), []
    
    def get_scripts_list(self) -> List[List]:
        """스크립트 목록 조회"""
        try:
            result = self.api.get_scripts()
            scripts = self.response_processor.extract_scripts_data(result)
            return self.formatter.format_script_list(scripts)
        except Exception as e:
            return [["오류", f"목록 조회 실패: {str(e)}", "", ""]]
    
    def get_script_choices(self, status_filter: str = "") -> dict:
        """특정 상태의 스크립트 선택지"""
        try:
            if status_filter == "":
                result = self.api.get_scripts()
            else:
                result = self.api.get_scripts(status=status_filter)
            
            scripts = self.response_processor.extract_scripts_data(result)
            choices = self.formatter.format_script_choices(scripts)
            return gr.update(choices=choices)
        except Exception as e:
            return gr.update(choices=[f"❌ 오류: {str(e)}"])
    
    def get_script_detail(self, script_choice: str) -> str:
        """스크립트 상세 정보 조회 (CLI script show 기능과 동일)"""
        if not self._validate_script_choice(script_choice):
            return html_renderer.render_error_message(Messages.ERROR_NO_SCRIPT)
        
        try:
            script_id = self._extract_script_id(script_choice)
            script = self.api.get_script(script_id)
            
            # 내용 미리보기 생성
            content_preview = ""
            if script.get('content'):
                content = script['content']
                content_preview = content[:200] + ('...' if len(content) > 200 else '')
            
            return html_renderer.render_template(
                'script_detail.html',
                script=script,
                content_preview=content_preview
            )
            
        except Exception as e:
            return self._handle_api_error(e, "스크립트 상세 조회")
    
    def update_script_metadata(self, script_choice: str, title: str, description: str, 
                             tags: str, thumbnail_text: str, imagefx_prompt: str) -> str:
        """스크립트 메타데이터 수정 (CLI script edit 기능과 동일)"""
        if not self._validate_script_choice(script_choice):
            return html_renderer.render_error_message(Messages.ERROR_NO_SCRIPT)
        
        # 수정할 필드가 없으면 안내
        fields = [title.strip(), description.strip(), tags.strip(), 
                 thumbnail_text.strip(), imagefx_prompt.strip()]
        if not any(fields):
            return html_renderer.render_error_message(
                "수정할 항목을 지정해주세요. 비어있지 않은 필드만 수정됩니다.",
                "INPUT_ERROR"
            )
        
        try:
            script_id = self._extract_script_id(script_choice)
            current_script = self.api.get_script(script_id)
            
            # 수정할 데이터 준비
            update_data = {}
            changes = []
            
            if title.strip():
                changes.append(f"제목: '{current_script.get('title', '')}' → '{title.strip()}'")
                update_data['title'] = title.strip()
            
            if description.strip():
                changes.append(f"설명: '{current_script.get('description', '없음')}' → '{description.strip()}'")
                update_data['description'] = description.strip()
            
            if tags.strip():
                changes.append(f"태그: '{current_script.get('tags', '없음')}' → '{tags.strip()}'")
                update_data['tags'] = tags.strip()
            
            if thumbnail_text.strip():
                changes.append(f"썸네일: '{current_script.get('thumbnail_text', '없음')}' → '{thumbnail_text.strip()}'")
                update_data['thumbnail_text'] = thumbnail_text.strip()
            
            if imagefx_prompt.strip():
                changes.append(f"ImageFX: '{current_script.get('imagefx_prompt', '없음')}' → '{imagefx_prompt.strip()}'")
                update_data['imagefx_prompt'] = imagefx_prompt.strip()
            
            if not changes:
                return html_renderer.render_error_message("수정할 내용이 없습니다.")
            
            # API 호출
            result = self.api.update_script(script_id=script_id, **update_data)
            
            # 성공 메시지 생성
            details = [
                {"label": "스크립트 ID", "value": str(result.get('id'))},
                {"label": "수정 시간", "value": result.get('updated_at', '')},
            ]
            
            return html_renderer.render_template(
                'success_message.html',
                success_title="스크립트 수정 완료!",
                message="<br>".join([f"• {change}" for change in changes]),
                details=details
            )
            
        except Exception as e:
            return self._handle_api_error(e, "스크립트 수정")
    
    def delete_script(self, script_choice: str, confirmation: bool) -> str:
        """스크립트 삭제 (CLI script delete 기능과 동일)"""
        if not self._validate_script_choice(script_choice):
            return html_renderer.render_error_message(Messages.ERROR_NO_SCRIPT)
        
        if not confirmation:
            return html_renderer.render_error_message(
                "삭제 확인 체크박스를 체크해주세요. 이 작업은 되돌릴 수 없습니다.",
                "CONFIRMATION_REQUIRED"
            )
        
        try:
            script_id = self._extract_script_id(script_choice)
            script_info = self.api.get_script(script_id)
            script_title = script_info.get('title', '알 수 없음')
            
            result = self.api.delete_script(script_id)
            
            return html_renderer.render_template(
                'success_message.html',
                success_title="스크립트 삭제 완료!",
                message=f"삭제된 스크립트: {script_title}",
                details=[
                    {"label": "스크립트 ID", "value": str(script_id)},
                    {"label": "메시지", "value": result.get('message', '')}
                ]
            )
            
        except Exception as e:
            return self._handle_api_error(e, "스크립트 삭제")
    
    def get_script_stats(self) -> str:
        """스크립트 통계"""
        try:
            result = self.api.get_scripts_stats()
            stats = self.response_processor.extract_statistics_data(result)
            
            # 한글 레이블 매핑
            stat_labels = {
                'total': '총 스크립트',
                'script_ready': '업로드 준비',
                'video_ready': '비디오 준비',
                'uploaded': '업로드 완료',
                'scheduled': '예약 발행',
                'error': '오류 상태'
            }
            
            return html_renderer.render_template(
                'script_stats.html',
                stats=stats,
                stat_labels=stat_labels
            )
            
        except Exception as e:
            return self._handle_api_error(e, "스크립트 통계 조회")