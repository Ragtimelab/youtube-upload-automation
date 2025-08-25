import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadApi } from '@/services/api'

// 비디오 업로드
export function useUploadVideo(onError?: (error: any) => void) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ scriptId, file }: { scriptId: number; file: File }) => 
      uploadApi.uploadVideo(scriptId, file),
    onSuccess: (data) => {
      // 업로드 성공 시 스크립트 상태 업데이트
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
      queryClient.invalidateQueries({ queryKey: ['script', data.script_id] })
    },
    onError: onError || ((error) => {
      console.error('Video upload failed:', error)
    })
  })
}

// YouTube 업로드
export function useUploadToYouTube() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (scriptId: number) => uploadApi.uploadToYouTube(scriptId),
    onSuccess: (data) => {
      // YouTube 업로드 시작 시 상태 업데이트
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
      queryClient.invalidateQueries({ queryKey: ['script', data.script_id] })
    },
  })
}