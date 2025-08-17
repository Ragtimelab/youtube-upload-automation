#!/usr/bin/env python3
"""
YouTube 자동화 CLI 도구
"""

import click
import sys
from pathlib import Path
from rich.console import Console
from rich.panel import Panel

# CLI 명령어 그룹들 import
from .commands.script import script
from .commands.video import video
from .commands.youtube import youtube
from .commands.status import status
from .utils.api_client import api, APIError
from .utils.validators import file_validator


console = Console()


@click.group()
@click.version_option(version="1.0.0", prog_name="YouTube 자동화 CLI")
@click.pass_context
def cli(ctx):
    """
    🎬 YouTube 업로드 자동화 CLI 도구
    
    한국 시니어를 위한 YouTube 콘텐츠 자동화 시스템
    """
    # 컨텍스트 초기화
    ctx.ensure_object(dict)
    
    # 시작 메시지 (첫 실행시만)
    if ctx.invoked_subcommand is None:
        show_welcome()


def show_welcome():
    """환영 메시지 및 사용법 표시"""
    welcome_text = """
🎬 YouTube 업로드 자동화 CLI 도구에 오신 것을 환영합니다!

[bold]주요 기능:[/bold]
• 📝 대본 파일 업로드 및 파싱
• 🎥 비디오 파일 업로드 및 연결
• 📺 YouTube 자동 업로드 (개별/배치)
• 📊 실시간 상태 모니터링

[bold]빠른 시작:[/bold]
1. script upload sample_script.txt
2. video upload <SCRIPT_ID> my_video.mp4
3. youtube upload <SCRIPT_ID>

[bold]도움말:[/bold] --help 옵션을 사용하세요
    """
    
    console.print(Panel(welcome_text.strip(), title="YouTube 자동화 CLI", border_style="blue"))


# 명령어 그룹 등록
cli.add_command(script)
cli.add_command(video) 
cli.add_command(youtube)
cli.add_command(status)


# 빠른 명령어들 (자주 사용하는 기능들)
@cli.command()
@click.argument('file_path', type=click.Path(exists=True))
def quick_upload(file_path: str):
    """빠른 대본 업로드 (script upload의 단축어)"""
    ctx = click.get_current_context()
    ctx.invoke(script.commands['upload'], file_path=file_path)


@cli.command()
@click.option('--status', '-s', help='상태별 필터링')
@click.option('--limit', '-l', default=10, help='표시할 개수')
def ls(status, limit):
    """스크립트 목록 조회 (script list의 단축어)"""
    ctx = click.get_current_context()
    ctx.invoke(script.commands['list'], status=status, limit=limit, skip=0)


@cli.command()
def health():
    """시스템 상태 빠른 확인"""
    try:
        console.print("🔍 시스템 상태 확인 중...", style="yellow")
        
        # API 연결 테스트
        health_data = api.health_check()
        
        if health_data.get('status') == 'healthy':
            console.print("✅ 시스템 정상!", style="green bold")
            
            # 간단한 통계
            try:
                stats = api.get_scripts_stats()
                total = sum(v for v in stats.values() if isinstance(v, int))
                console.print(f"📊 총 스크립트: {total}개", style="dim")
            except:
                pass
                
        else:
            console.print("❌ 시스템에 문제가 있습니다.", style="red bold")
            
    except APIError as e:
        console.print(f"❌ API 연결 실패: {e}", style="red")
        console.print("💡 백엔드 서버가 실행 중인지 확인하세요 (http://localhost:8000)", style="dim")
        sys.exit(1)


@cli.command()
@click.argument('directory', type=click.Path(exists=True, file_okay=False, dir_okay=True))
def batch_upload_scripts(directory: str):
    """디렉토리의 모든 스크립트 파일 배치 업로드"""
    try:
        console.print(f"📁 디렉토리 스캔 중: {directory}", style="yellow")
        
        # 스크립트 파일 찾기
        script_files = file_validator.find_files_in_directory(directory, ['.txt', '.md'])
        
        if not script_files:
            console.print("📭 업로드할 스크립트 파일이 없습니다.", style="yellow")
            return
            
        console.print(f"📋 발견된 파일: {len(script_files)}개", style="green")
        
        success_count = 0
        failed_count = 0
        
        for i, file_path in enumerate(script_files, 1):
            try:
                console.print(f"\n[{i}/{len(script_files)}] {file_path.name} 업로드 중...", style="cyan")
                
                result = api.upload_script(str(file_path))
                
                console.print(f"  ✅ 성공: ID {result['id']} - {result['title']}", style="green")
                success_count += 1
                
            except Exception as e:
                console.print(f"  ❌ 실패: {e}", style="red")
                failed_count += 1
        
        # 결과 요약
        console.print(f"\n📊 배치 업로드 완료!", style="bold")
        console.print(f"✅ 성공: {success_count}개", style="green")
        console.print(f"❌ 실패: {failed_count}개", style="red")
        
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@cli.command()
def pipeline():
    """전체 파이프라인 상태 및 추천 액션"""
    ctx = click.get_current_context()
    ctx.invoke(status.commands['pipeline'])


@cli.command()
def examples():
    """사용 예시 및 워크플로우"""
    examples_text = """
[bold]📝 기본 워크플로우:[/bold]

1️⃣ 대본 업로드:
   script upload my_script.txt
   
2️⃣ 비디오 업로드:
   video upload 1 my_video.mp4
   
3️⃣ YouTube 업로드:
   youtube upload 1

[bold]🚀 고급 사용법:[/bold]

• 배치 스크립트 업로드:
  batch-upload-scripts ./scripts/

• 여러 비디오 YouTube 업로드:
  youtube batch 1 2 3 4 5

• 예약 발행:
  youtube upload 1 --schedule "2025-08-17T09:00:00.000Z"

• 실시간 모니터링:
  status monitor

[bold]📊 상태 확인:[/bold]

• 시스템 전체 상태: health
• 파이프라인 상태: pipeline  
• 특정 스크립트: status script 1
• 실시간 모니터링: status monitor

[bold]🔍 목록 조회:[/bold]

• 모든 스크립트: ls
• 상태별 필터: ls --status video_ready
• 업로드 준비된 스크립트: video ready
• 업로드된 YouTube 비디오: youtube uploaded
    """
    
    console.print(Panel(examples_text.strip(), title="사용 예시", border_style="green"))


if __name__ == '__main__':
    try:
        cli()
    except KeyboardInterrupt:
        console.print("\n👋 사용해 주셔서 감사합니다!", style="yellow")
        sys.exit(0)
    except Exception as e:
        console.print(f"\n❌ 예상치 못한 오류가 발생했습니다: {e}", style="red")
        console.print("💡 이 오류가 계속 발생하면 GitHub Issues에 신고해 주세요.", style="dim")
        sys.exit(1)