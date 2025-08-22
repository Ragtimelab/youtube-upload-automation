"""
Status Management - 상태 확인 및 모니터링 기능
"""

from typing import Dict, Any, List
from datetime import datetime

from .base import BaseManager
from ..utils import html_renderer, StatusStyler
from ..config import Messages


class StatusManager(BaseManager):
    """상태 관리 매니저"""
    
    def perform_health_check(self) -> str:
        """헬스체크"""
        try:
            result = self.api.health_check()
            if result.get('success', True):
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
            return html_renderer.render_error_message(
                f"연결 실패: {str(e)}",
                "CONNECTION_ERROR"
            )
    
    def get_pipeline_status(self) -> str:
        """전체 파이프라인 상태 확인 (CLI status pipeline 기능과 동일)"""
        try:
            all_scripts_result = self.api.get_scripts(limit=100)
            all_scripts = self.response_processor.extract_scripts_data(all_scripts_result)
            
            if not all_scripts:
                return html_renderer.render_template(
                    'pipeline_dashboard.html',
                    total=0
                )
            
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
            progress_percentage = (completed / total * 100) if total > 0 else 0
            
            # 상태별 테이블 데이터 생성
            status_order = ['script_ready', 'video_ready', 'uploading', 'uploaded', 'error', 'scheduled']
            status_rows = []
            
            for status in status_order:
                if status in by_status:
                    scripts = by_status[status]
                    icon, color, _ = StatusStyler.get_status_style(status)
                    script_ids = ', '.join(str(s.get('id')) for s in scripts[:5])
                    if len(scripts) > 5:
                        script_ids += f" (+{len(scripts)-5}개 더)"
                    
                    status_rows.append({
                        'status': status,
                        'icon': icon,
                        'color': color,
                        'count': len(scripts),
                        'script_ids': script_ids
                    })
            
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
            
            return html_renderer.render_template(
                'pipeline_dashboard.html',
                total=total,
                completed=completed,
                progress_percentage=progress_percentage,
                status_rows=status_rows,
                recommendations=recommendations
            )
            
        except Exception as e:
            return self._handle_api_error(e, "파이프라인 상태 조회")
    
    def get_real_time_monitor(self) -> str:
        """실시간 시스템 모니터링 (CLI status monitor 기능과 동일)"""
        try:
            # 현재 시간
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # 시스템 상태 확인
            health = self.api.health_check()
            upload_health = self.api.upload_health_check()
            
            # 서비스 상태 데이터 생성
            services = health.get('services', {})
            services_data = [
                {
                    'name': 'API 서버',
                    'status': services.get('api', 'unknown'),
                    'icon': StatusStyler.get_status_icon(services.get('api', 'unknown')),
                    'color': StatusStyler.get_status_color(services.get('api', 'unknown'))
                },
                {
                    'name': '데이터베이스',
                    'status': services.get('database', 'unknown'),
                    'icon': StatusStyler.get_status_icon(services.get('database', 'unknown')),
                    'color': StatusStyler.get_status_color(services.get('database', 'unknown'))
                },
                {
                    'name': '업로드 시스템',
                    'status': upload_health.get('upload_system', 'unknown'),
                    'icon': StatusStyler.get_status_icon(upload_health.get('upload_system', 'unknown')),
                    'color': StatusStyler.get_status_color(upload_health.get('upload_system', 'unknown'))
                },
                {
                    'name': 'YouTube API',
                    'status': upload_health.get('youtube_api', 'unknown'),
                    'icon': StatusStyler.get_status_icon(upload_health.get('youtube_api', 'unknown')),
                    'color': StatusStyler.get_status_color(upload_health.get('youtube_api', 'unknown'))
                }
            ]
            
            # 전체 시스템 상태 판단
            api_ok = services.get('api') == 'operational'
            db_ok = services.get('database') == 'connected'
            upload_ok = upload_health.get('upload_system') == 'operational'
            youtube_ok = upload_health.get('youtube_api') == 'connected'
            
            all_ok = api_ok and db_ok and upload_ok and youtube_ok
            
            if all_ok:
                status_message = "✅ 모든 시스템 정상 작동 중"
                status_color = "#22c55e"
                status_bg = "#f0fdf4"
            elif api_ok and db_ok and upload_ok:
                status_message = "⚠️ YouTube API 연결 문제 - credentials.json 확인 필요"
                status_color = "#f59e0b"
                status_bg = "#fef3c7"
            else:
                status_message = "❌ 시스템에 문제 발생"
                status_color = "#ef4444"
                status_bg = "#fee2e2"
            
            # 스크립트 통계 조회
            stats_html = ""
            try:
                stats_result = self.api.get_scripts_stats()
                stats = self.response_processor.extract_statistics_data(stats_result)
                
                stats_items = []
                for status_name, count in stats.items():
                    if isinstance(count, int):
                        stats_items.append(f"<span style='margin: 0 8px; color: #374151;'><strong>{status_name}:</strong> {count}</span>")
                
                stats_html = " | ".join(stats_items) if stats_items else "데이터 없음"
                
            except Exception:
                stats_html = "<span style='color: #ef4444;'>⚠️ 통계 조회 실패</span>"
            
            return html_renderer.render_template(
                'real_time_monitor.html',
                current_time=current_time,
                services=services_data,
                stats_html=stats_html,
                status_message=status_message,
                status_color=status_color,
                status_bg=status_bg
            )
            
        except Exception as e:
            retry_info = """
            1. 백엔드 서버가 실행 중인지 확인<br>
            2. 몇 초 후 다시 시도<br>
            3. 문제 지속 시 시스템 관리자에게 문의
            """
            return html_renderer.render_error_message(
                f"연결 오류: {str(e)}",
                "MONITORING_ERROR",
                retry_info
            )