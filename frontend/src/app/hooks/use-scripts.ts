import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scriptApi } from '@/entities/script/api'
import { useAppStore } from '@/app/store/app-store'
import type { GetScriptsParams, CreateScriptRequest, UpdateScriptRequest } from '@/shared/types'

// 쿼리 키 팩토리
export const scriptKeys = {
  all: ['scripts'] as const,
  lists: () => [...scriptKeys.all, 'list'] as const,
  list: (params: GetScriptsParams) => [...scriptKeys.lists(), params] as const,
  details: () => [...scriptKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...scriptKeys.details(), id] as const,
  stats: () => [...scriptKeys.all, 'stats'] as const,
}

// 스크립트 목록 조회 훅
export function useScripts(params: GetScriptsParams = {}) {
  return useQuery({
    queryKey: scriptKeys.list(params),
    queryFn: () => scriptApi.getScripts(params),
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// 스크립트 상세 조회 훅
export function useScript(id: string | number) {
  return useQuery({
    queryKey: scriptKeys.detail(id),
    queryFn: () => scriptApi.getScript(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// 스크립트 통계 조회 훅
export function useScriptStats() {
  return useQuery({
    queryKey: scriptKeys.stats(),
    queryFn: () => scriptApi.getScriptStats(),
    staleTime: 2 * 60 * 1000, // 2분
  })
}

// 스크립트 뮤테이션 훅
export function useScriptMutations() {
  const queryClient = useQueryClient()
  const addNotification = useAppStore((state) => state.addNotification)

  const uploadScript = useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (progress: number) => void }) =>
      scriptApi.uploadScriptFile(file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scriptKeys.all })
      addNotification({
        type: 'success',
        title: '업로드 완료',
        message: '스크립트 파일이 성공적으로 업로드되었습니다.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '업로드 실패',
        message: error.message || '스크립트 업로드 중 오류가 발생했습니다.',
      })
    },
  })

  const createScript = useMutation({
    mutationFn: (data: CreateScriptRequest) => scriptApi.createScript(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scriptKeys.all })
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '새 스크립트가 생성되었습니다.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: error.message || '스크립트 생성 중 오류가 발생했습니다.',
      })
    },
  })

  const updateScript = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateScriptRequest }) =>
      scriptApi.updateScript(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: scriptKeys.all })
      queryClient.invalidateQueries({ queryKey: scriptKeys.detail(id) })
      addNotification({
        type: 'success',
        title: '수정 완료',
        message: '스크립트가 수정되었습니다.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '수정 실패',
        message: error.message || '스크립트 수정 중 오류가 발생했습니다.',
      })
    },
  })

  const deleteScript = useMutation({
    mutationFn: (id: string | number) => scriptApi.deleteScript(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scriptKeys.all })
      addNotification({
        type: 'success',
        title: '삭제 완료',
        message: '스크립트가 삭제되었습니다.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '삭제 실패',
        message: error.message || '스크립트 삭제 중 오류가 발생했습니다.',
      })
    },
  })

  return {
    uploadScript,
    createScript,
    updateScript,
    deleteScript,
  }
}