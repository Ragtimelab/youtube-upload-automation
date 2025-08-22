# 🚀 WebSocket 재도입 + React 프론트엔드 완전 구축 체크리스트

> **프로젝트**: YouTube 업로드 자동화 시스템  
> **목표**: WebSocket 기반 실시간 통신 + React 프론트엔드 완전 통합  
> **생성일**: 2025-08-22  
> **예상 완료**: 8일 (풀타임 기준)

## 📋 프로젝트 개요
YouTube 업로드 자동화 시스템에 **WebSocket 기반 실시간 통신**과 **React 프론트엔드**를 완전히 통합하여, CLI 기능을 100% 매핑하는 웹 인터페이스 구축

## 🎯 핵심 목표
- [ ] **WebSocket 재도입**: 실시간 업로드 진행률, 상태 변경 알림
- [ ] **React 프론트엔드**: Shadcn/ui + TypeScript + Vite 기반 모던 웹앱
- [ ] **CLI 완전 매핑**: 모든 CLI 명령어를 웹에서 동일하게 제공
- [ ] **글로벌 원칙 준수**: 근본 해결, 검증 우선, 실시간 정보 활용

---

## 📁 Phase 1: WebSocket 재도입 (Backend) - 1일

### 1.1 WebSocket Manager 재구축
- [ ] `backend/app/services/websocket_manager.py` 생성
  - [ ] ConnectionManager 클래스 구현
  - [ ] 연결 관리 (connect, disconnect, active_connections)
  - [ ] 방송 기능 (broadcast_message, send_to_client)
  - [ ] 상태 추적 (upload_progress, system_notifications)

### 1.2 WebSocket Router 추가
- [ ] `backend/app/routers/websocket.py` 재생성
  - [ ] `/ws` 엔드포인트 구현
  - [ ] WebSocket 연결 핸들러
  - [ ] 메시지 타입 정의 (progress, status_change, notification)
  - [ ] 에러 처리 및 연결 복구

### 1.3 의존성 및 통합
- [ ] `pyproject.toml`에 websockets, python-multipart 재추가
- [ ] `backend/app/main.py`에 WebSocket router 등록
- [ ] Upload Service에서 WebSocket 호출 추가
  - [ ] 비디오 업로드 진행률 브로드캐스트
  - [ ] YouTube 업로드 상태 변경 알림
  - [ ] 에러 상황 실시간 통지

---

## 📁 Phase 2: React 프론트엔드 완전 구축 - 3.5일

### 2.1 프로젝트 셋업 (0.5일)
- [ ] `frontend/` 디렉토리에 Vite + React + TypeScript 프로젝트 생성
- [ ] 핵심 의존성 설치
  - [ ] React 18.3.1 + React DOM
  - [ ] TypeScript 5.3.3
  - [ ] Vite 5.0.0
  - [ ] React Router DOM 6.20.1
- [ ] UI 및 상태 관리 라이브러리 설치
  - [ ] Shadcn/ui + Tailwind CSS
  - [ ] TanStack Query 5.17.1
  - [ ] Zustand 4.4.7
  - [ ] React Hook Form + Zod
  - [ ] Lucide React (아이콘)
  - [ ] Recharts (차트)

### 2.2 기본 레이아웃 + 네비게이션 (0.5일)
- [ ] `src/components/layout/` 구조 생성
  - [ ] Header 컴포넌트 (로고, 네비게이션)
  - [ ] Sidebar 컴포넌트 (주요 메뉴)
  - [ ] Footer 컴포넌트 (시스템 상태)
- [ ] `src/pages/` 라우팅 구조
  - [ ] Dashboard (/) - 대시보드
  - [ ] Scripts (/scripts) - 스크립트 관리
  - [ ] Upload (/upload) - 비디오 업로드
  - [ ] YouTube (/youtube) - YouTube 업로드
  - [ ] Settings (/settings) - 설정
- [ ] 반응형 디자인 (모바일 지원)

### 2.3 스크립트 관리 페이지 (1.5일)
- [ ] **스크립트 업로드** (`script upload` 매핑)
  - [ ] 드래그&드롭 파일 업로드 컴포넌트
  - [ ] 파일 검증 (.md 형식 확인)
  - [ ] 업로드 진행률 표시
  - [ ] 성공/실패 토스트 알림
- [ ] **스크립트 목록** (`script list` 매핑)
  - [ ] 필터링 가능한 데이터 테이블
  - [ ] 상태별 필터 (script_ready, video_ready, uploaded, error)
  - [ ] 페이지네이션 (무한 스크롤 또는 페이지 번호)
  - [ ] 검색 기능 (제목, 내용)
- [ ] **스크립트 상세보기** (`script show` 매핑)
  - [ ] 모달 또는 사이드 패널
  - [ ] 메타데이터 표시 (제목, 설명, 태그, 썸네일 등)
  - [ ] 내용 미리보기
- [ ] **스크립트 편집** (`script edit` 매핑)
  - [ ] 인라인 편집 폼
  - [ ] 실시간 검증 (Zod 스키마)
  - [ ] 낙관적 업데이트
- [ ] **스크립트 삭제** (`script delete` 매핑)
  - [ ] 삭제 확인 다이얼로그
  - [ ] 안전 장치 (중요 데이터 보호)
- [ ] **통계 대시보드** (`script stats` 매핑)
  - [ ] 상태별 통계 차트 (Recharts)
  - [ ] 생성일별 트렌드
  - [ ] 성공률 지표

### 2.4 비디오 업로드 페이지 (1.5일)
- [ ] **비디오 파일 업로드** (`video upload` 매핑)
  - [ ] 스크립트별 비디오 매칭 인터페이스
  - [ ] 드래그&드롭 + 파일 선택기
  - [ ] 파일 크기 및 형식 검증
  - [ ] 업로드 진행률 바 (WebSocket 연동)
- [ ] **업로드 상태 관리** (`video status` 매핑)
  - [ ] 실시간 상태 표시 카드
  - [ ] 상태별 색상 코딩
  - [ ] 다음 단계 안내
- [ ] **실시간 진행률** (`video progress` 매핑)
  - [ ] WebSocket 기반 실시간 업데이트
  - [ ] 진행률 바 + 백분율
  - [ ] 예상 완료 시간
  - [ ] 일시정지/취소 기능
- [ ] **비디오 파일 삭제** (`video delete` 매핑)
  - [ ] 삭제 버튼 + 확인 다이얼로그
  - [ ] 상태 롤백 확인
- [ ] **업로드 준비 목록** (`video ready` 매핑)
  - [ ] script_ready 상태 스크립트 목록
  - [ ] 일괄 업로드 선택 기능
- [ ] **자동 매핑 마법사** (`video auto-mapping` 매핑)
  - [ ] 날짜 기반 파일 매칭 UI
  - [ ] 미리보기 및 확인 단계
  - [ ] 배치 처리 진행률

---

## 📁 Phase 3: YouTube 업로드 페이지 (1.5일)

### 3.1 YouTube 업로드 기능
- [ ] **단일 업로드** (`youtube upload` 매핑)
  - [ ] 업로드 설정 폼 (공개설정, 카테고리, 예약발행)
  - [ ] 실시간 업로드 진행률
  - [ ] YouTube URL 생성 및 표시
- [ ] **배치 업로드** (`youtube batch` 매핑)
  - [ ] 여러 스크립트 선택 인터페이스
  - [ ] 업로드 간격 설정 (최소 30초)
  - [ ] 배치 진행률 대시보드
  - [ ] 개별 결과 표시
- [ ] **업로드 준비 목록** (`youtube ready` 매핑)
  - [ ] video_ready 상태 스크립트 카드 뷰
  - [ ] 빠른 업로드 버튼
- [ ] **업로드 완료 갤러리** (`youtube uploaded` 매핑)
  - [ ] YouTube 썸네일 + 링크
  - [ ] 업로드 일시, 조회수 등

### 3.2 YouTube API 관리
- [ ] **할당량 사용률** (`youtube quota` 매핑)
  - [ ] 실시간 할당량 차트
  - [ ] 남은 업로드 개수 표시
  - [ ] 리셋 시간 카운트다운
- [ ] **API 연결 상태** (`youtube health` 매핑)
  - [ ] 연결 상태 인디케이터
  - [ ] 채널 정보 표시
  - [ ] 권장 설정 안내

---

## 📁 Phase 4: 대시보드 + 실시간 기능 (1.5일)

### 4.1 시스템 대시보드
- [ ] **전체 시스템 상태** (`status system` 매핑)
  - [ ] 시스템 상태 카드 (API, DB, Upload, YouTube)
  - [ ] 실시간 헬스체크 표시
- [ ] **파이프라인 시각화** (`status pipeline` 매핑)
  - [ ] 플로우차트 형태의 파이프라인 표시
  - [ ] 각 단계별 스크립트 개수
  - [ ] 병목 구간 하이라이트
- [ ] **실시간 모니터링** (`status monitor` 매핑)
  - [ ] 자동 새로고침 대시보드
  - [ ] 실시간 메트릭 차트
  - [ ] 시스템 로그 스트림

### 4.2 WebSocket 실시간 기능
- [ ] WebSocket 연결 관리 훅
- [ ] 실시간 알림 토스트 시스템
- [ ] 업로드 진행률 실시간 업데이트
- [ ] 상태 변경 즉시 반영
- [ ] 연결 끊김 시 자동 재연결

---

## 📁 Phase 5: WebSocket 통합 + 최종 테스트 (1일)

### 5.1 WebSocket 완전 통합
- [ ] 모든 컴포넌트에 WebSocket 연동
- [ ] 실시간 데이터 동기화 검증
- [ ] 다중 사용자 시나리오 테스트
- [ ] 연결 안정성 테스트

### 5.2 글로벌 원칙 준수 검증
- [ ] **근본 해결** 확인
  - [ ] 모든 에러 근본 원인 해결 여부
  - [ ] 임시 방편 코드 제거
- [ ] **검증 우선** 확인
  - [ ] API 호출 전 상태 검증
  - [ ] TypeScript 타입 가드 활용
- [ ] **실시간 정보 활용** 확인
  - [ ] WebSocket 실시간 데이터 우선
  - [ ] 서버 시간 기준 날짜/시간 표시
  - [ ] 캐시보다 최신 데이터 우선

---

## 🛠️ 기술 스택 체크리스트

### Backend 추가
- [ ] WebSocket: FastAPI WebSocket + ConnectionManager
- [ ] Dependencies: websockets, python-multipart 재추가

### Frontend Stack
- [ ] **Core**: React 18.3.1 + TypeScript 5.3.3 + Vite 5.0.0
- [ ] **UI**: Shadcn/ui + Tailwind CSS  
- [ ] **State**: Zustand + TanStack Query
- [ ] **Forms**: React Hook Form + Zod
- [ ] **WebSocket**: native WebSocket API
- [ ] **Charts**: Recharts (통계 시각화)

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

| Phase | 기간 | 주요 산출물 |
|-------|------|------------|
| Phase 1 | 1일 | WebSocket 재도입 완료 |
| Phase 2.1-2.2 | 1일 | React 프로젝트 셋업 + 기본 레이아웃 |
| Phase 2.3 | 1.5일 | 스크립트 관리 페이지 완성 |
| Phase 2.4 | 1.5일 | 비디오 업로드 페이지 완성 |
| Phase 3 | 1.5일 | YouTube 업로드 페이지 완성 |
| Phase 4 | 1.5일 | 대시보드 + 실시간 기능 완성 |
| Phase 5 | 1일 | 통합 테스트 및 최종 검증 |

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