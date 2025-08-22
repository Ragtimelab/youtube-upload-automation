import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { scriptApi, uploadApi } from '@/services/api'
import type { Script, YouTubeUploadStatus } from '@/types/api'
import { useUploadProgress } from '@/hooks/useUploadProgress'
import { useToast } from '@/hooks/useToast'
import { WebSocketStatus } from '@/components/WebSocketStatus'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Upload, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Search,
  Filter,
  ExternalLink,
  FileText,
  Video,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react'

export default function YouTubeUpload() {
  const { 
    uploadStates, 
    globalStats, 
    webSocketState, 
    startUpload, 
    getUploadState,
    getActiveUploads 
  } = useUploadProgress()
  const { success, error, info } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // 스크립트 목록 조회
  const { data: scriptsData, isLoading, refetch } = useQuery({
    queryKey: ['scripts', 1, 50], // 페이지당 50개씩 표시
    queryFn: () => scriptApi.getScripts(1, 50)
  })

  // 업로드 상태별 필터링
  const filteredScripts = scriptsData?.items.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.filename.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && script.status === statusFilter
  }) || []

  // YouTube 업로드 실행
  const handleYouTubeUpload = async (script: Script) => {
    if (script.status !== 'video_ready') {
      error('업로드 불가', '비디오가 준비되지 않았습니다. 먼저 비디오를 업로드해주세요.')
      return
    }

    if (!webSocketState.isConnected) {
      error('연결 오류', 'WebSocket 연결이 끊어졌습니다. 페이지를 새로고침해주세요.')
      return
    }

    // 업로드 시작 알림
    info('업로드 시작', `"${script.title}" YouTube 업로드를 시작합니다.`)
    
    // WebSocket을 통한 실시간 진행률 시작
    startUpload(script.id, 'youtube')

    try {
      const result = await uploadApi.uploadToYouTube(script.id)
      console.log('YouTube upload API result:', result)
      
      // 스크립트 목록 새로고침
      refetch()
    } catch (apiError: any) {
      console.error('YouTube upload API error:', apiError)
      const errorMessage = apiError.response?.data?.message || '알 수 없는 오류가 발생했습니다.'
      error('업로드 실패', errorMessage)
    }
  }

  // 상태별 아이콘 및 색상
  const getStatusDisplay = (script: Script) => {
    const uploadState = uploadStates[script.id]
    
    if (uploadState?.isUploading) {
      return {
        icon: <Clock className="h-4 w-4" />,
        color: "blue" as const,
        text: "업로드 중..."
      }
    }

    switch (script.status) {
      case 'script_ready':
        return {
          icon: <FileText className="h-4 w-4" />,
          color: "gray" as const,
          text: "스크립트만 있음"
        }
      case 'video_ready':
        return {
          icon: <Video className="h-4 w-4" />,
          color: "yellow" as const,
          text: "비디오 준비됨"
        }
      case 'uploaded':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: "green" as const,
          text: "업로드 완료"
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: "red" as const,
          text: "오류 발생"
        }
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: "gray" as const,
          text: "알 수 없음"
        }
    }
  }

  const getStatusCount = (status: string) => {
    if (status === 'all') return scriptsData?.items.length || 0
    return scriptsData?.items.filter(s => s.status === status).length || 0
  }

  // 업로드 완료/에러 알림
  useEffect(() => {
    Object.entries(uploadStates).forEach(([scriptId, state]) => {
      const script = scriptsData?.items.find(s => s.id === parseInt(scriptId))
      
      if (state.status === 'completed' && !state.isUploading) {
        success(
          'YouTube 업로드 완료!', 
          `"${script?.title || 'Unknown'}" 업로드가 성공적으로 완료되었습니다.`
        )
      }
      
      if (state.status === 'error' && state.error) {
        error(
          'YouTube 업로드 실패',
          `"${script?.title || 'Unknown'}" 업로드 중 오류가 발생했습니다: ${state.error}`
        )
      }
    })
  }, [uploadStates, scriptsData?.items, success, error])

  // WebSocket 연결 상태 알림
  useEffect(() => {
    if (webSocketState.connectionStatus === 'connected') {
      info('실시간 연결', 'WebSocket 실시간 업데이트가 활성화되었습니다.')
    } else if (webSocketState.connectionStatus === 'error' && webSocketState.error) {
      error('연결 오류', `WebSocket 연결 실패: ${webSocketState.error}`)
    }
  }, [webSocketState.connectionStatus, webSocketState.error, info, error])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">스크립트 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">YouTube 업로드 관리</h1>
              <p className="text-gray-600">스크립트를 선택하여 YouTube에 업로드하세요.</p>
            </div>
            
            {/* WebSocket 연결 상태 */}
            <div className="flex items-center gap-4">
              <WebSocketStatus 
                isConnected={webSocketState.isConnected}
                connectionStatus={webSocketState.connectionStatus}
                error={webSocketState.error}
              />
              
              {getActiveUploads().length > 0 && (
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
                  <span className="text-sm text-blue-600 font-medium">
                    {getActiveUploads().length}개 업로드 중
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-gray-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">전체 스크립트</p>
                  <p className="text-2xl font-bold text-gray-900">{getStatusCount('all')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Video className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">업로드 준비됨</p>
                  <p className="text-2xl font-bold text-yellow-600">{getStatusCount('video_ready')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">업로드 완료</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-green-600">{getStatusCount('uploaded')}</p>
                    {globalStats.completedUploads > 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        +{globalStats.completedUploads} 실시간
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">업로드 중</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-blue-600">{globalStats.activeUploads}</p>
                    {globalStats.activeUploads > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
                        실행 중
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 필터 */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                  검색
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="제목, 설명, 파일명으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mb-2 block">
                  상태 필터
                </Label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체</option>
                  <option value="script_ready">스크립트만</option>
                  <option value="video_ready">비디오 준비됨</option>
                  <option value="uploaded">업로드 완료</option>
                  <option value="error">오류</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 스크립트 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredScripts.map((script) => {
            const statusDisplay = getStatusDisplay(script)
            const uploadState = uploadStates[script.id]

            return (
              <Card key={script.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{script.title}</CardTitle>
                      <CardDescription className="text-sm text-gray-600 mb-3">
                        {script.description.substring(0, 100)}
                        {script.description.length > 100 && '...'}
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
                </CardHeader>

                <CardContent>
                  {/* 파일 정보 */}
                  <div className="text-sm text-gray-500 mb-4">
                    <p>파일명: {script.filename}</p>
                    {script.video_filename && (
                      <p>비디오: {script.video_filename}</p>
                    )}
                    <p>생성: {new Date(script.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>

                  {/* 태그 */}
                  {script.tags.length > 0 && (
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

                  {/* 액션 버튼 */}
                  <div className="flex gap-2">
                    {script.status === 'video_ready' && !uploadState?.isUploading && (
                      <Button
                        onClick={() => handleYouTubeUpload(script)}
                        className="flex-1"
                        disabled={uploadState?.isUploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        YouTube 업로드
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

                    {uploadState?.isUploading && (
                      <Button variant="outline" disabled className="flex-1">
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        업로드 중...
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 결과 없음 */}
        {filteredScripts.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">스크립트가 없습니다</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? '검색 조건에 맞는 스크립트가 없습니다.'
                  : '업로드할 스크립트를 먼저 추가해주세요.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}