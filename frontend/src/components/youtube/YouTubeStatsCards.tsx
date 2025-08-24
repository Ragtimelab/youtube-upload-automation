import type { Script } from '@/types/api'

interface YouTubeStatsCardsProps {
  scripts: Script[]
  totalItems: number
  activeUploads: number
}

export function YouTubeStatsCards({ scripts, totalItems, activeUploads }: YouTubeStatsCardsProps) {
  const videoReadyCount = scripts.filter(s => s.status === 'video_ready').length
  const uploadedCount = scripts.filter(s => s.status === 'uploaded').length
  const scheduledCount = scripts.filter(s => s.status === 'scheduled').length

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
        <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
        <div className="text-sm text-gray-600">전체</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
        <div className="text-2xl font-bold text-blue-600">{videoReadyCount}</div>
        <div className="text-sm text-gray-600">업로드 준비</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
        <div className="text-2xl font-bold text-green-600">{uploadedCount}</div>
        <div className="text-sm text-gray-600">업로드 완료</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
        <div className="text-2xl font-bold text-yellow-600">{scheduledCount}</div>
        <div className="text-sm text-gray-600">예약 발행</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
        <div className="text-2xl font-bold text-red-600">{activeUploads}</div>
        <div className="text-sm text-gray-600">실시간</div>
      </div>
    </div>
  )
}