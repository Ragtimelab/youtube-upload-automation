import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface YouTubeSearchFilterProps {
  searchTerm: string
  statusFilter: string
  isBatchMode: boolean
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onBatchModeToggle: () => void
}

export function YouTubeSearchFilter({
  searchTerm,
  statusFilter,
  isBatchMode,
  onSearchChange,
  onStatusFilterChange,
  onBatchModeToggle
}: YouTubeSearchFilterProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="스크립트 제목, 설명, 파일명으로 검색..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* 상태 필터 */}
          <div className="min-w-48">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">상태 필터</Label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="script_ready">스크립트만</option>
              <option value="video_ready">비디오 준비됨</option>
              <option value="uploaded">업로드 완료</option>
              <option value="scheduled">예약 발행</option>
              <option value="error">오류</option>
            </select>
          </div>
          
          {/* 배치 모드 토글 */}
          <div className="flex items-center gap-2">
            <Button
              variant={isBatchMode ? "default" : "outline"}
              onClick={onBatchModeToggle}
              className={isBatchMode ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {isBatchMode ? '단일 모드' : '배치 모드'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}