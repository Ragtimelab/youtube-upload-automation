import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useMemo } from 'react'
import api from '@/services/api'
import { useToastHelpers } from '@/hooks/useToastContext'
import type { Script } from '@/types'

// 스크립트 목록 쿼리 응답 타입
interface ScriptsQueryData {
  scripts: Script[]
  total: number
  page: number
  limit: number
}

/**
 * Phase 4 최적화된 스크립트 전용 Query 훅들
 * 도메인별 캐시 전략 및 낙관적 업데이트 구현
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

/**
 * 스크립트 목록 조회 - 페이지네이션 최적화
 */
export function useScriptsQuery(params: {
  page?: number
  limit?: number
  status?: string
  search?: string
} = {}) {
  return useQuery({
    queryKey: scriptQueryKeys.list(params),
    queryFn: async () => {
      const response = await api.get('/api/scripts', { params })
      return {
        scripts: response.data.data,
        total: response.data.total || response.data.data.length,
        page: params.page || 1,
        limit: params.limit || 10
      }
    },
    staleTime: 2 * 60 * 1000, // 스크립트는 2분간 신선
    gcTime: 5 * 60 * 1000,    // 5분 캐시 유지
    placeholderData: keepPreviousData, // 페이지네이션 시 이전 데이터 유지
    enabled: true,
  })
}

/**
 * 단일 스크립트 상세 조회
 */
export function useScriptQuery(scriptId: number, enabled = true) {
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
 * 스크립트 통계 조회 - 대시보드용
 */
export function useScriptStatsQuery() {
  return useQuery({
    queryKey: scriptQueryKeys.stats(),
    queryFn: async () => {
      const response = await api.get('/api/scripts/stats')
      return response.data.data
    },
    staleTime: 1 * 60 * 1000, // 통계는 1분간 신선
    gcTime: 3 * 60 * 1000,
    refetchInterval: 30 * 1000, // 30초마다 자동 새로고침
  })
}

/**
 * 스크립트 생성 Mutation - 낙관적 업데이트
 */
export function useCreateScriptMutation() {
  const queryClient = useQueryClient()
  const { success, error } = useToastHelpers()

  return useMutation({
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
              scripts: [optimisticScript, ...old.scripts],
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
      
      error('스크립트 업로드 실패', err instanceof Error ? err.message : '알 수 없는 오류')
    },
    onSettled: () => {
      // 항상 관련 쿼리 새로고침
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.lists() })
    }
  })
}

/**
 * 스크립트 업데이트 Mutation
 */
export function useUpdateScriptMutation() {
  const queryClient = useQueryClient()
  const { success, error } = useToastHelpers()

  return useMutation({
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
      
      error('스크립트 업데이트 실패', err instanceof Error ? err.message : '알 수 없는 오류')
    }
  })
}

/**
 * 스크립트 삭제 Mutation - 낙관적 업데이트
 */
export function useDeleteScriptMutation() {
  const queryClient = useQueryClient()
  const { success, error } = useToastHelpers()

  return useMutation({
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
      
      error('스크립트 삭제 실패', err instanceof Error ? err.message : '알 수 없는 오류')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.lists() })
    }
  })
}

/**
 * 배치 스크립트 삭제 Mutation
 */
export function useDeleteScriptsMutation() {
  const queryClient = useQueryClient()
  const { success, error } = useToastHelpers()

  return useMutation({
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
      error('배치 삭제 실패', err instanceof Error ? err.message : '알 수 없는 오류')
    }
  })
}

/**
 * 스크립트 쿼리 무효화 헬퍼 훅
 */
export function useInvalidateScriptQueries() {
  const queryClient = useQueryClient()
  
  return useMemo(() => ({
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: scriptQueryKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: scriptQueryKeys.lists() }),
    invalidateDetail: (id: number) => queryClient.invalidateQueries({ queryKey: scriptQueryKeys.detail(id) }),
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
  }), [queryClient])
}