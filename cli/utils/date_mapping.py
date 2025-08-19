"""
날짜 기반 자동 매핑 유틸리티
"""

import re
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

# 백엔드 constants 임포트
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))
    
from backend.app.core.constants import FileConstants, ValidationConstants


@dataclass
class DateFile:
    """날짜 기반 파일 정보"""
    date: str
    sequence: int
    name: str
    path: Path
    full_filename: str
    
    def __str__(self):
        return f"{self.date}_{self.sequence:02d}_{self.name}"


class DateBasedMapper:
    """날짜 기반 파일 매핑 유틸리티"""
    
    DATE_PATTERN = re.compile(ValidationConstants.DATE_PATTERN_REGEX)
    
    def __init__(self):
        self.console = None
        try:
            from rich.console import Console
            self.console = Console()
        except ImportError:
            pass
    
    def _print(self, message: str, style: str = ""):
        """콘솔 출력 (Rich 사용 가능시)"""
        if self.console:
            self.console.print(message, style=style)
        else:
            print(message)
    
    def parse_filename(self, filename: str) -> Optional[DateFile]:
        """파일명을 파싱하여 DateFile 객체 반환
        
        Args:
            filename: 파일명 (예: 20250817_01_story.txt)
            
        Returns:
            DateFile 객체 또는 None (파싱 실패시)
        """
        match = self.DATE_PATTERN.match(filename)
        if not match:
            return None
        
        date_str, seq_str, name, ext = match.groups()
        
        # 날짜 형식 검증
        try:
            datetime.strptime(date_str, '%Y%m%d')
        except ValueError:
            return None
        
        return DateFile(
            date=date_str,
            sequence=int(seq_str),
            name=name,
            path=Path(filename).parent,
            full_filename=filename
        )
    
    def find_date_files(self, directory: str, extensions: List[str] = None) -> List[DateFile]:
        """디렉토리에서 날짜 형식 파일들 찾기
        
        Args:
            directory: 검색할 디렉토리
            extensions: 찾을 확장자 목록 (기본: script + video extensions)
            
        Returns:
            DateFile 객체 리스트 (날짜, 순번순 정렬됨)
        """
        if extensions is None:
            extensions = FileConstants.ALLOWED_SCRIPT_EXTENSIONS + FileConstants.ALLOWED_VIDEO_EXTENSIONS
        
        directory_path = Path(directory)
        if not directory_path.exists():
            raise FileNotFoundError(f"디렉토리를 찾을 수 없습니다: {directory}")
        
        date_files = []
        
        for file_path in directory_path.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in extensions:
                date_file = self.parse_filename(file_path.name)
                if date_file:
                    date_file.path = file_path.parent
                    date_files.append(date_file)
        
        # 날짜, 순번순 정렬
        date_files.sort(key=lambda x: (x.date, x.sequence))
        return date_files
    
    def group_by_date(self, date_files: List[DateFile]) -> Dict[str, List[DateFile]]:
        """날짜별로 파일 그룹핑
        
        Args:
            date_files: DateFile 객체 리스트
            
        Returns:
            날짜를 키로 하는 딕셔너리
        """
        groups = {}
        for date_file in date_files:
            if date_file.date not in groups:
                groups[date_file.date] = []
            groups[date_file.date].append(date_file)
        
        return groups
    
    def match_script_video_files(self, script_dir: str, video_dir: str, 
                                target_date: str = None) -> List[Tuple[DateFile, DateFile]]:
        """대본과 영상 파일 매칭
        
        Args:
            script_dir: 대본 파일 디렉토리
            video_dir: 영상 파일 디렉토리
            target_date: 대상 날짜 (None이면 모든 날짜)
            
        Returns:
            (대본 DateFile, 영상 DateFile) 튜플 리스트
        """
        script_files = self.find_date_files(script_dir, FileConstants.ALLOWED_SCRIPT_EXTENSIONS)
        video_files = self.find_date_files(video_dir, ['.mp4'])  # YouTube에는 주로 MP4 사용
        
        # 날짜별 그룹핑
        script_groups = self.group_by_date(script_files)
        video_groups = self.group_by_date(video_files)
        
        matches = []
        
        for date in script_groups:
            if target_date and date != target_date:
                continue
                
            if date not in video_groups:
                self._print(f"⚠️ {date} 날짜의 영상 파일이 없습니다.", "yellow")
                continue
            
            scripts = script_groups[date]
            videos = video_groups[date]
            
            # 순번별 매칭
            for script in scripts:
                matching_video = None
                for video in videos:
                    if (script.date == video.date and 
                        script.sequence == video.sequence and 
                        script.name == video.name):
                        matching_video = video
                        break
                
                if matching_video:
                    matches.append((script, matching_video))
                else:
                    self._print(f"⚠️ 매칭되는 영상 없음: {script}", "yellow")
        
        return matches
    
    def validate_date_format(self, date_str: str) -> bool:
        """날짜 형식 검증
        
        Args:
            date_str: 검증할 날짜 문자열 (YYYYMMDD)
            
        Returns:
            유효한 날짜면 True
        """
        if len(date_str) != 8:
            return False
        
        try:
            datetime.strptime(date_str, '%Y%m%d')
            return True
        except ValueError:
            return False
    
    def get_today_date(self) -> str:
        """오늘 날짜를 YYYYMMDD 형식으로 반환"""
        return datetime.now().strftime('%Y%m%d')
    
    def generate_next_filename(self, directory: str, date: str, 
                              name: str = "story", extension: str = "txt") -> str:
        """다음 순번 파일명 생성
        
        Args:
            directory: 대상 디렉토리
            date: 날짜 (YYYYMMDD)
            name: 파일명 (기본: story)
            extension: 확장자 (기본: txt)
            
        Returns:
            다음 순번 파일명
        """
        existing_files = self.find_date_files(directory, [f'.{extension}'])
        date_files = [f for f in existing_files if f.date == date and f.name == name]
        
        if not date_files:
            next_seq = 1
        else:
            max_seq = max(f.sequence for f in date_files)
            next_seq = max_seq + 1
        
        return f"{date}_{next_seq:02d}_{name}.{extension}"
    
    def print_matching_summary(self, matches: List[Tuple[DateFile, DateFile]]):
        """매칭 결과 요약 출력"""
        if not matches:
            self._print("📭 매칭된 파일이 없습니다.", "yellow")
            return
        
        self._print(f"\n📋 매칭 결과: {len(matches)}개", "green")
        
        # 날짜별 그룹핑하여 출력
        by_date = {}
        for script, video in matches:
            date = script.date
            if date not in by_date:
                by_date[date] = []
            by_date[date].append((script, video))
        
        for date in sorted(by_date.keys()):
            formatted_date = f"{date[:4]}-{date[4:6]}-{date[6:8]}"
            self._print(f"\n📅 {formatted_date}:", "cyan")
            
            for script, video in by_date[date]:
                self._print(f"  {script.sequence:02d}. {script.name}", "white")
                self._print(f"      📝 {script.full_filename}", "dim")
                self._print(f"      🎥 {video.full_filename}", "dim")


# 전역 인스턴스
date_mapper = DateBasedMapper()