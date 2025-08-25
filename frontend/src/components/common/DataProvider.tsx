import React, { type ReactNode } from 'react'
import type { Script } from '@/types'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

/**
 * Phase 10: Render Props 패턴 구현
 * DataProvider - 데이터 로딩 상태를 Render Props로 전달하는 컴포넌트
 * 
 * React 19 최적화된 데이터 로딩 추상화:
 * - TanStack Query 완전 통합
 * - 타입 안전성 보장
 * - 재사용 가능한 로딩/에러/성공 상태 처리
 */

interface DataProviderProps<TData = unknown, TError = Error> {
  queryKey: string[]
  queryFn: () => Promise<TData>
  queryOptions?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
  children: (_renderProps: {
    data: TData | undefined
    isLoading: boolean
    isError: boolean
    error: TError | null
    refetch: () => void
    isFetching: boolean
    isStale: boolean
    isSuccess: boolean
  }) => ReactNode
}

/**
 * 데이터 로딩을 위한 Render Props 컴포넌트
 */
export function DataProvider<TData = unknown, TError = Error>({
  queryKey,
  queryFn,
  queryOptions,
  children
}: DataProviderProps<TData, TError>) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isStale,
    isSuccess
  } = useQuery<TData, TError>({
    queryKey,
    queryFn,
    ...queryOptions
  })

  return (
    <>
      {children({
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
        isStale,
        isSuccess
      })}
    </>
  )
}

/**
 * 특화된 Scripts 데이터 프로바이더
 */
interface ScriptsDataProviderProps {
  page?: number
  limit?: number
  filters?: Record<string, unknown>
  children: (_renderProps: {
    scripts: Script[] | undefined
    isLoading: boolean
    isError: boolean
    error: Error | null
    refetch: () => void
    totalPages?: number
    totalItems?: number
  }) => ReactNode
}

export function ScriptsDataProvider({ 
  page = 1, 
  limit = 10, 
  filters = {}, 
  children 
}: ScriptsDataProviderProps) {
  return (
    <DataProvider
      queryKey={['scripts', page.toString(), limit.toString(), JSON.stringify(filters)]}
      queryFn={async () => {
        // API 호출 시뮬레이션 (실제로는 useScripts 훅의 로직 사용)
        const response = await fetch(`/api/scripts?page=${page}&limit=${limit}`)
        return response.json()
      }}
      queryOptions={{
        staleTime: 5 * 60 * 1000, // 5분
        gcTime: 10 * 60 * 1000,   // 10분
      }}
    >
      {({ data, isLoading, isError, error, refetch }) => 
        children({
          scripts: data?.items,
          isLoading,
          isError,
          error,
          refetch,
          totalPages: data?.total_pages,
          totalItems: data?.total_items
        })
      }
    </DataProvider>
  )
}

/**
 * 특화된 Upload 상태 프로바이더
 */
interface UploadDataProviderProps {
  scriptId: number | null
  children: (_renderProps: {
    uploadStatus: 'idle' | 'uploading' | 'completed' | 'error'
    uploadProgress: number
    error: Error | null
    startUpload: (_file: File) => Promise<void>
    cancelUpload: () => void
    resetUpload: () => void
  }) => ReactNode
}

export function UploadDataProvider({ scriptId, children }: UploadDataProviderProps) {
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'uploading' | 'completed' | 'error'>('idle')
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [error, setError] = React.useState<Error | null>(null)

  const startUpload = async (file: File) => {
    if (!scriptId) {
      setError(new Error('스크립트를 먼저 선택해주세요.'))
      setUploadStatus('error')
      return
    }

    setUploadStatus('uploading')
    setUploadProgress(0)
    setError(null)

    try {
      // 실제 업로드 로직 시뮬레이션
      const formData = new FormData()
      formData.append('video', file)
      formData.append('script_id', scriptId.toString())

      // Progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10
          return newProgress >= 100 ? 100 : newProgress
        })
      }, 500)

      // Simulate upload (실제로는 useUploadVideo 훅 사용)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus('completed')
    } catch (err) {
      setError(err as Error)
      setUploadStatus('error')
    }
  }

  const cancelUpload = () => {
    setUploadStatus('idle')
    setUploadProgress(0)
    setError(null)
  }

  const resetUpload = () => {
    setUploadStatus('idle')
    setUploadProgress(0)
    setError(null)
  }

  return (
    <>
      {children({
        uploadStatus,
        uploadProgress,
        error,
        startUpload,
        cancelUpload,
        resetUpload
      })}
    </>
  )
}

/**
 * 리스트 데이터를 위한 범용 Render Props
 */
interface ListDataProviderProps<TItem> {
  items: TItem[]
  isLoading: boolean
  error: Error | null
  searchTerm?: string
  sortBy?: string
  filterBy?: Record<string, unknown>
  children: (_renderProps: {
    items: TItem[]
    filteredItems: TItem[]
    sortedItems: TItem[]
    searchResults: TItem[]
    isEmpty: boolean
    hasResults: boolean
    totalCount: number
  }) => ReactNode
}

export function ListDataProvider<TItem extends Record<string, unknown>>({
  items,
  isLoading,
  error,
  searchTerm = '',
  sortBy = 'created_at',
  filterBy = {},
  children
}: ListDataProviderProps<TItem>) {
  const filteredItems = React.useMemo(() => {
    if (!items) return []
    
    return items.filter(item => {
      // 필터 적용
      const passesFilter = Object.entries(filterBy).every(([key, value]) => {
        if (!value || value === 'all') return true
        return item[key] === value
      })

      // 검색어 적용
      const passesSearch = !searchTerm || 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )

      return passesFilter && passesSearch
    })
  }, [items, filterBy, searchTerm])

  const sortedItems = React.useMemo(() => {
    if (!filteredItems) return []
    
    return [...filteredItems].sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal)
      }
      
      if (aVal instanceof Date && bVal instanceof Date) {
        return bVal.getTime() - aVal.getTime() // 최신순
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return bVal - aVal
      }
      
      return String(aVal).localeCompare(String(bVal))
    })
  }, [filteredItems, sortBy])

  if (isLoading) {
    return (
      <>
        {children({
          items: [],
          filteredItems: [],
          sortedItems: [],
          searchResults: [],
          isEmpty: true,
          hasResults: false,
          totalCount: 0
        })}
      </>
    )
  }

  if (error) {
    return (
      <>
        {children({
          items: [],
          filteredItems: [],
          sortedItems: [],
          searchResults: [],
          isEmpty: true,
          hasResults: false,
          totalCount: 0
        })}
      </>
    )
  }

  return (
    <>
      {children({
        items: items || [],
        filteredItems,
        sortedItems,
        searchResults: sortedItems,
        isEmpty: !items || items.length === 0,
        hasResults: sortedItems.length > 0,
        totalCount: items?.length || 0
      })}
    </>
  )
}