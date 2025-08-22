import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useScripts, useUploadScript, useDeleteScript } from '@/hooks/useScripts'
import { 
  FileText, 
  Plus, 
  Search, 
  Upload,
  Trash2,
  Eye,
  Calendar,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react'

export function ScriptsPage() {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { data: scriptsData, isLoading, error } = useScripts(page, 10)
  const uploadScript = useUploadScript()
  const deleteScript = useDeleteScript()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        await uploadScript.mutateAsync(file)
        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('정말로 이 스크립트를 삭제하시겠습니까?')) {
      try {
        await deleteScript.mutateAsync(id)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'script_ready': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'video_ready': return <CheckCircle2 className="h-4 w-4 text-blue-600" />
      case 'uploaded': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'script_ready': return '스크립트 준비'
      case 'video_ready': return '비디오 준비'
      case 'uploaded': return '업로드 완료'
      case 'error': return '오류'
      default: return '알 수 없음'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'script_ready': return 'bg-yellow-100 text-yellow-800'
      case 'video_ready': return 'bg-blue-100 text-blue-800'
      case 'uploaded': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">스크립트 관리</h1>
          <p className="text-gray-600 mt-1">마크다운 스크립트 파일을 업로드하고 관리하세요.</p>
        </div>
        <div className="flex space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadScript.isPending}
          >
            {uploadScript.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            새 스크립트 업로드
          </Button>
        </div>
      </div>

      {/* 검색 바 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
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

      {/* 스크립트 목록 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 mx-auto text-gray-400 animate-spin mb-4" />
            <p className="text-gray-600">스크립트를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">오류가 발생했습니다</h3>
            <p className="text-gray-600 mb-4">스크립트를 불러올 수 없습니다.</p>
            <Button onClick={() => window.location.reload()}>다시 시도</Button>
          </div>
        ) : !scriptsData?.items.length ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">스크립트가 없습니다</h3>
            <p className="text-gray-600 mb-6">첫 번째 스크립트를 업로드하여 시작하세요.</p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Plus className="h-4 w-4 mr-2" />
              스크립트 업로드
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {scriptsData.items.map((script) => (
              <div key={script.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {script.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(script.status)}`}>
                        {getStatusText(script.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{script.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(script.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>{script.filename}</span>
                      </div>
                      {script.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Tag className="h-4 w-4" />
                          <span>{script.tags.slice(0, 3).join(', ')}</span>
                          {script.tags.length > 3 && <span>...</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {getStatusIcon(script.status)}
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      상세
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(script.id)}
                      disabled={deleteScript.isPending}
                    >
                      {deleteScript.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {scriptsData && scriptsData.total_pages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            이전
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {page} / {scriptsData.total_pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === scriptsData.total_pages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}