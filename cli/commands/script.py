"""
스크립트 관련 CLI 명령어
"""

import click
import sys
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from typing import Optional

# 프로젝트 루트 디렉토리를 sys.path에 추가
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.app.core.constants import PaginationConstants
from cli.utils.api_client import api, APIError
from cli.utils.validators import file_validator, input_validator


console = Console()


@click.group()
def script():
    """스크립트 관리 명령어"""


@script.command()
@click.argument('file_path', type=click.Path(exists=True))
def upload(file_path: str):
    """대본 파일 업로드
    
    Args:
        file_path: 업로드할 대본 파일 경로 (.md)
    """
    try:
        console.print("📝 대본 파일 업로드 중...", style="yellow")
        
        # 파일 검증
        file_validator.validate_script_file(file_path)
        
        # API 호출
        result = api.upload_script(file_path)
        
        # 성공 메시지
        console.print("✅ 대본 업로드 성공!", style="green bold")
        console.print(f"📄 ID: {result['id']}")
        console.print(f"📝 제목: {result['title']}")
        console.print(f"🔄 상태: {result['status']}")
        console.print(f"📁 파일명: {result['filename']}")
        
    except (FileNotFoundError, ValueError) as e:
        console.print(f"❌ 파일 오류: {e}", style="red")
        raise click.Abort()
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@script.command()
@click.option('--status', '-s', help='상태별 필터링 (script_ready, video_ready, uploaded, error, scheduled)')
@click.option('--limit', '-l', default=PaginationConstants.CLI_DEFAULT_LIST_LIMIT, help='조회할 최대 개수 (기본: 20)')
@click.option('--skip', default=0, help='건너뛸 개수 (기본: 0)')
def list(status: Optional[str], limit: int, skip: int):
    """등록된 스크립트 목록 조회"""
    try:
        console.print("📋 스크립트 목록 조회 중...", style="yellow")
        
        # 상태 검증
        if status:
            input_validator.validate_status(status)
        
        # API 호출
        result = api.get_scripts(skip=skip, limit=limit, status=status)
        
        # API 클라이언트가 리스트 또는 dict 반환 가능 (표준화 이후)
        if hasattr(result, 'get'):
            scripts = result.get('scripts', [])
            total = result.get('total', 0)
        else:
            # result가 리스트인 경우
            scripts = result
            total = len(result)
        
        if not scripts:
            console.print("📭 등록된 스크립트가 없습니다.", style="yellow")
            return
        
        # 테이블 생성
        table = Table(title=f"스크립트 목록 ({len(scripts)}/{total}개)")
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("제목", style="white")
        table.add_column("상태", style="green")
        table.add_column("생성일", style="blue")
        table.add_column("YouTube ID", style="magenta")
        
        for script in scripts:
            # 상태별 스타일 및 아이콘
            status_config = {
                'script_ready': ('yellow', '📝'),
                'video_ready': ('blue', '🎥'), 
                'uploaded': ('green', '✅'),
                'error': ('red', '❌'),
                'scheduled': ('cyan', '⏰')
            }
            
            status = script.get('status', '')
            style, icon = status_config.get(status, ('white', '❓'))
            
            # 제목 길이 제한 개선
            title = script.get('title', '')
            display_title = title[:45] + '...' if len(title) > 45 else title
            
            table.add_row(
                str(script.get('id', '')),
                display_title,
                f"{icon} [{style}]{status}[/{style}]",
                script.get('created_at', '')[:10] if script.get('created_at') else '',
                script.get('youtube_video_id', '') or '-'
            )
        
        console.print(table)
        
        # 페이지네이션 정보
        if total > skip + limit:
            console.print(f"💡 더 많은 결과가 있습니다. --skip {skip + limit} 옵션을 사용하세요.", style="dim")
            
    except ValueError as e:
        console.print(f"❌ 입력 오류: {e}", style="red")
        raise click.Abort()
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@script.command()
@click.argument('script_id', type=int)
def show(script_id: int):
    """특정 스크립트 상세 정보 조회"""
    try:
        console.print(f"🔍 스크립트 ID {script_id} 조회 중...", style="yellow")
        
        # API 호출
        script = api.get_script(script_id)
        
        # 상세 정보 표시
        panel_content = f"""
[bold]제목:[/bold] {script.get('title', '')}
[bold]상태:[/bold] {script.get('status', '')}
[bold]생성일:[/bold] {script.get('created_at', '')}
[bold]수정일:[/bold] {script.get('updated_at', '')}
[bold]설명:[/bold] {script.get('description', '') or '없음'}
[bold]태그:[/bold] {script.get('tags', '') or '없음'}
[bold]썸네일 텍스트:[/bold] {script.get('thumbnail_text', '') or '없음'}
[bold]ImageFX 프롬프트:[/bold] {script.get('imagefx_prompt', '') or '없음'}
[bold]비디오 파일:[/bold] {script.get('video_file_path', '') or '없음'}
[bold]YouTube ID:[/bold] {script.get('youtube_video_id', '') or '없음'}
        """
        
        console.print(Panel(panel_content.strip(), title=f"스크립트 #{script_id}", border_style="blue"))
        
        # 내용 미리보기 (첫 200자)
        content = script.get('content', '')
        if content:
            preview = content[:200] + ('...' if len(content) > 200 else '')
            console.print(Panel(preview, title="내용 미리보기", border_style="green"))
            
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@script.command()
@click.argument('script_id', type=int)
@click.option('--title', '-t', help='수정할 제목')
@click.option('--description', '-d', help='수정할 설명')
@click.option('--tags', help='수정할 태그 (쉼표로 구분)')
@click.option('--thumbnail-text', help='수정할 썸네일 텍스트')
@click.option('--imagefx-prompt', help='수정할 ImageFX 프롬프트')
def edit(script_id: int, title: str, description: str, tags: str, thumbnail_text: str, imagefx_prompt: str):
    """스크립트 메타데이터 수정
    
    Args:
        script_id: 수정할 스크립트 ID
    """
    try:
        # 현재 스크립트 정보 조회
        console.print(f"🔍 스크립트 ID {script_id} 조회 중...", style="yellow")
        current_script = api.get_script(script_id)
        
        # 수정할 필드가 없으면 안내
        if not any([title, description, tags, thumbnail_text, imagefx_prompt]):
            console.print("⚠️ 수정할 항목을 지정해주세요.", style="yellow")
            console.print("\n[bold]사용법:[/bold]")
            console.print("./youtube-cli script edit 1 --title '새 제목' --description '새 설명'")
            console.print("\n[bold]현재 정보:[/bold]")
            console.print(f"제목: {current_script['title']}")
            console.print(f"설명: {current_script.get('description', '없음')}")
            console.print(f"태그: {current_script.get('tags', '없음')}")
            console.print(f"썸네일: {current_script.get('thumbnail_text', '없음')}")
            console.print(f"ImageFX: {current_script.get('imagefx_prompt', '없음')}")
            return
        
        console.print(f"✏️ 스크립트 ID {script_id} 수정 중...", style="yellow")
        
        # 수정할 내용 표시
        changes = []
        if title:
            changes.append(f"제목: '{current_script['title']}' → '{title}'")
        if description:
            changes.append(f"설명: '{current_script.get('description', '없음')}' → '{description}'")
        if tags:
            changes.append(f"태그: '{current_script.get('tags', '없음')}' → '{tags}'")
        if thumbnail_text:
            changes.append(f"썸네일: '{current_script.get('thumbnail_text', '없음')}' → '{thumbnail_text}'")
        if imagefx_prompt:
            changes.append(f"ImageFX: '{current_script.get('imagefx_prompt', '없음')}' → '{imagefx_prompt}'")
        
        console.print("\n[bold]수정할 내용:[/bold]")
        for change in changes:
            console.print(f"  • {change}")
        
        if not click.confirm("\n수정하시겠습니까?"):
            console.print("❌ 수정이 취소되었습니다.", style="yellow")
            return
        
        # API 호출
        result = api.update_script(
            script_id=script_id,
            title=title,
            description=description,
            tags=tags,
            thumbnail_text=thumbnail_text,
            imagefx_prompt=imagefx_prompt
        )
        
        console.print("✅ 스크립트 수정 완료!", style="green bold")
        console.print(f"📄 ID: {result['id']}")
        console.print(f"⏰ 수정 시간: {result['updated_at']}")
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@script.command()
@click.argument('script_id', type=int)
@click.confirmation_option(prompt='정말로 삭제하시겠습니까?')
def delete(script_id: int):
    """스크립트 삭제"""
    try:
        console.print(f"🗑️ 스크립트 ID {script_id} 삭제 중...", style="yellow")
        
        # API 호출
        result = api.delete_script(script_id)
        
        console.print("✅ 스크립트 삭제 성공!", style="green bold")
        console.print(f"📄 제목: {result.get('title', '')}")
        console.print(f"💬 메시지: {result.get('message', '')}")
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()


@script.command()
def stats():
    """스크립트 통계 조회"""
    try:
        console.print("📊 스크립트 통계 조회 중...", style="yellow")
        
        # API 호출
        stats = api.get_scripts_stats()
        
        # 통계 테이블
        table = Table(title="스크립트 통계")
        table.add_column("상태", style="cyan", no_wrap=True)
        table.add_column("개수", style="white", justify="right")
        
        total = 0
        for status, count in stats.items():
            if isinstance(count, int):
                table.add_row(status, str(count))
                total += count
        
        table.add_row("", "")  # 구분선
        table.add_row("[bold]전체[/bold]", f"[bold]{total}[/bold]")
        
        console.print(table)
        
    except APIError as e:
        console.print(f"❌ API 오류: {e}", style="red")
        raise click.Abort()
    except Exception as e:
        console.print(f"❌ 예상치 못한 오류: {e}", style="red")
        raise click.Abort()