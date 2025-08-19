# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 프로젝트 개요

**YouTube Upload Automation** - 한국 시니어 대상 콘텐츠를 제작하는 1인 개발자를 위한 YouTube 업로드 자동화 시스템

## 🏗️ 시스템 아키텍처

```
youtube-upload-automation/
├── backend/app/              # FastAPI 백엔드 (Clean Architecture)
│   ├── core/                # 상수, 설정, 예외처리
│   │   └── constants.py     # 모든 하드코딩 값 중앙화 (핵심!)
│   ├── models/              # SQLAlchemy 모델
│   ├── repositories/        # 데이터 접근 계층
│   ├── services/            # 비즈니스 로직 (YouTube, WebSocket)
│   └── routers/             # API 엔드포인트
├── cli/                     # CLI 도구 (주요 인터페이스)
│   └── commands/            # script.py, video.py, youtube.py, status.py
├── .secrets/                # 인증 파일 (git에서 제외)
└── uploads/                 # 업로드 파일 저장소
```

## 🔧 핵심 개발 명령어

### Poetry 환경 설정
```bash
# Poetry 의존성 설치 (가상환경 자동 생성)
poetry install                # 기본 의존성
poetry install --with dev,test # 개발/테스트 의존성 포함

# Note: Poetry 2.0+ 에서는 `poetry shell` 대신 `poetry run` 사용 권장
# 직접 명령어 실행: poetry run [command]
```

### Backend 개발 (backend/ 디렉토리에서)
```bash
# 서버 실행
make run                # 개발 서버 (auto-reload, uvicorn)
make run-prod           # 프로덕션 서버

# 코드 품질
make format             # 코드 포매팅 (black + isort)
make format-check       # 포매팅 검사 (CI용)
make lint               # 린트 검사 (flake8 + mypy)
make security           # 보안 취약점 검사

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
- `google-tts-service.json` - Google TTS 서비스 계정 키

## 🚀 핵심 기능 및 상태 관리

### 업로드 워크플로우
```
script_ready → video_ready → uploaded → error
```

### 🎭 채널 브랜딩 자동화 (NEW!)
**모든 YouTube 업로드 시 자동으로 적용**:
- **설명 자동 확장**: 대본 설명 + 채널 기본 설명글 (구독 유도, 저작권 안내 등)
- **태그 스마트 결합**: 대본 태그 + 채널 기본 태그 (중복 제거, 별도 필드)
- **YouTube API 구조 준수**: Description(5,000바이트)와 Tags(500자) 완전 분리
- **원본 콘텐츠 우선**: 대본 설명/태그가 우선적으로 보존됨

**설정 위치**: `backend/app/core/constants.py` → `ChannelConstants`
```python
# 사용 예시 - 완전 분리된 구조
final_description = ChannelConstants.combine_description("대본 설명")  # 순수 텍스트만
final_tags = ChannelConstants.combine_tags("대본 태그")  # 태그만 별도 처리
```

**중요**: 해시태그는 `DESCRIPTION_FOOTER`에서 제거되어 `DEFAULT_TAGS`로 완전 분리 관리됩니다.

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

# 시스템
GET    /health                       # 헬스체크
GET    /docs                         # API 문서 (Swagger)
```

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
- `YouTubeConstants`: API 제한, 기본값
- `FileConstants`: 파일 크기, 확장자 제한
- `NetworkConstants`: 재시도, 타임아웃 설정
- `PathConstants`: 디렉토리 경로, 파일명
- `MessageConstants`: 사용자 메시지
- `ValidationConstants`: 날짜 형식, 정규식
- `ChannelConstants`: 채널 기본 설명글, 태그 (자동 추가)

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
make security
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

### 핵심 의존성
- **Python**: 3.13
- **FastAPI**: 0.116.0+ (WebSocket 지원)
- **SQLAlchemy**: 2.0+ (ORM)
- **Google APIs**: YouTube Data API v3
- **Click**: 8.2+ (CLI 프레임워크)
- **Rich**: 14.1+ (터미널 UI)

### 개발 도구 (최적화됨)
- **pytest**: 테스트 프레임워크
- **black**: 코드 포매팅 (88자 제한)
- **isort**: import 정렬
- **autoflake**: 미사용 import 자동 제거
- **flake8**: 린팅 (88자 제한, E203/W503 무시)
- **mypy**: 타입 체킹
- **pre-commit**: Git 훅

## 🎯 시스템 최적화 현황 (2025-01)

### ✅ 최근 완료된 최적화
- **의존성 정리**: 미사용 패키지 3개 제거 (pydub, playwright, colorama) - 15-20% 크기 감소
- **API 응답 표준화**: 모든 엔드포인트 SuccessResponse 형식 통일
- **코드 품질 개선**: flake8 88자 제한, autoflake 자동 import 정리 도구 추가
- **테스트 안정성**: 33개 핵심 테스트 100% 통과 상태 유지
- **개발 환경 표준화**: Poetry 2.0+ 지원, 자동화된 코드 품질 검증 체계

### 🔄 현재 시스템 상태
- **테스트 통과율**: 33/33 (100%) ✅
- **API 응답 일관성**: 완전 표준화 ✅  
- **코드 품질**: flake8/black/isort 규칙 준수 ✅
- **의존성 상태**: 최적화 완료 ✅
- **CLI 도구**: 정상 작동 ✅

---

**중요**: 이 시스템은 1인 개발자가 한국 시니어 대상 콘텐츠를 효율적으로 제작하고 업로드하기 위해 설계되었습니다. 모든 설정값은 constants.py에서 중앙 관리되며, CLI 도구가 주요 인터페이스입니다.