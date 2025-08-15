# UX/UI 설계 문서

## 목표 사용자
- **주 사용자**: 개인 개발자 (유튜브 콘텐츠 제작자)
- **콘텐츠 타겟**: 50-80세 시니어층 대상 유튜브 콘텐츠
- **사용 목적**: 시니어 대상 콘텐츠의 업로드 자동화 및 효율적 관리

## 디자인 원칙
1. **효율성**: 빠른 콘텐츠 업로드 및 관리 워크플로우
2. **명확성**: 업로드 상태와 진행률을 한눈에 파악
3. **안정성**: 업로드 실패 시 복구 및 재시도 메커니즘
4. **생산성**: 배치 업로드 및 예약 발행으로 시간 절약

## 페이지 구조

### 1. 메인 대시보드 (`/`)
```
┌─────────────────────────────────────────┐
│ YouTube 업로드 자동화                     │
├─────────────────────────────────────────┤
│ [대본 업로드]  [업로드 현황]  [설정]        │
├─────────────────────────────────────────┤
│ 최근 업로드 현황                         │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 대기 중: 2      │ │ 완료: 15        │ │
│ └─────────────────┘ └─────────────────┘ │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 업로드 중: 1    │ │ 오류: 0         │ │
│ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────┘
```

### 2. 대본 업로드 페이지 (`/upload`)
```
┌─────────────────────────────────────────┐
│ ← 돌아가기           대본 업로드          │
├─────────────────────────────────────────┤
│ 1단계: 대본 파일 선택                    │
│ ┌─────────────────────────────────────┐ │
│ │  [파일 선택] 또는 여기로 드래그        │ │
│ │  지원 형식: .txt                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 2단계: 대본 내용 확인                    │
│ ┌─────────────────────────────────────┐ │
│ │ 제목: [자동 감지된 제목]              │ │
│ │ 설명: [자동 감지된 설명]              │ │
│ │ 태그: [자동 감지된 태그]              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [취소]              [대본 등록]          │
└─────────────────────────────────────────┘
```

### 3. 업로드 관리 페이지 (`/manage`)
```
┌─────────────────────────────────────────┐
│ ← 돌아가기           업로드 관리          │
├─────────────────────────────────────────┤
│ [전체] [대기중] [완료] [오류]             │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 📝 건강한 아침 운동법                │ │
│ │ 상태: 비디오 업로드 대기              │ │
│ │ 등록: 2025-01-15 10:30              │ │
│ │ [비디오 업로드] [수정] [삭제]         │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 🎬 맛있는 김치찌개 레시피              │ │
│ │ 상태: ✅ YouTube 업로드 완료          │ │
│ │ YouTube: youtu.be/abc123            │ │
│ │ [YouTube에서 보기] [통계]             │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 4. 비디오 업로드 페이지 (`/video-upload/:id`)
```
┌─────────────────────────────────────────┐
│ ← 돌아가기      비디오 업로드             │
├─────────────────────────────────────────┤
│ 대본: 건강한 아침 운동법                 │
├─────────────────────────────────────────┤
│ 1단계: 비디오 파일 업로드                │
│ ┌─────────────────────────────────────┐ │
│ │  [비디오 파일 선택]                  │ │
│ │  지원 형식: MP4, AVI, MOV           │ │
│ │  최대 크기: 128GB                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 2단계: YouTube 업로드 설정               │
│ 공개 설정: [비공개 ▼]                   │
│ 예약 발행: [선택사항] 📅               │
│                                         │
│ [취소]              [YouTube에 업로드]   │
└─────────────────────────────────────────┘
```

## 컴포넌트 설계

### 핵심 컴포넌트
1. **FileUpload**: 드래그앤드롭 + 파일 선택
2. **StatusCard**: 업로드 상태 표시
3. **ScriptPreview**: 대본 미리보기
4. **UploadProgress**: 업로드 진행률
5. **ErrorBoundary**: 오류 처리

### 상태 관리
- **Context API** 사용 (Redux 대신 단순화)
- **업로드 상태**: `idle | uploading | success | error`
- **전역 상태**: 사용자 설정, 인증 정보

## API 연동 가이드

### 1. 에러 처리 패턴
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// 모든 API 호출에서 일관된 에러 처리
const handleApiError = (error: any) => {
  if (error.code === 401) {
    // 인증 오류
    redirectToLogin();
  } else if (error.code >= 500) {
    // 서버 오류
    showServerErrorMessage();
  } else {
    // 클라이언트 오류
    showUserErrorMessage(error.message);
  }
};
```

### 2. API 엔드포인트 매핑
```typescript
const API_ENDPOINTS = {
  // 대본 관리
  SCRIPTS: '/api/scripts',
  SCRIPT_UPLOAD: '/api/scripts/upload',
  SCRIPT_DETAIL: (id: number) => `/api/scripts/${id}`,
  
  // 비디오 업로드
  VIDEO_UPLOAD: (id: number) => `/api/upload/video/${id}`,
  YOUTUBE_UPLOAD: (id: number) => `/api/upload/youtube/${id}`,
  UPLOAD_STATUS: (id: number) => `/api/upload/status/${id}`,
  
  // 헬스체크
  HEALTH: '/health'
};
```

### 3. 타입 정의
```typescript
// 대본 데이터 타입
interface Script {
  id: number;
  title: string;
  content: string;
  description?: string;
  tags?: string;
  status: 'script_ready' | 'video_ready' | 'uploaded' | 'scheduled' | 'error';
  video_file_path?: string;
  youtube_video_id?: string;
  scheduled_time?: string;
  created_at: string;
  updated_at: string;
}

// 업로드 진행률
interface UploadProgress {
  scriptId: number;
  phase: 'video' | 'youtube';
  progress: number; // 0-100
  message: string;
}
```

### 4. React Hook 패턴
```typescript
// 커스텀 훅으로 API 로직 분리
const useScriptUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadScript = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(API_ENDPOINTS.SCRIPT_UPLOAD, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('업로드 실패');
      
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { uploadScript, uploading, progress, error };
};
```

## 반응형 디자인

### 브레이크포인트
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

### 주요 고려사항
- **터치 영역**: 최소 44px (모바일 표준)
- **폰트 크기**: 기본 14px (데스크톱), 16px (모바일)
- **색상 대비**: 충분한 시각적 구분
- **키보드 네비게이션** 및 단축키 지원

## 성능 최적화

### 1. 파일 업로드 최적화
- **청크 업로드**: 대용량 비디오 파일 분할 업로드
- **진행률 표시**: 실시간 업로드 진행률
- **재시도 메커니즘**: 네트워크 오류 시 자동 재시도

### 2. 코드 스플리팅
```typescript
// 페이지별 지연 로딩
const UploadPage = lazy(() => import('./pages/UploadPage'));
const ManagePage = lazy(() => import('./pages/ManagePage'));
```

### 3. 캐싱 전략
- **React Query** 사용으로 서버 상태 캐싱
- **Service Worker**를 통한 정적 리소스 캐싱

## 테스트 전략

### 1. 단위 테스트
- 모든 유틸리티 함수
- 커스텀 훅
- API 클라이언트

### 2. 통합 테스트  
- 파일 업로드 플로우
- API 연동 시나리오
- 에러 처리 시나리오

### 3. E2E 테스트
- 주요 사용자 플로우
- 크로스 브라우저 테스트

## 배포 및 모니터링

### 환경 설정
```bash
# 개발 환경
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development

# 운영 환경
REACT_APP_API_BASE_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production
```

### 에러 모니터링
- **Sentry** 통합으로 실시간 에러 추적
- **성능 모니터링**을 통한 사용자 경험 개선

이 문서를 기반으로 프론트엔드 개발 시 일관성 있고 안정적인 구현이 가능합니다.