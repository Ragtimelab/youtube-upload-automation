import React, { createContext, useContext, useState, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/errors/ErrorBoundary'
import { useScripts } from '@/hooks/useScripts'
import { useUploadVideo } from '@/hooks/useUpload'
import { useToastHelpers } from '@/hooks/useToastContext'
import { 
  Upload, 
  AlertCircle,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  Calendar,
  FileVideo
} from 'lucide-react'
import type { Script } from '@/types'

/**
 * UploadFlow Context 정의
 * Compound Components 간 상태 공유를 위한 Context
 */
interface UploadFlowContextValue {
  // 상태
  selectedScript: number | null
  selectedFile: File | null
  dragActive: boolean
  uploadProgress: number
  
  // 데이터
  availableScripts: Script[]
  scriptsLoading: boolean
  isUploading: boolean
  
  // 액션
  setSelectedScript: (_scriptId: number | null) => void
  setSelectedFile: (_file: File | null) => void
  setDragActive: (_active: boolean) => void
  handleUpload: () => Promise<void>
  
  // 유틸리티
  isVideoFile: (_file: File) => boolean
  validateFileSize: (_file: File) => { valid: boolean; error?: string }
  formatFileSize: (_bytes: number) => string
  getScriptStatus: (_status: string) => { icon: React.ComponentType<unknown>, color: string, text: string }
  toast: ReturnType<typeof useToastHelpers>
  
  // 참조
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

const UploadFlowContext = createContext<UploadFlowContextValue | null>(null)

/**
 * UploadFlow Context 훅
 */
function useUploadFlow() {
  const context = useContext(UploadFlowContext)
  if (!context) {
    throw new Error('useUploadFlow must be used within UploadFlow')
  }
  return context
}

/**
 * UploadFlow 메인 컴포넌트
 * Compound Components 패턴의 루트 컴포넌트
 */
interface UploadFlowProps {
  children: React.ReactNode
  onComplete?: () => void
  maxFileSize?: number // MB 단위
  acceptedTypes?: string[]
}

export function UploadFlow({ 
  children, 
  onComplete,
  maxFileSize = 8192 // 8GB 기본값
  // acceptedTypes = ['.mp4', '.avi', '.mov', '.mkv', '.flv'] // Currently unused
}: UploadFlowProps) {
  // 상태
  const [selectedScript, setSelectedScript] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress] = useState(0)
  
  // 훅
  // const navigate = useNavigate() // Currently unused
  const { data: scriptsData, isLoading: scriptsLoading } = useScripts(1, 50)
  const toast = useToastHelpers()
  
  // 에러 핸들러 정의
  const handleUploadError = useCallback((error: any) => {
    console.error('Upload failed:', error)
    
    // API 에러에서 사용자 친화적 메시지 추출
    let errorMessage = '알 수 없는 오류가 발생했습니다.'
    
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    // 특정 에러 케이스별 처리
    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      toast.error('스크립트를 찾을 수 없습니다', '선택한 스크립트가 존재하지 않습니다.')
    } else if (errorMessage.includes('script_ready')) {
      toast.error('스크립트 상태 오류', errorMessage)
    } else {
      toast.error('비디오 업로드 실패', errorMessage)
    }
  }, [toast])
  
  const uploadVideo = useUploadVideo(handleUploadError)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 유틸리티 함수들
  const isVideoFile = useCallback((file: File) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/x-flv']
    return allowedTypes.includes(file.type) || Boolean(file.name.match(/\.(mp4|avi|mov|mkv|flv)$/i))
  }, [])
  
  const validateFileSize = useCallback((file: File): { valid: boolean; error?: string } => {
    const fileSizeMB = file.size / (1024 * 1024)
    
    if (fileSizeMB > maxFileSize) {
      return {
        valid: false,
        error: `비디오 파일은 ${maxFileSize.toLocaleString()}MB를 초과할 수 없습니다. 현재 크기: ${fileSizeMB.toFixed(1)}MB`
      }
    }
    
    return { valid: true }
  }, [maxFileSize])
  
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])
  
  const getScriptStatus = useCallback((status: string) => {
    switch (status) {
      case 'script_ready': return { icon: Clock, color: 'text-yellow-600', text: 'script_ready' }
      case 'video_ready': return { icon: CheckCircle2, color: 'text-blue-600', text: 'video_ready' }
      case 'uploaded': return { icon: CheckCircle2, color: 'text-green-600', text: 'uploaded' }
      case 'scheduled': return { icon: Clock, color: 'text-purple-600', text: 'scheduled' }
      case 'error': return { icon: AlertCircle, color: 'text-red-600', text: 'error' }
      default: return { icon: Clock, color: 'text-gray-600', text: status || 'unknown' }
    }
  }, [])
  
  // 업로드 핸들러
  const handleUpload = useCallback(async () => {
    if (!selectedScript || !selectedFile) {
      toast.warning('입력 필요', '스크립트와 비디오 파일을 모두 선택해주세요.')
      return
    }

    try {
      await uploadVideo.mutateAsync({ 
        scriptId: selectedScript, 
        file: selectedFile 
      })
      
      // 업로드 성공 메시지
      toast.success('비디오 업로드 성공', `스크립트 ID ${selectedScript}에 비디오가 성공적으로 업로드되었습니다.`)
      
      // 업로드 성공 후 초기화
      setSelectedFile(null)
      setSelectedScript(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // 완료 콜백 실행
      onComplete?.()
    } catch (error: any) {
      // 에러는 handleUploadError에서 이미 처리됨
      // 여기서는 추가 작업이 필요한 경우에만 처리
    }
  }, [selectedScript, selectedFile, uploadVideo, onComplete, toast])
  
  // script_ready 상태인 스크립트만 필터링
  const availableScripts = useMemo(() => 
    scriptsData?.items.filter(script => script.status === 'script_ready') || [],
    [scriptsData]
  )
  
  // Context 값
  const contextValue = useMemo<UploadFlowContextValue>(() => ({
    // 상태
    selectedScript,
    selectedFile,
    dragActive,
    uploadProgress,
    
    // 데이터
    availableScripts,
    scriptsLoading,
    isUploading: uploadVideo.isPending,
    
    // 액션
    setSelectedScript,
    setSelectedFile,
    setDragActive,
    handleUpload,
    
    // 유틸리티
    isVideoFile,
    validateFileSize,
    formatFileSize,
    getScriptStatus,
    toast,
    
    // 참조
    fileInputRef,
  }), [
    selectedScript,
    selectedFile,
    dragActive,
    uploadProgress,
    availableScripts,
    scriptsLoading,
    uploadVideo.isPending,
    handleUpload,
    handleUploadError,
    isVideoFile,
    validateFileSize,
    formatFileSize,
    getScriptStatus,
    toast,
  ])
  
  return (
    <UploadFlowContext.Provider value={contextValue}>
      <div className="space-y-6">
        {children}
      </div>
    </UploadFlowContext.Provider>
  )
}

/**
 * UploadFlow.Header - 페이지 헤더 컴포넌트
 */
interface HeaderProps {
  title?: string
  description?: string
}

function Header({ 
  title = "비디오 업로드", 
  description = "스크립트에 맞는 비디오 파일을 업로드하세요." 
}: HeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-600 mt-1">{description}</p>
    </div>
  )
}

/**
 * UploadFlow.ScriptSelection - 스크립트 선택 컴포넌트
 */
interface ScriptSelectionProps {
  selectedScriptId?: number | null
}

function ScriptSelection({ selectedScriptId }: ScriptSelectionProps) {
  const { 
    selectedScript, 
    setSelectedScript, 
    availableScripts, 
    scriptsLoading, 
    getScriptStatus 
  } = useUploadFlow()
  const navigate = useNavigate()
  
  // 외부에서 제어하는 경우
  const currentSelection = selectedScriptId !== undefined ? selectedScriptId : selectedScript
  const handleSelection = (scriptId: number | null) => {
    if (selectedScriptId === undefined) {
      setSelectedScript(scriptId)
    }
  }

  return (
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
          <Button variant="outline" onClick={() => navigate('/scripts')}>스크립트 관리로 이동</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableScripts.map((script) => {
            const status = getScriptStatus(script.status)
            const StatusIcon = status.icon
            return (
              <div
                key={script.id}
                onClick={() => handleSelection(script.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  currentSelection === script.id
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
  )
}

/**
 * UploadFlow.FileUpload - 파일 업로드 컴포넌트
 */
interface FileUploadProps {
  acceptedTypes?: string[]
  maxSize?: string
  showRequirements?: boolean
}

function FileUpload({ 
  acceptedTypes = ['.mp4', '.avi', '.mov', '.mkv', '.flv'],
  maxSize = "8GB",
  showRequirements = true 
}: FileUploadProps) {
  const {
    selectedFile,
    dragActive,
    setSelectedFile,
    setDragActive,
    isVideoFile,
    validateFileSize,
    formatFileSize,
    fileInputRef,
    toast
  } = useUploadFlow()

  // 드래그 앤 드롭 핸들러
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [setDragActive])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      
      if (!isVideoFile(file)) {
        toast.warning('파일 형식 오류', '비디오 파일만 업로드할 수 있습니다. (.mp4, .avi, .mov, .mkv, .flv)')
        return
      }
      
      const sizeValidation = validateFileSize(file)
      if (!sizeValidation.valid) {
        toast.error('파일 크기 오류', sizeValidation.error!)
        return
      }
      
      setSelectedFile(file)
    }
  }, [setDragActive, isVideoFile, validateFileSize, setSelectedFile])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (!isVideoFile(file)) {
      toast.warning('파일 형식 오류', '비디오 파일만 업로드할 수 있습니다. (.mp4, .avi, .mov, .mkv, .flv)')
      return
    }
    
    const sizeValidation = validateFileSize(file)
    if (!sizeValidation.valid) {
      toast.error('파일 크기 오류', sizeValidation.error!)
      return
    }
    
    setSelectedFile(file)
  }

  return (
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
      {showRequirements && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">파일 요구사항</p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• 최대 파일 크기: {maxSize}</li>
                <li>• 지원 형식: {acceptedTypes.join(', ').toUpperCase()}</li>
                <li>• 권장 파일명 형식: YYYYMMDD_NN_story.mp4</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * UploadFlow.ProgressIndicator - 진행률 표시 컴포넌트
 */
interface ProgressIndicatorProps {
  showETA?: boolean
  showSpeedMeter?: boolean
}

function ProgressIndicator({ showETA = false, showSpeedMeter = false }: ProgressIndicatorProps) {
  const { uploadProgress, isUploading } = useUploadFlow()

  if (!isUploading) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">업로드 진행률</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>진행률</span>
          <span>{uploadProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
        
        {showETA && (
          <div className="text-sm text-gray-600">
            예상 남은 시간: 계산 중...
          </div>
        )}
        
        {showSpeedMeter && (
          <div className="text-sm text-gray-600">
            업로드 속도: 계산 중...
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * UploadFlow.ConfirmationStep - 최종 확인 및 업로드 실행 컴포넌트
 */
interface ConfirmationStepProps {
  onConfirm?: () => Promise<void>
}

function ConfirmationStep({ onConfirm }: ConfirmationStepProps) {
  const { 
    selectedScript, 
    selectedFile, 
    isUploading, 
    handleUpload: defaultHandleUpload 
  } = useUploadFlow()

  const handleConfirm = onConfirm || defaultHandleUpload

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">3. 업로드 실행</h3>
          <p className="text-gray-600 mt-1">스크립트와 비디오 파일을 연결하여 업로드합니다.</p>
        </div>
        <Button
          onClick={handleConfirm}
          disabled={!selectedScript || !selectedFile || isUploading}
          size="lg"
        >
          {isUploading ? (
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
    </div>
  )
}

/**
 * UploadFlow.ErrorBoundary - 에러 경계 컴포넌트
 */

function UploadFlowErrorBoundary({ children }: { children: React.ReactNode }) {
  const DefaultFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
    <div className="bg-white rounded-lg border border-red-200 shadow-sm p-6">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">업로드 오류가 발생했습니다</h3>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <Button onClick={retry} variant="outline">다시 시도</Button>
      </div>
    </div>
  )

  return (
    <ErrorBoundary fallback={(error: Error, retry: () => void) => <DefaultFallback error={error} retry={retry} />}>
      {children}
    </ErrorBoundary>
  )
}

// Compound Components 패턴으로 서브 컴포넌트들 연결
UploadFlow.Header = Header
UploadFlow.ScriptSelection = ScriptSelection
UploadFlow.FileUpload = FileUpload
UploadFlow.ProgressIndicator = ProgressIndicator
UploadFlow.ConfirmationStep = ConfirmationStep
UploadFlow.ErrorBoundary = UploadFlowErrorBoundary

