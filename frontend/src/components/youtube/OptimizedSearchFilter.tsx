import { useState, useTransition, useDeferredValue, useMemo } from 'react'
import { Search, Filter, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface OptimizedSearchFilterProps {
  searchTerm: string
  statusFilter: string
  isBatchMode: boolean
  totalResults: number
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onBatchModeToggle: () => void
}

/**
 * React 19 startTransition과 useDeferredValue를 활용한 최적화된 검색 필터
 * - 검색 입력은 즉시 반영 (urgent)
 * - 필터링 결과는 non-urgent로 처리하여 입력 응답성 보장
 * - useDeferredValue로 디바운싱 효과 구현
 */
export function OptimizedSearchFilter({
  searchTerm,
  statusFilter,
  isBatchMode,
  totalResults,
  onSearchChange,
  onStatusFilterChange,
  onBatchModeToggle
}: OptimizedSearchFilterProps) {
  const [isPending, startTransition] = useTransition()
  const [immediateSearchTerm, setImmediateSearchTerm] = useState(searchTerm)
  
  // React 19: 지연된 값으로 디바운싱 효과
  const deferredSearchTerm = useDeferredValue(immediateSearchTerm)

  // 검색 입력 처리 - 즉시 UI 반영
  const handleSearchInput = (value: string) => {
    // 입력 필드는 즉시 업데이트 (urgent)
    setImmediateSearchTerm(value)
    
    // 실제 검색은 non-urgent로 처리
    startTransition(() => {
      onSearchChange(value)
    })
  }

  // 상태 필터 변경 - non-urgent
  const handleStatusFilterChange = (value: string) => {
    startTransition(() => {
      onStatusFilterChange(value)
    })
  }

  // 배치 모드 토글 - non-urgent
  const handleBatchModeToggle = () => {
    startTransition(() => {
      onBatchModeToggle()
    })
  }

  // 검색 결과 통계 계산 - useMemo로 최적화
  const searchStats = useMemo(() => {
    const hasActiveFilters = deferredSearchTerm.length > 0 || statusFilter !== 'all'
    const filterSummary = []
    
    if (deferredSearchTerm) filterSummary.push(`검색: "${deferredSearchTerm}"`)
    if (statusFilter !== 'all') filterSummary.push(`상태: ${statusFilter}`)
    
    return {
      hasActiveFilters,
      filterSummary: filterSummary.join(', '),
      resultCount: totalResults
    }
  }, [deferredSearchTerm, statusFilter, totalResults])

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검색 입력 - 즉시 반응 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="스크립트 제목, 설명, 파일명으로 검색..."
                value={immediateSearchTerm}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="pl-10"
              />
              {/* 검색 중 표시 */}
              {isPending && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                </div>
              )}
            </div>
          </div>
          
          {/* 상태 필터 - 지연 처리 */}
          <div className="min-w-48">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">상태 필터</Label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
            >
              <option value="all">전체</option>
              <option value="script_ready">스크립트만</option>
              <option value="video_ready">비디오 준비됨</option>
              <option value="uploaded">업로드 완료</option>
              <option value="scheduled">예약 발행</option>
              <option value="error">오류</option>
            </select>
          </div>
          
          {/* 배치 모드 토글 - 지연 처리 */}
          <div className="flex items-center gap-2">
            <Button
              variant={isBatchMode ? "default" : "outline"}
              onClick={handleBatchModeToggle}
              disabled={isPending}
              className={isBatchMode ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  전환 중...
                </>
              ) : (
                isBatchMode ? '단일 모드' : '배치 모드'
              )}
            </Button>
          </div>
        </div>

        {/* 검색 결과 통계 및 활성 필터 표시 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  총 {searchStats.resultCount}개 결과
                </span>
              </div>
              
              {/* 활성 필터 배지 */}
              {searchStats.hasActiveFilters && (
                <Badge variant="outline" className="text-xs">
                  필터 적용: {searchStats.filterSummary}
                </Badge>
              )}
              
              {/* 검색 중 표시기 */}
              {isPending && (
                <Badge className="text-xs bg-blue-100 text-blue-700">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  검색 중
                </Badge>
              )}
            </div>

            {/* 필터 초기화 버튼 */}
            {searchStats.hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImmediateSearchTerm('')
                  startTransition(() => {
                    onSearchChange('')
                    onStatusFilterChange('all')
                  })
                }}
                disabled={isPending}
                className="text-gray-500 hover:text-gray-700"
              >
                필터 초기화
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 고성능 검색을 위한 커스텀 훅
 * startTransition과 useDeferredValue를 조합하여 최적의 사용자 경험 제공
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
    // 즉시 반영되는 값들 (UI 입력용)
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