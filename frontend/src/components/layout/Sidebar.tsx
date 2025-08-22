import { Link, useLocation } from 'react-router-dom'
import { 
  FileText, 
  Upload, 
  Youtube, 
  BarChart3, 
  Settings,
  Home,
  Activity
} from 'lucide-react'

export function Sidebar() {
  const location = useLocation()

  const navigation = [
    { name: '홈', href: '/', icon: Home },
    { name: '스크립트 관리', href: '/scripts', icon: FileText },
    { name: '비디오 업로드', href: '/upload', icon: Upload },
    { name: 'YouTube 업로드', href: '/youtube', icon: Youtube },
    { name: '대시보드', href: '/dashboard', icon: BarChart3 },
    { name: '실시간 상태', href: '/status', icon: Activity },
  ]

  const isActive = (href: string) => location.pathname === href

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-full">
      <div className="p-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* 설정 섹션 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            to="/settings"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/settings')
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>설정</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}