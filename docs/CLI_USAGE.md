# ⌨️ YouTube 자동화 CLI 사용 가이드

> **YouTube 업로드 자동화 시스템 - 실제 구현된 명령줄 인터페이스**

## 📋 목차

1. [CLI 개요](#-cli-개요)
2. [설치 및 실행](#-설치-및-실행)
3. [기본 명령어](#-기본-명령어)
4. [인터랙티브 모드](#-인터랙티브-모드-가이드)
5. [스크립트 관리](#-스크립트-관리)
6. [비디오 업로드](#-비디오-업로드)
7. [YouTube 업로드](#-youtube-업로드)
8. [시스템 모니터링](#-시스템-모니터링)
9. [실제 워크플로우](#-실제-워크플로우)
10. [빠른 명령어](#-빠른-명령어)
11. [개발 도구](#-개발-도구)
12. [문제 해결](#-문제-해결)

---

## 🎯 CLI 개요

YouTube 자동화 CLI는 Gradio 웹 인터페이스와 동일한 기능을 명령줄에서 제공하며, 배치 처리와 자동화에 특화되어 있습니다.

### 🎯 주요 특징

- **🚀 직접 실행**: GUI 없이 바로 명령어 실행
- **📦 배치 처리**: 여러 파일 동시 처리
- **🎨 Rich UI**: 컬러풀한 터미널 출력 및 진행률 표시
- **🎮 인터랙티브 모드**: 메뉴 기반 사용자 친화적 인터페이스
- **📊 실시간 모니터링**: 라이브 상태 추적 및 대시보드
- **🌐 Gradio 완전 호환**: 웹 인터페이스와 동일한 백엔드 API 사용
- **🔄 자동화 지원**: 스크립트 작성 및 배치 실행 가능

---

## 🛠️ 설치 및 실행

### 전제 조건

```bash
# 1. 백엔드 서버 실행 (필수)
cd backend
make run

# 2. Poetry 환경 활성화
poetry shell
```

### CLI 실행 방법

```bash
# 기본 실행 (권장 - Poetry 자동 감지)
./youtube-cli

# 개발자 실행
python cli/main.py

# 도움말 확인
./youtube-cli --help

# 버전 정보
./youtube-cli --version
```

---

## 🎮 기본 명령어

### 환영 메시지

```bash
# CLI 시작 화면 보기
./youtube-cli
```

### 빠른 상태 확인

```bash
# 시스템 전체 상태
./youtube-cli health

# 사용 예시 보기
./youtube-cli examples
```

### 🎮 인터랙티브 모드 (Phase 3 신기능)

```bash
# 메뉴 기반 인터랙티브 모드
./youtube-cli interactive

# 실시간 시스템 모니터링
./youtube-cli monitor

# 인터랙티브 대시보드
./youtube-cli dashboard
```

**인터랙티브 모드 특징:**
- 🎯 메뉴 방식 네비게이션
- ⚡ 실시간 진행률 표시
- 🎨 Rich 기반 아름다운 UI
- 📊 라이브 상태 업데이트

### 스크립트 목록 (단축 명령어)

```bash
# 스크립트 목록 (ls 별칭)
./youtube-cli ls

# 상태별 필터링
./youtube-cli ls --status video_ready

# 개수 제한
./youtube-cli ls --limit 5
```

---

## 🎮 인터랙티브 모드 가이드

### 메뉴 기반 인터랙티브 모드

```bash
./youtube-cli interactive
```

**인터랙티브 모드 기능:**

1. **📋 메인 메뉴**
   - 스크립트 관리
   - 비디오 업로드
   - YouTube 업로드
   - 시스템 상태 확인

2. **⚡ 실시간 진행률**
   - Rich 기반 프로그레스 바
   - 업로드 속도 표시
   - 남은 시간 예측
   - 성공/실패 통계

3. **🎨 향상된 UI**
   - 컬러풀한 출력
   - 테이블 형태 데이터 표시
   - 스피너 애니메이션
   - 상태별 색상 코딩

### 실시간 모니터링

```bash
./youtube-cli monitor
```

**모니터링 화면:**
- 🔄 실시간 시스템 상태
- 📊 업로드 큐 현황
- 🎯 성공률 통계
- ⚠️ 에러 알림

### 인터랙티브 대시보드

```bash
./youtube-cli dashboard
```

**대시보드 패널:**
- 📈 시스템 성능 지표
- 📋 최근 작업 히스토리
- 🎥 진행 중인 업로드
- 📊 일일/주간 통계

---

## 📝 스크립트 관리

### 스크립트 업로드

```bash
# 단일 파일 업로드
./youtube-cli script upload my_script.txt

# 디렉토리의 모든 스크립트 배치 업로드
./youtube-cli batch-upload-scripts ./scripts/
```

### 스크립트 목록 조회

```bash
# 전체 스크립트 목록
./youtube-cli script list

# 상태별 필터링
./youtube-cli script list --status script_ready
./youtube-cli script list --status video_ready
./youtube-cli script list --status uploaded
./youtube-cli script list --status error

# 개수 제한 및 페이지네이션
./youtube-cli script list --limit 5
./youtube-cli script list --skip 10 --limit 5
```

### 스크립트 상세 조회

```bash
# 특정 스크립트 상세 정보
./youtube-cli script show 1
```

### 스크립트 편집

```bash
# 제목 수정
./youtube-cli script edit 1 --title "새로운 제목"

# 설명 수정
./youtube-cli script edit 1 --description "새로운 설명"

# 태그 수정
./youtube-cli script edit 1 --tags "태그1, 태그2, 태그3"

# 썸네일 텍스트 수정
./youtube-cli script edit 1 --thumbnail-text "썸네일 텍스트"

# ImageFX 프롬프트 수정
./youtube-cli script edit 1 --imagefx-prompt "AI 프롬프트"

# 여러 필드 동시 수정
./youtube-cli script edit 1 \
  --title "새 제목" \
  --description "새 설명" \
  --tags "새태그1, 새태그2"
```

### 스크립트 삭제

```bash
# 스크립트 삭제 (확인 메시지 포함)
./youtube-cli script delete 1
```

### 스크립트 통계

```bash
# 전체 통계 조회
./youtube-cli script stats
```

---

## 🎥 비디오 업로드

### 비디오 파일 업로드

```bash
# 기본 업로드 (스크립트 ID 1에 비디오 연결)
./youtube-cli video upload 1 my_video.mp4
```

### 업로드 가능한 스크립트 확인

```bash
# script_ready 상태인 스크립트 목록
./youtube-cli video ready
```

### 비디오 파일 삭제

```bash
# 비디오 파일만 삭제 (스크립트는 유지)
./youtube-cli video delete 1
```

### 비디오 상태 확인

```bash
# 비디오 업로드 상태 확인
./youtube-cli video status 1

# 업로드 진행률 실시간 모니터링
./youtube-cli video progress 1
```

---

## 📺 YouTube 업로드

### 단일 업로드

```bash
# 기본 업로드 (private)
./youtube-cli youtube upload 1

# 공개 설정 지정
./youtube-cli youtube upload 1 --privacy private
./youtube-cli youtube upload 1 --privacy unlisted  
./youtube-cli youtube upload 1 --privacy public

# 카테고리 지정
./youtube-cli youtube upload 1 --category 22  # People & Blogs
./youtube-cli youtube upload 1 --category 24  # Entertainment
./youtube-cli youtube upload 1 --category 27  # Education
```

### 배치 업로드

```bash
# 여러 스크립트 배치 업로드
./youtube-cli youtube batch 1 2 3 4 5

# 공개 설정 지정하여 배치 업로드
./youtube-cli youtube batch 1 2 3 --privacy unlisted
```

### YouTube 상태 확인

```bash
# YouTube API 연결 상태 확인
./youtube-cli youtube health

# 업로드 가능한 스크립트 목록
./youtube-cli youtube ready

# 업로드 완료된 비디오 목록
./youtube-cli youtube uploaded
```

---

## 📊 시스템 모니터링

### 전체 시스템 상태

```bash
# 시스템 헬스 체크
./youtube-cli status system
```

### 파이프라인 상태

```bash
# 전체 파이프라인 분석
./youtube-cli status pipeline

# 또는 단축 명령어
./youtube-cli pipeline
```

### 개별 스크립트 상태

```bash
# 특정 스크립트 상태 추적
./youtube-cli status script 1
```

### 실시간 모니터링

```bash
# 실시간 상태 모니터링 (5초 간격)
./youtube-cli status monitor

# 사용자 정의 간격 (10초)
./youtube-cli status monitor --interval 10
```

---

## 🔄 실제 워크플로우

### 🗓️ 날짜 기반 워크플로우 (권장!)

```bash
# 1단계: 파일명을 날짜 형식으로 준비
scripts/
├── 20250817_01_story.txt
├── 20250817_02_story.txt
└── 20250817_03_story.txt

videos/
├── 20250817_01_story.mp4
├── 20250817_02_story.mp4
└── 20250817_03_story.mp4

# 2단계: 완전 자동화 실행 (대본→영상→YouTube)
./youtube-cli date-upload scripts/ videos/
# → 확인 후 Enter: 모든 단계 자동 처리

# 3단계: 결과 확인
./youtube-cli status pipeline
```

### 🔍 시뮬레이션 워크플로우

```bash
# 1단계: 매핑 시뮬레이션
./youtube-cli video auto-mapping scripts/ videos/ --dry-run
# → 어떤 파일들이 매칭되는지 확인

# 2단계: 완전 자동화 시뮬레이션  
./youtube-cli date-upload scripts/ videos/ --dry-run
# → 전체 과정 시뮬레이션

# 3단계: 확인 후 실제 실행
./youtube-cli date-upload scripts/ videos/
```

### 기본 워크플로우 (1개 비디오)

```bash
# 1단계: 스크립트 업로드
./youtube-cli script upload my_script.txt
# → 출력: 스크립트 ID: 1

# 2단계: 비디오 업로드
./youtube-cli video upload 1 my_video.mp4
# → 상태: script_ready → video_ready

# 3단계: YouTube 업로드
./youtube-cli youtube upload 1 --privacy private
# → 상태: video_ready → uploaded

# 4단계: 결과 확인
./youtube-cli script show 1
# → YouTube URL 확인
```

### 배치 워크플로우 (여러 비디오)

```bash
# 1단계: 모든 스크립트 업로드
./youtube-cli batch-upload-scripts ./scripts/

# 2단계: 비디오들 개별 업로드
./youtube-cli video upload 1 video1.mp4
./youtube-cli video upload 2 video2.mp4
./youtube-cli video upload 3 video3.mp4

# 3단계: 모든 비디오 YouTube 배치 업로드
./youtube-cli youtube batch 1 2 3 --privacy unlisted

# 4단계: 전체 상태 확인
./youtube-cli status pipeline
```

---

## 🗓️ 날짜 기반 자동 매핑 (신기능!)

### 파일명 규칙

```bash
# 대본과 영상 파일명을 날짜_순번_이름 형식으로 통일
20250817_01_story.txt ↔ 20250817_01_story.mp4
20250817_02_story.txt ↔ 20250817_02_story.mp4
20250817_03_story.txt ↔ 20250817_03_story.mp4
```

### 자동 매핑 명령어

```bash
# 오늘 날짜 파일들 자동 매핑
./youtube-cli video auto-mapping scripts/ videos/

# 특정 날짜 파일들 매핑
./youtube-cli video auto-mapping scripts/ videos/ --date 20250817

# 매핑 시뮬레이션 (실제 업로드 없이 확인)
./youtube-cli video auto-mapping scripts/ videos/ --dry-run
```

### 완전 자동화 명령어

```bash
# 대본→영상→YouTube 한 번에 처리
./youtube-cli date-upload scripts/ videos/

# 특정 날짜 + 공개 설정
./youtube-cli date-upload scripts/ videos/ --date 20250817 --privacy unlisted

# 시뮬레이션으로 먼저 확인
./youtube-cli date-upload scripts/ videos/ --dry-run
```

## 🚀 빠른 명령어

### 프로젝트 루트의 빠른 스크립트

```bash
# 빠른 스크립트 업로드
./quick-script my_script.txt

# 빠른 전체 워크플로우 (비디오 → YouTube)
./quick-upload 1 my_video.mp4 private
```

### 단축 명령어

```bash
# 스크립트 목록 조회 (ls 별칭)
./youtube-cli ls
./youtube-cli ls --status video_ready

# 빠른 스크립트 업로드 (quick-upload 별칭)
./youtube-cli quick-upload my_script.txt

# 빠른 헬스 체크
./youtube-cli health
```

### 체인 명령어

```bash
# 스크립트 업로드 → 상태 확인
./youtube-cli script upload script.txt && ./youtube-cli ls

# 비디오 업로드 → YouTube 업로드
./youtube-cli video upload 1 video.mp4 && \
./youtube-cli youtube upload 1 --privacy private
```

---

## 🔧 문제 해결

### 일반적인 오류

#### 1. API 서버 연결 실패

```bash
❌ API 서버에 연결할 수 없습니다

# 해결책:
cd backend
make run
# 또는
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. 파일을 찾을 수 없음

```bash
❌ 파일이 존재하지 않습니다: my_script.txt

# 해결책:
ls -la my_script.txt  # 파일 존재 확인
pwd                   # 현재 디렉토리 확인
./youtube-cli script upload ./scripts/my_script.txt  # 상대경로 사용
```

#### 3. YouTube API 인증 실패

```bash
❌ YouTube API 인증에 실패했습니다

# 해결책:
ls .secrets/credentials.json  # 인증 파일 확인
rm .secrets/token.pickle      # 토큰 재생성 (필요시)
./youtube-cli youtube health    # 재인증 확인
```

#### 4. 스크립트 상태 오류

```bash
❌ 스크립트 상태가 'script_ready'가 아닙니다

# 해결책:
./youtube-cli script show 1          # 현재 상태 확인
./youtube-cli status script 1        # 상세 상태 분석
# 워크플로우 순서 확인: script → video → youtube
```

#### 5. 파일 크기 초과

```bash
❌ 파일 크기가 8GB를 초과합니다

# 해결책:
ls -lh my_video.mp4                  # 파일 크기 확인
# 비디오 압축 필요 (외부 도구 사용)
ffmpeg -i input.mp4 -crf 23 output.mp4
```

### 개발 도구

#### 코드 품질 도구

```bash
# Backend 디렉토리에서 실행
cd backend/

# 코드 포매팅 (black + isort + autoflake)
make format           # 전체 포매팅 파이프라인
make format-check     # CI용 포매팅 검사

# 린트 검사
make lint            # flake8 + mypy

# 개별 도구 실행 (프로젝트 루트에서)
poetry run black backend/app/                     # 코드 포매팅
poetry run isort backend/app/                     # import 정렬
poetry run autoflake --remove-all-unused-imports --recursive backend/app/  # 미사용 import 제거
```

### 디버깅 도구

#### 로그 확인

```bash
# 백엔드 로그 실시간 확인
tail -f backend/logs/app-$(date +%Y-%m-%d).log

# 오류 로그만 확인
tail -f backend/logs/error-$(date +%Y-%m-%d).log | grep ERROR
```

#### 네트워크 연결 테스트

```bash
# API 서버 연결 테스트
curl http://localhost:8000/health

# YouTube API 연결 테스트
./youtube-cli youtube health

# 전체 시스템 상태
./youtube-cli status system
```

#### 상세 정보 확인

```bash
# 스크립트 상세 정보
./youtube-cli script show 1

# 파이프라인 전체 상태
./youtube-cli status pipeline

# 업로드 상태 확인
./youtube-cli video status 1
```

---

## 📚 추가 정보

### 스크립트 파일 형식

```text
=== 제목 ===
여기에 YouTube 비디오 제목 (최대 100자)

=== 메타데이터 ===
설명: 비디오 설명 (최대 5,000바이트)
태그: 태그1, 태그2, 태그3 (최대 500자)

=== 썸네일 정보 ===
텍스트: 썸네일에 표시할 텍스트
ImageFX 프롬프트: AI 이미지 생성용 프롬프트

=== 대본 ===
여기에 실제 대본 내용을 작성합니다.
여러 줄로 작성 가능합니다.
```

### 지원하는 비디오 형식

- **권장**: MP4 (H.264 + AAC)
- **지원**: AVI, MOV, MKV, WEBM
- **최대 크기**: 8GB
- **최대 길이**: 12시간

### YouTube API 제한사항

- **일일 할당량**: 10,000 units
- **업로드당 소모**: 1,600 units
- **미인증 프로젝트**: private 모드만 업로드 가능
- **제목 제한**: 최대 100자
- **설명 제한**: 최대 5,000바이트
- **태그 제한**: 최대 500자

### 환경 변수

```bash
# .env 파일
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CREDENTIALS_PATH=.secrets/credentials.json
TOKEN_PATH=.secrets/token.pickle
DEFAULT_PRIVACY_STATUS=private
DEFAULT_CATEGORY_ID=22
```

---

## 🌐 Gradio 웹 인터페이스 호환성

### CLI ↔ Gradio 데이터 호환성

CLI와 Gradio 웹 인터페이스는 **완전히 동일한 백엔드 API**를 사용하므로 데이터가 실시간으로 동기화됩니다:

```bash
# CLI로 스크립트 업로드
./youtube-cli script upload my_script.md

# → Gradio 웹에서 즉시 확인 가능 (새로고침)

# Gradio에서 비디오 업로드
# → CLI에서 즉시 상태 확인 가능
./youtube-cli script list --status video_ready
```

### 동시 사용 시나리오

#### 1. **개발자 워크플로우**
```bash
# CLI로 배치 처리
./youtube-cli batch-upload-scripts ./scripts/

# Gradio 대시보드에서 진행률 모니터링
# http://localhost:7860 → 📊 대시보드 탭
```

#### 2. **팀 협업**
- 개발자: CLI로 자동화 스크립트 실행
- 콘텐츠 팀: Gradio 웹에서 개별 업로드 및 모니터링

#### 3. **하이브리드 사용**
```bash
# CLI로 스크립트 대량 업로드
./youtube-cli batch-upload-scripts ./weekly-content/

# Gradio에서 세부 설정 조정 및 YouTube 업로드
# (공개 설정, 카테고리 등을 GUI에서 편리하게)
```

### 기능별 비교

| 기능 | CLI | Gradio 웹 인터페이스 | 권장 사용 시점 |
|------|-----|-------------------|----------------|
| 스크립트 업로드 | `script upload` | 드래그 앤 드롭 | CLI: 배치, Gradio: 개별 |
| 비디오 업로드 | `video upload` | 파일 선택 | CLI: 자동화, Gradio: 수동 |
| YouTube 업로드 | `youtube upload` | 설정 후 업로드 | CLI: 스크립트, Gradio: 세부 조정 |
| 상태 모니터링 | `status`/`monitor` | 대시보드 탭 | CLI: 로그, Gradio: 시각적 |
| 배치 처리 | `batch-*` 명령어 | 배치 업로드 탭 | CLI: 스크립트화, Gradio: GUI |

### 웹 인터페이스 실행

```bash
# 1. 백엔드 서버 실행 (필수)
cd backend && make run

# 2. Gradio 웹 인터페이스 실행
poetry run python gradio_app.py

# 3. 브라우저 접속
# http://localhost:7860

# 4. CLI와 병행 사용 가능
./youtube-cli status  # CLI에서 상태 확인
```

---

## 📞 지원 및 문의

- **개발자 가이드**: `CLAUDE.md` 참조
- **API 문서**: `docs/API.md` 참조
- **FAQ**: `docs/FAQ.md` 참조
- **사용자 가이드**: `docs/USER_GUIDE.md` (Gradio 웹 인터페이스)

---

**⚡ 실제 구현된 CLI 기능으로 효율적인 YouTube 자동화를 경험하세요!**

---

**CLI 사용 가이드**  
**마지막 업데이트**: 2025-08-22  
**Gradio 호환성**: 완전 지원 ✅
