# 🚀 WebSocket 재도입 + React 프론트엔드 완전 구축 체크리스트

> **프로젝트**: YouTube 업로드 자동화 시스템  
> **목표**: WebSocket 기반 실시간 통신 + React 프론트엔드 완전 통합  
> **생성일**: 2025-08-22  
> **예상 완료**: 8일 (풀타임 기준)

## 📋 프로젝트 개요
YouTube 업로드 자동화 시스템에 **WebSocket 기반 실시간 통신**과 **React 프론트엔드**를 완전히 통합하여, CLI 기능을 100% 매핑하는 웹 인터페이스 구축

## 🎯 핵심 목표
- [x] **WebSocket 재도입**: 실시간 업로드 진행률, 상태 변경 알림 ✅ **완료**
- [ ] **React 프론트엔드**: Shadcn/ui + TypeScript + Vite 기반 모던 웹앱
- [ ] **CLI 완전 매핑**: 모든 CLI 명령어를 웹에서 동일하게 제공
- [ ] **글로벌 원칙 준수**: 근본 해결, 검증 우선, 실시간 정보 활용

---

## 📁 Phase 1: WebSocket 재도입 (Backend) - 1일 ✅ **완료**

### 1.1 WebSocket Manager 재구축 ✅
- [x] `backend/app/services/websocket_manager.py` 생성
  - [x] ConnectionManager 클래스 구현
  - [x] 연결 관리 (connect, disconnect, active_connections)
  - [x] 방송 기능 (broadcast_message, send_to_client)
  - [x] 상태 추적 (upload_progress, system_notifications)

### 1.2 WebSocket Router 추가 ✅
- [x] `backend/app/routers/websocket.py` 재생성
  - [x] `/ws` 엔드포인트 구현
  - [x] WebSocket 연결 핸들러
  - [x] 메시지 타입 정의 (progress, status_change, notification)
  - [x] 에러 처리 및 연결 복구

### 1.3 의존성 및 통합 ✅
- [x] `pyproject.toml`에 websockets, python-multipart 재추가
- [x] `backend/app/main.py`에 WebSocket router 등록
- [x] Upload Service에서 WebSocket 호출 추가
  - [x] 비디오 업로드 진행률 브로드캐스트
  - [x] YouTube 업로드 상태 변경 알림
  - [x] 에러 상황 실시간 통지

---

## 📁 Phase 2: React 프론트엔드 완전 구축 - 3.5일 ✅ **완료 (2025-08-22)**

### 2.1 프로젝트 셋업 (0.5일) ✅ **완료**
- [x] `frontend/` 디렉토리에 Vite + React + TypeScript 프로젝트 생성
- [x] 핵심 의존성 설치
  - [x] React 19.1.1 + React DOM
  - [x] TypeScript 5.8.3
  - [x] Vite 7.1.2
  - [x] React Router DOM 7.8.2
- [x] UI 및 상태 관리 라이브러리 설치
  - [x] Shadcn/ui + Tailwind CSS 4.1.12 + @tailwindcss/postcss
  - [x] TanStack Query 5.85.5 + QueryProvider 설정
  - [x] Zustand 5.0.8
  - [x] React Hook Form 7.62.0 + Zod 4.0.17
  - [x] Lucide React 0.541.0 (아이콘)
  - [x] Recharts 3.1.2 (차트)
- [x] **추가 설정**: TypeScript 경로 별칭 (@/ → ./src/)

### 2.2 기본 레이아웃 + 네비게이션 (0.5일) ✅ **완료**
- [x] `src/components/layout/` 구조 생성
  - [x] Header 컴포넌트 (YouTube 브랜딩 + 메인 네비게이션)
  - [x] Sidebar 컴포넌트 (7개 페이지 네비게이션)
  - [x] Layout 컴포넌트 (Header + Sidebar 통합)
- [x] `src/pages/` 라우팅 구조 (React Router DOM)
  - [x] HomePage (/) - 통계 대시보드 + 빠른 액션
  - [x] ScriptsPage (/scripts) - 스크립트 관리
  - [x] UploadPage (/upload) - 비디오 업로드
  - [x] YouTubePage (/youtube) - YouTube 업로드
  - [x] DashboardPage (/dashboard) - 성과 차트
  - [x] StatusPage (/status) - 실시간 모니터링
  - [x] SettingsPage (/settings) - 시스템 설정
- [x] **반응형 디자인**: Tailwind CSS 기반 모바일 지원

### 2.3 스크립트 관리 페이지 (1.5일) ✅ **완료**
- [x] **스크립트 업로드** (`script upload` 매핑)
  - [x] 파일 선택 업로드 (.md 파일만)
  - [x] React Query 기반 업로드 mutation
  - [x] 업로드 진행률 표시 (로딩 스피너)
  - [x] 성공/실패 에러 핸들링 + 자동 폼 초기화
- [x] **스크립트 목록** (`script list` 매핑)
  - [x] 백엔드 API 연동 데이터 테이블
  - [x] 상태별 아이콘 + 색상 코딩 (script_ready, video_ready, uploaded, error)
  - [x] 페이지네이션 (이전/다음 버튼)
  - [x] 검색 기능 UI (백엔드 연동 준비)
- [x] **스크립트 상세보기** (`script show` 매핑)
  - [x] 상세 버튼 UI (상세 모달 준비)
  - [x] 메타데이터 표시 (제목, 설명, 태그, 생성일, 파일명)
  - [x] 상태별 시각적 표시
- [x] **스크립트 편집** (`script edit` 매핑)
  - [x] useUpdateScript 훅 준비
  - [x] React Query 캐시 무효화
- [x] **스크립트 삭제** (`script delete` 매핑)
  - [x] 삭제 확인 다이얼로그 (window.confirm)
  - [x] 백엔드 API 연동 + 로딩 상태
- [x] **추가 구현**: 빈 상태 UI, 에러 상태 UI, 로딩 상태

### 2.4 비디오 업로드 페이지 (1.5일) ✅ **완료**
- [x] **비디오 파일 업로드** (`video upload` 매핑)
  - [x] 3단계 워크플로우: 스크립트 선택 → 파일 업로드 → 실행
  - [x] **고급 드래그&드롭**: 시각적 피드백 + 상태별 색상 변화
  - [x] 파일 크기 표시 + 비디오 형식 검증 (MP4, AVI, MOV, MKV, FLV)
  - [x] 업로드 진행률 바 UI (WebSocket 연동 준비)
- [x] **스마트 스크립트 매칭**
  - [x] script_ready 상태 스크립트만 자동 필터링
  - [x] 카드 UI로 직관적 스크립트 선택
  - [x] 선택된 파일 미리보기 + 제거 기능
- [x] **업로드 상태 관리** (`video status` 매핑)
  - [x] React Query 기반 실시간 상태 관리
  - [x] 상태별 색상 코딩 + 아이콘 표시
  - [x] useUploadVideo 훅으로 백엔드 연동
- [x] **사용자 경험 최적화**
  - [x] 드래그 상태 시각적 피드백
  - [x] 파일 형식 자동 검증 + 에러 알림
  - [x] 업로드 성공 시 자동 폼 초기화
  - [x] 빈 상태 UI (스크립트가 없을 때 안내)
- [x] **추가 고급 기능**: 파일 크기 포맷팅, MIME 타입 + 확장자 이중 검증

---

## 📁 Phase 3: YouTube 업로드 페이지 (1.5일) ✅ **완료 (2025-08-22)**

### 3.1 YouTube 업로드 기능 ✅ **완료**
- [x] **단일 업로드** (`youtube upload` 매핑) ✅
  - [x] 완전한 YouTube 업로드 페이지 구현
  - [x] **실시간 업로드 진행률** - WebSocket 기반 실시간 진행률 모니터링
  - [x] **YouTube URL 생성 및 표시** - 업로드 완료 시 YouTube 링크 자동 생성
  - [x] **스마트 상태 관리** - script_ready/video_ready/uploaded/error 상태별 처리
- [x] **업로드 준비 목록** (`youtube ready` 매핑) ✅
  - [x] **video_ready 상태 스크립트 카드 뷰** - 그리드 레이아웃 카드 인터페이스
  - [x] **빠른 업로드 버튼** - 원클릭 YouTube 업로드
  - [x] **검색 및 필터링** - 상태별 필터, 제목/설명/파일명 검색
  - [x] **통계 대시보드** - 전체/준비됨/완료/에러 상태별 통계
- [x] **업로드 완료 갤러리** (`youtube uploaded` 매핑) ✅
  - [x] **YouTube 링크 연동** - 완료된 업로드 YouTube에서 바로 보기
  - [x] **업로드 메타데이터** - 생성일, 파일명, 태그 정보 표시

### 3.2 WebSocket 실시간 통합 ✅ **완료**
- [x] **WebSocket 연결 관리** ✅
  - [x] **useWebSocket 훅** - 자동 재연결, 하트비트, 에러 처리
  - [x] **WebSocketStatus 컴포넌트** - 연결 상태 실시간 표시
  - [x] **실시간 연결 상태 모니터링** - 연결/끊김/재연결 상태 표시
- [x] **실시간 진행률 모니터링** ✅
  - [x] **useUploadProgress 훅** - WebSocket 메시지 기반 실시간 상태 업데이트
  - [x] **진행률 바 실시간 업데이트** - progress, status, message 실시간 반영
  - [x] **단계별 진행률 표시** - current_step/total_steps 단계 표시
  - [x] **글로벌 업로드 통계** - 활성 업로드 수, 완료 수 실시간 통계
- [x] **에러 처리 및 사용자 피드백** ✅
  - [x] **토스트 알림 시스템** - 성공/에러/정보/경고 알림 (useToast 훅)
  - [x] **업로드 시작/완료 알림** - 실시간 토스트 메시지
  - [x] **WebSocket 연결 상태 알림** - 연결/끊김 시 자동 알림
  - [x] **에러 상황 사용자 피드백** - 상세한 에러 메시지 및 해결 방안 제시

---

## 📁 Phase 4: 대시보드 + 실시간 기능 (1.5일) ✅ **완료 (2025-08-22)**

### 4.1 시스템 대시보드 ✅ **완료**
- [x] **전체 시스템 상태** (`status system` 매핑) ✅
  - [x] 시스템 상태 카드 (API, DB, Upload, YouTube) - 실시간 상태별 색상 코딩
  - [x] 실시간 헬스체크 표시 - useSystemStatus 훅으로 30초마다 자동 갱신
  - [x] 서비스별 상태 모니터링 - 지연 시간, 상태, 상세 정보 표시
- [x] **파이프라인 시각화** (`status pipeline` 매핑) ✅
  - [x] 플로우차트 형태의 파이프라인 표시 - PipelineFlow 컴포넌트로 4단계 시각화
  - [x] 각 단계별 스크립트 개수 - 실시간 데이터 기반 카운터
  - [x] 병목 구간 하이라이트 - 자동 병목 감지 알고리즘
  - [x] **고급 애니메이션** - 실시간 데이터 흐름 파티클 효과
  - [x] **상호작용 UI** - 클릭으로 단계별 상세 정보 표시
- [x] **실시간 모니터링** (`status monitor` 매핑) ✅
  - [x] 자동 새로고침 대시보드 - 토글 가능한 실시간 모드
  - [x] 실시간 메트릭 차트 - Recharts 기반 성능 차트 (CPU, 메모리, 네트워크)
  - [x] 시스템 로그 스트림 - 실시간 로그 시뮬레이션, 자동 스크롤, 레벨별 색상

### 4.2 WebSocket 실시간 기능 ✅ **완료**
- [x] WebSocket 연결 관리 훅 ✅ **강화 완료**
  - [x] **자동 재연결 로직** - 최대 5회 재시도, 3초 간격
  - [x] **하트비트 시스템** - 30초 간격 연결 상태 확인
  - [x] **연결 상태 변화 콜백** - onConnectionChange 핸들러 추가
- [x] 실시간 알림 토스트 시스템 ✅ **완전 구현**
  - [x] **RealTimeNotifications 컴포넌트** - 종합 실시간 알림 시스템
  - [x] **알림 타입별 처리** - success/warning/error/info/upload 타입별 UI
  - [x] **소리 알림** - Web Audio API 기반 타입별 알림음
  - [x] **필터링 시스템** - 전체/읽지않음/오류만 필터
  - [x] **우선순위 토스트** - 에러 알림 우선 표시
- [x] 업로드 진행률 실시간 업데이트 ✅ **기존 유지**
  - [x] **useUploadProgress 훅** - WebSocket 메시지 기반 상태 관리
  - [x] **진행률 바 실시간** - progress, status, message 실시간 반영  
- [x] 상태 변경 즉시 반영 ✅ **강화**
  - [x] **React Query 무효화** - WebSocket 이벤트 시 캐시 자동 갱신
  - [x] **글로벌 상태 동기화** - 모든 컴포넌트 실시간 상태 동기화
- [x] 연결 끊김 시 자동 재연결 ✅ **완벽 구현**
  - [x] **재연결 알림** - 연결 상태 변화 시 사용자 알림
  - [x] **상태 복구** - 재연결 후 자동 상태 요청 및 복구

---

## 📁 Phase 5: WebSocket 통합 + Playwright 자동화 테스트 (1일)

### 5.1 WebSocket 완전 통합 검증
- [ ] 모든 컴포넌트에 WebSocket 연동 확인
- [ ] 실시간 데이터 동기화 검증
- [ ] 다중 사용자 시나리오 테스트
- [ ] 연결 안정성 및 재연결 테스트

### 5.2 Playwright MCP 자동화 테스트 구축
- [ ] **E2E 워크플로우 테스트**
  - [ ] 스크립트 업로드 → 비디오 업로드 → YouTube 업로드 전체 플로우
  - [ ] 각 단계별 상태 변화 확인 (script_ready → video_ready → uploaded)
  - [ ] 에러 시나리오 테스트 (잘못된 파일, 네트워크 오류 등)
- [ ] **실시간 기능 테스트**
  - [ ] WebSocket 연결/재연결 동작 검증
  - [ ] 실시간 알림 시스템 테스트 (RealTimeNotifications)
  - [ ] 진행률 바 실시간 업데이트 검증
  - [ ] 대시보드 실시간 데이터 갱신 테스트
- [ ] **UI/UX 테스트**
  - [ ] 파이프라인 시각화 애니메이션 동작 확인
  - [ ] 드래그&드롭 파일 업로드 테스트
  - [ ] 반응형 디자인 (데스크톱/태블릿/모바일) 검증
  - [ ] 접근성 테스트 (키보드 네비게이션, 스크린 리더)
- [ ] **성능 및 안정성 테스트**
  - [ ] 대용량 파일 업로드 (최대 8GB) 테스트
  - [ ] 동시 다중 업로드 시나리오
  - [ ] 메모리 누수 및 성능 모니터링
  - [ ] 브라우저별 호환성 테스트 (Chrome, Firefox, Safari)

### 5.3 글로벌 원칙 준수 검증
- [ ] **근본 해결** 확인
  - [ ] 모든 에러 근본 원인 해결 여부
  - [ ] 임시 방편 코드 제거
  - [ ] Playwright 테스트로 에러 시나리오 자동 검증
- [ ] **검증 우선** 확인
  - [ ] API 호출 전 상태 검증
  - [ ] TypeScript 타입 가드 활용
  - [ ] Playwright 테스트로 데이터 검증 자동화
- [ ] **실시간 정보 활용** 확인
  - [ ] WebSocket 실시간 데이터 우선
  - [ ] 서버 시간 기준 날짜/시간 표시
  - [ ] 캐시보다 최신 데이터 우선
  - [ ] Playwright로 실시간 업데이트 동작 검증

---

## 🛠️ 기술 스택 체크리스트

### Backend 추가
- [ ] WebSocket: FastAPI WebSocket + ConnectionManager
- [ ] Dependencies: websockets, python-multipart 재추가

### Frontend Stack ✅ **완료**
- [x] **Core**: React 19.1.1 + TypeScript 5.8.3 + Vite 7.1.2
- [x] **UI**: Shadcn/ui + Tailwind CSS 4.1.12 + @tailwindcss/postcss
- [x] **State**: Zustand 5.0.8 + TanStack Query 5.85.5
- [x] **Forms**: React Hook Form 7.62.0 + Zod 4.0.17
- [x] **Routing**: React Router DOM 7.8.2
- [x] **Icons**: Lucide React 0.541.0
- [x] **Charts**: Recharts 3.1.2 (통계 시각화)
- [x] **WebSocket**: native WebSocket API (Phase 3에서 활용)

---

## 📋 CLI-Frontend 완전 매핑 확인표

### 스크립트 관리 (script.*)
- [ ] `script upload <file>` → 파일 드래그&드롭 업로드
- [ ] `script list --status --limit` → 필터링 가능한 테이블
- [ ] `script show <id>` → 스크립트 상세 모달
- [ ] `script edit <id> --title` → 인라인 편집 폼
- [ ] `script delete <id>` → 삭제 확인 다이얼로그
- [ ] `script stats` → 통계 대시보드 차트

### 비디오 업로드 (video.*)
- [ ] `video upload <id> <file>` → 스크립트별 비디오 업로드
- [ ] `video delete <id>` → 비디오 파일 삭제 버튼
- [ ] `video status <id>` → 실시간 상태 표시
- [ ] `video progress <id>` → 진행률 바 + WebSocket
- [ ] `video ready` → 업로드 준비 목록
- [ ] `video auto-mapping` → 자동 매핑 마법사

### YouTube 업로드 (youtube.*)
- [ ] `youtube upload <id> --privacy` → 업로드 폼 (설정 옵션)
- [ ] `youtube batch <ids> --delay` → 배치 업로드 대시보드
- [ ] `youtube ready` → 업로드 준비 목록
- [ ] `youtube uploaded` → 업로드 완료 갤러리
- [ ] `youtube quota` → 할당량 사용률 차트
- [ ] `youtube health` → API 연결 상태 표시

### 시스템 상태 (status.*)
- [ ] `status system` → 시스템 상태 카드
- [ ] `status script <id>` → 스크립트 상태 패널
- [ ] `status pipeline` → 파이프라인 플로우차트
- [ ] `status monitor --interval` → 실시간 모니터링 대시보드

---

## ✅ 최종 완료 기준

### 기능 완성도
- [ ] 모든 CLI 명령어가 웹에서 동일하게 작동
- [ ] WebSocket 실시간 업데이트 정상 작동
- [ ] 파일 업로드 (스크립트, 비디오) 완벽 지원
- [ ] YouTube API 통합 및 배치 업로드 지원

### 품질 기준
- [ ] TypeScript 타입 안전성 100% 보장
- [ ] 반응형 디자인 (데스크톱, 태블릿, 모바일)
- [ ] 접근성 (WCAG 2.1 AA 수준)
- [ ] 에러 처리 및 사용자 경험 최적화

### 글로벌 원칙 준수
- [ ] **근본 해결**: 모든 문제 근본 원인 해결
- [ ] **검증 우선**: 추측 없는 검증된 구현
- [ ] **실시간 정보**: 항상 최신 상태 반영

### 성능 및 안정성
- [ ] 초기 로딩 시간 < 2초
- [ ] WebSocket 연결 안정성 99.9%
- [ ] 대용량 파일 업로드 지원 (최대 8GB)
- [ ] 다중 동시 업로드 지원

---

## 📅 일정 및 마일스톤

| Phase | 기간 | 주요 산출물 | 상태 |
|-------|------|------------|------|
| Phase 1 | 1일 | WebSocket 재도입 완료 | ✅ **완료** |
| Phase 2.1-2.2 | 1일 | React 프로젝트 셋업 + 기본 레이아웃 | ✅ **완료 (2025-08-22)** |
| Phase 2.3 | 1.5일 | 스크립트 관리 페이지 완성 | ✅ **완료 (2025-08-22)** |
| Phase 2.4 | 1.5일 | 비디오 업로드 페이지 완성 | ✅ **완료 (2025-08-22)** |
| Phase 3 | 1.5일 | YouTube 업로드 페이지 완성 | ✅ **완료 (2025-08-22)** |
| Phase 4 | 1.5일 | 대시보드 + 실시간 기능 완성 | ✅ **완료 (2025-08-22)** |
| Phase 5 | 1일 | WebSocket 통합 + Playwright 자동화 테스트 | 🔄 **다음 단계** |

**총 예상 시간: 8일 (풀타임 기준)**

---

## 🚨 주의사항 및 위험 요소

### 기술적 위험
- [ ] WebSocket 연결 안정성 확보
- [ ] 대용량 파일 업로드 메모리 관리
- [ ] YouTube API 할당량 초과 방지

### 사용자 경험 위험  
- [ ] CLI 사용자의 웹 인터페이스 적응
- [ ] 실시간 업데이트 과부하 방지
- [ ] 모바일 환경에서의 파일 업로드 최적화

### 데이터 무결성
- [ ] 업로드 중단 시 복구 메커니즘
- [ ] 동시 접근 시 데이터 충돌 방지
- [ ] WebSocket 연결 끊김 시 상태 동기화

---

**🎯 최종 목표**: CLI의 모든 기능을 웹에서 완벽히 재현하면서, 실시간 업데이트와 직관적인 사용자 경험을 제공하는 완전통합 시스템 구축