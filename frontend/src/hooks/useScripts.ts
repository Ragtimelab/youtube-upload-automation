import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scriptApi } from '@/services/api'
import type { Script, PaginatedResponse } from '@/types/api'

// 스크립트 목록 조회
export function useScripts(page = 1, perPage = 10) {
  return useQuery<PaginatedResponse<Script>>({
    queryKey: ['scripts', page, perPage],
    queryFn: () => scriptApi.getScripts(page, perPage),
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// 특정 스크립트 조회
export function useScript(id: number) {
  return useQuery<Script>({
    queryKey: ['script', id],
    queryFn: () => scriptApi.getScript(id),
    enabled: !!id,
  })
}

// 스크립트 업로드
export function useUploadScript() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (file: File) => scriptApi.uploadScript(file),
    onSuccess: () => {
      // 업로드 성공 시 스크립트 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
    },
  })
}

// 스크립트 삭제
export function useDeleteScript() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => scriptApi.deleteScript(id),
    onSuccess: () => {
      // 삭제 성공 시 스크립트 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
    },
  })
}

// 스크립트 수정
export function useUpdateScript() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Script> }) => 
      scriptApi.updateScript(id, data),
    onSuccess: (data) => {
      // 수정 성공 시 해당 스크립트와 목록 새로고침
      queryClient.setQueryData(['script', data.id], data)
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
    },
  })
}