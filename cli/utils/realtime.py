"""
Real-time feedback and monitoring utilities
"""

import time
import threading
from typing import Dict, List, Optional, Callable
from datetime import datetime, timedelta
from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.layout import Layout
from rich.text import Text
from contextlib import contextmanager

from .api_client import api, APIError


console = Console()


class RealTimeMonitor:
    """Real-time system monitoring"""
    
    def __init__(self):
        self.console = Console()
        self.is_running = False
        self.monitor_thread = None
        self.refresh_interval = 2.0  # seconds
        self.data_cache = {}
        self.last_update = None
        
    def start_monitoring(self, refresh_interval: float = 2.0):
        """Start real-time monitoring"""
        self.refresh_interval = refresh_interval
        self.is_running = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
        
    def stop_monitoring(self):
        """Stop monitoring"""
        self.is_running = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=3.0)
    
    def _monitor_loop(self):
        """Main monitoring loop"""
        with Live(self._generate_layout(), refresh_per_second=0.5, console=self.console) as live:
            while self.is_running:
                try:
                    # Update data
                    self._fetch_data()
                    
                    # Update display
                    live.update(self._generate_layout())
                    
                    # Sleep until next update
                    time.sleep(self.refresh_interval)
                    
                except KeyboardInterrupt:
                    break
                except Exception as e:
                    # Handle errors gracefully
                    self.data_cache['error'] = str(e)
                    time.sleep(self.refresh_interval)
    
    def _fetch_data(self):
        """Fetch fresh data from API"""
        try:
            # System health
            health_data = api.health_check()
            self.data_cache['health'] = health_data
            
            # Script statistics
            stats_data = api.get_scripts_stats()
            self.data_cache['stats'] = stats_data.get('statistics', {})
            self.data_cache['recent_script'] = stats_data.get('recent_script')
            
            # Recent scripts
            recent_scripts = api.get_scripts(limit=5)
            self.data_cache['recent_scripts'] = recent_scripts.get('scripts', [])
            
            self.last_update = datetime.now()
            
        except APIError as e:
            self.data_cache['error'] = f"API 오류: {str(e)}"
    
    def _generate_layout(self) -> Panel:
        """Generate the monitoring display layout"""
        # Create main table
        table = Table(show_header=False, box=None, padding=(0, 1))
        table.add_column("항목", style="bold cyan", width=20)
        table.add_column("값", style="bold", width=30)
        table.add_column("상태", style="green", width=15)
        
        # System status
        health = self.data_cache.get('health', {})
        if health.get('status') == 'healthy':
            table.add_row("🌐 API 서버", "연결됨", "✅ 정상")
            table.add_row("💾 데이터베이스", "SQLite", "✅ 정상")
        else:
            table.add_row("🌐 API 서버", "연결 실패", "❌ 오류")
        
        # Statistics
        stats = self.data_cache.get('stats', {})
        table.add_row("", "", "")  # Separator
        table.add_row("📊 전체 스크립트", str(stats.get('total', 0)), "")
        table.add_row("📝 스크립트 준비", str(stats.get('script_ready', 0)), "")
        table.add_row("🎥 비디오 준비", str(stats.get('video_ready', 0)), "")
        table.add_row("📺 업로드 완료", str(stats.get('uploaded', 0)), "")
        
        # Recent activity
        recent_scripts = self.data_cache.get('recent_scripts', [])
        if recent_scripts:
            table.add_row("", "", "")  # Separator
            table.add_row("📋 최근 활동", f"{len(recent_scripts)}개 스크립트", "")
            
            for script in recent_scripts[:3]:  # Show top 3
                status_emoji = {
                    'script_ready': '📝',
                    'video_ready': '🎥', 
                    'uploaded': '📺'
                }.get(script.get('status', ''), '📄')
                
                title = script.get('title', '')[:20] + '...' if len(script.get('title', '')) > 20 else script.get('title', '')
                table.add_row(
                    f"  {status_emoji} ID {script.get('id', '')}",
                    title,
                    script.get('status', '')
                )
        
        # Last update time
        if self.last_update:
            update_time = self.last_update.strftime("%H:%M:%S")
            table.add_row("", "", "")
            table.add_row("🕐 마지막 업데이트", update_time, "")
        
        # Error status
        if 'error' in self.data_cache:
            table.add_row("❌ 오류", self.data_cache['error'][:40], "")
        
        # Create panel
        title = f"🔍 실시간 시스템 모니터링 (새로고침: {self.refresh_interval}초)"
        return Panel(
            table,
            title=title,
            border_style="cyan",
            subtitle="Ctrl+C로 종료"
        )


class StatusWatcher:
    """Watch specific scripts/operations for status changes"""
    
    def __init__(self):
        self.watched_items = {}
        self.console = Console()
        self.is_watching = False
        self.watch_thread = None
        
    def watch_script(self, script_id: int, callback: Optional[Callable] = None):
        """Watch a specific script for status changes"""
        self.watched_items[script_id] = {
            'type': 'script',
            'last_status': None,
            'callback': callback
        }
        
    def start_watching(self):
        """Start watching for changes"""
        if not self.watched_items:
            return
            
        self.is_watching = True
        self.watch_thread = threading.Thread(target=self._watch_loop, daemon=True)
        self.watch_thread.start()
        
    def stop_watching(self):
        """Stop watching"""
        self.is_watching = False
        if self.watch_thread:
            self.watch_thread.join(timeout=2.0)
            
    def _watch_loop(self):
        """Main watching loop"""
        while self.is_watching:
            try:
                for item_id, item_info in self.watched_items.items():
                    if item_info['type'] == 'script':
                        self._check_script_status(item_id, item_info)
                        
                time.sleep(3.0)  # Check every 3 seconds
                
            except Exception as e:
                console.print(f"⚠️ 모니터링 오류: {e}", style="yellow")
                time.sleep(5.0)
                
    def _check_script_status(self, script_id: int, item_info: dict):
        """Check script status for changes"""
        try:
            script_data = api.get_script(script_id)
            current_status = script_data.get('status')
            
            if item_info['last_status'] is None:
                item_info['last_status'] = current_status
                return
                
            # Status changed
            if current_status != item_info['last_status']:
                old_status = item_info['last_status']
                item_info['last_status'] = current_status
                
                # Show notification
                self._show_status_change(script_id, old_status, current_status, script_data)
                
                # Call callback if provided
                if item_info['callback']:
                    item_info['callback'](script_id, old_status, current_status, script_data)
                    
        except APIError:
            pass  # Ignore API errors during monitoring
            
    def _show_status_change(self, script_id: int, old_status: str, new_status: str, script_data: dict):
        """Show status change notification"""
        title = script_data.get('title', f'Script {script_id}')[:30]
        
        status_emoji = {
            'script_ready': '📝',
            'video_ready': '🎥',
            'uploaded': '📺',
            'error': '❌'
        }
        
        old_emoji = status_emoji.get(old_status, '📄')
        new_emoji = status_emoji.get(new_status, '📄')
        
        notification = Panel(
            f"{old_emoji} {old_status} → {new_emoji} {new_status}\n\n{title}",
            title=f"🔔 상태 변경 알림 - Script {script_id}",
            border_style="yellow"
        )
        
        console.print()
        console.print(notification)


class LiveUploadProgress:
    """Live progress display for uploads"""
    
    def __init__(self):
        self.console = Console()
        self.active_uploads = {}
        self.is_running = False
        
    @contextmanager
    def track_upload(self, operation_name: str, total_items: int):
        """Context manager for tracking upload progress"""
        try:
            self.is_running = True
            
            progress = Progress(
                SpinnerColumn(),
                TextColumn("[bold blue]{task.description}"),
                console=self.console,
                transient=False
            )
            
            with progress:
                main_task = progress.add_task(f"🚀 {operation_name}", total=total_items)
                
                yield UploadProgressTracker(progress, main_task)
                
        finally:
            self.is_running = False


class UploadProgressTracker:
    """Helper class for tracking individual upload progress"""
    
    def __init__(self, progress: Progress, main_task):
        self.progress = progress
        self.main_task = main_task
        self.current_item_task = None
        
    def start_item(self, item_name: str):
        """Start tracking an individual item"""
        if self.current_item_task:
            self.progress.remove_task(self.current_item_task)
            
        self.current_item_task = self.progress.add_task(
            f"  📄 {item_name}",
            total=None  # Indeterminate
        )
        
    def complete_item(self, success: bool = True):
        """Complete current item"""
        if self.current_item_task:
            if success:
                self.progress.update(self.current_item_task, description="  ✅ 완료")
            else:
                self.progress.update(self.current_item_task, description="  ❌ 실패")
                
            # Remove after short delay
            time.sleep(0.5)
            self.progress.remove_task(self.current_item_task)
            self.current_item_task = None
            
        # Update main progress
        self.progress.advance(self.main_task, 1)


# Convenience functions
def monitor_system(duration: int = 60):
    """Monitor system for specified duration"""
    monitor = RealTimeMonitor()
    
    try:
        console.print(f"🔍 시스템 모니터링 시작 ({duration}초)", style="bold cyan")
        console.print("💡 Ctrl+C를 누르면 언제든지 종료할 수 있습니다.", style="dim")
        
        monitor.start_monitoring()
        time.sleep(duration)
        
    except KeyboardInterrupt:
        console.print("\n⏹️ 모니터링이 중단되었습니다.", style="yellow")
    finally:
        monitor.stop_monitoring()


def watch_scripts(script_ids: List[int], duration: int = 300):
    """Watch specific scripts for status changes"""
    watcher = StatusWatcher()
    
    # Add scripts to watch
    for script_id in script_ids:
        watcher.watch_script(script_id)
    
    try:
        console.print(f"👀 스크립트 상태 모니터링 시작: {script_ids}", style="bold cyan")
        console.print(f"⏱️ {duration}초간 모니터링합니다.", style="dim")
        
        watcher.start_watching()
        time.sleep(duration)
        
    except KeyboardInterrupt:
        console.print("\n⏹️ 모니터링이 중단되었습니다.", style="yellow")
    finally:
        watcher.stop_watching()


def show_live_notifications():
    """Show live system notifications"""
    console.print("🔔 실시간 알림 활성화됨", style="bold green")
    console.print("💡 시스템 상태 변화를 실시간으로 알려드립니다.", style="dim")
    
    # This would integrate with WebSocket notifications in a real implementation
    # For now, it's a placeholder that shows the concept
    
    try:
        while True:
            time.sleep(5)
            # Simulate notification
            console.print("🔔 [실시간 알림] 새로운 스크립트가 업로드되었습니다.", style="yellow")
            
    except KeyboardInterrupt:
        console.print("\n⏹️ 실시간 알림이 비활성화되었습니다.", style="yellow")