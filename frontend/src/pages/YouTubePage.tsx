import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { scriptApi } from '@/services/api'
import { useUploadProgress } from '@/hooks/useUploadProgress'
import { useYouTubeManager } from '@/hooks/useYouTubeManager'
import { WebSocketStatus } from '@/components/WebSocketStatus'
import { YouTubeSearchFilter } from '@/components/youtube/YouTubeSearchFilter'
import { YouTubeBatchControls } from '@/components/youtube/YouTubeBatchControls'
import { YouTubeScriptList } from '@/components/youtube/YouTubeScriptList'
import { YouTubeStatsCards } from '@/components/youtube/YouTubeStatsCards'
import { Activity } from 'lucide-react'
import type { YouTubeUploadProgress, YouTubeUploadStep } from '@/types/youtube'
import type { Script } from '@/types/api'

export function YouTubePage() {
  const { 
    uploadStates, 
    webSocketState,
    getActiveUploads 
  } = useUploadProgress()
  
  const {
    singleUploadSchedule,
    selectedScripts,
    isBatchMode,
    batchUploading,
    batchProgress,
    batchSettings,
    handleYouTubeUpload,
    handleBatchUpload,
    toggleBatchMode,
    toggleScriptSelection,
    setBatchSettings,
    setSelectedScripts,
    handleSingleScheduleChange
  } = useYouTubeManager()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // 스크립트 목록 조회
  const { data: scriptsData, isLoading, refetch } = useQuery({
    queryKey: ['scripts', 1, 50],
    queryFn: () => scriptApi.getScripts(1, 50)
  })

  // 업로드 상태별 필터링
  const filteredScripts = scriptsData?.items.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (script.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.filename.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && script.status === statusFilter
  }) || []

  // UploadState를 YouTubeUploadProgress로 변환
  const youtubeUploadStates = useMemo((): Record<number, YouTubeUploadProgress> => {
    const converted: Record<number, YouTubeUploadProgress> = {}
    
    Object.entries(uploadStates).forEach(([scriptId, uploadState]) => {
      // 기본 step 결정 로직
      let step: YouTubeUploadStep = 'preparing'
      if (uploadState.progress > 0 && uploadState.progress < 50) {
        step = 'uploading'
      } else if (uploadState.progress >= 50 && uploadState.progress < 100) {
        step = 'processing'
      } else if (uploadState.progress === 100 && !uploadState.error) {
        step = 'completed'
      } else if (uploadState.error) {
        step = 'error'
      }

      converted[parseInt(scriptId)] = {
        ...uploadState,
        step
      }
    })
    
    return converted
  }, [uploadStates])

  // 배치 업로드 실행 래퍼 (refetch 포함)
  const handleBatchUploadWithRefetch = async () => {
    await handleBatchUpload(scriptsData)
    refetch()
  }

  // 단일 업로드 실행 래퍼 (refetch 포함)
  const handleSingleUploadWithRefetch = async (script: Script) => {
    await handleYouTubeUpload(script)
    refetch()
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">YouTube 업로드 관리</h1>
            <p className="text-gray-600">스크립트를 선택하여 YouTube에 업로드하세요.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <WebSocketStatus 
              isConnected={webSocketState.isConnected}
              connectionStatus={webSocketState.connectionStatus}
            />
            {batchUploading && (
              <div className="flex items-center gap-2 text-blue-600">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">{batchProgress.current}개 업로드 중</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <YouTubeStatsCards
        scripts={filteredScripts}
        totalItems={scriptsData?.total || 0}
        activeUploads={getActiveUploads().length}
      />

      {/* 검색 및 필터 */}
      <YouTubeSearchFilter
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        isBatchMode={isBatchMode}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onBatchModeToggle={toggleBatchMode}
      />

      {/* 배치 모드 컨트롤 바 */}
      {isBatchMode && (
        <YouTubeBatchControls
          selectedScripts={selectedScripts}
          batchUploading={batchUploading}
          batchProgress={batchProgress}
          batchSettings={batchSettings}
          onBatchUpload={handleBatchUploadWithRefetch}
          onBatchSettingsChange={setBatchSettings}
          onClearSelection={() => setSelectedScripts([])}
        />
      )}

      {/* 배치 업로드 설정 */}
      {isBatchMode && (
        <YouTubeBatchControls
          selectedScripts={selectedScripts}
          batchUploading={batchUploading}
          batchProgress={batchProgress}
          batchSettings={batchSettings}
          onBatchUpload={handleBatchUploadWithRefetch}
          onBatchSettingsChange={setBatchSettings}
          onClearSelection={() => setSelectedScripts([])}
        />
      )}

      {/* 스크립트 목록 */}
      <YouTubeScriptList
        scripts={filteredScripts}
        isLoading={isLoading}
        isBatchMode={isBatchMode}
        selectedScripts={selectedScripts}
        uploadStates={youtubeUploadStates}
        singleUploadSchedule={singleUploadSchedule}
        onYouTubeUpload={handleSingleUploadWithRefetch}
        onToggleSelection={toggleScriptSelection}
        onScheduleChange={handleSingleScheduleChange}
      />
    </div>
  )
}