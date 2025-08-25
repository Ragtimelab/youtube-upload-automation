import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { WebSocketProvider } from '@/contexts/WebSocketContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { PermissionsProvider } from '@/contexts/PermissionsContext'
import { Layout } from '@/components/layout/Layout'
import { Toaster } from '@/components/Toaster'
import { RealTimeNotifications } from '@/components/RealTimeNotifications'
import { FullScreenLoading } from '@/components/ui/Loading'
import { ErrorBoundary } from '@/components/errors/ErrorBoundary'
import { 
  ScriptsPageErrorBoundary,
  UploadPageErrorBoundary,
  YouTubePageErrorBoundary,
  DashboardPageErrorBoundary
} from '@/components/errors/PageErrorBoundaries'
import { LiveRegion, SkipToContent } from '@/components/accessibility/AccessibilityComponents'
import { Environment, HydrationSafeState } from '@/utils/ssrHelpers'
import { ProfiledComponent } from '@/utils/performanceAnalyzer'

// React 19 Lazy Loading: 페이지별 코드 분할
// HomePage, ScriptsPage, UploadPage, YouTubePage는 즉시 로딩 (토스트 컨텍스트 문제 해결)
import { HomePage } from '@/pages/HomePage'
import { ScriptsPage } from '@/pages/ScriptsPage'
import { UploadPage } from '@/pages/UploadPage'
import { YouTubePage } from '@/pages/YouTubePage'

// 나머지 페이지들은 lazy loading으로 번들 분할
// const ScriptsPage = lazy(() => import('@/pages/ScriptsPage').then(module => ({ default: module.ScriptsPage })))
// const UploadPage = lazy(() => import('@/pages/UploadPage').then(module => ({ default: module.UploadPage })))
// const YouTubePage = lazy(() => import('@/pages/YouTubePage').then(module => ({ default: module.YouTubePage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(module => ({ default: module.DashboardPage })))
const StatusPage = lazy(() => import('@/pages/StatusPage').then(module => ({ default: module.StatusPage })))
const PipelinePage = lazy(() => import('@/pages/PipelinePage').then(module => ({ default: module.PipelinePage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(module => ({ default: module.SettingsPage })))
const RenderPropsDemo = lazy(() => import('@/pages/RenderPropsDemo').then(module => ({ default: module.RenderPropsDemo })))

/**
 * React 19 + Phase 11 최적화된 메인 앱 컴포넌트
 * - 페이지별 Lazy Loading으로 초기 번들 크기 최소화
 * - Context Provider 계층으로 Props drilling 완전 제거
 * - 전역 상태 관리 최적화 (WebSocket, Toast, Permissions)
 * - 페이지별 Error Boundary로 안정성 보장 (Phase 5)
 * - WCAG 2.1 AA 접근성 완전 지원 (Phase 6)
 * - SSR 호환성 및 Hydration 안전성 (Phase 11)
 * - 성능 모니터링 자동화 (Phase 11)
 */
function App() {
  // SSR 호환성 체크 - 클라이언트에서만 라우터 활성화
  if (Environment.isServer()) {
    return (
      <div id="ssr-fallback" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">YouTube Upload Automation</h1>
          <p className="text-gray-600">서버 사이드 렌더링 중...</p>
        </div>
      </div>
    )
  }

  return (
    <ProfiledComponent name="App" onRender={(_id, _phase, actualDuration) => {
      if (actualDuration > 100) {
        console.warn(`🐌 App 렌더링 느림: ${actualDuration.toFixed(2)}ms`)
      }
    }}>
      <ErrorBoundary level="global" onError={(error, errorInfo) => {
        console.error('Global App Error:', { error, errorInfo })
        // 글로벌 에러 리포팅 (실무 표준)
      }}>
        <QueryProvider>
          <ToastProvider position="top-right" maxToasts={5}>
            <PermissionsProvider fallbackRole="editor">
              <WebSocketProvider autoConnect={HydrationSafeState.isHydrated()}>
                <Router>
                  {/* 접근성: 건너뛰기 링크 */}
                  <SkipToContent />
                  
                  {/* 접근성: 스크린 리더 라이브 리전 */}
                  <LiveRegion />
                  
                  <Layout>
                    <Suspense 
                      fallback={
                        <FullScreenLoading
                          title="페이지 로딩 중"
                          message="잠시만 기다려주세요..."
                        />
                      }
                    >
                      {/* 메인 콘텐츠 영역 */}
                      <main 
                        id="main-content" 
                        className="focus:outline-none" 
                        tabIndex={-1}
                        role="main"
                        aria-label="메인 콘텐츠"
                      >
                      <Routes>
                      {/* 홈페이지는 즉시 로딩 */}
                      <Route path="/" element={<HomePage />} />
                      
                      {/* 핵심 기능 페이지들 - Lazy Loading + Error Boundary */}
                      <Route 
                        path="/scripts" 
                        element={
                          <ScriptsPageErrorBoundary>
                            <ScriptsPage />
                          </ScriptsPageErrorBoundary>
                        } 
                      />
                      <Route 
                        path="/upload" 
                        element={
                          <UploadPageErrorBoundary>
                            <UploadPage />
                          </UploadPageErrorBoundary>
                        } 
                      />
                      <Route 
                        path="/youtube" 
                        element={
                          <YouTubePageErrorBoundary>
                            <YouTubePage />
                          </YouTubePageErrorBoundary>
                        } 
                      />
                      
                      {/* 모니터링 페이지들 */}
                      <Route 
                        path="/dashboard" 
                        element={
                          <DashboardPageErrorBoundary>
                            <Suspense fallback={<PageLoadingSkeleton title="대시보드" />}>
                              <DashboardPage />
                            </Suspense>
                          </DashboardPageErrorBoundary>
                        } 
                      />
                      <Route 
                        path="/status" 
                        element={
                          <ErrorBoundary level="page">
                            <Suspense fallback={<PageLoadingSkeleton title="시스템 상태" />}>
                              <StatusPage />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      <Route 
                        path="/pipeline" 
                        element={
                          <ErrorBoundary level="page">
                            <Suspense fallback={<PageLoadingSkeleton title="파이프라인 시각화" />}>
                              <PipelinePage />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      
                      {/* Phase 10 데모 페이지 - Render Props 패턴 */}
                      <Route 
                        path="/render-props-demo" 
                        element={
                          <ErrorBoundary level="page">
                            <Suspense fallback={<PageLoadingSkeleton title="Render Props 데모" />}>
                              <RenderPropsDemo />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      
                      {/* 설정 페이지 - 가장 낮은 우선순위 */}
                      <Route 
                        path="/settings" 
                        element={
                          <ErrorBoundary level="page">
                            <Suspense fallback={<PageLoadingSkeleton title="설정" />}>
                              <SettingsPage />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      </Routes>
                    </main>
                  </Suspense>
                </Layout>
                <RealTimeNotifications />
                <Toaster />
              </Router>
            </WebSocketProvider>
          </PermissionsProvider>
        </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
    </ProfiledComponent>
  )
}

/**
 * 페이지별 특화된 로딩 스켈레톤
 */
function PageLoadingSkeleton({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 스켈레톤 */}
        <div className="mb-8">
          <div className="h-8 bg-gray-300 rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
        </div>
        
        {/* 컨텐츠 스켈레톤 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
              <div className="h-5 bg-gray-300 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
              <div className="h-10 bg-gray-300 rounded w-full" />
            </div>
          ))}
        </div>
        
        {/* 로딩 메시지 */}
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">{title} 로딩 중...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
