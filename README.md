# 🎬 YouTube 업로드 자동화 시스템

**시니어 대상 콘텐츠 제작자를 위한 완전 자동화 YouTube 업로드 시스템**

[![GitHub Stars](https://img.shields.io/github/stars/[USERNAME]/youtube-upload-automation)](https://github.com/[USERNAME]/youtube-upload-automation)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.13](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/downloads/release/python-3130/)
[![React](https://img.shields.io/badge/react-18.2-blue.svg)](https://reactjs.org/)

## 📋 프로젝트 개요

YouTube 업로드 자동화 시스템은 콘텐츠 제작자가 대본 생성부터 YouTube 업로드까지의 반복적인 작업을 자동화하여, **순수 창작 활동에만 집중**할 수 있도록 도와주는 시스템입니다.

### 🎯 핵심 기능
- ✅ **대본 파일 기반 자동 등록**: 표준화된 형식의 대본 파일 업로드로 메타데이터 자동 추출
- ✅ **영상-대본 스마트 매칭**: 직관적인 드롭다운 인터페이스로 실수 없는 매칭
- ✅ **YouTube 자동 업로드**: YouTube Data API v3 연동으로 완전 자동화
- ✅ **실시간 모니터링**: WebSocket 기반 업로드 상태 실시간 추적
- ✅ **예약 업로드**: 1달치 스케줄링으로 무인 운영 가능
- ✅ **API 할당량 자동 관리**: 일일 10,000 units 한도 내에서 최적화된 업로드

### 💡 핵심 가치 제안
- **80% 작업 시간 단축**: 기존 60분/일 → 10분/일
- **99% 업로드 성공률**: 안정적인 자동화 시스템
- **완전 자동 스케줄링**: 1달치 예약 업로드로 무인 운영
- **ROI 월 75만원**: 시간 절약을 통한 직접적 비용 절감

---

## 🚀 Quick Start

### 1. 저장소 복제
```bash
git clone https://github.com/[USERNAME]/youtube-upload-automation.git
cd youtube-upload-automation
```

### 2. Poetry 를 이용한 백엔드 설정
```bash
# Poetry 가상환경 설정 및 의존성 설치
poetry install
poetry shell  # 가상환경 활성화

# 개발 도구 설정
poetry run pre-commit install
```

### 3. 데이터베이스 초기화
```bash
poetry run alembic upgrade head
```

### 4. 환경 변수 설정
```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env

# .env 파일을 수정하여 본인 환경에 맞게 설정
# 대부분의 설정은 기본값을 사용해도 됨
```

### 5. YouTube API 설정
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. YouTube Data API v3 활성화
3. OAuth 2.0 클라이언트 ID 생성
4. `credentials.json` 파일을 프로젝트 루트에 배치

### 6. 프론트엔드 설정
```bash
cd ../frontend
npm install
```

### 7. 개발 서버 실행
```bash
# 터미널 1: 백엔드 서버 (Poetry 환경)
poetry run uvicorn app.main:app --reload

# 또는 Poetry shell 활성화 후
poetry shell
uvicorn app.main:app --reload

# 터미널 2: 프론트엔드 서버
cd frontend
npm start
```

### 8. 시스템 접속
- **웹 대시보드**: http://localhost:3000
- **API 문서**: http://localhost:8000/docs

---

## 📁 프로젝트 구조

```
youtube-upload-automation/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py         # FastAPI 앱 엔트리포인트
│   │   ├── models/         # SQLAlchemy 모델
│   │   ├── routers/        # API 라우터
│   │   ├── services/       # 비즈니스 로직
│   │   └── database.py     # 데이터베이스 설정
│   ├── requirements.txt    # Python 의존성
│   └── alembic/           # 데이터베이스 마이그레이션
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── hooks/         # Custom React Hooks
│   │   └── utils/         # 유틸리티 함수
│   └── package.json       # Node.js 의존성
├── docs/                  # 프로젝트 문서
│   ├── PRD.md            # 제품 요구사항 정의서
│   ├── TECHNICAL_SPEC.md  # 기술 명세서
│   ├── TASK.md           # 상세 작업 목록
│   └── WORKFLOW.md       # 워크플로우 가이드
└── README.md             # 프로젝트 개요 (이 파일)
```

---

## 🔧 기술 스택

### Backend
- **Python 3.13**: 최신 Python 버전
- **Poetry**: 의존성 및 패키지 관리 도구
- **FastAPI 0.104.1+**: 고성능 API 프레임워크 + WebSocket 지원
- **SQLAlchemy 2.0+**: ORM 및 데이터베이스 관리
- **SQLite**: 경량 데이터베이스
- **Google APIs**: YouTube Data API v3 연동
- **WebSocket**: 실시간 양방향 통신

### Frontend
- **React 18.2+**: 모던 프론트엔드 프레임워크
- **TypeScript 5.3+**: 타입 안전성 보장
- **Tailwind CSS 3.4+**: 유틸리티 CSS 프레임워크
- **shadcn/ui**: 고품질 UI 컴포넌트 라이브러리
- **Vite 5.0+**: 빠른 빌드 도구
- **WebSocket Client**: 실시간 알림 및 상태 동기화

### DevOps
- **Git/GitHub**: 버전 관리 및 협업
- **Docker**: 컨테이너 기반 배포
- **GitHub Actions**: CI/CD 파이프라인

---

## 📖 사용법

### 1. 대본 등록
1. 웹 대시보드에서 "새 대본 등록" 클릭
2. 표준화된 대본 파일(.txt/.md) 업로드
3. 시스템이 자동으로 파싱하여 메타데이터 추출

**대본 파일 형식 예시:**
```text
=== 대본 ===
할머니의 숨겨진 이야기를 들려드리려고 합니다...

=== 메타데이터 ===
제목: 60년 만에 밝히는 할머니의 비밀
설명: 시니어 세대의 진솔한 회상 이야기
태그: 시니어, 회상, 가족, 이야기
카테고리: People & Blogs
공개설정: 비공개

=== 썸네일 제작 ===
썸네일 문구: 숨겨진 진실
ImageFX 프롬프트: elderly korean person with emotional expression, warm lighting, nostalgic atmosphere
```

### 2. 영상 제작 (수동)
- 등록된 대본을 참고하여 영상 제작
- ImageFX 프롬프트를 활용한 썸네일 배경 이미지 생성

### 3. 영상-대본 매칭
1. "영상 업로드" 페이지 접속
2. 드롭다운에서 대응하는 대본 선택
3. 제작한 영상 파일 업로드
4. 시스템이 자동 매칭 완료

### 4. YouTube 업로드
1. 매칭 완료된 항목에서 "업로드 시작" 클릭
2. 예약 업로드 시간 설정 (선택사항)
3. 업로드 진행상황 실시간 모니터링
4. 업로드 완료 후 YouTube에서 확인

---

## 📊 시스템 모니터링

### 실시간 대시보드
- **업로드 상태**: 진행 중인 업로드 실시간 추적
- **성공/실패 통계**: 일별, 주별, 월별 업로드 현황
- **API 할당량**: YouTube API 사용량 모니터링
- **스케줄**: 예약된 업로드 일정 관리

### 알림 시스템
- **업로드 완료**: WebSocket 기반 실시간 알림
- **에러 발생**: 업로드 실패 시 즉시 알림
- **할당량 경고**: API 사용량 80% 초과 시 경고

---

## ⚙️ 환경 변수 설정 가이드

### 주요 설정 항목
`.env` 파일에서 다음 설정을 수정할 수 있습니다:

```bash
# 서버 설정
BACKEND_HOST=0.0.0.0          # 백엔드 호스트
BACKEND_PORT=8000             # 백엔드 포트
FRONTEND_URL=http://localhost:3000  # 프론트엔드 URL

# 파일 경로
UPLOAD_DIR=uploads/videos     # 비디오 업로드 디렉토리
CREDENTIALS_PATH=credentials.json  # Google OAuth 인증 파일
TOKEN_PATH=token.pickle       # 인증 토큰 캐시 파일

# YouTube API 기본값
DEFAULT_PRIVACY_STATUS=private  # 기본 공개 설정 (private/unlisted/public)
DEFAULT_CATEGORY_ID=22         # 기본 카테고리 ID (22 = People & Blogs)

# 업로드 제한
MAX_VIDEO_SIZE_MB=2048        # 최대 비디오 파일 크기 (MB)

# WebSocket 설정 (프론트엔드)
VITE_API_BASE_URL=http://localhost:8000   # Backend API URL
VITE_WS_URL=ws://localhost:8000/ws        # WebSocket URL for real-time features
```

### 프로덕션 환경 설정
```bash
# 프로덕션용 .env 설정 예시
DEBUG=false
LOG_LEVEL=WARNING
BACKEND_RELOAD=false
DATABASE_URL=sqlite:///./production.db
```

## 🔐 보안 고려사항

### 중요 파일 보호
```bash
# .gitignore에 다음 항목들이 포함되어야 함
credentials.json      # Google OAuth 인증 정보
token.json           # YouTube API 액세스 토큰
token.pickle         # 인증 토큰 캐시
*.db                # 데이터베이스 파일
uploads/            # 업로드된 파일들
.env                # 환경변수 (중요!)
```

### API 키 관리
- Google Cloud Console에서 API 키 제한 설정
- OAuth 2.0 클라이언트 ID의 승인된 리디렉션 URI 제한
- 정기적인 토큰 갱신 및 모니터링

---

## 🛠️ 개발 가이드

### 개발 환경 설정
```bash
# Poetry로 개발 의존성 설치 (이미 pyproject.toml에 정의됨)
poetry install --with dev,test

# 코드 품질 도구 실행
poetry run black backend/app/       # Python 코드 포매팅
poetry run isort backend/app/       # import 정렬
poetry run flake8 backend/app/      # 린팅
poetry run mypy backend/app/        # 타입 체크

# 프론트엔드 린팅
cd frontend
npm run lint                        # TypeScript 린팅
```

### Git 워크플로우
```bash
# 기능 개발 브랜치 생성
git checkout -b feature/new-feature
git push -u origin feature/new-feature

# 개발 완료 후 Pull Request 생성
git checkout main
git merge feature/new-feature
git tag -a v1.1.0 -m "Feature: New functionality"
```

### 테스트 실행
```bash
# 백엔드 테스트 (Poetry 환경)
poetry run pytest backend/tests/

# 커버리지 보고서 포함
poetry run pytest --cov=backend/app backend/tests/

# 프론트엔드 테스트
cd frontend
npm run test
```

---

## 📈 로드맵

### ✅ Phase 1: Core System (완료)
- [x] 대본 파일 파싱 시스템
- [x] YouTube API 연동
- [x] 기본 웹 인터페이스
- [x] 실시간 모니터링
- [x] **WebSocket 실시간 기능 (Week 7 완료)**
  - [x] 실시간 업로드 진행률 추적
  - [x] 시스템 알림 및 상태 변화 알림
  - [x] 자동 재연결 및 연결 상태 관리
  - [x] 스크립트별 구독 시스템

### 🚧 Phase 2: 확장 기능 (진행 중)
- [ ] 배치 업로드 스케줄링
- [ ] API 할당량 최적화
- [ ] 고급 통계 및 분석
- [ ] 모바일 반응형 UI

### 🔮 Phase 3: 고도화 (예정)
- [ ] 다중 채널 지원 (5개 채널)
- [ ] AI 기반 태그 추천
- [ ] 다중 플랫폼 지원 (네이버 TV 등)
- [ ] 사용자 관리 시스템

---

## 🤝 기여하기

### 버그 신고
GitHub Issues를 통해 버그를 신고해주세요:
1. 버그 재현 단계 상세 기술
2. 예상 동작과 실제 동작 명시
3. 환경 정보 (OS, 브라우저, Python 버전)

### 기능 요청
새로운 기능 제안은 다음 형식으로 작성해주세요:
1. 기능의 필요성과 배경
2. 구체적인 사용 사례
3. 예상되는 사용자 이점

### Pull Request 가이드
1. 기능 브랜치에서 개발
2. 코드 스타일 가이드 준수
3. 테스트 케이스 작성
4. 문서 업데이트

---

## 📄 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

---

## 📞 지원 및 문의

### 문서
- **[기술 명세서](docs/TECHNICAL_SPEC.md)**: 상세 기술 구현 사항
- **[개발 가이드](docs/TASK.md)**: 단계별 개발 작업 목록
- **[워크플로우](docs/WORKFLOW.md)**: 사용자 워크플로우 상세 가이드

### 커뮤니티
- **GitHub Issues**: 버그 신고 및 기능 요청
- **GitHub Discussions**: 질문 및 토론
- **Wiki**: 추가 문서 및 가이드

---

## ⭐ 프로젝트 지원

이 프로젝트가 도움이 되었다면 ⭐ Star를 눌러주세요!

[![GitHub Stars](https://img.shields.io/github/stars/[USERNAME]/youtube-upload-automation?style=social)](https://github.com/[USERNAME]/youtube-upload-automation)

---

**YouTube 업로드 자동화로 창작에만 집중하세요! 🎬✨**