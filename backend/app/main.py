from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import SessionLocal, engine, get_db
from .models import script
from .routers import scripts

# 데이터베이스 테이블 생성
script.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="YouTube Upload Automation", 
    version="1.0.0",
    description="시니어 대상 YouTube 콘텐츠 업로드 자동화 시스템"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React 개발 서버
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(scripts.router)

from .routers import upload
app.include_router(upload.router)


@app.get("/")
def read_root():
    """API 상태 확인"""
    return {
        "message": "YouTube Upload Automation API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """헬스체크 엔드포인트"""
    try:
        # 데이터베이스 연결 테스트
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "api": "operational"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")


@app.get("/api/scripts")
def get_scripts(db: Session = Depends(get_db)):
    """등록된 대본 목록 조회"""
    from .models.script import Script
    
    scripts = db.query(Script).all()
    return {
        "scripts": scripts,
        "count": len(scripts)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True
    )