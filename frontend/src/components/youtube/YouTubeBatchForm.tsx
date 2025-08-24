import { useActionState, useOptimistic } from 'react'
import { Loader2, Youtube, RotateCcw, Play, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { uploadApi } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { getUserFriendlyErrorMessage } from '@/utils/apiUtils'
import type { BatchSettings, Script } from '@/types'

interface YouTubeBatchFormProps {
  selectedScripts: number[]
  scriptsData: { items: Script[] } | undefined
  batchSettings: BatchSettings
  onBatchSettingsChange: (_settings: BatchSettings) => void
  onClearSelection: () => void
  onUploadComplete: () => void
}

interface BatchUploadState {
  current: number
  total: number
  error?: string
}

/**
 * React 19 Actions 패턴을 활용한 배치 업로드 폼
 * - useActionState로 자동 pending 상태 관리
 * - useOptimistic으로 낙관적 UI 업데이트
 * - 서버 액션 패턴으로 폼 제출 최적화
 */
export function YouTubeBatchForm({
  selectedScripts,
  scriptsData,
  batchSettings,
  onBatchSettingsChange,
  onClearSelection,
  onUploadComplete
}: YouTubeBatchFormProps) {
  const { success, error } = useToast()
  
  // React 19 useOptimistic으로 낙관적 업데이트
  const [optimisticProgress, setOptimisticProgress] = useOptimistic<BatchUploadState>({
    current: 0,
    total: selectedScripts.length
  })

  // React 19 Actions: 자동 pending 상태 관리
  const [batchState, batchAction, isPending] = useActionState(
    async (_previousState: BatchUploadState | null, _formData: FormData) => {
      try {
        const selectedScriptObjects = scriptsData?.items.filter(script => 
          selectedScripts.includes(script.id) && script.status === 'video_ready'
        ) || []

        if (selectedScriptObjects.length !== selectedScripts.length) {
          return { current: 0, total: selectedScripts.length, error: '선택된 스크립트 중 일부가 video_ready 상태가 아닙니다.' }
        }

        if (selectedScripts.length > 5) {
          return { 
            current: 0, 
            total: selectedScripts.length, 
            error: `YouTube API 할당량 제한으로 인해 최대 5개까지만 업로드 가능합니다. 현재 선택: ${selectedScripts.length}개` 
          }
        }

        const uploadType = batchSettings.publishAt ? '예약 발행' : '배치 업로드'
        const progressState = { current: 0, total: selectedScripts.length }

        // 배치 업로드 실행
        for (let i = 0; i < selectedScripts.length; i++) {
          const scriptId = selectedScripts[i]
          const script = scriptsData?.items.find(s => s.id === scriptId)
          
          if (!script) continue

          // 낙관적 업데이트
          setOptimisticProgress({ ...progressState, current: i + 1 })

          try {
            await uploadApi.uploadToYouTube(scriptId, batchSettings.publishAt || undefined)
            success(`${uploadType} 완료`, `"${script.title}" ${uploadType} 성공`)
          } catch (scriptError) {
            const friendlyMessage = getUserFriendlyErrorMessage(scriptError)
            error('개별 실패', `"${script.title}" ${uploadType} 실패: ${friendlyMessage}`)
          }

          // 마지막이 아니면 딜레이
          if (i < selectedScripts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, batchSettings.delay * 1000))
          }
        }

        success('배치 완료', `${selectedScripts.length}개 스크립트 ${uploadType}가 완료되었습니다.`)
        onUploadComplete()
        
        return { current: selectedScripts.length, total: selectedScripts.length }
      } catch (batchError) {
        const friendlyMessage = getUserFriendlyErrorMessage(batchError)
        return { current: 0, total: selectedScripts.length, error: friendlyMessage }
      }
    },
    null
  )

  const handleSettingsChange = (key: keyof BatchSettings, value: string | number) => {
    onBatchSettingsChange({
      ...batchSettings,
      [key]: value
    })
  }

  const handlePublishAtChange = (value: string) => {
    const selectedTime = new Date(value)
    const now = new Date()
    
    if (value && selectedTime <= now) {
      handleSettingsChange('publishAt', '')
      return
    }
    
    handleSettingsChange('publishAt', value)
  }

  return (
    <>
      {/* React 19 Actions 폼 */}
      <form action={batchAction}>
        {/* 배치 모드 컨트롤 바 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              선택된 항목: {selectedScripts.length}개
            </span>
            <button
              type="submit"
              disabled={selectedScripts.length === 0 || isPending}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-md"
            >
              {isPending ? (
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
            </button>
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
                  disabled={isPending}
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
                  disabled={isPending}
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
                  disabled={isPending}
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
                  disabled={isPending}
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
                  type="button"
                  variant="outline"
                  onClick={onClearSelection}
                  disabled={selectedScripts.length === 0 || isPending}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  선택 초기화
                </Button>
                
                <button
                  type="submit"
                  disabled={selectedScripts.length === 0 || isPending}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      배치 업로드 중... ({optimisticProgress.current}/{optimisticProgress.total})
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      배치 업로드 시작
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 배치 진행률 - 낙관적 업데이트 */}
            {(isPending || optimisticProgress.current > 0) && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">배치 진행률</span>
                  <span className="text-sm text-blue-600 font-bold">
                    {Math.round((optimisticProgress.current / optimisticProgress.total) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(optimisticProgress.current / optimisticProgress.total) * 100} 
                  className="h-3 mb-2" 
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-600 font-medium">
                    {optimisticProgress.current}/{optimisticProgress.total} 완료 • {batchSettings.delay}초 간격 대기
                  </span>
                </div>
              </div>
            )}

            {/* 에러 표시 */}
            {batchState?.error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{batchState.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </>
  )
}