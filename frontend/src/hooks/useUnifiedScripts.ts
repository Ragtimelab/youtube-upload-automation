import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import api from '@/services/api'
import { useToastHelpers } from '@/hooks/useToastContext'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import type { Script } from '@/types'

/**
 * React 19 설계 철학 기반 통합 스크립트 관리 훅
 * Single Source of Truth: React Query 중심의 서버 상태 관리
 * 
 * Phase 1: 상태 관리 통합 - Zustand 중복 제거
 * - useScriptsStore (406줄) 기능 완전 대체
 * - useScripts + useScriptQueries 통합
 * - useState 로컬 상태 의존성 제거
 */

// Query Key Factory - 일관된 키 관리
export const scriptQueryKeys = {
  all: ['scripts'] as const,
  lists: () => [...scriptQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...scriptQueryKeys.lists(), filters] as const,
  details: () => [...scriptQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...scriptQueryKeys.details(), id] as const,
  stats: () => [...scriptQueryKeys.all, 'stats'] as const,
}

// 스크립트 목록 쿼리 응답 타입
interface ScriptsQueryData {
  scripts: Script[]
  total: number
  page: number
  limit: number
}

// 필터 상태 타입 (기존 Zustand 호환)
interface FilterState {
  searchQuery: string
  statusFilter: 'all' | 'script_ready' | 'video_ready' | 'uploaded' | 'scheduled' | 'error'
  sortBy: 'created_at' | 'title' | 'updated_at'
  sortOrder: 'asc' | 'desc'
  pageSize: number
  currentPage: number
  [key: string]: unknown  // 인덱스 시그니처 추가
}

/**
 * 메인 통합 스크립트 훅 - 모든 스크립트 관련 로직 통합
 * React 19 Component Composition 패턴 적용
 */
export function useUnifiedScripts(params: Partial<FilterState> = {}) {
  const { success, error: _error } = useToastHelpers()
  const errorHandler = useErrorHandler('UnifiedScripts')
  const queryClient = useQueryClient()

  // 기본 필터 설정 - useMemo로 최적화
  const filters: FilterState = useMemo(() => ({
    searchQuery: '',
    statusFilter: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
    currentPage: 1,
    ...params
  }), [params])

  // 스크립트 목록 조회 (페이지네이션 최적화)
  const scriptsQuery = useQuery({
    queryKey: scriptQueryKeys.list(filters),
    queryFn: async (): Promise<ScriptsQueryData> => {
      const response = await api.get('/scripts', { params: filters })
      return {
        scripts: response.data.data,
        total: response.data.total || response.data.data.length,
        page: filters.currentPage,
        limit: filters.pageSize
      }
    },
    staleTime: 2 * 60 * 1000, // 2분간 신선
    gcTime: 5 * 60 * 1000,    // 5분 캐시 유지
    placeholderData: keepPreviousData, // 페이지네이션 시 이전 데이터 유지
    enabled: true,
  })

  // 스크립트 통계 조회 (대시보드용)
  const statsQuery = useQuery({
    queryKey: scriptQueryKeys.stats(),
    queryFn: async () => {
      const response = await api.get('/scripts/stats/summary')
      return response.data.data
    },
    staleTime: 1 * 60 * 1000, // 1분간 신선
    gcTime: 3 * 60 * 1000,
    refetchInterval: 30 * 1000, // 30초마다 자동 새로고침
  })

  // 스크립트 생성 Mutation - 낙관적 업데이트
  const createMutation = useMutation({
    mutationFn: async (scriptData: FormData) => {
      const response = await api.post('/api/scripts/upload', scriptData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data.data
    },
    onMutate: async (_newScriptData) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: scriptQueryKeys.lists() })
      
      // 낙관적 업데이트용 임시 스크립트 객체 생성
      const optimisticScript: Partial<Script> = {
        id: Date.now(), // 임시 ID
        title: 'Uploading...',
        status: 'script_ready',
        created_at: new Date().toISOString(),
      }

      // 이전 데이터 백업
      const previousScripts = queryClient.getQueryData(scriptQueryKeys.lists())
      
      // 낙관적 업데이트
      queryClient.setQueriesData(
        { queryKey: scriptQueryKeys.lists() },
        (old: ScriptsQueryData | undefined) => {
          if (old?.scripts) {
            return {
              ...old,
              scripts: [optimisticScript as Script, ...old.scripts],
              total: old.total + 1
            }
          }
          return old
        }
      )

      return { previousScripts, optimisticScript }
    },
    onSuccess: (newScript, _variables, context) => {
      // 성공 시 실제 데이터로 교체
      queryClient.setQueriesData(
        { queryKey: scriptQueryKeys.lists() },
        (old: ScriptsQueryData | undefined) => {
          if (old?.scripts) {
            const updatedScripts = old.scripts.map((script: Script) => 
              script.id === context?.optimisticScript.id ? newScript : script
            )
            return {
              ...old,
              scripts: updatedScripts
            }
          }
          return old
        }
      )
      
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.stats() })
      
      success('스크립트 업로드 성공', '새 스크립트가 생성되었습니다.')
    },
    onError: (err, _variables, context) => {
      // 실패 시 롤백
      if (context?.previousScripts) {
        queryClient.setQueriesData(
          { queryKey: scriptQueryKeys.lists() },
          context.previousScripts
        )
      }
      
      errorHandler.setError(err, 'Script upload failed')
    },
    onSettled: () => {
      // 항상 관련 쿼리 새로고침
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.lists() })
    }
  })

  // 스크립트 업데이트 Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Script> }) => {
      const response = await api.patch(`/api/scripts/${id}`, data)
      return response.data.data
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: scriptQueryKeys.detail(id) })
      
      const previousScript = queryClient.getQueryData(scriptQueryKeys.detail(id))
      
      // 낙관적 업데이트
      queryClient.setQueryData(scriptQueryKeys.detail(id), (old: Script | undefined) => 
        old ? { ...old, ...data } : undefined
      )

      return { previousScript, id }
    },
    onSuccess: (updatedScript) => {
      // 상세 쿼리 업데이트
      queryClient.setQueryData(scriptQueryKeys.detail(updatedScript.id), updatedScript)
      
      // 목록 쿼리들도 업데이트
      queryClient.setQueriesData(
        { queryKey: scriptQueryKeys.lists() },
        (old: ScriptsQueryData | undefined) => {
          if (old?.scripts) {
            const updatedScripts = old.scripts.map((script: Script) =>
              script.id === updatedScript.id ? updatedScript : script
            )
            return { ...old, scripts: updatedScripts }
          }
          return old
        }
      )
      
      success('스크립트 업데이트 완료')
    },
    onError: (err, _variables, context) => {
      // 롤백
      if (context?.previousScript && context.id) {
        queryClient.setQueryData(scriptQueryKeys.detail(context.id), context.previousScript)
      }
      
      errorHandler.setError(err, 'Script update failed')
    }
  })

  // 스크립트 삭제 Mutation - 낙관적 업데이트
  const deleteMutation = useMutation({
    mutationFn: async (scriptId: number) => {
      await api.delete(`/api/scripts/${scriptId}`)
      return scriptId
    },
    onMutate: async (scriptId) => {
      await queryClient.cancelQueries({ queryKey: scriptQueryKeys.lists() })
      
      const previousData = queryClient.getQueriesData({ queryKey: scriptQueryKeys.lists() })
      
      // 낙관적으로 목록에서 제거
      queryClient.setQueriesData(
        { queryKey: scriptQueryKeys.lists() },
        (old: ScriptsQueryData | undefined) => {
          if (old?.scripts) {
            const filteredScripts = old.scripts.filter((script: Script) => script.id !== scriptId)
            return {
              ...old,
              scripts: filteredScripts,
              total: Math.max(0, old.total - 1)
            }
          }
          return old
        }
      )

      return { previousData, scriptId }
    },
    onSuccess: (scriptId) => {
      // 상세 쿼리 제거
      queryClient.removeQueries({ queryKey: scriptQueryKeys.detail(scriptId) })
      
      // 통계 무효화
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.stats() })
      
      success('스크립트 삭제 완료')
    },
    onError: (err, _variables, context) => {
      // 실패 시 모든 이전 데이터 복구
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      errorHandler.setError(err, 'Script delete failed')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.lists() })
    }
  })

  // 배치 삭제 Mutation
  const batchDeleteMutation = useMutation({
    mutationFn: async (scriptIds: number[]) => {
      await api.delete('/api/scripts/batch', {
        data: { script_ids: scriptIds }
      })
      return scriptIds
    },
    onSuccess: (deletedIds) => {
      // 삭제된 스크립트들의 상세 쿼리 제거
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: scriptQueryKeys.detail(id) })
      })
      
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.stats() })
      
      success(
        '배치 삭제 완료', 
        `${deletedIds.length}개의 스크립트가 삭제되었습니다.`
      )
    },
    onError: (err) => {
      errorHandler.setError(err, 'Batch delete failed')
    }
  })

  // Computed values (Zustand getters 대체)
  const computedData = useMemo(() => {
    const scripts = scriptsQuery.data?.scripts || []
    const stats = statsQuery.data

    // 필터링된 스크립트들
    const filteredScripts = scripts.filter(script => {
      // 검색 필터
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matchesSearch = script.title.toLowerCase().includes(query) ||
                             script.description?.toLowerCase().includes(query) ||
                             script.filename.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // 상태 필터
      if (filters.statusFilter !== 'all') {
        if (script.status !== filters.statusFilter) return false
      }

      return true
    })

    // 정렬
    const sortedScripts = [...filteredScripts].sort((a, b) => {
      let comparison = 0
      switch (filters.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'updated_at':
          comparison = new Date(a.updated_at || a.created_at).getTime() - 
                      new Date(b.updated_at || b.created_at).getTime()
          break
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    // 페이지네이션
    const startIndex = (filters.currentPage - 1) * filters.pageSize
    const endIndex = startIndex + filters.pageSize
    const visibleScripts = sortedScripts.slice(startIndex, endIndex)

    return {
      allScripts: scripts,
      filteredScripts: sortedScripts,
      visibleScripts,
      totalCount: sortedScripts.length,
      stats: stats || {
        total: scripts.length,
        byStatus: {
          script_ready: 0,
          video_ready: 0,
          uploaded: 0,
          scheduled: 0,
          error: 0
        }
      }
    }
  }, [scriptsQuery.data, statsQuery.data, filters])

  // 유틸리티 함수들
  const actions = useMemo(() => ({
    // CRUD 작업들
    createScript: (scriptData: FormData) => createMutation.mutate(scriptData),
    updateScript: (id: number, data: Partial<Script>) => updateMutation.mutate({ id, data }),
    deleteScript: (id: number) => deleteMutation.mutate(id),
    batchDeleteScripts: (ids: number[]) => batchDeleteMutation.mutate(ids),

    // 쿼리 무효화 헬퍼들
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: scriptQueryKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: scriptQueryKeys.lists() }),
    invalidateStats: () => queryClient.invalidateQueries({ queryKey: scriptQueryKeys.stats() }),
    
    // 프리페치 헬퍼
    prefetchScript: (id: number) => {
      return queryClient.prefetchQuery({
        queryKey: scriptQueryKeys.detail(id),
        queryFn: async () => {
          const response = await api.get(`/api/scripts/${id}`)
          return response.data.data
        },
        staleTime: 5 * 60 * 1000
      })
    }
  }), [createMutation, updateMutation, deleteMutation, batchDeleteMutation, queryClient])

  return {
    // 데이터
    ...computedData,
    
    // 로딩 상태들
    isLoading: scriptsQuery.isLoading,
    isStatsLoading: statsQuery.isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBatchDeleting: batchDeleteMutation.isPending,
    
    // 에러 상태들
    error: scriptsQuery.error || statsQuery.error,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    
    // 액션들
    ...actions,
    
    // 현재 필터 상태
    filters
  }
}

/**
 * 단일 스크립트 상세 조회 훅
 */
export function useScript(scriptId: number, enabled = true) {
  return useQuery({
    queryKey: scriptQueryKeys.detail(scriptId),
    queryFn: async () => {
      const response = await api.get(`/api/scripts/${scriptId}`)
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 상세 정보는 5분간 신선
    gcTime: 10 * 60 * 1000,
    enabled: enabled && !!scriptId,
  })
}

/**
 * 경량화된 스크립트 통계 전용 훅 (대시보드용)
 */
export function useScriptStats() {
  return useQuery({
    queryKey: scriptQueryKeys.stats(),
    queryFn: async () => {
      const response = await api.get('/scripts/stats/summary')
      return response.data.data
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000,
    refetchInterval: 30 * 1000,
  })
}