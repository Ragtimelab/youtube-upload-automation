"""
YouTube Management - YouTube 업로드 관리 기능
"""

from typing import List, Dict, Any
import gradio as gr

from .base import BaseManager
from ..utils import html_renderer, StatusStyler
from ..config import Messages, APIConfig


class YouTubeManager(BaseManager):
    """YouTube 관리 매니저"""
    
    def upload_to_youtube(self, script_choice: str, privacy: str, category: int) -> str:
        """YouTube 업로드"""
        if not self._validate_script_choice(script_choice):
            return html_renderer.render_error_message(Messages.ERROR_NO_SCRIPT)
        
        try:
            script_id = self._extract_script_id(script_choice)
            result = self.api.upload_to_youtube(script_id, None, privacy, category)
            
            return html_renderer.render_success_message(
                f"YouTube 업로드 성공: {result.get('video_url', '알 수 없음')}",
                "YouTube 업로드"
            )
        except Exception as e:
            return self._handle_api_error(e, "YouTube 업로드")
    
    def batch_upload_to_youtube(self, selected_scripts: List[str], privacy: str, 
                              category: int, delay: int) -> str:
        """배치 YouTube 업로드"""
        if not selected_scripts:
            return html_renderer.render_error_message("업로드할 스크립트를 선택해주세요.")
        
        # 할당량 제한 검증
        if len(selected_scripts) > APIConfig.MAX_BATCH_SIZE:
            return html_renderer.render_error_message(
                f"YouTube API 할당량 제한으로 인해 한 번에 최대 {APIConfig.MAX_BATCH_SIZE}개까지만 업로드 가능합니다."
            )
        
        try:
            script_ids = []
            for script_choice in selected_scripts:
                if self._validate_script_choice(script_choice):
                    script_id = self._extract_script_id(script_choice)
                    script_ids.append(script_id)
            
            if not script_ids:
                return html_renderer.render_error_message("유효한 스크립트가 선택되지 않았습니다.")
            
            result = self.api.batch_upload_to_youtube(
                script_ids=script_ids,
                privacy_status=privacy,
                category_id=category,
                delay_seconds=delay
            )
            
            summary = result.get('summary', {})
            success_count = summary.get('success_count', 0)
            failed_count = summary.get('failed_count', 0)
            
            # 결과 메시지 생성
            response = f"✅ 배치 업로드 완료!\n"
            response += f"성공: {success_count}개, 실패: {failed_count}개\n"
            
            # 할당량 정보 추가
            quota_used = success_count * 1600
            response += f"API 할당량 사용: {quota_used}/10,000 units ({quota_used/100:.1f}%)\n"
            response += f"🕐 할당량 리셋: Pacific Time 자정 (한국시간 오후 4-5시)\n"
            
            # 상세 결과
            uploads = result.get('uploads', [])
            if uploads:
                response += "\n📋 상세 결과:\n"
                for upload in uploads:
                    status = upload.get('status', 'unknown')
                    script_id = upload.get('script_id')
                    if status == 'success':
                        youtube_id = upload.get('youtube_video_id', '')
                        response += f"  ✅ 스크립트 {script_id}: https://youtube.com/watch?v={youtube_id}\n"
                    else:
                        error = upload.get('error', '알 수 없는 오류')
                        response += f"  ❌ 스크립트 {script_id}: {error}\n"
            
            return html_renderer.render_success_message(response, "배치 업로드")
            
        except Exception as e:
            return self._handle_api_error(e, "배치 업로드")
    
    def get_uploaded_videos(self) -> str:
        """업로드된 YouTube 비디오 목록"""
        try:
            result = self.api.get_scripts(status='uploaded')
            scripts = self.response_processor.extract_scripts_data(result)
            
            if not scripts:
                return self._render_no_data_message("📺 업로드된 YouTube 비디오가 없습니다.")
            
            # 테이블 행 생성
            table_rows = ""
            for script in scripts:
                youtube_id = script.get('youtube_video_id', '')
                youtube_url = f"https://youtube.com/watch?v={youtube_id}" if youtube_id else ''
                
                title = self.formatter.truncate_text(script.get('title', ''), 40)
                
                table_rows += f"""
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px; font-weight: bold; color: #1f2937;">{script.get('id')}</td>
                    <td style="padding: 8px; color: #374151;" title="{script.get('title', '')}">{title}</td>
                    <td style="padding: 8px;"><span style="color: #22c55e;">✅ uploaded</span></td>
                    <td style="padding: 8px; color: #3b82f6; font-family: monospace; font-size: 11px;">{youtube_id}</td>
                    <td style="padding: 8px;">
                        {f'<a href="{youtube_url}" target="_blank" style="color: #3b82f6; text-decoration: none;">🔗 YouTube</a>' if youtube_url else '없음'}
                    </td>
                    <td style="padding: 8px; color: #6b7280; font-size: 12px;">{script.get('updated_at', '')[:10]}</td>
                </tr>
                """
            
            return f"""
            <div style="padding: 20px; border-radius: 12px; background: #f0fdf4; border: 2px solid #22c55e; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: #166534;">✅ 업로드된 YouTube 비디오 ({len(scripts)}개)</h3>
                
                <div style="background: white; border-radius: 8px; overflow-x: auto; border: 1px solid #d1d5db;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                        <thead style="background: #f9fafb;">
                            <tr>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb;">ID</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb;">제목</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb;">상태</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb;">YouTube ID</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb;">URL</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb;">업로드일</th>
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
            return self._handle_api_error(e, "업로드된 비디오 조회")
    
    def get_quota_info(self) -> str:
        """YouTube API 할당량 정보"""
        try:
            quota_info = self.api.get_quota_info()
            
            used = quota_info.get('used', 0)
            total = quota_info.get('total', 10000)
            remaining = quota_info.get('remaining', total - used)
            percentage = (used / total * 100) if total > 0 else 0
            
            # 상태별 색상 결정
            if percentage < 50:
                status_color = "#22c55e"
                status_bg = "#f0fdf4"
                status_icon = "🟢"
                status_text = "여유"
            elif percentage < 80:
                status_color = "#f59e0b"
                status_bg = "#fef3c7"
                status_icon = "🟡"
                status_text = "보통"
            else:
                status_color = "#ef4444"
                status_bg = "#fee2e2"
                status_icon = "🔴"
                status_text = "부족"
            
            return f"""
            <div style="padding: 20px; border-radius: 12px; background: #f8fafc; border: 2px solid #3b82f6; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1e40af;">📊 YouTube API 할당량 모니터링</h3>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 15px;">
                        <div style="text-align: center;">
                            <strong style="color: #1f2937;">사용량</strong>
                            <div style="margin-top: 4px; color: #6b7280; font-size: 18px; font-weight: bold;">{used:,}</div>
                        </div>
                        <div style="text-align: center;">
                            <strong style="color: #1f2937;">전체</strong>
                            <div style="margin-top: 4px; color: #6b7280; font-size: 18px; font-weight: bold;">{total:,}</div>
                        </div>
                        <div style="text-align: center;">
                            <strong style="color: #1f2937;">잔여</strong>
                            <div style="margin-top: 4px; color: #6b7280; font-size: 18px; font-weight: bold;">{remaining:,}</div>
                        </div>
                    </div>
                    
                    <div>
                        <strong style="color: #1f2937;">할당량 사용률: {percentage:.1f}%</strong>
                        <div style="margin-top: 8px; background: #e5e7eb; border-radius: 8px; overflow: hidden;">
                            <div style="height: 20px; background: {status_color}; width: {percentage}%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
                                {used:,}/{total:,}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="background: {status_bg}; padding: 12px; border-radius: 8px; border: 2px solid {status_color};">
                    <div style="color: {status_color}; font-weight: bold;">
                        {status_icon} 할당량 상태: {status_text}
                    </div>
                </div>
                
                <div style="margin-top: 15px; padding: 10px; background: #dbeafe; border: 1px solid #3b82f6; border-radius: 6px;">
                    <strong style="color: #1e40af;">📝 참고사항:</strong>
                    <div style="color: #1e3a8a; font-size: 12px; margin-top: 4px;">
                        • 업로드 1회 = 1,600 units<br>
                        • 할당량 리셋: Pacific Time 자정 (한국시간 오후 4-5시)<br>
                        • 잔여량으로 약 {remaining // 1600}회 업로드 가능
                    </div>
                </div>
            </div>
            """
            
        except Exception as e:
            return self._handle_api_error(e, "할당량 정보 조회")