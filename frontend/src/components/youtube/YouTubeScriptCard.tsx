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
import type { YouTubeScriptCardProps } from '@/types'

export function YouTubeScriptCard({
  script,
  isBatchMode,
  isSelected,
  uploadState,
  singleUploadSchedule,
  onYouTubeUpload,
  onToggleSelection,
  onScheduleChange
}: YouTubeScriptCardProps) {
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'script_ready':
        return { color: 'gray', text: '스크립트만 있음', icon: <FileText className="w-4 h-4" /> }
      case 'video_ready':
        return { color: 'blue', text: '비디오 준비됨', icon: <Video className="w-4 h-4" /> }
      case 'uploaded':
        return { color: 'green', text: '업로드 완료', icon: <CheckCircle className="w-4 h-4" /> }
      case 'scheduled':
        return { color: 'yellow', text: '예약 발행', icon: <Clock className="w-4 h-4" /> }
      case 'error':
        return { color: 'red', text: 'error', icon: <AlertCircle className="w-4 h-4" /> }
      default:
        return { color: 'gray', text: status, icon: <FileText className="w-4 h-4" /> }
    }
  }

  const handleScheduleChange = (value: string) => {
    const selectedTime = new Date(value)
    const now = new Date()
    
    // 미래 날짜만 허용
    if (value && selectedTime <= now) {
      onScheduleChange(script.id, '')
      return
    }
    
    onScheduleChange(script.id, value)
  }

  const statusDisplay = getStatusDisplay(script.status)

  return (
    <Card className="border-0 rounded-none first:rounded-t-lg last:rounded-b-lg">
      <CardHeader>
        <div className="flex items-center">
          {/* 배치 모드 체크박스 */}
          {isBatchMode && (
            <div className="mr-4">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelection(script.id)}
                disabled={script.status !== 'video_ready'}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
            </div>
          )}
          
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 flex items-center">
              {script.title}
              {isSelected && (
                <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                  선택됨
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mb-3">
              {(script.description || '설명 없음').substring(0, 100)}
              {(script.description || '').length > 100 && '...'}
            </CardDescription>
          </div>
          
          <Badge 
            variant={statusDisplay.color === 'green' ? 'default' : 'secondary'}
            className={`ml-4 ${
              statusDisplay.color === 'green' ? 'bg-green-100 text-green-800' :
              statusDisplay.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              statusDisplay.color === 'red' ? 'bg-red-100 text-red-800' :
              statusDisplay.color === 'blue' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {statusDisplay.icon}
            <span className="ml-1">{statusDisplay.text}</span>
          </Badge>
        </div>
        
        {/* 배치 모드에서 선택 불가능한 이유 표시 */}
        {isBatchMode && script.status !== 'video_ready' && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-700">
              배치 업로드는 'video_ready' 상태인 스크립트만 가능합니다.
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* 파일 정보 */}
        <div className="text-sm text-gray-500 mb-4">
          <p>파일명: {script.filename}</p>
          {script.video_filename && (
            <p>비디오: {script.video_filename}</p>
          )}
          <p>생성: {formatDate(script.created_at)}</p>
        </div>

        {/* 태그 */}
        {(script.tags && script.tags.length > 0) && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {script.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {script.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{script.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* 실시간 업로드 진행률 */}
        {uploadState?.isUploading && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                <span className="text-sm font-medium text-blue-700">실시간 업로드 진행률</span>
              </div>
              <span className="text-sm text-blue-600 font-bold">{uploadState.progress}%</span>
            </div>
            <Progress value={uploadState.progress} className="h-3 mb-2" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-600 font-medium">{uploadState.message}</span>
              {uploadState.currentStep && uploadState.totalSteps && (
                <span className="text-blue-500">
                  {uploadState.currentStep} / {uploadState.totalSteps} 단계
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-xs text-blue-600 ml-2">WebSocket 실시간 연결됨</span>
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

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          {script.status === 'video_ready' && !uploadState?.isUploading && (
            <Button
              onClick={() => onYouTubeUpload(script)}
              className="flex-1"
              disabled={uploadState?.isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {singleUploadSchedule ? '예약 발행 설정' : 'YouTube 업로드'}
            </Button>
          )}

          {script.status === 'uploaded' && script.youtube_url && (
            <Button
              variant="outline"
              onClick={() => window.open(script.youtube_url, '_blank')}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              YouTube에서 보기
            </Button>
          )}

          {script.status === 'script_ready' && (
            <Button variant="outline" disabled className="flex-1">
              <Video className="w-4 h-4 mr-2" />
              비디오 업로드 필요
            </Button>
          )}

          {script.status === 'error' && (
            <Button variant="outline" disabled className="flex-1">
              <AlertCircle className="w-4 h-4 mr-2" />
              오류 발생
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}