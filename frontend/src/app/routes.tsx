import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Card, CardContent } from '@/shared/ui/card'
import { ROUTES } from '@/shared/constants'

// 로딩 컴포넌트
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-96">
      <Card className="glass">
        <CardContent className="p-8">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-lg font-medium text-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 지연 로딩 컴포넌트들
const Dashboard = lazy(() => import('@/pages/dashboard').then(m => ({ default: m.Dashboard })))

// 임시 페이지 컴포넌트들 (추후 구현 예정)
function ScriptUpload() {
  return (
    <Card className="glass">
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold mb-4">Script Upload</h2>
        <p className="text-muted-foreground">스크립트 업로드 페이지 (구현 예정)</p>
      </CardContent>
    </Card>
  )
}

function ScriptManagement() {
  return (
    <Card className="glass">
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold mb-4">Script Management</h2>
        <p className="text-muted-foreground">스크립트 관리 페이지 (구현 예정)</p>
      </CardContent>
    </Card>
  )
}

function Settings() {
  return (
    <Card className="glass">
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold mb-4">Settings</h2>
        <p className="text-muted-foreground">설정 페이지 (구현 예정)</p>
      </CardContent>
    </Card>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.SCRIPT_UPLOAD} element={<ScriptUpload />} />
        <Route path={ROUTES.SCRIPT_MANAGEMENT} element={<ScriptManagement />} />
        <Route path={ROUTES.SETTINGS} element={<Settings />} />
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </Suspense>
  )
}