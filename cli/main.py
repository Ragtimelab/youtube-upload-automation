#!/usr/bin/env python3
"""
YouTube 자동화 CLI 도구
"""

import click
import sys
import os
from pathlib import Path
from rich.console import Console
from rich.panel import Panel

# 프로젝트 루트 디렉토리를 sys.path에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# CLI 명령어 그룹들 import (절대 임포트)
from cli.commands.script import script
from cli.commands.video import video
from cli.commands.youtube import youtube
from cli.commands.status import status
from cli.utils.api_client import api, APIError
from cli.utils.validators import file_validator
from cli.utils.date_mapping import date_mapper


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

[bold]🗓️ 날짜 기반 자동 매핑:[/bold]

• 날짜 기반 자동 매핑: video auto-mapping scripts/ videos/
• 특정 날짜: video auto-mapping scripts/ videos/ --date 20250817
• 매핑 시뮬레이션: video auto-mapping scripts/ videos/ --dry-run
• 오늘 작업 완전 자동화: date-upload scripts/ videos/
    """
    
    console.print(Panel(examples_text.strip(), title="사용 예시", border_style="green"))


@cli.command()
@click.argument('script_dir', type=click.Path(exists=True, file_okay=False, dir_okay=True))
@click.argument('video_dir', type=click.Path(exists=True, file_okay=False, dir_okay=True))
@click.option('--date', '-d', help='대상 날짜 (YYYYMMDD, 기본: 오늘)')
@click.option('--privacy', '-p', type=click.Choice(['private', 'unlisted', 'public']), 
              default='private', help='YouTube 공개 설정 (기본: private)')
@click.option('--dry-run', is_flag=True, help='실제 업로드 없이 확인만')
def date_upload(script_dir: str, video_dir: str, date: str, privacy: str, dry_run: bool):
    """날짜 기반 완전 자동화 업로드 (대본→영상→YouTube)
    
    파일명 형식: YYYYMMDD_NN_story.txt, YYYYMMDD_NN_story.mp4
    
    Args:
        script_dir: 대본 파일 디렉토리
        video_dir: 영상 파일 디렉토리
    """
    try:
        # 날짜 설정
        target_date = date or date_mapper.get_today_date()
        
        if not date_mapper.validate_date_format(target_date):
            console.print(f"❌ 잘못된 날짜 형식입니다: {target_date} (YYYYMMDD 형식 필요)", style="red")
            raise click.Abort()
        
        formatted_date = f"{target_date[:4]}-{target_date[4:6]}-{target_date[6:8]}"
        
        if dry_run:
            console.print(f"🔍 날짜 기반 완전 자동화 시뮬레이션 - {formatted_date}", style="cyan")
        else:
            console.print(f"🚀 날짜 기반 완전 자동화 시작 - {formatted_date}", style="yellow")
        
        console.print(f"📁 대본 디렉토리: {script_dir}")
        console.print(f"🎥 영상 디렉토리: {video_dir}")
        console.print(f"🔒 YouTube 공개 설정: {privacy}")
        
        # 대본과 영상 파일 매칭
        matches = date_mapper.match_script_video_files(script_dir, video_dir, target_date)
        
        if not matches:
            console.print(f"📭 {formatted_date} 날짜의 매칭되는 파일이 없습니다.", style="yellow")
            console.print("💡 파일명 형식을 확인하세요: YYYYMMDD_NN_story.txt/mp4", style="dim")
            return
        
        # 매칭 결과 출력
        date_mapper.print_matching_summary(matches)
        
        if dry_run:
            console.print(f"\n✅ 시뮬레이션 완료! {len(matches)}개 파일이 완전 자동화됩니다.", style="green")
            console.print("💡 실제 실행하려면 --dry-run 옵션을 제거하세요.", style="dim")
            return
        
        # 사용자 확인
        console.print(f"\n🤔 {len(matches)}개 파일을 완전 자동화하시겠습니까?", style="bold")
        console.print("   1단계: 대본 업로드", style="dim")
        console.print("   2단계: 영상 연결", style="dim")
        console.print("   3단계: YouTube 업로드", style="dim")
        
        confirm = click.confirm("계속 진행하시겠습니까?")
        if not confirm:
            console.print("👋 자동화를 취소했습니다.", style="yellow")
            return
        
        # 1단계: 대본 파일들 업로드
        console.print(f"\n📝 1단계: 대본 파일 업로드 중...", style="cyan")
        
        uploaded_scripts = []
        for script_file, video_file in matches:
            script_path = script_file.path / script_file.full_filename
            try:
                console.print(f"  📄 {script_file.full_filename} 업로드 중...", style="white")
                result = api.upload_script(str(script_path))
                uploaded_scripts.append({
                    'id': result['id'],
                    'title': result['title'],
                    'script_file': script_file,
                    'video_file': video_file
                })
                console.print(f"    ✅ 성공: ID {result['id']}", style="green")
            except Exception as e:
                console.print(f"    ❌ 실패: {e}", style="red")
        
        if not uploaded_scripts:
            console.print("❌ 업로드된 대본이 없어서 자동화를 중단합니다.", style="red")
            raise click.Abort()
        
        # 2단계: 영상 파일들 자동 매핑
        console.print(f"\n🎥 2단계: 영상 파일 자동 매핑 중...", style="cyan")
        
        video_ready_scripts = []
        
        for script_data in uploaded_scripts:
            script_id = script_data['id']
            video_file = script_data['video_file']
            video_path = video_file.path / video_file.full_filename
            
            try:
                console.print(f"  🎬 ID {script_id} ← {video_file.full_filename}", style="white")
                result = api.upload_video(script_id, str(video_path))
                video_ready_scripts.append(script_data)
                console.print(f"    ✅ 성공: 영상 연결 완료", style="green")
            except Exception as e:
                console.print(f"    ❌ 실패: {e}", style="red")
        
        if not video_ready_scripts:
            console.print("❌ 영상이 연결된 대본이 없어서 YouTube 업로드를 건너뜁니다.", style="red")
        else:
            # 3단계: YouTube 배치 업로드
            console.print(f"\n📺 3단계: YouTube 배치 업로드 중...", style="cyan")
            console.print(f"🔒 공개 설정: {privacy}", style="white")
            
            script_ids = [s['id'] for s in video_ready_scripts]
            
            try:
                # YouTube 배치 업로드 (실제로는 개별 호출)
                youtube_success = 0
                for script_data in video_ready_scripts:
                    script_id = script_data['id']
                    title = script_data['title']
                    
                    try:
                        console.print(f"  📺 ID {script_id}: {title} YouTube 업로드 중...", style="white")
                        result = api.upload_to_youtube(script_id, privacy_status=privacy)
                        youtube_url = result.get('youtube_url', '')
                        console.print(f"    ✅ 성공: {youtube_url}", style="green")
                        youtube_success += 1
                    except Exception as e:
                        console.print(f"    ❌ 실패: {e}", style="red")
                
                console.print(f"\n🎉 완전 자동화 완료!", style="bold")
                console.print(f"📝 대본 업로드: {len(uploaded_scripts)}개", style="green")
                console.print(f"🎥 영상 연결: {len(video_ready_scripts)}개", style="green")
                console.print(f"📺 YouTube 업로드: {youtube_success}개", style="green")
                
            except Exception as e:
                console.print(f"❌ YouTube 업로드 중 오류: {e}", style="red")
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


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