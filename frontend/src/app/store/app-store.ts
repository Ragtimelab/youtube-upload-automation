import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Notification, Theme } from '@/shared/types'

interface AppState {
  // UI 상태
  sidebarOpen: boolean
  theme: Theme
  
  // 알림 시스템
  notifications: Notification[]
  
  // 로딩 상태
  globalLoading: boolean
  
  // 액션
  toggleSidebar: () => void
  setTheme: (theme: Theme) => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  setGlobalLoading: (loading: boolean) => void
}

let notificationId = 0

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // 초기 상태
    sidebarOpen: true,
    theme: 'light',
    notifications: [],
    globalLoading: false,

    // 액션
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    
    setTheme: (theme) => {
      set({ theme })
      localStorage.setItem('youtube-automation-theme', theme)
      
      // 시스템 테마인 경우 OS 설정에 따라 다크/라이트 모드 적용
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        document.documentElement.classList.toggle('dark', prefersDark)
      } else {
        document.documentElement.classList.toggle('dark', theme === 'dark')
      }
    },
    
    addNotification: (notification) => {
      const id = `notification-${++notificationId}`
      const newNotification: Notification = {
        ...notification,
        id,
        duration: notification.duration || 5000,
      }
      
      set((state) => ({
        notifications: [...state.notifications, newNotification].slice(-5), // 최대 5개까지만 유지
      }))
      
      // 자동 제거
      if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          get().removeNotification(id)
        }, newNotification.duration)
      }
    },
    
    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
    
    clearNotifications: () => set({ notifications: [] }),
    
    setGlobalLoading: (loading) => set({ globalLoading: loading }),
  }))
)

// 테마 초기화
const savedTheme = localStorage.getItem('youtube-automation-theme') as Theme
if (savedTheme) {
  useAppStore.getState().setTheme(savedTheme)
}

// 시스템 테마 변경 감지
if (useAppStore.getState().theme === 'system') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (useAppStore.getState().theme === 'system') {
      document.documentElement.classList.toggle('dark', e.matches)
    }
  })
}