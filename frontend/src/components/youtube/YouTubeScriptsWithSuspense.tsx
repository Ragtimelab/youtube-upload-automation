import { Suspense, lazy, useMemo } from 'react'
import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/ui/ErrorDisplay'
import { commonLayouts } from '@/utils/classNames'
import type { Script, PaginatedResponse } from '@/types/api'
import type { UploadState, BatchSettings } from '@/types/common'
import type { YouTubeUploadProgress, YouTubeUploadStep } from '@/types/youtube'

// Lazy load된 스크립트 카드 컴포넌트
const YouTubeScriptCard = lazy(() => import('./YouTubeScriptCard').then(module => ({ 
  default: module.YouTubeScriptCard 
})))

// Lazy load된 배치 폼 컴포넌트
const YouTubeBatchForm = lazy(() => import('./YouTubeBatchForm').then(module => ({ 
  default: module.YouTubeBatchForm 
})))

interface YouTubeScriptsWithSuspenseProps {
  scripts: Script[]
  isBatchMode: boolean
  selectedScripts: number[]
  uploadStates: Record<number, UploadState>
  singleUploadSchedule: Record<number, string>
  batchSettings: BatchSettings
  scriptsData: PaginatedResponse<Script> | undefined
  onYouTubeUpload: (script: Script) => void
  onToggleSelection: (scriptId: number) => void
  onScheduleChange: (scriptId: number, value: string) => void
  onBatchSettingsChange: (settings: BatchSettings) => void
  onClearSelection: () => void
  onUploadComplete: () => void
}

/**
 * React 19 Suspense 경계가 적용된 YouTube 스크립트 목록
 * - 스크립트 카드들을 점진적으로 로딩
 * - 배치 폼 컴포넌트 lazy loading
 * - 각 섹션별 독립적인 Suspense 경계
 */
export function YouTubeScriptsWithSuspense({
  scripts,
  isBatchMode,
  selectedScripts,
  uploadStates,
  singleUploadSchedule,
  batchSettings,
  scriptsData,
  onYouTubeUpload,
  onToggleSelection,
  onScheduleChange,
  onBatchSettingsChange,
  onClearSelection,
  onUploadComplete
}: YouTubeScriptsWithSuspenseProps) {
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

  // 빈 스크립트 상태
  if (scripts.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="스크립트가 없습니다"
        description="검색 조건에 맞는 스크립트가 없습니다."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 배치 모드 폼 - 별도 Suspense 경계 */}
      {isBatchMode && (
        <Suspense fallback={<BatchFormSkeleton />}>
          <YouTubeBatchForm
            selectedScripts={selectedScripts}
            scriptsData={scriptsData}
            batchSettings={batchSettings}
            onBatchSettingsChange={onBatchSettingsChange}
            onClearSelection={onClearSelection}
            onUploadComplete={onUploadComplete}
          />
        </Suspense>
      )}

      {/* 스크립트 목록 - 독립적인 Suspense 경계 */}
      <div className={commonLayouts.card}>
        <div className="divide-y divide-gray-200">
          {scripts.map((script, index) => (
            <Suspense 
              key={script.id}
              fallback={<ScriptCardSkeleton delay={index * 100} />}
            >
              <YouTubeScriptCard
                script={script}
                isBatchMode={isBatchMode}
                isSelected={selectedScripts.includes(script.id)}
                uploadState={youtubeUploadStates[script.id]}
                singleUploadSchedule={singleUploadSchedule[script.id]}
                onYouTubeUpload={onYouTubeUpload}
                onToggleSelection={onToggleSelection}
                onScheduleChange={onScheduleChange}
              />
            </Suspense>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 배치 폼을 위한 스켈레톤 컴포넌트
 */
function BatchFormSkeleton() {
  return (
    <div className="mb-8 border border-blue-200 bg-blue-50 rounded-lg">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-5 h-5 bg-blue-300 rounded animate-pulse mr-2" />
          <div className="h-6 bg-blue-300 rounded w-48 animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-blue-300 rounded w-20 animate-pulse" />
              <div className="h-10 bg-blue-200 rounded animate-pulse" />
              <div className="h-3 bg-blue-200 rounded w-16 animate-pulse" />
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 bg-gray-300 rounded w-32 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-gray-300 rounded animate-pulse" />
              <div className="h-10 w-32 bg-blue-300 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 개별 스크립트 카드를 위한 스켈레톤 컴포넌트
 * 점진적 로딩 효과를 위한 딜레이 적용
 */
function ScriptCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div 
      className="p-6 border-0 animate-pulse" 
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start">
        <div className="w-4 h-4 bg-gray-300 rounded mr-4 mt-1" />
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="h-6 bg-gray-300 rounded w-64 animate-pulse" />
            <div className="h-6 w-24 bg-green-200 rounded animate-pulse" />
          </div>
          
          <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
          
          <div className="flex gap-2 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
          
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-blue-300 rounded animate-pulse" />
            <div className="h-10 w-24 bg-gray-300 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}