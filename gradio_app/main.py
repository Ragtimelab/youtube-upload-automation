"""
Refactored Clean Gradio Web Interface
리팩토링된 YouTube 업로드 자동화 인터페이스
"""

import os
import sys
import gradio as gr
from pathlib import Path
from typing import Optional, List, Tuple

# 프로젝트 루트를 sys.path에 추가
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from cli.utils.api_client import YouTubeAutomationAPI
from backend.app.core.constants import FileConstants, NetworkConstants

from gradio_app.managers import ScriptManager, VideoManager, YouTubeManager, StatusManager
from gradio_app.utils import html_renderer
from gradio_app.config import UIStyles


class CleanYouTubeAutomationInterface:
    """리팩토링된 YouTube 업로드 자동화 인터페이스"""
    
    def __init__(self):
        # API 클라이언트 초기화
        self.api = YouTubeAutomationAPI()
        
        # 도메인별 매니저 초기화
        self.script_manager = ScriptManager(self.api)
        self.video_manager = VideoManager(self.api)
        self.youtube_manager = YouTubeManager(self.api)
        self.status_manager = StatusManager(self.api)
        
    def create_interface(self) -> gr.Blocks:
        """메인 Gradio 인터페이스 생성"""
        
        with gr.Blocks(
            theme=gr.themes.Soft(),
            css=self._get_custom_css(),
            title="YouTube Upload Automation - 리팩토링 버전"
        ) as interface:
            
            # 헤더
            gr.Markdown(
                """
                # 📺 YouTube Upload Automation - Clean Interface v2.0
                
                **🔄 리팩토링 완료**: 유지보수성과 확장성을 위한 모듈화된 구조
                
                ---
                """
            )
            
            # 탭 구성
            with gr.Tabs():
                with gr.Tab("📝 스크립트 관리", id="scripts"):
                    self._create_script_tab()
                    
                with gr.Tab("🎬 비디오 업로드", id="videos"):
                    self._create_video_tab()
                    
                with gr.Tab("📺 YouTube 업로드", id="youtube"):
                    self._create_youtube_tab()
                    
                with gr.Tab("📊 상태 확인", id="status"):
                    self._create_status_tab()
            
            # 페이지 하단 정보
            gr.Markdown(
                """
                ---
                **📡 연결 정보**: FastAPI Backend (http://localhost:8000)
                
                **🔧 아키텍처**: 도메인별 분리된 매니저 클래스 구조
                
                **💡 개선사항**: HTML 템플릿 분리, 중복 코드 제거, 모듈화
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
        
        # Phase 1.1: 스크립트 상세 조회 기능
        gr.Markdown("---")
        gr.Markdown("### 🔍 스크립트 상세 조회")
        gr.Markdown("💫 **CLI 동등 기능**: `script show <ID>` 명령과 동일합니다.")
        
        with gr.Row():
            with gr.Column(scale=1):
                detail_script_dropdown = gr.Dropdown(
                    label="📄 상세 조회할 스크립트 선택",
                    choices=[],
                    interactive=True,
                    info="모든 상태의 스크립트를 선택할 수 있습니다."
                )
                
                detail_refresh_btn = gr.Button("🔄 선택지 새로고침", variant="secondary")
                detail_show_btn = gr.Button("🔍 상세 정보 보기", variant="primary")
            
            with gr.Column(scale=2):
                detail_display = gr.HTML(
                    value="<div style='text-align: center; padding: 40px; color: #6b7280;'>📄 스크립트를 선택하고 '상세 정보 보기' 버튼을 클릭해주세요.</div>",
                    label="스크립트 상세 정보"
                )
        
        # Phase 1.2: 스크립트 수정 기능
        gr.Markdown("---")
        gr.Markdown("### ✏️ 스크립트 메타데이터 수정")
        gr.Markdown("💫 **CLI 동등 기능**: `script edit <ID> --title '...' --description '...'` 명령과 동일합니다.")
        
        with gr.Row():
            with gr.Column():
                edit_script_dropdown = gr.Dropdown(
                    label="✏️ 수정할 스크립트 선택",
                    choices=[],
                    interactive=True
                )
                
                edit_refresh_btn = gr.Button("🔄 선택지 새로고침", variant="secondary")
                
                with gr.Group():
                    edit_title = gr.Textbox(label="새 제목 (비워두면 변경 안함)", placeholder="제목을 입력하세요")
                    edit_description = gr.Textbox(label="새 설명 (비워두면 변경 안함)", placeholder="설명을 입력하세요", lines=2)
                    edit_tags = gr.Textbox(label="새 태그 (비워두면 변경 안함)", placeholder="태그1, 태그2, ...")
                    edit_thumbnail_text = gr.Textbox(label="새 썸네일 텍스트 (비워두면 변경 안함)", placeholder="썸네일 텍스트")
                    edit_imagefx_prompt = gr.Textbox(label="새 ImageFX 프롬프트 (비워두면 변경 안함)", placeholder="ImageFX 프롬프트", lines=2)
                
                edit_submit_btn = gr.Button("💾 변경사항 저장", variant="primary")
                edit_result = gr.HTML(value="")
        
        # Phase 1.3: 스크립트 삭제 기능
        gr.Markdown("---")
        gr.Markdown("### 🗑️ 스크립트 삭제")
        gr.Markdown("⚠️ **주의**: 삭제된 스크립트는 복구할 수 없습니다.")
        
        with gr.Row():
            with gr.Column(scale=1):
                delete_script_dropdown = gr.Dropdown(
                    label="🗑️ 삭제할 스크립트 선택",
                    choices=[],
                    interactive=True
                )
                
                delete_refresh_btn = gr.Button("🔄 선택지 새로고침", variant="secondary")
                delete_confirm = gr.Checkbox(label="⚠️ 삭제를 확인합니다", value=False)
                delete_btn = gr.Button("🗑️ 스크립트 삭제", variant="stop")
            
            with gr.Column(scale=2):
                delete_result = gr.HTML(value="")
        
        # 이벤트 핸들러 설정
        self._setup_script_events(
            script_file, upload_btn, upload_result, refresh_btn, script_list,
            detail_script_dropdown, detail_refresh_btn, detail_show_btn, detail_display,
            edit_script_dropdown, edit_refresh_btn, edit_title, edit_description, edit_tags,
            edit_thumbnail_text, edit_imagefx_prompt, edit_submit_btn, edit_result,
            delete_script_dropdown, delete_refresh_btn, delete_confirm, delete_btn, delete_result
        )
    
    def _setup_script_events(self, *components):
        """스크립트 탭 이벤트 핸들러 설정"""
        (script_file, upload_btn, upload_result, refresh_btn, script_list,
         detail_script_dropdown, detail_refresh_btn, detail_show_btn, detail_display,
         edit_script_dropdown, edit_refresh_btn, edit_title, edit_description, edit_tags,
         edit_thumbnail_text, edit_imagefx_prompt, edit_submit_btn, edit_result,
         delete_script_dropdown, delete_refresh_btn, delete_confirm, delete_btn, delete_result) = components
        
        # 기본 업로드 및 목록 기능
        upload_btn.click(
            fn=self.script_manager.upload_script,
            inputs=[script_file],
            outputs=[upload_result, script_list]
        )
        
        refresh_btn.click(
            fn=self.script_manager.get_scripts_list,
            outputs=[script_list]
        )
        
        # 상세 조회 기능
        detail_script_dropdown.focus(
            fn=lambda: self.script_manager.get_script_choices(""),
            outputs=[detail_script_dropdown]
        )
        
        detail_refresh_btn.click(
            fn=lambda: self.script_manager.get_script_choices(""),
            outputs=[detail_script_dropdown]
        )
        
        detail_show_btn.click(
            fn=self.script_manager.get_script_detail,
            inputs=[detail_script_dropdown],
            outputs=[detail_display]
        )
        
        # 수정 기능
        edit_script_dropdown.focus(
            fn=lambda: self.script_manager.get_script_choices(""),
            outputs=[edit_script_dropdown]
        )
        
        edit_refresh_btn.click(
            fn=lambda: self.script_manager.get_script_choices(""),
            outputs=[edit_script_dropdown]
        )
        
        edit_submit_btn.click(
            fn=self.script_manager.update_script_metadata,
            inputs=[edit_script_dropdown, edit_title, edit_description, edit_tags, edit_thumbnail_text, edit_imagefx_prompt],
            outputs=[edit_result]
        )
        
        # 삭제 기능
        delete_script_dropdown.focus(
            fn=lambda: self.script_manager.get_script_choices(""),
            outputs=[delete_script_dropdown]
        )
        
        delete_refresh_btn.click(
            fn=lambda: self.script_manager.get_script_choices(""),
            outputs=[delete_script_dropdown]
        )
        
        delete_btn.click(
            fn=self.script_manager.delete_script,
            inputs=[delete_script_dropdown, delete_confirm],
            outputs=[delete_result]
        )
    
    def _create_video_tab(self):
        """비디오 업로드 탭 구성"""
        
        gr.Markdown("### 🎬 비디오 파일 업로드 및 관리")
        
        with gr.Row():
            with gr.Column(scale=1):
                # 비디오 업로드
                video_script_dropdown = gr.Dropdown(
                    label="📄 스크립트 선택 (script_ready 상태)",
                    choices=[],
                    interactive=True
                )
                
                video_file = gr.File(
                    label="비디오 파일 선택",
                    file_types=[".mp4", ".avi", ".mov", ".mkv"],
                    file_count="single"
                )
                
                video_upload_btn = gr.Button("📤 비디오 업로드", variant="primary")
                video_result = gr.Textbox(label="업로드 결과", interactive=False, lines=3)
            
            with gr.Column(scale=2):
                # Phase 2.1: 비디오 상태 확인
                gr.Markdown("#### 📊 비디오 상태 관리")
                
                status_script_dropdown = gr.Dropdown(
                    label="📄 상태 확인할 스크립트 선택",
                    choices=[],
                    interactive=True
                )
                
                with gr.Row():
                    status_check_btn = gr.Button("📊 상태 확인", variant="secondary")
                    progress_check_btn = gr.Button("📈 진행률 확인", variant="secondary")
                
                video_status_display = gr.HTML(value="")
        
        # Phase 2.2: 고급 비디오 관리
        gr.Markdown("---")
        gr.Markdown("### 📋 준비된 스크립트 목록")
        
        with gr.Row():
            ready_filter = gr.Dropdown(
                label="상태 필터",
                choices=["script_ready", "video_ready"],
                value="script_ready",
                interactive=True
            )
            ready_refresh_btn = gr.Button("🔄 목록 새로고침", variant="secondary")
        
        ready_scripts_display = gr.HTML(value="")
        
        # 비디오 파일 삭제 기능
        gr.Markdown("---")
        gr.Markdown("### 🗑️ 비디오 파일 삭제")
        
        with gr.Row():
            with gr.Column(scale=1):
                delete_video_dropdown = gr.Dropdown(
                    label="🗑️ 비디오 파일을 삭제할 스크립트",
                    choices=[],
                    interactive=True
                )
                
                delete_video_confirm = gr.Checkbox(label="⚠️ 삭제를 확인합니다", value=False)
                delete_video_btn = gr.Button("🗑️ 비디오 파일 삭제", variant="stop")
            
            with gr.Column(scale=2):
                delete_video_result = gr.HTML(value="")
        
        # 이벤트 핸들러 설정
        self._setup_video_events(
            video_script_dropdown, video_file, video_upload_btn, video_result,
            status_script_dropdown, status_check_btn, progress_check_btn, video_status_display,
            ready_filter, ready_refresh_btn, ready_scripts_display,
            delete_video_dropdown, delete_video_confirm, delete_video_btn, delete_video_result
        )
    
    def _setup_video_events(self, *components):
        """비디오 탭 이벤트 핸들러 설정"""
        (video_script_dropdown, video_file, video_upload_btn, video_result,
         status_script_dropdown, status_check_btn, progress_check_btn, video_status_display,
         ready_filter, ready_refresh_btn, ready_scripts_display,
         delete_video_dropdown, delete_video_confirm, delete_video_btn, delete_video_result) = components
        
        # 업로드 기능
        video_script_dropdown.focus(
            fn=lambda: self.script_manager.get_script_choices("script_ready"),
            outputs=[video_script_dropdown]
        )
        
        video_upload_btn.click(
            fn=self.video_manager.upload_video,
            inputs=[video_script_dropdown, video_file],
            outputs=[video_result]
        )
        
        # 상태 확인 기능
        status_script_dropdown.focus(
            fn=lambda: self.script_manager.get_script_choices(""),
            outputs=[status_script_dropdown]
        )
        
        status_check_btn.click(
            fn=self.video_manager.get_video_status,
            inputs=[status_script_dropdown],
            outputs=[video_status_display]
        )
        
        progress_check_btn.click(
            fn=self.video_manager.get_upload_progress,
            inputs=[status_script_dropdown],
            outputs=[video_status_display]
        )
        
        # 준비된 스크립트 목록
        ready_refresh_btn.click(
            fn=self.video_manager.get_ready_scripts,
            inputs=[ready_filter],
            outputs=[ready_scripts_display]
        )
        
        # 삭제 기능
        delete_video_dropdown.focus(
            fn=lambda: self.script_manager.get_script_choices(""),
            outputs=[delete_video_dropdown]
        )
        
        delete_video_btn.click(
            fn=self.video_manager.delete_video_file,
            inputs=[delete_video_dropdown, delete_video_confirm],
            outputs=[delete_video_result]
        )
    
    def _create_youtube_tab(self):
        """YouTube 업로드 탭 구성"""
        
        gr.Markdown("### 📺 YouTube 업로드")
        
        with gr.Row():
            with gr.Column(scale=1):
                # 단일 업로드
                youtube_script_dropdown = gr.Dropdown(
                    label="📄 업로드할 스크립트 선택 (video_ready 상태)",
                    choices=[],
                    interactive=True
                )
                
                privacy_dropdown = gr.Dropdown(
                    label="공개 설정",
                    choices=["private", "unlisted", "public"],
                    value="private",
                    interactive=True
                )
                
                category_dropdown = gr.Dropdown(
                    label="카테고리",
                    choices=["교육 (27)", "엔터테인먼트 (24)", "과학기술 (28)", "기타 (22)"],
                    value="기타 (22)",
                    interactive=True
                )
                
                youtube_upload_btn = gr.Button("📤 YouTube 업로드", variant="primary")
                youtube_result = gr.Textbox(label="업로드 결과", interactive=False, lines=4)
            
            with gr.Column(scale=2):
                # 배치 업로드
                gr.Markdown("#### 🔄 배치 업로드")
                
                batch_scripts = gr.CheckboxGroup(
                    label="📄 배치 업로드할 스크립트 선택 (최대 5개)",
                    choices=[],
                    interactive=True
                )
                
                delay_slider = gr.Slider(
                    label="업로드 간격 (초)",
                    minimum=10,
                    maximum=300,
                    value=60,
                    step=10,
                    interactive=True
                )
                
                batch_upload_btn = gr.Button("🔄 배치 업로드", variant="secondary")
        
        # Phase 3.1: YouTube 업로드 관리
        gr.Markdown("---")
        gr.Markdown("### 📋 업로드된 YouTube 비디오")
        
        with gr.Row():
            uploaded_refresh_btn = gr.Button("🔄 업로드된 비디오 목록", variant="secondary")
            uploaded_videos_display = gr.HTML(value="")
        
        # Phase 3.2: YouTube 할당량 모니터링
        gr.Markdown("---")
        gr.Markdown("### 📊 YouTube API 할당량 모니터링")
        
        with gr.Row():
            quota_check_btn = gr.Button("📊 할당량 확인", variant="secondary")
            quota_info_display = gr.HTML(value="")
        
        # 이벤트 핸들러 설정
        self._setup_youtube_events(
            youtube_script_dropdown, privacy_dropdown, category_dropdown, 
            youtube_upload_btn, youtube_result, batch_scripts, delay_slider, 
            batch_upload_btn, uploaded_refresh_btn, uploaded_videos_display,
            quota_check_btn, quota_info_display
        )
    
    def _setup_youtube_events(self, *components):
        """YouTube 탭 이벤트 핸들러 설정"""
        (youtube_script_dropdown, privacy_dropdown, category_dropdown,
         youtube_upload_btn, youtube_result, batch_scripts, delay_slider,
         batch_upload_btn, uploaded_refresh_btn, uploaded_videos_display,
         quota_check_btn, quota_info_display) = components
        
        # 단일 업로드
        youtube_script_dropdown.focus(
            fn=lambda: self.script_manager.get_script_choices("video_ready"),
            outputs=[youtube_script_dropdown]
        )
        
        youtube_upload_btn.click(
            fn=lambda script, privacy, category: self.youtube_manager.upload_to_youtube(
                script, privacy, int(category.split('(')[1].split(')')[0])
            ),
            inputs=[youtube_script_dropdown, privacy_dropdown, category_dropdown],
            outputs=[youtube_result]
        )
        
        # 배치 업로드
        batch_scripts.focus(
            fn=lambda: gr.update(choices=self.script_manager.get_script_choices("video_ready")["choices"]),
            outputs=[batch_scripts]
        )
        
        batch_upload_btn.click(
            fn=lambda scripts, privacy, category, delay: self.youtube_manager.batch_upload_to_youtube(
                scripts, privacy, int(category.split('(')[1].split(')')[0]), delay
            ),
            inputs=[batch_scripts, privacy_dropdown, category_dropdown, delay_slider],
            outputs=[youtube_result]
        )
        
        # 업로드된 비디오 목록
        uploaded_refresh_btn.click(
            fn=self.youtube_manager.get_uploaded_videos,
            outputs=[uploaded_videos_display]
        )
        
        # 할당량 정보
        quota_check_btn.click(
            fn=self.youtube_manager.get_quota_info,
            outputs=[quota_info_display]
        )
    
    def _create_status_tab(self):
        """상태 확인 탭 구성"""
        
        gr.Markdown("### 📊 시스템 상태 확인")
        
        with gr.Row():
            with gr.Column():
                # Phase 4.2: 실시간 모니터링 기능
                gr.Markdown("#### 📊 실시간 시스템 모니터링")
                
                realtime_monitor_display = gr.HTML(value="", label="실시간 모니터링")
                monitor_refresh_btn = gr.Button("📊 실시간 모니터링 시작", variant="primary")
                
                # Phase 4.1: 파이프라인 대시보드
                gr.Markdown("#### 🔄 파이프라인 상태 대시보드")
                
                pipeline_status_display = gr.HTML(value="", label="파이프라인 상태")
                pipeline_refresh_btn = gr.Button("🔄 파이프라인 상태 확인", variant="secondary")
                
                # 시스템 상태
                gr.Markdown("#### 🩺 시스템 상태")
                
                system_status = gr.HTML(value="", label="상태 정보")
                health_check_btn = gr.Button("🩺 헬스체크", variant="secondary")
                
                # 스크립트 통계
                gr.Markdown("#### 📈 스크립트 통계")
                
                stats_display = gr.HTML(value="", label="통계 정보")
                stats_refresh_btn = gr.Button("🔄 통계 새로고침", variant="secondary")
        
        # 이벤트 핸들러
        monitor_refresh_btn.click(
            fn=self.status_manager.get_real_time_monitor,
            outputs=[realtime_monitor_display]
        )
        
        pipeline_refresh_btn.click(
            fn=self.status_manager.get_pipeline_status,
            outputs=[pipeline_status_display]
        )
        
        health_check_btn.click(
            fn=self.status_manager.perform_health_check,
            outputs=[system_status]
        )
        
        stats_refresh_btn.click(
            fn=self.script_manager.get_script_stats,
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
        
        /* 리팩토링 표시 스타일 */
        .refactored-badge {
            background: linear-gradient(45deg, #22c55e, #16a34a);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
        }
        """


# 메인 실행부
if __name__ == "__main__":
    interface = CleanYouTubeAutomationInterface()
    app = interface.create_interface()
    
    app.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        debug=True
    )