import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import type { DefaultOptions } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import type { ReactNode } from 'react'

/**
 * React 19 + TanStack Query 최적화된 캐시 전략
 * Phase 4: 도메인별 캐시 설정 및 성능 최적화
 */

interface QueryProviderProps {
  children: ReactNode
}

// 도메인별 최적화된 캐시 설정
const createOptimizedQueryClient = () => {
  const defaultOptions: DefaultOptions = {
    queries: {
      // 기본 캐시 전략 (5분 신선, 10분 가비지 컬렉션)
      staleTime: 5 * 60 * 1000,  // 5분
      gcTime: 10 * 60 * 1000,    // 10분 (cacheTime deprecated -> gcTime)
      retry: (failureCount, error) => {
        // 스마트 재시도 로직
        if (error instanceof Error) {
          // 네트워크 오류나 서버 오류만 재시도
          if (error.message.includes('Network Error') || error.message.includes('500')) {
            return failureCount < 3
          }
          // 권한 오류나 404는 재시도 안함
          if (error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
            return false
          }
        }
        return failureCount < 2
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Mutation은 보수적으로 재시도
        if (error instanceof Error && error.message.includes('Network Error')) {
          return failureCount < 1
        }
        return false
      },
      retryDelay: 1000,
    },
  }

  return new QueryClient({
    defaultOptions,
    queryCache: new QueryCache({
      onError: (error, query) => {
        console.error('Query Error:', {
          queryKey: query.queryKey,
          error: error.message
        })
      }
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, _context, mutation) => {
        console.error('Mutation Error:', {
          mutationKey: mutation.options.mutationKey,
          error: error.message,
          variables
        })
      }
    })
  })
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(createOptimizedQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Phase 8: TanStack Query DevTools - 개발 환경에서만 활성화 */}
      {process.env['NODE_ENV'] === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
        />
      )}
    </QueryClientProvider>
  )
}