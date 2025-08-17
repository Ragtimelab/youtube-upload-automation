# 🎬 YouTube 자동화 CLI 사용 가이드

## 📖 개요

YouTube 업로드 자동화 시스템의 완전한 CLI 인터페이스입니다. React 프론트엔드를 대체하여 개발자 친화적이고 효율적인 워크플로우를 제공합니다.

## 🚀 빠른 시작

### 1. 프로젝트 실행

```bash
# 백엔드 서버 시작
make run

# 또는 직접 실행
poetry run uvicorn backend.app.main:app --reload
```

### 2. CLI 도구 사용

```bash
# CLI 도구 실행
./youtube-cli

# 도움말 확인
./youtube-cli --help
```

## 📋 주요 명령어

### 스크립트 관리

```bash
# 대본 파일 업로드
./youtube-cli script upload sample_script.txt

# 대본 목록 조회 (상태별 아이콘 표시)
./youtube-cli script list

# 특정 대본 상세 조회
./youtube-cli script show 1

# 대본 메타데이터 편집 ✨ 새 기능!
./youtube-cli script edit 1 --title "새 제목" --description "새 설명"
./youtube-cli script edit 1 --tags "태그1, 태그2, 태그3"

# 대본 삭제
./youtube-cli script delete 1

# 통계 조회
./youtube-cli script stats
```

### 비디오 관리

```bash
# 비디오 파일 업로드
./youtube-cli video upload 1 video.mp4

# 업로드 가능한 스크립트 목록
./youtube-cli video ready

# 비디오 파일 삭제
./youtube-cli video delete 1
```

### YouTube 업로드

```bash
# 즉시 업로드 (private)
./youtube-cli youtube upload 1

# 공개 설정 지정
./youtube-cli youtube upload 1 --privacy public

# 예약 발행
./youtube-cli youtube upload 1 --schedule "2025-08-17T09:00:00.000Z"

# 배치 업로드 (모든 준비된 스크립트)
./youtube-cli youtube batch

# YouTube API 연결 상태 확인
./youtube-cli youtube health

# 업로드 완료된 비디오 목록
./youtube-cli youtube uploaded
```

### 시스템 상태

```bash
# 전체 시스템 상태 확인
./youtube-cli status health

# 파이프라인 상태 분석
./youtube-cli status pipeline

# 실시간 모니터링
./youtube-cli status monitor --interval 30
```

## 📊 모니터링 대시보드

### Streamlit 대시보드 실행

```bash
# 대시보드 시작
./dashboard

# 브라우저에서 접속
open http://localhost:8501
```

### 대시보드 기능
- **실시간 통계**: 스크립트, 업로드, 오류 통계
- **상태별 분포**: 파이차트 및 막대차트 시각화
- **스크립트 목록**: 상태별 필터링 및 상세 정보
- **업로드 상태**: 개별 스크립트 업로드 진행 상황
- **자동 새로고침**: 30초 간격 실시간 업데이트

## 🔄 완전한 워크플로우

### 1. 대본 → 비디오 → YouTube 업로드

```bash
# 1단계: 대본 업로드
./youtube-cli script upload my_script.txt

# 2단계: 비디오 업로드 (스크립트 ID = 1)
./youtube-cli video upload 1 my_video.mp4

# 3단계: YouTube 업로드
./youtube-cli youtube upload 1 --privacy private
```

### 🚀 빠른 워크플로우 (새 기능!)

```bash
# 빠른 스크립트 업로드
./quick-script my_script.txt

# 빠른 전체 업로드 워크플로우 (비디오 + YouTube)
./quick-upload 1 my_video.mp4 private

# 빠른 편집 후 업로드
./youtube-cli script edit 1 --title "수정된 제목"
./quick-upload 1 my_video.mp4
```

### 2. 배치 처리

```bash
# 모든 준비된 스크립트를 YouTube에 업로드
./youtube-cli youtube batch --privacy unlisted
```

### 3. 예약 발행

```bash
# 내일 오전 9시에 발행 예약
./youtube-cli youtube upload 1 --schedule "2025-08-17T09:00:00.000Z"
```

## 📝 대본 파일 형식

```text
=== 대본 ===
여기에 실제 대본 내용을 작성합니다.

=== 메타데이터 ===
제목: 비디오 제목
설명: 비디오 설명
태그: 태그1, 태그2, 태그3

=== 썸네일 제작 ===
텍스트: 썸네일에 표시할 텍스트
ImageFX 프롬프트: AI 이미지 생성을 위한 프롬프트
```

## 🎥 지원 비디오 형식

- **권장 형식**: MP4 (H.264 + AAC-LC 48kHz)
- **해상도**: 1920×1080 (FHD)
- **비트레이트**: 8Mbps@30fps / 12Mbps@60fps
- **최대 크기**: 8GB
- **최대 길이**: 12시간

## ⚙️ 설정 및 환경변수

### 필수 설정

```bash
# .env 파일
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CREDENTIALS_PATH=backend/secrets/credentials.json
TOKEN_PATH=backend/secrets/token.pickle
DEFAULT_PRIVACY_STATUS=private
```

### YouTube API 설정

1. **credentials.json**: Google Cloud Console에서 다운로드
2. **OAuth 인증**: 첫 실행시 브라우저에서 인증
3. **API 할당량**: 일일 10,000 units (업로드당 1,600 units)

## 🚨 오류 해결

### 일반적인 오류

```bash
# API 서버 연결 실패
❌ API 서버에 연결할 수 없습니다
💡 백엔드 서버가 실행 중인지 확인: make run

# 파일을 찾을 수 없음
❌ 파일이 존재하지 않습니다
💡 파일 경로와 권한을 확인하세요

# YouTube API 인증 실패
❌ YouTube API 인증에 실패했습니다
💡 credentials.json 파일 확인 후 재인증
```

### 상태 오류

```bash
# 잘못된 상태 전환
❌ 스크립트 상태가 'script_ready'가 아닙니다
💡 워크플로우 순서 확인: script → video → youtube
```

## 📈 성능 최적화

### CLI 워크플로우 효율성

- **기존 React**: 9분 (로딩 + 네비게이션 + 업로드)
- **CLI 도구**: 2분 (직접 명령어 실행)
- **효율성 향상**: 4배 빠른 일일 워크플로우

### 배치 처리

```bash
# 여러 스크립트 한번에 처리
./youtube-cli script upload *.txt
./youtube-cli youtube batch --privacy private
```

## 🔍 디버깅 및 로깅

### 자세한 로그 확인

```bash
# 백엔드 로그
tail -f logs/app-$(date +%Y-%m-%d).log

# 오류 로그
tail -f logs/error-$(date +%Y-%m-%d).log
```

### CLI 디버그 모드

```bash
# 자세한 출력
./youtube-cli --verbose script list

# 에러 상세 정보
./youtube-cli --debug youtube upload 1
```

## 🎯 고급 사용법

### 스크립트 자동화

```bash
#!/bin/bash
# daily_upload.sh

# 새로운 대본들 업로드
for script in scripts/*.txt; do
    ./youtube-cli script upload "$script"
done

# 준비된 모든 스크립트 YouTube 업로드
./youtube-cli youtube batch --privacy private

# 통계 리포트
./youtube-cli script stats
```

### 상태 모니터링

```bash
# 무한 루프 모니터링
while true; do
    ./youtube-cli status pipeline
    sleep 30
done
```

## 📞 지원 및 문의

- **이슈 리포팅**: [GitHub Issues](https://github.com/user/youtube-upload-automation/issues)
- **문서**: 프로젝트 루트의 `CLAUDE.md` 파일 참조
- **로그 위치**: `logs/` 디렉토리

---

**개발자 팁**: CLI 도구는 개발자 중심으로 설계되어 빠르고 효율적인 워크플로우를 제공합니다. 대시보드는 시각적 모니터링이 필요할 때만 사용하세요.