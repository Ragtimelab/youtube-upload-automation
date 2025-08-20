"""
Gradio Web Interface용 API 호출 유틸리티
FastAPI 백엔드와의 통신을 담당하는 헬퍼 함수들
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
import requests
from datetime import datetime

# 프로젝트 루트를 sys.path에 추가
project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from cli.utils.api_client import api, APIError
from backend.app.core.constants import FileConstants, NetworkConstants


class GradioAPIClient:
    """Gradio 인터페이스용 API 클라이언트"""
    
    def __init__(self):
        self.api = api  # 기존 CLI API 클라이언트 재사용
        self.base_url = NetworkConstants.DEFAULT_API_BASE_URL
    
    def get_system_status_html(self) -> str:
        """시스템 상태를 HTML 형태로 반환"""
        try:
            # API 서버 상태 확인
            health = self.api.health_check()
            upload_health = self.api.upload_health_check()
            
            services = health.get('services', {})
            
            # 상태별 아이콘 및 색상
            def get_status_badge(status: str, expected: str) -> str:
                if status == expected:
                    return f'<span class="status-ok">✅ {status}</span>'
                else:
                    return f'<span class="status-error">❌ {status}</span>'
            
            api_status = get_status_badge(services.get('api', 'unknown'), 'operational')
            db_status = get_status_badge(services.get('database', 'unknown'), 'connected')
            upload_status = get_status_badge(upload_health.get('upload_system', 'unknown'), 'operational')
            youtube_status = get_status_badge(upload_health.get('youtube_api', 'unknown'), 'connected')
            
            # 현재 시간
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            return f"""
            <div style="padding: 15px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <h4 style="margin: 0 0 10px 0;">🔄 시스템 상태 (마지막 업데이트: {current_time})</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <div>🖥️ API 서버: {api_status}</div>
                    <div>🗄️ 데이터베이스: {db_status}</div>
                    <div>📤 업로드 시스템: {upload_status}</div>
                    <div>🎬 YouTube API: {youtube_status}</div>
                </div>
            </div>
            """
            
        except APIError as e:
            return f"""
            <div style="padding: 15px; border-radius: 8px; background: #fee2e2; border: 1px solid #fecaca;">
                <span class="status-error">❌ API 연결 실패: {str(e)}</span>
            </div>
            """
    
    def upload_script(self, file) -> Tuple[str, List[List]]:
        """스크립트 파일 업로드"""
        if file is None:
            return "❌ 파일을 선택해주세요.", []
        
        try:
            # 파일 경로 확인
            file_path = file.name if hasattr(file, 'name') else str(file)
            
            # 파일 형식 검증
            if not file_path.lower().endswith(tuple(FileConstants.ALLOWED_SCRIPT_EXTENSIONS)):
                allowed = ', '.join(FileConstants.ALLOWED_SCRIPT_EXTENSIONS)
                return f"❌ 지원하지 않는 파일 형식입니다. 지원 형식: {allowed}", []
            
            # API 호출
            result = self.api.upload_script(file_path)
            
            # 성공 메시지
            script_id = result.get('id', 'Unknown')
            title = result.get('title', '제목 없음')
            success_msg = f"✅ 스크립트 업로드 성공!\n📄 ID: {script_id}\n📝 제목: {title}"
            
            # 스크립트 목록도 함께 반환
            scripts_data = self.get_scripts_list()
            
            return success_msg, scripts_data
            
        except APIError as e:
            return f"❌ 업로드 실패: {str(e)}", []
        except Exception as e:
            return f"❌ 예상치 못한 오류: {str(e)}", []
    
    def get_scripts_list(self) -> List[List]:
        """스크립트 목록을 Dataframe 형태로 반환"""
        try:
            result = self.api.get_scripts()
            
            # API 클라이언트가 이미 데이터를 추출해서 반환
            # result가 리스트면 직접 사용, dict면 'scripts' 키에서 추출
            if isinstance(result, list):
                scripts = result
            else:
                scripts = result.get('scripts', [])
            
            # Dataframe용 데이터 포매팅
            formatted_data = []
            for script in scripts:
                row = [
                    script.get('id', ''),
                    script.get('title', '제목 없음')[:50],  # 제목 길이 제한
                    self._format_status(script.get('status', '')),
                    self._format_date(script.get('created_at', ''))
                ]
                formatted_data.append(row)
            
            return formatted_data
            
        except APIError:
            return [["오류", "스크립트 목록을 가져올 수 없습니다", "", ""]]
    
    def get_script_choices(self, status_filter: str) -> Dict[str, List[str]]:
        """특정 상태의 스크립트를 드롭다운 선택지로 반환"""
        try:
            result = self.api.get_scripts(status=status_filter)
            
            # API 클라이언트가 이미 데이터를 추출해서 반환
            if isinstance(result, list):
                scripts = result
            else:
                scripts = result.get('scripts', [])
            
            choices = []
            for script in scripts:
                script_id = script.get('id', '')
                title = script.get('title', '제목 없음')
                choice_label = f"[{script_id}] {title[:40]}"
                choices.append(choice_label)
            
            return {"choices": choices}
            
        except APIError:
            return {"choices": ["⚠️ 스크립트 목록을 가져올 수 없습니다"]}
    
    def upload_video(self, script_choice: str, video_file) -> str:
        """비디오 파일 업로드"""
        if not script_choice or script_choice.startswith("⚠️"):
            return "❌ 유효한 스크립트를 선택해주세요."
        
        if video_file is None:
            return "❌ 비디오 파일을 선택해주세요."
        
        try:
            # 스크립트 ID 추출 (예: "[123] 제목" -> 123)
            script_id = int(script_choice.split(']')[0].replace('[', ''))
            
            # 파일 경로 확인
            video_path = video_file.name if hasattr(video_file, 'name') else str(video_file)
            
            # 파일 형식 검증
            if not video_path.lower().endswith(tuple(FileConstants.ALLOWED_VIDEO_EXTENSIONS)):
                allowed = ', '.join(FileConstants.ALLOWED_VIDEO_EXTENSIONS)
                return f"❌ 지원하지 않는 비디오 형식입니다. 지원 형식: {allowed}"
            
            # API 호출
            result = self.api.upload_video(script_id, video_path)
            
            # 성공 메시지
            return f"""✅ 비디오 업로드 성공!
📄 스크립트 ID: {script_id}
📹 파일: {Path(video_path).name}
🔄 새로운 상태: {result.get('new_status', 'video_ready')}

💡 다음 단계: YouTube 업로드 탭에서 YouTube에 업로드하세요."""
            
        except ValueError:
            return "❌ 스크립트 ID를 추출할 수 없습니다. 올바른 스크립트를 선택해주세요."
        except APIError as e:
            return f"❌ 비디오 업로드 실패: {str(e)}"
        except Exception as e:
            return f"❌ 예상치 못한 오류: {str(e)}"
    
    def upload_to_youtube(self, script_choice: str, privacy: str, category: int) -> str:
        """YouTube 업로드"""
        if not script_choice or script_choice.startswith("⚠️"):
            return "❌ 유효한 스크립트를 선택해주세요."
        
        try:
            # 스크립트 ID 추출
            script_id = int(script_choice.split(']')[0].replace('[', ''))
            
            # API 호출
            result = self.api.upload_to_youtube(
                script_id=script_id,
                privacy_status=privacy,
                category_id=category
            )
            
            # 성공 메시지
            youtube_id = result.get('youtube_video_id', '')
            youtube_url = f"https://youtube.com/watch?v={youtube_id}" if youtube_id else "URL 생성 중..."
            
            return f"""🎉 YouTube 업로드 성공!
📄 스크립트 ID: {script_id}
🎬 YouTube ID: {youtube_id}
🔗 YouTube URL: {youtube_url}
🔒 공개 설정: {privacy}
📂 카테고리: {category}
🔄 새로운 상태: {result.get('new_status', 'uploaded')}

✅ 업로드 완료! YouTube에서 확인하세요."""
            
        except ValueError:
            return "❌ 스크립트 ID를 추출할 수 없습니다."
        except APIError as e:
            return f"❌ YouTube 업로드 실패: {str(e)}"
        except Exception as e:
            return f"❌ 예상치 못한 오류: {str(e)}"
    
    def get_dashboard_data(self) -> Tuple[str, List[List]]:
        """대시보드 데이터 반환"""
        try:
            # 스크립트 통계
            stats = self.api.get_scripts_stats()
            
            # 통계 HTML 생성
            stats_html = self._create_stats_html(stats)
            
            # 최근 활동 (스크립트 목록의 최근 항목들)
            result = self.api.get_scripts(limit=10)
            
            # API 클라이언트가 이미 데이터를 추출해서 반환
            if isinstance(result, list):
                scripts = result
            else:
                scripts = result.get('scripts', [])
            
            recent_activity = []
            for script in scripts[-5:]:  # 최근 5개
                activity_row = [
                    self._format_date(script.get('updated_at', '')),
                    f"스크립트: {script.get('title', '제목 없음')[:30]}",
                    self._format_status(script.get('status', ''))
                ]
                recent_activity.append(activity_row)
            
            return stats_html, recent_activity
            
        except APIError as e:
            error_html = f"""
            <div style="padding: 15px; background: #fee2e2; border-radius: 8px;">
                <span class="status-error">❌ 대시보드 데이터 로드 실패: {str(e)}</span>
            </div>
            """
            return error_html, [["오류", "데이터를 가져올 수 없습니다", ""]]
    
    def _create_stats_html(self, stats: Dict[str, Any]) -> str:
        """통계 데이터를 HTML로 변환"""
        total_scripts = sum(v for v in stats.values() if isinstance(v, int))
        
        return f"""
        <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px;">
            <h3 style="margin: 0 0 15px 0;">📊 시스템 통계</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold;">{total_scripts}</div>
                    <div>전체 스크립트</div>
                </div>
                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold;">{stats.get('uploaded', 0)}</div>
                    <div>업로드 완료</div>
                </div>
                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold;">{stats.get('video_ready', 0)}</div>
                    <div>업로드 대기</div>
                </div>
            </div>
            
            <div style="margin-top: 15px; font-size: 14px; opacity: 0.9;">
                📝 스크립트 준비: {stats.get('script_ready', 0)} | 
                📹 비디오 준비: {stats.get('video_ready', 0)} | 
                ❌ 오류: {stats.get('error', 0)}
            </div>
        </div>
        """
    
    def _format_status(self, status: str) -> str:
        """상태를 사용자 친화적 형태로 변환"""
        status_map = {
            'script_ready': '📝 스크립트 준비',
            'video_ready': '📹 비디오 준비',
            'uploading': '⏳ 업로드 중',
            'uploaded': '✅ 완료',
            'error': '❌ 오류',
            'scheduled': '⏰ 예약'
        }
        return status_map.get(status, status)
    
    def _format_date(self, date_str: str) -> str:
        """날짜를 읽기 쉬운 형태로 변환"""
        if not date_str:
            return ""
        
        try:
            # ISO 형식 날짜 파싱 시도
            if 'T' in date_str:
                dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                return dt.strftime('%m-%d %H:%M')
            else:
                return date_str[:16]  # 기본적으로 앞 16자만
        except:
            return date_str[:10]  # 파싱 실패시 날짜 부분만


def format_script_data(scripts: List[Dict]) -> List[List]:
    """스크립트 데이터를 Gradio Dataframe 형태로 포매팅 (호환성 함수)"""
    client = GradioAPIClient()
    return [[
        script.get('id', ''),
        script.get('title', '제목 없음')[:50],
        client._format_status(script.get('status', '')),
        client._format_date(script.get('created_at', ''))
    ] for script in scripts]


def format_error_message(error: Exception) -> str:
    """오류 메시지를 사용자 친화적 형태로 포매팅 (호환성 함수)"""
    if isinstance(error, APIError):
        return f"❌ API 오류: {str(error)}"
    else:
        return f"❌ 시스템 오류: {str(error)}"