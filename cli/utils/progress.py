"""
Enhanced progress display utilities for CLI
"""

import time
import threading
from typing import Optional, Callable, Any
from rich.console import Console
from rich.progress import (
    Progress, 
    TaskID, 
    SpinnerColumn, 
    TextColumn, 
    BarColumn, 
    TimeElapsedColumn,
    TimeRemainingColumn,
    MofNCompleteColumn,
    ProgressColumn
)
from rich.live import Live
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from contextlib import contextmanager


console = Console()


class CustomSpeedColumn(ProgressColumn):
    """Custom column showing processing speed (items/sec)"""
    
    def render(self, task):
        """Show speed as items per second"""
        speed = task.finished_speed or task.speed
        if speed is None:
            return Text("--", style="progress.data.speed")
        if speed < 1:
            return Text(f"{1/speed:.1f}s/item", style="progress.data.speed")
        else:
            return Text(f"{speed:.1f}/s", style="progress.data.speed")


class EnhancedProgress:
    """Enhanced progress display with Rich formatting"""
    
    def __init__(self, console: Console = None):
        self.console = console or Console()
        self.progress = None
        self.live = None
        self._tasks = {}
        
    def __enter__(self):
        self.progress = Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]{task.description}", justify="left"),
            BarColumn(bar_width=40),
            MofNCompleteColumn(),
            TextColumn("•"),
            TimeElapsedColumn(),
            TextColumn("•"),
            CustomSpeedColumn(),
            console=self.console,
            transient=False,
        )
        
        self.live = Live(
            self.progress,
            console=self.console,
            refresh_per_second=10,
            transient=False
        )
        
        self.live.start()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.live:
            self.live.stop()
        self._tasks.clear()
    
    def add_task(
        self, 
        description: str, 
        total: Optional[int] = None, 
        completed: int = 0,
        **kwargs
    ) -> TaskID:
        """Add a new progress task"""
        task_id = self.progress.add_task(
            description, 
            total=total, 
            completed=completed,
            **kwargs
        )
        self._tasks[description] = task_id
        return task_id
    
    def update_task(
        self, 
        task_id: TaskID, 
        completed: Optional[int] = None,
        advance: Optional[int] = None,
        description: Optional[str] = None,
        **kwargs
    ):
        """Update task progress"""
        if advance is not None:
            self.progress.advance(task_id, advance)
        else:
            self.progress.update(
                task_id,
                completed=completed,
                description=description,
                **kwargs
            )
    
    def complete_task(self, task_id: TaskID, description: Optional[str] = None):
        """Mark task as completed"""
        if description:
            self.progress.update(task_id, description=f"✅ {description}")
        self.progress.update(task_id, completed=self.progress.tasks[task_id].total)
    
    def fail_task(self, task_id: TaskID, description: Optional[str] = None):
        """Mark task as failed"""
        if description:
            self.progress.update(task_id, description=f"❌ {description}")


@contextmanager
def simple_progress(description: str, total: Optional[int] = None):
    """Simple context manager for single task progress"""
    with EnhancedProgress() as progress:
        task_id = progress.add_task(description, total=total)
        try:
            yield progress, task_id
        except Exception:
            progress.fail_task(task_id, description)
            raise
        else:
            progress.complete_task(task_id, description)


class BatchProgress:
    """Progress display for batch operations"""
    
    def __init__(self, operation_name: str, console: Console = None):
        self.operation_name = operation_name
        self.console = console or Console()
        self.stats = {
            'total': 0,
            'completed': 0,
            'failed': 0,
            'errors': []
        }
        self.progress = None
        self.overall_task = None
        self.current_task = None
        
    def __enter__(self):
        self.progress = EnhancedProgress(self.console)
        self.progress.__enter__()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.progress:
            self.progress.__exit__(exc_type, exc_val, exc_tb)
        self.show_summary()
        
    def start_batch(self, total_items: int, batch_description: str = None):
        """Start batch operation"""
        self.stats['total'] = total_items
        description = batch_description or f"{self.operation_name} 진행 중"
        
        self.overall_task = self.progress.add_task(
            f"🚀 {description}",
            total=total_items
        )
        
    def start_item(self, item_description: str):
        """Start processing individual item"""
        if self.current_task:
            self.progress.progress.remove_task(self.current_task)
            
        self.current_task = self.progress.add_task(
            f"  📄 {item_description}",
            total=None  # Indeterminate progress
        )
    
    def complete_item(self, success: bool = True, error_message: str = None):
        """Complete current item"""
        if success:
            self.stats['completed'] += 1
            if self.current_task:
                self.progress.complete_task(self.current_task)
        else:
            self.stats['failed'] += 1
            if error_message:
                self.stats['errors'].append(error_message)
            if self.current_task:
                self.progress.fail_task(self.current_task)
        
        # Update overall progress
        if self.overall_task:
            self.progress.update_task(
                self.overall_task,
                completed=self.stats['completed'] + self.stats['failed']
            )
        
        # Remove current task
        if self.current_task:
            self.progress.progress.remove_task(self.current_task)
            self.current_task = None
    
    def show_summary(self):
        """Show operation summary"""
        total = self.stats['total']
        completed = self.stats['completed']
        failed = self.stats['failed']
        
        # Create summary table
        table = Table(title=f"📊 {self.operation_name} 완료 보고서", show_header=True)
        table.add_column("항목", style="cyan", width=20)
        table.add_column("개수", style="bold", justify="center", width=10)
        table.add_column("비율", style="green", justify="center", width=15)
        
        table.add_row(
            "✅ 성공", 
            str(completed),
            f"{(completed/total*100):.1f}%" if total > 0 else "0.0%"
        )
        
        if failed > 0:
            table.add_row(
                "❌ 실패", 
                str(failed),
                f"{(failed/total*100):.1f}%" if total > 0 else "0.0%",
                style="red"
            )
        
        table.add_row(
            "📋 전체", 
            str(total),
            "100.0%",
            style="bold"
        )
        
        self.console.print()
        self.console.print(table)
        
        # Show errors if any
        if self.stats['errors']:
            self.console.print()
            error_panel = Panel(
                "\n".join(f"• {error}" for error in self.stats['errors'][:5]),
                title="❌ 오류 목록 (최대 5개)",
                border_style="red"
            )
            self.console.print(error_panel)
            
            if len(self.stats['errors']) > 5:
                self.console.print(
                    f"... 그 외 {len(self.stats['errors']) - 5}개 오류",
                    style="dim"
                )


class RealTimeUploadProgress:
    """Real-time upload progress with WebSocket integration"""
    
    def __init__(self, console: Console = None):
        self.console = console or Console()
        self.is_monitoring = False
        self.monitor_thread = None
        self.progress = None
        self.upload_tasks = {}
        
    def start_monitoring(self, script_ids: list):
        """Start monitoring upload progress for multiple scripts"""
        self.is_monitoring = True
        self.upload_tasks = {str(sid): None for sid in script_ids}
        
        self.progress = EnhancedProgress(self.console)
        self.progress.__enter__()
        
        # Add tasks for each script
        for script_id in script_ids:
            task_id = self.progress.add_task(
                f"📺 Script {script_id} YouTube 업로드",
                total=100  # Percentage-based progress
            )
            self.upload_tasks[str(script_id)] = task_id
        
        # Start monitoring thread
        self.monitor_thread = threading.Thread(
            target=self._monitor_progress,
            daemon=True
        )
        self.monitor_thread.start()
        
        return self.progress
    
    def stop_monitoring(self):
        """Stop progress monitoring"""
        self.is_monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=1.0)
        
        if self.progress:
            self.progress.__exit__(None, None, None)
            
    def update_progress(self, script_id: str, percentage: int, status: str = None):
        """Update progress for specific script"""
        if str(script_id) in self.upload_tasks:
            task_id = self.upload_tasks[str(script_id)]
            description = f"📺 Script {script_id}"
            
            if status:
                description += f" - {status}"
                
            self.progress.update_task(
                task_id,
                completed=percentage,
                description=description
            )
    
    def _monitor_progress(self):
        """Background monitoring thread (placeholder for WebSocket integration)"""
        # This would integrate with WebSocket for real-time updates
        # For now, it's a placeholder
        while self.is_monitoring:
            time.sleep(1)


# Convenience functions
def with_progress(description: str, total: int = None):
    """Decorator for functions that need progress display"""
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            with simple_progress(description, total) as (progress, task_id):
                return func(progress, task_id, *args, **kwargs)
        return wrapper
    return decorator


def show_success_message(message: str, details: dict = None):
    """Show success message with optional details"""
    console.print(f"✅ {message}", style="bold green")
    
    if details:
        detail_table = Table(show_header=False, box=None)
        detail_table.add_column("Key", style="dim")
        detail_table.add_column("Value", style="bold")
        
        for key, value in details.items():
            detail_table.add_row(f"{key}:", str(value))
        
        console.print(detail_table)


def show_error_message(message: str, error_details: str = None):
    """Show error message with optional details"""
    console.print(f"❌ {message}", style="bold red")
    
    if error_details:
        error_panel = Panel(
            error_details,
            title="오류 상세 정보",
            border_style="red"
        )
        console.print(error_panel)


def confirm_action(message: str, default: bool = False) -> bool:
    """Show confirmation dialog with enhanced styling"""
    from rich.prompt import Confirm
    
    return Confirm.ask(
        f"🤔 {message}",
        default=default,
        console=console
    )