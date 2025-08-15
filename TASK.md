# 📋 개발 작업 목록 (TASK.md)
**1인 개발자를 위한 상세 구현 가이드**

---

## 🎯 프로젝트 시작 전 체크리스트

### ✅ 사전 준비 사항
- [x] Python 3.13 설치 확인 (Python 3.13.6)
- [x] Poetry 설치 확인 (Poetry 2.1.4)
- [x] Node.js 18+ 설치 확인 (Node.js v22.18.0)
- [x] Google Cloud Platform 계정 생성
- [x] YouTube 채널 준비 (테스트용 - "소망의 등불" 채널)
- [x] **Git/GitHub 저장소 설정** (https://github.com/Ragtimelab/youtube-upload-automation)
- [x] 개발 환경 IDE 설정 (PyCharm + VS Code 모두 설정 완료)

### ✅ Google API 설정
- [x] Google Cloud Console 프로젝트 생성
- [x] YouTube Data API v3 활성화
- [x] OAuth 2.0 클라이언트 ID 생성
- [x] credentials.json 파일 다운로드
- [x] YouTube 채널 연동 테스트 (채널명: "소망의 등불", ID: UCSLS6pkO1kaz9I9dJMahN6w)

---

## 🚀 Phase 1: 기본 시스템 구축 (Week 1-4)

### Week 1: 프로젝트 초기화 및 백엔드 기본 구조

#### 📦 1.1 프로젝트 설정 (Day 1)
```bash
# Git 저장소 초기화
git init
git branch -M main

# GitHub 저장소 생성 및 연결
gh repo create youtube-upload-automation --public
git remote add origin https://github.com/[USERNAME]/youtube-upload-automation.git

# .gitignore 생성
echo "# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
venv/
.venv/
.env

# Database
*.db
*.sqlite
*.sqlite3

# Credentials
credentials.json
token.json
token.pickle

# Uploads
uploads/

# Node.js
node_modules/
npm-debug.log*
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db" > .gitignore

# 프로젝트 구조 생성
mkdir backend frontend docs

# 초기 커밋
git add .
git commit -m "Initial project setup with .gitignore"
git push -u origin main

# Python 가상환경 설정
cd backend
python3.13 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 기본 패키지 설치
pip install fastapi uvicorn sqlalchemy alembic python-multipart
pip install google-auth google-auth-oauthlib google-auth-httplib2
pip install google-api-python-client python-dotenv
pip freeze > requirements.txt
```

**완료 기준:**
- [x] Git 저장소 초기화 완료
- [x] GitHub 저장소 생성 및 연결 (https://github.com/Ragtimelab/youtube-upload-automation)
- [x] .gitignore 설정 완료 (Python, Node.js, Google API credentials, IDE 설정 포함)
- [x] **Poetry 프로젝트 초기화 완료**
- [x] **Poetry 가상환경 활성화 확인** (.venv 디렉토리 생성됨)
- [x] **기본 의존성 설치 완료** (FastAPI, SQLAlchemy, Google API 클라이언트 등)
- [x] **pyproject.toml 생성 확인** (모든 의존성 및 도구 설정 포함)

**추가 완료 사항:**
- [x] **개발 환경 설정 완료**
  - [x] PyCharm 설정 가이드 제공
  - [x] VS Code 설정 파일 생성 (.vscode/settings.json, extensions.json, launch.json, tasks.json)
  - [x] Makefile 생성 (Poetry 기반 편의 명령어)
  - [x] pre-commit 설정 완료 (코드 품질 도구 통합)
- [x] **YouTube API 테스트 완료**
  - [x] test_youtube_auth.py 스크립트 작성
  - [x] OAuth 2.0 인증 플로우 성공
  - [x] 채널 정보 조회 성공 (채널명: "소망의 등불")
  - [x] token.pickle 파일 생성됨

#### 🗄️ 1.2 데이터베이스 설정 (Day 2) - **📍 현재 진행 중**
```python
# backend/app/database.py 생성
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./youtube_automation.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

```python
# backend/app/models/script.py 생성
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from datetime import datetime
from ..database import Base

class Script(Base):
    __tablename__ = "scripts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    description = Column(Text)
    tags = Column(Text)
    thumbnail_text = Column(String(100))
    imagefx_prompt = Column(Text)
    status = Column(String(20), default="script_ready")
    created_at = Column(DateTime, default=datetime.utcnow)
    video_file_path = Column(String(500))
    youtube_video_id = Column(String(50))
    scheduled_time = Column(DateTime)
```

**작업 목록:**
- [x] database.py 설정 ✅
- [x] Script 모델 정의 ✅
- [ ] Channel 모델 정의 (나중에 다중 채널용)
- [x] Alembic 마이그레이션 설정 ✅
```bash
# Poetry 가상환경에서 Alembic 실행
poetry run alembic init alembic
poetry run alembic revision --autogenerate -m "Create initial tables"
poetry run alembic upgrade head

# Git 커밋
git add .
git commit -m "Add database models and migrations"
git push
```

**완료 기준:**
- [x] SQLite DB 파일 생성 확인 ✅ (`backend/youtube_automation.db` - 20KB)
- [x] 테이블 생성 확인 ✅ (`scripts`, `alembic_version` 테이블 생성됨)
- [x] 마이그레이션 실행 성공 ✅ (Alembic revision 95ba76b307f6 적용)
- [x] 변경사항 Git 커밋 완료 ✅ (커밋 118974d)

#### 🌐 1.3 FastAPI 기본 구조 (Day 3) - **✅ 완료**
```python
# backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from .models import script

app = FastAPI(title="YouTube Upload Automation", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 의존성 주입
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "YouTube Upload Automation API"}
```

**작업 목록:**
- [x] main.py 기본 구조 생성 ✅
- [x] CORS 설정 ✅
- [x] 헬스체크 엔드포인트 ✅
- [x] 개발 서버 실행 테스트 ✅
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**완료 기준:**
- [x] http://localhost:8000 접속 성공 ✅
- [x] http://localhost:8000/docs Swagger UI 확인 ✅
- [x] API 응답 정상 ✅

**추가 완료된 엔드포인트:**
- [x] `GET /` - API 상태 확인 ✅
- [x] `GET /health` - 헬스체크 (DB 연결 테스트 포함) ✅
- [x] `GET /api/scripts` - 대본 목록 조회 ✅
```bash
# FastAPI 기본 구조 커밋
git add .
git commit -m "Add FastAPI basic structure and CORS setup"
git push
```

---

## 🎉 **Phase 1 - Week 1 완료 요약**

**✅ 완료된 주요 작업:**
1. **프로젝트 시작 전 체크리스트 100% 완료**
   - Python 3.13.6, Poetry 2.1.4, Node.js v22.18.0 설치
   - Google Cloud Platform, YouTube API 설정, OAuth 인증
   - GitHub 저장소: https://github.com/Ragtimelab/youtube-upload-automation
   - PyCharm + VS Code 개발환경 설정

2. **데이터베이스 시스템 구축**
   - SQLAlchemy + SQLite 설정
   - Script 모델 정의 (13개 필드)
   - Alembic 마이그레이션 시스템
   - 데이터베이스 파일 생성 및 테이블 구조 완성

3. **FastAPI 백엔드 기반 구조**
   - CORS 설정된 FastAPI 앱
   - 헬스체크, 대본 목록 API 엔드포인트
   - Swagger UI 접근 가능
   - 데이터베이스 연동 확인

**📊 현재 시스템 구조:**
```
backend/
├── app/
│   ├── main.py          # FastAPI 애플리케이션
│   ├── database.py      # SQLAlchemy 설정
│   └── models/
│       └── script.py    # Script 데이터 모델
├── alembic/             # 데이터베이스 마이그레이션
└── youtube_automation.db # SQLite 데이터베이스
```

**🔗 GitHub 커밋 히스토리:**
- `ef1ccb7` - Complete project setup and environment configuration
- `118974d` - Add database models and FastAPI basic structure

**📍 다음 단계:** Week 3 - YouTube API 연동

---

## 🎉 **Phase 1 - Week 2 완료 요약**

**✅ 완료된 주요 작업:**
1. **대본 파싱 시스템 구축**
   - ScriptParser 클래스: 정규식 기반 섹션 분리 로직
   - 메타데이터 추출: 제목, 설명, 태그 파싱
   - 썸네일 정보 추출: 텍스트, ImageFX 프롬프트 파싱
   - 예외 처리: ScriptParsingError 클래스
   - 유효성 검증: YouTube 제한 사항 반영

2. **RESTful API 시스템 구축**
   - 6개 완전한 엔드포인트 (CRUD + 통계 + 파일 업로드)
   - 파일 업로드 및 파싱 통합 프로세스
   - 페이지네이션 및 필터링 지원
   - 안전한 에러 핸들링 및 검증

3. **포괄적 테스트 및 검증**
   - 모든 파싱 기능 테스트 통과
   - 실제 API 동작 검증 완료
   - 데이터베이스 저장/조회 확인

**📊 확장된 시스템 구조:**
```
backend/
├── app/
│   ├── main.py          # FastAPI + 라우터 등록
│   ├── database.py      # SQLAlchemy 설정
│   ├── models/
│   │   └── script.py    # Script 데이터 모델
│   ├── services/        # ← NEW
│   │   └── script_parser.py  # 대본 파싱 시스템
│   └── routers/         # ← NEW
│       └── scripts.py   # 대본 관리 API
├── alembic/             # 데이터베이스 마이그레이션
└── youtube_automation.db # SQLite (실제 데이터 저장됨)
```

**🔗 GitHub 커밋 히스토리:**
- `1e5b612` - Update TASK.md with Phase 1 Week 1 completion status
- `df33b58` - Add script parsing system and management API (647줄 추가)

**📍 다음 단계:** Week 3 - YouTube API 연동

---

### Week 3: YouTube API 연동 **← 다음 주차**

#### 📄 2.1 대본 파싱 시스템 (Day 4-5) - **✅ 완료**
```python
# backend/app/services/script_parser.py
import re
from typing import Dict, Optional

class ScriptParser:
    def parse_script_file(self, content: str) -> Dict[str, str]:
        """대본 파일 파싱"""
        sections = {}
        
        # 대본 내용 추출
        script_match = re.search(
            r'=== 대본 ===(.*?)(?:=== 메타데이터 ===|$)', 
            content, re.DOTALL
        )
        if script_match:
            sections['content'] = script_match.group(1).strip()
        
        # 메타데이터 추출
        metadata_match = re.search(
            r'=== 메타데이터 ===(.*?)(?:=== 썸네일 제작 ===|$)',
            content, re.DOTALL
        )
        if metadata_match:
            metadata = metadata_match.group(1).strip()
            sections.update(self._parse_metadata(metadata))
        
        return sections
```

**작업 목록:**
- [x] ScriptParser 클래스 구현 ✅
- [x] 정규식을 이용한 섹션 분리 ✅
- [x] 메타데이터 파싱 로직 ✅
- [x] 썸네일 정보 파싱 로직 ✅
- [x] 파싱 테스트 케이스 작성 ✅
- [x] 파싱 실패 예외 처리 ✅

**테스트 방법:**
```python
# 테스트 대본 파일로 파싱 기능 검증
test_content = """
=== 대본 ===
할머니의 숨겨진 이야기...

=== 메타데이터 ===
제목: 60년 만에 밝히는 할머니의 비밀
설명: 시니어 세대의 진솔한 회상
태그: 시니어, 회상, 가족, 이야기
"""

parser = ScriptParser()
result = parser.parse_script_file(test_content)
print(result)  # 파싱 결과 확인
```

**완료 기준:**
- [x] 대본 섹션 추출 성공 ✅
- [x] 메타데이터 필드별 추출 성공 ✅
- [x] 예외 상황 처리 완료 ✅

**추가 완료 사항:**
- [x] **포괄적 테스트 스위트 완성** ✅
  - 기본 파싱 기능 테스트 (시니어 대상 콘텐츠 예제)
  - 데이터 유효성 검증 테스트 (필수 필드, 길이 제한)  
  - 에러 처리 테스트 (빈 내용, 필수 섹션 누락)
  - 경계 케이스 테스트 (최소 정보, 공백 처리)
- [x] **ScriptParsingError 예외 클래스** ✅
- [x] **유효성 검증 로직** - YouTube 제목/설명 길이 제한 반영 ✅
```bash
# 대본 파싱 시스템 커밋
git add .
git commit -m "Add script parsing system with regex extraction"
git push
```

#### 🔌 2.2 대본 관리 API (Day 6-7) - **✅ 완료**
```python
# backend/app/routers/scripts.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.script import Script
from ..services.script_parser import ScriptParser

router = APIRouter(prefix="/api/scripts", tags=["scripts"])

@router.post("/upload")
async def upload_script(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """대본 파일 업로드 및 파싱"""
    if not file.filename.endswith(('.txt', '.md')):
        raise HTTPException(400, "지원되지 않는 파일 형식")
    
    content = await file.read()
    content = content.decode('utf-8')
    
    parser = ScriptParser()
    parsed_data = parser.parse_script_file(content)
    
    # DB에 저장
    script = Script(**parsed_data)
    db.add(script)
    db.commit()
    db.refresh(script)
    
    return {"id": script.id, "message": "대본 업로드 성공"}

@router.get("/")
def get_scripts(db: Session = Depends(get_db)):
    """등록된 대본 목록 조회"""
    scripts = db.query(Script).all()
    return {"scripts": scripts}
```

**작업 목록:**
- [x] scripts.py 라우터 생성 ✅
- [x] 파일 업로드 엔드포인트 ✅
- [x] 대본 목록 조회 API ✅
- [x] 특정 대본 조회 API ✅
- [x] 대본 수정 API ✅ (추가 구현)
- [x] 대본 삭제 API ✅
- [x] 입력 검증 로직 ✅
- [x] 에러 응답 정의 ✅

**테스트 방법:**
```bash
# 파일 업로드 테스트
curl -X POST "http://localhost:8000/api/scripts/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_script.txt"

# 목록 조회 테스트
curl -X GET "http://localhost:8000/api/scripts"
```

**완료 기준:**
- [x] 파일 업로드 API 동작 확인 ✅
- [x] DB에 데이터 저장 확인 ✅
- [x] API 응답 정상 ✅
- [x] Swagger UI에서 테스트 성공 ✅

**추가 완료된 API 엔드포인트:**
- [x] `POST /api/scripts/upload` - 대본 파일 업로드 및 파싱 ✅
- [x] `GET /api/scripts/` - 대본 목록 조회 (페이지네이션, 상태 필터) ✅
- [x] `GET /api/scripts/{id}` - 개별 대본 상세 조회 ✅
- [x] `PUT /api/scripts/{id}` - 대본 정보 수정 ✅
- [x] `DELETE /api/scripts/{id}` - 대본 삭제 (안전성 체크 포함) ✅
- [x] `GET /api/scripts/stats/summary` - 통계 정보 조회 ✅

**실제 테스트 결과:**
- [x] sample_script.txt 업로드 성공 → DB ID: 1 ✅
- [x] 파싱 결과: 제목, 내용, 설명, 태그, 썸네일 정보 완전 추출 ✅
- [x] 통계: script_ready 1개, 총 1개 대본 확인 ✅
```bash
# 대본 관리 API 커밋
git add .
git commit -m "Add script management API endpoints"
git push
```

### Week 3: YouTube API 연동

#### 🎬 3.1 YouTube API 클라이언트 (Day 8-9) **← 다음 작업**
```python
# backend/app/services/youtube_client.py
import os
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

class YouTubeClient:
    SCOPES = ['https://www.googleapis.com/auth/youtube.upload']
    
    def __init__(self, credentials_path: str = "credentials.json"):
        self.credentials_path = credentials_path
        self.youtube = None
        
    def authenticate(self):
        """OAuth 2.0 인증"""
        creds = None
        
        if os.path.exists('token.pickle'):
            with open('token.pickle', 'rb') as token:
                creds = pickle.load(token)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_path, self.SCOPES)
                creds = flow.run_local_server(port=0)
            
            with open('token.pickle', 'wb') as token:
                pickle.dump(creds, token)
        
        self.youtube = build('youtube', 'v3', credentials=creds)
        return True
```

**작업 목록:**
- [ ] YouTubeClient 클래스 생성
- [ ] OAuth 2.0 인증 로직
- [ ] 토큰 저장/로드 기능
- [ ] API 클라이언트 초기화
- [ ] 인증 테스트

**인증 테스트:**
```python
# 인증 테스트 스크립트
client = YouTubeClient()
if client.authenticate():
    print("YouTube API 인증 성공")
else:
    print("인증 실패")
```

**완료 기준:**
- [ ] OAuth 2.0 플로우 정상 동작
- [ ] token.pickle 파일 생성 확인
- [ ] YouTube API 클라이언트 연결 성공
```bash
# YouTube API 클라이언트 커밋
git add .
git commit -m "Add YouTube API client with OAuth authentication"
git push
```

#### ⬆️ 3.2 업로드 기능 구현 (Day 10-11)
```python
def upload_video(self, video_path: str, metadata: dict) -> str:
    """YouTube에 비디오 업로드"""
    body = {
        'snippet': {
            'title': metadata['title'],
            'description': metadata.get('description', ''),
            'tags': metadata.get('tags', '').split(','),
            'categoryId': '22',  # People & Blogs
        },
        'status': {
            'privacyStatus': 'private'
        }
    }
    
    # 예약 발행 시간 설정
    if metadata.get('scheduled_time'):
        body['status']['publishAt'] = metadata['scheduled_time']
    
    media = MediaFileUpload(video_path, chunksize=-1, resumable=True)
    request = self.youtube.videos().insert(
        part=','.join(body.keys()),
        body=body,
        media_body=media
    )
    
    response = request.execute()
    return response['id']  # 비디오 ID 반환
```

**작업 목록:**
- [ ] 비디오 업로드 메서드 구현
- [ ] 메타데이터 매핑 로직
- [ ] 업로드 진행상황 추적
- [ ] 에러 핸들링
- [ ] 재시도 로직 구현

**테스트 방법:**
```python
# 테스트 비디오로 업로드 테스트
client = YouTubeClient()
client.authenticate()

metadata = {
    'title': '테스트 비디오',
    'description': '테스트 설명',
    'tags': '테스트, 자동화'
}

video_id = client.upload_video('test_video.mp4', metadata)
print(f"업로드된 비디오 ID: {video_id}")
```

**완료 기준:**
- [ ] 테스트 비디오 업로드 성공
- [ ] YouTube 비디오 ID 반환 확인
- [ ] 업로드된 비디오 YouTube에서 확인
```bash
# 비디오 업로드 기능 커밋
git add .
git commit -m "Add YouTube video upload functionality"
git push
```

### Week 4: 웹 인터페이스 기본 구조

#### ⚛️ 4.1 React 프로젝트 설정 (Day 12-13)
```bash
# frontend 디렉토리에서
npx create-react-app . --template typescript
npm install axios tailwindcss @types/node
npx tailwindcss init

# shadcn/ui 설정
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card table badge progress
```

**프로젝트 구조:**
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui 컴포넌트
│   │   ├── ScriptList    # 대본 목록 컴포넌트
│   │   ├── ScriptUpload  # 대본 업로드 컴포넌트
│   │   └── Dashboard     # 대시보드 컴포넌트
│   ├── hooks/
│   │   ├── useScripts.ts # 대본 관리 훅
│   │   └── useUpload.ts  # 업로드 관리 훅
│   ├── types/
│   │   └── script.ts     # TypeScript 타입 정의
│   ├── utils/
│   │   └── api.ts        # API 클라이언트
│   └── App.tsx
```

**작업 목록:**
- [ ] React TypeScript 프로젝트 생성
- [ ] Tailwind CSS 설정
- [ ] shadcn/ui 설치 및 설정
- [ ] 기본 컴포넌트 구조 생성
- [ ] API 클라이언트 설정

**완료 기준:**
- [ ] React 개발 서버 실행 (localhost:3000)
- [ ] Tailwind CSS 스타일 적용 확인
- [ ] shadcn/ui 컴포넌트 렌더링 확인
```bash
# React 프로젝트 설정 커밋
cd ..
git add .
git commit -m "Add React TypeScript project with Tailwind and shadcn/ui"
git push
```

#### 🎨 4.2 대본 관리 UI (Day 14)
```tsx
// src/components/ScriptUpload.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ScriptUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/scripts/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        alert('대본 업로드 성공!');
        setFile(null);
      }
    } catch (error) {
      alert('업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">대본 업로드</h2>
      <div className="space-y-4">
        <input
          type="file"
          accept=".txt,.md"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500"
        />
        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading}
        >
          {uploading ? '업로드 중...' : '업로드'}
        </Button>
      </div>
    </Card>
  );
}
```

**작업 목록:**
- [ ] ScriptUpload 컴포넌트 구현
- [ ] ScriptList 컴포넌트 구현  
- [ ] Dashboard 레이아웃 구성
- [ ] API 통신 로직
- [ ] 로딩 상태 처리

**완료 기준:**
- [ ] 파일 선택 UI 동작
- [ ] 업로드 버튼 클릭시 API 호출
- [ ] 업로드 완료 후 목록 새로고침
```bash
# 대본 관리 UI 커밋
git add .
git commit -m "Add script upload and management UI components"
git push
```

---

## 🚀 Phase 2: 영상 업로드 시스템 (Week 5-6)

### Week 5: 영상-대본 매칭 시스템

#### 🎬 5.1 영상 업로드 API (Day 15-16)
```python
# backend/app/routers/upload.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import shutil
import os
from ..database import get_db
from ..models.script import Script

router = APIRouter(prefix="/api/upload", tags=["upload"])

@router.post("/video/{script_id}")
async def upload_video_file(
    script_id: int,
    video_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """영상 파일 업로드 및 대본과 매칭"""
    
    # 대본 존재 확인
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(404, "대본을 찾을 수 없습니다")
    
    if script.status != "script_ready":
        raise HTTPException(400, "이미 처리된 대본입니다")
    
    # 비디오 파일 저장
    upload_dir = "uploads/videos"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = f"{upload_dir}/{script_id}_{video_file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(video_file.file, buffer)
    
    # DB 업데이트
    script.video_file_path = file_path
    script.status = "video_ready"
    db.commit()
    
    return {"message": "영상 업로드 완료", "file_path": file_path}
```

**작업 목록:**
- [ ] 영상 파일 업로드 API
- [ ] 파일 저장 로직
- [ ] 대본-영상 매칭 검증
- [ ] 상태 업데이트 로직
- [ ] 파일 크기 제한 설정

**완료 기준:**
- [ ] 영상 파일 업로드 성공
- [ ] uploads/videos 폴더에 파일 저장 확인
- [ ] DB 상태 업데이트 확인
```bash
# 영상 업로드 API 커밋
git add .
git commit -m "Add video file upload and script matching API"
git push
```

#### ▶️ 5.2 YouTube 업로드 API (Day 17-18)
```python
@router.post("/youtube/{script_id}")
async def upload_to_youtube(
    script_id: int,
    scheduled_time: str = Form(None),
    db: Session = Depends(get_db)
):
    """YouTube에 업로드"""
    
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script or script.status != "video_ready":
        raise HTTPException(400, "업로드 가능한 상태가 아닙니다")
    
    try:
        youtube_client = YouTubeClient()
        youtube_client.authenticate()
        
        metadata = {
            'title': script.title,
            'description': script.description,
            'tags': script.tags,
            'scheduled_time': scheduled_time
        }
        
        video_id = youtube_client.upload_video(script.video_file_path, metadata)
        
        # DB 업데이트
        script.youtube_video_id = video_id
        script.status = "uploaded"
        if scheduled_time:
            script.scheduled_time = datetime.fromisoformat(scheduled_time)
        db.commit()
        
        return {"message": "YouTube 업로드 성공", "video_id": video_id}
        
    except Exception as e:
        script.status = "error"
        db.commit()
        raise HTTPException(500, f"업로드 실패: {str(e)}")
```

**작업 목록:**
- [ ] YouTube 업로드 API 엔드포인트
- [ ] 예약 발행 기능
- [ ] 에러 처리 로직
- [ ] 진행 상황 추적
- [ ] API 할당량 체크

**테스트 방법:**
```bash
# 영상 파일 업로드 테스트
curl -X POST "http://localhost:8000/api/upload/video/1" \
  -H "Content-Type: multipart/form-data" \
  -F "video_file=@test_video.mp4"

# YouTube 업로드 테스트
curl -X POST "http://localhost:8000/api/upload/youtube/1" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "scheduled_time=2025-01-20T14:00:00"
```

**완료 기준:**
- [ ] 영상-대본 매칭 API 동작 확인
- [ ] YouTube 업로드 성공
- [ ] DB 상태 업데이트 확인
- [ ] YouTube에서 업로드된 영상 확인
```bash
# YouTube 업로드 API 커밋
git add .
git commit -m "Add YouTube upload API with error handling"
git push
```

### Week 6: UI 완성 및 통합

#### 🎨 6.1 업로드 UI 컴포넌트 (Day 19-20)
```tsx
// src/components/VideoUpload.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Script {
  id: number;
  title: string;
  status: string;
}

export function VideoUpload({ scripts }: { scripts: Script[] }) {
  const [selectedScript, setSelectedScript] = useState<number | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleVideoUpload = async () => {
    if (!selectedScript || !videoFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('video_file', videoFile);

    try {
      const response = await fetch(
        `http://localhost:8000/api/upload/video/${selectedScript}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        setProgress(50);
        // YouTube 업로드 시작
        const youtubeResponse = await fetch(
          `http://localhost:8000/api/upload/youtube/${selectedScript}`,
          { method: 'POST' }
        );

        if (youtubeResponse.ok) {
          setProgress(100);
          alert('업로드 완료!');
        }
      }
    } catch (error) {
      alert('업로드 실패');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const readyScripts = scripts.filter(s => s.status === 'script_ready');

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">영상 업로드</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            연결할 대본 선택
          </label>
          <select
            value={selectedScript || ''}
            onChange={(e) => setSelectedScript(Number(e.target.value))}
            className="w-full p-2 border rounded-md"
          >
            <option value="">대본을 선택하세요</option>
            {readyScripts.map(script => (
              <option key={script.id} value={script.id}>
                {script.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            영상 파일
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500"
          />
        </div>

        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600">
              업로드 중... {progress}%
            </p>
          </div>
        )}

        <Button
          onClick={handleVideoUpload}
          disabled={!selectedScript || !videoFile || uploading}
          className="w-full"
        >
          {uploading ? '업로드 중...' : 'YouTube에 업로드'}
        </Button>
      </div>
    </Card>
  );
}
```

**작업 목록:**
- [ ] VideoUpload 컴포넌트 구현
- [ ] 대본 선택 드롭다운
- [ ] 파일 선택 인터페이스
- [ ] 진행률 표시
- [ ] 업로드 상태 피드백

**완료 기준:**
- [ ] 대본 목록 표시 확인
- [ ] 영상 파일 선택 동작
- [ ] 업로드 진행률 표시
- [ ] 성공/실패 메시지 표시
```bash
# 비디오 업로드 UI 커밋
git add .
git commit -m "Add video upload UI with progress tracking"
git push
```

#### 📊 6.2 대시보드 통합 (Day 21)
```tsx
// src/App.tsx
import React, { useState, useEffect } from 'react';
import { ScriptUpload } from './components/ScriptUpload';
import { VideoUpload } from './components/VideoUpload';
import { ScriptList } from './components/ScriptList';
import { Card } from './components/ui/card';

function App() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScripts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/scripts');
      const data = await response.json();
      setScripts(data.scripts);
    } catch (error) {
      console.error('Failed to fetch scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <p>로딩 중...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          YouTube 업로드 자동화 시스템
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ScriptUpload onUploadComplete={fetchScripts} />
          <VideoUpload scripts={scripts} />
        </div>

        <Card className="p-6">
          <ScriptList scripts={scripts} onUpdate={fetchScripts} />
        </Card>

        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card className="p-4 text-center">
            <h3 className="text-lg font-semibold">전체 대본</h3>
            <p className="text-2xl text-blue-600">{scripts.length}</p>
          </Card>
          <Card className="p-4 text-center">
            <h3 className="text-lg font-semibold">업로드 완료</h3>
            <p className="text-2xl text-green-600">
              {scripts.filter(s => s.status === 'uploaded').length}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <h3 className="text-lg font-semibold">대기 중</h3>
            <p className="text-2xl text-yellow-600">
              {scripts.filter(s => s.status === 'script_ready').length}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <h3 className="text-lg font-semibold">에러</h3>
            <p className="text-2xl text-red-600">
              {scripts.filter(s => s.status === 'error').length}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
```

**작업 목록:**
- [ ] 전체 대시보드 레이아웃 구성
- [ ] 컴포넌트 통합
- [ ] 상태 관리 로직
- [ ] 통계 카드 구현
- [ ] 반응형 디자인

**완료 기준:**
- [ ] 모든 컴포넌트 정상 렌더링
- [ ] 대본 업로드 → 영상 매칭 → YouTube 업로드 플로우 동작
- [ ] 실시간 상태 업데이트
- [ ] 통계 정보 정확히 표시
```bash
# 통합 대시보드 커밋
git add .
git commit -m "Complete dashboard integration with statistics"
git push
```

---

## 🚀 Phase 3: 고도화 기능 (Week 7-8)

### Week 7: WebSocket 실시간 기능

#### 🔄 7.1 WebSocket 백엔드 (Day 22-23)
```python
# backend/app/routers/websocket.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # 클라이언트 메시지 처리
            await manager.send_personal_message(f"수신: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# 업로드 진행상황 알림 함수
async def notify_upload_progress(script_id: int, progress: int, message: str):
    notification = {
        "type": "upload_progress",
        "script_id": script_id,
        "progress": progress,
        "message": message
    }
    await manager.broadcast(json.dumps(notification))
```

**작업 목록:**
- [ ] WebSocket 연결 관리자 구현
- [ ] 실시간 알림 시스템
- [ ] 업로드 진행상황 브로드캐스트
- [ ] 연결 해제 처리
```bash
# WebSocket 백엔드 커밋
git add .
git commit -m "Add WebSocket real-time notification system"
git push
```

#### 🌐 7.2 WebSocket 프론트엔드 (Day 24)
```tsx
// src/hooks/useWebSocket.ts
import { useEffect, useState } from 'react';

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [message, setMessage] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      setConnected(true);
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessage(data);
      } catch (error) {
        setMessage({ type: 'text', data: event.data });
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = (message: any) => {
    if (socket && connected) {
      socket.send(JSON.stringify(message));
    }
  };

  return { socket, message, connected, sendMessage };
}
```

**작업 목록:**
- [ ] useWebSocket 훅 구현
- [ ] 실시간 메시지 수신 처리
- [ ] 연결 상태 관리
- [ ] 재연결 로직
```bash
# WebSocket 프론트엔드 커밋
git add .
git commit -m "Add WebSocket frontend hooks for real-time updates"
git push
```

### Week 8: 배치 처리 및 스케줄링

#### ⏰ 8.1 스케줄링 시스템 (Day 25-26)
```python
# backend/app/services/scheduler.py
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models.script import Script
from ..services.youtube_client import YouTubeClient

class SchedulerService:
    def __init__(self):
        self.running = False
        self.youtube_client = YouTubeClient()

    async def start(self):
        """스케줄러 시작"""
        self.running = True
        await self.youtube_client.authenticate()
        
        while self.running:
            await self.process_scheduled_uploads()
            await asyncio.sleep(60)  # 1분마다 체크

    async def process_scheduled_uploads(self):
        """예약된 업로드 처리"""
        from ..database import SessionLocal
        
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            
            # 업로드 시간이 된 스크립트 조회
            pending_scripts = db.query(Script).filter(
                Script.status == "scheduled",
                Script.scheduled_time <= now
            ).all()
            
            for script in pending_scripts:
                try:
                    await self.upload_script(script, db)
                except Exception as e:
                    print(f"Upload failed for script {script.id}: {e}")
                    script.status = "error"
                    db.commit()
        finally:
            db.close()

    async def upload_script(self, script: Script, db: Session):
        """단일 스크립트 업로드"""
        metadata = {
            'title': script.title,
            'description': script.description,
            'tags': script.tags
        }
        
        video_id = self.youtube_client.upload_video(
            script.video_file_path, 
            metadata
        )
        
        script.youtube_video_id = video_id
        script.status = "uploaded"
        db.commit()
        
        # WebSocket으로 알림
        from ..routers.websocket import notify_upload_progress
        await notify_upload_progress(
            script.id, 100, f"업로드 완료: {video_id}"
        )

# 백그라운드 작업으로 스케줄러 실행
scheduler_service = SchedulerService()

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(scheduler_service.start())
```

**작업 목록:**
- [ ] 스케줄러 서비스 구현
- [ ] 백그라운드 작업 처리
- [ ] 예약 업로드 로직
- [ ] 에러 처리 및 재시도
- [ ] 스케줄러 시작/중단 API
```bash
# 스케줄링 시스템 커밋
git add .
git commit -m "Add automated scheduling system for uploads"
git push
```

#### 📋 8.2 배치 업로드 기능 (Day 27-28)
```python
# backend/app/routers/batch.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from ..database import get_db
from ..models.script import Script

router = APIRouter(prefix="/api/batch", tags=["batch"])

@router.post("/schedule-month")
async def schedule_monthly_uploads(
    start_date: str,  # "2025-02-01"
    upload_times: List[str],  # ["09:00", "14:00", "18:00"]
    db: Session = Depends(get_db)
):
    """1달치 업로드 일정 생성"""
    
    # 업로드 준비된 스크립트 조회
    ready_scripts = db.query(Script).filter(
        Script.status == "video_ready"
    ).all()
    
    if not ready_scripts:
        raise HTTPException(400, "업로드 가능한 스크립트가 없습니다")
    
    # 날짜별 스케줄 생성
    base_date = datetime.strptime(start_date, "%Y-%m-%d")
    scheduled_count = 0
    
    for i, script in enumerate(ready_scripts[:30]):  # 최대 30개
        day_offset = i // len(upload_times)
        time_index = i % len(upload_times)
        
        schedule_date = base_date + timedelta(days=day_offset)
        schedule_time = datetime.strptime(upload_times[time_index], "%H:%M").time()
        
        scheduled_datetime = datetime.combine(schedule_date.date(), schedule_time)
        
        script.scheduled_time = scheduled_datetime
        script.status = "scheduled"
        scheduled_count += 1
    
    db.commit()
    
    return {
        "message": f"{scheduled_count}개 스크립트 스케줄 완료",
        "scheduled_count": scheduled_count
    }

@router.get("/schedule")
async def get_upload_schedule(db: Session = Depends(get_db)):
    """예약된 업로드 일정 조회"""
    scheduled_scripts = db.query(Script).filter(
        Script.status == "scheduled"
    ).order_by(Script.scheduled_time).all()
    
    return {"scheduled_uploads": scheduled_scripts}
```

**작업 목록:**
- [ ] 배치 스케줄링 API
- [ ] 월간 업로드 계획 생성
- [ ] 스케줄 조회 API
- [ ] 스케줄 수정/삭제 기능

**완료 기준:**
- [ ] 1달치 스케줄 생성 성공
- [ ] 예약된 업로드 자동 실행 확인
- [ ] 스케줄 관리 UI 동작
```bash
# 배치 업로드 기능 커밋
git add .
git commit -m "Add batch upload scheduling functionality"
git push
```

---

## 🎯 최종 테스트 및 배포 (Week 9)

### Day 29-30: 통합 테스트
- [ ] **전체 플로우 테스트**: 대본 업로드 → 영상 매칭 → YouTube 업로드
- [ ] **에러 시나리오 테스트**: 잘못된 파일, API 오류, 네트워크 문제
- [ ] **성능 테스트**: 동시 업로드, 대용량 파일, 장시간 실행
- [ ] **UI/UX 테스트**: 모든 버튼, 폼, 피드백 메시지 확인

### Day 31: 문서화 및 배포 준비
- [ ] **README.md 작성**: 설치, 설정, 사용법 가이드
- [ ] **환경 설정 가이드**: YouTube API 설정, 인증 프로세스
- [ ] **트러블슈팅 가이드**: 주요 에러 해결 방법
- [ ] **배포 스크립트**: Docker, 환경변수, 백업 설정
```bash
# 최종 문서화 커밋
git add .
git commit -m "Complete documentation and deployment setup"
git push

# 릴리즈 태그 생성
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
```

---

## 📚 참고 자료 및 도구

### 필수 문서
- [ ] [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
- [ ] [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [ ] [React TypeScript Guide](https://react-typescript-cheatsheet.netlify.app/)
- [ ] [shadcn/ui Components](https://ui.shadcn.com/docs)

### 개발 도구 설정
- [ ] **VS Code Extensions**: Python, TypeScript, Tailwind CSS IntelliSense
- [ ] **API 테스트**: Postman 또는 Insomnia
- [ ] **버전 관리**: Git 설정 및 브랜치 전략
  ```bash
  # 브랜치 전략 설정
  git checkout -b develop
  git push -u origin develop
  
  # 기능 브랜치 예시
  git checkout -b feature/youtube-api
  git checkout -b feature/dashboard-ui
  git checkout -b feature/scheduling
  ```
- [ ] **데이터베이스 도구**: SQLite Browser

### 모니터링 도구
- [ ] **로그 관리**: Python logging 설정
- [ ] **에러 추적**: Sentry 또는 기본 예외 처리
- [ ] **성능 모니터링**: API 응답 시간 측정
- [ ] **YouTube API 할당량**: 일일 사용량 추적

---

## ⚠️ 중요 체크포인트

### 보안 주의사항
- [ ] **API 키 보안**: credentials.json, token.pickle 파일 .gitignore 추가
- [ ] **파일 업로드 검증**: 파일 타입, 크기 제한
- [ ] **SQL 인젝션 방지**: SQLAlchemy ORM 사용
- [ ] **CORS 설정**: 프로덕션에서 origin 제한

### 성능 최적화
- [ ] **파일 저장소**: 대용량 비디오 파일 처리 방안
- [ ] **DB 인덱스**: 자주 조회되는 컬럼에 인덱스 추가
- [ ] **캐싱**: API 응답 캐싱 전략
- [ ] **비동기 처리**: 업로드 작업 큐 시스템

### 확장성 고려
- [ ] **다중 채널**: 향후 5개 채널 지원 준비
- [ ] **사용자 관리**: 추후 다중 사용자 지원
- [ ] **백업**: 데이터 백업 및 복구 전략
- [ ] **모니터링**: 시스템 상태 모니터링

이 TASK.md는 1인 개발자가 체계적으로 YouTube 업로드 자동화 시스템을 구축할 수 있도록 단계별로 상세하게 정리되었습니다. 각 작업 항목을 순서대로 완료하면서 체크박스를 활용해 진행 상황을 관리하세요.