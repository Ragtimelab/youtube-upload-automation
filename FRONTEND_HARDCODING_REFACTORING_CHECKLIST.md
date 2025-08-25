# 프론트엔드 하드코딩 리팩토링 완전 체크리스트 v1.0

> **글로벌 원칙 준수**: 우회 금지, 추측 금지, 실시간 검증  
> **검증 표준**: 모든 단계 완료 후 lint 오류 해결 + Playwright MCP 검증 필수

## 📊 현재 하드코딩 현황 분석

### 🎨 스타일 관련 하드코딩
- **Tailwind CSS 클래스**: 1,288개 인스턴스 (52개 파일)
- **색상 값**: 하드코딩된 hex/tailwind 색상 (StatusPage, DashboardCharts)
- **크기/간격**: w-*, h-*, p-*, m-* 클래스 반복 패턴

### 📝 텍스트 관련 하드코딩
- **UI 레이블**: 63개 하드코딩된 텍스트 (버튼, 제목, 설명)
- **시스템 정보**: SettingsPage 버전 정보 하드코딩
- **상태 메시지**: 각 컴포넌트별 개별 정의

### 🔧 설정 관련 하드코딩
- **매직 넘버**: 파일 크기, 제한값, 간격
- **API URL**: 일부 컴포넌트 개별 정의
- **검증 규칙**: 파일 확장자, 크기 제한

---

## 🏗️ 리팩토링 전략

### Level 1 검증: 기본 상수/스타일 리팩토링
- ✅ **적용 대상**: Phase 1-2 (상수 중앙화, UI 패턴 표준화)
- 🔍 **검증 범위**: 변경된 페이지 개별 기능 테스트
- ⚡ **검증 시간**: 단축된 브라우저 테스트

### Level 2 검증: 구조적 변경
- ✅ **적용 대상**: Phase 3 (타입 안전성 강화)
- 🔍 **검증 범위**: 전체 시스템 통합 테스트
- 📋 **검증 내용**: CLI-Frontend 패리티 재검증

### Level 3 검증: 아키텍처 변경
- ✅ **적용 대상**: 향후 대규모 리팩토링 시만 사용
- 🔍 **검증 범위**: 전체 Phase 6 재실행

---

## Phase 1: 핵심 상수 중앙화 (Level 1 검증)

### 📋 Phase 1.1: Tailwind CSS 패턴 중앙화

#### ✅ 1.1.1 styles.ts 상수 파일 생성
- [ ] `frontend/src/constants/styles.ts` 생성
  ```typescript
  // 공통 스타일 패턴 중앙화
  export const COMMON_STYLES = {
    card: 'bg-white rounded-lg border border-gray-200 shadow-sm',
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
      danger: 'bg-red-600 hover:bg-red-700 text-white'
    },
    input: 'px-3 py-2 border border-gray-300 rounded-md',
    // ... 추가 패턴들
  }
  ```
- [ ] **검증**: 파일 생성 후 import 테스트
- [ ] **lint 체크**: `cd frontend/ && npm run lint`

#### ✅ 1.1.2 SettingsPage 리팩토링 (우선순위 #1)
- [ ] SettingsPage.tsx에서 반복되는 카드 스타일 교체
  - 기존: `"bg-white rounded-lg border border-gray-200 shadow-sm"`
  - 변경: `COMMON_STYLES.card`
- [ ] 버튼 스타일 교체
  - 기존: `"px-3 py-2 border border-gray-300 rounded-md text-sm"`
  - 변경: `COMMON_STYLES.input`
- [ ] **lint 체크**: `cd frontend/ && npm run lint`
- [ ] **Playwright 검증**: SettingsPage 접근 + 카테고리 드롭다운 동작 확인

#### ✅ 1.1.3 ScriptsPage 리팩토링
- [ ] 검색 입력 필드 스타일 교체
- [ ] 업로드 버튼 스타일 패턴 적용
- [ ] 테이블/카드 스타일 통일
- [ ] **lint 체크**: `cd frontend/ && npm run lint`
- [ ] **Playwright 검증**: 스크립트 검색 + 업로드 기능 테스트

#### ✅ 1.1.4 나머지 페이지 순차 리팩토링
- [ ] DashboardPage: 상태 카드 스타일 통일
- [ ] UploadPage: 드래그&드롭 영역 스타일
- [ ] YouTubePage: 필터 버튼 스타일 통일
- [ ] StatusPage: 로그 카드 스타일
- [ ] **lint 체크**: 각 페이지별 개별 확인

### 📋 Phase 1.2: 텍스트 상수 중앙화

#### ✅ 1.2.1 text.ts 상수 파일 생성
- [ ] `frontend/src/constants/text.ts` 생성
  ```typescript
  export const UI_TEXT = {
    common: {
      save: '저장',
      cancel: '취소',
      delete: '삭제',
      edit: '편집',
      // ...
    },
    settings: {
      title: '설정',
      description: '시스템 설정을 관리하고 환경을 구성하세요.',
      // ...
    },
    // ... 페이지별 텍스트
  }
  ```

#### ✅ 1.2.2 시스템 정보 동적화
- [ ] SettingsPage의 하드코딩된 버전 정보 제거
- [ ] package.json에서 버전 정보 동적 로드
  ```typescript
  // utils/systemInfo.ts 생성
  export const getSystemInfo = () => ({
    version: process.env.PACKAGE_VERSION || '1.0.0',
    buildDate: new Date().toISOString().split('T')[0]
  })
  ```
- [ ] **lint 체크**: `cd frontend/ && npm run lint`

### 📋 Phase 1.3: 검증 및 완료 확인

#### ✅ 1.3.1 전체 lint 검사
- [ ] `cd frontend/ && npm run lint` → 0 errors, 0 warnings
- [ ] TypeScript 컴파일 검사: `npm run build`

#### ✅ 1.3.2 Phase 1 Playwright 검증
- [ ] **Backend 서버 실행**: `cd backend/ && make run`
- [ ] **Frontend 서버 실행**: `cd frontend/ && npm run dev`
- [ ] **Playwright MCP 검증**:
  ```javascript
  // 1. 전체 페이지 접근성 테스트
  navigate('http://localhost:5174')
  // 각 페이지 링크 클릭 및 로딩 확인
  
  // 2. SettingsPage 기능 테스트
  navigate('http://localhost:5174/settings')
  // 카테고리 드롭다운 동작 확인
  // 시스템 정보 동적 로딩 확인
  
  // 3. ScriptsPage 핵심 기능
  navigate('http://localhost:5174/scripts')
  // 검색 필드 동작 확인
  // 업로드 버튼 스타일 적용 확인
  ```

---

## Phase 2: UI 패턴 표준화 (Level 1 검증)

### 📋 Phase 2.1: 컴포넌트 스타일 통합

#### ✅ 2.1.1 공통 UI 컴포넌트 스타일 확장
- [ ] `styles.ts`에 고급 패턴 추가
  ```typescript
  export const COMPONENT_STYLES = {
    modal: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center',
    tooltip: 'absolute z-10 px-2 py-1 text-sm bg-gray-800 text-white rounded',
    badge: {
      success: 'px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full',
      error: 'px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full',
      warning: 'px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full'
    }
  }
  ```

#### ✅ 2.1.2 상태별 색상 통합
- [ ] StatusPage의 하드코딩된 색상 교체
  - 기존: `"text-green-600"`, `"text-red-600"`
  - 변경: `ui.ts`의 `UI_CONSTANTS.COLORS.status` 사용
- [ ] DashboardPage 차트 색상 통합
- [ ] **lint 체크**: `cd frontend/ && npm run lint`

#### ✅ 2.1.3 반응형 패턴 표준화
- [ ] 그리드 레이아웃 패턴 중앙화
  ```typescript
  export const LAYOUT_STYLES = {
    grid: {
      responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      cards: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    },
    flex: {
      center: 'flex items-center justify-center',
      between: 'flex items-center justify-between',
    }
  }
  ```

### 📋 Phase 2.2: 검증 및 완료 확인

#### ✅ 2.2.1 전체 lint 검사
- [ ] `cd frontend/ && npm run lint` → 0 errors, 0 warnings
- [ ] TypeScript 컴파일 검사: `npm run build`

#### ✅ 2.2.2 Phase 2 Playwright 검증 (Level 1)
- [ ] **변경된 페이지별 개별 검증**:
  - StatusPage: 상태 색상 표시 확인
  - DashboardPage: 차트 색상 정상 표시
  - 반응형 레이아웃: 브라우저 크기 변경 테스트

---

## Phase 3: 타입 안전성 강화 (Level 2 검증)

### 📋 Phase 3.1: 강화된 상수 타입 정의

#### ✅ 3.1.1 타입 안전한 상수 시스템
- [ ] `types/constants.ts` 생성
  ```typescript
  export type UITheme = 'light' | 'dark'
  export type ButtonVariant = 'primary' | 'secondary' | 'danger'
  export type StatusType = 'success' | 'error' | 'warning' | 'processing'
  
  // 타입 안전한 상수 접근
  export const createTypedStyles = <T extends Record<string, any>>(styles: T): T => styles
  ```

#### ✅ 3.1.2 컴파일 타임 안전성 강화
- [ ] 모든 하드코딩된 문자열을 타입 안전한 상수로 교체
- [ ] enum 또는 const assertion 사용
  ```typescript
  export const ROUTES = {
    dashboard: '/dashboard',
    scripts: '/scripts',
    upload: '/upload',
    // ...
  } as const
  
  export type RouteKey = keyof typeof ROUTES
  ```

### 📋 Phase 3.2: 검증 및 완료 확인

#### ✅ 3.2.1 타입 안전성 검증
- [ ] `cd frontend/ && npm run lint` → 0 errors, 0 warnings
- [ ] TypeScript strict 모드 컴파일: `npm run build`
- [ ] 타입 에러 제로 확인

#### ✅ 3.2.2 Phase 3 Playwright 검증 (Level 2)
- [ ] **전체 시스템 통합 테스트**:
  ```javascript
  // 1. 전체 워크플로우 테스트
  // - 스크립트 업로드
  // - 비디오 업로드  
  // - YouTube 업로드
  // - 상태 모니터링
  
  // 2. 타입 안전성 런타임 검증
  // - 모든 상수 접근이 정상 동작하는지 확인
  // - 에러 처리가 타입 안전하게 동작하는지 확인
  ```

---

## 📋 최종 검증 체크리스트

### ✅ 글로벌 원칙 준수 확인
- [ ] **우회 금지**: 모든 하드코딩을 중앙화된 상수로 교체 (추측하지 않고 확인)
- [ ] **추측 금지**: 각 파일의 실제 사용량을 확인 후 리팩토링 적용
- [ ] **실시간 검증**: 모든 단계에서 lint + Playwright 검증 완료

### ✅ 코드 품질 최종 확인
- [ ] **Frontend Lint**: `cd frontend/ && npm run lint` → 완전 통과
- [ ] **TypeScript**: `npm run build` → 에러 제로
- [ ] **개발 서버**: 양쪽 서버 정상 실행 확인

### ✅ 기능 완전성 검증
- [ ] **8개 페이지 모든 접근 확인**
- [ ] **핵심 워크플로우 정상 동작**:
  - 스크립트 업로드/관리
  - 비디오 업로드
  - YouTube 업로드 및 상태 확인
- [ ] **실시간 WebSocket 통신 정상**
- [ ] **에러 처리 및 사용자 피드백 정상**

### ✅ 성능 및 안정성
- [ ] **메모리 사용량**: 이전 대비 변화 없음
- [ ] **로딩 시간**: 성능 저하 없음
- [ ] **브라우저 호환성**: Chrome/Firefox/Safari 정상

---

## 🚨 리팩토링 실행 시 주의사항

### 개발 환경 설정
```bash
# 1. 양쪽 서버 실행 확인 (필수!)
cd backend/ && make run     # Port 8000
cd frontend/ && npm run dev # Port 5174

# 2. Git 상태 깔끔하게 유지
git status  # 모든 변경사항 커밋 후 시작

# 3. 실행 환경 검증
curl http://localhost:8000/health     # Backend 상태
curl http://localhost:5174            # Frontend 상태
```

### 각 Phase 완료 후 필수 작업
1. **lint 검사**: `cd frontend/ && npm run lint`
2. **빌드 검사**: `npm run build`
3. **Playwright MCP 검증**: 해당 Level에 맞는 검증 실행
4. **Git 커밋**: 의미있는 단위로 커밋
5. **다음 Phase 진행 전 검증 완료 확인**

### 에러 발생 시 대응
- **lint 에러**: 즉시 해결 후 다음 단계 진행
- **TypeScript 에러**: 타입 정의 확인 및 수정
- **Playwright 실패**: 기능 동작 재확인 및 수정
- **빌드 실패**: 의존성 및 import 경로 확인

---

## ✅ 완료 기준

### Phase별 완료 조건
- **Phase 1**: 모든 상수 중앙화 + Level 1 검증 통과
- **Phase 2**: UI 패턴 표준화 + Level 1 검증 통과  
- **Phase 3**: 타입 안전성 강화 + Level 2 검증 통과

### 전체 프로젝트 완료 조건
- [ ] 모든 하드코딩 제거 (1,288개 → 0개)
- [ ] 중앙화된 상수 시스템 구축
- [ ] 타입 안전성 100% 보장
- [ ] CLI-Frontend 패리티 100% 유지
- [ ] 성능 저하 없음
- [ ] 8개 페이지 완전 동작

**🎯 최종 목표**: 유지보수성 극대화 + 1인 개발자 생산성 향상 + React 19 현대화 패턴 완벽 적용

---

> **📝 작업 진행 시**: 이 체크리스트의 각 항목을 하나씩 체크하며 진행  
> **🔍 검증 필수**: 각 단계 완료 후 반드시 해당 Level의 검증 실행  
> **🚀 글로벌 원칙**: 우회하지 않고, 추측하지 않고, 실시간으로 검증하며 진행