# 📋 기술 명세서 (Technical Specification)

## 🏗️ 시스템 아키텍처

### 전체 구조
```
┌─────────────────────────────────────────────┐
│                 Web Frontend                │
│         React + TypeScript + shadcn/ui     │
└─────────────────┬───────────────────────────┘
                  │ HTTP/WebSocket
┌─────────────────▼───────────────────────────┐
│              FastAPI Backend               │
│         Python 3.13 + SQLAlchemy          │
└─────────────────┬───────────────────────────┘
                  │
    ┌─────────────▼─────────────┬─────────────┐
    │                          │             │
┌───▼────┐           ┌─────────▼──┐  ┌──────▼────┐
│ SQLite │           │ YouTube    │  │ File      │
│   DB   │           │ Data API   │  │ System    │
└────────┘           └────────────┘  └───────────┘
```

### 컴포넌트 구성

#### Frontend (React + TypeScript)
```
src/
├── components/          # shadcn/ui 컴포넌트
│   ├── ui/             # 기본 UI 컴포넌트
│   ├── ScriptUpload    # 대본 업로드
│   ├── VideoMatch      # 영상-대본 매칭
│   ├── UploadStatus    # 업로드 상태 모니터링
│   └── Dashboard       # 메인 대시보드
├── hooks/              # React Hooks
│   ├── useWebSocket    # WebSocket 연결
│   ├── useScripts      # 대본 관리
│   └── useUpload       # 업로드 관리
├── types/              # TypeScript 타입 정의
├── utils/              # 유틸리티 함수
└── App.tsx            # 메인 앱
```

#### Backend (FastAPI)
```
app/
├── main.py            # FastAPI 앱 엔트리포인트
├── models/            # SQLAlchemy 모델
│   ├── script.py      # 대본 모델
│   └── channel.py     # 채널 모델
├── routers/           # API 라우터
│   ├── scripts.py     # 대본 관리 API
│   ├── upload.py      # 업로드 API
│   └── websocket.py   # WebSocket 핸들러
├── services/          # 비즈니스 로직
│   ├── script_parser.py    # 대본 파싱
│   ├── youtube_client.py   # YouTube API 클라이언트
│   └── scheduler.py        # 스케줄링 로직
├── utils/             # 유틸리티
└── database.py        # 데이터베이스 설정
```

---

## 🔧 기술 스택 상세

### Backend Technologies

#### FastAPI (0.104.1+) with Poetry
```toml
# pyproject.toml - 주요 의존성
[tool.poetry.dependencies]
python = "^3.13"
fastapi = "^0.104.1"
uvicorn = {extras = ["standard"], version = "^0.24.0"}
sqlalchemy = "^2.0.23"
alembic = "^1.12.1"
python-multipart = "^0.0.6"
websockets = "^12.0"
python-dotenv = "^1.0.0"
pydantic = "^2.5.0"
```

#### YouTube Data API v3
```toml
# pyproject.toml - Google API 클라이언트
google-auth = "^2.25.2"
google-auth-oauthlib = "^1.1.0"
google-auth-httplib2 = "^0.1.1"
google-api-python-client = "^2.108.0"
```

### Frontend Technologies

#### React + TypeScript
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

#### UI Framework
```json
{
  "dependencies": {
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0"
  }
}
```

---

## 🗄️ 데이터베이스 설계

### SQLite 스키마

#### scripts 테이블
```sql
CREATE TABLE scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags TEXT,
    thumbnail_text VARCHAR(100),
    imagefx_prompt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'script_ready',
    channel_id VARCHAR(50),
    youtube_video_id VARCHAR(50),
    video_file_path VARCHAR(500),
    scheduled_time TIMESTAMP,
    
    CONSTRAINT chk_status CHECK (
        status IN ('script_ready', 'video_ready', 'scheduled', 'uploaded', 'error')
    )
);
```

#### channels 테이블
```sql
CREATE TABLE channels (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    credentials_path VARCHAR(500),
    upload_schedule VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_channel_status CHECK (
        status IN ('active', 'inactive', 'error')
    )
);
```

#### upload_logs 테이블
```sql
CREATE TABLE upload_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    script_id INTEGER NOT NULL,
    channel_id VARCHAR(50) NOT NULL,
    youtube_video_id VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (script_id) REFERENCES scripts (id),
    FOREIGN KEY (channel_id) REFERENCES channels (id)
);
```

### SQLAlchemy 모델

#### Script 모델
```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Script(Base):
    __tablename__ = "scripts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(Text, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    tags = Column(Text)
    thumbnail_text = Column(String(100))
    imagefx_prompt = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String(20), default="script_ready")
    channel_id = Column(String(50))
    youtube_video_id = Column(String(50))
    video_file_path = Column(String(500))
    scheduled_time = Column(DateTime)
```

---

## 🌐 API 설계

### REST API 엔드포인트

#### 대본 관리
```python
# POST /api/scripts/upload
# 대본 파일 업로드 및 파싱
{
    "file": "script.txt",  # multipart/form-data
}

# GET /api/scripts
# 등록된 대본 목록 조회
Response: {
    "scripts": [
        {
            "id": 1,
            "title": "할머니의 숨겨진 이야기",
            "status": "script_ready",
            "created_at": "2025-01-15T09:00:00Z"
        }
    ]
}

# GET /api/scripts/{script_id}
# 특정 대본 상세 조회
Response: {
    "id": 1,
    "content": "대본 내용...",
    "title": "할머니의 숨겨진 이야기",
    "description": "시니어 회상 이야기",
    "tags": "시니어, 회상, 이야기",
    "thumbnail_text": "숨겨진 진실",
    "imagefx_prompt": "elderly korean person...",
    "status": "script_ready"
}
```

#### 영상 업로드
```python
# POST /api/upload/video
# 영상 파일과 대본 매칭
{
    "script_id": 1,
    "video_file": "video.mp4",  # multipart/form-data
    "scheduled_time": "2025-01-16T14:00:00Z"  # optional
}

# POST /api/upload/youtube
# YouTube 업로드 시작
{
    "script_id": 1,
    "channel_id": "UC...",
    "privacy_status": "private",
    "publish_at": "2025-01-16T14:00:00Z"
}

# GET /api/upload/status/{script_id}
# 업로드 상태 조회
Response: {
    "script_id": 1,
    "status": "uploading",
    "progress": 45,
    "youtube_video_id": "dQw4w9WgXcQ",
    "error_message": null
}
```

### WebSocket API

#### 실시간 상태 업데이트
```python
# WebSocket 연결: ws://localhost:8000/ws
# 클라이언트 → 서버
{
    "type": "subscribe",
    "script_id": 1
}

# 서버 → 클라이언트
{
    "type": "upload_progress",
    "script_id": 1,
    "status": "uploading",
    "progress": 67,
    "message": "메타데이터 업로드 중..."
}

# 업로드 완료 알림
{
    "type": "upload_complete",
    "script_id": 1,
    "youtube_video_id": "dQw4w9WgXcQ",
    "status": "uploaded"
}
```

---

## 📄 대본 파일 파싱

### 표준화된 대본 형식
```text
=== 대본 ===
[시니어 1인칭 회상 대본 내용]

=== 메타데이터 ===
제목: [이 대본 내용에 최적화된 SEO 제목]
설명: [이 대본 요약 + 채널 정보 + 관련 해시태그]
태그: [이 대본 관련 키워드들, 쉼표로 구분]
카테고리: People & Blogs
공개설정: 비공개

=== 썸네일 제작 ===
썸네일 문구: [썸네일에 넣을 임팩트 있는 핵심 문구]
ImageFX 프롬프트: [대본 내용에 최적화된 배경 이미지 생성용 영문 프롬프트, 텍스트 요소 제외]
```

### 파싱 로직
```python
import re
from typing import Dict, Optional

class ScriptParser:
    def parse_script_file(self, content: str) -> Dict[str, str]:
        """대본 파일을 파싱하여 섹션별로 분리"""
        sections = {}
        
        # 대본 내용 추출
        script_match = re.search(r'=== 대본 ===(.*?)=== 메타데이터 ===', 
                                content, re.DOTALL)
        if script_match:
            sections['content'] = script_match.group(1).strip()
        
        # 메타데이터 추출
        metadata_section = self._extract_section(content, '메타데이터')
        if metadata_section:
            sections.update(self._parse_metadata(metadata_section))
        
        # 썸네일 정보 추출
        thumbnail_section = self._extract_section(content, '썸네일 제작')
        if thumbnail_section:
            sections.update(self._parse_thumbnail(thumbnail_section))
        
        return sections
    
    def _extract_section(self, content: str, section_name: str) -> Optional[str]:
        """특정 섹션 추출"""
        pattern = f'=== {section_name} ===(.*?)(?:=== |$)'
        match = re.search(pattern, content, re.DOTALL)
        return match.group(1).strip() if match else None
    
    def _parse_metadata(self, metadata_section: str) -> Dict[str, str]:
        """메타데이터 섹션 파싱"""
        result = {}
        
        for line in metadata_section.split('\n'):
            line = line.strip()
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()
                
                if key == '제목':
                    result['title'] = value
                elif key == '설명':
                    result['description'] = value
                elif key == '태그':
                    result['tags'] = value
        
        return result
    
    def _parse_thumbnail(self, thumbnail_section: str) -> Dict[str, str]:
        """썸네일 섹션 파싱"""
        result = {}
        
        for line in thumbnail_section.split('\n'):
            line = line.strip()
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()
                
                if key == '썸네일 문구':
                    result['thumbnail_text'] = value
                elif key == 'ImageFX 프롬프트':
                    result['imagefx_prompt'] = value
        
        return result
```

---

## 🎬 YouTube API 연동

### OAuth 2.0 인증
```python
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

class YouTubeClient:
    SCOPES = ['https://www.googleapis.com/auth/youtube.upload']
    
    def __init__(self, credentials_path: str):
        self.credentials_path = credentials_path
        self.youtube = None
    
    def authenticate(self):
        """OAuth 2.0 인증 수행"""
        creds = None
        
        # 저장된 토큰이 있으면 로드
        if os.path.exists('token.json'):
            creds = Credentials.from_authorized_user_file('token.json', self.SCOPES)
        
        # 유효한 자격증명이 없으면 새로 인증
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_path, self.SCOPES)
                creds = flow.run_local_server(port=0)
            
            # 토큰 저장
            with open('token.json', 'w') as token:
                token.write(creds.to_json())
        
        self.youtube = build('youtube', 'v3', credentials=creds)
```

### 영상 업로드
```python
def upload_video(self, video_file_path: str, script_data: Dict) -> str:
    """YouTube에 영상 업로드"""
    
    body = {
        'snippet': {
            'title': script_data['title'],
            'description': script_data['description'],
            'tags': script_data['tags'].split(',') if script_data['tags'] else [],
            'categoryId': '22',  # People & Blogs
        },
        'status': {
            'privacyStatus': 'private',  # 초기에는 비공개
        }
    }
    
    # 예약 발행 시간이 있으면 설정
    if script_data.get('scheduled_time'):
        body['status']['publishAt'] = script_data['scheduled_time']
    
    # 파일 업로드
    media = MediaFileUpload(
        video_file_path,
        chunksize=-1,  # 전체 파일을 한 번에 업로드
        resumable=True
    )
    
    request = self.youtube.videos().insert(
        part=','.join(body.keys()),
        body=body,
        media_body=media
    )
    
    response = request.execute()
    return response['id']  # YouTube 비디오 ID 반환
```

---

## 🔄 스케줄링 시스템

### 배경 작업 처리
```python
import asyncio
from datetime import datetime, timedelta
from typing import List

class SchedulerService:
    def __init__(self, youtube_client: YouTubeClient, db_session):
        self.youtube_client = youtube_client
        self.db_session = db_session
        self.running = False
    
    async def start_scheduler(self):
        """스케줄러 시작"""
        self.running = True
        while self.running:
            await self.process_scheduled_uploads()
            await asyncio.sleep(60)  # 1분마다 체크
    
    async def process_scheduled_uploads(self):
        """예약된 업로드 처리"""
        now = datetime.utcnow()
        
        # 업로드 예정인 스크립트 조회
        pending_scripts = self.db_session.query(Script).filter(
            Script.status == 'video_ready',
            Script.scheduled_time <= now
        ).all()
        
        for script in pending_scripts:
            try:
                # YouTube 업로드 수행
                video_id = await self.upload_to_youtube(script)
                
                # DB 상태 업데이트
                script.status = 'uploaded'
                script.youtube_video_id = video_id
                self.db_session.commit()
                
                # WebSocket으로 실시간 알림
                await self.notify_upload_complete(script.id, video_id)
                
            except Exception as e:
                # 에러 처리
                script.status = 'error'
                self.db_session.commit()
                await self.notify_upload_error(script.id, str(e))
```

---

## 📊 모니터링 및 로깅

### API 할당량 모니터링
```python
class QuotaMonitor:
    def __init__(self):
        self.daily_usage = 0
        self.daily_limit = 10000
        self.reset_time = None
    
    def track_api_call(self, cost: int):
        """API 호출 비용 추적"""
        self.daily_usage += cost
        
        if self.daily_usage > self.daily_limit * 0.8:
            # 80% 초과 시 경고 알림
            self.send_quota_warning()
        
        if self.daily_usage >= self.daily_limit:
            # 한도 도달 시 업로드 중단
            self.pause_uploads()
    
    def get_remaining_quota(self) -> int:
        """남은 할당량 계산"""
        return max(0, self.daily_limit - self.daily_usage)
    
    def can_upload_video(self) -> bool:
        """비디오 업로드 가능 여부 확인"""
        return self.get_remaining_quota() >= 1600
```

### 로깅 시스템
```python
import logging
from datetime import datetime

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('youtube_automation.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# 사용 예시
logger.info(f"Script {script.id} upload started")
logger.error(f"Upload failed for script {script.id}: {error_message}")
logger.info(f"Video uploaded successfully: {video_id}")
```

---

## 🚀 배포 및 운영

### Poetry 기반 개발 환경 설정
```bash
# Git 저장소 복제
git clone https://github.com/[USERNAME]/youtube-upload-automation.git
cd youtube-upload-automation

# Poetry 가상환경 설정
poetry install  # pyproject.toml의 모든 의존성 설치
poetry shell    # 가상환경 활성화

# 개발 도구 설정
poetry run pre-commit install  # pre-commit 훅 설치

# 프론트엔드 의존성 설치
cd frontend
npm install
```

### 프로덕션 배포 (Poetry 기반)
```dockerfile
# Dockerfile
FROM python:3.13-slim

WORKDIR /app

# Poetry 설치
RUN pip install poetry

# Poetry 설정 캐시 비활성화 및 가상환경 비사용
RUN poetry config virtualenvs.create false

# 의존성 설치
COPY pyproject.toml poetry.lock* ./
RUN poetry install --no-dev

# 애플리케이션 코드 복사
COPY . .

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      - ./credentials:/app/credentials
      - ./.git:/app/.git  # Git 정보 마운트
    environment:
      - DATABASE_URL=sqlite:///./data/youtube_automation.db
      - GIT_BRANCH=main
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

---

## 🗂️ Git/GitHub 워크플로우

### 브랜치 전략
```bash
# 메인 브랜치: 안정적인 릴리즈 버전
main

# 개발 브랜치: 새로운 기능 개발
develop

# 기능별 브랜치
feature/youtube-api
feature/script-parser
feature/dashboard-ui
feature/websocket
feature/scheduling

# 버그 수정 브랜치
hotfix/critical-bug-fix
```

### 커밋 네이밍 귀칙
```bash
# 기능 추가
git commit -m "feat: Add YouTube video upload functionality"

# 버그 수정
git commit -m "fix: Resolve script parsing regex issue"

# 문서 업데이트
git commit -m "docs: Update API documentation"

# 리팩터링
git commit -m "refactor: Optimize database query performance"

# 스타일 변경
git commit -m "style: Format code with black and prettier"

# 테스트 추가
git commit -m "test: Add unit tests for script parser"
```

### GitHub Issues 및 PR 템플릿

#### Issue 템플릿
```markdown
## 문제 설명
- 현재 상황: []
- 기대 동작: []
- 실제 동작: []

## 재현 단계
1. []
2. []
3. []

## 환경 정보
- Python: 3.13
- OS: [macOS/Windows/Linux]
- Browser: []

## 추가 정보
- []
```

#### PR 템플릿
```markdown
## 변경 내용
- [x] 기능 추가/수정
- [ ] 버그 수정
- [ ] 리팩터링
- [ ] 문서 업데이트

## 주요 변경사항
1. []
2. []
3. []

## 테스트 체크리스트
- [ ] 기능 테스트 통과
- [ ] API 테스트 통과
- [ ] UI/UX 테스트 통과

## 스크린샷
[]
```

### GitHub Actions CI/CD
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python 3.13
      uses: actions/setup-python@v3
      with:
        python-version: 3.13
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    - name: Run tests
      run: |
        cd backend
        python -m pytest
    - name: Check code format
      run: |
        cd backend
        black --check .
        
  frontend-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Install dependencies
      run: |
        cd frontend
        npm install
    - name: Run tests
      run: |
        cd frontend
        npm run test
    - name: Build
      run: |
        cd frontend
        npm run build
```

### 릴리즈 관리
```bash
# 릴리즈 태그 생성
git tag -a v1.0.0 -m "First stable release - MVP complete"
git push origin v1.0.0

# 치정 전략
git tag -a v1.0.1 -m "Hotfix: Critical bug fixes"
git tag -a v1.1.0 -m "Feature: Batch upload scheduling"
git tag -a v2.0.0 -m "Major: Multi-channel support"
```

이 기술 명세서는 Git/GitHub 워크플로우를 포함하여 1인 개발자가 체계적으로 시스템을 구현할 수 있도록 모든 기술적 세부사항을 포함합니다.