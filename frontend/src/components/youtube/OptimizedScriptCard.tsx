import { memo, useMemo, useCallback } from 'react'
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ExternalLink,
  FileText,
  Video,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate, formatDateTime } from '@/utils/dateFormat'
import { getStatusColor } from '@/utils/classNames'
import type { Script, UploadState } from '@/types'

interface OptimizedScriptCardProps {
  script: Script
  isBatchMode: boolean
  isSelected: boolean
  uploadState?: UploadState
  singleUploadSchedule?: string
  onYouTubeUpload: (script: Script) => void
  onToggleSelection: (scriptId: number) => void
  onScheduleChange: (scriptId: number, value: string) => void
}

/**
 * React 19 Compiler 준비된 메모이제이션 최적화 스크립트 카드
 * - memo로 불필요한 리렌더링 방지
 * - useMemo로 비용이 큰 계산 최적화
 * - useCallback으로 안정된 함수 참조
 * - React Compiler 자동 최적화를 위한 순수 함수형 구조
 */
export const OptimizedScriptCard = memo(function OptimizedScriptCard({
  script,
  isBatchMode,
  isSelected,
  uploadState,
  singleUploadSchedule,
  onYouTubeUpload,
  onToggleSelection,
  onScheduleChange
}: OptimizedScriptCardProps) {
  
  // 메모이제이션: 상태 표시 계산 (비용이 큰 계산)
  const statusDisplay = useMemo(() => {
    const statusConfig = {
      script_ready: { 
        color: 'gray', 
        text: '스크립트만 있음', 
        icon: <FileText className="w-4 h-4" />,
        bgClass: 'bg-gray-100 text-gray-800'
      },
      video_ready: { 
        color: 'blue', 
        text: '비디오 준비됨', 
        icon: <Video className="w-4 h-4" />,
        bgClass: 'bg-blue-100 text-blue-800'
      },
      uploaded: { 
        color: 'green', 
        text: '업로드 완료', 
        icon: <CheckCircle className="w-4 h-4" />,
        bgClass: 'bg-green-100 text-green-800'
      },
      scheduled: { 
        color: 'yellow', 
        text: '예약 발행', 
        icon: <Clock className="w-4 h-4" />,
        bgClass: 'bg-yellow-100 text-yellow-800'
      },
      error: { 
        color: 'red', 
        text: 'error', 
        icon: <AlertCircle className="w-4 h-4" />,
        bgClass: 'bg-red-100 text-red-800'
      }
    }

    return statusConfig[script.status as keyof typeof statusConfig] || {
      color: 'gray',
      text: script.status,
      icon: <FileText className="w-4 h-4" />,
      bgClass: 'bg-gray-100 text-gray-800'
    }
  }, [script.status])

  // 메모이제이션: 설명 텍스트 자르기
  const truncatedDescription = useMemo(() => {
    const description = script.description || '설명 없음'
    return description.length > 100 
      ? `${description.substring(0, 100)}...` 
      : description
  }, [script.description])

  // 메모이제이션: 태그 표시 최적화
  const displayTags = useMemo(() => {
    if (!script.tags || script.tags.length === 0) return null
    
    const visibleTags = script.tags.slice(0, 3)
    const remainingCount = script.tags.length - 3
    
    return {
      visible: visibleTags,
      remaining: remainingCount > 0 ? remainingCount : null
    }
  }, [script.tags])

  // 메모이제이션: 업로드 진행률 계산
  const progressCalculation = useMemo(() => {
    if (!uploadState?.isUploading) return null
    
    return {
      percentage: uploadState.progress || 0,
      stepInfo: uploadState.currentStep && uploadState.totalSteps 
        ? `${uploadState.currentStep} / ${uploadState.totalSteps} 단계`
        : null
    }
  }, [uploadState?.isUploading, uploadState?.progress, uploadState?.currentStep, uploadState?.totalSteps])

  // useCallback: 안정된 함수 참조
  const handleScheduleChange = useCallback((value: string) => {
    const selectedTime = new Date(value)
    const now = new Date()
    
    if (value && selectedTime <= now) {
      onScheduleChange(script.id, '')
      return
    }
    
    onScheduleChange(script.id, value)
  }, [script.id, onScheduleChange])

  const handleUploadClick = useCallback(() => {
    onYouTubeUpload(script)
  }, [script, onYouTubeUpload])

  const handleSelectionToggle = useCallback(() => {
    onToggleSelection(script.id)
  }, [script.id, onToggleSelection])

  const handleExternalLink = useCallback(() => {
    if (script.youtube_url) {
      window.open(script.youtube_url, '_blank')
    }
  }, [script.youtube_url])

  return (
    <Card className="border-0 rounded-none first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50 transition-colors duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center">
          {/* 배치 모드 체크박스 */}
          {isBatchMode && (
            <div className="mr-4">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelectionToggle}
                disabled={script.status !== 'video_ready'}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 transition-opacity"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-2 flex items-center truncate">
              <span className="truncate">{script.title}</span>
              {isSelected && (
                <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs flex-shrink-0">
                  선택됨
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mb-3">
              {truncatedDescription}
            </CardDescription>
          </div>
          
          <Badge className={`ml-4 flex-shrink-0 ${statusDisplay.bgClass}`}>
            {statusDisplay.icon}
            <span className="ml-1">{statusDisplay.text}</span>
          </Badge>
        </div>
        
        {/* 배치 모드 제한 안내 */}
        {isBatchMode && script.status !== 'video_ready' && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-700">
              배치 업로드는 'video_ready' 상태인 스크립트만 가능합니다.
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* 파일 정보 - 메모이제이션된 데이터 */}
        <div className="text-sm text-gray-500 mb-4 space-y-1">
          <p className="truncate">파일명: {script.filename}</p>
          {script.video_filename && (
            <p className="truncate">비디오: {script.video_filename}</p>
          )}
          <p>생성: {formatDate(script.created_at)}</p>
        </div>

        {/* 태그 - 메모이제이션 최적화 */}
        {displayTags && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {displayTags.visible.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {displayTags.remaining && (
                <Badge variant="outline" className="text-xs">
                  +{displayTags.remaining}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* 실시간 업로드 진행률 - 메모이제이션된 계산 */}
        {progressCalculation && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                <span className="text-sm font-medium text-blue-700">실시간 업로드 진행률</span>
              </div>
              <span className="text-sm text-blue-600 font-bold">{progressCalculation.percentage}%</span>
            </div>
            <Progress value={progressCalculation.percentage} className="h-3 mb-2" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-600 font-medium">{uploadState?.message}</span>
              {progressCalculation.stepInfo && (
                <span className="text-blue-500">{progressCalculation.stepInfo}</span>
              )}
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {uploadState?.error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadState.error}</AlertDescription>
          </Alert>
        )}

        {/* 단일 업로드 예약 발행 설정 */}
        {script.status === 'video_ready' && !uploadState?.isUploading && !isBatchMode && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              예약 발행 시간 (선택사항)
            </Label>
            <Input
              type="datetime-local"
              value={singleUploadSchedule || ''}
              onChange={(e) => handleScheduleChange(e.target.value)}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              className="text-sm"
              placeholder="즉시 업로드하려면 비워두세요"
            />
            {singleUploadSchedule && (
              <p className="text-xs text-blue-600 mt-1">
                예약 발행: {formatDateTime(singleUploadSchedule)}
              </p>
            )}
          </div>
        )}

        {/* 액션 버튼들 */}
        <ActionButtons
          script={script}
          uploadState={uploadState}
          singleUploadSchedule={singleUploadSchedule}
          onUploadClick={handleUploadClick}
          onExternalLink={handleExternalLink}
        />
      </CardContent>
    </Card>
  )
})

/**
 * 액션 버튼 컴포넌트 - 별도 메모이제이션
 * React Compiler가 자동으로 최적화할 수 있도록 순수 함수로 분리
 */
const ActionButtons = memo(function ActionButtons({
  script,
  uploadState,
  singleUploadSchedule,
  onUploadClick,
  onExternalLink
}: {
  script: Script
  uploadState?: UploadState
  singleUploadSchedule?: string
  onUploadClick: () => void
  onExternalLink: () => void
}) {
  // 버튼 상태 메모이제이션
  const buttonConfig = useMemo(() => {
    if (script.status === 'video_ready' && !uploadState?.isUploading) {
      return {
        type: 'upload',
        disabled: false,
        text: singleUploadSchedule ? '예약 발행 설정' : 'YouTube 업로드',
        icon: <Upload className="w-4 h-4 mr-2" />,
        onClick: onUploadClick
      }
    }

    if (script.status === 'uploaded' && script.youtube_url) {
      return {
        type: 'external',
        disabled: false,
        text: 'YouTube에서 보기',
        icon: <ExternalLink className="w-4 h-4 mr-2" />,
        onClick: onExternalLink
      }
    }

    if (script.status === 'script_ready') {
      return {
        type: 'disabled',
        disabled: true,
        text: '비디오 업로드 필요',
        icon: <Video className="w-4 h-4 mr-2" />,
        onClick: () => {}
      }
    }

    if (script.status === 'error') {
      return {
        type: 'disabled',
        disabled: true,
        text: '오류 발생',
        icon: <AlertCircle className="w-4 h-4 mr-2" />,
        onClick: () => {}
      }
    }

    return null
  }, [script.status, script.youtube_url, uploadState?.isUploading, singleUploadSchedule, onUploadClick, onExternalLink])

  if (!buttonConfig) return null

  return (
    <div className="flex gap-2">
      <Button
        onClick={buttonConfig.onClick}
        className={`flex-1 ${buttonConfig.type === 'upload' ? '' : 'variant-outline'}`}
        disabled={buttonConfig.disabled}
        variant={buttonConfig.type === 'external' ? 'outline' : 'default'}
      >
        {buttonConfig.icon}
        {buttonConfig.text}
      </Button>
    </div>
  )
})