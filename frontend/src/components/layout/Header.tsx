import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Upload, 
  Youtube, 
  BarChart3, 
  Settings,
  Menu
} from 'lucide-react'

export function Header() {
  const location = useLocation()

  const navigation = [
    { name: '스크립트', href: '/scripts', icon: FileText },
    { name: '비디오 업로드', href: '/upload', icon: Upload },
    { name: 'YouTube', href: '/youtube', icon: Youtube },
    { name: '대시보드', href: '/dashboard', icon: BarChart3 },
  ]

  const isActive = (href: string) => location.pathname === href

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Youtube className="h-8 w-8 text-red-600" />
              <span className="text-xl font-bold text-gray-900">
                YouTube 자동화
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Settings */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}