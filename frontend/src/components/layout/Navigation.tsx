import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Upload, List, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: '대시보드', href: '/', icon: Home },
  { name: '대본 업로드', href: '/upload', icon: Upload },
  { name: '업로드 관리', href: '/manage', icon: List },
  { name: '설정', href: '/settings', icon: Settings },
]

export const Navigation: React.FC = () => {
  const location = useLocation()

  return (
    <nav className="w-64 bg-white shadow-sm border-r">
      <div className="p-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}