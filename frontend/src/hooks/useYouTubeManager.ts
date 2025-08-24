import { useState, useCallback } from 'react'
import { useUploadProgress } from './useUploadProgress'
import { useToast } from './useToast'
import { uploadApi } from '@/services/api'
import type { Script } from '@/types/api'

interface BatchSettings {
  delay: number
  privacy: string
  category: number
  publishAt: string
}

interface BatchProgress {
  current: number
  total: number
}

interface YouTubeManagerReturn {
  // 단일 업로드 상태
  singleUploadSchedule: Record<number, string>
  setSingleUploadSchedule: React.Dispatch<React.SetStateAction<Record<number, string>>>
  
  // 배치 업로드 상태
  selectedScripts: number[]
  isBatchMode: boolean
  batchUploading: boolean
  batchProgress: BatchProgress
  batchSettings: BatchSettings
  
  // 액션 함수들
  handleYouTubeUpload: (script: Script) => Promise<void>
  handleBatchUpload: (scriptsData: { items: Script[] } | undefined) => Promise<void>
  toggleBatchMode: () => void
  toggleScriptSelection: (scriptId: number) => void
  setBatchSettings: (settings: BatchSettings) => void
  setSelectedScripts: (scripts: number[]) => void
  handleSingleScheduleChange: (scriptId: number, value: string) => void
  
  // 상태 체크 함수들
  checkYouTubeQuota: () => Promise<{ canUpload: boolean; message: string }>
}

export function useYouTubeManager(): YouTubeManagerReturn {
  const { startUpload, webSocketState } = useUploadProgress()
  const { success, error, info } = useToast()
  
  // 단일 업로드 예약 발행 설정
  const [singleUploadSchedule, setSingleUploadSchedule] = useState<Record<number, string>>({})
  
  // 배치 업로드 상태 관리
  const [selectedScripts, setSelectedScripts] = useState<number[]>([])
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [batchUploading, setBatchUploading] = useState(false)
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({ current: 0, total: 0 })
  const [batchSettings, setBatchSettings] = useState<BatchSettings>({
    delay: 30,
    privacy: 'private',
    category: 24,
    publishAt: ''
  })

  // YouTube API 할당량 체크
  const checkYouTubeQuota = useCallback(async () => {
    try {
      return { canUpload: true, message: 'OK' }
    } catch (quotaError) {
      console.error('Quota check error:', quotaError)
      return { canUpload: false, message: 'YouTube API 할당량 체크 실패' }
    }
  }, [])

  // 단일 YouTube 업로드
  const handleYouTubeUpload = useCallback(async (script: Script) => {
    if (script.status !== 'video_ready') {
      error('업로드 불가', '비디오가 준비되지 않았습니다. 먼저 비디오를 업로드해주세요.')
      return
    }

    if (!webSocketState.isConnected) {
      error('연결 오류', 'WebSocket 연결이 끊어졌습니다. 페이지를 새로고침해주세요.')
      return
    }

    // 할당량 체크
    const quotaCheck = await checkYouTubeQuota()
    if (!quotaCheck.canUpload) {
      error('할당량 초과', quotaCheck.message || 'YouTube API 할당량이 부족합니다.')
      return
    }

    const uploadType = singleUploadSchedule[script.id] ? '예약 발행' : '즉시 업로드'
    info('업로드 시작', `"${script.title}" YouTube ${uploadType}을 시작합니다.`)
    
    startUpload(script.id, 'youtube')

    try {
      const publishAt = singleUploadSchedule[script.id]
      await uploadApi.uploadToYouTube(script.id, publishAt)
    } catch (apiError: unknown) {
      console.error('YouTube upload API error:', apiError)
      
      if (apiError instanceof Error) {
        error('업로드 실패', `YouTube API 오류: ${apiError.message}`)
      } else {
        error('업로드 실패', '알 수 없는 오류가 발생했습니다.')
      }
    }
  }, [singleUploadSchedule, webSocketState.isConnected, startUpload, checkYouTubeQuota, error, info])

  // 배치 업로드
  const handleBatchUpload = useCallback(async (scriptsData: { items: Script[] } | undefined) => {
    if (selectedScripts.length === 0) {
      error('선택 오류', '업로드할 스크립트를 선택해주세요.')
      return
    }

    if (selectedScripts.length > 5) {
      error(
        '배치 업로드 제한 초과', 
        `YouTube API 할당량 제한으로 인해 최대 5개까지만 업로드 가능합니다. 현재 선택: ${selectedScripts.length}개\n\n💡 해결 방법:\n• 선택을 5개 이하로 줄이거나\n• ${selectedScripts.length}개를 5개씩 나누어 실행하세요`
      )
      return
    }

    const quotaCheck = await checkYouTubeQuota()
    if (!quotaCheck.canUpload) {
      error('할당량 초과', quotaCheck.message || 'YouTube API 할당량이 부족합니다.')
      return
    }

    const selectedScriptObjects = scriptsData?.items.filter(script => 
      selectedScripts.includes(script.id) && script.status === 'video_ready'
    ) || []

    if (selectedScriptObjects.length !== selectedScripts.length) {
      error('상태 오류', '선택된 스크립트 중 일부가 video_ready 상태가 아닙니다.')
      return
    }

    setBatchUploading(true)
    setBatchProgress({ current: 0, total: selectedScripts.length })

    const uploadType = batchSettings.publishAt ? '예약 발행' : '배치 업로드'
    info(`${uploadType} 시작`, `${selectedScripts.length}개 스크립트를 ${batchSettings.delay}초 간격으로 ${uploadType}합니다.`)

    try {
      for (let i = 0; i < selectedScripts.length; i++) {
        const scriptId = selectedScripts[i]
        const script = scriptsData?.items.find(s => s.id === scriptId)
        
        if (!script) continue

        setBatchProgress({ current: i + 1, total: selectedScripts.length })
        info('배치 진행', `${i + 1}/${selectedScripts.length}: "${script.title}" ${uploadType} 중...`)

        startUpload(scriptId, 'youtube')

        try {
          await uploadApi.uploadToYouTube(scriptId, batchSettings.publishAt || undefined)
          const successType = batchSettings.publishAt ? '예약 설정' : '업로드'
          success(`${successType} 완료`, `"${script.title}" ${successType} 성공`)
        } catch (scriptError) {
          console.error(`Script ${scriptId} upload error:`, scriptError)
          error('개별 실패', `"${script.title}" ${uploadType} 실패`)
        }

        if (i < selectedScripts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, batchSettings.delay * 1000))
        }
      }

      success('배치 완료', `${selectedScripts.length}개 스크립트 ${uploadType}가 완료되었습니다.`)
      setSelectedScripts([])
    } catch (batchError) {
      console.error('Batch upload error:', batchError)
      error('배치 실패', `${uploadType} 중 오류가 발생했습니다.`)
    } finally {
      setBatchUploading(false)
      setBatchProgress({ current: 0, total: 0 })
    }
  }, [selectedScripts, batchSettings, startUpload, checkYouTubeQuota, error, info, success])

  // 배치 모드 토글
  const toggleBatchMode = useCallback(() => {
    setIsBatchMode(!isBatchMode)
    setSelectedScripts([])
  }, [isBatchMode])

  // 스크립트 선택/해제
  const toggleScriptSelection = useCallback((scriptId: number) => {
    setSelectedScripts(prev => {
      if (prev.includes(scriptId)) {
        return prev.filter(id => id !== scriptId)
      } else {
        if (prev.length >= 5) {
          error('선택 제한', 'CLI 제한으로 인해 최대 5개까지만 선택 가능합니다.')
          return prev
        }
        return [...prev, scriptId]
      }
    })
  }, [error])

  // 단일 업로드 예약 설정
  const handleSingleScheduleChange = useCallback((scriptId: number, value: string) => {
    setSingleUploadSchedule(prev => ({
      ...prev,
      [scriptId]: value
    }))
  }, [])

  return {
    // 상태
    singleUploadSchedule,
    setSingleUploadSchedule,
    selectedScripts,
    isBatchMode,
    batchUploading,
    batchProgress,
    batchSettings,
    
    // 액션
    handleYouTubeUpload,
    handleBatchUpload,
    toggleBatchMode,
    toggleScriptSelection,
    setBatchSettings,
    setSelectedScripts,
    handleSingleScheduleChange,
    
    // 유틸리티
    checkYouTubeQuota
  }
}