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
            
            # 자동 새로고침 설정 (5초마다 상태 업데이트)
            interface.load(
                fn=self._update_system_status,
                outputs=[status_display],
                every=5
            )
        
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
                    wrap=True
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
        
        # 초기 데이터 로드
        script_list.load(
            fn=self._refresh_script_list,
            outputs=[script_list]
        )
    
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
            fn=self._get_video_ready_scripts,
            outputs=[youtube_script_dropdown]
        )
        
        youtube_upload_btn.click(
            fn=self._upload_to_youtube,
            inputs=[youtube_script_dropdown, privacy_setting, category_setting],
            outputs=[youtube_result]
        )
    
    def _create_dashboard_tab(self):
        """대시보드 탭 구성"""
        
        gr.Markdown("### 📊 전체 시스템 대시보드")
        
        with gr.Row():
            with gr.Column():
                # 시스템 통계
                stats_display = gr.HTML(
                    value="📊 통계 로딩 중...",
                    label="시스템 통계"
                )
                
                # 새로고침 버튼
                dashboard_refresh_btn = gr.Button("🔄 대시보드 새로고침")
            
            with gr.Column():
                # 최근 활동
                recent_activity = gr.Dataframe(
                    headers=["시간", "활동", "상태"],
                    datatype=["str", "str", "str"],
                    label="최근 활동",
                    interactive=False
                )
        
        # 대시보드 새로고침
        dashboard_refresh_btn.click(
            fn=self._refresh_dashboard,
            outputs=[stats_display, recent_activity]
        )
        
        # 자동 새로고침 (10초마다)
        stats_display.load(
            fn=self._refresh_dashboard,
            outputs=[stats_display, recent_activity],
            every=10
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
    
    def _upload_to_youtube(self, script_id, privacy, category):
        """YouTube 업로드"""
        return self.api_client.upload_to_youtube(script_id, privacy, int(category))
    
    def _refresh_dashboard(self):
        """대시보드 새로고침"""
        return self.api_client.get_dashboard_data()


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