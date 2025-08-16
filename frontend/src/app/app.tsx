import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import { Layout } from '@/components/layout/layout'
import { AppRoutes } from './routes'
import { WebSocketProvider } from '@/components/WebSocketProvider'
import NotificationPanel from '@/components/NotificationPanel'
import './globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // 4xx 에러는 재시도하지 않음
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        return failureCount < 3
      },
    },
    mutations: {
      retry: false,
    },
  },
})

export function App() {
  // WebSocket URL 설정 (환경변수에서 가져오거나 기본값 사용)
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'
  
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider wsUrl={wsUrl} debug={import.meta.env.DEV}>
        <BrowserRouter>
          <Layout>
            <AppRoutes />
          </Layout>
          <NotificationPanel position="top-right" maxNotifications={5} />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </WebSocketProvider>
    </QueryClientProvider>
  )
}