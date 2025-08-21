"""
YouTube 업로드 관련 CLI 명령어
"""

import click
import sys
from pathlib import Path
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.panel import Panel
from rich.table import Table
from typing import Optional, List

# 프로젝트 루트 디렉토리를 sys.path에 추가
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from cli.utils.api_client import api, APIError


console = Console()


@click.group()
def youtube():
    """YouTube 업로드 관리 명령어"""


@youtube.command()
@click.argument('script_id', type=int)
@click.option('--privacy', '-p', 
              type=click.Choice(['private', 'unlisted', 'public']), 
              default='private',
              help='공개 설정 (기본: private)')
@click.option('--category', '-c', type=int, default=24, help='YouTube 카테고리 ID (기본: 24 - Entertainment)')
@click.option('--schedule', '-s', help='예약 발행 시간 (ISO 8601 형식, 예: 2025-08-17T09:00:00.000Z)')
def upload(script_id: int, privacy: str, category: int, schedule: Optional[str]):
    """YouTube에 비디오 업로드
    
    Args:
        script_id: 대본 ID
    """
    try:
        console.print(f"📺 스크립트 ID {script_id} YouTube 업로드 중...", style="yellow")
        
        # 스크립트 상태 확인
        script = api.get_script(script_id)
        if script.get('status') != 'video_ready':
            console.print(f"❌ 스크립트 상태가 'video_ready'가 아닙니다. 현재 상태: {script.get('status')}", style="red")
            console.print("💡 먼저 비디오를 업로드하세요: video upload <SCRIPT_ID> <VIDEO_FILE>", style="dim")
            raise click.Abort()
        
        console.print(f"📝 대본: {script.get('title', '')}")
        console.print(f"🔒 공개 설정: {privacy}")
        if schedule:
            console.print(f"⏰ 예약 발행: {schedule}")
        
        # 진행률 표시
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("YouTube 업로드 중...", total=None)
            
            # API 호출
            result = api.upload_to_youtube(
                script_id=script_id,
                privacy_status=privacy,
                category_id=category,
                publish_at=schedule
            )
            
            progress.update(task, description="업로드 완료!")
        
        # 성공 메시지
        console.print("✅ YouTube 업로드 성공!", style="green bold")
        console.print(f"📄 스크립트 ID: {result.get('script_id')}")
        console.print(f"🎬 YouTube 비디오 ID: {result.get('youtube_video_id')}")
        console.print(f"🔗 YouTube URL: https://youtube.com/watch?v={result.get('youtube_video_id')}")
        console.print(f"🔄 새로운 상태: {result.get('new_status')}")
        
        if schedule:
            console.print(f"⏰ 예약 발행 시간: {result.get('scheduled_publish_at')}", style="cyan")
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@youtube.command()
@click.argument('script_ids', nargs=-1, type=int, required=True)
@click.option('--privacy', '-p', 
              type=click.Choice(['private', 'unlisted', 'public']), 
              default='private',
              help='공개 설정 (기본: private)')
@click.option('--category', '-c', type=int, default=24, help='YouTube 카테고리 ID (기본: 24 - Entertainment)')
@click.option('--delay', '-d', type=int, default=30, help='업로드 간격(초) - 최소 30초 (기본: 30)')
def batch(script_ids: List[int], privacy: str, category: int, delay: int):
    """여러 스크립트를 YouTube에 배치 업로드
    
    Args:
        script_ids: 업로드할 스크립트 ID들
    
    Note:
        YouTube API 할당량 제한으로 인해 최대 5개까지만 한 번에 업로드 가능합니다.
        일일 최대 업로드: 6개 (10,000 units ÷ 1,600 units/upload)
    """
    try:
        # 할당량 제한 사전 체크
        if len(script_ids) > 5:
            console.print("⚠️ YouTube API 할당량 제한으로 인해 한 번에 최대 5개까지만 업로드 가능합니다.", style="yellow")
            console.print(f"💡 {len(script_ids)}개를 5개씩 나누어서 실행하세요.", style="dim")
            console.print(f"   예: youtube batch {' '.join(map(str, script_ids[:5]))}", style="dim")
            raise click.Abort()
        
        if delay < 30:
            console.print("⚠️ 업로드 간격이 너무 짧습니다. 최소 30초 이상 설정하세요.", style="yellow")
            raise click.Abort()
        
        console.print(f"📺 {len(script_ids)}개 스크립트 배치 업로드 시작...", style="yellow")
        console.print(f"⏱️ 업로드 간격: {delay}초", style="dim")
        console.print(f"🔒 공개 설정: {privacy}", style="dim")
        
        # 새로운 배치 API 사용
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("배치 업로드 진행 중...", total=None)
            
            result = api.batch_upload_to_youtube(
                script_ids=list(script_ids),
                privacy_status=privacy,
                category_id=category,
                delay_seconds=delay
            )
            
            progress.update(task, description="배치 업로드 완료!")
        
        # 결과 분석
        summary = result.get('summary', {})
        success_count = summary.get('success_count', 0)
        failed_count = summary.get('failed_count', 0)
        uploads = result.get('uploads', [])
        
        # 결과 요약 표시
        console.print(f"\n📊 배치 업로드 완료!", style="bold")
        console.print(f"✅ 성공: {success_count}개", style="green")
        if failed_count > 0:
            console.print(f"❌ 실패: {failed_count}개", style="red")
        
        # 할당량 사용량 표시
        quota_used = success_count * 1600
        console.print(f"📈 API 할당량 사용: {quota_used}/10,000 units ({quota_used/100:.1f}%)", style="cyan")
        
        # 상세 결과 표시
        if uploads:
            console.print("\n📋 상세 결과:", style="bold")
            for upload in uploads:
                status = upload.get('status', 'unknown')
                script_id = upload.get('script_id')
                
                if status == 'success':
                    youtube_id = upload.get('youtube_video_id', '')
                    console.print(f"  ✅ 스크립트 {script_id}: https://youtube.com/watch?v={youtube_id}", style="green")
                else:
                    error = upload.get('error', '알 수 없는 오류')
                    console.print(f"  ❌ 스크립트 {script_id}: {error}", style="red")
        
        # 추가 배치 업로드 안내
        if failed_count == 0 and success_count > 0:
            remaining_quota = 10000 - quota_used
            remaining_uploads = remaining_quota // 1600
            if remaining_uploads > 0:
                console.print(f"\n💡 오늘 추가로 {remaining_uploads}개 더 업로드 가능합니다.", style="dim")
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@youtube.command()
def ready():
    """YouTube 업로드 준비된 스크립트 목록"""
    try:
        console.print("📺 YouTube 업로드 준비된 스크립트 조회 중...", style="yellow")
        
        # 'video_ready' 상태의 스크립트들 조회
        result = api.get_scripts(status='video_ready')
        
        # API 클라이언트가 리스트 또는 dict 반환 가능
        if hasattr(result, 'get'):
            scripts = result.get('scripts', [])
        else:
            scripts = result
        
        if not scripts:
            console.print("📭 YouTube 업로드 준비된 스크립트가 없습니다.", style="yellow")
            return
        
        console.print(f"📋 YouTube 업로드 가능한 스크립트: {len(scripts)}개", style="green")
        
        for script in scripts:
            console.print(f"  • ID {script.get('id')}: {script.get('title', '')}", style="white")
        
        console.print(f"\n💡 업로드 명령어:", style="dim")
        console.print(f"  단일 업로드: youtube upload <SCRIPT_ID>", style="dim")
        console.print(f"  배치 업로드: youtube batch {' '.join(str(s.get('id')) for s in scripts)}", style="dim")
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@youtube.command()
def uploaded():
    """업로드 완료된 YouTube 비디오 목록"""
    try:
        console.print("📺 업로드 완료된 YouTube 비디오 조회 중...", style="yellow")
        
        # 'uploaded' 상태의 스크립트들 조회
        result = api.get_scripts(status='uploaded')
        
        # API 클라이언트가 리스트 또는 dict 반환 가능
        if hasattr(result, 'get'):
            scripts = result.get('scripts', [])
        else:
            scripts = result
        
        if not scripts:
            console.print("📭 업로드된 YouTube 비디오가 없습니다.", style="yellow")
            return
        
        # 테이블 생성
        table = Table(title=f"업로드된 YouTube 비디오 ({len(scripts)}개)")
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("제목", style="white")
        table.add_column("YouTube ID", style="green")
        table.add_column("URL", style="blue")
        table.add_column("업로드일", style="magenta")
        
        for script in scripts:
            youtube_id = script.get('youtube_video_id', '')
            youtube_url = f"https://youtube.com/watch?v={youtube_id}" if youtube_id else '-'
            
            table.add_row(
                str(script.get('id', '')),
                script.get('title', '')[:40] + ('...' if len(script.get('title', '')) > 40 else ''),
                youtube_id or '-',
                youtube_url if youtube_id else '-',
                script.get('updated_at', '')[:10] if script.get('updated_at') else ''
            )
        
        console.print(table)
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@youtube.command()
def quota():
    """YouTube API 할당량 사용량 확인"""
    try:
        console.print("📊 YouTube API 할당량 정보", style="bold blue")
        
        # 오늘 업로드한 비디오 수 계산 (uploaded 상태 스크립트)
        uploaded_scripts = api.get_scripts(status='uploaded')
        if hasattr(uploaded_scripts, 'get'):
            scripts = uploaded_scripts.get('scripts', [])
        else:
            scripts = uploaded_scripts
        
        # 오늘 날짜로 필터링 (간단히 전체 업로드 수로 가정)
        today_uploads = len(scripts) if scripts else 0
        quota_used = today_uploads * 1600
        quota_remaining = 10000 - quota_used
        remaining_uploads = quota_remaining // 1600
        
        # 할당량 정보 표시
        console.print(f"📈 일일 할당량: 10,000 units", style="white")
        console.print(f"📈 사용된 할당량: {quota_used:,} units ({quota_used/100:.1f}%)", style="cyan")
        console.print(f"📈 남은 할당량: {quota_remaining:,} units", style="green")
        console.print(f"📈 추가 업로드 가능: {remaining_uploads}개", style="yellow")
        console.print(f"🕐 할당량 리셋: Pacific Time 자정 (한국시간 오후 4-5시)", style="bright_black")
        
        # 제한 정보
        console.print(f"\n⚡ 제한 정보:", style="bold")
        console.print(f"  • 비디오 업로드 비용: 1,600 units/개", style="dim")
        console.print(f"  • 일일 최대 업로드: 6개", style="dim")
        console.print(f"  • 배치 최대 크기: 5개", style="dim")
        console.print(f"  • 최소 업로드 간격: 30초", style="dim")
        
        # 경고 메시지
        if quota_used > 8000:  # 80% 이상 사용
            console.print(f"\n⚠️ 할당량의 80% 이상을 사용했습니다!", style="red bold")
        elif quota_used > 6400:  # 64% 이상 사용 (4개 업로드)
            console.print(f"\n💡 할당량 사용에 주의하세요.", style="yellow")
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@youtube.command()
def health():
    """YouTube API 연결 상태 확인"""
    try:
        console.print("🔍 YouTube API 상태 확인 중...", style="yellow")
        
        # 업로드 시스템 헬스체크
        health = api.upload_health_check()
        
        # 시스템 상태 표시
        panel_content = f"""
[bold]업로드 시스템:[/bold] {health.get('upload_system')}
[bold]YouTube API:[/bold] {health.get('youtube_api')}
[bold]최대 파일 크기:[/bold] {health.get('max_file_size_mb')} MB
[bold]지원 형식:[/bold] {', '.join(health.get('allowed_formats', []))}
        """
        
        # 추천 설정
        recommended = health.get('recommended_settings', {})
        if recommended:
            panel_content += f"""
[bold]권장 설정:[/bold]
  • 형식: {recommended.get('format')}
  • 해상도: {recommended.get('resolution')}
  • 비트레이트: {recommended.get('bitrate')}
  • 오디오: {recommended.get('audio_bitrate')}
            """
        
        # YouTube 채널 정보
        if 'youtube_channel' in health:
            channel = health['youtube_channel']
            panel_content += f"""
[bold]연결된 채널:[/bold]
  • 이름: {channel.get('title')}
  • 구독자: {channel.get('subscriber_count')}
            """
        
        # 상태별 색상
        status_color = 'green' if health.get('youtube_api') == 'connected' else 'red'
        
        console.print(Panel(panel_content.strip(), title="YouTube API 상태", border_style=status_color))
        
        # 상태별 메시지
        if health.get('youtube_api') == 'connected':
            console.print("✅ YouTube API 연결 정상!", style="green bold")
        else:
            console.print("❌ YouTube API 연결 문제가 있습니다.", style="red bold")
            console.print("💡 credentials.json 파일을 확인하세요.", style="dim")
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()