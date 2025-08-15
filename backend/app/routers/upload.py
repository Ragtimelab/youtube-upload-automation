from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import shutil
import os
from datetime import datetime
from typing import Optional

from ..database import get_db
from ..models.script import Script
from ..services.youtube_client import YouTubeClient


router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/video/{script_id}")
async def upload_video_file(
    script_id: int,
    video_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """영상 파일 업로드 및 대본과 매칭
    
    Args:
        script_id: 연결할 대본 ID
        video_file: 업로드할 비디오 파일
    """
    # 대본 존재 확인
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="대본을 찾을 수 없습니다.")
    
    if script.status != "script_ready":
        raise HTTPException(
            status_code=400, 
            detail=f"현재 대본 상태({script.status})에서는 비디오를 업로드할 수 없습니다."
        )
    
    # 파일 형식 검증
    if not video_file.filename:
        raise HTTPException(status_code=400, detail="파일명이 없습니다.")
    
    allowed_extensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
    file_extension = '.' + video_file.filename.split('.')[-1].lower() if '.' in video_file.filename else ''
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"지원되지 않는 비디오 형식입니다. 지원 형식: {', '.join(allowed_extensions)}"
        )
    
    # 비디오 파일 저장
    upload_dir = "uploads/videos"
    os.makedirs(upload_dir, exist_ok=True)
    
    # 안전한 파일명 생성 (script_id와 timestamp 포함)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"script_{script_id}_{timestamp}_{video_file.filename}"
    file_path = os.path.join(upload_dir, safe_filename)
    
    try:
        # 파일 저장
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video_file.file, buffer)
        
        # DB 업데이트
        script.video_file_path = file_path
        script.status = "video_ready"
        script.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(script)
        
        return {
            "id": script.id,
            "title": script.title,
            "status": script.status,
            "video_file_path": file_path,
            "file_size": os.path.getsize(file_path),
            "message": "비디오 파일 업로드 및 대본 연결 완료",
            "uploaded_filename": video_file.filename,
            "saved_filename": safe_filename
        }
        
    except Exception as e:
        # 실패 시 업로드된 파일 정리
        if os.path.exists(file_path):
            os.remove(file_path)
        
        db.rollback()
        raise HTTPException(status_code=500, detail=f"파일 업로드 실패: {str(e)}")


@router.post("/youtube/{script_id}")
async def upload_to_youtube(
    script_id: int,
    scheduled_time: Optional[str] = Form(None),
    privacy_status: str = Form("private"),
    category_id: int = Form(22),
    db: Session = Depends(get_db)
):
    """YouTube에 비디오 업로드
    
    Args:
        script_id: 업로드할 대본 ID
        scheduled_time: 예약 발행 시간 (ISO 8601 형식, 선택사항)
        privacy_status: 공개 설정 (private, unlisted, public)
        category_id: YouTube 카테고리 ID (기본: 22 - People & Blogs)
    """
    # 대본 및 비디오 파일 확인
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="대본을 찾을 수 없습니다.")
    
    if script.status != "video_ready":
        raise HTTPException(
            status_code=400,
            detail=f"YouTube 업로드 가능한 상태가 아닙니다. 현재 상태: {script.status}"
        )
    
    if not script.video_file_path or not os.path.exists(script.video_file_path):
        raise HTTPException(
            status_code=400,
            detail="연결된 비디오 파일을 찾을 수 없습니다."
        )
    
    # 공개 설정 검증
    valid_privacy_statuses = ["private", "unlisted", "public"]
    if privacy_status not in valid_privacy_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"잘못된 공개 설정입니다. 가능한 값: {', '.join(valid_privacy_statuses)}"
        )
    
    try:
        # YouTube 클라이언트 초기화 및 인증
        youtube_client = YouTubeClient()
        
        if not youtube_client.authenticate():
            raise HTTPException(
                status_code=500,
                detail="YouTube API 인증에 실패했습니다."
            )
        
        # 업로드 메타데이터 구성
        metadata = {
            'title': script.title,
            'description': script.description or '',
            'tags': script.tags or '',
            'category_id': category_id,
            'privacy_status': privacy_status
        }
        
        # 예약 발행 시간 설정
        if scheduled_time:
            try:
                # ISO 8601 형식 검증
                scheduled_datetime = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
                metadata['scheduled_time'] = scheduled_datetime.isoformat()
                metadata['privacy_status'] = 'private'  # 예약 발행시 일단 private
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="잘못된 날짜 형식입니다. ISO 8601 형식을 사용하세요 (예: 2025-01-20T14:00:00)"
                )
        
        # YouTube 업로드 실행
        video_id = youtube_client.upload_video(script.video_file_path, metadata)
        
        if not video_id:
            raise HTTPException(
                status_code=500,
                detail="YouTube 업로드에 실패했습니다."
            )
        
        # DB 업데이트
        script.youtube_video_id = video_id
        script.status = "scheduled" if scheduled_time else "uploaded"
        if scheduled_time:
            script.scheduled_time = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
        script.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(script)
        
        return {
            "id": script.id,
            "title": script.title,
            "status": script.status,
            "youtube_video_id": video_id,
            "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
            "privacy_status": metadata['privacy_status'],
            "scheduled_time": script.scheduled_time,
            "message": "YouTube 업로드 성공",
            "upload_timestamp": script.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # 업로드 실패 시 상태 업데이트
        script.status = "error"
        script.updated_at = datetime.utcnow()
        db.commit()
        
        raise HTTPException(
            status_code=500,
            detail=f"YouTube 업로드 중 오류 발생: {str(e)}"
        )


@router.get("/status/{script_id}")
def get_upload_status(script_id: int, db: Session = Depends(get_db)):
    """업로드 상태 조회
    
    Args:
        script_id: 대본 ID
        
    Returns:
        업로드 상태 정보
    """
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="대본을 찾을 수 없습니다.")
    
    result = {
        "id": script.id,
        "title": script.title,
        "status": script.status,
        "created_at": script.created_at,
        "updated_at": script.updated_at,
        "has_video_file": bool(script.video_file_path and os.path.exists(script.video_file_path)),
        "youtube_video_id": script.youtube_video_id,
        "scheduled_time": script.scheduled_time
    }
    
    # 파일 정보 추가
    if script.video_file_path and os.path.exists(script.video_file_path):
        result["video_file_info"] = {
            "file_path": script.video_file_path,
            "file_size": os.path.getsize(script.video_file_path),
            "filename": os.path.basename(script.video_file_path)
        }
    
    # YouTube URL 추가
    if script.youtube_video_id:
        result["youtube_url"] = f"https://www.youtube.com/watch?v={script.youtube_video_id}"
    
    return result


@router.delete("/video/{script_id}")
def delete_video_file(script_id: int, db: Session = Depends(get_db)):
    """업로드된 비디오 파일 삭제
    
    Args:
        script_id: 대본 ID
        
    Note:
        YouTube에 이미 업로드된 경우 파일만 삭제하고 YouTube 비디오는 유지됩니다.
    """
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="대본을 찾을 수 없습니다.")
    
    if not script.video_file_path:
        raise HTTPException(status_code=404, detail="삭제할 비디오 파일이 없습니다.")
    
    file_path = script.video_file_path
    file_existed = os.path.exists(file_path)
    
    try:
        # 파일 삭제
        if file_existed:
            os.remove(file_path)
        
        # DB 업데이트
        old_status = script.status
        script.video_file_path = None
        
        # 상태 조정
        if script.status == "video_ready":
            script.status = "script_ready"
        # uploaded나 scheduled 상태는 유지 (YouTube에는 이미 업로드됨)
        
        script.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(script)
        
        return {
            "id": script.id,
            "title": script.title,
            "previous_status": old_status,
            "current_status": script.status,
            "file_path": file_path,
            "file_existed": file_existed,
            "message": "비디오 파일 삭제 완료",
            "note": "YouTube에 업로드된 비디오는 영향받지 않습니다." if script.youtube_video_id else None
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"파일 삭제 실패: {str(e)}")