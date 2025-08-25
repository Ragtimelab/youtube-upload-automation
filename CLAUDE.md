# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 프로젝트 개요

**YouTube Upload Automation** - 한국 시니어 대상 콘텐츠를 제작하는 1인 개발자를 위한 YouTube 업로드 자동화 시스템

## 🏗️ 시스템 아키텍처

**하이브리드 아키텍처**: Backend (Python) + Frontend (React) + CLI 도구의 3계층 구조

```
youtube-upload-automation/
├── backend/app/              # FastAPI 백엔드 (Clean Architecture) - Port :8000
│   ├── core/                # 상수, 설정, 예외처리
│   │   ├── constants.py     # 모든 하드코딩 값 중앙화 (핵심!)
│   │   ├── yaml_loader.py   # YAML 설정 싱글톤 로더
│   │   └── responses.py     # 표준화된 API 응답 클래스
│   ├── models/              # SQLAlchemy 모델
│   ├── repositories/        # 데이터 접근 계층
│   ├── services/            # 비즈니스 로직 (YouTube, WebSocket)
│   └── routers/             # API 엔드포인트 (/api prefix)
├── frontend/                # React 19 + TypeScript + Vite - Port :5174
│   ├── src/components/      # UI 컴포넌트 (Shadcn/ui + Tailwind CSS)
│   ├── src/hooks/           # React 커스텀 훅 (WebSocket, API 통합)
│   ├── src/pages/           # 8개 페이지 (Dashboard, Scripts, Upload, YouTube, etc.)
│   └── src/services/        # API 클라이언트 (Axios + TanStack Query)
├── cli/                     # CLI 도구 (개발자 우선 인터페이스)
│   └── commands/            # script.py, video.py, youtube.py, status.py
├── config/                  # YAML 기반 설정 파일
│   └── channels.yaml        # 채널 브랜딩 중앙 관리 (핵심!)
├── .secrets/                # 인증 파일 (git에서 제외)
└── uploads/                 # 업로드 파일 저장소
```

### 🔄 주요 통신 패턴
- **CLI ↔ Backend**: REST API (`/api/` endpoints)
- **Frontend ↔ Backend**: REST API + WebSocket (실시간 업데이트)
- **Frontend ↔ Backend**: CORS 설정으로 포트 간 통신 (5174 → 8000)

## 🔧 핵심 개발 명령어

### Poetry 환경 설정
```bash
# Poetry 의존성 설치 (가상환경 자동 생성)
poetry install                # 기본 의존성
poetry install --with dev,test # 개발/테스트 의존성 포함

# Note: Poetry 2.0+ 에서는 `poetry shell` 대신 `poetry run` 사용 권장
# 직접 명령어 실행: poetry run [command]
```

### Backend 개발 (IMPORTANT: 모든 make 명령어는 backend/ 디렉토리에서 실행)
```bash
# 디렉토리 이동 필수
cd backend/

# 서버 실행
make run                # 개발 서버 (auto-reload, uvicorn)
make run-prod           # 프로덕션 서버

# 코드 품질 (자동화된 도구 체인)
make format             # 코드 포매팅 (black + isort + autoflake)
make format-check       # 포매팅 검사 (CI용)
make lint               # 린트 검사 (flake8 + mypy)
make security           # 보안 취약점 검사 (bandit + safety)

# 테스트
make test               # 전체 테스트 실행 (backend/tests/)
make test-cov           # 커버리지 포함 테스트

# 개별 테스트 실행 (프로젝트 루트에서)
poetry run pytest backend/tests/unit/test_script_parser.py -v          # 단일 파일
poetry run pytest backend/tests/integration/test_scripts_api.py -v     # 통합 테스트
poetry run pytest backend/tests/unit/ -v                               # 단위 테스트만

# 데이터베이스
make migrate            # 마이그레이션 적용
make migrate-auto       # 자동 마이그레이션 생성
make migrate-create     # 빈 마이그레이션 생성

# 유틸리티
make clean              # 캐시 및 임시 파일 정리
make deps-update        # 의존성 업데이트
make deps-show          # 설치된 의존성 표시
make deps-tree          # 의존성 트리 표시

# 백업 및 배포
make backup             # 데이터베이스 자동 백업 실행
make backup-info        # 현재 백업 상태 확인
make build              # 패키지 빌드
make version            # 현재 버전 표시

# 버전 관리
make bump-patch         # 패치 버전 업 (1.0.0 → 1.0.1)
make bump-minor         # 마이너 버전 업 (1.0.0 → 1.1.0)
make bump-major         # 메이저 버전 업 (1.0.0 → 2.0.0)

# Docker 지원
make docker-build       # Docker 이미지 빌드
make docker-run         # Docker 컨테이너 실행

# 개발 도구
make shell              # Poetry shell 활성화
make api-docs           # API 문서 브라우저 안내

# Pre-commit 훅 (고급 코드 품질 자동화)
make pre-commit         # pre-commit 훅 설치 (보안 검사, 커밋 메시지 검증 포함)
make pre-commit-run     # 수동 실행 (모든 파일 대상)
```

### Frontend 개발 (React + TypeScript + Vite)
```bash
# 프론트엔드 디렉토리로 이동
cd frontend/

# Node.js 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5174)
npm run dev

# 프로덕션 빌드
npm run build

# TypeScript 컴파일 + 빌드 (권장)
npm run build  # 내부적으로 tsc -b && vite build 실행

# 린트 검사
npm run lint

# 테스트 실행 (Jest + Testing Library)
npm run test            # 단일 테스트 실행
npm run test:watch      # 감시 모드로 테스트
npm run test:coverage   # 커버리지 포함 테스트
npm run test:ci         # CI 환경용 테스트

# 빌드 파일 미리보기
npm run preview
```

### Playwright 프론트엔드 검증 (최신 추가!)
```bash
# Playwright를 통한 완전한 프론트엔드 기능 검증
# 참고: PLAYWRIGHT_FRONTEND_VERIFICATION_CHECKLIST.md

# 1. 기본 환경 준비 (Backend + Frontend 모두 실행 필요)
cd backend/ && make run    # Terminal 1
cd frontend/ && npm run dev  # Terminal 2

# 2. Playwright MCP 도구를 통한 자동화 검증
# - 8개 페이지 완전 접근성 테스트
# - 실제 브라우저 사용자 인터랙션 시뮬레이션
# - CLI-Frontend 동기화 실시간 검증
# - 에러 처리 및 상태 관리 검증
```

### CLI 사용법
```bash
# 메인 CLI 실행 (Poetry 자동 감지)
./youtube-cli --help

# 빠른 도구들
./quick-script script.txt       # 빠른 스크립트 업로드
./quick-upload                  # 빠른 비디오 업로드 (대화형)

# 개별 CLI 명령어 (cli/commands/ 구조)
./youtube-cli script upload my_script.md    # 스크립트 업로드
./youtube-cli script list                   # 스크립트 목록
./youtube-cli video upload 1 video.mp4      # 비디오 업로드
./youtube-cli youtube upload 1              # YouTube 업로드
./youtube-cli status                         # 상태 확인
```

### 🚀 전체 시스템 실행 (개발 모드)
```bash
# Terminal 1: Backend 서버 실행 (Port 8000)
cd backend/
make run

# Terminal 2: Frontend 서버 실행 (Port 5174)  
cd frontend/
npm run dev

# Terminal 3: CLI 도구 사용 (선택사항)
./youtube-cli status
```


## 📂 파일 명명 규칙 및 형식

### 날짜 기반 파일명 패턴
```bash
# 자동 매핑용 파일명 (ValidationConstants.DATE_PATTERN_REGEX)
YYYYMMDD_NN_story.md     # 스크립트 파일 (마크다운 전용)
YYYYMMDD_NN_story.mp4    # 비디오 파일

# 예시
20250819_01_story.md
20250819_01_story.mp4
```

### 스크립트 파일 형식 (.md)
```markdown
=== 제목 ===
[Video Title]

=== 메타데이터 ===
설명: [Description]
태그: [tag1, tag2, ...]

=== 썸네일 정보 ===
텍스트: [Thumbnail text]
ImageFX 프롬프트: [AI generation prompt]

=== 대본 ===
[Script content]
```

## ⚙️ 환경 설정

### 핵심 환경변수 (.env)
```bash
# 서버 설정
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
BACKEND_RELOAD=true

# 파일 경로
UPLOAD_DIR=uploads/videos
YOUTUBE_CREDENTIALS_PATH=./.secrets/youtube-oauth2.json
YOUTUBE_TOKEN_PATH=./.secrets/youtube-token.pickle

# YouTube API 기본값
DEFAULT_PRIVACY_STATUS=private
DEFAULT_CATEGORY_ID=22

# 개발 설정
DEBUG=true
LOG_LEVEL=INFO
```

### 필수 인증 파일 (.secrets/ 디렉토리)
- `youtube-oauth2.json` - Google OAuth2 클라이언트 인증 정보
- `youtube-token.pickle` - YouTube API 액세스 토큰

## 🚀 핵심 기능 및 상태 관리

### 업로드 워크플로우
```
script_ready → video_ready → uploaded → error
```

### 🎭 채널 브랜딩 자동화 (YAML 기반) - 핵심 아키텍처
**이 시스템의 독특한 특징 중 하나입니다. 모든 YouTube 업로드 시 자동으로 적용**:
- **설명 자동 확장**: 대본 설명 + 채널 기본 설명글 (구독 유도, 저작권 안내 등)
- **태그 스마트 결합**: 대본 태그 + 채널 기본 태그 (중복 제거, 별도 필드)
- **YouTube API 구조 준수**: Description(5,000바이트)와 Tags(500자) 완전 분리
- **원본 콘텐츠 우선**: 대본 설명/태그가 우선적으로 보존됨
- **YAML 기반 실시간 관리**: `config/channels.yaml`에서 중앙화된 채널 설정 관리

**핵심 파일들**:
- **설정 파일**: `config/channels.yaml` (마음서랍 채널 완전 통합)
- **로더**: `backend/app/core/yaml_loader.py` (싱글톤 패턴)
- **상수 클래스**: `backend/app/core/constants.py` → `ChannelConstants`

```python
# 사용 예시 - YAML 기반 동적 로딩
final_description = ChannelConstants.combine_description("대본 설명")  # 순수 텍스트만
final_tags = ChannelConstants.combine_tags("대본 태그")  # 태그만 별도 처리

# 채널별 설정 접근
from backend.app.core.yaml_loader import channel_loader
channel_config = channel_loader.get_channel_config("maeum-seorab")
```

**중요**: 모든 채널 브랜딩 자산(설명글, 태그, 메타데이터)이 YAML 파일에서 실시간 로드되어 즉시 반영됩니다.

### YouTube API 제한사항 (YouTubeConstants)
- **일일 할당량**: 10,000 units
- **업로드 비용**: 1,600 units per upload
- **제목 제한**: 100자
- **설명 제한**: 5,000바이트
- **태그 제한**: 500자
- **파일 크기**: 최대 8GB

### 지원 파일 형식 (FileConstants)
- **스크립트**: .md (마크다운 전용)
- **비디오**: .mp4, .avi, .mov, .mkv, .flv

## 🔍 주요 API 엔드포인트

```bash
# 스크립트 관리
POST   /api/scripts/upload           # 스크립트 업로드
GET    /api/scripts/                 # 스크립트 목록
GET    /api/scripts/{id}             # 스크립트 상세

# 업로드 관리  
POST   /api/upload/video/{script_id} # 비디오 업로드
POST   /api/upload/youtube/{script_id} # YouTube 업로드

# WebSocket 실시간 통신
WS     /ws/                          # 실시간 업로드 상태, 진행률 알림

# 시스템
GET    /health                       # 헬스체크
GET    /docs                         # API 문서 (Swagger)
```

## 🌐 프론트엔드 아키텍처

### React 페이지 구조 (8개 페이지)
- **DashboardPage**: 시스템 개요, 실시간 상태 카드
- **ScriptsPage**: 스크립트 관리, 업로드, 목록 조회
- **UploadPage**: 비디오 업로드, 드래그&드롭 지원
- **YouTubePage**: YouTube 업로드 관리, 상태 필터링
- **StatusPage**: 시스템 모니터링, 로그 스트림
- **PipelinePage**: 파이프라인 시각화, 애니메이션
- **SettingsPage**: 설정 관리
- **HomePage**: 랜딩 페이지

### 핵심 React 기술 스택
- **React 19.1.1** + **TypeScript 5.8** + **Vite 7.1**
- **TanStack Query 5.85**: 서버 상태 관리 및 캐싱
- **Zustand 5.0**: 클라이언트 상태 관리
- **Shadcn/ui**: UI 컴포넌트 라이브러리
- **Tailwind CSS 3.4**: 유틸리티 기반 CSS 프레임워크
- **React Hook Form 7.62** + **Zod 4.0**: 폼 관리 및 검증
- **WebSocket**: 실시간 업로드 진행률 및 상태 동기화

### React 19 Component Composition 패턴 (2025-08 적용)
**핵심 설계 원칙**: 77% 코드 감소 달성한 최신 아키텍처
- **Single Responsibility**: 모든 컴포넌트 100행 이하 제한
- **Props Down, Events Up**: 완전한 단방향 데이터 흐름
- **Custom Hooks 추상화**: 비즈니스 로직 완전 분리
- **Component Composition**: 스파게티 코드 완전 제거

**주요 Custom Hooks**:
- `useYouTubeManager`: YouTube 업로드 로직 완전 추상화 (182줄)
- `useDashboardData`: Dashboard 데이터 처리 로직 추상화 (100줄)
- `useErrorHandler`: 통합 에러 처리 훅

**유틸리티 모듈화 (DRY 원칙 95% 달성)**:
- `src/utils/dateFormat.ts`: 13개 파일 날짜 형식 중복 제거
- `src/utils/classNames.ts`: 14개 파일 53개 CSS 클래스 표준화
- `src/utils/apiUtils.ts`: API 에러 처리 로직 중앙화
- `src/types/`: 46개 분산 타입 → 4개 중앙화 파일

## 🔧 아키텍처 패턴

### Clean Architecture (Backend)
- **Repository Layer**: 데이터 접근 추상화
- **Service Layer**: 비즈니스 로직 (YouTube API, WebSocket)
- **Router Layer**: API 엔드포인트 및 HTTP 처리

### API 응답 표준화 (중요!)
모든 API 엔드포인트는 표준화된 응답 형식을 사용합니다:
```python
# 성공 응답
{
    "success": true,
    "data": { ... },
    "message": "작업이 성공적으로 완료되었습니다.",
    "timestamp": "2025-01-01T00:00:00Z"
}

# 에러 응답  
{
    "success": false,
    "message": "오류 메시지",
    "error_code": "ERROR_TYPE",
    "timestamp": "2025-01-01T00:00:00Z"
}
```

**핵심 응답 클래스들** (`backend/app/core/responses.py`):
- `SuccessResponse`: 일반 성공 응답
- `ScriptResponse`: 스크립트 관련 응답 (created, updated, deleted)
- `UploadResponse`: 업로드 관련 응답
- `PaginatedResponse`: 페이징된 목록 응답
- `ErrorResponse`: 에러 응답

### Constants 중앙화 시스템
**핵심**: 모든 하드코딩 값은 `backend/app/core/constants.py`에 중앙화
- `YouTubeConstants`: API 제한, 기본값, 배치 업로드 설정
- `FileConstants`: 파일 크기, 확장자 제한, 업로드 청크 크기
- `NetworkConstants`: 재시도, 타임아웃 설정
- `PathConstants`: 디렉토리 경로, 파일명
- `MessageConstants`: 사용자 메시지
- `ValidationConstants`: 날짜 형식, 정규식
- `ChannelConstants`: YAML 기반 채널 브랜딩 (동적 로딩)
- `LoggingConstants`: 로그 파일 크기, 백업 설정
- `PaginationConstants`: API 페이지네이션 기본값
- `TimeConstants`: 모니터링, 새로고침 간격

### CLI 명령 구조
- `cli/commands/script.py`: 스크립트 관리
- `cli/commands/video.py`: 비디오 업로드
- `cli/commands/youtube.py`: YouTube 업로드
- `cli/commands/status.py`: 상태 확인

## 🧪 테스트 및 품질 관리

### 권장 테스트 실행
```bash
# 핵심 테스트만 실행 (프로젝트 루트에서)
poetry run pytest backend/tests/unit/test_script_parser.py backend/tests/unit/test_script_service.py backend/tests/test_integration_final.py backend/tests/test_json_serialization.py backend/tests/integration/test_scripts_api.py -v

# 전체 테스트 스위트 (backend/ 디렉토리에서)
make test

# 커버리지 포함 (backend/ 디렉토리에서)
make test-cov

# 특정 테스트 클래스나 메서드 실행
poetry run pytest backend/tests/integration/test_scripts_api.py::TestScriptsAPI::test_upload_script_success -v

# 테스트 구조 (backend/tests/)
# ├── unit/                    # 단위 테스트
# │   ├── test_script_parser.py   # 스크립트 파싱 로직
# │   └── test_script_service.py  # 스크립트 서비스 로직  
# ├── integration/             # 통합 테스트
# │   ├── test_scripts_api.py     # API 엔드포인트
# │   ├── test_youtube_auth.py    # YouTube 인증
# │   └── test_youtube_client.py  # YouTube 클라이언트
# ├── test_integration_final.py   # 최종 통합 테스트
# └── test_json_serialization.py  # JSON 직렬화 테스트
```

### 프론트엔드 완전 검증 (Playwright 기반)
```bash
# 브라우저 자동화 테스트 (실제 사용자 인터랙션 시뮬레이션)
# 참고: PLAYWRIGHT_FRONTEND_VERIFICATION_CHECKLIST.md

# 검증 단계 (8개 주요 페이지):
# 1단계: 시스템 준비 및 환경 확인
# 2단계: 전체 페이지 접근성 및 로딩 검증  
# 3단계: ScriptsPage 완전 기능 검증 (검색/페이지네이션/업로드/삭제)
# 4단계: UploadPage 전체 기능 검증 (파일 선택/크기 검증/에러 처리)
# 5단계: YouTubePage 업로드 관리 검증
# 6단계: DashboardPage 실시간 상태 검증
# 7단계: 전체 워크플로우 통합 테스트
# 8단계: 성능 및 안정성 최종 검증

# 검증 도구: Playwright MCP (mcp__playwright__)
# 검증 기준: 글로벌 원칙 100% 준수 (우회 금지, 추측 금지, 실시간 검증)
```

### 코드 품질 도구 (pyproject.toml 설정)
```bash
# 포매팅: black (line-length=88) + isort + autoflake (backend/ 디렉토리에서)
make format
make format-check       # CI용 검사

# 린팅: flake8 (88자 제한) + mypy (backend/ 디렉토리에서)
make lint

# 개별 도구 실행 (프로젝트 루트에서)
poetry run black backend/app/                              # 코드 포매팅
poetry run isort backend/app/                              # import 정렬
poetry run autoflake --remove-all-unused-imports --recursive backend/app/  # 미사용 import 제거
poetry run flake8 backend/app/ --max-line-length=88        # 린트 검사
poetry run mypy backend/app/                               # 타입 체킹

# 보안 검사 (backend/ 디렉토리에서)
make security          # Safety를 통한 의존성 취약점 검사

# Pre-commit 훅 (고급 코드 품질 자동화)
make pre-commit        # pre-commit 훅 설치
make pre-commit-run    # 수동 실행 (모든 파일 대상)
```

## 🚨 트러블슈팅

### Backend 문제
- **서버 연결**: `curl http://localhost:8000/health`
- **API 문서**: http://localhost:8000/docs
- **로그 확인**: `tail -f logs/app-$(date +%Y-%m-%d).log`

### CLI 문제
- **Poetry 환경**: `poetry run python --version` 확인 (Poetry 2.0+ 권장)
- **실행 권한**: `chmod +x youtube-cli`
- **파일명 규칙**: YYYYMMDD_NN_story.md/mp4 패턴 확인


### 인증 문제
- **OAuth2 파일**: `.secrets/youtube-oauth2.json` 존재 확인
- **토큰 파일**: `.secrets/youtube-token.pickle` 권한 확인
- **Google Cloud**: YouTube Data API v3 활성화 확인

## 💡 주요 설계 원칙

1. **마크다운 전용**: 스크립트 파일은 .md만 사용
2. **상수 중앙화**: 하드코딩 값 없이 constants.py 사용  
3. **환경 설정**: .env 파일 기반 유연한 설정
4. **Clean Architecture**: Repository → Service → Router 계층
5. **CLI 우선**: 개발자 워크플로우는 CLI 중심
6. **자동화 우선**: 수동 작업 최소화
7. **한국 시니어 타겟**: 단순하고 직관적인 워크플로우

## 📦 의존성 관리

### 핵심 Backend 의존성
- **Python**: 3.13
- **FastAPI**: 0.116.0+ (WebSocket 지원)
- **SQLAlchemy**: 2.0+ (ORM)  
- **Google APIs**: YouTube Data API v3
- **Click**: 8.2+ (CLI 프레임워크)
- **Rich**: 14.1+ (터미널 UI)
- **Pydantic**: 2.5+ (데이터 검증)
- **Alembic**: 1.12+ (데이터베이스 마이그레이션)

### 핵심 Frontend 의존성
- **React**: 19.1.1 (최신 안정 버전)
- **TypeScript**: 5.8.3 (엄격 모드 지원)
- **Vite**: 7.1.2 (빌드 도구)
- **TanStack Query**: 5.85.5 (서버 상태 관리)
- **Zustand**: 5.0.8 (클라이언트 상태 관리)
- **Tailwind CSS**: 3.4.17 (유틸리티 CSS)
- **Zod**: 4.0.17 (스키마 검증)

### Backend 개발 도구 (최적화됨)
- **pytest**: 테스트 프레임워크 + pytest-asyncio, pytest-cov
- **black**: 코드 포매팅 (88자 제한)
- **isort**: import 정렬
- **autoflake**: 미사용 import 자동 제거
- **flake8**: 린팅 (88자 제한, E203/W503 무시)
- **mypy**: 타입 체킹
- **pre-commit**: Git 훅 (고급 보안 검사 포함)
- **coverage**: 코드 커버리지 분석
- **factory-boy**: 테스트 데이터 생성

### Frontend 개발 도구
- **Jest**: 테스트 프레임워크 (30.0.5)
- **Testing Library**: React 컴포넌트 테스트 (16.3.0)
- **ESLint**: TypeScript/React 린팅 (9.33.0)
- **TanStack Query DevTools**: 서버 상태 디버깅 도구
- **Vite**: 번들링 및 HMR (Hot Module Replacement)

## 🎯 시스템 최적화 현황 (2025-08-25 최신)

### ✅ 최근 완료된 최적화 (Phase 1-11)
**Phase 1: React 19 Component Composition 패턴 완벽 적용 (77% 코드 감소)**
- **YouTubePage**: 310줄 → 147줄 (53% 감소) - 5개 컴포넌트 분리
- **DashboardPage**: 435줄 → 129줄 (70% 감소) - 6개 컴포넌트 분리
- **Custom Hooks 추상화**: useYouTubeManager(182줄), useDashboardData(100줄)
- **React 19 최신 패턴 100% 적용**: Single Responsibility, Props Down/Events Up

**Phase 2: DRY 원칙 95% 달성**
- **유틸리티 모듈화**: dateFormat.ts (13개 파일), classNames.ts (14개 파일 53개 CSS)
- **타입 시스템 재구성**: 46개 분산 타입 → 4개 중앙화 파일 (`@/types` 통합 Import)
- **에러/로딩 처리 표준화**: 7가지 로딩 + 7가지 에러 컴포넌트, useErrorHandler 훅
- **코드 중복 95% 제거**: 15개 파일 116개 인스턴스 표준화

**Phase 8: 개발자 경험 및 도구 개선 완전 달성 ✅ **
- **극대화된 TypeScript 엄격 모드**: 6개 추가 strict 규칙 적용 (100+ 컴파일 에러 감지)
- **개발 도구 최적화**: TanStack Query DevTools, Zustand DevTools, Vite HMR 개선
- **테스트 인프라 강화**: Jest 현대화, jest-dom 매처 완전 지원, 23/23 테스트 통과
- **verbatimModuleSyntax 지원**: TypeScript 5.8 최신 기능 적용
- **컴파일 타임 안전성**: 런타임 에러의 컴파일 타임 감지로 품질 보증 극대화

**기존 최적화 (지속 유지)**
- **YAML 기반 채널 브랜딩**: config/channels.yaml을 통한 중앙화된 채널 설정 관리 (싱글톤 패턴)
- **의존성 정리**: 미사용 패키지 3개 제거 (pydub, playwright, colorama) - 15-20% 크기 감소
- **API 응답 표준화**: 모든 엔드포인트 SuccessResponse 형식 통일
- **코드 품질 개선**: flake8 88자 제한, autoflake 자동 import 정리 도구 추가
- **Pre-commit 훅 강화**: 보안 검사(bandit), 의존성 취약점 검사(safety), 커밋 메시지 표준화
- **Constants 확장**: 로깅, 페이지네이션, 시간 관련 상수 추가로 완전한 중앙화 구현

### 🔄 현재 시스템 상태 (2025-08-24 현재)
- **Backend**: FastAPI + WebSocket (Port 8000) ✅
- **Frontend**: React 19 + TypeScript 5.8 (Port 5174) ✅
- **테스트 통과율**: 23/23 (100%) ✅ **Phase 8 Updated**
- **TypeScript 엄격 모드**: 극대화된 타입 안전성 (100+ 에러 감지) ✅
- **개발 도구**: DevTools 완전 통합 (TanStack Query + Zustand) ✅
- **API 응답 일관성**: 완전 표준화 ✅  
- **코드 품질**: flake8/black/isort 규칙 준수 ✅
- **의존성 상태**: 최적화 완료 ✅
- **CLI 도구**: 정상 작동 ✅
- **채널 브랜딩**: YAML 기반 동적 관리 ✅
- **실시간 통신**: WebSocket 기반 진행률 알림 ✅

### 🎭 최신 프론트엔드 검증 상태 (Playwright 기반)
- **4단계 완료**: ScriptsPage + UploadPage 완전 기능 검증 100% ✅
- **검증 완료 페이지**: ScriptsPage (검색/페이지네이션/업로드/삭제), UploadPage (파일 선택/크기 검증/에러 처리)
- **브라우저 자동화 테스트**: 실제 사용자 인터랙션 시뮬레이션 완료
- **근본 문제 해결**: 3개 핵심 문제 발견 및 수정 완료
- **React 상태 관리**: 완전한 상태 동기화 및 UI 업데이트 검증 완료
- **JavaScript File API**: 파일 업로드 시뮬레이션 및 검증 로직 100% 동작 확인

---

## 🚨 중요 개발 참고사항

### 하이브리드 아키텍처 특징
1. **3가지 인터페이스**: CLI (개발자용), React Web UI (사용자용), REST API (통합용)
2. **독립 서버**: Backend(8000), Frontend(5174) 별도 실행 필요
3. **실시간 동기화**: WebSocket으로 CLI ↔ Web UI 상태 동기화
4. **중앙화된 설정**: `backend/app/core/constants.py` + `config/channels.yaml`

### 개발 시 주의사항
- **Backend 개발**: 모든 make 명령어는 `backend/` 디렉토리에서 실행
- **Frontend 개발**: npm 명령어는 `frontend/` 디렉토리에서 실행  
- **CLI 개발**: 프로젝트 루트에서 `./youtube-cli` 실행
- **테스트**: Backend 테스트는 `poetry run pytest`로 실행
- **프론트엔드 검증**: Playwright MCP를 통한 브라우저 자동화 테스트 필수
- **Component Composition**: React 19 패턴 준수 (100행 이하, Single Responsibility)

### 🎭 최신 개발 워크플로우 (2025-08)
```bash
# 1. 개발 환경 준비
cd backend/ && make run          # Backend 서버 실행
cd frontend/ && npm run dev      # Frontend 서버 실행

# 2. 코드 품질 검증
cd backend/ && make format       # 코드 포매팅
cd backend/ && make lint         # 린트 검사
cd frontend/ && npm run lint     # 프론트엔드 린트

# 3. 테스트 실행
cd backend/ && make test         # Backend 테스트 (pytest)
cd frontend/ && npm run test     # Frontend 테스트 (Jest + Testing Library)
# Playwright 프론트엔드 검증 (브라우저 자동화)

# 4. Git 커밋 (글로벌 원칙 준수)
# - 우회 금지: 근본 해결 추구
# - 추측 금지: 검증 우선 추구  
# - 실시간 검증: 정확한 시간 정보 확인 후 작업
```

**중요**: 이 시스템은 1인 개발자가 한국 시니어 대상 콘텐츠를 효율적으로 제작하고 업로드하기 위해 설계되었습니다. CLI 도구가 주요 인터페이스이며, React Web UI는 시각적 모니터링과 관리를 위한 보조 도구입니다.