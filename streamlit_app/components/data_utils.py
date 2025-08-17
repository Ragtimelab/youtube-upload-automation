"""
데이터 처리 유틸리티
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import io


def filter_scripts_by_status(scripts: List[Dict[str, Any]], status: Optional[str] = None) -> List[Dict[str, Any]]:
    """상태별 스크립트 필터링"""
    if not status or status == "전체":
        return scripts
    return [script for script in scripts if script.get('status') == status]


def search_scripts_by_title(scripts: List[Dict[str, Any]], search_term: str) -> List[Dict[str, Any]]:
    """제목으로 스크립트 검색"""
    if not search_term:
        return scripts
    
    search_term = search_term.lower()
    return [
        script for script in scripts 
        if search_term in script.get('title', '').lower()
    ]


def sort_scripts_by_date(scripts: List[Dict[str, Any]], ascending: bool = False) -> List[Dict[str, Any]]:
    """날짜별 스크립트 정렬"""
    return sorted(
        scripts,
        key=lambda x: x.get('updated_at', ''),
        reverse=not ascending
    )


def calculate_script_stats(scripts: List[Dict[str, Any]]) -> Dict[str, int]:
    """스크립트 통계 계산"""
    stats = {
        "total": len(scripts),
        "script_ready": 0,
        "video_ready": 0,
        "uploaded": 0,
        "scheduled": 0,
        "error": 0
    }
    
    for script in scripts:
        status = script.get('status', 'unknown')
        if status in stats:
            stats[status] += 1
    
    return stats


def validate_file_upload(uploaded_file, allowed_types: List[str], max_size_mb: int = 100) -> Dict[str, Any]:
    """파일 업로드 검증"""
    if not uploaded_file:
        return {"valid": False, "error": "파일이 선택되지 않았습니다."}
    
    # 파일 확장자 검증
    file_extension = "." + uploaded_file.name.split(".")[-1].lower()
    if file_extension not in allowed_types:
        return {
            "valid": False, 
            "error": f"지원하지 않는 파일 형식입니다. 허용: {', '.join(allowed_types)}"
        }
    
    # 파일 크기 검증
    file_size = len(uploaded_file.read())
    uploaded_file.seek(0)  # 파일 포인터 리셋
    
    max_size_bytes = max_size_mb * 1024 * 1024
    if file_size > max_size_bytes:
        return {
            "valid": False,
            "error": f"파일 크기가 {max_size_mb}MB를 초과합니다. (현재: {file_size/(1024*1024):.1f}MB)"
        }
    
    return {
        "valid": True,
        "size": file_size,
        "extension": file_extension
    }


def format_datetime(datetime_str: str, format_type: str = "short") -> str:
    """날짜시간 포맷팅"""
    if not datetime_str:
        return "-"
    
    try:
        dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        
        if format_type == "short":
            return dt.strftime("%m-%d %H:%M")
        elif format_type == "long":
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        elif format_type == "date":
            return dt.strftime("%Y-%m-%d")
        else:
            return dt.strftime("%m-%d %H:%M")
    except:
        return datetime_str[:10] if len(datetime_str) >= 10 else datetime_str


def truncate_text(text: str, max_length: int = 50) -> str:
    """텍스트 자르기"""
    if not text:
        return ""
    
    if len(text) <= max_length:
        return text
    
    return text[:max_length] + "..."


def prepare_script_file(content: str, filename: str) -> io.BytesIO:
    """스크립트 파일 준비"""
    return io.BytesIO(content.encode('utf-8'))


def extract_script_metadata(script: Dict[str, Any]) -> Dict[str, str]:
    """스크립트 메타데이터 추출"""
    return {
        "id": str(script.get('id', '')),
        "title": script.get('title', ''),
        "status": script.get('status', ''),
        "description": script.get('description', ''),
        "tags": script.get('tags', ''),
        "created_at": format_datetime(script.get('created_at', '')),
        "updated_at": format_datetime(script.get('updated_at', '')),
        "youtube_id": script.get('youtube_video_id', '')
    }


def build_youtube_url(youtube_id: str) -> str:
    """YouTube URL 생성"""
    if not youtube_id:
        return ""
    return f"https://www.youtube.com/watch?v={youtube_id}"


def parse_script_content(content: str) -> Dict[str, str]:
    """스크립트 내용 파싱 (간단한 버전)"""
    lines = content.split('\n')
    
    # 기본 구조
    parsed = {
        "title": "",
        "content": content,
        "description": "",
        "tags": ""
    }
    
    # 제목 추출 (첫 번째 비어있지 않은 줄)
    for line in lines:
        if line.strip():
            parsed["title"] = line.strip()[:100]  # 최대 100자
            break
    
    return parsed


def get_status_priority(status: str) -> int:
    """상태 우선순위 반환 (정렬용)"""
    priority_map = {
        "error": 1,
        "script_ready": 2,
        "video_ready": 3,
        "scheduled": 4,
        "uploaded": 5
    }
    return priority_map.get(status, 99)


def group_scripts_by_status(scripts: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """상태별 스크립트 그룹화"""
    grouped = {}
    
    for script in scripts:
        status = script.get('status', 'unknown')
        if status not in grouped:
            grouped[status] = []
        grouped[status].append(script)
    
    return grouped