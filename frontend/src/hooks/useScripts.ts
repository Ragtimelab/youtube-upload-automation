import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scriptService } from '@/services/scripts'
import { Script } from '@/types'

// 대본 목록 조회 훅
export const useScripts = (params: {
  page?: number
  limit?: number
  status?: string
} = {}) => {
  return useQuery({
    queryKey: ['scripts', params],
    queryFn: () => scriptService.getScripts(params),
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    keepPreviousData: true, // 페이지네이션 시 이전 데이터 유지
  })
}

// 개별 대본 조회 훅
export const useScript = (id: number) => {
  return useQuery({
    queryKey: ['script', id],
    queryFn: () => scriptService.getScript(id),
    enabled: !!id, // id가 있을 때만 쿼리 실행
  })
}

// 대본 뮤테이션 훅들
export const useScriptMutations = () => {
  const queryClient = useQueryClient()

  const uploadScript = useMutation({
    mutationFn: scriptService.uploadScript,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
    },
  })

  const updateScript = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Script> }) =>
      scriptService.updateScript(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
      queryClient.setQueryData(['script', data.id], data)
    },
  })

  const deleteScript = useMutation({
    mutationFn: scriptService.deleteScript,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
    },
  })

  return {
    uploadScript,
    updateScript,
    deleteScript,
  }
}