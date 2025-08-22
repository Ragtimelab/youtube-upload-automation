"""
Video Management - 비디오 관리 기능
"""

from typing import List, Dict, Any
import gradio as gr

from .base import BaseManager
from ..utils import html_renderer, StatusStyler
from ..config import Messages


class VideoManager(BaseManager):
    """비디오 관리 매니저"""
    
    def upload_video(self, script_choice: str, video_file) -> str:
        """비디오 업로드"""
        if not self._validate_script_choice(script_choice):
            return html_renderer.render_error_message(Messages.ERROR_NO_SCRIPT)
        
        if video_file is None:
            return html_renderer.render_error_message(Messages.ERROR_NO_FILE)
        
        try:
            script_id = self._extract_script_id(script_choice)
            result = self.api.upload_video(script_id, video_file.name)
            return html_renderer.render_success_message(
                f"비디오 업로드 성공: {result.get('title', '알 수 없음')}",
                "비디오 업로드"
            )
        except Exception as e:
            return self._handle_api_error(e, "비디오 업로드")
    
    def get_video_status(self, script_choice: str) -> str:
        """비디오 상태 확인"""
        if not self._validate_script_choice(script_choice):
            return html_renderer.render_error_message(Messages.ERROR_NO_SCRIPT)
        
        try:
            script_id = self._extract_script_id(script_choice)
            script = self.api.get_script(script_id)
            
            status = script.get('status', 'unknown')
            icon, color, _ = StatusStyler.get_status_style(status)
            
            video_info = {
                'script_id': script_id,
                'title': script.get('title', ''),
                'status': status,
                'status_icon': icon,
                'status_color': color,
                'video_file_path': script.get('video_file_path', '없음'),
                'created_at': script.get('created_at', ''),
                'updated_at': script.get('updated_at', '')
            }
            
            # 간단한 HTML 생성 (템플릿으로 이동 가능)
            return f"""
            <div style="padding: 20px; border-radius: 12px; background: #f8fafc; border: 2px solid {color}; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1e40af;">🎥 비디오 상태 - 스크립트 #{script_id}</h3>
                
                <div style="display: grid; gap: 12px;">
                    <div style="background: white; padding: 12px; border-radius: 8px;">
                        <strong style="color: #1f2937;">제목:</strong>
                        <div style="margin-top: 4px;">{video_info['title']}</div>
                    </div>
                    
                    <div style="background: white; padding: 12px; border-radius: 8px;">
                        <strong style="color: #1f2937;">상태:</strong>
                        <span style="margin-left: 8px; color: {color};">{icon} {status}</span>
                    </div>
                    
                    <div style="background: white; padding: 12px; border-radius: 8px;">
                        <strong style="color: #1f2937;">비디오 파일:</strong>
                        <div style="margin-top: 4px; color: #374151;">{video_info['video_file_path']}</div>
                    </div>
                </div>
            </div>
            """
            
        except Exception as e:
            return self._handle_api_error(e, "비디오 상태 조회")
    
    def get_upload_progress(self, script_choice: str) -> str:
        """업로드 진행률 확인"""
        if not self._validate_script_choice(script_choice):
            return html_renderer.render_error_message(Messages.ERROR_NO_SCRIPT)
        
        try:
            script_id = self._extract_script_id(script_choice)
            
            try:
                progress = self.api.get_upload_progress(script_id)
                
                progress_percent = progress.get('progress_percent', 0)
                status = progress.get('status', 'unknown')
                
                return f"""
                <div style="padding: 20px; border-radius: 12px; background: #f0f9ff; border: 2px solid #3b82f6; margin: 10px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #1e40af;">📊 업로드 진행률 - 스크립트 #{script_id}</h3>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px;">
                        <div style="margin-bottom: 10px;">
                            <strong>진행률: {progress_percent}%</strong>
                        </div>
                        <div style="background: #e5e7eb; border-radius: 8px; overflow: hidden;">
                            <div style="height: 20px; background: #3b82f6; width: {progress_percent}%; transition: width 0.3s ease;"></div>
                        </div>
                        <div style="margin-top: 10px; color: #6b7280;">
                            상태: {status}
                        </div>
                    </div>
                </div>
                """
            except:
                return self._render_no_data_message("📊 진행률 정보를 사용할 수 없습니다.")
                
        except Exception as e:
            return self._handle_api_error(e, "업로드 진행률 조회")
    
    def delete_video_file(self, script_choice: str, confirmation: bool) -> str:
        """비디오 파일 삭제"""
        if not self._validate_script_choice(script_choice):
            return html_renderer.render_error_message(Messages.ERROR_NO_SCRIPT)
        
        if not confirmation:
            return html_renderer.render_error_message(
                "삭제 확인 체크박스를 체크해주세요.",
                "CONFIRMATION_REQUIRED"
            )
        
        try:
            script_id = self._extract_script_id(script_choice)
            result = self.api.delete_video_file(script_id)
            
            return html_renderer.render_success_message(
                f"비디오 파일이 삭제되었습니다: {result.get('message', '')}",
                "비디오 파일 삭제"
            )
            
        except Exception as e:
            return self._handle_api_error(e, "비디오 파일 삭제")
    
    def get_ready_scripts(self, status_filter: str = "script_ready") -> str:
        """준비된 스크립트 목록 조회"""
        try:
            result = self.api.get_scripts(status=status_filter)
            scripts = self.response_processor.extract_scripts_data(result)
            
            if not scripts:
                filter_names = {
                    'script_ready': '비디오 업로드를 기다리는',
                    'video_ready': 'YouTube 업로드를 기다리는'
                }
                filter_name = filter_names.get(status_filter, status_filter)
                return self._render_no_data_message(f"📋 {filter_name} 스크립트가 없습니다.")
            
            # 테이블 형태로 표시
            table_rows = ""
            for script in scripts:
                icon, color, _ = StatusStyler.get_status_style(script.get('status', ''))
                title = self.formatter.truncate_text(script.get('title', ''), 40)
                
                table_rows += f"""
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px; font-weight: bold;">{script.get('id')}</td>
                    <td style="padding: 8px;" title="{script.get('title', '')}">{title}</td>
                    <td style="padding: 8px; color: {color};">{icon} {script.get('status')}</td>
                    <td style="padding: 8px; color: #6b7280; font-size: 12px;">{script.get('created_at', '')[:10]}</td>
                </tr>
                """
            
            return f"""
            <div style="padding: 20px; border-radius: 12px; background: #f0f9ff; border: 2px solid #3b82f6; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: #0369a1;">📋 {status_filter} 상태 스크립트 ({len(scripts)}개)</h3>
                
                <div style="background: white; border-radius: 8px; overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: #f9fafb;">
                            <tr>
                                <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">ID</th>
                                <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">제목</th>
                                <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">상태</th>
                                <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">생성일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {table_rows}
                        </tbody>
                    </table>
                </div>
            </div>
            """
            
        except Exception as e:
            return self._handle_api_error(e, "준비된 스크립트 조회")