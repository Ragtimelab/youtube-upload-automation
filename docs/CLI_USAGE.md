# ⌨️ YouTube 자동화 CLI 사용 가이드

> **YouTube 업로드 자동화 시스템 - 실제 구현된 명령줄 인터페이스**

## 📋 목차
1. [CLI 개요](#-cli-개요)
2. [설치 및 실행](#-설치-및-실행)
3. [기본 명령어](#-기본-명령어)
4. [스크립트 관리](#-스크립트-관리)
5. [비디오 업로드](#-비디오-업로드)
6. [YouTube 업로드](#-youtube-업로드)
7. [시스템 모니터링](#-시스템-모니터링)
8. [실제 워크플로우](#-실제-워크플로우)
9. [빠른 명령어](#-빠른-명령어)
10. [문제 해결](#-문제-해결)

---

## 🎯 CLI 개요

YouTube 자동화 CLI는 Streamlit 대시보드와 동일한 기능을 명령줄에서 제공하며, 배치 처리와 자동화에 특화되어 있습니다.

### 🎯 주요 특징
- **🚀 직접 실행**: GUI 없이 바로 명령어 실행
- **📦 배치 처리**: 여러 파일 동시 처리
- **🎨 Rich UI**: 컬러풀한 터미널 출력
- **📊 실시간 모니터링**: 상태 추적 및 진행률 표시
- **🔄 자동화 지원**: 스크립트 작성 가능

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
# 메인 CLI 실행
python cli/main.py

# 도움말 확인
python cli/main.py --help

# 버전 정보
python cli/main.py --version
```

---

## 🎮 기본 명령어

### 환영 메시지
```bash
# CLI 시작 화면 보기
python cli/main.py
```

### 빠른 상태 확인
```bash
# 시스템 전체 상태
python cli/main.py health

# 사용 예시 보기
python cli/main.py examples
```

### 스크립트 목록 (단축 명령어)
```bash
# 스크립트 목록 (ls 별칭)
python cli/main.py ls

# 상태별 필터링
python cli/main.py ls --status video_ready

# 개수 제한
python cli/main.py ls --limit 5
```

---

## 📝 스크립트 관리

### 스크립트 업로드
```bash
# 단일 파일 업로드
python cli/main.py script upload my_script.txt

# 디렉토리의 모든 스크립트 배치 업로드
python cli/main.py batch-upload-scripts ./scripts/
```

### 스크립트 목록 조회
```bash
# 전체 스크립트 목록
python cli/main.py script list

# 상태별 필터링
python cli/main.py script list --status script_ready
python cli/main.py script list --status video_ready
python cli/main.py script list --status uploaded
python cli/main.py script list --status error

# 개수 제한 및 페이지네이션
python cli/main.py script list --limit 5
python cli/main.py script list --skip 10 --limit 5
```

### 스크립트 상세 조회
```bash
# 특정 스크립트 상세 정보
python cli/main.py script show 1
```

### 스크립트 편집
```bash
# 제목 수정
python cli/main.py script edit 1 --title "새로운 제목"

# 설명 수정
python cli/main.py script edit 1 --description "새로운 설명"

# 태그 수정
python cli/main.py script edit 1 --tags "태그1, 태그2, 태그3"

# 썸네일 텍스트 수정
python cli/main.py script edit 1 --thumbnail-text "썸네일 텍스트"

# ImageFX 프롬프트 수정
python cli/main.py script edit 1 --imagefx-prompt "AI 프롬프트"

# 여러 필드 동시 수정
python cli/main.py script edit 1 \
  --title "새 제목" \
  --description "새 설명" \
  --tags "새태그1, 새태그2"
```

### 스크립트 삭제
```bash
# 스크립트 삭제 (확인 메시지 포함)
python cli/main.py script delete 1
```

### 스크립트 통계
```bash
# 전체 통계 조회
python cli/main.py script stats
```

---

## 🎥 비디오 업로드

### 비디오 파일 업로드
```bash
# 기본 업로드 (스크립트 ID 1에 비디오 연결)
python cli/main.py video upload 1 my_video.mp4
```

### 업로드 가능한 스크립트 확인
```bash
# script_ready 상태인 스크립트 목록
python cli/main.py video ready
```

### 비디오 파일 삭제
```bash
# 비디오 파일만 삭제 (스크립트는 유지)
python cli/main.py video delete 1
```

### 비디오 상태 확인
```bash
# 비디오 업로드 상태 확인
python cli/main.py video status 1

# 업로드 진행률 실시간 모니터링
python cli/main.py video progress 1
```

---

## 📺 YouTube 업로드

### 단일 업로드
```bash
# 기본 업로드 (private)
python cli/main.py youtube upload 1

# 공개 설정 지정
python cli/main.py youtube upload 1 --privacy private
python cli/main.py youtube upload 1 --privacy unlisted  
python cli/main.py youtube upload 1 --privacy public

# 카테고리 지정
python cli/main.py youtube upload 1 --category 22  # People & Blogs
python cli/main.py youtube upload 1 --category 24  # Entertainment
python cli/main.py youtube upload 1 --category 27  # Education
```

### 배치 업로드
```bash
# 여러 스크립트 배치 업로드
python cli/main.py youtube batch 1 2 3 4 5

# 공개 설정 지정하여 배치 업로드
python cli/main.py youtube batch 1 2 3 --privacy unlisted
```

### YouTube 상태 확인
```bash
# YouTube API 연결 상태 확인
python cli/main.py youtube health

# 업로드 가능한 스크립트 목록
python cli/main.py youtube ready

# 업로드 완료된 비디오 목록
python cli/main.py youtube uploaded
```

---

## 📊 시스템 모니터링

### 전체 시스템 상태
```bash
# 시스템 헬스 체크
python cli/main.py status system
```

### 파이프라인 상태
```bash
# 전체 파이프라인 분석
python cli/main.py status pipeline

# 또는 단축 명령어
python cli/main.py pipeline
```

### 개별 스크립트 상태
```bash
# 특정 스크립트 상태 추적
python cli/main.py status script 1
```

### 실시간 모니터링
```bash
# 실시간 상태 모니터링 (5초 간격)
python cli/main.py status monitor

# 사용자 정의 간격 (10초)
python cli/main.py status monitor --interval 10
```

---

## 🔄 실제 워크플로우

### 기본 워크플로우 (1개 비디오)
```bash
# 1단계: 스크립트 업로드
python cli/main.py script upload my_script.txt
# → 출력: 스크립트 ID: 1

# 2단계: 비디오 업로드
python cli/main.py video upload 1 my_video.mp4
# → 상태: script_ready → video_ready

# 3단계: YouTube 업로드
python cli/main.py youtube upload 1 --privacy private
# → 상태: video_ready → uploaded

# 4단계: 결과 확인
python cli/main.py script show 1
# → YouTube URL 확인
```

### 배치 워크플로우 (여러 비디오)
```bash
# 1단계: 모든 스크립트 업로드
python cli/main.py batch-upload-scripts ./scripts/

# 2단계: 비디오들 개별 업로드
python cli/main.py video upload 1 video1.mp4
python cli/main.py video upload 2 video2.mp4
python cli/main.py video upload 3 video3.mp4

# 3단계: 모든 비디오 YouTube 배치 업로드
python cli/main.py youtube batch 1 2 3 --privacy unlisted

# 4단계: 전체 상태 확인
python cli/main.py status pipeline
```

---

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
python cli/main.py ls
python cli/main.py ls --status video_ready

# 빠른 스크립트 업로드 (quick-upload 별칭)
python cli/main.py quick-upload my_script.txt

# 빠른 헬스 체크
python cli/main.py health
```

### 체인 명령어
```bash
# 스크립트 업로드 → 상태 확인
python cli/main.py script upload script.txt && python cli/main.py ls

# 비디오 업로드 → YouTube 업로드
python cli/main.py video upload 1 video.mp4 && \
python cli/main.py youtube upload 1 --privacy private
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
python cli/main.py script upload ./scripts/my_script.txt  # 상대경로 사용
```

#### 3. YouTube API 인증 실패
```bash
❌ YouTube API 인증에 실패했습니다

# 해결책:
ls backend/secrets/credentials.json  # 인증 파일 확인
rm backend/secrets/token.pickle      # 토큰 재생성 (필요시)
python cli/main.py youtube health    # 재인증 확인
```

#### 4. 스크립트 상태 오류
```bash
❌ 스크립트 상태가 'script_ready'가 아닙니다

# 해결책:
python cli/main.py script show 1          # 현재 상태 확인
python cli/main.py status script 1        # 상세 상태 분석
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
python cli/main.py youtube health

# 전체 시스템 상태
python cli/main.py status system
```

#### 상세 정보 확인
```bash
# 스크립트 상세 정보
python cli/main.py script show 1

# 파이프라인 전체 상태
python cli/main.py status pipeline

# 업로드 상태 확인
python cli/main.py video status 1
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
CREDENTIALS_PATH=backend/secrets/credentials.json
TOKEN_PATH=backend/secrets/token.pickle
DEFAULT_PRIVACY_STATUS=private
DEFAULT_CATEGORY_ID=22
```

---

## 📞 지원 및 문의

- **개발자 가이드**: `CLAUDE.md` 참조
- **API 문서**: `docs/API.md` 참조
- **FAQ**: `docs/FAQ.md` 참조
- **사용자 가이드**: `docs/USER_GUIDE.md` (Streamlit 대시보드)

---

**⚡ 실제 구현된 CLI 기능으로 효율적인 YouTube 자동화를 경험하세요!**