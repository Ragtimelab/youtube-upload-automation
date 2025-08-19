"""
시스템 상태 확인 관련 CLI 명령어
"""

import click
import sys
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, BarColumn, TextColumn
import time

# 프로젝트 루트 디렉토리를 sys.path에 추가
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.app.core.constants import PaginationConstants, TimeConstants
from cli.utils.api_client import api, APIError


console = Console()


@click.group()
def status():
    """시스템 상태 확인 명령어"""
    pass


@status.command()
def system():
    """전체 시스템 상태 확인"""
    try:
        console.print("🔍 시스템 상태 확인 중...", style="yellow")
        
        # API 서버 상태
        health = api.health_check()
        upload_health = api.upload_health_check()
        
        # 기본 상태 패널
        system_panel = f"""
[bold]API 서버:[/bold] {health.get('status')}
[bold]데이터베이스:[/bold] {health.get('database')}
[bold]업로드 시스템:[/bold] {upload_health.get('upload_system')}
[bold]YouTube API:[/bold] {upload_health.get('youtube_api')}
        """
        
        # 상태별 색상 결정
        api_ok = health.get('status') == 'healthy'
        db_ok = health.get('database') == 'connected'
        upload_ok = upload_health.get('upload_system') == 'operational'
        youtube_ok = upload_health.get('youtube_api') == 'connected'
        
        all_ok = api_ok and db_ok and upload_ok and youtube_ok
        panel_color = 'green' if all_ok else 'yellow' if (api_ok and db_ok and upload_ok) else 'red'
        
        console.print(Panel(system_panel.strip(), title="시스템 상태", border_style=panel_color))
        
        # 스크립트 통계
        try:
            stats = api.get_scripts_stats()
            stats_table = Table(title="스크립트 통계")
            stats_table.add_column("상태", style="cyan")
            stats_table.add_column("개수", style="white", justify="right")
            
            for status_name, count in stats.items():
                if isinstance(count, int):
                    stats_table.add_row(status_name, str(count))
            
            console.print(stats_table)
        except APIError:
            console.print("⚠️ 스크립트 통계를 가져올 수 없습니다.", style="yellow")
        
        # 전체 상태 메시지
        if all_ok:
            console.print("✅ 모든 시스템이 정상 작동 중입니다!", style="green bold")
        elif api_ok and db_ok and upload_ok:
            console.print("⚠️ YouTube API 연결에 문제가 있습니다. credentials.json을 확인하세요.", style="yellow bold")
        else:
            console.print("❌ 시스템에 문제가 있습니다.", style="red bold")
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@status.command()
@click.argument('script_id', type=int)
def script(script_id: int):
    """특정 스크립트의 상세 상태 확인"""
    try:
        console.print(f"🔍 스크립트 ID {script_id} 상태 확인 중...", style="yellow")
        
        # 스크립트 정보
        script = api.get_script(script_id)
        
        # 업로드 상태 정보
        try:
            upload_status = api.get_upload_status(script_id)
        except APIError:
            upload_status = {}
        
        # 상태 패널
        status_panel = f"""
[bold]스크립트 ID:[/bold] {script.get('id')}
[bold]제목:[/bold] {script.get('title', '')}
[bold]현재 상태:[/bold] {script.get('status')}
[bold]생성일:[/bold] {script.get('created_at', '')}
[bold]수정일:[/bold] {script.get('updated_at', '')}
        """
        
        # 비디오 정보
        if script.get('video_file_path'):
            status_panel += f"""
[bold]비디오 파일:[/bold] {script.get('video_file_path')}
[bold]파일 크기:[/bold] {upload_status.get('file_size_mb', 0):.1f} MB
            """
        
        # YouTube 정보
        if script.get('youtube_video_id'):
            youtube_url = f"https://youtube.com/watch?v={script.get('youtube_video_id')}"
            status_panel += f"""
[bold]YouTube ID:[/bold] {script.get('youtube_video_id')}
[bold]YouTube URL:[/bold] {youtube_url}
            """
        
        # 상태별 색상
        status_colors = {
            'script_ready': 'yellow',
            'video_ready': 'blue',
            'uploading': 'cyan',
            'uploaded': 'green',
            'error': 'red',
            'scheduled': 'magenta'
        }
        color = status_colors.get(script.get('status'), 'white')
        
        console.print(Panel(status_panel.strip(), title=f"스크립트 #{script_id} 상태", border_style=color))
        
        # 다음 단계 안내
        current_status = script.get('status')
        if current_status == 'script_ready':
            console.print("📝 다음 단계: video upload <SCRIPT_ID> <VIDEO_FILE>", style="dim")
        elif current_status == 'video_ready':
            console.print("📺 다음 단계: youtube upload <SCRIPT_ID>", style="dim")
        elif current_status == 'uploaded':
            console.print("✅ 업로드 완료! YouTube에서 확인하세요.", style="green")
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@status.command()
def pipeline():
    """전체 파이프라인 상태 확인"""
    try:
        console.print("🔄 파이프라인 상태 확인 중...", style="yellow")
        
        # 모든 스크립트 조회
        all_scripts = api.get_scripts(limit=PaginationConstants.CLI_PIPELINE_LIMIT)['scripts']
        
        if not all_scripts:
            console.print("📭 등록된 스크립트가 없습니다.", style="yellow")
            return
        
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
        in_progress = len(by_status.get('video_ready', [])) + len(by_status.get('uploading', []))
        
        # 진행률 표시
        with Progress() as progress:
            task = progress.add_task("전체 파이프라인 진행률", total=total, completed=completed)
            console.print(f"📊 전체 진행률: {completed}/{total} ({completed/total*100:.1f}%)")
        
        # 상태별 테이블
        status_table = Table(title="파이프라인 상태별 스크립트")
        status_table.add_column("상태", style="cyan")
        status_table.add_column("개수", style="white", justify="right")
        status_table.add_column("스크립트 ID", style="blue")
        
        status_order = ['script_ready', 'video_ready', 'uploading', 'uploaded', 'error', 'scheduled']
        
        for status in status_order:
            if status in by_status:
                scripts = by_status[status]
                script_ids = ', '.join(str(s.get('id')) for s in scripts[:5])
                if len(scripts) > 5:
                    script_ids += f" (+{len(scripts)-5}개 더)"
                
                status_table.add_row(
                    status,
                    str(len(scripts)),
                    script_ids
                )
        
        console.print(status_table)
        
        # 병목 구간 분석
        if by_status.get('script_ready'):
            console.print("⚠️ 비디오 업로드 대기 중인 스크립트가 있습니다.", style="yellow")
        
        if by_status.get('video_ready'):
            console.print("⚠️ YouTube 업로드 대기 중인 스크립트가 있습니다.", style="yellow")
        
        if by_status.get('error'):
            console.print("❌ 오류 상태의 스크립트가 있습니다. 확인이 필요합니다.", style="red")
        
        # 추천 액션
        console.print("\n💡 추천 액션:", style="bold")
        
        if by_status.get('script_ready'):
            ready_ids = [str(s.get('id')) for s in by_status['script_ready'][:3]]
            console.print(f"  video upload {' '.join(ready_ids)} <VIDEO_FILES>", style="dim")
        
        if by_status.get('video_ready'):
            video_ready_ids = [str(s.get('id')) for s in by_status['video_ready'][:3]]
            console.print(f"  youtube batch {' '.join(video_ready_ids)}", style="dim")
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@status.command()
@click.option('--interval', '-i', default=TimeConstants.STATUS_REFRESH_INTERVAL, help='새로고침 간격 (초, 기본: 5)')
def monitor(interval: int):
    """실시간 시스템 모니터링"""
    try:
        console.print(f"📊 실시간 모니터링 시작... ({interval}초 간격)", style="yellow")
        console.print("(Ctrl+C로 모니터링 종료)", style="dim")
        
        while True:
            try:
                # 화면 클리어 (간단한 방법)
                console.clear()
                
                # 현재 시간
                from datetime import datetime
                now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                console.print(f"🕒 마지막 업데이트: {now}", style="dim")
                
                # 시스템 상태
                health = api.health_check()
                upload_health = api.upload_health_check()
                
                system_status = f"""
API: {health.get('status')} | DB: {health.get('database')} | Upload: {upload_health.get('upload_system')} | YouTube: {upload_health.get('youtube_api')}
                """
                console.print(Panel(system_status.strip(), title="시스템 상태"))
                
                # 스크립트 통계
                try:
                    stats = api.get_scripts_stats()
                    stats_line = " | ".join([f"{k}: {v}" for k, v in stats.items() if isinstance(v, int)])
                    console.print(f"📊 {stats_line}")
                except APIError:
                    console.print("⚠️ 통계 조회 실패", style="yellow")
                
                console.print(f"\n⏳ {interval}초 후 새로고침...")
                time.sleep(interval)
                
            except KeyboardInterrupt:
                console.print("\n⏹️ 모니터링을 중단합니다.", style="yellow")
                break
            except APIError:
                console.print("❌ API 연결 실패. 재시도 중...", style="red")
                time.sleep(interval)
                continue
        
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()