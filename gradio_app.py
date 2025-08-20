"""
YouTube Upload Automation - Gradio Web Interface
기존 FastAPI 백엔드와 통합된 웹 GUI 인터페이스
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

from gradio_utils import GradioAPIClient, format_script_data, format_error_message
from backend.app.core.constants import FileConstants, NetworkConstants


class YouTubeAutomationInterface:
    """YouTube 업로드 자동화 Gradio 인터페이스"""
    
    def __init__(self):
        self.api_client = GradioAPIClient()
        self.current_scripts = []
        
    def create_interface(self) -> gr.Blocks:
        """메인 Gradio 인터페이스 생성"""
        
        with gr.Blocks(
            theme=gr.themes.Soft(),
            title="YouTube Upload Automation",
            css=self._get_custom_css()
        ) as interface:
            
            # 제목 및 설명
            gr.Markdown(
                """
                # 🎬 YouTube Upload Automation
                **FastAPI 백엔드와 통합된 YouTube 업로드 자동화 시스템**
                
                스크립트 업로드 → 비디오 매칭 → YouTube 업로드까지 원클릭으로!
                """
            )
            
            # 시스템 상태 표시
            with gr.Row():
                status_display = gr.HTML(
                    value=self._get_initial_status(),
                    label="시스템 상태"
                )
                
            # 탭 구성
            with gr.Tabs():
                
                # 1. 스크립트 관리 탭
                with gr.Tab("📝 스크립트 관리"):
                    self._create_script_tab()
                
                # 2. 비디오 업로드 탭
                with gr.Tab("📹 비디오 업로드"):
                    self._create_video_tab()
                
                # 3. YouTube 업로드 탭
                with gr.Tab("🎬 YouTube 업로드"):
                    self._create_youtube_tab()
                
                # 4. 대시보드 탭
                with gr.Tab("📊 대시보드"):
                    self._create_dashboard_tab()
            
            # 페이지 하단 정보
            gr.Markdown(
                """
                ---
                **📡 연결 정보**: FastAPI Backend (http://localhost:8000) | Gradio Frontend (http://localhost:7860)
                
                **💡 사용 팁**: 각 탭에서 단계별로 진행하거나, 대시보드에서 전체 상황을 한눈에 확인하세요.
                """
            )
            
            # 자동 새로고침은 향후 WebSocket이나 별도 스레드로 구현 예정
            # Gradio 5.x에서는 load 이벤트의 every 파라미터가 변경됨
        
        return interface
    
    def _create_script_tab(self):
        """스크립트 관리 탭 구성"""
        
        gr.Markdown("### 📝 스크립트 파일 업로드 및 관리")
        
        with gr.Row():
            with gr.Column(scale=1):
                # 파일 업로드
                script_file = gr.File(
                    label="스크립트 파일 선택",
                    file_types=[".md", ".txt"],
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
                    value=self._refresh_script_list()  # 초기 데이터 로드
                )
        
        # 이벤트 핸들러
        upload_btn.click(
            fn=self._upload_script,
            inputs=[script_file],
            outputs=[upload_result, script_list]
        )
        
        refresh_btn.click(
            fn=self._refresh_script_list,
            outputs=[script_list]
        )
        
        # 초기 데이터는 인터페이스 로드 시 자동으로 처리됩니다
    
    def _create_video_tab(self):
        """비디오 업로드 탭 구성"""
        
        gr.Markdown("### 📹 비디오 파일 업로드")
        
        with gr.Row():
            with gr.Column():
                # 스크립트 선택
                script_dropdown = gr.Dropdown(
                    label="📝 스크립트 선택",
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
            fn=self._get_ready_scripts,
            outputs=[script_dropdown]
        )
        
        # 비디오 업로드 이벤트
        video_upload_btn.click(
            fn=self._upload_video,
            inputs=[script_dropdown, video_file],
            outputs=[video_result]
        )
    
    def _create_youtube_tab(self):
        """YouTube 업로드 탭 구성"""
        
        gr.Markdown("### 🎬 YouTube 업로드")
        
        with gr.Tabs():
            # 단일 업로드 탭
            with gr.Tab("📺 단일 업로드"):
                with gr.Row():
                    with gr.Column():
                        # 업로드 준비된 스크립트 선택
                        youtube_script_dropdown = gr.Dropdown(
                            label="📺 업로드 준비된 스크립트",
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
                            
                            # 예약 발행 설정 추가
                            with gr.Row():
                                schedule_upload = gr.Checkbox(
                                    label="예약 발행 사용",
                                    value=False
                                )
                                
                                schedule_datetime = gr.Textbox(
                                    label="예약 시간 (ISO 8601)",
                                    placeholder="2025-08-21T09:00:00.000Z",
                                    interactive=False
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
            
            # 배치 업로드 탭  
            with gr.Tab("📦 배치 업로드"):
                with gr.Row():
                    with gr.Column():
                        # 업로드 준비된 스크립트 다중 선택
                        batch_refresh_btn = gr.Button("🔄 스크립트 목록 새로고침", size="sm")
                        
                        batch_scripts = gr.CheckboxGroup(
                            label="📺 배치 업로드할 스크립트 선택",
                            choices=[],
                            interactive=True
                        )
                        
                        # 배치 설정
                        with gr.Group():
                            gr.Markdown("#### ⚙️ 배치 업로드 설정")
                            
                            batch_privacy = gr.Radio(
                                label="공개 설정",
                                choices=["private", "unlisted", "public"],
                                value="private"
                            )
                            
                            batch_category = gr.Number(
                                label="카테고리 ID",
                                value=24,
                                precision=0
                            )
                            
                            batch_delay = gr.Slider(
                                label="업로드 간격 (초)",
                                minimum=10,
                                maximum=300,
                                value=30,
                                step=10
                            )
                        
                        batch_upload_btn = gr.Button(
                            "🚀 배치 업로드 시작",
                            variant="primary"
                        )
                        
                        batch_progress = gr.HTML(
                            value="",
                            label="진행 상황"
                        )
                        
                        batch_result = gr.Textbox(
                            label="배치 업로드 결과",
                            interactive=False,
                            lines=8
                        )
        
        # 이벤트 핸들러 - 단일 업로드
        youtube_script_dropdown.focus(
            fn=self._get_video_ready_scripts,
            outputs=[youtube_script_dropdown]
        )
        
        # 예약 발행 체크박스 상태에 따른 입력 필드 활성화
        schedule_upload.change(
            fn=lambda checked: gr.update(interactive=checked),
            inputs=[schedule_upload],
            outputs=[schedule_datetime]
        )
        
        youtube_upload_btn.click(
            fn=self._upload_to_youtube,
            inputs=[youtube_script_dropdown, privacy_setting, category_setting, schedule_upload, schedule_datetime],
            outputs=[youtube_result]
        )
        
        # 배치 업로드 이벤트 핸들러
        batch_refresh_btn.click(
            fn=self._get_video_ready_scripts_for_batch,
            outputs=[batch_scripts]
        )
        
        batch_upload_btn.click(
            fn=self._batch_upload_to_youtube,
            inputs=[batch_scripts, batch_privacy, batch_category, batch_delay],
            outputs=[batch_progress, batch_result]
        )
    
    def _create_dashboard_tab(self):
        """대시보드 탭 구성"""
        
        gr.Markdown("### 📊 전체 시스템 대시보드")
        
        # 상단: 시스템 상태 및 통계
        with gr.Row():
            # 시스템 상태
            with gr.Column(scale=1):
                system_status = gr.HTML(
                    value=self._get_initial_status(),
                    label="시스템 상태"
                )
                
                # 새로고침 및 제어 버튼들
                with gr.Row():
                    dashboard_refresh_btn = gr.Button("🔄 새로고침", variant="primary")
                    health_check_btn = gr.Button("🩺 헬스체크", variant="secondary")
                    clear_logs_btn = gr.Button("🗑️ 로그 정리", variant="secondary")
            
            # 시스템 통계
            with gr.Column(scale=2):
                stats_display = gr.HTML(
                    value="📊 통계 로딩 중...",
                    label="시스템 통계"
                )
        
        # 중단: 상세 정보 탭
        with gr.Tabs():
            # 최근 활동 탭
            with gr.Tab("📋 최근 활동"):
                recent_activity = gr.Dataframe(
                    headers=["시간", "스크립트", "상태", "진행률"],
                    datatype=["str", "str", "str", "str"],
                    label="최근 활동 (실시간)",
                    interactive=False,
                    wrap=True
                )
            
            # 업로드 현황 탭  
            with gr.Tab("📈 업로드 현황"):
                upload_analytics = gr.HTML(
                    value="📈 업로드 현황 로딩 중...",
                    label="업로드 분석"
                )
            
            # 시스템 로그 탭
            with gr.Tab("📜 시스템 로그"):
                system_logs = gr.Textbox(
                    label="시스템 로그 (최근 100줄)",
                    lines=10,
                    interactive=False,
                    max_lines=20
                )
            
            # 성능 모니터링 탭
            with gr.Tab("⚡ 성능 모니터링"):
                performance_metrics = gr.HTML(
                    value="⚡ 성능 지표 로딩 중...",
                    label="성능 모니터링"
                )
        
        # 하단: 빠른 액션
        with gr.Row():
            with gr.Column():
                gr.Markdown("#### 🚀 빠른 액션")
                
                with gr.Row():
                    quick_script_count = gr.Textbox(
                        label="업로드할 스크립트 개수",
                        value="1",
                        interactive=True,
                        scale=1
                    )
                    
                    quick_batch_btn = gr.Button(
                        "⚡ 빠른 배치 처리",
                        variant="primary",
                        scale=2
                    )
                
                quick_result = gr.Textbox(
                    label="빠른 액션 결과",
                    interactive=False,
                    lines=3
                )
        
        # 이벤트 핸들러들
        dashboard_refresh_btn.click(
            fn=self._refresh_dashboard,
            outputs=[system_status, stats_display, recent_activity, upload_analytics, performance_metrics]
        )
        
        health_check_btn.click(
            fn=self._perform_health_check,
            outputs=[system_status]
        )
        
        clear_logs_btn.click(
            fn=self._clear_system_logs,
            outputs=[system_logs]
        )
        
        quick_batch_btn.click(
            fn=self._quick_batch_process,
            inputs=[quick_script_count],
            outputs=[quick_result]
        )
        
        # 자동 새로고침 (5초마다)
        # Gradio 5.x에서는 load 이벤트의 every 파라미터 사용법이 변경됨
    
    def _get_custom_css(self) -> str:
        """커스텀 CSS 스타일"""
        return """
        .gradio-container {
            max-width: 1200px !important;
        }
        
        .tab-nav {
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
        
        .status-ok { color: #22c55e; font-weight: bold; }
        .status-error { color: #ef4444; font-weight: bold; }
        .status-warning { color: #f59e0b; font-weight: bold; }
        """
    
    def _get_initial_status(self) -> str:
        """초기 시스템 상태 HTML"""
        return """
        <div style="padding: 10px; border-radius: 8px; background: #f8fafc;">
            <span class="status-warning">🔍 시스템 상태 확인 중...</span>
        </div>
        """
    
    # API 호출 메서드들 (gradio_utils.py의 함수들을 호출)
    def _update_system_status(self):
        """시스템 상태 업데이트"""
        return self.api_client.get_system_status_html()
    
    def _upload_script(self, file):
        """스크립트 업로드"""
        result, scripts = self.api_client.upload_script(file)
        return result, scripts
    
    def _refresh_script_list(self):
        """스크립트 목록 새로고침"""
        return self.api_client.get_scripts_list()
    
    def _get_ready_scripts(self):
        """업로드 준비된 스크립트 목록"""
        return self.api_client.get_script_choices("script_ready")
    
    def _get_video_ready_scripts(self):
        """비디오 업로드 완료된 스크립트 목록"""
        return self.api_client.get_script_choices("video_ready")
    
    def _upload_video(self, script_id, video_file):
        """비디오 업로드"""
        return self.api_client.upload_video(script_id, video_file)
    
    def _upload_to_youtube(self, script_id, privacy, category, schedule_enabled, schedule_time):
        """YouTube 업로드 (예약 발행 지원)"""
        return self.api_client.upload_to_youtube(script_id, privacy, int(category), schedule_enabled, schedule_time)
    
    def _get_video_ready_scripts_for_batch(self):
        """배치 업로드용 비디오 준비된 스크립트 목록"""
        return self.api_client.get_script_choices_for_batch("video_ready")
    
    def _batch_upload_to_youtube(self, selected_scripts, privacy, category, delay):
        """YouTube 배치 업로드"""
        return self.api_client.batch_upload_to_youtube(selected_scripts, privacy, int(category), int(delay))
    
    def _refresh_dashboard(self):
        """대시보드 새로고침"""
        system_status = self.api_client.get_system_status_html()
        stats_html, recent_activity = self.api_client.get_dashboard_data()
        upload_analytics = self.api_client.get_upload_analytics()
        performance_metrics = self.api_client.get_performance_metrics()
        
        return system_status, stats_html, recent_activity, upload_analytics, performance_metrics
    
    def _perform_health_check(self):
        """시스템 헬스체크 수행"""
        return self.api_client.perform_comprehensive_health_check()
    
    def _clear_system_logs(self):
        """시스템 로그 정리"""
        return self.api_client.clear_and_get_logs()
    
    def _quick_batch_process(self, count_str):
        """빠른 배치 처리"""
        return self.api_client.quick_batch_process(count_str)


def create_app():
    """Gradio 앱 생성 및 설정"""
    interface = YouTubeAutomationInterface()
    app = interface.create_interface()
    
    return app


if __name__ == "__main__":
    # 환경 변수에서 포트 설정 (기본값: 7860)
    port = int(os.getenv('GRADIO_PORT', 7860))
    
    # Gradio 앱 생성 및 실행
    app = create_app()
    
    # 앱 실행
    app.launch(
        server_name="0.0.0.0",
        server_port=port,
        share=False,  # 로컬 개발용
        show_error=True,
        favicon_path=None,
        inbrowser=True  # 자동으로 브라우저 열기
    )