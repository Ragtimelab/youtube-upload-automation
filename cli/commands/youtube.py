"""
YouTube 업로드 관련 CLI 명령어
"""

import click
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.panel import Panel
from rich.table import Table
from typing import Optional, List

from ..utils.api_client import api, APIError


console = Console()


@click.group()
def youtube():
    """YouTube 업로드 관리 명령어"""
    pass


@youtube.command()
@click.argument('script_id', type=int)
@click.option('--privacy', '-p', 
              type=click.Choice(['private', 'unlisted', 'public']), 
              default='private',
              help='공개 설정 (기본: private)')
@click.option('--category', '-c', type=int, default=22, help='YouTube 카테고리 ID (기본: 22 - People & Blogs)')
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
@click.option('--category', '-c', type=int, default=22, help='YouTube 카테고리 ID (기본: 22)')
def batch(script_ids: List[int], privacy: str, category: int):
    """여러 스크립트를 YouTube에 배치 업로드
    
    Args:
        script_ids: 업로드할 스크립트 ID들
    """
    try:
        console.print(f"📺 {len(script_ids)}개 스크립트 배치 업로드 시작...", style="yellow")
        
        success_count = 0
        failed_count = 0
        results = []
        
        for i, script_id in enumerate(script_ids, 1):
            try:
                console.print(f"\n[{i}/{len(script_ids)}] 스크립트 ID {script_id} 처리 중...", style="cyan")
                
                # 스크립트 상태 확인
                script = api.get_script(script_id)
                if script.get('status') != 'video_ready':
                    console.print(f"  ⚠️ 건너뛰기: 상태가 'video_ready'가 아님 (현재: {script.get('status')})", style="yellow")
                    failed_count += 1
                    continue
                
                # YouTube 업로드
                result = api.upload_to_youtube(
                    script_id=script_id,
                    privacy_status=privacy,
                    category_id=category
                )
                
                console.print(f"  ✅ 성공: {script.get('title', '')}", style="green")
                console.print(f"  🎬 YouTube ID: {result.get('youtube_video_id')}", style="dim")
                
                results.append({
                    'script_id': script_id,
                    'title': script.get('title', ''),
                    'youtube_id': result.get('youtube_video_id'),
                    'status': 'success'
                })
                success_count += 1
                
            except APIError as e:
                console.print(f"  ❌ 실패: {e}", style="red")
                failed_count += 1
                results.append({
                    'script_id': script_id,
                    'title': script.get('title', '') if 'script' in locals() else 'Unknown',
                    'error': str(e),
                    'status': 'failed'
                })
                
        # 결과 요약
        console.print(f"\n📊 배치 업로드 완료!", style="bold")
        console.print(f"✅ 성공: {success_count}개", style="green")
        console.print(f"❌ 실패: {failed_count}개", style="red")
        
        # 성공한 항목들의 YouTube URL 표시
        if results:
            console.print("\n🔗 업로드된 비디오 URL:", style="bold")
            for result in results:
                if result['status'] == 'success':
                    console.print(f"  • https://youtube.com/watch?v={result['youtube_id']}", style="blue")
        
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
        scripts = result.get('scripts', [])
        
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
        scripts = result.get('scripts', [])
        
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