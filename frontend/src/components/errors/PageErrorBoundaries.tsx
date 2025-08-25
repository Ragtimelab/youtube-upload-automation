import type { ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { AlertTriangle, FileText, Upload, Youtube, BarChart3 } from 'lucide-react'

/**
 * 실무 표준 페이지별 Error Boundary
 * 각 페이지의 특성에 맞는 에러 처리 및 복구 액션 제공
 */


/**
 * ScriptsPage 전용 Error Boundary
 */
export function ScriptsPageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="page"
      onError={(error, errorInfo) => {
        console.error('ScriptsPage Error:', { error, errorInfo })
      }}
      fallback={(error, retry) => (
        <PageErrorFallback
          icon={<FileText className="h-8 w-8 text-blue-600" />}
          title="스크립트 관리 오류"
          description="스크립트 목록을 불러오는 중 오류가 발생했습니다."
          suggestions={[
            '네트워크 연결을 확인해주세요',
            '브라우저를 새로고침 해보세요',
            '잠시 후 다시 시도해주세요'
          ]}
          actions={[
            { label: '다시 시도', onClick: retry, variant: 'primary' },
            { label: '홈으로', onClick: () => window.location.href = '/', variant: 'secondary' }
          ]}
          error={error}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * UploadPage 전용 Error Boundary
 */
export function UploadPageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="page"
      maxRetries={2} // 파일 업로드는 재시도 횟수 제한
      onError={(error, errorInfo) => {
        console.error('UploadPage Error:', { error, errorInfo })
        // 업로드 중 에러는 특별히 추적
        if (error.message.includes('upload') || error.message.includes('file')) {
          console.error('Upload-related error detected:', error.message)
        }
      }}
      fallback={(error, retry) => (
        <PageErrorFallback
          icon={<Upload className="h-8 w-8 text-green-600" />}
          title="업로드 오류"
          description="파일 업로드 중 오류가 발생했습니다."
          suggestions={[
            '파일 크기가 너무 큰지 확인해주세요 (최대 2GB)',
            '지원되는 파일 형식인지 확인해주세요 (.mp4, .avi, .mov)',
            '인터넷 연결이 안정적인지 확인해주세요'
          ]}
          actions={[
            { label: '다시 업로드', onClick: retry, variant: 'primary' },
            { label: '스크립트 목록', onClick: () => window.location.href = '/scripts', variant: 'secondary' }
          ]}
          error={error}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * YouTubePage 전용 Error Boundary
 */
export function YouTubePageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="page"
      maxRetries={3} // YouTube API는 더 많은 재시도
      onError={(error, errorInfo) => {
        console.error('YouTubePage Error:', { error, errorInfo })
        // YouTube API 관련 에러 분류
        if (error.message.includes('quota')) {
          console.error('YouTube quota exceeded:', error.message)
        }
      }}
      fallback={(error, retry) => (
        <PageErrorFallback
          icon={<Youtube className="h-8 w-8 text-red-600" />}
          title="YouTube 연동 오류"
          description="YouTube 업로드 관리 중 오류가 발생했습니다."
          suggestions={[
            'YouTube API 할당량을 확인해주세요',
            'YouTube 계정 연결 상태를 확인해주세요',
            '잠시 후 다시 시도해주세요'
          ]}
          actions={[
            { label: '다시 시도', onClick: retry, variant: 'primary' },
            { label: '대시보드', onClick: () => window.location.href = '/dashboard', variant: 'secondary' }
          ]}
          error={error}
          isYouTubeError={true}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * DashboardPage 전용 Error Boundary
 */
export function DashboardPageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="page"
      maxRetries={5} // 대시보드는 더 많은 재시도 (실시간 데이터)
      onError={(error, errorInfo) => {
        console.error('DashboardPage Error:', { error, errorInfo })
      }}
      fallback={(error, retry) => (
        <PageErrorFallback
          icon={<BarChart3 className="h-8 w-8 text-purple-600" />}
          title="대시보드 로딩 오류"
          description="시스템 상태 정보를 불러오는 중 오류가 발생했습니다."
          suggestions={[
            '백엔드 서버 상태를 확인해주세요',
            '네트워크 연결을 확인해주세요',
            '잠시 후 자동으로 재시도됩니다'
          ]}
          actions={[
            { label: '새로고침', onClick: retry, variant: 'primary' },
            { label: '스크립트 관리', onClick: () => window.location.href = '/scripts', variant: 'secondary' }
          ]}
          error={error}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * 실무 표준 에러 폴백 UI 컴포넌트
 */
interface PageErrorFallbackProps {
  icon: ReactNode
  title: string
  description: string
  suggestions: string[]
  actions: Array<{
    label: string
    onClick: () => void
    variant: 'primary' | 'secondary'
  }>
  error: Error
  isYouTubeError?: boolean
}

function PageErrorFallback({ 
  icon, 
  title, 
  description, 
  suggestions, 
  actions, 
  error,
  isYouTubeError = false
}: PageErrorFallbackProps) {
  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* 에러 헤더 */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
            {icon}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>

        {/* YouTube 특별 안내 */}
        {isYouTubeError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">YouTube API 제한</h3>
                <p className="text-sm text-red-700 mt-1">
                  일일 할당량 초과 시 다음날까지 기다려주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 해결 방법 제안 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">해결 방법:</h3>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3" />
                <span className="text-sm text-gray-600">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 에러 상세 정보 (개발 환경에서만) */}
        {import.meta.env.MODE === 'development' && (
          <div className="mb-6 p-3 bg-gray-100 rounded border">
            <details>
              <summary className="text-xs font-mono text-gray-600 cursor-pointer">
                개발자 정보 (클릭하여 확장)
              </summary>
              <div className="mt-2 text-xs font-mono text-gray-800 break-all">
                <div><strong>Error:</strong> {error.message}</div>
                {error.stack && (
                  <div className="mt-1">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
                ${action.variant === 'primary'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500'
                }
              `}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* 추가 도움말 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            문제가 계속되면{' '}
            <a 
              href="mailto:support@example.com" 
              className="text-blue-600 hover:text-blue-500"
            >
              support@example.com
            </a>
            으로 문의하세요.
          </p>
        </div>
      </div>
    </div>
  )
}