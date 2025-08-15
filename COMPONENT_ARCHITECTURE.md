# 컴포넌트 구조 및 상태관리 설계

## 목차
1. [전체 아키텍처](#전체-아키텍처)
2. [디렉토리 구조](#디렉토리-구조)
3. [핵심 컴포넌트](#핵심-컴포넌트)
4. [상태 관리 전략](#상태-관리-전략)
5. [라우팅 구조](#라우팅-구조)
6. [재사용 가능한 컴포넌트](#재사용-가능한-컴포넌트)
7. [성능 최적화](#성능-최적화)

## 전체 아키텍처

```
┌─────────────────────────────────────────┐
│              App Component               │
├─────────────────────────────────────────┤
│  • React Query Provider                 │
│  • App Context Provider                 │
│  • Router                               │
│  • Global Error Boundary                │
│  • Notification System                  │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│            Page Components               │
├─────────────────────────────────────────┤
│  • Dashboard                            │
│  • ScriptUpload                         │
│  • VideoUpload                          │
│  • ScriptManagement                     │
│  • Settings                             │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          Feature Components              │
├─────────────────────────────────────────┤
│  • ScriptUploadForm                     │
│  • VideoUploadForm                      │
│  • ScriptList                           │
│  • UploadProgress                       │
│  • StatusCards                          │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│             UI Components                │
├─────────────────────────────────────────┤
│  • Button, Input, Modal                 │
│  • FileUpload, ProgressBar              │
│  • Card, Table, Form                    │
│  • Loading, Error, Empty States         │
└─────────────────────────────────────────┘
```

## 디렉토리 구조

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/           # 재사용 가능한 UI 컴포넌트
│   │   ├── ui/              # 기본 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── index.ts
│   │   ├── forms/           # 폼 컴포넌트
│   │   │   ├── FileUpload.tsx
│   │   │   ├── ScriptForm.tsx
│   │   │   └── VideoUploadForm.tsx
│   │   ├── layout/          # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   └── feedback/        # 피드백 컴포넌트
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorMessage.tsx
│   │       ├── EmptyState.tsx
│   │       └── Notification.tsx
│   ├── features/            # 기능별 컴포넌트 그룹
│   │   ├── dashboard/
│   │   │   ├── DashboardStats.tsx
│   │   │   ├── RecentUploads.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── scripts/
│   │   │   ├── ScriptList.tsx
│   │   │   ├── ScriptCard.tsx
│   │   │   ├── ScriptDetail.tsx
│   │   │   └── ScriptUpload.tsx
│   │   ├── uploads/
│   │   │   ├── VideoUpload.tsx
│   │   │   ├── YouTubeUpload.tsx
│   │   │   ├── UploadProgress.tsx
│   │   │   └── UploadStatus.tsx
│   │   └── settings/
│   │       ├── GeneralSettings.tsx
│   │       ├── YouTubeSettings.tsx
│   │       └── PreferenceSettings.tsx
│   ├── pages/               # 페이지 컴포넌트
│   │   ├── Dashboard.tsx
│   │   ├── ScriptUpload.tsx
│   │   ├── VideoUpload.tsx
│   │   ├── ManagePage.tsx
│   │   └── SettingsPage.tsx
│   ├── hooks/               # 커스텀 훅
│   │   ├── useScripts.ts
│   │   ├── useUpload.ts
│   │   ├── useNotification.ts
│   │   └── useLocalStorage.ts
│   ├── contexts/            # React Context
│   │   ├── AppContext.tsx
│   │   └── ThemeContext.tsx
│   ├── services/            # API 서비스
│   │   ├── api.ts
│   │   ├── scripts.ts
│   │   ├── uploads.ts
│   │   └── youtube.ts
│   ├── utils/               # 유틸리티 함수
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── types/               # TypeScript 타입 정의
│   │   ├── api.ts
│   │   ├── script.ts
│   │   └── upload.ts
│   ├── styles/              # 스타일 파일
│   │   ├── globals.css
│   │   ├── components.css
│   │   └── tailwind.css
│   ├── App.tsx
│   ├── index.tsx
│   └── routes.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts          # Vite 설정 (또는 webpack)
```

## 핵심 컴포넌트

### 1. App Component (루트)

```tsx
// src/App.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './components/layout/Layout';
import { AppRoutes } from './routes';
import { Notification } from './components/feedback/Notification';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      retry: (failureCount, error) => {
        // 4xx 에러는 재시도하지 않음
        if (error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <BrowserRouter>
            <Layout>
              <AppRoutes />
              <Notification />
            </Layout>
          </BrowserRouter>
        </AppProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
```

### 2. 레이아웃 컴포넌트

```tsx
// src/components/layout/Layout.tsx
import React from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { useAppContext } from '../../contexts/AppContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state } = useAppContext();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Navigation />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// src/components/layout/Header.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/': '대시보드',
  '/upload': '대본 업로드',
  '/manage': '업로드 관리',
  '/settings': '설정',
};

export const Header: React.FC = () => {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || 'YouTube 업로드 자동화';

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {pageTitle}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              시니어 콘텐츠 업로드 시스템
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
```

### 3. 파일 업로드 컴포넌트

```tsx
// src/components/forms/FileUpload.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  accept: string;
  maxSize?: number;
  onUpload: (file: File) => Promise<void>;
  uploading?: boolean;
  progress?: number;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  maxSize = 2 * 1024 * 1024 * 1024, // 2GB
  onUpload,
  uploading = false,
  progress = 0,
  className = '',
}) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`파일 크기가 너무 큽니다. (최대: ${(maxSize / 1024 / 1024).toFixed(0)}MB)`);
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('지원되지 않는 파일 형식입니다.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      try {
        await onUpload(acceptedFiles[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : '업로드 실패');
      }
    }
  }, [onUpload, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    maxSize,
    multiple: false,
    disabled: uploading,
  });

  return (
    <div className={`relative ${className}`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploading ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="space-y-4">
            <div className="text-lg font-medium text-blue-600">
              업로드 중... {progress}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl text-gray-400">
              📁
            </div>
            <div className="text-lg font-medium text-gray-600">
              {isDragActive 
                ? '파일을 여기에 놓으세요' 
                : '파일을 선택하거나 여기로 드래그하세요'
              }
            </div>
            <div className="text-sm text-gray-500">
              지원 형식: {accept} · 최대 {(maxSize / 1024 / 1024).toFixed(0)}MB
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};
```

### 4. 스크립트 목록 컴포넌트

```tsx
// src/features/scripts/ScriptList.tsx
import React from 'react';
import { useScripts } from '../../hooks/useScripts';
import { ScriptCard } from './ScriptCard';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { EmptyState } from '../../components/feedback/EmptyState';

interface ScriptListProps {
  status?: string;
  limit?: number;
}

export const ScriptList: React.FC<ScriptListProps> = ({ 
  status = 'all', 
  limit = 10 
}) => {
  const { data, isLoading, error, refetch } = useScripts({ 
    status: status === 'all' ? undefined : status,
    limit 
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message="스크립트 목록을 불러오는데 실패했습니다."
        onRetry={refetch}
      />
    );
  }

  if (!data?.scripts.length) {
    return (
      <EmptyState
        icon="📝"
        title="등록된 대본이 없습니다"
        description="새로운 대본을 업로드해보세요."
        action={{
          label: '대본 업로드',
          href: '/upload'
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          대본 목록 ({data.total}개)
        </h3>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.scripts.map((script) => (
          <ScriptCard 
            key={script.id} 
            script={script}
            onUpdate={refetch}
          />
        ))}
      </div>
    </div>
  );
};

// src/features/scripts/ScriptCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Script } from '../../types/script';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/formatters';
import { getStatusColor, getStatusText } from '../../utils/helpers';

interface ScriptCardProps {
  script: Script;
  onUpdate: () => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({ script, onUpdate }) => {
  const canUploadVideo = script.status === 'script_ready';
  const canUploadToYouTube = script.status === 'video_ready';
  const isCompleted = ['uploaded', 'scheduled'].includes(script.status);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* 제목과 상태 */}
        <div>
          <h4 className="font-medium text-gray-900 line-clamp-2">
            {script.title}
          </h4>
          <div className="flex items-center mt-1">
            <span 
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(script.status)}`}
            >
              {getStatusText(script.status)}
            </span>
          </div>
        </div>

        {/* 메타 정보 */}
        <div className="text-sm text-gray-500 space-y-1">
          <div>등록: {formatDate(script.created_at)}</div>
          {script.youtube_video_id && (
            <div>
              YouTube: 
              <a 
                href={`https://www.youtube.com/watch?v=${script.youtube_video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-blue-600 hover:underline"
              >
                영상 보기
              </a>
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-wrap gap-2">
          {canUploadVideo && (
            <Button 
              size="sm" 
              variant="primary"
              as={Link}
              to={`/video-upload/${script.id}`}
            >
              비디오 업로드
            </Button>
          )}
          
          {canUploadToYouTube && (
            <Button 
              size="sm" 
              variant="success"
              as={Link}
              to={`/youtube-upload/${script.id}`}
            >
              YouTube 업로드
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="outline"
            as={Link}
            to={`/scripts/${script.id}`}
          >
            상세보기
          </Button>
          
          {isCompleted && script.youtube_video_id && (
            <Button 
              size="sm" 
              variant="outline"
              as="a"
              href={`https://www.youtube.com/watch?v=${script.youtube_video_id}`}
              target="_blank"
            >
              YouTube에서 보기
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
```

## 상태 관리 전략

### 1. React Query를 통한 서버 상태 관리

```tsx
// src/hooks/useScripts.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { scriptService } from '../services/scripts';
import { useNotification } from './useNotification';

export const useScripts = (params = {}) => {
  return useQuery(
    ['scripts', params],
    () => scriptService.getScripts(params),
    {
      staleTime: 5 * 60 * 1000, // 5분간 fresh
      keepPreviousData: true,   // 페이지네이션 시 이전 데이터 유지
    }
  );
};

export const useScriptMutations = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();

  const uploadScript = useMutation(
    scriptService.uploadScript,
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['scripts']);
        addNotification({
          type: 'success',
          message: '대본 업로드가 완료되었습니다.',
        });
      },
      onError: (error: any) => {
        addNotification({
          type: 'error',
          message: error.message || '업로드에 실패했습니다.',
        });
      },
    }
  );

  const deleteScript = useMutation(
    scriptService.deleteScript,
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['scripts']);
        addNotification({
          type: 'success',
          message: '대본이 삭제되었습니다.',
        });
      },
    }
  );

  return {
    uploadScript,
    deleteScript,
  };
};
```

### 2. Context를 통한 클라이언트 상태 관리

```tsx
// src/contexts/AppContext.tsx
import React, { createContext, useContext, useReducer } from 'react';

interface AppState {
  notifications: Notification[];
  settings: UserSettings;
  ui: {
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
  };
}

type AppAction = 
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          { ...action.payload, id: Date.now().toString() }
        ],
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
      };
    
    case 'SET_THEME':
      return {
        ...state,
        ui: { ...state.ui, theme: action.payload },
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

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

## 라우팅 구조

```tsx
// src/routes.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from './components/feedback/LoadingSpinner';

// 코드 스플리팅을 위한 지연 로딩
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ScriptUpload = lazy(() => import('./pages/ScriptUpload'));
const VideoUpload = lazy(() => import('./pages/VideoUpload'));
const YouTubeUpload = lazy(() => import('./pages/YouTubeUpload'));
const ManagePage = lazy(() => import('./pages/ManagePage'));
const ScriptDetail = lazy(() => import('./pages/ScriptDetail'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<ScriptUpload />} />
        <Route path="/video-upload/:id" element={<VideoUpload />} />
        <Route path="/youtube-upload/:id" element={<YouTubeUpload />} />
        <Route path="/manage" element={<ManagePage />} />
        <Route path="/scripts/:id" element={<ScriptDetail />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
```

## 재사용 가능한 컴포넌트

### 1. 기본 UI 컴포넌트

```tsx
// src/components/ui/Button.tsx
import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  as?: 'button' | 'a' | typeof Link;
  to?: string;
  href?: string;
  target?: string;
  onClick?: () => void;
}

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  success: 'bg-green-600 text-white hover:bg-green-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  as: Component = 'button',
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-md
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200
  `;

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  return (
    <Component
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </Component>
  );
};

// src/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card: React.FC<CardProps> = ({ 
  className = '', 
  children, 
  padding = 'md' 
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};
```

### 2. 피드백 컴포넌트

```tsx
// src/components/feedback/EmptyState.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📄',
  title,
  description,
  action,
}) => {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button
          as={Link}
          to={action.href}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
```

## 성능 최적화

### 1. 메모화 전략

```tsx
// src/components/ScriptCard.tsx
import React, { memo } from 'react';

export const ScriptCard = memo<ScriptCardProps>(({ script, onUpdate }) => {
  // 컴포넌트 구현...
}, (prevProps, nextProps) => {
  // 커스텀 비교 로직
  return (
    prevProps.script.id === nextProps.script.id &&
    prevProps.script.status === nextProps.script.status &&
    prevProps.script.updated_at === nextProps.script.updated_at
  );
});

// 콜백 메모화
const ScriptList: React.FC = () => {
  const { data, refetch } = useScripts();
  
  // refetch 함수를 메모화하여 불필요한 리렌더링 방지
  const handleUpdate = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div>
      {data?.scripts.map((script) => (
        <ScriptCard 
          key={script.id} 
          script={script}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
};
```

### 2. 가상화 (대용량 목록)

```tsx
// src/components/VirtualizedList.tsx
import React from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps {
  items: any[];
  height: number;
  itemHeight: number;
  renderItem: ({ index, style }: any) => React.ReactElement;
}

export const VirtualizedList: React.FC<VirtualizedListProps> = ({
  items,
  height,
  itemHeight,
  renderItem,
}) => {
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={items}
    >
      {renderItem}
    </List>
  );
};
```

이 컴포넌트 구조를 통해 확장 가능하고 유지보수하기 쉬운 프론트엔드 애플리케이션을 구축할 수 있습니다.