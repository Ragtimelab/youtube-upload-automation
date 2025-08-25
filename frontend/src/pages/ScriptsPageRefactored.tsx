import { useState } from 'react'
import { ScriptsDataProvider, ListDataProvider } from '@/components/common/DataProvider'
import { SearchFormValidator } from '@/components/common/FormValidator'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Plus, 
  Search,
  Calendar,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Grid,
  List as ListIcon,
  Filter
} from 'lucide-react'

/**
 * Phase 10: Render Props 패턴으로 완전히 리팩토링된 ScriptsPage
 * 
 * 기존 ScriptsPage 대비 변화점:
 * - ScriptsDataProvider로 데이터 로딩 로직 분리
 * - SearchFormValidator로 검색 폼 로직 분리
 * - ListDataProvider로 필터링/정렬 로직 분리
 * - 더욱 선언적이고 재사용 가능한 구조
 */

export function ScriptsPageRefactored() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">스크립트 관리</h1>
          <p className="text-gray-600 mt-1">Render Props 패턴으로 리팩토링된 스크립트 관리</p>
        </div>
        <div className="flex space-x-3">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            새 스크립트 업로드
          </Button>
        </div>
      </div>

      {/* 검색 바 - SearchFormValidator 사용 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <SearchFormValidator
          initialValues={{ query: searchQuery }}
          onSearch={(values) => {
            setSearchQuery(values.query)
          }}
        >
          {({ values: _values, errors, handleChange, handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="스크립트 검색..."
                  value={_values.query || ''}
                  onChange={(e) => handleChange('query')(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.query ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.query && (
                  <p className="text-sm text-red-600 mt-1">{errors.query}</p>
                )}
              </div>
            </form>
          )}
        </SearchFormValidator>
      </div>

      {/* 필터 및 뷰 컨트롤 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex justify-between items-center">
          {/* 상태 필터 */}
          <div className="flex items-center space-x-1">
            <Filter className="h-4 w-4 text-gray-500 mr-2" />
            {['all', 'script_ready', 'video_ready', 'uploaded', 'error'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {status === 'all' ? '전체' : status}
              </button>
            ))}
          </div>

          {/* 뷰 모드 토글 */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 - ScriptsDataProvider와 ListDataProvider 조합 */}
      <ScriptsDataProvider page={1} limit={20}>
        {({ scripts, isLoading, isError, error, refetch, totalItems }) => (
          <ListDataProvider
            items={(scripts || []) as unknown as Record<string, unknown>[]}
            isLoading={isLoading}
            error={error}
            searchTerm={searchQuery}
            filterBy={{ status: statusFilter === 'all' ? undefined : statusFilter }}
            sortBy="created_at"
          >
            {({ sortedItems, isEmpty }) => (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 mx-auto text-gray-400 animate-spin mb-4" />
                    <p className="text-gray-600">스크립트를 불러오는 중...</p>
                  </div>
                ) : isError ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">스크립트 로딩 실패</h3>
                    <p className="text-gray-600 mb-4">{error?.message || '알 수 없는 오류가 발생했습니다.'}</p>
                    <Button onClick={refetch}>다시 시도</Button>
                  </div>
                ) : isEmpty ? (
                  <div className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">스크립트가 없습니다</h3>
                    <p className="text-gray-600 mb-6">첫 번째 스크립트를 업로드하여 시작하세요.</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      스크립트 업로드
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* 결과 헤더 */}
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        총 {totalItems}개 중 {sortedItems.length}개 표시
                        {searchQuery && ` (검색: "${searchQuery}")`}
                      </span>
                      <Button onClick={refetch} variant="outline" size="sm">
                        새로고침
                      </Button>
                    </div>

                    {/* 스크립트 목록 - ViewMode에 따라 렌더링 */}
                    {viewMode === 'grid' ? (
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sortedItems.map((script) => (
                            <ScriptCard key={(script as { id: number }).id} script={script as any} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {sortedItems.map((script) => (
                          <ScriptListItem key={(script as { id: number }).id} script={script as any} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </ListDataProvider>
        )}
      </ScriptsDataProvider>
    </div>
  )
}

/**
 * 스크립트 카드 컴포넌트 (Grid 모드용)
 */
function ScriptCard({ script }: { script: unknown }) {
  const scriptData = script as { 
    id: number; 
    title?: string; 
    description?: string; 
    status: string; 
    created_at?: string; 
    tags?: string[] 
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'script_ready': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'video_ready': return <CheckCircle2 className="h-4 w-4 text-blue-600" />
      case 'uploaded': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'scheduled': return <Clock className="h-4 w-4 text-purple-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'script_ready': return 'bg-yellow-100 text-yellow-800'
      case 'video_ready': return 'bg-blue-100 text-blue-800'
      case 'uploaded': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(scriptData.status)}`}>
          {scriptData.status}
        </span>
        {getStatusIcon(scriptData.status)}
      </div>
      
      <h3 className="font-medium text-gray-900 mb-2 truncate">
        {scriptData.title || '제목 없음'}
      </h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {scriptData.description || '설명 없음'}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>{scriptData.created_at ? new Date(scriptData.created_at).toLocaleDateString('ko-KR') : '날짜 미상'}</span>
        {scriptData.tags && scriptData.tags.length > 0 && (
          <div className="flex items-center space-x-1">
            <Tag className="h-3 w-3" />
            <span>{scriptData.tags[0]}</span>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1">
          상세보기
        </Button>
        <Button variant="outline" size="sm">
          삭제
        </Button>
      </div>
    </div>
  )
}

/**
 * 스크립트 리스트 아이템 컴포넌트 (List 모드용)
 */
function ScriptListItem({ script }: { script: unknown }) {
  const scriptData = script as { 
    id: number; 
    title?: string; 
    description?: string; 
    status: string; 
    created_at?: string; 
    tags?: string[] 
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'script_ready': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'video_ready': return <CheckCircle2 className="h-4 w-4 text-blue-600" />
      case 'uploaded': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'scheduled': return <Clock className="h-4 w-4 text-purple-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'script_ready': return 'bg-yellow-100 text-yellow-800'
      case 'video_ready': return 'bg-blue-100 text-blue-800'
      case 'uploaded': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {scriptData.title || '제목 없음'}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(scriptData.status)}`}>
              {scriptData.status}
            </span>
          </div>
          <p className="text-gray-600 mb-3 line-clamp-2">
            {scriptData.description || '설명 없음'}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>
                {scriptData.created_at ? new Date(scriptData.created_at).toLocaleDateString('ko-KR') : '날짜 미상'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>{(scriptData as any).filename || '파일명 없음'}</span>
            </div>
            {scriptData.tags && scriptData.tags.length > 0 && (
              <div className="flex items-center space-x-1">
                <Tag className="h-4 w-4" />
                <span>{scriptData.tags.slice(0, 3).join(', ')}</span>
                {scriptData.tags.length > 3 && <span>...</span>}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {getStatusIcon(scriptData.status)}
          <Button variant="outline" size="sm">
            상세보기
          </Button>
          <Button variant="outline" size="sm">
            삭제
          </Button>
        </div>
      </div>
    </div>
  )
}