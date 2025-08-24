import { ScriptsDataProvider, UploadDataProvider, ListDataProvider } from '@/components/common/DataProvider'
import { ScriptUploadFormValidator, SearchFormValidator } from '@/components/common/FormValidator'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Upload, 
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Eye
} from 'lucide-react'

/**
 * Phase 10: Render Props 패턴 실제 사용 예제
 * 
 * 이 페이지는 Render Props 패턴의 실제 활용을 보여줍니다:
 * - DataProvider를 활용한 데이터 로딩 상태 관리
 * - FormValidator를 활용한 폼 검증 및 상태 관리
 * - 재사용 가능한 UI 패턴의 조합
 */

export function RenderPropsDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Render Props 패턴 데모</h1>
        <p className="text-gray-600">Phase 10에서 구현한 Render Props 컴포넌트들의 실제 사용 예제입니다.</p>
      </div>

      {/* 1. DataProvider 예제 - 스크립트 목록 */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          1. DataProvider 예제 - 스크립트 목록
        </h2>
        
        <ScriptsDataProvider page={1} limit={5}>
          {({ scripts, isLoading, isError, error, refetch, totalItems }) => {
            if (isLoading) {
              return (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>스크립트를 불러오는 중...</span>
                </div>
              )
            }

            if (isError) {
              return (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">스크립트 로딩 실패</h3>
                  <p className="text-gray-600 mb-4">{error?.message || '알 수 없는 오류가 발생했습니다.'}</p>
                  <Button onClick={refetch}>다시 시도</Button>
                </div>
              )
            }

            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">총 {totalItems}개의 스크립트</span>
                  <Button onClick={refetch} variant="outline" size="sm">
                    새로고침
                  </Button>
                </div>
                
                {scripts && scripts.length > 0 ? (
                  <div className="grid gap-4">
                    {scripts.map((script: any, index: number) => (
                      <div key={script?.id || index} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900">{script?.title || `스크립트 ${index + 1}`}</h3>
                        <p className="text-sm text-gray-600 mt-1">{script?.description || '설명 없음'}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {script?.status || 'ready'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {script?.created_at ? new Date(script.created_at).toLocaleDateString() : '날짜 미상'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>스크립트가 없습니다.</p>
                  </div>
                )}
              </div>
            )
          }}
        </ScriptsDataProvider>
      </section>

      {/* 2. UploadDataProvider 예제 */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          2. UploadDataProvider 예제 - 파일 업로드
        </h2>

        <UploadDataProvider scriptId={1}>
          {({ uploadStatus, uploadProgress, error, startUpload, cancelUpload, resetUpload }) => (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {uploadStatus === 'idle' && (
                  <>
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">파일을 선택하여 업로드를 시작하세요</p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          startUpload(file)
                        }
                      }}
                      className="hidden"
                      id="file-input"
                    />
                    <Button onClick={() => document.getElementById('file-input')?.click()}>
                      파일 선택
                    </Button>
                  </>
                )}

                {uploadStatus === 'uploading' && (
                  <>
                    <Loader2 className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-spin" />
                    <p className="text-blue-600 mb-4">업로드 중... {Math.round(uploadProgress)}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <Button onClick={cancelUpload} variant="outline">
                      취소
                    </Button>
                  </>
                )}

                {uploadStatus === 'completed' && (
                  <>
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-green-600 mb-4">업로드가 완료되었습니다!</p>
                    <Button onClick={resetUpload}>
                      다시 업로드
                    </Button>
                  </>
                )}

                {uploadStatus === 'error' && (
                  <>
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <p className="text-red-600 mb-2">업로드 실패</p>
                    <p className="text-sm text-gray-600 mb-4">{error?.message}</p>
                    <div className="space-x-2">
                      <Button onClick={resetUpload}>다시 시도</Button>
                      <Button onClick={resetUpload} variant="outline">취소</Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </UploadDataProvider>
      </section>

      {/* 3. FormValidator 예제 - 검색 폼 */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Search className="h-5 w-5 mr-2" />
          3. FormValidator 예제 - 검색 폼
        </h2>

        <SearchFormValidator
          onSearch={(values) => {
            console.log('검색 실행:', values)
            alert(`검색어: "${values.query}"로 검색을 실행합니다.`)
          }}
        >
          {({ values, errors, isValid, handleChange, handleSubmit, resetForm }) => (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  검색어
                </label>
                <input
                  type="text"
                  value={values.query || ''}
                  onChange={(e) => handleChange('query')(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.query ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="스크립트 검색..."
                />
                {errors.query && (
                  <p className="text-sm text-red-600 mt-1">{errors.query}</p>
                )}
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={!isValid}>
                  <Search className="h-4 w-4 mr-2" />
                  검색
                </Button>
                <Button type="button" onClick={resetForm} variant="outline">
                  초기화
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                유효성: {isValid ? '✅ 유효함' : '❌ 유효하지 않음'}
              </div>
            </form>
          )}
        </SearchFormValidator>
      </section>

      {/* 4. ScriptUploadFormValidator 예제 */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          4. ScriptUploadFormValidator 예제 - 스크립트 업로드 폼
        </h2>

        <ScriptUploadFormValidator
          onSubmit={async (values) => {
            console.log('스크립트 업로드:', values)
            alert(`파일 "${values.file?.name}"를 업로드합니다.`)
          }}
        >
          {({ values, errors, isValid, isSubmitting, handleChange, handleSubmit, resetForm }) => (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  마크다운 파일 *
                </label>
                <input
                  type="file"
                  accept=".md"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleChange('file')(file)
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.file ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.file && (
                  <p className="text-sm text-red-600 mt-1">{errors.file}</p>
                )}
                {values.file && (
                  <p className="text-sm text-gray-600 mt-1">
                    선택된 파일: {values.file.name} ({(values.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 (선택사항)
                </label>
                <input
                  type="text"
                  value={values.title || ''}
                  onChange={(e) => handleChange('title')(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="스크립트 제목..."
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명 (선택사항)
                </label>
                <textarea
                  value={values.description || ''}
                  onChange={(e) => handleChange('description')(e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="스크립트 설명..."
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                )}
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={!isValid || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      스크립트 업로드
                    </>
                  )}
                </Button>
                <Button type="button" onClick={resetForm} variant="outline">
                  초기화
                </Button>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <div>유효성: {isValid ? '✅ 유효함' : '❌ 유효하지 않음'}</div>
                <div>제출 중: {isSubmitting ? '✅ 예' : '❌ 아니오'}</div>
              </div>
            </form>
          )}
        </ScriptUploadFormValidator>
      </section>

      {/* 5. ListDataProvider 예제 */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          5. ListDataProvider 예제 - 필터링 및 정렬
        </h2>

        <ListDataProvider
          items={[
            { id: 1, title: 'React 19 가이드', status: 'completed', created_at: '2025-08-20', category: 'tutorial' },
            { id: 2, title: 'TypeScript 심화', status: 'draft', created_at: '2025-08-22', category: 'tutorial' },
            { id: 3, title: 'Render Props 패턴', status: 'completed', created_at: '2025-08-25', category: 'advanced' },
            { id: 4, title: 'Context API 활용', status: 'draft', created_at: '2025-08-23', category: 'intermediate' }
          ]}
          isLoading={false}
          error={null}
          searchTerm=""
          sortBy="created_at"
          filterBy={{ status: 'all' }}
        >
          {({ sortedItems, isEmpty, hasResults, totalCount }) => (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  총 {totalCount}개 항목 중 {sortedItems.length}개 표시
                </span>
                <div className="text-sm text-gray-500">
                  {hasResults ? '결과 있음' : '결과 없음'}
                </div>
              </div>

              {isEmpty ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>항목이 없습니다.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {sortedItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <div className="flex items-center mt-1 space-x-2 text-sm text-gray-500">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span>{item.created_at}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          item.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ListDataProvider>
      </section>
    </div>
  )
}