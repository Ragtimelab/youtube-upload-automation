import { useMutation, useQuery } from '@tanstack/react-query'
import { uploadApi } from '@/entities/upload/api'
import { useAppStore } from '@/app/store/app-store'
import { useUploadStore } from '@/app/store/upload-store'
import type { YouTubeUploadRequest, ID } from '@/shared/types'

// 업로드 상태 조회 훅
export function useUploadStatus(scriptId: ID) {
  return useQuery({
    queryKey: ['upload-status', scriptId],
    queryFn: () => uploadApi.getUploadStatus(scriptId),
    enabled: !!scriptId,
    refetchInterval: 5000, // 5초마다 폴링
    staleTime: 0, // 항상 최신 상태 조회
  })
}

// 업로드 뮤테이션 훅
export function useUploadMutations() {
  const addNotification = useAppStore((state) => state.addNotification)
  const setUploadProgress = useUploadStore((state) => state.setUploadProgress)
  const removeUpload = useUploadStore((state) => state.removeUpload)

  const uploadVideo = useMutation({
    mutationFn: ({ scriptId, file }: { scriptId: ID; file: File }) => {
      return uploadApi.uploadVideo(scriptId, file, (progress) => {
        setUploadProgress(scriptId, {
          script_id: scriptId,
          phase: 'video',
          current: progress,
          total: 100,
          percentage: progress,
          message: `비디오 업로드 중... ${progress}%`,
          started_at: new Date().toISOString(),
        })
      })
    },
    onSuccess: (_, { scriptId }) => {
      removeUpload(scriptId)
      addNotification({
        type: 'success',
        title: '비디오 업로드 완료',
        message: '비디오 파일이 성공적으로 업로드되었습니다.',
      })
    },
    onError: (error: any, { scriptId }) => {
      removeUpload(scriptId)
      addNotification({
        type: 'error',
        title: '비디오 업로드 실패',
        message: error.message || '비디오 업로드 중 오류가 발생했습니다.',
      })
    },
  })

  const uploadToYouTube = useMutation({
    mutationFn: ({ 
      scriptId, 
      data 
    }: { 
      scriptId: ID; 
      data: Omit<YouTubeUploadRequest, 'script_id'> 
    }) => {
      // YouTube 업로드 시작 시 진행 상태 설정
      setUploadProgress(scriptId, {
        script_id: scriptId,
        phase: 'youtube',
        current: 0,
        total: 100,
        percentage: 0,
        message: 'YouTube 업로드를 시작합니다...',
        started_at: new Date().toISOString(),
      })
      
      return uploadApi.uploadToYouTube(scriptId, data)
    },
    onSuccess: (_, { scriptId }) => {
      removeUpload(scriptId)
      addNotification({
        type: 'success',
        title: 'YouTube 업로드 완료',
        message: '비디오가 YouTube에 성공적으로 업로드되었습니다.',
      })
    },
    onError: (error: any, { scriptId }) => {
      removeUpload(scriptId)
      addNotification({
        type: 'error',
        title: 'YouTube 업로드 실패',
        message: error.message || 'YouTube 업로드 중 오류가 발생했습니다.',
      })
    },
  })

  const deleteVideo = useMutation({
    mutationFn: (scriptId: ID) => uploadApi.deleteVideo(scriptId),
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: '비디오 삭제 완료',
        message: '비디오 파일이 삭제되었습니다.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '비디오 삭제 실패',
        message: error.message || '비디오 삭제 중 오류가 발생했습니다.',
      })
    },
  })

  return {
    uploadVideo,
    uploadToYouTube,
    deleteVideo,
  }
}