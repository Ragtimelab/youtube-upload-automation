import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useScripts } from '@/hooks/useScripts'
import { useUploadVideo } from '@/hooks/useUpload'
import { 
  Upload, 
  Video, 
  AlertCircle,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  Play,
  Calendar,
  FileVideo
} from 'lucide-react'

export function UploadPage() {
  const [selectedScript, setSelectedScript] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { data: scriptsData, isLoading: scriptsLoading } = useScripts(1, 50)
  const uploadVideo = useUploadVideo()

  // 드래그 앤 드롭 핸들러
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (isVideoFile(file)) {
        setSelectedFile(file)
      } else {
        alert('비디오 파일만 업로드할 수 있습니다.')
      }
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && isVideoFile(file)) {
      setSelectedFile(file)
    } else if (file) {
      alert('비디오 파일만 업로드할 수 있습니다.')
    }
  }

  const isVideoFile = (file: File) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/x-flv']
    return allowedTypes.includes(file.type) || file.name.match(/\.(mp4|avi|mov|mkv|flv)$/i)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleUpload = async () => {
    if (!selectedScript || !selectedFile) {
      alert('스크립트와 비디오 파일을 모두 선택해주세요.')
      return
    }

    try {
      await uploadVideo.mutateAsync({ 
        scriptId: selectedScript, 
        file: selectedFile 
      })
      
      // 업로드 성공 후 초기화
      setSelectedFile(null)
      setSelectedScript(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const getScriptStatus = (status: string) => {
    switch (status) {
      case 'script_ready': return { icon: Clock, color: 'text-yellow-600', text: '스크립트 준비' }
      case 'video_ready': return { icon: CheckCircle2, color: 'text-blue-600', text: '비디오 준비' }
      case 'uploaded': return { icon: CheckCircle2, color: 'text-green-600', text: '업로드 완료' }
      default: return { icon: Clock, color: 'text-gray-600', text: '알 수 없음' }
    }
  }

  // script_ready 상태인 스크립트만 필터링
  const availableScripts = scriptsData?.items.filter(script => script.status === 'script_ready') || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">비디오 업로드</h1>
        <p className="text-gray-600 mt-1">스크립트에 맞는 비디오 파일을 업로드하세요.</p>
      </div>

      {/* 스크립트 선택 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">1. 스크립트 선택</h3>
        
        {scriptsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-3" />
            <span className="text-gray-600">스크립트를 불러오는 중...</span>
          </div>
        ) : availableScripts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">업로드 가능한 스크립트가 없습니다</h4>
            <p className="text-gray-600 mb-4">먼저 스크립트를 업로드해주세요.</p>
            <Button variant="outline">스크립트 관리로 이동</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableScripts.map((script) => {
              const status = getScriptStatus(script.status)
              const StatusIcon = status.icon
              return (
                <div
                  key={script.id}
                  onClick={() => setSelectedScript(script.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedScript === script.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate">{script.title}</h4>
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{script.description}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(script.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 파일 업로드 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">2. 비디오 파일 업로드</h3>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : selectedFile
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <FileVideo className="h-12 w-12 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{selectedFile.name}</h4>
                <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
              </div>
              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={() => setSelectedFile(null)}>
                  <X className="h-4 w-4 mr-2" />
                  제거
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  다른 파일 선택
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {dragActive ? '파일을 여기에 놓으세요' : '비디오 파일을 드래그하거나 클릭하여 업로드'}
                </h4>
                <Button onClick={() => fileInputRef.current?.click()}>
                  파일 선택
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 파일 요구사항 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">파일 요구사항</p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• 최대 파일 크기: 8GB</li>
                <li>• 지원 형식: MP4, AVI, MOV, MKV, FLV</li>
                <li>• 권장 파일명 형식: YYYYMMDD_NN_story.mp4</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 업로드 버튼 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">3. 업로드 실행</h3>
            <p className="text-gray-600 mt-1">스크립트와 비디오 파일을 연결하여 업로드합니다.</p>
          </div>
          <Button
            onClick={handleUpload}
            disabled={!selectedScript || !selectedFile || uploadVideo.isPending}
            size="lg"
          >
            {uploadVideo.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                비디오 업로드
              </>
            )}
          </Button>
        </div>

        {/* 업로드 진행률 (필요시) */}
        {uploadVideo.isPending && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>업로드 진행률</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}