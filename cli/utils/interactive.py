"""
Interactive mode utilities for CLI
"""

import sys
from typing import List, Dict, Optional, Callable
from pathlib import Path

# 백엔드 constants 임포트
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))
    
from backend.app.core.constants import FileConstants
from rich.console import Console
from rich.prompt import Prompt, IntPrompt, Confirm
from rich.panel import Panel
from rich.table import Table

from .api_client import api, APIError
from .progress import show_success_message, show_error_message
from .date_mapping import date_mapper


console = Console()


class InteractiveMenu:
    """Interactive menu system"""
    
    def __init__(self, title: str = "📋 메뉴"):
        self.title = title
        self.options = {}
        self.console = Console()
        
    def add_option(self, key: str, description: str, action: Callable):
        """Add menu option"""
        self.options[key] = {
            'description': description,
            'action': action
        }
    
    def show_menu(self):
        """Display menu options"""
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("번호", style="cyan", width=6)
        table.add_column("작업", style="green")
        table.add_column("설명", style="dim")
        
        for key, option in self.options.items():
            table.add_row(key, option['description'], "")
        
        table.add_row("q", "종료", "프로그램 종료")
        
        panel = Panel(
            table,
            title=self.title,
            border_style="blue"
        )
        
        self.console.print()
        self.console.print(panel)
        
    def run(self):
        """Run interactive menu loop"""
        while True:
            try:
                self.show_menu()
                
                choice = Prompt.ask(
                    "선택하세요",
                    choices=list(self.options.keys()) + ['q'],
                    default='q'
                )
                
                if choice == 'q':
                    self.console.print("👋 프로그램을 종료합니다.", style="yellow")
                    break
                    
                if choice in self.options:
                    self.console.print()
                    try:
                        self.options[choice]['action']()
                    except KeyboardInterrupt:
                        self.console.print("\n⏸️ 작업이 중단되었습니다.", style="yellow")
                    except Exception as e:
                        show_error_message("작업 중 오류가 발생했습니다", str(e))
                    
                    # Continue after action
                    self.console.print()
                    if not Confirm.ask("메뉴로 돌아가시겠습니까?", default=True):
                        break
                        
            except KeyboardInterrupt:
                self.console.print("\n👋 프로그램을 종료합니다.", style="yellow")
                break


class ScriptSelector:
    """Script selection utility"""
    
    @staticmethod
    def select_scripts(status_filter: str = None, multi_select: bool = False) -> List[Dict]:
        """Select scripts interactively"""
        try:
            # Get scripts from API
            scripts_data = api.get_scripts(status=status_filter, limit=50)
            scripts = scripts_data.get('scripts', [])
            
            if not scripts:
                console.print("📭 조건에 맞는 스크립트가 없습니다.", style="yellow")
                return []
            
            # Display scripts table
            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("번호", style="cyan", width=6)
            table.add_column("ID", style="green", width=8)
            table.add_column("제목", style="bold")
            table.add_column("상태", style="blue")
            table.add_column("생성일", style="dim")
            
            for i, script in enumerate(scripts, 1):
                created_date = script.get('created_at', '').split('T')[0] if script.get('created_at') else 'N/A'
                table.add_row(
                    str(i),
                    str(script['id']),
                    script['title'][:40] + '...' if len(script['title']) > 40 else script['title'],
                    script['status'],
                    created_date
                )
            
            panel = Panel(
                table,
                title=f"📝 스크립트 목록 ({len(scripts)}개)",
                border_style="blue"
            )
            console.print(panel)
            
            if multi_select:
                # Multi-select mode
                console.print("💡 여러 스크립트를 선택하려면 쉼표로 구분하세요 (예: 1,3,5)", style="dim")
                choice = Prompt.ask("선택하세요 (번호 또는 번호들)", default="")
                
                if not choice.strip():
                    return []
                
                selected_scripts = []
                try:
                    numbers = [int(x.strip()) for x in choice.split(',')]
                    for num in numbers:
                        if 1 <= num <= len(scripts):
                            selected_scripts.append(scripts[num - 1])
                        else:
                            console.print(f"⚠️ 잘못된 번호: {num}", style="yellow")
                    
                    return selected_scripts
                    
                except ValueError:
                    console.print("❌ 잘못된 입력 형식입니다.", style="red")
                    return []
                    
            else:
                # Single select mode
                choice = IntPrompt.ask(
                    "선택하세요",
                    default=1,
                    show_default=True
                )
                
                if 1 <= choice <= len(scripts):
                    return [scripts[choice - 1]]
                else:
                    console.print("❌ 잘못된 선택입니다.", style="red")
                    return []
                    
        except APIError as e:
            show_error_message("스크립트 목록을 가져오는 중 오류가 발생했습니다", str(e))
            return []


class FileSelector:
    """File selection utility"""
    
    @staticmethod
    def select_directory(purpose: str = "작업") -> Optional[Path]:
        """Select directory interactively"""
        while True:
            path_input = Prompt.ask(f"📁 {purpose}할 디렉토리 경로를 입력하세요")
            
            if not path_input.strip():
                return None
                
            path = Path(path_input.strip())
            
            if path.exists() and path.is_dir():
                return path
            else:
                console.print("❌ 존재하지 않는 디렉토리입니다.", style="red")
                if not Confirm.ask("다시 입력하시겠습니까?", default=True):
                    return None
    
    @staticmethod
    def select_file(extensions: List[str] = None, purpose: str = "작업") -> Optional[Path]:
        """Select file interactively"""
        extensions = extensions or FileConstants.ALLOWED_SCRIPT_EXTENSIONS
        ext_text = ', '.join(extensions)
        
        while True:
            path_input = Prompt.ask(f"📄 {purpose}할 파일 경로를 입력하세요 ({ext_text})")
            
            if not path_input.strip():
                return None
                
            path = Path(path_input.strip())
            
            if path.exists() and path.is_file():
                if extensions and path.suffix.lower() not in extensions:
                    console.print(f"❌ 지원하지 않는 파일 형식입니다. 지원 형식: {ext_text}", style="red")
                    if not Confirm.ask("다시 입력하시겠습니까?", default=True):
                        return None
                    continue
                return path
            else:
                console.print("❌ 존재하지 않는 파일입니다.", style="red")
                if not Confirm.ask("다시 입력하시겠습니까?", default=True):
                    return None


class QuickActions:
    """Quick action implementations for interactive mode"""
    
    @staticmethod
    def upload_script():
        """Interactive script upload"""
        console.print("📝 스크립트 업로드", style="bold cyan")
        
        # Select file
        script_file = FileSelector.select_file(FileConstants.ALLOWED_SCRIPT_EXTENSIONS, "업로드")
        if not script_file:
            return
        
        try:
            console.print(f"📄 {script_file.name} 업로드 중...", style="yellow")
            result = api.upload_script(str(script_file))
            
            show_success_message(
                "스크립트가 성공적으로 업로드되었습니다!",
                {
                    "ID": result['id'],
                    "제목": result['title'],
                    "파일명": result.get('filename', script_file.name)
                }
            )
            
        except Exception as e:
            show_error_message("스크립트 업로드 중 오류가 발생했습니다", str(e))
    
    @staticmethod
    def upload_video():
        """Interactive video upload"""
        console.print("🎥 비디오 업로드", style="bold cyan")
        
        # Select script first
        scripts = ScriptSelector.select_scripts(status_filter="script_ready")
        if not scripts:
            return
            
        script = scripts[0]
        console.print(f"선택된 스크립트: {script['title']}", style="green")
        
        # Select video file
        video_file = FileSelector.select_file(FileConstants.ALLOWED_VIDEO_EXTENSIONS, "업로드")
        if not video_file:
            return
        
        try:
            console.print(f"🎬 {video_file.name} 업로드 중...", style="yellow")
            api.upload_video(script['id'], str(video_file))
            
            show_success_message(
                "비디오가 성공적으로 업로드되었습니다!",
                {
                    "스크립트 ID": script['id'],
                    "비디오 파일": video_file.name,
                    "상태": "video_ready"
                }
            )
            
        except Exception as e:
            show_error_message("비디오 업로드 중 오류가 발생했습니다", str(e))
    
    @staticmethod
    def youtube_upload():
        """Interactive YouTube upload"""
        console.print("📺 YouTube 업로드", style="bold cyan")
        
        # Select scripts ready for YouTube
        scripts = ScriptSelector.select_scripts(status_filter="video_ready", multi_select=True)
        if not scripts:
            return
        
        # Select privacy setting
        privacy_options = {
            '1': 'private',
            '2': 'unlisted', 
            '3': 'public'
        }
        
        console.print("🔒 공개 설정을 선택하세요:", style="bold")
        console.print("1. Private (비공개)")
        console.print("2. Unlisted (링크 공유)")
        console.print("3. Public (공개)")
        
        privacy_choice = Prompt.ask("선택하세요", choices=['1', '2', '3'], default='1')
        privacy = privacy_options[privacy_choice]
        
        console.print(f"선택된 설정: {privacy}", style="dim")
        
        # Confirm upload
        if not Confirm.ask(f"{len(scripts)}개 스크립트를 YouTube에 {privacy} 모드로 업로드하시겠습니까?"):
            return
        
        # Upload each script
        success_count = 0
        youtube_urls = []
        
        for script in scripts:
            try:
                console.print(f"📺 {script['title']} 업로드 중...", style="yellow")
                result = api.upload_to_youtube(script['id'], privacy_status=privacy)
                
                youtube_url = result.get('youtube_url', '')
                youtube_urls.append({
                    'title': script['title'],
                    'url': youtube_url
                })
                
                console.print(f"  ✅ 성공: {youtube_url}", style="green")
                success_count += 1
                
            except Exception as e:
                console.print(f"  ❌ 실패: {e}", style="red")
        
        # Show summary
        show_success_message(
            f"YouTube 업로드가 완료되었습니다!",
            {
                "성공": f"{success_count}개",
                "전체": f"{len(scripts)}개",
                "공개 설정": privacy
            }
        )
        
        # Show URLs
        if youtube_urls:
            console.print("\n📺 업로드된 영상:", style="bold")
            for item in youtube_urls:
                console.print(f"  • {item['title']}: {item['url']}", style="dim")
    
    @staticmethod
    def date_automation():
        """Interactive date-based automation"""
        console.print("🗓️ 날짜 기반 완전 자동화", style="bold cyan")
        
        # Select script directory
        script_dir = FileSelector.select_directory("스크립트")
        if not script_dir:
            return
            
        # Select video directory  
        video_dir = FileSelector.select_directory("비디오")
        if not video_dir:
            return
        
        # Select date
        today = date_mapper.get_today_date()
        date_input = Prompt.ask("날짜를 입력하세요 (YYYYMMDD)", default=today)
        
        if not date_mapper.validate_date_format(date_input):
            console.print("❌ 잘못된 날짜 형식입니다.", style="red")
            return
        
        # Find matches
        console.print("🔍 매칭 파일 검색 중...", style="yellow")
        matches = date_mapper.match_script_video_files(str(script_dir), str(video_dir), date_input)
        
        if not matches:
            console.print("📭 매칭되는 파일이 없습니다.", style="yellow")
            return
        
        # Show matches
        date_mapper.print_matching_summary(matches)
        
        # Select privacy
        privacy = Prompt.ask(
            "YouTube 공개 설정",
            choices=['private', 'unlisted', 'public'],
            default='private'
        )
        
        # Confirm automation
        if not Confirm.ask(f"{len(matches)}개 파일을 완전 자동화하시겠습니까?"):
            return
        
        # Run automation (this would call the main date_upload logic)
        console.print("🚀 완전 자동화를 시작합니다...", style="bold green")
        console.print("💡 이 기능은 메인 CLI의 date-upload 명령어와 동일합니다.", style="dim")
        console.print("💡 실제 구현시에는 main.py의 date_upload 함수를 호출합니다.", style="dim")
    
    @staticmethod
    def view_scripts():
        """View scripts with details"""
        console.print("📝 스크립트 목록 보기", style="bold cyan")
        
        # Select status filter - Backend 5개 상태 완전 지원
        status_options = {
            '1': None,
            '2': 'script_ready',
            '3': 'video_ready', 
            '4': 'uploaded',
            '5': 'scheduled',
            '6': 'error'
        }
        
        console.print("📊 상태별 필터링:", style="bold")
        console.print("1. 전체")
        console.print("2. 스크립트 준비")
        console.print("3. 비디오 준비")
        console.print("4. 업로드 완료")
        console.print("5. 예약 발행")
        console.print("6. 오류")
        
        status_choice = Prompt.ask("선택하세요", choices=['1', '2', '3', '4', '5', '6'], default='1')
        status_filter = status_options[status_choice]
        
        # Get and display scripts
        try:
            scripts_data = api.get_scripts(status=status_filter, limit=20)
            scripts = scripts_data.get('scripts', [])
            total = scripts_data.get('total', 0)
            
            if not scripts:
                console.print("📭 조건에 맞는 스크립트가 없습니다.", style="yellow")
                return
            
            # Show detailed table
            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("ID", style="green", width=8)
            table.add_column("제목", style="bold", width=30)
            table.add_column("상태", style="blue", width=12)
            table.add_column("생성일", style="dim", width=12)
            table.add_column("태그", style="cyan", width=20)
            
            for script in scripts:
                created_date = script.get('created_at', '').split('T')[0] if script.get('created_at') else 'N/A'
                tags = script.get('tags', '')[:18] + '...' if len(script.get('tags', '')) > 20 else script.get('tags', '')
                
                table.add_row(
                    str(script['id']),
                    script['title'][:28] + '...' if len(script['title']) > 30 else script['title'],
                    script['status'],
                    created_date,
                    tags
                )
            
            panel = Panel(
                table,
                title=f"📝 스크립트 목록 ({len(scripts)}/{total}개)",
                border_style="blue"
            )
            console.print(panel)
            
            # Show statistics
            if total > len(scripts):
                console.print(f"💡 총 {total}개 중 최신 {len(scripts)}개만 표시됩니다.", style="dim")
                
        except APIError as e:
            show_error_message("스크립트 목록을 가져오는 중 오류가 발생했습니다", str(e))
    
    @staticmethod
    def system_status():
        """Show system status"""
        console.print("🔍 시스템 상태 확인", style="bold cyan")
        
        try:
            # Health check
            health_data = api.health_check()
            
            # System info table
            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("구성요소", style="green", width=20)
            table.add_column("상태", style="bold", width=15)
            table.add_column("정보", style="dim")
            
            if health_data.get('status') == 'healthy':
                table.add_row("🌐 API 서버", "✅ 정상", "FastAPI 백엔드 연결됨")
                table.add_row("💾 데이터베이스", "✅ 정상", "SQLite 연결됨")
            else:
                table.add_row("🌐 API 서버", "❌ 오류", "연결 실패")
            
            # Get statistics
            try:
                stats_data = api.get_scripts_stats()
                stats = stats_data.get('statistics', {})
                
                table.add_row("", "", "")  # Separator
                table.add_row("📊 전체 스크립트", str(stats.get('total', 0)), "")
                table.add_row("📝 스크립트 준비", str(stats.get('script_ready', 0)), "")
                table.add_row("🎥 비디오 준비", str(stats.get('video_ready', 0)), "")
                table.add_row("📺 업로드 완료", str(stats.get('uploaded', 0)), "")
                
            except:
                table.add_row("📊 통계", "⚠️ 조회 실패", "통계 정보 없음")
            
            panel = Panel(
                table,
                title="🔍 시스템 상태",
                border_style="green"
            )
            console.print(panel)
            
        except APIError as e:
            show_error_message("시스템 상태 확인 중 오류가 발생했습니다", str(e))


def run_interactive_mode():
    """Run interactive mode"""
    console.print()
    welcome_panel = Panel(
        """
🎬 [bold]YouTube 업로드 자동화 CLI - 인터랙티브 모드[/bold] 🎬

[dim]메뉴에서 원하는 작업을 선택하세요.
각 작업은 단계별 안내와 함께 진행됩니다.[/dim]
        """.strip(),
        title="🚀 환영합니다!",
        border_style="magenta"
    )
    console.print(welcome_panel)
    
    # Create main menu
    menu = InteractiveMenu("📋 메인 메뉴")
    
    menu.add_option('1', '📝 스크립트 업로드', QuickActions.upload_script)
    menu.add_option('2', '🎥 비디오 업로드', QuickActions.upload_video)
    menu.add_option('3', '📺 YouTube 업로드', QuickActions.youtube_upload)
    menu.add_option('4', '🗓️ 날짜 기반 완전 자동화', QuickActions.date_automation)
    menu.add_option('5', '📝 스크립트 목록 보기', QuickActions.view_scripts)
    menu.add_option('6', '🔍 시스템 상태 확인', QuickActions.system_status)
    
    # Run menu
    menu.run()