import React from 'react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, string> = {
  '/': '대시보드',
  '/upload': '대본 업로드',
  '/manage': '업로드 관리',
  '/settings': '설정',
}

export const Header: React.FC = () => {
  const location = useLocation()
  const pageTitle = PAGE_TITLES[location.pathname] || 'YouTube 업로드 자동화'

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
  )
}