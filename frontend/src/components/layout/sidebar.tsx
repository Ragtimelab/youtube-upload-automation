import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Upload, 
  List, 
  Settings,
  Youtube,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useAppStore } from '@/app/store/app-store'
import { ROUTES } from '@/shared/constants'

const navigation = [
  { 
    name: 'Dashboard', 
    href: ROUTES.DASHBOARD, 
    icon: LayoutDashboard,
    description: '전체 현황'
  },
  { 
    name: 'Upload', 
    href: ROUTES.SCRIPT_UPLOAD, 
    icon: Upload,
    description: '대본 업로드'
  },
  { 
    name: 'Manage', 
    href: ROUTES.SCRIPT_MANAGEMENT, 
    icon: List,
    description: '콘텐츠 관리'
  },
  { 
    name: 'Settings', 
    href: ROUTES.SETTINGS, 
    icon: Settings,
    description: '시스템 설정'
  },
]

export function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <div className={cn(
      'h-screen bg-card/50 backdrop-blur-xl border-r border-border/50 transition-all duration-300 ease-in-out flex flex-col',
      sidebarOpen ? 'w-64' : 'w-16'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                  <Youtube className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gradient">YouTube Studio</h1>
                <p className="text-xs text-muted-foreground">Content Automation</p>
              </div>
            </div>
          )}
          
          <button
            onClick={toggleSidebar}
            className={cn(
              'p-2 rounded-lg hover:bg-accent transition-colors',
              !sidebarOpen && 'mx-auto'
            )}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2">
        {navigation.map((item, index) => {
          const isActive = location.pathname === item.href
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group',
                'hover:bg-accent/50 hover:transform hover:scale-[1.02]',
                isActive && 'bg-primary text-primary-foreground shadow-lg shadow-primary/20',
                !sidebarOpen && 'justify-center'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <item.icon className={cn(
                'w-5 h-5 transition-transform group-hover:scale-110',
                isActive ? 'text-primary-foreground' : 'text-muted-foreground'
              )} />
              
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'font-medium truncate',
                    isActive ? 'text-primary-foreground' : 'text-foreground'
                  )}>
                    {item.name}
                  </div>
                  <div className={cn(
                    'text-xs truncate',
                    isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}>
                    {item.description}
                  </div>
                </div>
              )}
              
              {isActive && (
                <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Status Footer */}
      {sidebarOpen && (
        <div className="p-3 border-t border-border/50">
          <div className="glass rounded-xl p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">System Online</div>
                <div className="text-xs text-muted-foreground">All services running</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}