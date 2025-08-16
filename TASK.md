# 📋 개발 작업 목록 (TASK.md)
**1인 개발자를 위한 간결한 구현 가이드**

---

## 🎯 프로젝트 시작 전 체크리스트

### ✅ 사전 준비 사항
- [x] Python 3.13 설치 확인 (Python 3.13.6)
- [x] Poetry 설치 확인 (Poetry 2.1.4)
- [x] Node.js 18+ 설치 확인 (Node.js v22.18.0)
- [x] Google Cloud Platform 계정 생성
- [x] YouTube 채널 준비 (업로드 대상 채널 - UC9Ng3G-y6A-PtPuIddjIcMg)
- [x] **Git/GitHub 저장소 설정** (https://github.com/Ragtimelab/youtube-upload-automation)
- [x] 개발 환경 IDE 설정 (PyCharm + VS Code 모두 설정 완료)

### ✅ Google API 설정
- [x] Google Cloud Console 프로젝트 생성
- [x] YouTube Data API v3 활성화
- [x] OAuth 2.0 클라이언트 ID 생성
- [x] credentials.json 파일 다운로드
- [x] YouTube 채널 연동 테스트 (채널명: "사랑과 전쟁", ID: UC9Ng3G-y6A-PtPuIddjIcMg) ✅

---

## 🚀 Phase 1: 기본 시스템 구축 (Week 1-4)

### Week 1: 프로젝트 초기화 및 백엔드 기본 구조

#### 📦 1.1 프로젝트 설정 (Day 1)
**작업 목록:**
- [x] Git 저장소 초기화 완료
- [x] GitHub 저장소 생성 및 연결
- [x] .gitignore 설정 완료
- [x] Poetry 프로젝트 초기화 완료
- [x] Poetry 가상환경 활성화 확인
- [x] 기본 의존성 설치 완료
- [x] pyproject.toml 생성 확인

#### 🗄️ 1.2 데이터베이스 설정 (Day 2)
**작업 목록:**
- [x] database.py 설정 ✅
- [x] Script 모델 정의 ✅
- [x] Alembic 마이그레이션 설정 ✅
- [x] SQLite DB 파일 생성 확인 ✅
- [x] 테이블 생성 확인 ✅

#### 🌐 1.3 FastAPI 기본 구조 (Day 3) 
**작업 목록:**
- [x] main.py 기본 구조 생성 ✅
- [x] CORS 설정 ✅
- [x] 헬스체크 엔드포인트 ✅
- [x] 개발 서버 실행 테스트 ✅
- [x] API 응답 정상 ✅

---

## 🎉 Phase 1 - Week 1 완료 요약
**✅ 완료된 주요 작업:**
1. 프로젝트 시작 전 체크리스트 100% 완료
2. 데이터베이스 시스템 구축 (SQLAlchemy + SQLite)
3. FastAPI 백엔드 기반 구조 (CORS, 헬스체크 API)

**📊 현재 시스템 구조:**
- backend/app/main.py - FastAPI 애플리케이션
- backend/app/database.py - SQLAlchemy 설정
- backend/app/models/script.py - Script 데이터 모델
- backend/alembic/ - 데이터베이스 마이그레이션
- backend/youtube_automation.db - SQLite 데이터베이스

---

## 🎉 Phase 1 - Week 2 완료 요약
**✅ 완료된 주요 작업:**
1. **대본 파싱 시스템 구축**
   - ScriptParser 클래스: 정규식 기반 섹션 분리 로직
   - 메타데이터 추출: 제목, 설명, 태그 파싱
   - 예외 처리 및 유효성 검증

2. **RESTful API 시스템 구축**
   - 6개 완전한 엔드포인트 (CRUD + 통계 + 파일 업로드)
   - 파일 업로드 및 파싱 통합 프로세스
   - 페이지네이션 및 필터링 지원

**📊 확장된 시스템 구조:**
- backend/app/services/script_parser.py - 대본 파싱 시스템 (NEW)
- backend/app/routers/scripts.py - 대본 관리 API (NEW)

---

### Week 3: YouTube API 연동

#### 🎬 3.1 YouTube API 클라이언트 (Day 8-9) **✅ 이미 완료됨**
**작업 목록:**
- [x] YouTubeClient 클래스 생성 ✅
- [x] OAuth 2.0 인증 로직 ✅
- [x] 토큰 저장/로드 기능 ✅
- [x] API 클라이언트 초기화 ✅
- [x] 인증 테스트 ✅

#### ⬆️ 3.2 업로드 기능 구현 (Day 10-11) **✅ 이미 완료됨**
**작업 목록:**
- [x] 비디오 업로드 메서드 구현 ✅
- [x] 메타데이터 매핑 로직 ✅
- [x] 업로드 API 시스템 ✅
- [x] 에러 핸들링 ✅
- [x] 상태 관리 로직 ✅

---

## 🎉 Phase 1 - Week 3 완료 요약
**✅ 완료된 주요 작업:**
1. **YouTube API 연동 시스템 구축**
   - YouTubeClient OAuth 2.0 인증 시스템
   - 토큰 저장/로드 자동화 기능
   - 비디오 업로드 및 메타데이터 매핑
   - 에러 핸들링 및 상태 관리

2. **업로드 기능 완전 구현**
   - 비디오 파일 업로드 API 시스템
   - 대본-영상 매칭 및 검증 로직
   - YouTube 업로드 자동화 프로세스

**📊 확장된 시스템 구조:**
- backend/app/services/youtube/youtube_client.py - YouTube API 클라이언트
- backend/app/services/youtube/upload_manager.py - 업로드 관리자
- backend/app/routers/upload.py - 업로드 API 엔드포인트

---

### Week 4: 웹 인터페이스 완전 재구축 **✅ 완료됨**

#### 🔄 4.1 기존 인터페이스 문제점 분석 및 제거 **✅ 완료됨**
**작업 목록:**
- [x] 기존 구현 분석 및 문제점 파악 ✅
- [x] 혼재된 스타일링 시스템 (Tailwind + 인라인) 제거 ✅
- [x] 불완전한 shadcn/ui 구현 정리 ✅
- [x] frontend/src 디렉토리 완전 제거 ✅

#### ⚛️ 4.2 Clean Architecture 기반 재구축 **✅ 완료됨**
**작업 목록:**
- [x] React 19 + TypeScript 5.8 최신 설정 ✅
- [x] Tailwind CSS 4.1.12 + PostCSS 설정 ✅
- [x] shadcn/ui 완전 구현 ✅
- [x] Zustand + React Query 상태 관리 ✅
- [x] Vite 7.1.2 최적화 빌드 설정 ✅

**새로운 Clean Architecture 구조:**
```
frontend/src/
├── shared/              # 공유 계층
│   ├── types/          # TypeScript 타입 정의
│   ├── ui/             # shadcn/ui 컴포넌트 시스템
│   ├── lib/            # 유틸리티 함수
│   ├── api/            # API 클라이언트
│   └── constants/      # 상수 정의
├── app/                # 애플리케이션 계층
│   ├── store/          # Zustand 글로벌 상태
│   ├── hooks/          # React Query 훅들
│   └── providers/      # React Context 제공자
├── components/         # 프레젠테이션 계층
│   └── layout/         # 레이아웃 컴포넌트
├── pages/              # 페이지 계층
│   └── dashboard.tsx   # 메인 대시보드
└── main.tsx           # 애플리케이션 진입점
```

#### 🎨 4.3 모던 UI/UX 시스템 구축 **✅ 완료됨**
**작업 목록:**
- [x] 글래스모피즘 디자인 시스템 구현 ✅
- [x] 반응형 레이아웃 (Sidebar + Header) ✅
- [x] 다크/라이트 테마 지원 ✅
- [x] 애니메이션 및 인터랙션 ✅
- [x] 타입 안전 컴포넌트 라이브러리 ✅

**핵심 컴포넌트:**
- [x] Button, Card, Input, Progress, Toast UI ✅
- [x] 접이식 사이드바 (w-64 ↔ w-16) ✅
- [x] 통계 대시보드 카드 시스템 ✅
- [x] 실시간 활동 피드 ✅

#### 🔗 4.4 API 통합 및 상태 관리 **✅ 완료됨**
**작업 목록:**
- [x] 타입 안전 API 클라이언트 구현 ✅
- [x] 파일 업로드 진행률 추적 ✅
- [x] 에러 처리 및 토스트 알림 ✅
- [x] React Query 캐싱 및 동기화 ✅
- [x] Zustand 글로벌 상태 관리 ✅

**완료 기준:**
- [x] TypeScript 컴파일 성공 (0 에러) ✅
- [x] Vite 빌드 성공 ✅
- [x] 개발 서버 실행 (localhost:5173) ✅
- [x] 모든 UI 컴포넌트 렌더링 확인 ✅
- [x] 반응형 디자인 동작 확인 ✅

---

## 🎉 Phase 1 - Week 4 완료 요약
**✅ 완료된 주요 작업:**
1. **React TypeScript 프론트엔드 완전 구축**
   - Vite 기반 React TypeScript 프로젝트 설정
   - Tailwind CSS + shadcn/ui 디자인 시스템 구축
   - React Router 기반 SPA 구현
   - TanStack React Query 상태 관리

2. **UI 컴포넌트 시스템 완성**
   - Dashboard: 업로드 현황 통계 대시보드
   - ScriptUpload: 대본 파일 업로드 인터페이스
   - ManagePage: 대본 목록 및 상태 관리
   - SettingsPage: 시스템 설정 관리

3. **API 연동 레이어 구축**
   - TypeScript 타입 안전성 보장
   - 서비스 레이어 패턴 적용
   - 커스텀 훅 기반 데이터 관리
   - 에러 처리 및 로딩 상태 관리

**📊 완성된 프론트엔드 구조:**
- frontend/src/components/ui/ - shadcn/ui 기반 UI 컴포넌트
- frontend/src/components/layout/ - Header, Navigation, Layout
- frontend/src/pages/ - Dashboard, ScriptUpload, ManagePage, SettingsPage
- frontend/src/hooks/ - useScripts, useUploads 커스텀 훅
- frontend/src/services/ - API 서비스 레이어
- frontend/src/types/ - TypeScript 타입 정의
- frontend/src/utils/api.ts - API 클라이언트

**🌐 시스템 접근:**
- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:8000

---

## 🚀 Phase 2: 영상 업로드 시스템 (Week 5-6) **← 다음 진행할 작업**

### Week 5: 영상-대본 매칭 시스템

#### 🎬 5.1 영상 업로드 API (Day 15-16)
**작업 목록:**
- [ ] 영상 파일 업로드 API
- [ ] 파일 저장 로직
- [ ] 대본-영상 매칭 검증
- [ ] 상태 업데이트 로직
- [ ] 파일 크기 제한 설정

#### ▶️ 5.2 YouTube 업로드 API (Day 17-18)
**작업 목록:**
- [ ] YouTube 업로드 API 엔드포인트
- [ ] 예약 발행 기능
- [ ] 에러 처리 로직
- [ ] 진행 상황 추적
- [ ] API 할당량 체크

### Week 6: UI 완성 및 통합

#### 🎨 6.1 업로드 UI 컴포넌트 (Day 19-20)
**작업 목록:**
- [ ] VideoUpload 컴포넌트 구현
- [ ] 대본 선택 드롭다운
- [ ] 파일 선택 인터페이스
- [ ] 진행률 표시
- [ ] 업로드 상태 피드백

#### 📊 6.2 대시보드 통합 (Day 21)
**작업 목록:**
- [ ] 전체 대시보드 레이아웃 구성
- [ ] 컴포넌트 통합
- [ ] 상태 관리 로직
- [ ] 통계 카드 구현
- [ ] 반응형 디자인

---

## 🚀 Phase 3: 고도화 기능 (Week 7-8)

### Week 7: WebSocket 실시간 기능

#### 🔄 7.1 WebSocket 백엔드 (Day 22-23)
**작업 목록:**
- [ ] WebSocket 연결 관리자 구현
- [ ] 실시간 알림 시스템
- [ ] 업로드 진행상황 브로드캐스트
- [ ] 연결 해제 처리

#### 🌐 7.2 WebSocket 프론트엔드 (Day 24)
**작업 목록:**
- [ ] useWebSocket 훅 구현
- [ ] 실시간 메시지 수신 처리
- [ ] 연결 상태 관리
- [ ] 재연결 로직

### Week 8: 배치 처리 및 스케줄링

#### ⏰ 8.1 스케줄링 시스템 (Day 25-26)
**작업 목록:**
- [ ] 스케줄러 서비스 구현
- [ ] 백그라운드 작업 처리
- [ ] 예약 업로드 로직
- [ ] 에러 처리 및 재시도

#### 📋 8.2 배치 업로드 기능 (Day 27-28)
**작업 목록:**
- [ ] 배치 스케줄링 API
- [ ] 월간 업로드 계획 생성
- [ ] 스케줄 조회 API
- [ ] 스케줄 수정/삭제 기능

---

## 🎯 최종 테스트 및 배포 (Week 9)

### Day 29-30: 통합 테스트
- [ ] 전체 플로우 테스트: 대본 업로드 → 영상 매칭 → YouTube 업로드
- [ ] 에러 시나리오 테스트: 잘못된 파일, API 오류, 네트워크 문제
- [ ] 성능 테스트: 동시 업로드, 대용량 파일, 장시간 실행
- [ ] UI/UX 테스트: 모든 버튼, 폼, 피드백 메시지 확인

### Day 31: 문서화 및 배포 준비
- [ ] README.md 작성: 설치, 설정, 사용법 가이드
- [ ] 환경 설정 가이드: YouTube API 설정, 인증 프로세스
- [ ] 트러블슈팅 가이드: 주요 에러 해결 방법
- [ ] 배포 스크립트: Docker, 환경변수, 백업 설정

---

## 📚 참고 자료 및 도구

### 필수 문서
- [ ] [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
- [ ] [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [ ] [React TypeScript Guide](https://react-typescript-cheatsheet.netlify.app/)
- [ ] [shadcn/ui Components](https://ui.shadcn.com/docs)

### 개발 도구 설정
- [ ] VS Code Extensions: Python, TypeScript, Tailwind CSS IntelliSense
- [ ] API 테스트: Postman 또는 Insomnia
- [ ] 버전 관리: Git 설정 및 브랜치 전략
- [ ] 데이터베이스 도구: SQLite Browser

### 모니터링 도구
- [ ] 로그 관리: Python logging 설정
- [ ] 에러 추적: Sentry 또는 기본 예외 처리
- [ ] 성능 모니터링: API 응답 시간 측정
- [ ] YouTube API 할당량: 일일 사용량 추적

---

## ⚠️ 중요 체크포인트

### 보안 주의사항
- [ ] API 키 보안: credentials.json, token.pickle 파일 .gitignore 추가
- [ ] 파일 업로드 검증: 파일 타입, 크기 제한
- [ ] SQL 인젝션 방지: SQLAlchemy ORM 사용
- [ ] CORS 설정: 프로덕션에서 origin 제한

### 성능 최적화
- [ ] 파일 저장소: 대용량 비디오 파일 처리 방안
- [ ] DB 인덱스: 자주 조회되는 컬럼에 인덱스 추가
- [ ] 캐싱: API 응답 캐싱 전략
- [ ] 비동기 처리: 업로드 작업 큐 시스템

### 확장성 고려
- [ ] 다중 채널: 향후 5개 채널 지원 준비
- [ ] 사용자 관리: 추후 다중 사용자 지원
- [ ] 백업: 데이터 백업 및 복구 전략
- [ ] 모니터링: 시스템 상태 모니터링

---

이 간결한 TASK.md는 코드 예시 없이 핵심 작업 항목과 체크리스트만 포함하여 진행 상황을 명확하게 관리할 수 있도록 구성되었습니다.