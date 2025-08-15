import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadService } from '@/services/uploads'
import { YouTubeUploadRequest } from '@/types'

// 업로드 상태 조회 훅
export const useUploadStatus = (scriptId: number) => {
  return useQuery({
    queryKey: ['upload-status', scriptId],
    queryFn: () => uploadService.getUploadStatus(scriptId),
    enabled: !!scriptId,
    refetchInterval: (data) => {
      // 업로드 진행 중이면 5초마다 갱신
      if (data?.status === 'uploading') {
        return 5000
      }
      return false
    },
  })
}

// 업로드 뮤테이션 훅들
export const useUploadMutations = () => {
  const queryClient = useQueryClient()

  const uploadVideo = useMutation({
    mutationFn: ({ scriptId, videoFile }: { scriptId: number; videoFile: File }) =>
      uploadService.uploadVideo(scriptId, videoFile),
    onSuccess: (_, { scriptId }) => {
      queryClient.invalidateQueries({ queryKey: ['script', scriptId] })
      queryClient.invalidateQueries({ queryKey: ['upload-status', scriptId] })
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
    },
  })

  const uploadToYouTube = useMutation({
    mutationFn: ({ scriptId, options }: {
      scriptId: number
      options: YouTubeUploadRequest
    }) => uploadService.uploadToYouTube(scriptId, options),
    onSuccess: (_, { scriptId }) => {
      queryClient.invalidateQueries({ queryKey: ['script', scriptId] })
      queryClient.invalidateQueries({ queryKey: ['upload-status', scriptId] })
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
    },
  })

  const deleteVideo = useMutation({
    mutationFn: uploadService.deleteVideo,
    onSuccess: (_, scriptId) => {
      queryClient.invalidateQueries({ queryKey: ['script', scriptId] })
      queryClient.invalidateQueries({ queryKey: ['upload-status', scriptId] })
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
    },
  })

  return {
    uploadVideo,
    uploadToYouTube,
    deleteVideo,
  }
}