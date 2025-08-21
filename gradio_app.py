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
            result = self.api.get_scripts(status=status_filter)
            # API 응답에서 data 필드 추출
            scripts = result.get('data', []) if isinstance(result, dict) else result if isinstance(result, list) else []
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
    
    def _create_status_tab(self):
        """상태 확인 탭 구성"""
        
        gr.Markdown("### 📊 시스템 상태 확인")
        
        with gr.Row():
            with gr.Column():
                # 시스템 상태
                gr.Markdown("#### 🩺 시스템 상태")
                
                system_status = gr.HTML(
                    value="",
                    label="상태 정보"
                )
                
                health_check_btn = gr.Button("🩺 헬스체크", variant="primary")
                
                # 스크립트 통계
                gr.Markdown("#### 📈 스크립트 통계")
                
                stats_display = gr.HTML(
                    value="",
                    label="통계 정보"
                )
                
                stats_refresh_btn = gr.Button("🔄 통계 새로고침", variant="secondary")
        
        # 이벤트 핸들러
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
    app.launch(
        server_name="0.0.0.0",
        server_port=port,
        share=False,
        show_error=True,
        favicon_path=None,
        inbrowser=True
    )