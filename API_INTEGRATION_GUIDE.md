# 프론트엔드/백엔드 API 연동 가이드

## 목차
1. [API 기본 구조](#api-기본-구조)
2. [인증 및 CORS](#인증-및-cors)
3. [에러 처리 패턴](#에러-처리-패턴)
4. [파일 업로드 처리](#파일-업로드-처리)
5. [상태 동기화](#상태-동기화)
6. [타입 안전성](#타입-안전성)
7. [테스트 가이드](#테스트-가이드)

## API 기본 구조

### 백엔드 API 스펙

#### 베이스 URL
```
Development: http://localhost:8000
Production: https://api.yourdomain.com
```

#### 응답 형식
모든 API는 일관된 응답 형식을 사용합니다:

```typescript
// 성공 응답
{
  "success": true,
  "data": { ... },
  "message": "작업 완료"
}

// 에러 응답
{
  "success": false,
  "error": "오류 메시지",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### API 엔드포인트 목록

#### 1. 헬스체크
```typescript
GET /health
Response: {
  "status": "healthy",
  "database": "connected", 
  "api": "operational"
}
```

#### 2. 대본 관리 API
```typescript
// 대본 업로드
POST /api/scripts/upload
Content-Type: multipart/form-data
Body: { file: File }
Response: Script

// 대본 목록 조회
GET /api/scripts?page=1&limit=10&status=all
Response: {
  "scripts": Script[],
  "total": number,
  "page": number,
  "limit": number
}

// 대본 상세 조회
GET /api/scripts/{id}
Response: Script

// 대본 수정
PUT /api/scripts/{id}
Body: Partial<Script>
Response: Script

// 대본 삭제
DELETE /api/scripts/{id}
Response: { message: string }
```

#### 3. 비디오 업로드 API
```typescript
// 비디오 파일 업로드
POST /api/upload/video/{script_id}
Content-Type: multipart/form-data
Body: { video_file: File }
Response: {
  "id": number,
  "title": string,
  "status": string,
  "video_file_path": string,
  "file_size": number,
  "message": string
}

// YouTube 업로드
POST /api/upload/youtube/{script_id}
Body: {
  "scheduled_time"?: string,
  "privacy_status": "private" | "unlisted" | "public",
  "category_id": number
}
Response: {
  "id": number,
  "youtube_video_id": string,
  "youtube_url": string,
  "status": string
}

// 업로드 상태 조회
GET /api/upload/status/{script_id}
Response: {
  "id": number,
  "status": string,
  "has_video_file": boolean,
  "youtube_video_id"?: string,
  "video_file_info"?: { ... }
}

// 비디오 파일 삭제
DELETE /api/upload/video/{script_id}
Response: { message: string }
```

## 인증 및 CORS

### CORS 설정 확인
백엔드에서 이미 CORS가 설정되어 있습니다:

```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React 개발 서버
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### YouTube API 인증
YouTube 업로드는 OAuth 2.0을 사용하며, 서버 측에서 처리됩니다. 프론트엔드에서는 별도 인증 불필요.

## 에러 처리 패턴

### 1. API 클라이언트 기본 구조

```typescript
// src/utils/api.ts
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: any;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // HTTP 상태 코드 확인
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // 네트워크 오류 등
      throw new ApiError('네트워크 오류가 발생했습니다.', 0, 'NETWORK_ERROR');
    }
  }

  // GET 요청
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST 요청 (JSON)
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // POST 요청 (FormData)
  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // FormData는 Content-Type을 자동 설정
    });
  }

  // PUT, DELETE 등 추가 메서드들...
}

// 커스텀 에러 클래스
class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API 클라이언트 인스턴스
export const apiClient = new ApiClient(
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'
);

export { ApiError };
```

### 2. 에러 핸들링 훅

```typescript
// src/hooks/useErrorHandler.ts
import { useState, useCallback } from 'react';
import { ApiError } from '../utils/api';

interface ErrorState {
  message: string;
  code?: string;
  isVisible: boolean;
}

export const useErrorHandler = () => {
  const [error, setError] = useState<ErrorState>({
    message: '',
    isVisible: false,
  });

  const handleError = useCallback((err: unknown) => {
    let message = '알 수 없는 오류가 발생했습니다.';
    let code: string | undefined;

    if (err instanceof ApiError) {
      message = err.message;
      code = err.code;
      
      // 특정 에러 코드에 따른 처리
      if (err.status === 401) {
        // 인증 오류 - 로그인 페이지로 리다이렉트
        window.location.href = '/login';
        return;
      } else if (err.status >= 500) {
        message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
    } else if (err instanceof Error) {
      message = err.message;
    }

    setError({
      message,
      code,
      isVisible: true,
    });

    // 자동으로 5초 후 에러 메시지 숨김
    setTimeout(() => {
      setError(prev => ({ ...prev, isVisible: false }));
    }, 5000);
  }, []);

  const clearError = useCallback(() => {
    setError({ message: '', isVisible: false });
  }, []);

  return { error, handleError, clearError };
};
```

## 파일 업로드 처리

### 1. 대본 파일 업로드 훅

```typescript
// src/hooks/useScriptUpload.ts
import { useState, useCallback } from 'react';
import { apiClient, ApiError } from '../utils/api';
import { Script } from '../types';

export const useScriptUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadScript = useCallback(async (file: File): Promise<Script> => {
    if (!file) {
      throw new Error('파일을 선택해주세요.');
    }

    // 파일 확장자 검증
    if (!file.name.endsWith('.txt')) {
      throw new Error('txt 파일만 업로드 가능합니다.');
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // XMLHttpRequest를 사용해 업로드 진행률 추적
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setProgress(Math.round(percentComplete));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (e) {
              reject(new Error('응답 파싱 오류'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new ApiError(error.detail || '업로드 실패', xhr.status));
            } catch (e) {
              reject(new ApiError(`업로드 실패 (${xhr.status})`, xhr.status));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('네트워크 오류'));
        };

        const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        xhr.open('POST', `${baseURL}/api/scripts/upload`);
        xhr.send(formData);
      });

    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, []);

  return { uploadScript, uploading, progress };
};
```

### 2. 비디오 파일 업로드 훅

```typescript
// src/hooks/useVideoUpload.ts
import { useState, useCallback } from 'react';
import { apiClient } from '../utils/api';

export const useVideoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadVideo = useCallback(async (scriptId: number, videoFile: File) => {
    if (!videoFile) {
      throw new Error('비디오 파일을 선택해주세요.');
    }

    // 파일 크기 검증 (2GB 제한)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (videoFile.size > maxSize) {
      throw new Error('파일 크기가 너무 큽니다. (최대 2GB)');
    }

    // 파일 확장자 검증
    const allowedExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    const fileExtension = '.' + videoFile.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`지원되지 않는 파일 형식입니다. (${allowedExtensions.join(', ')})`);
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('video_file', videoFile);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setProgress(Math.round(percentComplete));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (e) {
              reject(new Error('응답 파싱 오류'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new ApiError(error.detail || '업로드 실패', xhr.status));
            } catch (e) {
              reject(new ApiError(`업로드 실패 (${xhr.status})`, xhr.status));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('네트워크 오류'));
        };

        const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        xhr.open('POST', `${baseURL}/api/upload/video/${scriptId}`);
        xhr.send(formData);
      });

    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, []);

  return { uploadVideo, uploading, progress };
};
```

## 상태 동기화

### 1. React Query를 이용한 서버 상태 관리

```typescript
// src/hooks/useScripts.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '../utils/api';
import { Script } from '../types';

interface ScriptsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const useScripts = (params: ScriptsParams = {}) => {
  return useQuery(
    ['scripts', params],
    () => apiClient.get<{
      scripts: Script[];
      total: number;
      page: number;
      limit: number;
    }>(`/api/scripts?${new URLSearchParams(params as any)}`),
    {
      staleTime: 30000, // 30초간 fresh 상태 유지
      cacheTime: 300000, // 5분간 캐시 유지
    }
  );
};

export const useScript = (id: number) => {
  return useQuery(
    ['script', id],
    () => apiClient.get<Script>(`/api/scripts/${id}`),
    {
      enabled: !!id, // id가 있을 때만 쿼리 실행
    }
  );
};

export const useUploadStatus = (scriptId: number) => {
  return useQuery(
    ['upload-status', scriptId],
    () => apiClient.get(`/api/upload/status/${scriptId}`),
    {
      enabled: !!scriptId,
      refetchInterval: (data) => {
        // 업로드 진행 중이면 5초마다 갱신
        if (data?.status === 'uploading') {
          return 5000;
        }
        return false;
      },
    }
  );
};

// 뮤테이션 훅들
export const useDeleteScript = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (id: number) => apiClient.delete(`/api/scripts/${id}`),
    {
      onSuccess: () => {
        // 삭제 성공 시 목록 다시 불러오기
        queryClient.invalidateQueries(['scripts']);
      },
    }
  );
};

export const useYouTubeUpload = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ scriptId, options }: {
      scriptId: number;
      options: {
        scheduled_time?: string;
        privacy_status: string;
        category_id: number;
      };
    }) => apiClient.post(`/api/upload/youtube/${scriptId}`, options),
    {
      onSuccess: (_, { scriptId }) => {
        // 업로드 성공 시 해당 스크립트 상태 갱신
        queryClient.invalidateQueries(['script', scriptId]);
        queryClient.invalidateQueries(['upload-status', scriptId]);
        queryClient.invalidateQueries(['scripts']);
      },
    }
  );
};
```

### 2. Context를 이용한 전역 상태 관리

```typescript
// src/contexts/AppContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface AppState {
  user: null | { name: string; email: string };
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    timestamp: number;
  }>;
  settings: {
    defaultPrivacyStatus: 'private' | 'unlisted' | 'public';
    defaultCategoryId: number;
  };
}

type AppAction = 
  | { type: 'SET_USER'; payload: AppState['user'] }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<AppState['notifications'][0], 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> };

const initialState: AppState = {
  user: null,
  notifications: [],
  settings: {
    defaultPrivacyStatus: 'private',
    defaultCategoryId: 22, // People & Blogs
  },
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'ADD_NOTIFICATION':
      const newNotification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      return {
        ...state,
        notifications: [...state.notifications, newNotification],
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// 편의 훅들
export const useNotification = () => {
  const { dispatch } = useAppContext();

  const addNotification = (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  return { addNotification, removeNotification };
};
```

## 타입 안전성

### TypeScript 타입 정의

```typescript
// src/types/index.ts

// 백엔드 모델과 일치하는 타입 정의
export interface Script {
  id: number;
  title: string;
  content: string;
  description?: string;
  tags?: string;
  thumbnail_prompt?: string;
  video_file_path?: string;
  youtube_video_id?: string;
  scheduled_time?: string;
  status: 'script_ready' | 'video_ready' | 'uploaded' | 'scheduled' | 'error';
  created_at: string;
  updated_at: string;
}

// API 요청/응답 타입
export interface ScriptsListResponse {
  scripts: Script[];
  total: number;
  page: number;
  limit: number;
}

export interface UploadStatusResponse {
  id: number;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  has_video_file: boolean;
  youtube_video_id?: string;
  scheduled_time?: string;
  video_file_info?: {
    file_path: string;
    file_size: number;
    filename: string;
  };
  youtube_url?: string;
}

export interface YouTubeUploadRequest {
  scheduled_time?: string;
  privacy_status: 'private' | 'unlisted' | 'public';
  category_id: number;
}

export interface YouTubeUploadResponse {
  id: number;
  title: string;
  status: string;
  youtube_video_id: string;
  youtube_url: string;
  privacy_status: string;
  scheduled_time?: string;
  message: string;
  upload_timestamp: string;
}

// 폼 데이터 타입
export interface ScriptFormData {
  file: File;
}

export interface VideoUploadFormData {
  video_file: File;
}

// UI 상태 타입
export interface UploadProgress {
  isUploading: boolean;
  progress: number;
  phase: 'script' | 'video' | 'youtube';
  message?: string;
}
```

## 테스트 가이드

### 1. API 클라이언트 테스트

```typescript
// src/utils/__tests__/api.test.ts
import { apiClient, ApiError } from '../api';

// Mock fetch
global.fetch = jest.fn();

describe('ApiClient', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should handle successful GET request', async () => {
    const mockData = { id: 1, title: 'Test' };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await apiClient.get('/test');
    
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual(mockData);
  });

  it('should handle API error response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad Request', code: 'INVALID_DATA' }),
    });

    await expect(apiClient.get('/test')).rejects.toThrow(ApiError);
    await expect(apiClient.get('/test')).rejects.toThrow('Bad Request');
  });

  it('should handle network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

    await expect(apiClient.get('/test')).rejects.toThrow('네트워크 오류가 발생했습니다.');
  });
});
```

### 2. 커스텀 훅 테스트

```typescript
// src/hooks/__tests__/useScriptUpload.test.ts
import { renderHook, act } from '@testing-library/react';
import { useScriptUpload } from '../useScriptUpload';

// XMLHttpRequest 모킹
const mockXHR = {
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  readyState: 4,
  status: 200,
  response: JSON.stringify({ id: 1, title: 'Test Script' }),
  upload: { onprogress: null },
  onload: null,
  onerror: null,
};

(global as any).XMLHttpRequest = jest.fn(() => mockXHR);

describe('useScriptUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upload script file successfully', async () => {
    const { result } = renderHook(() => useScriptUpload());
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    let uploadPromise: Promise<any>;
    
    act(() => {
      uploadPromise = result.current.uploadScript(file);
      
      // 업로드 진행률 시뮬레이션
      if (mockXHR.upload.onprogress) {
        mockXHR.upload.onprogress({
          lengthComputable: true,
          loaded: 50,
          total: 100,
        } as ProgressEvent);
      }
      
      // 완료 시뮬레이션
      if (mockXHR.onload) {
        mockXHR.onload({} as ProgressEvent);
      }
    });

    const result_upload = await uploadPromise!;
    
    expect(mockXHR.open).toHaveBeenCalledWith('POST', expect.stringContaining('/api/scripts/upload'));
    expect(result_upload).toEqual({ id: 1, title: 'Test Script' });
    expect(result.current.uploading).toBe(false);
  });

  it('should reject invalid file type', async () => {
    const { result } = renderHook(() => useScriptUpload());
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    await expect(result.current.uploadScript(file)).rejects.toThrow('txt 파일만 업로드 가능합니다.');
  });
});
```

### 3. 통합 테스트 예제

```typescript
// src/__tests__/integration/upload-flow.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { UploadPage } from '../pages/UploadPage';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Upload Flow Integration', () => {
  it('should complete script upload flow', async () => {
    // Mock API
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          title: 'Test Script',
          content: 'Test content',
          status: 'script_ready',
        }),
      });

    render(
      <Wrapper>
        <UploadPage />
      </Wrapper>
    );

    // 파일 업로드
    const fileInput = screen.getByLabelText(/파일 선택/);
    const file = new File(['script content'], 'script.txt', { type: 'text/plain' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    // 업로드 버튼 클릭
    const uploadButton = screen.getByText('대본 등록');
    fireEvent.click(uploadButton);

    // 성공 메시지 확인
    await waitFor(() => {
      expect(screen.getByText(/업로드 성공/)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/scripts/upload'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});
```

이 가이드를 참고하여 프론트엔드와 백엔드 간 안정적인 API 연동을 구현할 수 있습니다.