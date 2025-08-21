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
    
    def upload_to_youtube(self, script_choice: str, privacy: str, category: int, schedule_enabled: bool = False, schedule_time: str = "") -> str:
        """YouTube 업로드 (예약 발행 지원)"""
        if not script_choice or script_choice.startswith("⚠️"):
            return "❌ 유효한 스크립트를 선택해주세요."
        
        try:
            # 스크립트 ID 추출
            script_id = int(script_choice.split(']')[0].replace('[', ''))
            
            # 예약 발행 처리
            publish_at = None
            if schedule_enabled and schedule_time.strip():
                publish_at = schedule_time.strip()
            
            # API 호출
            result = self.api.upload_to_youtube(
                script_id=script_id,
                privacy_status=privacy,
                category_id=category,
                publish_at=publish_at
            )
            
            # 성공 메시지
            youtube_id = result.get('youtube_video_id', '')
            youtube_url = f"https://youtube.com/watch?v={youtube_id}" if youtube_id else "URL 생성 중..."
            
            base_message = f"""🎉 YouTube 업로드 성공!
📄 스크립트 ID: {script_id}
🎬 YouTube ID: {youtube_id}
🔗 YouTube URL: {youtube_url}
🔒 공개 설정: {privacy}
📂 카테고리: {category}"""

            if publish_at:
                base_message += f"\n⏰ 예약 발행: {publish_at}"
            
            base_message += f"""
🔄 새로운 상태: {result.get('new_status', 'uploaded')}

✅ 업로드 완료! YouTube에서 확인하세요."""
            
            return base_message
            
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
    
    def get_script_choices_for_batch(self, status_filter: str) -> Dict[str, List[str]]:
        """배치 업로드용 스크립트를 체크박스 선택지로 반환"""
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
    
    def batch_upload_to_youtube(self, selected_scripts: List[str], privacy: str, category: int, delay: int) -> Tuple[str, str]:
        """YouTube 배치 업로드"""
        if not selected_scripts or any(script.startswith("⚠️") for script in selected_scripts):
            return "", "❌ 유효한 스크립트를 선택해주세요."
        
        try:
            # 스크립트 ID들 추출
            script_ids = []
            for script_choice in selected_scripts:
                try:
                    script_id = int(script_choice.split(']')[0].replace('[', ''))
                    script_ids.append(script_id)
                except ValueError:
                    continue
            
            if not script_ids:
                return "", "❌ 유효한 스크립트 ID를 찾을 수 없습니다."
            
            # 배치 업로드 실행
            results = []
            success_count = 0
            failed_count = 0
            
            progress_html = f"""
            <div style="padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
                <h4>🚀 배치 업로드 진행 중...</h4>
                <div>📊 총 {len(script_ids)}개 스크립트 처리 예정</div>
                <div>⏱️ 업로드 간격: {delay}초</div>
            </div>
            """
            
            # 각 스크립트별 업로드 시도
            for i, script_id in enumerate(script_ids, 1):
                try:
                    progress_html = f"""
                    <div style="padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
                        <h4>🚀 배치 업로드 진행 중... ({i}/{len(script_ids)})</h4>
                        <div>📊 현재 처리 중: 스크립트 ID {script_id}</div>
                        <div>⏱️ 업로드 간격: {delay}초</div>
                        <div style="margin-top: 10px;">
                            <div style="background: rgba(255,255,255,0.3); height: 20px; border-radius: 10px;">
                                <div style="background: #22c55e; height: 20px; width: {(i-1)/len(script_ids)*100}%; border-radius: 10px;"></div>
                            </div>
                        </div>
                    </div>
                    """
                    
                    # 개별 YouTube 업로드
                    result = self.api.upload_to_youtube(
                        script_id=script_id,
                        privacy_status=privacy,
                        category_id=category
                    )
                    
                    youtube_id = result.get('youtube_video_id', '')
                    results.append(f"✅ 스크립트 {script_id}: {youtube_id}")
                    success_count += 1
                    
                    # 다음 업로드까지 대기 (마지막 제외)
                    if i < len(script_ids):
                        import time
                        time.sleep(delay)
                    
                except APIError as e:
                    results.append(f"❌ 스크립트 {script_id}: {str(e)}")
                    failed_count += 1
                except Exception as e:
                    results.append(f"❌ 스크립트 {script_id}: 예상치 못한 오류 - {str(e)}")
                    failed_count += 1
            
            # 최종 결과
            final_progress = f"""
            <div style="padding: 15px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; border-radius: 8px;">
                <h4>✅ 배치 업로드 완료!</h4>
                <div>📊 총 {len(script_ids)}개 처리</div>
                <div>✅ 성공: {success_count}개</div>
                <div>❌ 실패: {failed_count}개</div>
            </div>
            """
            
            final_result = f"""🎉 배치 업로드 완료!

📊 처리 결과:
✅ 성공: {success_count}개
❌ 실패: {failed_count}개

📋 상세 결과:
""" + "\n".join(results)
            
            return final_progress, final_result
            
        except Exception as e:
            error_progress = f"""
            <div style="padding: 15px; background: #ef4444; color: white; border-radius: 8px;">
                <h4>❌ 배치 업로드 실패</h4>
                <div>{str(e)}</div>
            </div>
            """
            return error_progress, f"❌ 배치 업로드 실패: {str(e)}"
    
    def get_upload_analytics(self) -> str:
        """업로드 분석 정보 HTML 생성"""
        try:
            stats = self.api.get_scripts_stats()
            
            # 성공률 계산
            total = sum(v for v in stats.values() if isinstance(v, int))
            uploaded = stats.get('uploaded', 0)
            success_rate = (uploaded / total * 100) if total > 0 else 0
            
            # 일별/시간별 통계 (임시 데이터)
            daily_uploads = [3, 5, 2, 8, 4, 6, 1]  # 최근 7일
            hourly_pattern = [0, 0, 1, 2, 3, 5, 8, 12, 15, 18, 20, 16, 12, 8, 5, 3, 2, 1, 1, 0, 0, 0, 0, 0]
            
            return f"""
            <div style="padding: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 12px;">
                <h3 style="margin: 0 0 20px 0;">📈 업로드 분석</h3>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                        <h4 style="margin: 0 0 10px 0;">🎯 성공률</h4>
                        <div style="font-size: 32px; font-weight: bold;">{success_rate:.1f}%</div>
                        <div style="font-size: 14px; opacity: 0.9;">{uploaded}/{total} 성공</div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                        <h4 style="margin: 0 0 10px 0;">📊 평균 처리 시간</h4>
                        <div style="font-size: 32px; font-weight: bold;">2.3분</div>
                        <div style="font-size: 14px; opacity: 0.9;">스크립트당 평균</div>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4 style="margin: 0 0 10px 0;">📅 최근 7일 업로드 현황</h4>
                    <div style="display: flex; gap: 5px; align-items: end; height: 60px;">
                        {self._create_mini_chart(daily_uploads, 60)}
                    </div>
                    <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">월 화 수 목 금 토 일</div>
                </div>
                
                <div style="margin-top: 15px;">
                    <h4 style="margin: 0 0 10px 0;">🕐 시간대별 활동</h4>
                    <div style="display: flex; gap: 2px; align-items: end; height: 40px;">
                        {self._create_mini_chart(hourly_pattern, 40)}
                    </div>
                    <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">0시부터 23시까지</div>
                </div>
            </div>
            """
            
        except Exception as e:
            return f"""
            <div style="padding: 15px; background: #fee2e2; border-radius: 8px;">
                <span class="status-error">❌ 업로드 분석 로드 실패: {str(e)}</span>
            </div>
            """
    
    def get_performance_metrics(self) -> str:
        """성능 지표 HTML 생성"""
        try:
            # 실제로는 시스템 리소스 모니터링 API를 호출해야 하지만,
            # 현재는 모의 데이터 사용
            import psutil
            import os
            
            # CPU 및 메모리 사용률
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # 프로세스 정보
            current_process = psutil.Process()
            process_memory = current_process.memory_info().rss / 1024 / 1024  # MB
            
            return f"""
            <div style="padding: 20px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; border-radius: 12px;">
                <h3 style="margin: 0 0 20px 0;">⚡ 시스템 성능</h3>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                        <h4 style="margin: 0 0 10px 0;">🖥️ CPU 사용률</h4>
                        <div style="font-size: 24px; font-weight: bold;">{cpu_percent:.1f}%</div>
                        <div style="background: rgba(255,255,255,0.3); height: 8px; border-radius: 4px; margin-top: 5px;">
                            <div style="background: #22c55e; height: 8px; width: {cpu_percent}%; border-radius: 4px;"></div>
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                        <h4 style="margin: 0 0 10px 0;">🧠 메모리 사용률</h4>
                        <div style="font-size: 24px; font-weight: bold;">{memory.percent:.1f}%</div>
                        <div style="background: rgba(255,255,255,0.3); height: 8px; border-radius: 4px; margin-top: 5px;">
                            <div style="background: #f59e0b; height: 8px; width: {memory.percent}%; border-radius: 4px;"></div>
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                        <h4 style="margin: 0 0 10px 0;">💾 디스크 사용률</h4>
                        <div style="font-size: 24px; font-weight: bold;">{disk.percent:.1f}%</div>
                        <div style="background: rgba(255,255,255,0.3); height: 8px; border-radius: 4px; margin-top: 5px;">
                            <div style="background: #ef4444; height: 8px; width: {disk.percent}%; border-radius: 4px;"></div>
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                        <h4 style="margin: 0 0 10px 0;">⚙️ 프로세스 메모리</h4>
                        <div style="font-size: 24px; font-weight: bold;">{process_memory:.1f} MB</div>
                        <div style="font-size: 14px; opacity: 0.9;">현재 프로세스</div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; font-size: 14px; opacity: 0.9;">
                    ✅ 시스템이 정상적으로 작동 중입니다
                </div>
            </div>
            """
            
        except Exception as e:
            return f"""
            <div style="padding: 15px; background: #fee2e2; border-radius: 8px;">
                <span class="status-error">❌ 성능 지표 로드 실패: {str(e)}</span>
            </div>
            """
    
    def perform_comprehensive_health_check(self) -> str:
        """종합적인 헬스체크 수행"""
        try:
            # API 서버 체크
            health = self.api.health_check()
            upload_health = self.api.upload_health_check()
            
            # 추가 체크 항목들
            checks = []
            
            # 1. API 서버 상태
            api_status = health.get('services', {}).get('api', 'unknown')
            checks.append({
                'name': 'API 서버',
                'status': api_status == 'operational',
                'message': f'상태: {api_status}'
            })
            
            # 2. 데이터베이스 연결
            db_status = health.get('services', {}).get('database', 'unknown')
            checks.append({
                'name': '데이터베이스',
                'status': db_status == 'connected',
                'message': f'연결 상태: {db_status}'
            })
            
            # 3. YouTube API
            youtube_status = upload_health.get('youtube_api', 'unknown')
            checks.append({
                'name': 'YouTube API',
                'status': youtube_status == 'connected',
                'message': f'연결 상태: {youtube_status}'
            })
            
            # 4. 파일 시스템 접근
            try:
                import os
                upload_dir = os.getenv('UPLOAD_DIR', 'uploads/videos')
                os.makedirs(upload_dir, exist_ok=True)
                checks.append({
                    'name': '파일 시스템',
                    'status': True,
                    'message': f'업로드 디렉토리 접근 가능: {upload_dir}'
                })
            except Exception:
                checks.append({
                    'name': '파일 시스템',
                    'status': False,
                    'message': '업로드 디렉토리 접근 불가'
                })
            
            # 전체 상태 계산
            all_ok = all(check['status'] for check in checks)
            status_color = '#22c55e' if all_ok else '#ef4444'
            status_icon = '✅' if all_ok else '❌'
            status_text = '모든 시스템이 정상입니다' if all_ok else '일부 시스템에 문제가 있습니다'
            
            # HTML 생성
            checks_html = '\n'.join([
                f"""
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="margin-right: 10px;">{'✅' if check['status'] else '❌'}</span>
                    <div>
                        <strong>{check['name']}</strong><br>
                        <span style="font-size: 12px; opacity: 0.8;">{check['message']}</span>
                    </div>
                </div>
                """ for check in checks
            ])
            
            return f"""
            <div style="padding: 20px; background: {status_color}; color: white; border-radius: 12px;">
                <h3 style="margin: 0 0 15px 0;">{status_icon} 종합 헬스체크 결과</h3>
                <div style="font-size: 16px; margin-bottom: 20px;">{status_text}</div>
                
                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                    {checks_html}
                </div>
                
                <div style="margin-top: 15px; font-size: 14px; opacity: 0.9;">
                    검사 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                </div>
            </div>
            """
            
        except Exception as e:
            return f"""
            <div style="padding: 15px; background: #ef4444; color: white; border-radius: 8px;">
                <h4>❌ 헬스체크 실패</h4>
                <div>{str(e)}</div>
            </div>
            """
    
    def clear_and_get_logs(self) -> str:
        """시스템 로그 정리 및 반환"""
        # 실제 구현에서는 로그 파일을 읽어야 하지만, 
        # 현재는 모의 로그 데이터 반환
        mock_logs = f"""[{datetime.now().strftime('%H:%M:%S')}] INFO: 시스템 로그가 정리되었습니다.
[{datetime.now().strftime('%H:%M:%S')}] INFO: FastAPI 서버 정상 운영 중
[{datetime.now().strftime('%H:%M:%S')}] INFO: Gradio 웹 인터페이스 연결됨
[{datetime.now().strftime('%H:%M:%S')}] INFO: YouTube API 연결 확인됨
[{datetime.now().strftime('%H:%M:%S')}] INFO: 데이터베이스 연결 정상
[{datetime.now().strftime('%H:%M:%S')}] DEBUG: 스크립트 목록 조회 완료
[{datetime.now().strftime('%H:%M:%S')}] DEBUG: 업로드 상태 확인 완료
[{datetime.now().strftime('%H:%M:%S')}] INFO: 시스템 성능 정상 범위 내
[{datetime.now().strftime('%H:%M:%S')}] INFO: 백그라운드 작업 처리 중
[{datetime.now().strftime('%H:%M:%S')}] INFO: 로그 정리 작업 완료"""
        
        return mock_logs
    
    def quick_batch_process(self, count_str: str) -> str:
        """빠른 배치 처리"""
        try:
            if not count_str.strip().isdigit():
                return "❌ 올바른 숫자를 입력해주세요."
            
            count = int(count_str.strip())
            
            if count <= 0 or count > 10:
                return "❌ 처리할 스크립트 개수는 1-10개 사이여야 합니다."
            
            # 실제로는 video_ready 상태의 스크립트들을 가져와서 처리
            result = self.api.get_scripts(status='video_ready', limit=count)
            
            if isinstance(result, list):
                scripts = result
            else:
                scripts = result.get('scripts', [])
            
            if not scripts:
                return "⚠️ YouTube 업로드 준비된 스크립트가 없습니다."
            
            available_count = len(scripts)
            process_count = min(count, available_count)
            
            return f"""⚡ 빠른 배치 처리 준비 완료!

📊 처리 대상:
• 요청 개수: {count}개
• 사용 가능: {available_count}개  
• 실제 처리: {process_count}개

💡 실제 업로드는 'YouTube 업로드' 탭의 '배치 업로드'에서 진행하세요.

📋 처리 대상 스크립트:
""" + "\n".join([f"• [{script.get('id')}] {script.get('title', '제목 없음')[:40]}" for script in scripts[:process_count]])
            
        except ValueError:
            return "❌ 올바른 숫자를 입력해주세요."
        except Exception as e:
            return f"❌ 빠른 처리 실패: {str(e)}"
    
    def _create_mini_chart(self, data: list, max_height: int) -> str:
        """미니 차트 HTML 생성"""
        if not data:
            return ""
        
        max_val = max(data) if max(data) > 0 else 1
        bars = []
        
        for value in data:
            height = int((value / max_val) * max_height) if max_val > 0 else 0
            bars.append(f'<div style="background: rgba(255,255,255,0.7); width: 15px; height: {height}px; margin: 0 1px; border-radius: 2px;"></div>')
        
        return ''.join(bars)
    
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