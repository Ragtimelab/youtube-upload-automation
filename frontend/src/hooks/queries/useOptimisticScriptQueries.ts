import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToastHelpers } from '@/hooks/useToastContext'
import { useRetry, useYouTubeRetry, useUploadRetry } from '@/hooks/useRetry'
import { scriptApi, uploadApi } from '@/services/api'
import { scriptQueryKeys } from './useScriptQueries'
import { isAxiosError, extractStatusCode, extractErrorMessage, extractYouTubeErrorInfo } from '@/utils/typeGuards'
import type { Script } from '@/types'

/**
 * Phase 5: useRetry 훅이 통합된 낙관적 업데이트 Mutations
 * 글로벌 원칙: 근본 해결 - 에러 복구와 사용자 경험을 모두 보장
 */

/**
 * 재시도 가능한 스크립트 생성 Mutation
 */
export function useOptimisticCreateScriptMutation() {
  const queryClient = useQueryClient()
  const { success, error } = useToastHelpers()
  
  // 스크립트 업로드 함수에 재시도 로직 적용
  const { execute: executeUpload, isRetrying, currentAttempt } = useUploadRetry(
    async (scriptData: FormData) => {
      return await scriptApi.uploadScript(scriptData.get('file') as File)
    },
    {
      maxAttempts: 3,
      onRetry: (_err, attempt) => {
        error(`스크립트 업로드 재시도 중... (${attempt}/3)`, '네트워크 오류로 인한 재시도입니다.')
      }
    }
  )

  return useMutation({
    mutationFn: executeUpload,
    onMutate: async (scriptData: FormData) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: scriptQueryKeys.lists() })
      
      // 낙관적 업데이트용 임시 스크립트 객체 생성
      const fileName = (scriptData.get('file') as File)?.name || 'Unknown'
      const optimisticScript: Partial<Script> = {
        id: Date.now(), // 임시 ID
        title: fileName.replace(/\.[^/.]+$/, ''), // 파일 확장자 제거
        status: 'script_ready',
        created_at: new Date().toISOString(),
        // 재시도 중인 경우 특별한 표시
        ...(isRetrying && { 
          title: `${fileName.replace(/\.[^/.]+$/, '')} (재시도 ${currentAttempt}/3)`
        })
      }

      // 이전 데이터 백업
      const previousData = queryClient.getQueriesData({ queryKey: scriptQueryKeys.lists() })
      
      // 낙관적 업데이트
      queryClient.setQueriesData(
        { queryKey: scriptQueryKeys.lists() },
        (old: { scripts?: Script[]; total?: number } | undefined) => {
          if (old?.scripts) {
            return {
              ...old,
              scripts: [optimisticScript, ...old.scripts],
              total: (old.total ?? 0) + 1
            }
          }
          return old
        }
      )

      return { previousData, optimisticScript }
    },
    onSuccess: (newScript, _variables, context) => {
      // 성공 시 실제 데이터로 교체
      queryClient.setQueriesData(
        { queryKey: scriptQueryKeys.lists() },
        (old: { scripts?: Script[]; total?: number } | undefined) => {
          if (old?.scripts && context?.optimisticScript) {
            const updatedScripts = old.scripts.map((script: Script) => 
              script.id === context.optimisticScript.id ? newScript : script
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
      // 실패 시 모든 이전 데이터 복구
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      error(
        '스크립트 업로드 실패', 
        `${err instanceof Error ? err.message : '알 수 없는 오류'}${isRetrying ? ' (재시도 중)' : ''}`
      )
    },
    onSettled: () => {
      // 항상 관련 쿼리 새로고침
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.lists() })
    }
  })
}

/**
 * 재시도 가능한 YouTube 업로드 Mutation
 */
export function useOptimisticYouTubeUploadMutation() {
  const queryClient = useQueryClient()
  const { success, error, info } = useToastHelpers()
  
  // YouTube API 전용 재시도 로직
  const { execute: executeYouTubeUpload, isRetrying, currentAttempt } = useYouTubeRetry(
    async ({ scriptId, publishAt }: { scriptId: number; publishAt?: string }) => {
      return await uploadApi.uploadToYouTube(scriptId, publishAt)
    },
    {
      maxAttempts: 5, // YouTube는 더 많은 재시도
      onRetry: (_err, attempt) => {
        const reason = isAxiosError(_err) ? _err?.response?.data?.error?.reason : null
        if (reason === 'rateLimitExceeded') {
          info(`YouTube API 제한으로 인한 재시도... (${attempt}/5)`, '잠시 후 자동으로 재시도됩니다.')
        } else {
          error(`YouTube 업로드 재시도 중... (${attempt}/5)`, _err instanceof Error ? _err.message : '알 수 없는 오류')
        }
      }
    }
  )

  return useMutation({
    mutationFn: executeYouTubeUpload,
    onMutate: async ({ scriptId }) => {
      await queryClient.cancelQueries({ queryKey: scriptQueryKeys.detail(scriptId) })
      
      const previousScript = queryClient.getQueryData(scriptQueryKeys.detail(scriptId))
      
      // 낙관적으로 업로드 상태로 변경
      queryClient.setQueryData(scriptQueryKeys.detail(scriptId), (old: Script | undefined) => {
        if (old) {
          return {
            ...old,
            status: 'uploading' as const,
            // 재시도 중인 경우 특별한 표시
            ...(isRetrying && {
              upload_progress: `YouTube 재시도 중... (${currentAttempt}/5)`
            })
          }
        }
        return old
      })

      return { previousScript, scriptId }
    },
    onSuccess: (uploadResult, { scriptId }) => {
      // 업로드 성공 상태로 업데이트
      queryClient.setQueryData(scriptQueryKeys.detail(scriptId), (old: Script | undefined) => {
        if (old) {
          return {
            ...old,
            status: 'uploaded' as const,
            youtube_video_id: uploadResult.youtube_video_id,
            youtube_url: uploadResult.youtube_url,
            upload_progress: '업로드 완료'
          }
        }
        return old
      })
      
      // 목록에서도 상태 업데이트
      queryClient.setQueriesData(
        { queryKey: scriptQueryKeys.lists() },
        (old: { scripts?: Script[]; total?: number } | undefined) => {
          if (old?.scripts) {
            const updatedScripts = old.scripts.map((script: Script) =>
              script.id === scriptId 
                ? { ...script, status: 'uploaded' as const, youtube_video_id: uploadResult.youtube_video_id }
                : script
            )
            return { ...old, scripts: updatedScripts }
          }
          return old
        }
      )
      
      success('YouTube 업로드 완료!', '동영상이 성공적으로 업로드되었습니다.')
    },
    onError: (err, { scriptId }, context) => {
      // 실패 시 이전 상태로 롤백
      if (context?.previousScript) {
        queryClient.setQueryData(scriptQueryKeys.detail(scriptId), context.previousScript)
      }
      
      // 목록에서도 에러 상태로 업데이트
      queryClient.setQueriesData(
        { queryKey: scriptQueryKeys.lists() },
        (old: { scripts?: Script[]; total?: number } | undefined) => {
          if (old?.scripts) {
            const updatedScripts = old.scripts.map((script: Script) =>
              script.id === scriptId 
                ? { ...script, status: 'error' as const, upload_progress: 'YouTube 업로드 실패' }
                : script
            )
            return { ...old, scripts: updatedScripts }
          }
          return old
        }
      )
      
      const errorMsg = extractErrorMessage(err)
      const { reason } = extractYouTubeErrorInfo(err)
      const isQuotaError = reason === 'quotaExceeded'
      
      error(
        'YouTube 업로드 실패', 
        isQuotaError 
          ? 'YouTube API 일일 할당량이 초과되었습니다. 내일 다시 시도해주세요.'
          : errorMsg
      )
    }
  })
}

/**
 * 재시도 가능한 스크립트 삭제 Mutation
 */
export function useOptimisticDeleteScriptMutation() {
  const queryClient = useQueryClient()
  const { success, error } = useToastHelpers()
  
  // 삭제 작업에 재시도 로직 적용
  const { execute: executeDelete, isRetrying, currentAttempt: _currentAttempt } = useRetry(
    async (scriptId: number) => {
      await scriptApi.deleteScript(scriptId)
      return scriptId
    },
    {
      maxAttempts: 3,
      retryCondition: (err) => {
        // 404는 이미 삭제된 것으로 간주하여 재시도 안함
        const status = extractStatusCode(err)
        if (status === 404) return false
        
        if (isAxiosError(err)) {
          return (status !== null && status >= 500) || err.message?.includes('Network Error')
        }
        return false
      },
      onRetry: (_err, attempt) => {
        error(`스크립트 삭제 재시도 중... (${attempt}/3)`, '네트워크 오류로 인한 재시도입니다.')
      }
    }
  )

  return useMutation({
    mutationFn: executeDelete,
    onMutate: async (scriptId: number) => {
      await queryClient.cancelQueries({ queryKey: scriptQueryKeys.lists() })
      
      const previousData = queryClient.getQueriesData({ queryKey: scriptQueryKeys.lists() })
      
      // 낙관적으로 목록에서 제거
      queryClient.setQueriesData(
        { queryKey: scriptQueryKeys.lists() },
        (old: { scripts?: Script[]; total?: number } | undefined) => {
          if (old?.scripts) {
            const filteredScripts = old.scripts.filter((script: Script) => script.id !== scriptId)
            return {
              ...old,
              scripts: filteredScripts,
              total: Math.max(0, (old.total ?? 0) - 1)
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
    onError: (err, _scriptId, context) => {
      // 404 에러는 이미 삭제된 것으로 처리
      const status = extractStatusCode(err)
      if (status === 404) {
        success('스크립트 삭제 완료', '이미 삭제된 스크립트입니다.')
        return
      }
      
      // 실패 시 모든 이전 데이터 복구
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      error(
        '스크립트 삭제 실패', 
        `${err instanceof Error ? err.message : '알 수 없는 오류'}${isRetrying ? ' (재시도 중)' : ''}`
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.lists() })
    }
  })
}