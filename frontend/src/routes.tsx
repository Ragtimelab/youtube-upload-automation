import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const ScriptUpload = lazy(() => import('./pages/ScriptUpload'))
const ManagePage = lazy(() => import('./pages/ManagePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<ScriptUpload />} />
        <Route path="/manage" element={<ManagePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}