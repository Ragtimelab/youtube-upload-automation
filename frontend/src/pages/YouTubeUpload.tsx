import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { scriptApi, uploadApi } from '@/services/api'
import type { Script } from '@/types/api'
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
  CheckCircle, 
  AlertCircle, 
  Clock,
  Search,
  ExternalLink,
  FileText,
  Video,
  Activity,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

export default function YouTubeUpload() {
  const { 
    uploadStates, 
    globalStats, 
    webSocketState, 
    startUpload, 
    getUploadState: _getUploadState,
    getActiveUploads 
  } = useUploadProgress()
  const { success, error, info } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // 배치 업로드 상태 관리 - CLI youtube batch 명령어 매핑
  const [selectedScripts, setSelectedScripts] = useState<number[]>([])
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [batchUploading, setBatchUploading] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })
  const [batchSettings, setBatchSettings] = useState({
    delay: 30, // CLI -d 옵션, 최소 30초
    privacy: 'private', // CLI -p 옵션
    category: 24 // CLI -c 옵션, Entertainment
  })

  // 스크립트 목록 조회
  const { data: scriptsData, isLoading, refetch } = useQuery({
    queryKey: ['scripts', 1, 50], // 페이지당 50개씩 표시
    queryFn: () => scriptApi.getScripts(1, 50)
  })

  // 업로드 상태별 필터링
  const filteredScripts = scriptsData?.items.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (script.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.filename.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && script.status === statusFilter
  }) || []

  // YouTube 단일 업로드 실행
  const handleYouTubeUpload = async (script: Script) => {
    if (script.status !== 'video_ready') {
      error('업로드 불가', '비디오가 준비되지 않았습니다. 먼저 비디오를 업로드해주세요.')
      return
    }

    if (!webSocketState.isConnected) {
      error('연결 오류', 'WebSocket 연결이 끊어졌습니다. 페이지를 새로고침해주세요.')
      return
    }

    // CLI와 동일한 YouTube API 할당량 사전 체크
    const quotaCheck = await checkYouTubeQuota()
    if (!quotaCheck.canUpload) {
      error('할당량 초과', quotaCheck.message || 'YouTube API 할당량이 부족합니다.')
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
    } catch (apiError: unknown) {
      console.error('YouTube upload API error:', apiError)
      const errorMessage = (apiError as { response?: { data?: { message?: string } } })?.response?.data?.message || '알 수 없는 오류가 발생했습니다.'
      error('업로드 실패', errorMessage)
    }
  }

  // CLI와 동일한 YouTube API 할당량 체크
  const checkYouTubeQuota = async (): Promise<{ canUpload: boolean; message?: string }> => {
    try {
      // 오늘 업로드된 스크립트 수 계산
      const todayUploaded = scriptsData?.items.filter(script => {
        if (script.status !== 'uploaded') return false
        const today = new Date().toDateString()
        const scriptDate = new Date(script.updated_at || script.created_at).toDateString()
        return today === scriptDate
      }).length || 0
      
      const QUOTA_PER_UPLOAD = 1600
      const DAILY_QUOTA_LIMIT = 10000
      const quotaUsed = todayUploaded * QUOTA_PER_UPLOAD
      const quotaRemaining = DAILY_QUOTA_LIMIT - quotaUsed
      const remainingUploads = Math.floor(quotaRemaining / QUOTA_PER_UPLOAD)
      
      if (quotaUsed >= DAILY_QUOTA_LIMIT) {
        return {
          canUpload: false,
          message: `YouTube API 일일 할당량을 모두 사용했습니다.\n\n📊 할당량 정보:\n• 사용된 할당량: ${quotaUsed.toLocaleString()}/10,000 units (100%)\n• 할당량 리셋: Pacific Time 자정 (한국시간 오후 4-5시)\n\n💡 해결 방법:\n• 내일 할당량 리셋 후 업로드하거나\n• 일부 업로드된 비디오를 삭제하여 할당량 확보`
        }
      }
      
      if (quotaUsed > 8000) { // 80% 이상 사용 - CLI와 동일한 경고
        info(
          '할당량 경고', 
          `할당량의 80% 이상을 사용했습니다.\n\n📊 현재 상태:\n• 사용된 할당량: ${quotaUsed.toLocaleString()}/10,000 units (${(quotaUsed/100).toFixed(1)}%)\n• 추가 업로드 가능: ${remainingUploads}개\n\n⚠️ 할당량 사용에 주의하세요.`
        )
      }
      
      return { canUpload: true }
    } catch (e) {
      console.warn('할당량 체크 실패:', e)
      return { canUpload: true } // 체크 실패 시 업로드 허용
    }
  }

  // CLI youtube batch 명령어 매핑 - 배치 업로드 실행
  const handleBatchUpload = async () => {
    if (selectedScripts.length === 0) {
      error('선택 오류', '업로드할 스크립트를 선택해주세요.')
      return
    }

    // CLI 제한사항 검증: 최대 5개 (CLI와 동일한 구체적 가이드 제공)
    if (selectedScripts.length > 5) {
      error(
        '배치 업로드 제한 초과', 
        `YouTube API 할당량 제한으로 인해 최대 5개까지만 업로드 가능합니다. 현재 선택: ${selectedScripts.length}개\n\n💡 해결 방법:\n• 선택을 5개 이하로 줄이거나\n• ${selectedScripts.length}개를 5개씩 나누어 실행하세요`
      )
      return
    }

    // CLI와 동일한 YouTube API 할당량 사전 체크
    const quotaCheck = await checkYouTubeQuota()
    if (!quotaCheck.canUpload) {
      error('할당량 초과', quotaCheck.message || 'YouTube API 할당량이 부족합니다.')
      return
    }

    // video_ready 상태 검증
    const selectedScriptObjects = scriptsData?.items.filter(script => 
      selectedScripts.includes(script.id) && script.status === 'video_ready'
    ) || []

    if (selectedScriptObjects.length !== selectedScripts.length) {
      error('상태 오류', '선택된 스크립트 중 일부가 video_ready 상태가 아닙니다.')
      return
    }

    setBatchUploading(true)
    setBatchProgress({ current: 0, total: selectedScripts.length })

    info('배치 업로드 시작', `${selectedScripts.length}개 스크립트를 ${batchSettings.delay}초 간격으로 업로드합니다.`)

    try {
      for (let i = 0; i < selectedScripts.length; i++) {
        const scriptId = selectedScripts[i]
        const script = scriptsData?.items.find(s => s.id === scriptId)
        
        if (!script) continue

        setBatchProgress({ current: i + 1, total: selectedScripts.length })
        info('배치 진행', `${i + 1}/${selectedScripts.length}: "${script.title}" 업로드 중...`)

        // WebSocket 실시간 진행률 시작
        startUpload(scriptId, 'youtube')

        try {
          await uploadApi.uploadToYouTube(scriptId)
          success('업로드 완료', `"${script.title}" 업로드 성공`)
        } catch (scriptError) {
          console.error(`Script ${scriptId} upload error:`, scriptError)
          error('개별 실패', `"${script.title}" 업로드 실패`)
        }

        // CLI -d 옵션 매핑: 마지막 항목이 아니면 간격 대기
        if (i < selectedScripts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, batchSettings.delay * 1000))
        }
      }

      success('배치 완료', `${selectedScripts.length}개 스크립트 배치 업로드가 완료되었습니다.`)
      setSelectedScripts([])
      refetch()
    } catch (batchError) {
      console.error('Batch upload error:', batchError)
      error('배치 실패', '배치 업로드 중 오류가 발생했습니다.')
    } finally {
      setBatchUploading(false)
      setBatchProgress({ current: 0, total: 0 })
    }
  }

  // 체크박스 선택 관리 (CLI와 동일한 구체적 가이드 제공)
  const handleScriptSelect = (scriptId: number, selected: boolean) => {
    setSelectedScripts(prev => {
      if (selected) {
        // CLI 제한: 최대 5개
        if (prev.length >= 5) {
          error(
            '선택 제한 초과', 
            `배치 업로드는 YouTube API 할당량 제한으로 인해 최대 5개까지만 선택 가능합니다.\n\n💡 해결 방법:\n• 기존 선택을 해제하고 다른 스크립트를 선택하거나\n• 현재 선택된 5개를 먼저 업로드하세요`
          )
          return prev
        }
        return [...prev, scriptId]
      } else {
        return prev.filter(id => id !== scriptId)
      }
    })
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
      case 'scheduled':
        return {
          icon: <Clock className="h-4 w-4" />,
          color: "purple" as const,
          text: "scheduled"
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: "red" as const,
          text: "error"
        }
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: "gray" as const,
          text: "unknown"
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

        {/* 통계 카드 - Backend 5개 상태 완전 지원 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-gray-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">전체</p>
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
                  <p className="text-sm font-medium text-gray-600">업로드 준비</p>
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
                        +{globalStats.completedUploads}
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
                <Clock className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">예약 발행</p>
                  <p className="text-2xl font-bold text-purple-600">{getStatusCount('scheduled')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">실시간</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-blue-600">{globalStats.activeUploads}</p>
                    {globalStats.activeUploads > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
                        업로드 중
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
                  <option value="scheduled">예약 발행</option>
                  <option value="error">오류</option>
                </select>
              </div>

              {/* CLI 배치 모드 토글 */}
              <div className="flex items-end">
                <Button
                  variant={isBatchMode ? "default" : "outline"}
                  onClick={() => {
                    setIsBatchMode(!isBatchMode)
                    setSelectedScripts([]) // 모드 전환시 선택 초기화
                  }}
                  disabled={batchUploading}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {isBatchMode ? '단일 모드' : '배치 모드'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CLI youtube batch 설정 패널 */}
        {isBatchMode && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <Settings className="w-5 h-5 mr-2" />
                배치 업로드 설정 (CLI youtube batch 매핑)
              </CardTitle>
              <CardDescription className="text-blue-700">
                CLI 명령어: ./youtube-cli youtube batch [IDs...] -d {batchSettings.delay} -p {batchSettings.privacy} -c {batchSettings.category}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium text-blue-900">업로드 간격 (초)</Label>
                  <Input
                    type="number"
                    min="30"
                    max="300"
                    value={batchSettings.delay}
                    onChange={(e) => setBatchSettings(prev => ({ ...prev, delay: Math.max(30, parseInt(e.target.value) || 30) }))}
                    className="mt-1"
                    disabled={batchUploading}
                  />
                  <p className="text-xs text-blue-600 mt-1">CLI -d 옵션 (최소 30초)</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-blue-900">공개 설정</Label>
                  <select
                    value={batchSettings.privacy}
                    onChange={(e) => setBatchSettings(prev => ({ ...prev, privacy: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-blue-300 rounded-md"
                    disabled={batchUploading}
                  >
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                  </select>
                  <p className="text-xs text-blue-600 mt-1">CLI -p 옵션</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-blue-900">카테고리</Label>
                  <select
                    value={batchSettings.category}
                    onChange={(e) => setBatchSettings(prev => ({ ...prev, category: parseInt(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border border-blue-300 rounded-md"
                    disabled={batchUploading}
                  >
                    <option value="24">24 - Entertainment</option>
                    <option value="22">22 - People & Blogs</option>
                    <option value="26">26 - Howto & Style</option>
                  </select>
                  <p className="text-xs text-blue-600 mt-1">CLI -c 옵션</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200">
                <div>
                  <p className="font-medium text-blue-900">
                    선택된 스크립트: {selectedScripts.length}/5
                  </p>
                  <p className="text-sm text-blue-600">
                    CLI 제한: 최대 5개, YouTube API 할당량 고려
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedScripts([])}
                    disabled={batchUploading || selectedScripts.length === 0}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    선택 초기화
                  </Button>
                  
                  <Button
                    onClick={handleBatchUpload}
                    disabled={batchUploading || selectedScripts.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {batchUploading ? (
                      <>
                        <Pause className="w-4 h-4 mr-2 animate-pulse" />
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

              {batchUploading && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">배치 진행률</span>
                    <span className="text-sm text-blue-600">
                      {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(batchProgress.current / batchProgress.total) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    {batchProgress.current}/{batchProgress.total} 완료 • {batchSettings.delay}초 간격 대기
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 스크립트 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredScripts.map((script) => {
            const statusDisplay = getStatusDisplay(script)
            const uploadState = uploadStates[script.id]

            return (
              <Card 
                key={script.id} 
                className={`hover:shadow-lg transition-shadow ${
                  selectedScripts.includes(script.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    {/* 배치 모드 체크박스 */}
                    {isBatchMode && (
                      <div className="mr-3 mt-1">
                        <input
                          type="checkbox"
                          checked={selectedScripts.includes(script.id)}
                          onChange={(e) => handleScriptSelect(script.id, e.target.checked)}
                          disabled={script.status !== 'video_ready' || batchUploading}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 flex items-center">
                        {script.title}
                        {selectedScripts.includes(script.id) && (
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
                    <p>생성: {new Date(script.created_at).toLocaleDateString('ko-KR')}</p>
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