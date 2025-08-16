import { useLocation } from 'react-router-dom'
import { Search, Bell, User, Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { useAppStore } from '@/app/store/app-store'

const PAGE_TITLES: Record<string, string> = {
  '/': '대시보드',
  '/upload': '대본 업로드',
  '/manage': '콘텐츠 관리',
  '/settings': '설정',
}

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

export function Header() {
  const location = useLocation()
  const { theme, setTheme, notifications } = useAppStore()
  const pageTitle = PAGE_TITLES[location.pathname] || 'YouTube Upload Automation'
  
  const unreadCount = notifications.length

  const cycleTheme = () => {
    const themes: Array<typeof theme> = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const ThemeIcon = THEME_ICONS[theme]

  return (
    <header className="h-16 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6">
      <div className="flex items-center justify-between h-full">
        {/* Left: Page Title */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {pageTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              시니어 콘텐츠 업로드 시스템
            </p>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="스크립트 검색..."
              className="pl-10 bg-background/50 border-border/50"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
            className="relative"
          >
            <ThemeIcon className="w-4 h-4" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* User Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
          </Button>
        </div>
      </div>
    </header>
  )
}