"""
JSON 직렬화를 위한 유틸리티 함수들
"""

from typing import Any, Dict, List

from ..models.script import Script


def script_to_dict(script: Script) -> Dict[str, Any]:
    """Script 모델을 dictionary로 변환"""
    return {
        "id": script.id,
        "title": script.title,
        "content": script.content,
        "description": script.description,
        "tags": script.tags,
        "thumbnail_text": script.thumbnail_text,
        "imagefx_prompt": script.imagefx_prompt,
        "status": script.status,
        "video_file_path": script.video_file_path,
        "youtube_video_id": script.youtube_video_id,
        "scheduled_time": (
            script.scheduled_time.isoformat() if script.scheduled_time else None
        ),
        "created_at": script.created_at.isoformat() if script.created_at else None,
        "updated_at": script.updated_at.isoformat() if script.updated_at else None,
    }


def scripts_to_dict_list(scripts: List[Script]) -> List[Dict[str, Any]]:
    """Script 모델 리스트를 dictionary 리스트로 변환"""
    return [script_to_dict(script) for script in scripts]


def script_summary_to_dict(script: Script) -> Dict[str, Any]:
    """Script 모델을 요약 dictionary로 변환 (목록용)"""
    return {
        "id": script.id,
        "title": script.title,
        "status": script.status,
        "created_at": script.created_at.isoformat() if script.created_at else None,
        "updated_at": script.updated_at.isoformat() if script.updated_at else None,
        "has_video": script.video_file_path is not None,
        "youtube_uploaded": script.youtube_video_id is not None,
    }


def scripts_summary_to_dict_list(scripts: List[Script]) -> List[Dict[str, Any]]:
    """Script 모델 리스트를 요약 dictionary 리스트로 변환"""
    return [script_summary_to_dict(script) for script in scripts]
