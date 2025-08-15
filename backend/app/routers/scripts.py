from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models.script import Script
from ..services.script_parser import ScriptParser, ScriptParsingError


router = APIRouter(prefix="/api/scripts", tags=["scripts"])


@router.post("/upload")
async def upload_script(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """대본 파일 업로드 및 파싱
    
    지원 파일 형식: .txt, .md
    대본 파일 구조:
    === 대본 ===
    [대본 내용]
    
    === 메타데이터 ===
    제목: [제목]
    설명: [설명]
    태그: [태그1, 태그2, ...]
    
    === 썸네일 제작 ===
    텍스트: [썸네일 텍스트]
    ImageFX 프롬프트: [이미지 생성 프롬프트]
    """
    # 파일 형식 검증
    if not file.filename:
        raise HTTPException(status_code=400, detail="파일명이 없습니다.")
    
    allowed_extensions = ['.txt', '.md']
    file_extension = '.' + file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"지원되지 않는 파일 형식입니다. 지원 형식: {', '.join(allowed_extensions)}"
        )
    
    try:
        # 파일 내용 읽기
        content = await file.read()
        content_str = content.decode('utf-8')
        
        # 대본 파싱
        parser = ScriptParser()
        parsed_data = parser.parse_script_file(content_str)
        
        # 데이터 유효성 검증
        if not parser.validate_parsed_data(parsed_data):
            raise HTTPException(status_code=400, detail="파싱된 데이터가 유효하지 않습니다.")
        
        # DB에 저장
        script = Script(
            title=parsed_data['title'],
            content=parsed_data['content'],
            description=parsed_data.get('description', ''),
            tags=parsed_data.get('tags', ''),
            thumbnail_text=parsed_data.get('thumbnail_text', ''),
            imagefx_prompt=parsed_data.get('imagefx_prompt', ''),
            status="script_ready",
            created_at=datetime.utcnow()
        )
        
        db.add(script)
        db.commit()
        db.refresh(script)
        
        return {
            "id": script.id,
            "title": script.title,
            "status": script.status,
            "message": "대본 업로드 및 파싱 성공",
            "filename": file.filename
        }
        
    except ScriptParsingError as e:
        raise HTTPException(status_code=400, detail=f"대본 파싱 실패: {str(e)}")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="파일 인코딩이 UTF-8이 아닙니다.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.get("/")
def get_scripts(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """등록된 대본 목록 조회
    
    Args:
        skip: 건너뛸 개수 (페이지네이션)
        limit: 조회할 최대 개수 (기본: 100)
        status: 상태 필터 (script_ready, video_ready, uploaded, error, scheduled)
    """
    query = db.query(Script)
    
    if status:
        query = query.filter(Script.status == status)
    
    scripts = query.order_by(Script.created_at.desc()).offset(skip).limit(limit).all()
    total = query.count()
    
    return {
        "scripts": scripts,
        "total": total,
        "skip": skip,
        "limit": limit,
        "status_filter": status
    }


@router.get("/{script_id}")
def get_script(script_id: int, db: Session = Depends(get_db)):
    """특정 대본 상세 조회"""
    script = db.query(Script).filter(Script.id == script_id).first()
    
    if not script:
        raise HTTPException(status_code=404, detail="대본을 찾을 수 없습니다.")
    
    return script


@router.put("/{script_id}")
def update_script(
    script_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    thumbnail_text: Optional[str] = Form(None),
    imagefx_prompt: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """대본 정보 수정"""
    script = db.query(Script).filter(Script.id == script_id).first()
    
    if not script:
        raise HTTPException(status_code=404, detail="대본을 찾을 수 없습니다.")
    
    # 수정 가능한 필드 업데이트
    if title is not None:
        script.title = title
    if description is not None:
        script.description = description
    if tags is not None:
        script.tags = tags
    if thumbnail_text is not None:
        script.thumbnail_text = thumbnail_text
    if imagefx_prompt is not None:
        script.imagefx_prompt = imagefx_prompt
    
    script.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(script)
        
        return {
            "id": script.id,
            "message": "대본 정보 수정 완료",
            "updated_at": script.updated_at
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"수정 실패: {str(e)}")


@router.delete("/{script_id}")
def delete_script(script_id: int, db: Session = Depends(get_db)):
    """대본 삭제"""
    script = db.query(Script).filter(Script.id == script_id).first()
    
    if not script:
        raise HTTPException(status_code=404, detail="대본을 찾을 수 없습니다.")
    
    # 업로드된 상태의 대본은 삭제 불가
    if script.status == "uploaded":
        raise HTTPException(
            status_code=400, 
            detail="이미 YouTube에 업로드된 대본은 삭제할 수 없습니다."
        )
    
    try:
        db.delete(script)
        db.commit()
        
        return {
            "id": script_id,
            "message": "대본 삭제 완료",
            "title": script.title
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"삭제 실패: {str(e)}")


@router.get("/stats/summary")
def get_scripts_stats(db: Session = Depends(get_db)):
    """대본 통계 정보 조회"""
    total = db.query(Script).count()
    
    stats = {
        "total": total,
        "script_ready": db.query(Script).filter(Script.status == "script_ready").count(),
        "video_ready": db.query(Script).filter(Script.status == "video_ready").count(),
        "uploaded": db.query(Script).filter(Script.status == "uploaded").count(),
        "scheduled": db.query(Script).filter(Script.status == "scheduled").count(),
        "error": db.query(Script).filter(Script.status == "error").count(),
    }
    
    # 최근 업로드된 대본
    recent_script = db.query(Script).order_by(Script.created_at.desc()).first()
    
    return {
        "statistics": stats,
        "recent_script": {
            "id": recent_script.id if recent_script else None,
            "title": recent_script.title if recent_script else None,
            "created_at": recent_script.created_at if recent_script else None
        } if recent_script else None
    }