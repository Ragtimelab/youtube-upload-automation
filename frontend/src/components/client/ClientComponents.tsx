'use client'

/**
 * Phase 11: Client Components
 * 클라이언트에서만 실행되는 인터랙티브 컴포넌트들
 * 
 * Next.js App Router의 'use client' 지시문으로 클라이언트 렌더링
 * - 상태 관리, 이벤트 핸들링
 * - 브라우저 API 사용 (localStorage, fetch 등)
 * - 실시간 업데이트, WebSocket 연결
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Filter, 
  Upload, 
  Plus, 
  Eye, 
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react'
import type { Script } from '@/types'

// ============================================================================
// Scripts 페이지 클라이언트 인터랙션
// ============================================================================

interface ScriptsClientInteractionsProps {
  initialScripts: Script[]
  serverStats: {
    total: number
    byStatus: Record<string, number>
  }
}

/**
 * 스크립트 페이지의 모든 클라이언트 인터랙션
 */
export function ScriptsClientInteractions({ 
  initialScripts,
  serverStats 
}: ScriptsClientInteractionsProps) {
  const [scripts, setScripts] = useState(initialScripts)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 검색 및 필터링
  const filteredScripts = scripts.filter(script => {
    const matchesSearch = !searchTerm || 
      script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      script.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || script.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // 스크립트 새로고침
  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/scripts')
      if (!response.ok) throw new Error('스크립트를 불러올 수 없습니다.')
      
      const data = await response.json()
      setScripts(data.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 스크립트 삭제
  const handleDelete = useCallback(async (scriptId: number) => {
    if (!window.confirm('정말로 이 스크립트를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('삭제에 실패했습니다.')
      
      setScripts(prev => prev.filter(script => script.id !== scriptId))
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.')
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* 상단 인터랙션 바 */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 검색 바 */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="스크립트 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            새로고침
          </Button>
          
          <ScriptUploadButton onUploadSuccess={(newScript) => {
            setScripts(prev => [newScript, ...prev])
          }} />
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center space-x-1">
          <Filter className="h-4 w-4 text-gray-500 mr-2" />
          {Object.entries({
            all: '전체',
            script_ready: 'Script Ready',
            video_ready: 'Video Ready',
            uploaded: 'Uploaded',
            error: 'Error'
          }).map(([status, label]) => {
            const count = status === 'all' 
              ? serverStats.total 
              : serverStats.byStatus[status] || 0

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 검색 결과 표시 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {filteredScripts.length}개 결과
            {searchTerm && ` (검색: "${searchTerm}")`}
            {statusFilter !== 'all' && ` (필터: ${statusFilter})`}
          </span>
        </div>
      </div>

      {/* 스크립트 액션 버튼들 */}
      <ScriptActionButtons
        scripts={filteredScripts}
        onDelete={handleDelete}
      />
    </div>
  )
}

/**
 * 스크립트 업로드 버튼 (클라이언트 전용)
 */
interface ScriptUploadButtonProps {
  onUploadSuccess: (_script: Script) => void
}

function ScriptUploadButton({ onUploadSuccess }: ScriptUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/scripts/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('업로드에 실패했습니다.')
      
      const newScript = await response.json()
      onUploadSuccess(newScript)
      
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        새 스크립트
      </Button>
    </>
  )
}

/**
 * 스크립트 액션 버튼들
 */
interface ScriptActionButtonsProps {
  scripts: Script[]
  onDelete: (_id: number) => void
}

function ScriptActionButtons({ scripts, onDelete }: ScriptActionButtonsProps) {
  const [selectedScripts, setSelectedScripts] = useState<number[]>([])
  const [actionInProgress, setActionInProgress] = useState<number | null>(null)

  const handleSelectAll = () => {
    if (selectedScripts.length === scripts.length) {
      setSelectedScripts([])
    } else {
      setSelectedScripts(scripts.map(s => s.id))
    }
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`선택된 ${selectedScripts.length}개 스크립트를 삭제하시겠습니까?`)) {
      return
    }

    for (const scriptId of selectedScripts) {
      await onDelete(scriptId)
    }
    
    setSelectedScripts([])
  }

  const handleSingleAction = async (scriptId: number, action: string) => {
    setActionInProgress(scriptId)
    
    try {
      if (action === 'delete') {
        await onDelete(scriptId)
      } else if (action === 'view') {
        // 상세 보기 로직
        alert(`스크립트 ${scriptId} 상세 보기 (구현 예정)`)
      }
    } finally {
      setActionInProgress(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* 대량 작업 컨트롤 */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={selectedScripts.length === scripts.length && scripts.length > 0}
            onChange={handleSelectAll}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">
            {selectedScripts.length > 0 
              ? `${selectedScripts.length}개 선택됨` 
              : '전체 선택/해제'
            }
          </span>
        </div>

        {selectedScripts.length > 0 && (
          <div className="flex space-x-2">
            <Button
              onClick={handleBulkDelete}
              variant="outline"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              선택 삭제
            </Button>
          </div>
        )}
      </div>

      {/* 개별 스크립트 액션 */}
      <div className="space-y-2">
        {scripts.map((script) => (
          <div key={script.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedScripts.includes(script.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedScripts(prev => [...prev, script.id])
                  } else {
                    setSelectedScripts(prev => prev.filter(id => id !== script.id))
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="font-medium text-gray-900">{script.title}</span>
              <span className="text-sm text-gray-500">({script.status})</span>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => handleSingleAction(script.id, 'view')}
                variant="outline"
                size="sm"
                disabled={actionInProgress === script.id}
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={() => handleSingleAction(script.id, 'delete')}
                variant="outline"
                size="sm"
                disabled={actionInProgress === script.id}
              >
                {actionInProgress === script.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Upload 페이지 클라이언트 인터랙션
// ============================================================================

interface UploadClientInteractionsProps {
  availableScripts: Array<{
    id: number
    title: string
    status: string
  }>
  uploadSettings: {
    maxFileSize: string
    allowedTypes: string[]
    defaultPrivacy: string
  }
}

/**
 * 업로드 페이지의 모든 클라이언트 인터랙션
 */
export function UploadClientInteractions({ 
  availableScripts, 
  uploadSettings 
}: UploadClientInteractionsProps) {
  const [selectedScriptId, setSelectedScriptId] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'completed' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 검증
  const validateFile = useCallback((file: File): string | null => {
    const maxSize = 8 * 1024 * 1024 * 1024 // 8GB
    if (file.size > maxSize) {
      return `파일 크기가 ${uploadSettings.maxFileSize}를 초과합니다.`
    }

    const allowedExtensions = uploadSettings.allowedTypes
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedExtensions.includes(fileExtension)) {
      return `지원되지 않는 파일 형식입니다. (지원: ${allowedExtensions.join(', ')})`
    }

    return null
  }, [uploadSettings])

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setError(null)
  }, [validateFile])

  // 드래그 앤 드롭
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  // 업로드 시작
  const handleUpload = useCallback(async () => {
    if (!selectedScriptId || !selectedFile) {
      setError('스크립트와 파일을 모두 선택해주세요.')
      return
    }

    setUploadStatus('uploading')
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('video', selectedFile)
      formData.append('script_id', selectedScriptId.toString())

      // XMLHttpRequest를 사용하여 진행률 추적
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setUploadStatus('completed')
          setUploadProgress(100)
        } else {
          throw new Error('업로드에 실패했습니다.')
        }
      })

      xhr.addEventListener('error', () => {
        throw new Error('네트워크 오류가 발생했습니다.')
      })

      xhr.open('POST', `/api/upload/video/${selectedScriptId}`)
      xhr.send(formData)

    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.')
      setUploadStatus('error')
    }
  }, [selectedScriptId, selectedFile])

  // 초기화
  const handleReset = useCallback(() => {
    setSelectedScriptId(null)
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadStatus('idle')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* 스크립트 선택 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">1. 스크립트 선택</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableScripts.map((script) => (
            <div
              key={script.id}
              onClick={() => setSelectedScriptId(script.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedScriptId === script.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{script.title}</span>
                {selectedScriptId === script.id && (
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <span className="text-sm text-gray-500">{script.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 파일 업로드 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">2. 비디오 파일 업로드</h3>
        
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300'
          }`}
        >
          {!selectedFile ? (
            <>
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                파일을 드래그하거나 클릭하여 선택하세요
              </p>
              <p className="text-sm text-gray-600 mb-4">
                최대 {uploadSettings.maxFileSize}, {uploadSettings.allowedTypes.join(', ')} 형식 지원
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={uploadSettings.allowedTypes.join(',')}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                파일 선택
              </Button>
            </>
          ) : (
            <div>
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">{selectedFile.name}</p>
              <p className="text-sm text-gray-600 mb-4">
                크기: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button onClick={handleReset} variant="outline">
                다른 파일 선택
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 업로드 진행 및 컨트롤 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">3. 업로드 실행</h3>
        
        {uploadStatus === 'idle' && (
          <Button
            onClick={handleUpload}
            disabled={!selectedScriptId || !selectedFile}
            className="w-full"
          >
            업로드 시작
          </Button>
        )}

        {uploadStatus === 'uploading' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">업로드 진행률</span>
              <span className="text-sm font-medium text-gray-900">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-gray-600">업로드 중...</span>
            </div>
          </div>
        )}

        {uploadStatus === 'completed' && (
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-4">업로드 완료!</p>
            <Button onClick={handleReset}>새 업로드</Button>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">업로드 실패</p>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <div className="space-x-2">
              <Button onClick={handleUpload}>다시 시도</Button>
              <Button onClick={handleReset} variant="outline">취소</Button>
            </div>
          </div>
        )}
      </div>

      {/* 에러 표시 */}
      {error && uploadStatus !== 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 실시간 상태 업데이트 (WebSocket)
// ============================================================================

/**
 * 실시간 상태 업데이트를 위한 클라이언트 컴포넌트
 */
export function RealTimeStatusUpdater() {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  useEffect(() => {
    // WebSocket 연결 (실제 구현에서는 context나 hook 사용)
    const ws = new WebSocket('ws://localhost:8000/ws/')
    
    ws.onopen = () => {
      setConnectionStatus('connected')
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setLastUpdate(data.message || '상태 업데이트됨')
    }
    
    ws.onclose = () => {
      setConnectionStatus('disconnected')
    }
    
    ws.onerror = () => {
      setConnectionStatus('disconnected')
    }

    return () => {
      ws.close()
    }
  }, [])

  const statusColors = {
    connecting: 'bg-yellow-100 text-yellow-800',
    connected: 'bg-green-100 text-green-800',
    disconnected: 'bg-red-100 text-red-800'
  }

  const statusText = {
    connecting: '연결 중...',
    connected: '연결됨',
    disconnected: '연결 끊김'
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg border border-gray-200 shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">실시간 상태</span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[connectionStatus]}`}>
          {statusText[connectionStatus]}
        </span>
      </div>
      {lastUpdate && (
        <p className="text-xs text-gray-600">{lastUpdate}</p>
      )}
    </div>
  )
}