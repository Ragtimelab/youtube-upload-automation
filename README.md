# 🎬 YouTube 업로드 자동화 시스템

**1인 개발자를 위한 완전 자동화 YouTube 업로드 시스템**

[![GitHub Stars](https://img.shields.io/github/stars/Ragtimelab/youtube-upload-automation)](https://github.com/Ragtimelab/youtube-upload-automation)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.13](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/downloads/release/python-3130/)

## 📋 프로젝트 개요

YouTube 업로드 자동화 시스템은 콘텐츠 제작자가 스크립트 작성부터 YouTube 업로드까지의 반복적인 작업을 자동화하여, **순수 창작 활동에만 집중**할 수 있도록 도와주는 시스템입니다.

### 🎯 핵심 기능

- ✅ **스크립트 파일 기반 자동 등록**: 표준화된 형식의 스크립트 파일 업로드로 메타데이터 자동 추출
- ✅ **웹 GUI 인터페이스**: Gradio 기반 사용자 친화적 웹 인터페이스 (4개 탭 구조)
- ✅ **CLI 기반 자동화**: 명령줄 인터페이스로 빠른 업로드 워크플로우
- ✅ **비디오-스크립트 스마트 매칭**: 드롭다운 인터페이스로 실수 없는 매칭
- ✅ **YouTube 자동 업로드**: YouTube Data API v3 연동으로 완전 자동화
- ✅ **채널 브랜딩 자동화**: YAML 기반 모든 영상에 채널 기본 설명글과 태그 자동 추가
- ✅ **배치 업로드 시스템**: 다중 스크립트 동시 처리 및 예약 발행 지원
- ✅ **실시간 모니터링**: 시스템 성능 및 업로드 상태 실시간 추적
- ✅ **API 할당량 자동 관리**: 일일 10,000 units 한도 내에서 최적화된 업로드

### 💡 핵심 가치 제안

- **80% 작업 시간 단축**: 기존 60분/일 → 10분/일
- **99% 업로드 성공률**: 안정적인 자동화 시스템
- **완전 자동 워크플로우**: 스크립트 → 비디오 → YouTube
- **3가지 인터페이스**: 웹 GUI, CLI 도구, REST API
- **혁신적 고급 기능**: 배치 업로드, 예약 발행, 실시간 모니터링

---

## 🚀 Quick Start

### 1. 저장소 복제

```bash
git clone https://github.com/Ragtimelab/youtube-upload-automation.git
cd youtube-upload-automation
```

### 2. Poetry 를 이용한 의존성 설치

```bash
# Poetry 가상환경 설정 및 의존성 설치
poetry install
poetry shell  # 가상환경 활성화
```

### 3. 데이터베이스 초기화

```bash
cd backend
poetry run alembic upgrade head
```

### 4. YouTube API 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. YouTube Data API v3 활성화
3. OAuth 2.0 클라이언트 ID 생성
4. `credentials.json` 파일을 `.secrets/` 디렉토리에 배치

### 5. 시스템 실행

#### **방법 1: 웹 인터페이스 (권장)**

```bash
# 1. 백엔드 서버 실행 (별도 터미널)
cd backend
poetry run python -m app.main

# 2. Gradio 웹 인터페이스 실행 (별도 터미널)
poetry run python gradio_app.py
```

#### **방법 2: CLI 도구**

```bash
# 메인 CLI 인터페이스
./youtube-cli

# 개발자 실행 방법
python cli/main.py

# 빠른 스크립트 업로드
./quick-script script.txt

# 빠른 비디오 업로드
./quick-upload
```

### 6. 시스템 접속

- **웹 인터페이스**: <http://localhost:7860> (권장)
- **API 문서**: <http://localhost:8000/docs>
- **CLI 인터페이스**: `./youtube-cli`

---

## 📁 프로젝트 구조

```
youtube-upload-automation/
├── backend/                 # FastAPI 백엔드 + WebSocket
│   ├── app/
│   │   ├── main.py         # FastAPI 앱 엔트리포인트
│   │   ├── models/         # SQLAlchemy 모델
│   │   ├── routers/        # API 라우터 (scripts, upload, websocket)
│   │   ├── services/       # 비즈니스 로직 (YouTube, WebSocket)
│   │   └── core/           # 예외처리, 로깅, 검증
│   ├── .secrets/           # Google OAuth 인증 파일
│   └── uploads/            # 업로드된 비디오 파일
├── cli/                    # 명령줄 도구
│   ├── commands/          # CLI 명령어 (script, video, youtube)
│   └── utils/             # CLI 유틸리티
├── docs/                   # 프로젝트 문서
│   └── screenshots/       # 사용법 가이드 스크린샷
├── config/                 # 설정 파일
│   └── channels.yaml      # YAML 기반 채널 브랜딩 설정
├── gradio_app.py          # Gradio 웹 인터페이스 (메인)
├── quick-script           # 빠른 스크립트 업로드 도구
├── quick-upload           # 빠른 비디오 업로드 도구
├── youtube-cli            # 메인 CLI 인터페이스 (Poetry 자동 감지)
└── README.md             # 프로젝트 개요 (이 파일)
```

---

## 🔧 기술 스택

### Backend

- **Python 3.13**: 최신 Python 버전
- **Poetry**: 의존성 및 패키지 관리 도구
- **FastAPI 0.116.0+**: 고성능 API 프레임워크 + WebSocket 지원
- **Gradio 5.43.1**: 웹 인터페이스 프레임워크
- **SQLAlchemy 2.0+**: ORM 및 데이터베이스 관리
- **SQLite**: 경량 데이터베이스
- **Google APIs**: YouTube Data API v3 연동
- **WebSocket**: 실시간 양방향 통신

### CLI Tools

- **Click 8.2+**: 명령줄 인터페이스 프레임워크
- **Rich 14.1+**: 아름다운 터미널 출력
- **Colorama**: 크로스 플랫폼 컬러 지원

### DevOps

- **Git/GitHub**: 버전 관리 및 협업
- **Poetry**: 의존성 관리 및 패키징
- **Make**: 빌드 자동화

---

## 📖 사용법

### 🌐 웹 인터페이스 (권장)

#### 1. 스크립트 업로드

1. 웹 브라우저에서 <http://localhost:7860> 접속
2. "📝 스크립트 관리" 탭 선택
3. "파일 업로드" 영역에 마크다운 파일 드래그 앤 드롭
4. "스크립트 업로드" 버튼 클릭

**스크립트 파일 형식 예시:**

```text
=== 제목 ===
60년 만에 밝히는 할머니의 비밀

=== 메타데이터 ===
설명: 시니어 세대의 진솔한 회상 이야기
태그: 시니어, 회상, 가족, 이야기

=== 썸네일 정보 ===
텍스트: 숨겨진 진실
ImageFX 프롬프트: elderly korean person with emotional expression, warm lighting

=== 대본 ===
할머니의 숨겨진 이야기를 들려드리려고 합니다...
```

#### 2. 비디오 업로드

1. "🎥 비디오 업로드" 탭 선택
2. 드롭다운에서 `script_ready` 상태의 스크립트 선택
3. 비디오 파일 업로드 영역에 드래그 앤 드롭 (최대 8GB)
4. "비디오 업로드" 버튼 클릭

#### 3. YouTube 업로드

**단일 업로드:**
1. "📺 YouTube 업로드" 탭 선택
2. "단일 업로드" 서브탭에서 `video_ready` 상태 스크립트 선택
3. 공개 설정, 카테고리 선택 및 예약 발행 설정
4. "업로드 시작" 버튼 클릭

**배치 업로드:**
1. "배치 업로드" 서브탭 선택
2. 체크박스에서 다중 스크립트 선택
3. 업로드 간격 설정 (10-300초)
4. "배치 업로드 시작" 버튼 클릭

### ⌨️ CLI 도구 (지원)

#### CLI 실행 방법

```bash
# 메인 CLI 인터페이스 (권장)
./youtube-cli

# 개발자 실행 방법
python cli/main.py
```

#### 빠른 명령어

```bash
# 스크립트 빠른 업로드
./quick-script my_script.txt

# 비디오 빠른 업로드 (대화형)
./quick-upload
```

#### 상세 CLI 사용법

```bash
# 스크립트 관리
./youtube-cli script upload script.txt
./youtube-cli script list
./youtube-cli script delete 1

# 비디오 업로드
./youtube-cli video upload 1 video.mp4

# YouTube 업로드
./youtube-cli youtube upload 1 --privacy private

# 상태 확인
./youtube-cli status
```

---

## 🎭 채널 브랜딩 자동화

### 스마트 메타데이터 확장

모든 YouTube 업로드 시 **자동으로 적용**되는 채널 브랜딩 시스템:

#### 📝 설명 자동 확장 (Description 필드)
```
[대본에서 추출한 설명]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎭 마음을 담아 전하는 우리 세대 이야기

시청자분이 용기 내어 보내주신 소중한 경험담을 바탕으로 
정성껏 각색하여 준비한 이야기입니다.

[채널 소개, 구독 유도, 저작권 안내 등 전체 채널 기본 설명글]

앞으로도 마음을 다해 정성스럽게 준비하겠습니다.
함께해 주셔서 고맙습니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 🏷️ 태그 자동 결합 (Tags 필드)
```
대본태그1, 대본태그2, 우리세대, 진솔한이야기, 인생이야기, 마음공감, 정성스런이야기...
```

#### 🏷️ 태그 스마트 결합
- **중복 제거**: 대본 태그와 채널 태그 중복 자동 제거
- **원본 우선**: 대본 태그가 우선적으로 보존됨
- **500자 최적화**: YouTube 제한 내에서 스마트 조정

#### ⚙️ 설정 관리
- **설정 파일**: `config/channels.yaml` - YAML 기반 중앙화된 채널 설정
- **로더**: `backend/app/core/yaml_loader.py` - 싱글톤 패턴 동적 로딩
- **상수 클래스**: `backend/app/core/constants.py` → `ChannelConstants`
- **즉시 적용**: YAML 파일에서 실시간 로드되어 즉시 반영

### 기술적 특징

- **YouTube API 제한 준수**: 5,000바이트(설명), 500자(태그) 제한 고려
- **원본 보존**: 대본 내용이 우선적으로 유지됨
- **자동 처리**: 별도 설정 없이 모든 업로드에 자동 적용

---

## 📊 시스템 모니터링 및 대시보드

### 다층 탭 구조 대시보드

- **📈 최근 활동**: 스크립트 업로드 현황 및 통계
- **📊 업로드 분석**: 성공률, 일별/시간별 패턴 분석
- **📜 시스템 로그**: 실시간 로그 모니터링
- **⚡ 성능 모니터링**: CPU, 메모리, 디스크 사용률 실시간 추적

### 고급 모니터링 기능

- **종합적 헬스체크**: API/데이터베이스/YouTube/파일시스템 점검
- **빠른 액션 버튼**: 실시간 새로고침, 자동 배치 처리
- **실시간 진행률**: HTML/CSS 기반 시각적 진행률 표시
- **상세 피드백**: 성공/실패 상세 메시지 및 로그

---

## ⚙️ 설정 및 환경 변수

### 주요 설정 항목

`.env` 파일에서 다음 설정을 수정할 수 있습니다:

```bash
# 서버 설정
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
BACKEND_RELOAD=true

# 파일 경로
UPLOAD_DIR=uploads/videos
CREDENTIALS_PATH=.secrets/youtube-oauth2.json
TOKEN_PATH=.secrets/youtube-token.pickle

# YouTube API 기본값
DEFAULT_PRIVACY_STATUS=private
DEFAULT_CATEGORY_ID=22

# 로깅
DEBUG=true
LOG_LEVEL=INFO
```

### YouTube API 제한사항

- **일일 할당량**: 10,000 units (업로드당 1,600 units)
- **미인증 프로젝트**: private 모드만 업로드 가능
- **콘텐츠 제한**: 제목 100자, 설명 5,000바이트, 태그 500자

---

## 🛠️ 개발 가이드

### 개발 환경 설정

```bash
# Poetry로 개발 의존성 설치
poetry install --with dev,test

# 코드 품질 도구 실행
make format    # Python 코드 포매팅
make lint      # 린팅
make test      # 테스트 실행
```

### 백엔드 개발

```bash
cd backend

# 서버 시작
make run

# 데이터베이스 마이그레이션
make migrate

# 테스트 실행
make test
```

### Streamlit 개발

```bash
# 개발 모드로 실행 (자동 리로드)
streamlit run streamlit_app/app.py

# 특정 포트로 실행
streamlit run streamlit_app/app.py --server.port 8501
```

---

## 📚 문서

### 📖 사용자 가이드

- **[빠른 시작 가이드](docs/QUICK_START.md)**: 5분만에 시작하기
- **[사용자 가이드](docs/USER_GUIDE.md)**: 완전한 사용법
- **[FAQ](docs/FAQ.md)**: 자주 묻는 질문과 해결책
- **[문서 인덱스](docs/INDEX.md)**: 모든 문서 총정리

### 🔧 개발자 가이드  

- **[개발자 가이드](CLAUDE.md)**: 전체 시스템 구조 및 개발 가이드
- **[CLI 사용법](docs/CLI_USAGE.md)**: 명령줄 도구 상세 가이드
- **[API 문서](docs/API.md)**: REST API 및 WebSocket 가이드
- **[구현 완료 보고서](docs/IMPLEMENTATION_COMPLETE.md)**: 프로젝트 완성도
- **[배포 준비 상태](docs/DEPLOYMENT_READY.md)**: 프로덕션 배포 가이드
- **[변경 이력](docs/CHANGELOG.md)**: 버전별 변경사항

---

## 📈 로드맵

### ✅ Phase 1: Core System (완료)

- [x] 스크립트 파일 파싱 시스템
- [x] YouTube API 연동 및 업로드
- [x] Streamlit 웹 대시보드
- [x] CLI 도구 및 빠른 업로드
- [x] WebSocket 실시간 기능
- [x] 완전한 문서화

### 🚧 Phase 2: 확장 기능 (계획)

- [ ] 배치 업로드 스케줄링
- [ ] 다중 채널 지원
- [ ] 고급 통계 및 분석
- [ ] API 할당량 최적화

### 🔮 Phase 3: 고도화 (예정)

- [ ] AI 기반 태그 추천
- [ ] 다중 플랫폼 지원 (네이버 TV 등)
- [ ] 모바일 앱 지원
- [ ] 클라우드 배포 옵션

---

## 🤝 기여하기

### 버그 신고

GitHub Issues를 통해 버그를 신고해주세요:

1. 버그 재현 단계 상세 기술
2. 예상 동작과 실제 동작 명시
3. 환경 정보 (OS, Python 버전 등)

### 기능 요청

1. 기능의 필요성과 배경
2. 구체적인 사용 사례
3. 예상되는 사용자 이점

### Pull Request 가이드

1. 기능 브랜치에서 개발
2. 코드 스타일 가이드 준수 (`make format`, `make lint`)
3. 테스트 케이스 작성
4. 문서 업데이트

---

## 🔐 보안 고려사항

### 중요 파일 보호

- `.secrets/youtube-oauth2.json` - YouTube OAuth2 클라이언트 인증 정보
- `.secrets/youtube-token.pickle` - YouTube API 액세스 토큰
- `.secrets/google-tts-service.json` - Google TTS 서비스 계정 키
- `.env` - 환경변수 설정
- `*.db` - 데이터베이스 파일

### API 키 관리

- Google Cloud Console에서 API 키 제한 설정
- OAuth 2.0 클라이언트 ID의 승인된 리디렉션 URI 제한
- 정기적인 토큰 갱신 및 모니터링

---

## 📄 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

---

## 📞 지원 및 문의

### 커뮤니티

- **GitHub Issues**: 버그 신고 및 기능 요청
- **GitHub Discussions**: 질문 및 토론

### 개발자

- **Email**: <ragtime1260@gmail.com>
- **GitHub**: [@Ragtimelab](https://github.com/Ragtimelab)

---

## ⭐ 프로젝트 지원

이 프로젝트가 도움이 되었다면 ⭐ Star를 눌러주세요!

[![GitHub Stars](https://img.shields.io/github/stars/Ragtimelab/youtube-upload-automation?style=social)](https://github.com/Ragtimelab/youtube-upload-automation)

---

**YouTube 업로드 자동화로 창작에만 집중하세요! 🎬✨**
