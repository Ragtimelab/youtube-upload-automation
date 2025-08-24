import { Loader2, Youtube, RotateCcw, Play, Pause, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import type { BatchSettings, YouTubeBatchControlsProps } from '@/types'

export function YouTubeBatchControls({
  selectedScripts,
  batchUploading,
  batchProgress,
  batchSettings,
  onBatchUpload,
  onBatchSettingsChange,
  onClearSelection
}: YouTubeBatchControlsProps) {
  const handleSettingsChange = (key: keyof BatchSettings, value: string | number) => {
    onBatchSettingsChange({
      ...batchSettings,
      [key]: value
    })
  }

  const handlePublishAtChange = (value: string) => {
    const selectedTime = new Date(value)
    const now = new Date()
    
    // 미래 날짜만 허용
    if (value && selectedTime <= now) {
      handleSettingsChange('publishAt', '')
      return
    }
    
    handleSettingsChange('publishAt', value)
  }

  return (
    <>
      {/* 배치 모드 컨트롤 바 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            선택된 항목: {selectedScripts.length}개
          </span>
          <Button
            onClick={onBatchUpload}
            disabled={selectedScripts.length === 0 || batchUploading}
            className="bg-red-600 hover:bg-red-700"
          >
            {batchUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Youtube className="h-4 w-4 mr-2" />
                선택 항목 업로드
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 배치 업로드 설정 카드 */}
      <Card className="mb-8 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Settings className="w-5 h-5 mr-2" />
            배치 업로드 설정 (CLI youtube batch 매핑)
          </CardTitle>
          <CardDescription className="text-blue-700">
            CLI 명령어: ./youtube-cli youtube batch [IDs...] -d {batchSettings.delay} -p {batchSettings.privacy} -c {batchSettings.category}
            {batchSettings.publishAt && ` --publish-at "${batchSettings.publishAt}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* 업로드 간격 */}
            <div>
              <Label className="text-sm font-medium text-blue-900">업로드 간격 (초)</Label>
              <Input
                type="number"
                min="30"
                max="300"
                value={batchSettings.delay}
                onChange={(e) => handleSettingsChange('delay', Math.max(30, parseInt(e.target.value) || 30))}
                className="mt-1"
                disabled={batchUploading}
              />
              <p className="text-xs text-blue-600 mt-1">CLI -d 옵션 (최소 30초)</p>
            </div>

            {/* 공개 설정 */}
            <div>
              <Label className="text-sm font-medium text-blue-900">공개 설정</Label>
              <select
                value={batchSettings.privacy}
                onChange={(e) => handleSettingsChange('privacy', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-blue-300 rounded-md"
                disabled={batchUploading}
              >
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </select>
              <p className="text-xs text-blue-600 mt-1">CLI -p 옵션</p>
            </div>

            {/* 카테고리 */}
            <div>
              <Label className="text-sm font-medium text-blue-900">카테고리</Label>
              <select
                value={batchSettings.category}
                onChange={(e) => handleSettingsChange('category', parseInt(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-blue-300 rounded-md"
                disabled={batchUploading}
              >
                <option value="24">24 - Entertainment</option>
                <option value="22">22 - People & Blogs</option>
                <option value="26">26 - Howto & Style</option>
              </select>
              <p className="text-xs text-blue-600 mt-1">CLI -c 옵션</p>
            </div>

            {/* 예약 발행 시간 */}
            <div>
              <Label className="text-sm font-medium text-blue-900">예약 발행 시간</Label>
              <Input
                type="datetime-local"
                value={batchSettings.publishAt}
                onChange={(e) => handlePublishAtChange(e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                className="mt-1"
                disabled={batchUploading}
              />
              <p className="text-xs text-blue-600 mt-1">
                {batchSettings.publishAt 
                  ? `예약 발행: ${new Date(batchSettings.publishAt).toLocaleString('ko-KR')}` 
                  : '즉시 발행 (선택사항)'
                }
              </p>
            </div>
          </div>

          {/* 배치 컨트롤 */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200">
            <div>
              <p className="font-medium text-blue-900">
                선택된 스크립트: {selectedScripts.length}/5
              </p>
              <p className="text-sm text-blue-600">CLI 제한: 최대 5개, YouTube API 할당량 고려</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClearSelection}
                disabled={selectedScripts.length === 0 || batchUploading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                선택 초기화
              </Button>
              
              <Button
                onClick={onBatchUpload}
                disabled={selectedScripts.length === 0 || batchUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {batchUploading ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    배치 업로드 중... ({batchProgress.current}/{batchProgress.total})
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    배치 업로드 시작
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 배치 진행률 */}
          {batchUploading && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">배치 진행률</span>
                <span className="text-sm text-blue-600 font-bold">
                  {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                </span>
              </div>
              <Progress 
                value={(batchProgress.current / batchProgress.total) * 100} 
                className="h-3 mb-2" 
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-600 font-medium">
                  {batchProgress.current}/{batchProgress.total} 완료 • {batchSettings.delay}초 간격 대기
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}