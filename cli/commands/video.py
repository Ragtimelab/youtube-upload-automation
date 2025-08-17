"""
비디오 업로드 관련 CLI 명령어
"""

import click
import sys
from pathlib import Path
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.panel import Panel
import time

# 프로젝트 루트 디렉토리를 sys.path에 추가
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from cli.utils.api_client import api, APIError
from cli.utils.validators import file_validator, input_validator


console = Console()


@click.group()
def video():
    """비디오 업로드 관리 명령어"""
    pass


@video.command()
@click.argument('script_id', type=int)
@click.argument('video_file', type=click.Path(exists=True))
def upload(script_id: int, video_file: str):
    """스크립트에 비디오 파일 업로드
    
    Args:
        script_id: 대본 ID
        video_file: 업로드할 비디오 파일 경로
    """
    try:
        console.print(f"🎥 스크립트 ID {script_id}에 비디오 업로드 중...", style="yellow")
        
        # 파일 검증
        file_validator.validate_video_file(video_file)
        
        # 스크립트 상태 확인
        script = api.get_script(script_id)
        if script.get('status') != 'script_ready':
            console.print(f"❌ 스크립트 상태가 'script_ready'가 아닙니다. 현재 상태: {script.get('status')}", style="red")
            raise click.Abort()
        
        console.print(f"📝 대본: {script.get('title', '')}")
        
        # 진행률 표시
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("비디오 파일 업로드 중...", total=None)
            
            # API 호출
            result = api.upload_video(script_id, video_file)
            
            progress.update(task, description="업로드 완료!")
        
        # 성공 메시지
        console.print("✅ 비디오 업로드 성공!", style="green bold")
        console.print(f"📄 스크립트 ID: {result.get('script_id')}")
        console.print(f"📁 파일 경로: {result.get('file_path')}")
        console.print(f"📊 파일 크기: {result.get('file_size_mb', 0):.1f} MB")
        console.print(f"🔄 새로운 상태: {result.get('new_status')}")
        
    except (FileNotFoundError, ValueError) as e:
        console.print(f"❌ 파일 오류: {e}", style="red")
        raise click.Abort()
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@video.command()
@click.argument('script_id', type=int)
@click.confirmation_option(prompt='정말로 비디오 파일을 삭제하시겠습니까?')
def delete(script_id: int):
    """스크립트의 비디오 파일 삭제
    
    Args:
        script_id: 대본 ID
    """
    try:
        console.print(f"🗑️ 스크립트 ID {script_id}의 비디오 파일 삭제 중...", style="yellow")
        
        # API 호출
        result = api.delete_video_file(script_id)
        
        console.print("✅ 비디오 파일 삭제 성공!", style="green bold")
        console.print(f"📄 스크립트 ID: {result.get('script_id')}")
        console.print(f"💬 메시지: {result.get('message')}")
        console.print(f"🔄 새로운 상태: {result.get('new_status')}")
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@video.command()
@click.argument('script_id', type=int)
def status(script_id: int):
    """비디오 업로드 상태 확인
    
    Args:
        script_id: 대본 ID
    """
    try:
        console.print(f"🔍 스크립트 ID {script_id} 업로드 상태 확인 중...", style="yellow")
        
        # API 호출
        status_info = api.get_upload_status(script_id)
        
        # 상태 정보 표시
        panel_content = f"""
[bold]스크립트 ID:[/bold] {status_info.get('script_id')}
[bold]현재 상태:[/bold] {status_info.get('status')}
[bold]비디오 파일:[/bold] {status_info.get('video_file_path') or '없음'}
[bold]파일 크기:[/bold] {status_info.get('file_size_mb', 0):.1f} MB
[bold]업로드 시간:[/bold] {status_info.get('uploaded_at') or '없음'}
[bold]YouTube ID:[/bold] {status_info.get('youtube_video_id') or '없음'}
        """
        
        # 상태별 색상
        status_color = {
            'script_ready': 'yellow',
            'video_ready': 'blue',
            'uploading': 'cyan',
            'uploaded': 'green',
            'error': 'red',
            'scheduled': 'magenta'
        }.get(status_info.get('status'), 'white')
        
        console.print(Panel(panel_content.strip(), title="업로드 상태", border_style=status_color))
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@video.command()
@click.argument('script_id', type=int)
def progress(script_id: int):
    """비디오 업로드 진행률 확인 (실시간)
    
    Args:
        script_id: 대본 ID
    """
    try:
        console.print(f"📊 스크립트 ID {script_id} 진행률 모니터링 시작...", style="yellow")
        console.print("(Ctrl+C로 모니터링 종료)", style="dim")
        
        with Progress(console=console) as progress:
            task = progress.add_task("업로드 진행률", total=100)
            
            while True:
                try:
                    # API 호출
                    progress_info = api.get_upload_progress(script_id)
                    
                    percentage = progress_info.get('progress_percentage', 0)
                    status = progress_info.get('status', 'unknown')
                    
                    progress.update(task, completed=percentage, description=f"업로드 진행률 - 상태: {status}")
                    
                    # 완료된 경우 종료
                    if percentage >= 100 or status in ['uploaded', 'error']:
                        break
                    
                    time.sleep(2)  # 2초마다 확인
                    
                except KeyboardInterrupt:
                    console.print("\n⏹️ 모니터링을 중단합니다.", style="yellow")
                    break
                except APIError:
                    # 진행률 조회 실패시 계속 시도
                    time.sleep(5)
                    continue
        
        console.print("✅ 진행률 모니터링 완료!", style="green")
        
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@video.command()
def ready():
    """비디오 업로드 준비된 스크립트 목록"""
    try:
        console.print("🎥 비디오 업로드 준비된 스크립트 조회 중...", style="yellow")
        
        # 'script_ready' 상태의 스크립트들 조회
        result = api.get_scripts(status='script_ready')
        scripts = result.get('scripts', [])
        
        if not scripts:
            console.print("📭 비디오 업로드 준비된 스크립트가 없습니다.", style="yellow")
            return
        
        console.print(f"📋 비디오 업로드 가능한 스크립트: {len(scripts)}개", style="green")
        
        for script in scripts:
            console.print(f"  • ID {script.get('id')}: {script.get('title', '')}", style="white")
        
        console.print(f"\n💡 업로드 명령어: video upload <SCRIPT_ID> <VIDEO_FILE>", style="dim")
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()