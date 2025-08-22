"""
YouTube Upload Automation - Clean Gradio Web Interface
백엔드 API와 정확히 일치하는 기능만 제공하는 웹 GUI 인터페이스
"""

import os
import gradio as gr
from pathlib import Path
from typing import Optional, List, Tuple
import sys

# 프로젝트 루트를 sys.path에 추가
project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from cli.utils.api_client import YouTubeAutomationAPI
from backend.app.core.constants import FileConstants, NetworkConstants


class CleanGradioClient:
    """API 기반 클린 Gradio 클라이언트"""
    
    def __init__(self):
        self.api = YouTubeAutomationAPI()
    
    def upload_script(self, file) -> Tuple[str, List[List]]:
        """스크립트 업로드"""
        if file is None:
            return "❌ 파일을 선택해주세요.", []
        
        try:
            result = self.api.upload_script(file.name)
            scripts = self.get_scripts_list()
            return f"✅ 스크립트 업로드 성공: {result.get('title', '알 수 없음')}", scripts
        except Exception as e:
            return f"❌ 업로드 실패: {str(e)}", []
    
    def get_scripts_list(self) -> List[List]:
        """스크립트 목록 조회"""
        try:
            result = self.api.get_scripts()
            # API 응답에서 data 필드 추출
            scripts = result.get('data', []) if isinstance(result, dict) else result if isinstance(result, list) else []
            return [[s['id'], s['title'], s['status'], s.get('created_at', '')] for s in scripts]
        except Exception as e:
            return [["오류", f"목록 조회 실패: {str(e)}", "", ""]]
    
    def get_script_choices(self, status_filter: str) -> dict:
        """특정 상태의 스크립트 선택지"""
        try:
            # 빈 문자열인 경우 모든 스크립트 조회
            if status_filter == "":
                result = self.api.get_scripts()
            else:
                result = self.api.get_scripts(status=status_filter)
            
            # API 응답에서 data 필드 추출  
            if isinstance(result, dict):
                scripts = result.get('data', []) or result.get('scripts', [])
            elif isinstance(result, list):
                scripts = result
            else:
                scripts = []
            
            choices = [f"[{s['id']}] {s['title']}" for s in scripts]
            return gr.update(choices=choices)
        except Exception as e:
            return gr.update(choices=[f"❌ 오류: {str(e)}"])
    
    def upload_video(self, script_choice: str, video_file) -> str:
        """비디오 업로드"""
        if not script_choice or script_choice.startswith("❌"):
            return "❌ 유효한 스크립트를 선택해주세요."
        
        if video_file is None:
            return "❌ 비디오 파일을 선택해주세요."
        
        try:
            script_id = int(script_choice.split(']')[0].replace('[', ''))
            result = self.api.upload_video(script_id, video_file.name)
            return f"✅ 비디오 업로드 성공: {result.get('title', '알 수 없음')}"
        except Exception as e:
            return f"❌ 비디오 업로드 실패: {str(e)}"
    
    def upload_to_youtube(self, script_choice: str, privacy: str, category: int) -> str:
        """YouTube 업로드"""
        if not script_choice or script_choice.startswith("❌"):
            return "❌ 유효한 스크립트를 선택해주세요."
        
        try:
            script_id = int(script_choice.split(']')[0].replace('[', ''))
            result = self.api.upload_to_youtube(script_id, None, privacy, category)
            return f"✅ YouTube 업로드 성공: {result.get('video_url', '알 수 없음')}"
        except Exception as e:
            return f"❌ YouTube 업로드 실패: {str(e)}"
    
    def batch_upload_to_youtube(self, selected_scripts: List[str], privacy: str, category: int, delay: int) -> str:
        """배치 YouTube 업로드"""
        if not selected_scripts:
            return "❌ 업로드할 스크립트를 선택해주세요."
        
        # 할당량 제한 검증
        if len(selected_scripts) > 5:
            return "❌ YouTube API 할당량 제한으로 인해 한 번에 최대 5개까지만 업로드 가능합니다."
        
        try:
            script_ids = []
            for script_choice in selected_scripts:
                if script_choice and not script_choice.startswith("❌"):
                    script_id = int(script_choice.split(']')[0].replace('[', ''))
                    script_ids.append(script_id)
            
            if not script_ids:
                return "❌ 유효한 스크립트가 선택되지 않았습니다."
            
            result = self.api.batch_upload_to_youtube(
                script_ids=script_ids,
                privacy_status=privacy,
                category_id=category,
                delay_seconds=delay
            )
            
            summary = result.get('summary', {})
            success_count = summary.get('success_count', 0)
            failed_count = summary.get('failed_count', 0)
            
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
            
            return response
            
        except Exception as e:
            return f"❌ 배치 업로드 실패: {str(e)}"
    
    def perform_health_check(self) -> str:
        """헬스체크"""
        try:
            result = self.api.health_check()
            if result.get('success', True):
                # 헬스체크 API는 services 필드에 실제 정보가 있음
                services = result.get('services', {})
                return f"""
                <div style="padding: 10px; border-radius: 8px; background: #d1fae5;">
                    <span style="color: #22c55e; font-weight: bold;">✅ 시스템 정상</span><br>
                    API: {services.get('api', '정상')}<br>
                    Database: {services.get('database', '정상')}<br>
                    Version: {services.get('version', '알 수 없음')}
                </div>
                """
            else:
                return f"""
                <div style="padding: 10px; border-radius: 8px; background: #fee2e2;">
                    <span style="color: #ef4444; font-weight: bold;">❌ 시스템 오류</span><br>
                    {result.get('message', '알 수 없는 오류')}
                </div>
                """
        except Exception as e:
            return f"""
            <div style="padding: 10px; border-radius: 8px; background: #fee2e2;">
                <span style="color: #ef4444; font-weight: bold;">❌ 연결 실패</span><br>
                {str(e)}
            </div>
            """
    
    def get_script_stats(self) -> str:
        """스크립트 통계"""
        try:
            result = self.api.get_scripts_stats()
            # API 응답에서 statistics 필드가 직접 통계 데이터 포함
            stats = result.get('statistics', {})
            return f"""
            <div style="padding: 15px; border-radius: 8px; background: #f0f9ff; border: 1px solid #0ea5e9;">
                <h4 style="margin: 0 0 10px 0; color: #0369a1;">📊 스크립트 통계</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <strong>총 스크립트:</strong> {stats.get('total', 0)}개
                    </div>
                    <div>
                        <strong>업로드 준비:</strong> {stats.get('script_ready', 0)}개
                    </div>
                    <div>
                        <strong>비디오 준비:</strong> {stats.get('video_ready', 0)}개
                    </div>
                    <div>
                        <strong>업로드 완료:</strong> {stats.get('uploaded', 0)}개
                    </div>
                    <div>
                        <strong>예약 발행:</strong> {stats.get('scheduled', 0)}개
                    </div>
                    <div>
                        <strong>오류 상태:</strong> {stats.get('error', 0)}개
                    </div>
                </div>
            </div>
            """
        except Exception as e:
            return f"""
            <div style="padding: 10px; border-radius: 8px; background: #fee2e2;">
                <span style="color: #ef4444; font-weight: bold;">❌ 통계 조회 실패</span><br>
                {str(e)}
            </div>
            """
    
    # Phase 1.1: 스크립트 상세 조회 기능
    def get_script_detail(self, script_choice: str) -> str:
        """스크립트 상세 정보 조회 (CLI script show 기능과 동일)"""
        if not script_choice or script_choice.startswith("❌"):
            return "❌ 유효한 스크립트를 선택해주세요."
        
        try:
            script_id = int(script_choice.split(']')[0].replace('[', ''))
            script = self.api.get_script(script_id)
            
            # CLI와 동일한 정보 표시
            return f"""
            <div style="padding: 20px; border-radius: 12px; background: #f8fafc; border: 2px solid #3b82f6; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1e40af; display: flex; align-items: center;">
                    📄 스크립트 #{script_id}
                </h3>
                
                <div style="display: grid; gap: 12px;">
                    <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <strong style="color: #1f2937;">제목:</strong>
                        <div style="margin-top: 4px; font-size: 16px;">{script.get('title', '')}</div>
                    </div>
                    
                    <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #10b981;">
                        <strong style="color: #1f2937;">상태:</strong>
                        <span style="margin-left: 8px; padding: 4px 8px; border-radius: 4px; background: #dcfce7; color: #166534;">
                            {script.get('status')}
                        </span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div style="background: white; padding: 12px; border-radius: 8px;">
                            <strong style="color: #1f2937;">생성일:</strong>
                            <div style="margin-top: 4px; color: #6b7280;">{script.get('created_at', '')}</div>
                        </div>
                        <div style="background: white; padding: 12px; border-radius: 8px;">
                            <strong style="color: #1f2937;">수정일:</strong>
                            <div style="margin-top: 4px; color: #6b7280;">{script.get('updated_at', '')}</div>
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 12px; border-radius: 8px;">
                        <strong style="color: #1f2937;">설명:</strong>
                        <div style="margin-top: 4px; color: #374151;">{script.get('description') or '없음'}</div>
                    </div>
                    
                    <div style="background: white; padding: 12px; border-radius: 8px;">
                        <strong style="color: #1f2937;">태그:</strong>
                        <div style="margin-top: 4px; color: #374151;">{script.get('tags') or '없음'}</div>
                    </div>
                    
                    <div style="background: white; padding: 12px; border-radius: 8px;">
                        <strong style="color: #1f2937;">썸네일 텍스트:</strong>
                        <div style="margin-top: 4px; color: #374151;">{script.get('thumbnail_text') or '없음'}</div>
                    </div>
                    
                    <div style="background: white; padding: 12px; border-radius: 8px;">
                        <strong style="color: #1f2937;">ImageFX 프롬프트:</strong>
                        <div style="margin-top: 4px; color: #374151;">{script.get('imagefx_prompt') or '없음'}</div>
                    </div>
                    
                    <div style="background: white; padding: 12px; border-radius: 8px;">
                        <strong style="color: #1f2937;">비디오 파일:</strong>
                        <div style="margin-top: 4px; color: #374151;">{script.get('video_file_path') or '없음'}</div>
                    </div>
                    
                    <div style="background: white; padding: 12px; border-radius: 8px;">
                        <strong style="color: #1f2937;">YouTube ID:</strong>
                        <div style="margin-top: 4px; color: #374151;">
                            {script.get('youtube_video_id') or '없음'}
                            {f'<br><a href="https://youtube.com/watch?v={script.get("youtube_video_id")}" target="_blank" style="color: #3b82f6; text-decoration: none;">🔗 YouTube에서 보기</a>' if script.get('youtube_video_id') else ''}
                        </div>
                    </div>
                </div>
            </div>
            
            {f'''
            <div style="padding: 15px; border-radius: 8px; background: #f0fdf4; border: 1px solid #22c55e; margin-top: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #166534;">📖 내용 미리보기 (첫 200자)</h4>
                <div style="font-family: monospace; background: white; padding: 12px; border-radius: 6px; border: 1px solid #d1d5db; white-space: pre-wrap;">
{script.get('content', '')[:200]}{('...' if len(script.get('content', '')) > 200 else '')}
                </div>
            </div>
            ''' if script.get('content') else ''}
            """
            
        except Exception as e:
            return f"""
            <div style="padding: 15px; border-radius: 8px; background: #fee2e2; border: 1px solid #ef4444;">
                <span style="color: #dc2626; font-weight: bold;">❌ 스크립트 상세 조회 실패</span><br>
                {str(e)}
            </div>
            """
    
    # Phase 1.2: 스크립트 수정 기능
    def update_script_metadata(self, script_choice: str, title: str, description: str, tags: str, thumbnail_text: str, imagefx_prompt: str) -> str:
        """스크립트 메타데이터 수정 (CLI script edit 기능과 동일)"""
        if not script_choice or script_choice.startswith("❌"):
            return "❌ 유효한 스크립트를 선택해주세요."
        
        # 수정할 필드가 없으면 안내
        if not any([title.strip(), description.strip(), tags.strip(), thumbnail_text.strip(), imagefx_prompt.strip()]):
            return "⚠️ 수정할 항목을 지정해주세요. 비어있지 않은 필드만 수정됩니다."
        
        try:
            script_id = int(script_choice.split(']')[0].replace('[', ''))
            
            # 현재 스크립트 정보 조회
            current_script = self.api.get_script(script_id)
            
            # 수정할 내용 표시
            changes = []
            update_data = {}
            
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
                return "⚠️ 수정할 내용이 없습니다."
            
            # API 호출
            result = self.api.update_script(
                script_id=script_id,
                **update_data
            )
            
            # 성공 메시지 및 변경 사항 표시
            response = f"""
            <div style="padding: 20px; border-radius: 12px; background: #f0fdf4; border: 2px solid #22c55e; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: #166534;">✅ 스크립트 수정 완료!</h3>
                
                <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                    <strong style="color: #1f2937;">수정된 내용:</strong>
                    <ul style="margin: 8px 0; padding-left: 20px; color: #374151;">
            """
            
            for change in changes:
                response += f"<li>{change}</li>"
            
            response += f"""
                    </ul>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="background: white; padding: 12px; border-radius: 8px;">
                        <strong style="color: #1f2937;">스크립트 ID:</strong>
                        <div style="margin-top: 4px; color: #6b7280;">{result.get('id')}</div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 8px;">
                        <strong style="color: #1f2937;">수정 시간:</strong>
                        <div style="margin-top: 4px; color: #6b7280;">{result.get('updated_at', '')}</div>
                    </div>
                </div>
            </div>
            """
            
            return response
            
        except Exception as e:
            return f"""
            <div style="padding: 15px; border-radius: 8px; background: #fee2e2; border: 1px solid #ef4444;">
                <span style="color: #dc2626; font-weight: bold;">❌ 스크립트 수정 실패</span><br>
                {str(e)}
            </div>
            """
    
    # Phase 1.3: 스크립트 삭제 기능
    def delete_script(self, script_choice: str, confirmation: bool) -> str:
        """스크립트 삭제 (CLI script delete 기능과 동일)"""
        if not script_choice or script_choice.startswith("❌"):
            return "❌ 유효한 스크립트를 선택해주세요."
        
        if not confirmation:
            return "⚠️ 삭제 확인 체크박스를 체크해주세요. 이 작업은 되돌릴 수 없습니다."
        
        try:
            script_id = int(script_choice.split(']')[0].replace('[', ''))
            
            # 삭제 전 스크립트 정보 조회
            script_info = self.api.get_script(script_id)
            script_title = script_info.get('title', '알 수 없음')
            
            # API 호출
            result = self.api.delete_script(script_id)
            
            # 성공 메시지
            return f"""
            <div style="padding: 20px; border-radius: 12px; background: #fef3c7; border: 2px solid #f59e0b; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: #92400e;">✅ 스크립트 삭제 완료!</h3>
                
                <div style="background: white; padding: 15px; border-radius: 8px;">
                    <div style="display: grid; gap: 10px;">
                        <div>
                            <strong style="color: #1f2937;">삭제된 스크립트:</strong>
                            <div style="margin-top: 4px; color: #374151; font-weight: 500;">{script_title}</div>
                        </div>
                        
                        <div>
                            <strong style="color: #1f2937;">스크립트 ID:</strong>
                            <div style="margin-top: 4px; color: #6b7280;">{script_id}</div>
                        </div>
                        
                        <div>
                            <strong style="color: #1f2937;">메시지:</strong>
                            <div style="margin-top: 4px; color: #374151;">{result.get('message', '삭제 완료')}</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 15px; padding: 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
                    <strong style="color: #dc2626;">⚠️ 주의:</strong>
                    <span style="color: #7f1d1d;"> 삭제된 스크립트는 되돌릴 수 없습니다.</span>
                </div>
            </div>
            """
            
        except Exception as e:
            return f"""
            <div style="padding: 15px; border-radius: 8px; background: #fee2e2; border: 1px solid #ef4444;">
                <span style="color: #dc2626; font-weight: bold;">❌ 스크립트 삭제 실패</span><br>
                {str(e)}
            </div>
            """
    
    # Phase 2.1: 비디오 상태 관리 기능
    def delete_video_file(self, script_choice: str, confirmation: bool) -> str:
        """비디오 파일 삭제 (CLI video delete 기능과 동일)"""
        if not script_choice or script_choice.startswith("❌"):
            return "❌ 유효한 스크립트를 선택해주세요."
        
        if not confirmation:
            return "⚠️ 비디오 삭제 확인 체크박스를 체크해주세요."
        
        try:
            script_id = int(script_choice.split(']')[0].replace('[', ''))
            
            # API 호출
            result = self.api.delete_video_file(script_id)
            
            # 성공 메시지
            return f"""
            <div style="padding: 20px; border-radius: 12px; background: #f0fdf4; border: 2px solid #22c55e; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: #166534;">✅ 비디오 파일 삭제 완료!</h3>
                
                <div style="background: white; padding: 15px; border-radius: 8px;">
                    <div style="display: grid; gap: 10px;">
                        <div>
                            <strong style="color: #1f2937;">스크립트 ID:</strong>
                            <div style="margin-top: 4px; color: #6b7280;">{result.get('script_id')}</div>
                        </div>
                        
                        <div>
                            <strong style="color: #1f2937;">메시지:</strong>
                            <div style="margin-top: 4px; color: #374151;">{result.get('message')}</div>
                        </div>
                        
                        <div>
                            <strong style="color: #1f2937;">새로운 상태:</strong>
                            <div style="margin-top: 4px;">
                                <span style="padding: 4px 8px; border-radius: 4px; background: #fef3c7; color: #92400e;">
                                    {result.get('new_status')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            """
            
        except Exception as e:
            return f"""
            <div style="padding: 15px; border-radius: 8px; background: #fee2e2; border: 1px solid #ef4444;">
                <span style="color: #dc2626; font-weight: bold;">❌ 비디오 파일 삭제 실패</span><br>
                {str(e)}
            </div>
            """
    
    def get_video_status(self, script_choice: str) -> str:
        """비디오 업로드 상태 확인 (CLI video status 기능과 동일)"""
        if not script_choice or script_choice.startswith("❌"):
            return "❌ 유효한 스크립트를 선택해주세요."
        
        try:
            script_id = int(script_choice.split(']')[0].replace('[', ''))
            
            # API 호출
            status_info = self.api.get_upload_status(script_id)
            
            # 상태별 색상 및 아이콘
            status_colors = {
                'script_ready': ('#fef3c7', '#92400e', '📝'),
                'video_ready': ('#dbeafe', '#1e40af', '🎥'),
                'uploading': ('#cffafe', '#0e7490', '🔄'),
                'uploaded': ('#dcfce7', '#166534', '✅'),
                'error': ('#fee2e2', '#dc2626', '❌'),
                'scheduled': ('#f3e8ff', '#7c3aed', '⏰')
            }
            
            current_status = status_info.get('status', 'unknown')
            bg_color, text_color, icon = status_colors.get(current_status, ('#f3f4f6', '#374151', '❓'))
            
            return f"""
            <div style="padding: 20px; border-radius: 12px; background: {bg_color}; border: 2px solid {text_color}; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: {text_color};">{icon} 비디오 업로드 상태</h3>
                
                <div style="background: white; padding: 15px; border-radius: 8px;">
                    <div style="display: grid; gap: 12px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <strong style="color: #1f2937;">스크립트 ID:</strong>
                                <div style="margin-top: 4px; color: #6b7280;">{status_info.get('script_id')}</div>
                            </div>
                            <div>
                                <strong style="color: #1f2937;">현재 상태:</strong>
                                <div style="margin-top: 4px;">
                                    <span style="padding: 4px 8px; border-radius: 4px; background: {bg_color}; color: {text_color};">
                                        {icon} {current_status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <strong style="color: #1f2937;">비디오 파일:</strong>
                            <div style="margin-top: 4px; color: #374151;">{status_info.get('video_file_path') or '없음'}</div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <strong style="color: #1f2937;">파일 크기:</strong>
                                <div style="margin-top: 4px; color: #6b7280;">{status_info.get('file_size_mb', 0):.1f} MB</div>
                            </div>
                            <div>
                                <strong style="color: #1f2937;">업로드 시간:</strong>
                                <div style="margin-top: 4px; color: #6b7280;">{status_info.get('uploaded_at') or '없음'}</div>
                            </div>
                        </div>
                        
                        <div>
                            <strong style="color: #1f2937;">YouTube ID:</strong>
                            <div style="margin-top: 4px; color: #374151;">
                                {status_info.get('youtube_video_id') or '없음'}
                                {f'<br><a href="https://youtube.com/watch?v={status_info.get("youtube_video_id")}" target="_blank" style="color: #3b82f6; text-decoration: none;">🔗 YouTube에서 보기</a>' if status_info.get('youtube_video_id') else ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            """
            
        except Exception as e:
            return f"""
            <div style="padding: 15px; border-radius: 8px; background: #fee2e2; border: 1px solid #ef4444;">
                <span style="color: #dc2626; font-weight: bold;">❌ 비디오 상태 조회 실패</span><br>
                {str(e)}
            </div>
            """
    
    def get_upload_progress(self, script_choice: str) -> str:
        """비디오 업로드 진행률 확인 (CLI video progress 기능과 동일)"""
        if not script_choice or script_choice.startswith("❌"):
            return "❌ 유효한 스크립트를 선택해주세요."
        
        try:
            script_id = int(script_choice.split(']')[0].replace('[', ''))
            
            # API 호출
            progress_info = self.api.get_upload_progress(script_id)
            
            percentage = progress_info.get('progress_percentage', 0)
            status = progress_info.get('status', 'unknown')
            
            # 진행률 바 색상 결정
            if percentage >= 100 or status == 'uploaded':
                progress_color = '#22c55e'  # 초록
                bg_color = '#dcfce7'
                border_color = '#16a34a'
            elif status == 'error':
                progress_color = '#ef4444'  # 빨간
                bg_color = '#fee2e2'
                border_color = '#dc2626'
            elif status == 'uploading':
                progress_color = '#3b82f6'  # 파랑
                bg_color = '#dbeafe'
                border_color = '#2563eb'
            else:
                progress_color = '#6b7280'  # 회색
                bg_color = '#f3f4f6'
                border_color = '#9ca3af'
            
            return f"""
            <div style="padding: 20px; border-radius: 12px; background: {bg_color}; border: 2px solid {border_color}; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: {border_color};">📋 비디오 업로드 진행률</h3>
                
                <div style="background: white; padding: 15px; border-radius: 8px;">
                    <div style="display: grid; gap: 15px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <strong style="color: #1f2937;">스크립트 ID:</strong>
                                <div style="margin-top: 4px; color: #6b7280;">{script_id}</div>
                            </div>
                            <div>
                                <strong style="color: #1f2937;">상태:</strong>
                                <div style="margin-top: 4px;">
                                    <span style="padding: 4px 8px; border-radius: 4px; background: {bg_color}; color: {border_color};">
                                        {status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <strong style="color: #1f2937;">진행률: {percentage:.1f}%</strong>
                            <div style="margin-top: 8px; background: #e5e7eb; border-radius: 8px; overflow: hidden;">
                                <div style="height: 20px; background: {progress_color}; width: {percentage}%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
                                    {percentage:.1f}%
                                </div>
                            </div>
                        </div>
                        
                        {f'''
                        <div style="padding: 12px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px;">
                            <strong style="color: #92400e;">🔄 상태:</strong>
                            <span style="color: #78350f;"> 업로드가 진행 중입니다. 잠시만 기다려주세요.</span>
                        </div>
                        ''' if status == 'uploading' and percentage < 100 else ''}
                        
                        {f'''
                        <div style="padding: 12px; background: #dcfce7; border: 1px solid #22c55e; border-radius: 6px;">
                            <strong style="color: #166534;">✅ 완료:</strong>
                            <span style="color: #15803d;"> 비디오 업로드가 완료되었습니다!</span>
                        </div>
                        ''' if percentage >= 100 or status == 'uploaded' else ''}
                        
                        {f'''
                        <div style="padding: 12px; background: #fee2e2; border: 1px solid #ef4444; border-radius: 6px;">
                            <strong style="color: #dc2626;">❌ 오류:</strong>
                            <span style="color: #b91c1c;"> 업로드 중 오류가 발생했습니다. 상태를 확인해주세요.</span>
                        </div>
                        ''' if status == 'error' else ''}
                    </div>
                </div>
            </div>
            """
            
        except Exception as e:
            return f"""
            <div style="padding: 15px; border-radius: 8px; background: #fee2e2; border: 1px solid #ef4444;">
                <span style="color: #dc2626; font-weight: bold;">❌ 업로드 진행률 조회 실패</span><br>
                {str(e)}
            </div>
            """
    
    # Phase 2.2: 고급 비디오 업로드 기능
    def get_ready_scripts(self, status_filter: str = "script_ready") -> str:
        """비디오 업로드 준비된 스크립트 목록 (CLI video ready 기능과 동일)"""
        try:
            # 'script_ready' 상태의 스크립트들 조회
            result = self.api.get_scripts(status=status_filter)
            
            # API 응답에서 데이터 추출
            if isinstance(result, dict):
                scripts = result.get('data', []) or result.get('scripts', [])
            elif isinstance(result, list):
                scripts = result
            else:
                scripts = []
            
            if not scripts:
                return f"""
                <div style="padding: 20px; border-radius: 12px; background: #fef3c7; border: 2px solid #f59e0b; margin: 10px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #92400e;">💭 비디오 업로드 준비된 스크립트</h3>
                    
                    <div style="text-align: center; padding: 20px; color: #78350f;">
                        📋 비디오 업로드 준비된 스크립트가 없습니다.
                        <br><br>
                        <strong>비디오 업로드를 위해서는 먼저 스크립트를 업로드해야 합니다.</strong>
                    </div>
                </div>
                """
            
            # 테이블 형식으로 스크립트 목록 표시
            table_rows = ""
            for script in scripts:
                status_icon = {
                    'script_ready': '📝',
                    'video_ready': '🎥',
                    'uploaded': '✅',
                    'error': '❌',
                    'scheduled': '⏰'
                }.get(script.get('status', ''), '❓')
                
                table_rows += f"""
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px; font-weight: bold; color: #1f2937;">{script.get('id')}</td>
                    <td style="padding: 8px; color: #374151; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="{script.get('title', '')}">{script.get('title', '')}</td>
                    <td style="padding: 8px;"><span style="color: #f59e0b;">{status_icon} {script.get('status', '')}</span></td>
                    <td style="padding: 8px; color: #6b7280; font-size: 12px;">{script.get('created_at', '')[:10] if script.get('created_at') else ''}</td>
                </tr>
                """
            
            return f"""
            <div style="padding: 20px; border-radius: 12px; background: #f0fdf4; border: 2px solid #22c55e; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: #166534;">🎥 비디오 업로드 준비된 스크립트 ({len(scripts)}개)</h3>
                
                <div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #d1d5db;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: #f9fafb;">
                            <tr>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb;">ID</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb;">제목</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb;">상태</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb;">생성일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {table_rows}
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 15px; padding: 12px; background: #dbeafe; border: 1px solid #3b82f6; border-radius: 6px;">
                    <strong style="color: #1e40af;">💫 팁:</strong>
                    <span style="color: #1e3a8a;"> 비디오 업로드 명령어: <code>video upload &lt;SCRIPT_ID&gt; &lt;VIDEO_FILE&gt;</code></span>
                </div>
            </div>
            """
            
        except Exception as e:
            return f"""
            <div style="padding: 15px; border-radius: 8px; background: #fee2e2; border: 1px solid #ef4444;">
                <span style="color: #dc2626; font-weight: bold;">❌ 준비된 스크립트 목록 조회 실패</span><br>
                {str(e)}
            </div>
            """
    
    # Phase 3.1: YouTube 업로드 관리 기능
    def get_uploaded_videos(self) -> str:
        """업로드 완료된 YouTube 비디오 목록 (CLI youtube uploaded 기능과 동일)"""
        try:
            # 'uploaded' 상태의 스크립트들 조회
            result = self.api.get_scripts(status='uploaded')
            
            # API 응답에서 데이터 추출
            if isinstance(result, dict):
                scripts = result.get('data', []) or result.get('scripts', [])
            elif isinstance(result, list):
                scripts = result
            else:
                scripts = []
            
            if not scripts:
                return f"""
                <div style="padding: 20px; border-radius: 12px; background: #fef3c7; border: 2px solid #f59e0b; margin: 10px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #92400e;">📋 업로드된 YouTube 비디오</h3>
                    
                    <div style="text-align: center; padding: 20px; color: #78350f;">
                        📋 업로드된 YouTube 비디오가 없습니다.
                        <br><br>
                        <strong>비디오를 YouTube에 업로드한 후에 여기에 표시됩니다.</strong>
                    </div>
                </div>
                """
            
            # 테이블 형식으로 업로드된 비디오 목록 표시
            table_rows = ""
            for script in scripts:
                youtube_id = script.get('youtube_video_id', '')
                youtube_url = f"https://youtube.com/watch?v={youtube_id}" if youtube_id else ''
                
                # 제목 길이 제한 (40자)
                title = script.get('title', '')
                display_title = title[:40] + '...' if len(title) > 40 else title
                
                table_rows += f"""
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px; font-weight: bold; color: #1f2937;">{script.get('id')}</td>
                    <td style="padding: 8px; color: #374151; max-width: 250px;" title="{title}">{display_title}</td>
                    <td style="padding: 8px;"><span style="color: #22c55e;">✅ uploaded</span></td>
                    <td style="padding: 8px; color: #3b82f6; font-family: monospace; font-size: 11px;">{youtube_id}</td>
                    <td style="padding: 8px;">
                        {f'<a href="{youtube_url}" target="_blank" style="color: #3b82f6; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;"><span>🔗</span> YouTube</a>' if youtube_url else '없음'}
                    </td>
                    <td style="padding: 8px; color: #6b7280; font-size: 12px;">{script.get('updated_at', '')[:10] if script.get('updated_at') else ''}</td>
                </tr>
                """
            
            return f"""
            <div style="padding: 20px; border-radius: 12px; background: #f0fdf4; border: 2px solid #22c55e; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: #166534;">✅ 업로드된 YouTube 비디오 ({len(scripts)}개)</h3>
                
                <div style="background: white; border-radius: 8px; overflow-x: auto; border: 1px solid #d1d5db;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                        <thead style="background: #f9fafb;">
                            <tr>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb; min-width: 60px;">ID</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb; min-width: 200px;">제목</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb; min-width: 80px;">상태</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb; min-width: 150px;">YouTube ID</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb; min-width: 100px;">URL</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb; min-width: 100px;">업로드일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {table_rows}
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 15px; padding: 12px; background: #dbeafe; border: 1px solid #3b82f6; border-radius: 6px;">
                    <strong style="color: #1e40af;">💫 팁:</strong>
                    <span style="color: #1e3a8a;"> YouTube 링크를 클릭하면 새 창에서 YouTube 비디오를 보실 수 있습니다.</span>
                </div>
            </div>
            """
            
        except Exception as e:
            return f"""
            <div style="padding: 15px; border-radius: 8px; background: #fee2e2; border: 1px solid #ef4444;">
                <span style="color: #dc2626; font-weight: bold;">❌ 업로드된 YouTube 비디오 목록 조회 실패</span><br>
                {str(e)}
            </div>
            """
    
    # Phase 3.2: YouTube 할당량 모니터링 기능
    def get_quota_info(self) -> str:
        """YouTube API 할당량 사용량 확인 (CLI youtube quota 기능과 동일)"""
        try:
            # 오늘 업로드한 비디오 수 계산 (uploaded 상태 스크립트)
            uploaded_scripts = self.api.get_scripts(status='uploaded')
            if isinstance(uploaded_scripts, dict):
                scripts = uploaded_scripts.get('data', []) or uploaded_scripts.get('scripts', [])
            elif isinstance(uploaded_scripts, list):
                scripts = uploaded_scripts
            else:
                scripts = []
            
            # 오늘 날짜로 필터링 (간단히 전체 업로드 수로 가정)
            today_uploads = len(scripts) if scripts else 0
            quota_used = today_uploads * 1600
            quota_remaining = 10000 - quota_used
            remaining_uploads = quota_remaining // 1600
            
            # 할당량 사용률 계산
            usage_percentage = (quota_used / 10000) * 100
            
            # 색상 결정
            if usage_percentage >= 80:  # 80% 이상
                color_scheme = {
                    'bg': '#fee2e2',
                    'border': '#dc2626',
                    'text': '#dc2626',
                    'progress': '#ef4444'
                }
                warning_level = '⚠️ 경고'
            elif usage_percentage >= 60:  # 60% 이상
                color_scheme = {
                    'bg': '#fef3c7',
                    'border': '#f59e0b',
                    'text': '#92400e',
                    'progress': '#f59e0b'
                }
                warning_level = '💫 주의'
            else:  # 60% 미만
                color_scheme = {
                    'bg': '#dcfce7',
                    'border': '#22c55e',
                    'text': '#166534',
                    'progress': '#22c55e'
                }
                warning_level = '✅ 양호'
            
            return f"""
            <div style="padding: 20px; border-radius: 12px; background: {color_scheme['bg']}; border: 2px solid {color_scheme['border']}; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: {color_scheme['text']};">📊 YouTube API 할당량 정보</h3>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="display: grid; gap: 15px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <strong style="color: #1f2937;">일일 할당량:</strong>
                                <div style="margin-top: 4px; color: #6b7280; font-size: 18px; font-weight: bold;">10,000 units</div>
                            </div>
                            <div>
                                <strong style="color: #1f2937;">사용된 할당량:</strong>
                                <div style="margin-top: 4px; color: {color_scheme['text']}; font-size: 18px; font-weight: bold;">{quota_used:,} units</div>
                            </div>
                        </div>
                        
                        <div>
                            <strong style="color: #1f2937;">사용률: {usage_percentage:.1f}%</strong>
                            <div style="margin-top: 8px; background: #e5e7eb; border-radius: 8px; overflow: hidden;">
                                <div style="height: 20px; background: {color_scheme['progress']}; width: {usage_percentage}%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
                                    {usage_percentage:.1f}%
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <strong style="color: #1f2937;">남은 할당량:</strong>
                                <div style="margin-top: 4px; color: #6b7280; font-weight: bold;">{quota_remaining:,} units</div>
                            </div>
                            <div>
                                <strong style="color: #1f2937;">추가 업로드 가능:</strong>
                                <div style="margin-top: 4px; color: #22c55e; font-weight: bold;">{remaining_uploads}개</div>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <strong style="color: #1f2937;">오늘 업로드:</strong>
                                <div style="margin-top: 4px; color: #6b7280;">{today_uploads}개</div>
                            </div>
                            <div>
                                <strong style="color: #1f2937;">상태:</strong>
                                <div style="margin-top: 4px; color: {color_scheme['text']}; font-weight: bold;">{warning_level}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8fafc; padding: 12px; border-radius: 6px; border-left: 4px solid #6b7280;">
                    <strong style="color: #374151;">💫 제한 정보:</strong>
                    <div style="margin-top: 8px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                        • 비디오 업로드 비용: 1,600 units/개<br>
                        • 일일 최대 업로드: 6개<br>
                        • 배치 최대 크기: 5개<br>
                        • 최소 업로드 간격: 30초<br>
                        • 할당량 리셋: Pacific Time 자정 (한국시간 오후 4-5시)
                    </div>
                </div>
                
                {f'''
                <div style="margin-top: 15px; padding: 12px; background: #fee2e2; border: 1px solid #ef4444; border-radius: 6px;">
                    <strong style="color: #dc2626;">⚠️ 경고:</strong>
                    <span style="color: #b91c1c;"> 할당량의 80% 이상을 사용했습니다! 주의해주세요.</span>
                </div>
                ''' if usage_percentage >= 80 else ''}
                
                {f'''
                <div style="margin-top: 15px; padding: 12px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px;">
                    <strong style="color: #92400e;">💫 주의:</strong>
                    <span style="color: #78350f;"> 할당량 사용에 주의하세요.</span>
                </div>
                ''' if 60 <= usage_percentage < 80 else ''}
            </div>
            """
            
        except Exception as e:
            return f"""
            <div style="padding: 15px; border-radius: 8px; background: #fee2e2; border: 1px solid #ef4444;">
                <span style="color: #dc2626; font-weight: bold;">❌ YouTube API 할당량 정보 조회 실패</span><br>
                {str(e)}
            </div>
            """
    
    # Phase 4.1: 파이프라인 대시보드 기능
    def get_pipeline_status(self) -> str:
        """전체 파이프라인 상태 확인 (CLI status pipeline 기능과 동일)"""
        try:
            # 모든 스크립트 조회
            all_scripts_result = self.api.get_scripts(limit=100)  # 상당히 많이 가져오기
            
            # API 응답에서 데이터 추출
            if isinstance(all_scripts_result, dict):
                all_scripts = all_scripts_result.get('data', []) or all_scripts_result.get('scripts', [])
            elif isinstance(all_scripts_result, list):
                all_scripts = all_scripts_result
            else:
                all_scripts = []
            
            if not all_scripts:
                return f"""
                <div style="padding: 20px; border-radius: 12px; background: #fef3c7; border: 2px solid #f59e0b; margin: 10px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #92400e;">🔄 파이프라인 상태</h3>
                    
                    <div style="text-align: center; padding: 20px; color: #78350f;">
                        📋 등록된 스크립트가 없습니다.
                        <br><br>
                        <strong>스크립트를 먼저 업로드해주세요.</strong>
                    </div>
                </div>
                """
            
            # 상태별 분류
            by_status = {}
            for script in all_scripts:
                status = script.get('status', 'unknown')
                if status not in by_status:
                    by_status[status] = []
                by_status[status].append(script)
            
            # 파이프라인 진행률 계산
            total = len(all_scripts)
            completed = len(by_status.get('uploaded', []))
            usage_percentage = (completed / total * 100) if total > 0 else 0
            
            # 상태별 테이블 로우 생성
            status_order = ['script_ready', 'video_ready', 'uploading', 'uploaded', 'error', 'scheduled']
            status_icons = {
                'script_ready': ('📝', '#f59e0b'),
                'video_ready': ('🎥', '#3b82f6'),
                'uploading': ('🔄', '#06b6d4'),
                'uploaded': ('✅', '#22c55e'),
                'error': ('❌', '#ef4444'),
                'scheduled': ('⏰', '#8b5cf6')
            }
            
            status_rows = ""
            for status in status_order:
                if status in by_status:
                    scripts = by_status[status]
                    icon, color = status_icons.get(status, ('❓', '#6b7280'))
                    script_ids = ', '.join(str(s.get('id')) for s in scripts[:5])  # 최대 5개만 표시
                    if len(scripts) > 5:
                        script_ids += f" (+{len(scripts)-5}개 더)"
                    
                    status_rows += f"""
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px 8px; font-weight: bold;"><span style="color: {color};">{icon} {status}</span></td>
                        <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #1f2937;">{len(scripts)}</td>
                        <td style="padding: 12px 8px; color: #6b7280; font-size: 12px;">{script_ids}</td>
                    </tr>
                    """
            
            # 병목 구간 및 추천 액션 분석
            recommendations = []
            if by_status.get('script_ready'):
                ready_ids = [str(s.get('id')) for s in by_status['script_ready'][:3]]
                recommendations.append(f"비디오 업로드: <code>video upload {' '.join(ready_ids)} &lt;VIDEO_FILES&gt;</code>")
            
            if by_status.get('video_ready'):
                video_ready_ids = [str(s.get('id')) for s in by_status['video_ready'][:3]]
                recommendations.append(f"YouTube 배치 업로드: <code>youtube batch {' '.join(video_ready_ids)}</code>")
            
            if by_status.get('error'):
                recommendations.append("❌ 오류 상태의 스크립트가 있습니다. 확인이 필요합니다.")
            
            recommendations_html = ""
            if recommendations:
                for rec in recommendations:
                    recommendations_html += f"<li style='margin-bottom: 8px; color: #374151;'>{rec}</li>"
                recommendations_html = f"<ul style='margin: 10px 0; padding-left: 20px;'>{recommendations_html}</ul>"
            
            return f"""
            <div style="padding: 20px; border-radius: 12px; background: #f0f9ff; border: 2px solid #0ea5e9; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: #0369a1;">🔄 파이프라인 상태 대시보드</h3>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <strong style="color: #1f2937;">전체 스크립트:</strong>
                            <div style="margin-top: 4px; color: #6b7280; font-size: 18px; font-weight: bold;">{total}개</div>
                        </div>
                        <div>
                            <strong style="color: #1f2937;">업로드 완료:</strong>
                            <div style="margin-top: 4px; color: #22c55e; font-size: 18px; font-weight: bold;">{completed}개</div>
                        </div>
                    </div>
                    
                    <div>
                        <strong style="color: #1f2937;">전체 진행률: {usage_percentage:.1f}%</strong>
                        <div style="margin-top: 8px; background: #e5e7eb; border-radius: 8px; overflow: hidden;">
                            <div style="height: 20px; background: linear-gradient(90deg, #3b82f6 0%, #22c55e 100%); width: {usage_percentage}%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
                                {completed}/{total}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #d1d5db; margin-bottom: 15px;">
                    <h4 style="margin: 0; padding: 12px 16px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; color: #374151;">상태별 스크립트 분포</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: #f3f4f6;">
                            <tr>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">상태</th>
                                <th style="padding: 12px 8px; text-align: right; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">개수</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">스크립트 ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {status_rows}
                        </tbody>
                    </table>
                </div>
                
                {f'''
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #22c55e;">
                    <h4 style="margin: 0 0 10px 0; color: #166534;">💡 추천 액션</h4>
                    {recommendations_html}
                </div>
                ''' if recommendations else ''}
                
                <div style="margin-top: 15px; padding: 12px; background: #dbeafe; border: 1px solid #3b82f6; border-radius: 6px;">
                    <strong style="color: #1e40af;">💫 팁:</strong>
                    <span style="color: #1e3a8a;"> 파이프라인의 병목 구간을 해결하여 전체 효율성을 향상시킬 수 있습니다.</span>
                </div>
            </div>
            """
            
        except Exception as e:
            return f"""
            <div style="padding: 15px; border-radius: 8px; background: #fee2e2; border: 1px solid #ef4444;">
                <span style="color: #dc2626; font-weight: bold;">❌ 파이프라인 상태 조회 실패</span><br>
                {str(e)}
            </div>
            """
    
    # Phase 4.2: 실시간 모니터링 기능
    def get_real_time_monitor(self) -> str:
        """실시간 시스템 모니터링 (CLI status monitor 기능과 동일)"""
        try:
            from datetime import datetime
            
            # 현재 시간
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # 시스템 상태 확인
            health = self.api.health_check()
            upload_health = self.api.upload_health_check()
            
            # 기본 상태 정보
            services = health.get('services', {})
            api_status = services.get('api', 'unknown')
            db_status = services.get('database', 'unknown')
            upload_status = upload_health.get('upload_system', 'unknown')
            youtube_status = upload_health.get('youtube_api', 'unknown')
            
            # 상태별 색상 및 아이콘
            status_config = {
                'operational': ('✅', '#22c55e'),
                'connected': ('✅', '#22c55e'),
                'disconnected': ('❌', '#ef4444'),
                'error': ('❌', '#ef4444'),
                'unknown': ('❓', '#6b7280')
            }
            
            api_icon, api_color = status_config.get(api_status, ('❓', '#6b7280'))
            db_icon, db_color = status_config.get(db_status, ('❓', '#6b7280'))
            upload_icon, upload_color = status_config.get(upload_status, ('❓', '#6b7280'))
            youtube_icon, youtube_color = status_config.get(youtube_status, ('❓', '#6b7280'))
            
            # 전체 시스템 상태 판단
            api_ok = api_status == 'operational'
            db_ok = db_status == 'connected'
            upload_ok = upload_status == 'operational'
            youtube_ok = youtube_status == 'connected'
            
            all_ok = api_ok and db_ok and upload_ok and youtube_ok
            
            # 스크립트 통계 조회
            stats_html = ""
            try:
                stats_result = self.api.get_scripts_stats()
                stats = stats_result.get('statistics', {})
                
                stats_items = []
                for status_name, count in stats.items():
                    if isinstance(count, int):
                        stats_items.append(f"<span style='margin: 0 8px; color: #374151;'><strong>{status_name}:</strong> {count}</span>")
                
                stats_html = " | ".join(stats_items) if stats_items else "데이터 없음"
                
            except Exception:
                stats_html = "<span style='color: #ef4444;'>⚠️ 통계 조회 실패</span>"
            
            # 전체 상태 메시지
            if all_ok:
                overall_status = ("✅ 모든 시스템 정상 작동 중", '#22c55e', '#f0fdf4')
            elif api_ok and db_ok and upload_ok:
                overall_status = ("⚠️ YouTube API 연결 문제 - credentials.json 확인 필요", '#f59e0b', '#fef3c7')
            else:
                overall_status = ("❌ 시스템에 문제 발생", '#ef4444', '#fee2e2')
            
            status_msg, status_color, status_bg = overall_status
            
            return f"""
            <div style="padding: 20px; border-radius: 12px; background: #f8fafc; border: 2px solid #3b82f6; margin: 10px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1e40af; display: flex; justify-content: space-between; align-items: center;">
                    📊 실시간 시스템 모니터링
                    <span style="font-size: 12px; color: #6b7280; font-weight: normal;">🕒 {now}</span>
                </h3>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 16px;">🩺 시스템 상태</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                        <div style="text-align: center; padding: 8px; background: #f9fafb; border-radius: 6px;">
                            <div style="color: {api_color}; font-size: 20px; margin-bottom: 4px;">{api_icon}</div>
                            <div style="font-weight: bold; color: #1f2937; margin-bottom: 2px;">API 서버</div>
                            <div style="font-size: 12px; color: #6b7280;">{api_status}</div>
                        </div>
                        <div style="text-align: center; padding: 8px; background: #f9fafb; border-radius: 6px;">
                            <div style="color: {db_color}; font-size: 20px; margin-bottom: 4px;">{db_icon}</div>
                            <div style="font-weight: bold; color: #1f2937; margin-bottom: 2px;">데이터베이스</div>
                            <div style="font-size: 12px; color: #6b7280;">{db_status}</div>
                        </div>
                        <div style="text-align: center; padding: 8px; background: #f9fafb; border-radius: 6px;">
                            <div style="color: {upload_color}; font-size: 20px; margin-bottom: 4px;">{upload_icon}</div>
                            <div style="font-weight: bold; color: #1f2937; margin-bottom: 2px;">업로드 시스템</div>
                            <div style="font-size: 12px; color: #6b7280;">{upload_status}</div>
                        </div>
                        <div style="text-align: center; padding: 8px; background: #f9fafb; border-radius: 6px;">
                            <div style="color: {youtube_color}; font-size: 20px; margin-bottom: 4px;">{youtube_icon}</div>
                            <div style="font-weight: bold; color: #1f2937; margin-bottom: 2px;">YouTube API</div>
                            <div style="font-size: 12px; color: #6b7280;">{youtube_status}</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 16px;">📈 스크립트 통계</h4>
                    <div style="font-size: 14px; line-height: 1.6;">
                        {stats_html}
                    </div>
                </div>
                
                <div style="background: {status_bg}; padding: 12px; border-radius: 8px; border: 2px solid {status_color};">
                    <div style="color: {status_color}; font-weight: bold; font-size: 16px;">
                        {status_msg}
                    </div>
                </div>
                
                <div style="margin-top: 15px; padding: 10px; background: #dbeafe; border: 1px solid #3b82f6; border-radius: 6px; text-align: center;">
                    <span style="color: #1e40af; font-size: 12px;">
                        💡 자동 새로고침: 버튼을 다시 클릭하여 최신 상태 확인
                    </span>
                </div>
            </div>
            """
            
        except Exception as e:
            return f"""
            <div style="padding: 15px; border-radius: 8px; background: #fee2e2; border: 1px solid #ef4444;">
                <span style="color: #dc2626; font-weight: bold;">❌ 실시간 모니터링 실패</span><br>
                연결 오류: {str(e)}<br><br>
                <div style="margin-top: 10px; padding: 8px; background: #fef3c7; border-radius: 4px;">
                    <strong style="color: #92400e;">재시도 방법:</strong>
                    <div style="color: #78350f; font-size: 12px; margin-top: 4px;">
                        1. 백엔드 서버가 실행 중인지 확인<br>
                        2. 몇 초 후 다시 시도<br>
                        3. 문제 지속 시 시스템 관리자에게 문의
                    </div>
                </div>
            </div>
            """


class CleanYouTubeAutomationInterface:
    """API 기능과 정확히 일치하는 YouTube 업로드 자동화 인터페이스"""
    
    def __init__(self):
        self.client = CleanGradioClient()
        
    def create_interface(self) -> gr.Blocks:
        """메인 Gradio 인터페이스 생성"""
        
        with gr.Blocks(
            theme=gr.themes.Soft(),
            title="YouTube Upload Automation - Clean",
            css=self._get_custom_css()
        ) as interface:
            
            # 제목 및 설명
            gr.Markdown(
                """
                # 🎬 YouTube Upload Automation (Clean Version)
                **백엔드 API와 정확히 일치하는 기능만 제공**
                
                ⚠️ **주의**: 이 인터페이스는 실제 API에 존재하는 기능만 제공합니다.
                """
            )
            
            # 탭 구성
            with gr.Tabs():
                
                # 1. 스크립트 관리 탭
                with gr.Tab("📝 스크립트 관리"):
                    self._create_script_tab()
                
                # 2. 비디오 업로드 탭
                with gr.Tab("📹 비디오 업로드"):
                    self._create_video_tab()
                
                # 3. YouTube 업로드 탭 (단일만)
                with gr.Tab("🎬 YouTube 업로드"):
                    self._create_youtube_tab()
                
                # 4. 상태 확인 탭 (간단)
                with gr.Tab("📊 상태 확인"):
                    self._create_status_tab()
            
            # 페이지 하단 정보
            gr.Markdown(
                """
                ---
                **📡 연결 정보**: FastAPI Backend (http://localhost:8000)
                
                **💡 사용 팁**: API에 존재하는 기능만 사용할 수 있습니다.
                """
            )
        
        return interface
    
    def _create_script_tab(self):
        """스크립트 관리 탭 구성"""
        
        gr.Markdown("### 📝 스크립트 파일 업로드 및 관리")
        
        with gr.Row():
            with gr.Column(scale=1):
                # 파일 업로드
                script_file = gr.File(
                    label="스크립트 파일 선택 (.md만 지원)",
                    file_types=[".md"],
                    file_count="single"
                )
                
                upload_btn = gr.Button(
                    "📤 스크립트 업로드",
                    variant="primary"
                )
                
                upload_result = gr.Textbox(
                    label="업로드 결과",
                    interactive=False,
                    lines=3
                )
            
            with gr.Column(scale=2):
                # 스크립트 목록
                gr.Markdown("#### 📋 등록된 스크립트 목록")
                
                refresh_btn = gr.Button("🔄 목록 새로고침")
                
                script_list = gr.Dataframe(
                    headers=["ID", "제목", "상태", "생성일"],
                    datatype=["number", "str", "str", "str"],
                    interactive=False,
                    wrap=True,
                    value=[]
                )
        
        # 이벤트 핸들러
        upload_btn.click(
            fn=self.client.upload_script,
            inputs=[script_file],
            outputs=[upload_result, script_list]
        )
        
        refresh_btn.click(
            fn=self.client.get_scripts_list,
            outputs=[script_list]
        )
        
        # Phase 1.1: 스크립트 상세 조회 기능 추가
        gr.Markdown("---")  # 구분선
        gr.Markdown("### 🔍 스크립트 상세 정보 조회")
        gr.Markdown("💫 **CLI 동등 기능**: `script show <ID>` 명령과 동일한 정보를 제공합니다.")
        
        with gr.Row():
            with gr.Column(scale=1):
                # 스크립트 선택
                detail_script_dropdown = gr.Dropdown(
                    label="📄 상세 조회할 스크립트 선택",
                    choices=[],
                    interactive=True,
                    info="모든 상태의 스크립트를 선택할 수 있습니다."
                )
                
                detail_refresh_btn = gr.Button(
                    "🔄 선택지 새로고침",
                    variant="secondary"
                )
                
                detail_show_btn = gr.Button(
                    "🔍 상세 정보 보기",
                    variant="primary"
                )
            
            with gr.Column(scale=2):
                # 상세 정보 표시 영역
                detail_display = gr.HTML(
                    value="<div style='text-align: center; padding: 40px; color: #6b7280;'>📄 스크립트를 선택하고 '상세 정보 보기' 버튼을 클릭해주세요.</div>",
                    label="스크립트 상세 정보"
                )
        
        # 이벤트 핸들러
        detail_script_dropdown.focus(
            fn=lambda: self.client.get_script_choices(""),  # 모든 스크립트 조회
            outputs=[detail_script_dropdown]
        )
        
        detail_refresh_btn.click(
            fn=lambda: self.client.get_script_choices(""),
            outputs=[detail_script_dropdown]
        )
        
        detail_show_btn.click(
            fn=self.client.get_script_detail,
            inputs=[detail_script_dropdown],
            outputs=[detail_display]
        )
        
        # Phase 1.2: 스크립트 수정 기능 추가
        gr.Markdown("---")  # 구분선
        gr.Markdown("### ✏️ 스크립트 메타데이터 수정")
        gr.Markdown("💫 **CLI 동등 기능**: `script edit <ID> --title '...' --description '...'` 명령과 동일합니다.")
        gr.Markdown("⚠️ **주의**: 비어있지 않은 필드만 수정됩니다. 기존 값을 유지하려면 해당 필드를 비워두세요.")
        
        with gr.Row():
            with gr.Column(scale=1):
                # 수정할 스크립트 선택
                edit_script_dropdown = gr.Dropdown(
                    label="✏️ 수정할 스크립트 선택",
                    choices=[],
                    interactive=True,
                    info="모든 상태의 스크립트를 선택할 수 있습니다."
                )
                
                edit_refresh_btn = gr.Button(
                    "🔄 선택지 새로고침",
                    variant="secondary"
                )
            
            with gr.Column(scale=2):
                # 수정 폼 필드들
                with gr.Group():
                    gr.Markdown("#### 수정할 필드들 (비어있는 필드는 수정하지 않음)")
                    
                    edit_title = gr.Textbox(
                        label="제목",
                        placeholder="새로운 제목을 입력하세요. (비어있으면 수정하지 않음)",
                        lines=1
                    )
                    
                    edit_description = gr.Textbox(
                        label="설명",
                        placeholder="새로운 설명을 입력하세요. (비어있으면 수정하지 않음)",
                        lines=2
                    )
                    
                    edit_tags = gr.Textbox(
                        label="태그 (쉽표로 구분)",
                        placeholder="tag1, tag2, tag3 형식으로 입력하세요. (비어있으면 수정하지 않음)",
                        lines=1
                    )
                    
                    edit_thumbnail_text = gr.Textbox(
                        label="썸네일 텍스트",
                        placeholder="썸네일에 표시될 텍스트를 입력하세요. (비어있으면 수정하지 않음)",
                        lines=1
                    )
                    
                    edit_imagefx_prompt = gr.Textbox(
                        label="ImageFX 프롬프트",
                        placeholder="AI 이미지 생성용 프롬프트를 입력하세요. (비어있으면 수정하지 않음)",
                        lines=2
                    )
                
                edit_submit_btn = gr.Button(
                    "✏️ 수정 적용",
                    variant="primary"
                )
        
        # 수정 결과 표시
        edit_result_display = gr.HTML(
            value="<div style='text-align: center; padding: 20px; color: #6b7280;'>✏️ 스크립트를 선택하고 수정할 내용을 입력한 후 '수정 적용' 버튼을 클릭해주세요.</div>",
            label="수정 결과"
        )
        
        # 이벤트 핸들러
        edit_script_dropdown.focus(
            fn=lambda: self.client.get_script_choices(""),
            outputs=[edit_script_dropdown]
        )
        
        edit_refresh_btn.click(
            fn=lambda: self.client.get_script_choices(""),
            outputs=[edit_script_dropdown]
        )
        
        edit_submit_btn.click(
            fn=self.client.update_script_metadata,
            inputs=[
                edit_script_dropdown,
                edit_title,
                edit_description,
                edit_tags,
                edit_thumbnail_text,
                edit_imagefx_prompt
            ],
            outputs=[edit_result_display]
        )
        
        # Phase 1.3: 스크립트 삭제 기능 추가
        gr.Markdown("---")  # 구분선
        gr.Markdown("### 🗑️ 스크립트 삭제")
        gr.Markdown("💫 **CLI 동등 기능**: `script delete <ID>` 명령과 동일합니다.")
        gr.Markdown("⚠️ **경고**: 삭제된 스크립트는 되돌릴 수 없습니다. 신중하게 선택해주세요.")
        
        with gr.Row():
            with gr.Column(scale=1):
                # 삭제할 스크립트 선택
                delete_script_dropdown = gr.Dropdown(
                    label="🗑️ 삭제할 스크립트 선택",
                    choices=[],
                    interactive=True,
                    info="모든 상태의 스크립트를 선택할 수 있습니다."
                )
                
                delete_refresh_btn = gr.Button(
                    "🔄 선택지 새로고침",
                    variant="secondary"
                )
                
                # 삭제 확인 체크박스
                delete_confirmation = gr.Checkbox(
                    label="⚠️ 삭제 확인",
                    info="이 스크립트를 영구적으로 삭제하는 것에 동의합니다.",
                    value=False
                )
                
                delete_submit_btn = gr.Button(
                    "🗑️ 삭제 실행",
                    variant="stop"  # 빨간색 버튼
                )
            
            with gr.Column(scale=2):
                # 삭제 결과 표시
                delete_result_display = gr.HTML(
                    value="<div style='text-align: center; padding: 40px; color: #6b7280;'>🗑️ 삭제할 스크립트를 선택하고 확인 체크박스를 체크한 후 '삭제 실행' 버튼을 클릭해주세요.<br><br><strong style='color: #dc2626;'>⚠️ 주의: 삭제된 데이터는 되돌릴 수 없습니다.</strong></div>",
                    label="삭제 결과"
                )
        
        # 이벤트 핸들러
        delete_script_dropdown.focus(
            fn=lambda: self.client.get_script_choices(""),
            outputs=[delete_script_dropdown]
        )
        
        delete_refresh_btn.click(
            fn=lambda: self.client.get_script_choices(""),
            outputs=[delete_script_dropdown]
        )
        
        delete_submit_btn.click(
            fn=self.client.delete_script,
            inputs=[delete_script_dropdown, delete_confirmation],
            outputs=[delete_result_display]
        )
    
    def _create_video_tab(self):
        """비디오 업로드 탭 구성"""
        
        gr.Markdown("### 📹 비디오 파일 업로드")
        
        with gr.Row():
            with gr.Column():
                # 스크립트 선택
                script_dropdown = gr.Dropdown(
                    label="📝 스크립트 선택 (script_ready 상태만)",
                    choices=[],
                    interactive=True
                )
                
                # 비디오 파일 업로드
                video_file = gr.File(
                    label="비디오 파일 선택",
                    file_types=[".mp4", ".avi", ".mov", ".mkv"],
                    file_count="single"
                )
                
                video_upload_btn = gr.Button(
                    "📹 비디오 업로드",
                    variant="primary"
                )
                
                video_result = gr.Textbox(
                    label="업로드 결과",
                    interactive=False,
                    lines=4
                )
        
        # 스크립트 목록 자동 업데이트
        script_dropdown.focus(
            fn=lambda: self.client.get_script_choices("script_ready"),
            outputs=[script_dropdown]
        )
        
        # 비디오 업로드 이벤트
        video_upload_btn.click(
            fn=self.client.upload_video,
            inputs=[script_dropdown, video_file],
            outputs=[video_result]
        )
        
        # Phase 2.1: 비디오 상태 관리 기능 추가
        gr.Markdown("---")  # 구분선
        gr.Markdown("### 🔍 비디오 상태 및 관리")
        gr.Markdown("💫 **CLI 동등 기능**: `video status`, `video progress`, `video delete` 명령과 동일합니다.")
        
        with gr.Tabs():
            # 비디오 상태 확인 탭
            with gr.Tab("📊 상태 확인"):
                with gr.Row():
                    with gr.Column(scale=1):
                        status_script_dropdown = gr.Dropdown(
                            label="📊 상태 확인할 스크립트 선택",
                            choices=[],
                            interactive=True,
                            info="모든 상태의 스크립트를 선택할 수 있습니다."
                        )
                        
                        status_refresh_btn = gr.Button(
                            "🔄 선택지 새로고침",
                            variant="secondary"
                        )
                        
                        status_check_btn = gr.Button(
                            "📊 상태 확인",
                            variant="primary"
                        )
                    
                    with gr.Column(scale=2):
                        status_display = gr.HTML(
                            value="<div style='text-align: center; padding: 40px; color: #6b7280;'>📊 스크립트를 선택하고 '상태 확인' 버튼을 클릭해주세요.</div>",
                            label="비디오 상태 정보"
                        )
                
                # 이벤트 핸들러
                status_script_dropdown.focus(
                    fn=lambda: self.client.get_script_choices(""),
                    outputs=[status_script_dropdown]
                )
                
                status_refresh_btn.click(
                    fn=lambda: self.client.get_script_choices(""),
                    outputs=[status_script_dropdown]
                )
                
                status_check_btn.click(
                    fn=self.client.get_video_status,
                    inputs=[status_script_dropdown],
                    outputs=[status_display]
                )
            
            # 진행률 확인 탭
            with gr.Tab("📋 진행률"):
                with gr.Row():
                    with gr.Column(scale=1):
                        progress_script_dropdown = gr.Dropdown(
                            label="📋 진행률 확인할 스크립트 선택",
                            choices=[],
                            interactive=True,
                            info="업로드 중이거나 완료된 스크립트를 선택하세요."
                        )
                        
                        progress_refresh_btn = gr.Button(
                            "🔄 선택지 새로고침",
                            variant="secondary"
                        )
                        
                        progress_check_btn = gr.Button(
                            "📋 진행률 확인",
                            variant="primary"
                        )
                    
                    with gr.Column(scale=2):
                        progress_display = gr.HTML(
                            value="<div style='text-align: center; padding: 40px; color: #6b7280;'>📋 스크립트를 선택하고 '진행률 확인' 버튼을 클릭해주세요.</div>",
                            label="업로드 진행률"
                        )
                
                # 이벤트 핸들러
                progress_script_dropdown.focus(
                    fn=lambda: self.client.get_script_choices(""),
                    outputs=[progress_script_dropdown]
                )
                
                progress_refresh_btn.click(
                    fn=lambda: self.client.get_script_choices(""),
                    outputs=[progress_script_dropdown]
                )
                
                progress_check_btn.click(
                    fn=self.client.get_upload_progress,
                    inputs=[progress_script_dropdown],
                    outputs=[progress_display]
                )
            
            # 비디오 삭제 탭
            with gr.Tab("🗑️ 비디오 삭제"):
                gr.Markdown("⚠️ **경고**: 삭제된 비디오 파일은 되돌릴 수 없습니다. 신중하게 선택해주세요.")
                
                with gr.Row():
                    with gr.Column(scale=1):
                        video_delete_script_dropdown = gr.Dropdown(
                            label="🗑️ 비디오 삭제할 스크립트 선택",
                            choices=[],
                            interactive=True,
                            info="비디오 파일이 있는 스크립트를 선택하세요."
                        )
                        
                        video_delete_refresh_btn = gr.Button(
                            "🔄 선택지 새로고침",
                            variant="secondary"
                        )
                        
                        video_delete_confirmation = gr.Checkbox(
                            label="⚠️ 삭제 확인",
                            info="이 비디오 파일을 영구적으로 삭제하는 것에 동의합니다.",
                            value=False
                        )
                        
                        video_delete_btn = gr.Button(
                            "🗑️ 비디오 삭제 실행",
                            variant="stop"
                        )
                    
                    with gr.Column(scale=2):
                        video_delete_result_display = gr.HTML(
                            value="<div style='text-align: center; padding: 40px; color: #6b7280;'>🗑️ 삭제할 스크립트를 선택하고 확인 체크박스를 체크한 후 '비디오 삭제 실행' 버튼을 클릭해주세요.<br><br><strong style='color: #dc2626;'>⚠️ 주의: 삭제된 비디오 파일은 되돌릴 수 없습니다.</strong></div>",
                            label="비디오 삭제 결과"
                        )
                
                # 이벤트 핸들러
                video_delete_script_dropdown.focus(
                    fn=lambda: self.client.get_script_choices(""),
                    outputs=[video_delete_script_dropdown]
                )
                
                video_delete_refresh_btn.click(
                    fn=lambda: self.client.get_script_choices(""),
                    outputs=[video_delete_script_dropdown]
                )
                
                video_delete_btn.click(
                    fn=self.client.delete_video_file,
                    inputs=[video_delete_script_dropdown, video_delete_confirmation],
                    outputs=[video_delete_result_display]
                )
        
        # Phase 2.2: 고급 비디오 업로드 기능 추가
        gr.Markdown("---")  # 구분선
        gr.Markdown("### 📊 고급 비디오 관리 기능")
        gr.Markdown("💫 **CLI 동등 기능**: `video ready` 명령과 동일합니다.")
        
        # 비디오 업로드 준비된 스크립트 목록
        gr.Markdown("🎥 **비디오 업로드 준비된 스크립트 목록**")
        gr.Markdown("'script_ready' 상태의 스크립트들을 표시합니다. 이 스크립트들은 비디오 업로드가 가능합니다.")
        
        ready_refresh_btn = gr.Button(
            "🔄 준비된 스크립트 목록 새로고침",
            variant="primary"
        )
        
        ready_scripts_display = gr.HTML(
            value="<div style='text-align: center; padding: 40px; color: #6b7280;'>🎥 '준비된 스크립트 목록 새로고침' 버튼을 클릭하여 목록을 확인하세요.</div>",
            label="비디오 업로드 준비된 스크립트 목록"
        )
        
        # 이벤트 핸들러
        ready_refresh_btn.click(
            fn=lambda: self.client.get_ready_scripts("script_ready"),
            outputs=[ready_scripts_display]
        )
        
    
    def _create_youtube_tab(self):
        """YouTube 업로드 탭 구성 (개별 + 배치 업로드)"""
        
        with gr.Tab("개별 업로드"):
            gr.Markdown("### 🎬 YouTube 개별 업로드")
            
            with gr.Row():
                with gr.Column():
                    # 업로드 준비된 스크립트 선택
                    youtube_script_dropdown = gr.Dropdown(
                        label="📺 업로드 준비된 스크립트 (video_ready 상태만)",
                        choices=[],
                        interactive=True
                    )
                    
                    # YouTube 설정
                    with gr.Group():
                        gr.Markdown("#### ⚙️ YouTube 업로드 설정")
                        
                        privacy_setting = gr.Radio(
                            label="공개 설정",
                            choices=["private", "unlisted", "public"],
                            value="private"
                        )
                        
                        category_setting = gr.Number(
                            label="카테고리 ID",
                            value=24,  # Entertainment
                            precision=0
                        )
                    
                    youtube_upload_btn = gr.Button(
                        "🚀 YouTube 업로드",
                        variant="primary"
                    )
                    
                    youtube_result = gr.Textbox(
                        label="업로드 결과",
                        interactive=False,
                        lines=5
                    )
            
            # 이벤트 핸들러
            youtube_script_dropdown.focus(
                fn=lambda: self.client.get_script_choices("video_ready"),
                outputs=[youtube_script_dropdown]
            )
        
        with gr.Tab("배치 업로드"):
            gr.Markdown("### 📚 YouTube 배치 업로드")
            gr.Markdown("⚠️ **할당량 제한**: 한 번에 최대 5개까지만 업로드 가능 (YouTube API 제한)")
            gr.Markdown("🕐 **할당량 리셋**: Pacific Time 자정 (한국시간 오후 4-5시)")
            
            with gr.Row():
                with gr.Column():
                    # 다중 선택 스크립트
                    batch_script_dropdown = gr.Dropdown(
                        label="📺 배치 업로드할 스크립트들 (video_ready 상태만)",
                        choices=[],
                        multiselect=True,
                        interactive=True,
                        info="최대 5개까지 선택 가능"
                    )
                    
                    # 배치 업로드 설정
                    with gr.Group():
                        gr.Markdown("#### ⚙️ 배치 업로드 설정")
                        
                        batch_privacy_setting = gr.Radio(
                            label="공개 설정",
                            choices=["private", "unlisted", "public"],
                            value="private"
                        )
                        
                        batch_category_setting = gr.Number(
                            label="카테고리 ID",
                            value=24,  # Entertainment
                            precision=0
                        )
                        
                        batch_delay_setting = gr.Slider(
                            label="업로드 간격 (초)",
                            minimum=30,
                            maximum=300,
                            value=30,
                            step=10,
                            info="YouTube API 제한으로 최소 30초"
                        )
                    
                    batch_upload_btn = gr.Button(
                        "🚀 배치 업로드 시작",
                        variant="primary"
                    )
                    
                    batch_result = gr.Textbox(
                        label="배치 업로드 결과",
                        interactive=False,
                        lines=10
                    )
            
            # 이벤트 핸들러
            batch_script_dropdown.focus(
                fn=lambda: self.client.get_script_choices("video_ready"),
                outputs=[batch_script_dropdown]
            )
        
        youtube_upload_btn.click(
            fn=self.client.upload_to_youtube,
            inputs=[youtube_script_dropdown, privacy_setting, category_setting],
            outputs=[youtube_result]
        )
        
        batch_upload_btn.click(
            fn=self.client.batch_upload_to_youtube,
            inputs=[batch_script_dropdown, batch_privacy_setting, batch_category_setting, batch_delay_setting],
            outputs=[batch_result]
        )
        
        # Phase 3.1: YouTube 업로드 관리 기능 추가
        with gr.Tab("✅ 업로드된 비디오"):
            gr.Markdown("### ✅ 업로드 완료된 YouTube 비디오")
            gr.Markdown("💫 **CLI 동등 기능**: `youtube uploaded` 명령과 동일합니다.")
            gr.Markdown("'uploaded' 상태의 스크립트들을 표시하고, YouTube 링크를 제공합니다.")
            
            uploaded_refresh_btn = gr.Button(
                "🔄 업로드된 비디오 목록 새로고침",
                variant="primary"
            )
            
            uploaded_videos_display = gr.HTML(
                value="<div style='text-align: center; padding: 40px; color: #6b7280;'>✅ '업로드된 비디오 목록 새로고침' 버튼을 클릭하여 목록을 확인하세요.</div>",
                label="업로드된 YouTube 비디오 목록"
            )
            
            # 이벤트 핸들러
            uploaded_refresh_btn.click(
                fn=self.client.get_uploaded_videos,
                outputs=[uploaded_videos_display]
            )
        
        # Phase 3.2: YouTube 할당량 모니터링 기능 추가
        with gr.Tab("📊 할당량 모니터링"):
            gr.Markdown("### 📊 YouTube API 할당량 사용량 확인")
            gr.Markdown("💫 **CLI 동등 기능**: `youtube quota` 명령과 동일합니다.")
            gr.Markdown("📈 **정보**: 일일 할당량 10,000 units, 비디오 업로드는 1,600 units/개를 사용합니다.")
            
            quota_refresh_btn = gr.Button(
                "🔄 할당량 사용량 새로고침",
                variant="primary"
            )
            
            quota_info_display = gr.HTML(
                value="<div style='text-align: center; padding: 40px; color: #6b7280;'>📊 '할당량 사용량 새로고침' 버튼을 클릭하여 할당량 정보를 확인하세요.</div>",
                label="YouTube API 할당량 정보"
            )
            
            # 이벤트 핸들러
            quota_refresh_btn.click(
                fn=self.client.get_quota_info,
                outputs=[quota_info_display]
            )
    
    def _create_status_tab(self):
        """상태 확인 탭 구성"""
        
        gr.Markdown("### 📊 시스템 상태 확인")
        
        with gr.Row():
            with gr.Column():
                # Phase 4.2: 실시간 모니터링 기능 (CLI status monitor 기능과 동일)
                gr.Markdown("#### 📊 실시간 시스템 모니터링")
                
                realtime_monitor_display = gr.HTML(
                    value="",
                    label="실시간 모니터링"
                )
                
                monitor_refresh_btn = gr.Button("📊 실시간 모니터링 시작", variant="primary")
                
                # Phase 4.1: 파이프라인 대시보드 (CLI status pipeline 기능과 동일)
                gr.Markdown("#### 🔄 파이프라인 상태 대시보드")
                
                pipeline_status_display = gr.HTML(
                    value="",
                    label="파이프라인 상태"
                )
                
                pipeline_refresh_btn = gr.Button("🔄 파이프라인 상태 확인", variant="secondary")
                
                # 시스템 상태
                gr.Markdown("#### 🩺 시스템 상태")
                
                system_status = gr.HTML(
                    value="",
                    label="상태 정보"
                )
                
                health_check_btn = gr.Button("🩺 헬스체크", variant="secondary")
                
                # 스크립트 통계
                gr.Markdown("#### 📈 스크립트 통계")
                
                stats_display = gr.HTML(
                    value="",
                    label="통계 정보"
                )
                
                stats_refresh_btn = gr.Button("🔄 통계 새로고침", variant="secondary")
        
        # 이벤트 핸들러
        monitor_refresh_btn.click(
            fn=self.client.get_real_time_monitor,
            outputs=[realtime_monitor_display]
        )
        
        pipeline_refresh_btn.click(
            fn=self.client.get_pipeline_status,
            outputs=[pipeline_status_display]
        )
        
        health_check_btn.click(
            fn=self.client.perform_health_check,
            outputs=[system_status]
        )
        
        stats_refresh_btn.click(
            fn=self.client.get_script_stats,
            outputs=[stats_display]
        )
    
    def _get_custom_css(self) -> str:
        """커스텀 CSS 스타일"""
        return """
        .gradio-container {
            max-width: 1200px !important;
        }
        
        .tab-nav {
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
        """


def create_clean_app():
    """Clean Gradio 앱 생성"""
    interface = CleanYouTubeAutomationInterface()
    app = interface.create_interface()
    
    return app


if __name__ == "__main__":
    # 환경 변수에서 포트 설정 (기본값: 7860)
    port = int(os.getenv('GRADIO_PORT', 7860))
    
    # Clean Gradio 앱 생성 및 실행
    app = create_clean_app()
    
    # 앱 실행
    print(f"🚀 Gradio 서버 시작 중... 포트 {port}")
    print(f"📱 브라우저에서 접속하세요: http://localhost:{port}")
    print(f"🔗 백엔드 API 연결: http://localhost:8000")
    print("=" * 60)
    
    app.launch(
        server_name="0.0.0.0",
        server_port=port,
        share=False,
        show_error=True,
        favicon_path=None,
        inbrowser=False  # macOS 호환성을 위해 브라우저 자동 실행 비활성화
    )