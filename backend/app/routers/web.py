"""
Web Interface Router - Jinja2 기반 HTML 렌더링
"""

from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.script_service import ScriptService
from ..services.upload_service import UploadService

router = APIRouter(
    prefix="",
    tags=["web"]
)

# Jinja2 템플릿 설정
templates = Jinja2Templates(directory="app/templates")


@router.get("/", response_class=HTMLResponse)
async def main_interface(request: Request, db: Session = Depends(get_db)):
    """메인 웹 인터페이스"""
    try:
        # 초기 데이터 로드
        script_service = ScriptService(db)
        scripts_result = script_service.get_scripts(limit=100)
        
        # 응답 구조 확인 및 처리
        if hasattr(scripts_result, 'success'):
            total_scripts = len(scripts_result.data) if scripts_result.success else 0
        elif isinstance(scripts_result, list):
            total_scripts = len(scripts_result)
        else:
            total_scripts = 0
        
        # Jinja2 템플릿으로 응답
        return templates.TemplateResponse("index.html", {
            "request": request,
            "title": "YouTube 업로드 자동화",
            "total_scripts": total_scripts,
            "page": "home"
        })
        
    except Exception as e:
        return f"""
        <html>
        <head><title>오류</title></head>
        <body>
            <h1>페이지 로드 실패</h1>
            <p>오류: {str(e)}</p>
            <a href="/health">상태 확인</a>
        </body>
        </html>
        """


@router.get("/scripts", response_class=HTMLResponse)
async def scripts_page(request: Request, db: Session = Depends(get_db)):
    """스크립트 관리 페이지"""
    try:
        script_service = ScriptService(db)
        result = script_service.get_scripts(skip=0, limit=100)
        
        # ScriptService는 딕셔너리를 반환함 (API와 동일한 구조)
        scripts = result.get("scripts", [])
        total = result.get("total", 0)
        
        return templates.TemplateResponse("pages/scripts.html", {
            "request": request,
            "title": "스크립트 관리",
            "scripts": scripts,
            "page": "scripts"
        })
        
    except Exception as e:
        return templates.TemplateResponse("error.html", {
            "request": request,
            "error_message": f"스크립트 페이지 로드 실패: {str(e)}",
            "error_code": "SCRIPTS_PAGE_ERROR"
        })


@router.get("/videos", response_class=HTMLResponse)
async def videos_page(request: Request, db: Session = Depends(get_db)):
    """비디오 관리 페이지"""
    try:
        script_service = ScriptService(db)
        
        # 각 상태별 스크립트 조회
        script_ready_result = script_service.get_scripts(skip=0, limit=100, status="script_ready")
        video_ready_result = script_service.get_scripts(skip=0, limit=100, status="video_ready")
        
        # ScriptService.get_scripts는 딕셔너리를 반환
        script_ready_scripts = script_ready_result.get("scripts", [])
        video_ready_scripts = video_ready_result.get("scripts", [])
        
        # 통계 계산
        script_ready_count = len(script_ready_scripts)
        video_ready_count = len(video_ready_scripts)
        
        return templates.TemplateResponse("pages/videos.html", {
            "request": request,
            "title": "비디오 관리",
            "script_ready_scripts": script_ready_scripts,
            "video_ready_scripts": video_ready_scripts,
            "script_ready_count": script_ready_count,
            "video_ready_count": video_ready_count,
            "uploading_count": 0,  # TODO: 실제 업로딩 상태 조회
            "uploaded_count": 0,   # TODO: 실제 업로드 완료 조회
            "page": "videos"
        })
        
    except Exception as e:
        return templates.TemplateResponse("error.html", {
            "request": request,
            "error_message": f"비디오 페이지 로드 실패: {str(e)}",
            "error_code": "VIDEOS_PAGE_ERROR"
        })


@router.get("/youtube", response_class=HTMLResponse)
async def youtube_page(request: Request, db: Session = Depends(get_db)):
    """YouTube 관리 페이지"""
    try:
        script_service = ScriptService(db)
        uploaded_result = script_service.get_scripts(skip=0, limit=100, status="uploaded")
        
        # ScriptService.get_scripts는 딕셔너리를 반환
        uploaded_scripts = uploaded_result.get("scripts", [])
        
        return templates.TemplateResponse("pages/youtube.html", {
            "request": request,
            "title": "YouTube 관리",
            "uploaded_scripts": uploaded_scripts,
            "page": "youtube"
        })
        
    except Exception as e:
        return templates.TemplateResponse("error.html", {
            "request": request,
            "error_message": f"YouTube 페이지 로드 실패: {str(e)}",
            "error_code": "YOUTUBE_PAGE_ERROR"
        })


@router.get("/status", response_class=HTMLResponse) 
async def status_page(request: Request, db: Session = Depends(get_db)):
    """상태 모니터링 페이지"""
    try:
        script_service = ScriptService(db)
        stats_result = script_service.get_statistics()
        
        # ScriptService.get_statistics()는 딕셔너리를 직접 반환
        stats = stats_result.get("statistics", {})
        recent_script = stats_result.get("recent_script", {})
        
        from datetime import datetime
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        return templates.TemplateResponse("pages/status.html", {
            "request": request,
            "title": "상태 모니터링",
            "stats": stats,
            "current_time": current_time,
            "page": "status"
        })
        
    except Exception as e:
        return templates.TemplateResponse("error.html", {
            "request": request,
            "error_message": f"상태 페이지 로드 실패: {str(e)}",
            "error_code": "STATUS_PAGE_ERROR"
        })