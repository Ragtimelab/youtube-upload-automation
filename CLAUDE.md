# CLAUDE.md

Claude Code 작업 시 참고할 프로젝트 가이드입니다.

## 🎯 프로젝트 개요

**YouTube Upload Automation** - 한국 시니어 대상 콘텐츠를 제작하는 1인 개발자를 위한 YouTube 업로드 자동화 시스템

## 🏗️ 시스템 구조

```
youtube-upload-automation/
├── backend/app/              # FastAPI 백엔드 서버
├── cli/                     # CLI 도구 (주요 인터페이스)
└── CLAUDE.md               # 이 파일
```

## 🔧 핵심 개발 명령어

### Backend (Poetry 환경)
```bash
# 가상환경 및 의존성
poetry shell
poetry install

# 서버 실행 (backend/ 디렉토리에서)
make run                # 개발 서버 (auto-reload)
make format             # 코드 포매팅 (black + isort)
make lint               # 린트 검사 (flake8 + mypy)
make test               # 테스트 실행

# 데이터베이스
make migrate            # 마이그레이션 적용
make migrate-auto       # 자동 마이그레이션 생성
```

### CLI 사용법
```bash
# 기본 실행
./youtube-cli --help

# 주요 워크플로우
./youtube-cli date-upload scripts/ videos/              # 날짜 기반 완전 자동화
./youtube-cli interactive                               # 인터랙티브 모드
./youtube-cli health                                    # 시스템 상태 확인

# 개별 작업
./youtube-cli script upload my_script.md               # 스크립트 업로드
./youtube-cli video upload 1 video.mp4                 # 비디오 업로드
./youtube-cli youtube upload 1                         # YouTube 업로드
```

## 📂 파일 명명 규칙

```bash
# 날짜 기반 자동 매핑용 파일명
YYYYMMDD_NN_story.md     # 스크립트 파일 (마크다운 전용)
YYYYMMDD_NN_story.mp4    # 비디오 파일

# 예시
20250819_01_story.md
20250819_01_story.mp4
```

## 📝 스크립트 파일 형식

마크다운 파일 내부 구조:
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

## 🚀 핵심 기능

### 1. 날짜 기반 자동화
- 파일명 패턴에 따른 스크립트-비디오 자동 매핑
- 전체 워크플로우 자동 실행 (스크립트 → 비디오 → YouTube)

### 2. 상태 관리
```
script_ready → video_ready → uploaded → error
```

### 3. YouTube 설정
- **기본 카테고리**: 24 (Entertainment)
- **기본 공개 설정**: private
- **지원 형식**: .md (스크립트), .mp4/.avi/.mov (비디오)

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

## 🔧 개발 패턴

### Architecture
- **Backend**: Clean Architecture (Repository → Service → Router)
- **CLI**: Command Pattern with Rich UI
- **Configuration**: Pydantic Settings + Constants 중앙화

### 파일 구조
- **Constants**: `backend/app/core/constants.py` - 모든 하드코딩 값 중앙화
- **Configuration**: `backend/app/config.py` - 환경 설정
- **CLI Commands**: `cli/commands/` - 각 기능별 명령어 모듈

## 🧪 테스트

```bash
# 추천 테스트 실행 (backend/)
poetry run pytest tests/unit/ tests/test_integration_final.py tests/test_json_serialization.py -v

# 전체 테스트
make test
```

## 🚨 트러블슈팅

### 백엔드 문제
- **서버 연결**: `curl http://localhost:8000/health`
- **로그 확인**: `tail -f logs/app-$(date +%Y-%m-%d).log`

### CLI 문제
- **파일명 규칙**: YYYYMMDD_NN_story.md/mp4 패턴 확인
- **권한**: `chmod +x youtube-cli` 실행
- **가상환경**: `poetry shell` 확인

## 💡 주요 설계 원칙

1. **마크다운 전용**: 스크립트 파일은 .md만 사용
2. **상수 중앙화**: 하드코딩 값 없이 constants.py 사용  
3. **환경 설정**: 환경변수 기반 유연한 설정
4. **자동화 우선**: 수동 작업 최소화
5. **한국 시니어 타겟**: 단순하고 직관적인 워크플로우

---

**중요**: 이 시스템은 1인 개발자가 한국 시니어 대상 콘텐츠를 효율적으로 제작하고 업로드하기 위해 설계되었습니다.