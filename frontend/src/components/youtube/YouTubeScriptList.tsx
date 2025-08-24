import { Loader2, FileText } from 'lucide-react'
import { YouTubeScriptCard } from './YouTubeScriptCard'
import type { Script } from '@/types/api'

interface UploadState {
  isUploading: boolean
  progress: number
  message: string
  error?: string
  currentStep?: number
  totalSteps?: number
}

interface YouTubeScriptListProps {
  scripts: Script[]
  isLoading: boolean
  isBatchMode: boolean
  selectedScripts: number[]
  uploadStates: Record<number, UploadState>
  singleUploadSchedule: Record<number, string>
  onYouTubeUpload: (script: Script) => void
  onToggleSelection: (scriptId: number) => void
  onScheduleChange: (scriptId: number, value: string) => void
}

export function YouTubeScriptList({
  scripts,
  isLoading,
  isBatchMode,
  selectedScripts,
  uploadStates,
  singleUploadSchedule,
  onYouTubeUpload,
  onToggleSelection,
  onScheduleChange
}: YouTubeScriptListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-8 text-center">
          <Loader2 className="h-8 w-8 mx-auto text-gray-400 animate-spin mb-4" />
          <p className="text-gray-600">스크립트를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (scripts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">스크립트가 없습니다</h3>
          <p className="text-gray-600 mb-4">검색 조건에 맞는 스크립트가 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="divide-y divide-gray-200">
        {scripts.map((script) => (
          <YouTubeScriptCard
            key={script.id}
            script={script}
            isBatchMode={isBatchMode}
            isSelected={selectedScripts.includes(script.id)}
            uploadState={uploadStates[script.id]}
            singleUploadSchedule={singleUploadSchedule[script.id]}
            onYouTubeUpload={onYouTubeUpload}
            onToggleSelection={onToggleSelection}
            onScheduleChange={onScheduleChange}
          />
        ))}
      </div>
    </div>
  )
}