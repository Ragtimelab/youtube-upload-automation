import { useState, useTransition, useDeferredValue } from 'react'

/**
 * 고성능 검색을 위한 커스텀 훅
 * startTransition과 useDeferredValue를 조합하여 최적의 사용자 경험 제공
 * React Refresh 호환성을 위해 별도 파일로 분리
 */
export function useOptimizedSearch(initialSearchTerm = '', initialStatusFilter = 'all') {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [isPending, startTransition] = useTransition()
  
  // 지연된 값으로 실제 검색 실행
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const deferredStatusFilter = useDeferredValue(statusFilter)

  const updateSearch = (newSearchTerm: string) => {
    startTransition(() => {
      setSearchTerm(newSearchTerm)
    })
  }

  const updateStatusFilter = (newStatusFilter: string) => {
    startTransition(() => {
      setStatusFilter(newStatusFilter)
    })
  }

  return {
    // 즉시 업데이트되는 값들 (UI용)
    searchTerm,
    statusFilter,
    
    // 지연된 값들 (실제 필터링용)
    deferredSearchTerm,
    deferredStatusFilter,
    
    // 상태 및 액션
    isPending,
    updateSearch,
    updateStatusFilter
  }
}