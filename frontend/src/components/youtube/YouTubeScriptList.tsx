import { Loader2, FileText } from 'lucide-react'
import { ListLoading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/ErrorDisplay'
import { YouTubeScriptCard } from './YouTubeScriptCard'
import { commonLayouts } from '@/utils/classNames'
import type { Script, UploadState, YouTubeScriptListProps } from '@/types'

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
      <ListLoading
        message="스크립트를 불러오는 중..."
        items={3}
        showIcon={true}
      />
    )
  }

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
    <div className={commonLayouts.card}>
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