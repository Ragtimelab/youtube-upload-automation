import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Script } from '@/types'

/**
 * React 19 최적화된 스크립트 상태 관리
 * 정규화된 데이터 구조로 성능 최적화
 */

export interface FilterState {
  searchQuery: string
  statusFilter: 'all' | 'script_ready' | 'video_ready' | 'uploaded' | 'scheduled' | 'error'
  sortBy: 'created_at' | 'title' | 'updated_at'
  sortOrder: 'asc' | 'desc'
  pageSize: number
  currentPage: number
}

interface ScriptsState {
  // 정규화된 데이터 구조 - O(1) 접근 성능
  entities: Record<string, Script>
  ids: string[]
  
  // UI 상태
  selectedIds: Set<string>
  filters: FilterState
  
  // 로딩 상태
  isLoading: boolean
  isUpdating: Record<string, boolean>
  error: string | null
  
  // 메타데이터
  totalCount: number
  lastUpdated: Date | null
  
  // 액션들
  setScripts: (_scripts: Script[]) => void
  addScript: (_script: Script) => void
  updateScript: (_id: string, _updates: Partial<Script>) => void
  removeScript: (_id: string) => void
  
  // 선택 관리
  selectScript: (_id: string) => void
  deselectScript: (_id: string) => void
  toggleSelection: (_id: string) => void
  selectAll: () => void
  deselectAll: () => void
  selectByStatus: (_status: Script['status']) => void
  
  // 필터링 & 정렬
  setFilters: (_filters: Partial<FilterState>) => void
  resetFilters: () => void
  setSearchQuery: (_query: string) => void
  setStatusFilter: (_status: FilterState['statusFilter']) => void
  setSorting: (_sortBy: FilterState['sortBy'], _sortOrder: FilterState['sortOrder']) => void
  setPage: (_page: number) => void
  
  // 조회 헬퍼
  getScript: (_id: string) => Script | undefined
  getSelectedScripts: () => Script[]
  getFilteredIds: () => string[]
  getVisibleScripts: () => Script[]
  
  // 통계
  getStats: () => {
    total: number
    byStatus: Record<Script['status'], number>
    selected: number
  }
  
  // 상태 관리
  setLoading: (_loading: boolean) => void
  setUpdating: (_id: string, _updating: boolean) => void
  setError: (_error: string | null) => void
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  statusFilter: 'all',
  sortBy: 'created_at',
  sortOrder: 'desc',
  pageSize: 10,
  currentPage: 1
}

export const useScriptsStore = create<ScriptsState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // 초기 상태
        entities: {},
        ids: [],
        selectedIds: new Set<string>(),
        filters: DEFAULT_FILTERS,
        isLoading: false,
        isUpdating: {},
        error: null,
        totalCount: 0,
        lastUpdated: null,

        // 스크립트 설정 (정규화)
        setScripts: (scripts: Script[]) => set((state) => {
          state.entities = {}
          state.ids = []
          
          scripts.forEach(script => {
            const id = script.id.toString()
            state.entities[id] = script
            state.ids.push(id)
          })
          
          state.totalCount = scripts.length
          state.lastUpdated = new Date()
          state.isLoading = false
          state.error = null
        }),

        // 스크립트 추가
        addScript: (script: Script) => set((state) => {
          const id = script.id.toString()
          state.entities[id] = script
          state.ids.unshift(id) // 최신이 맨 앞에
          state.totalCount += 1
          state.lastUpdated = new Date()
        }),

        // 스크립트 업데이트
        updateScript: (id: string, updates: Partial<Script>) => set((state) => {
          if (state.entities[id]) {
            state.entities[id] = { ...state.entities[id], ...updates }
            state.lastUpdated = new Date()
          }
        }),

        // 스크립트 제거
        removeScript: (id: string) => set((state) => {
          if (state.entities[id]) {
            delete state.entities[id]
            state.ids = state.ids.filter(scriptId => scriptId !== id)
            state.selectedIds.delete(id)
            state.totalCount -= 1
            state.lastUpdated = new Date()
          }
        }),

        // 선택 관리
        selectScript: (id: string) => set((state) => {
          if (state.entities[id]) {
            state.selectedIds.add(id)
          }
        }),

        deselectScript: (id: string) => set((state) => {
          state.selectedIds.delete(id)
        }),

        toggleSelection: (id: string) => set((state) => {
          if (state.selectedIds.has(id)) {
            state.selectedIds.delete(id)
          } else if (state.entities[id]) {
            state.selectedIds.add(id)
          }
        }),

        selectAll: () => set((state) => {
          const filteredIds = get().getFilteredIds()
          filteredIds.forEach(id => state.selectedIds.add(id))
        }),

        deselectAll: () => set((state) => {
          state.selectedIds.clear()
        }),

        selectByStatus: (status: Script['status']) => set((state) => {
          state.selectedIds.clear()
          state.ids.forEach(id => {
            if (state.entities[id]?.status === status) {
              state.selectedIds.add(id)
            }
          })
        }),

        // 필터링
        setFilters: (filters: Partial<FilterState>) => set((state) => {
          state.filters = { ...state.filters, ...filters }
          // 필터 변경 시 첫 페이지로
          if ('searchQuery' in filters || 'statusFilter' in filters) {
            state.filters.currentPage = 1
          }
        }),

        resetFilters: () => set((state) => {
          state.filters = { ...DEFAULT_FILTERS }
        }),

        setSearchQuery: (query: string) => set((state) => {
          state.filters.searchQuery = query
          state.filters.currentPage = 1
        }),

        setStatusFilter: (status: FilterState['statusFilter']) => set((state) => {
          state.filters.statusFilter = status
          state.filters.currentPage = 1
        }),

        setSorting: (sortBy: FilterState['sortBy'], sortOrder: FilterState['sortOrder']) => set((state) => {
          state.filters.sortBy = sortBy
          state.filters.sortOrder = sortOrder
        }),

        setPage: (page: number) => set((state) => {
          state.filters.currentPage = page
        }),

        // 조회 헬퍼
        getScript: (id: string) => {
          const state = get()
          return state.entities[id]
        },

        getSelectedScripts: () => {
          const state = get()
          return Array.from(state.selectedIds)
            .map(id => state.entities[id])
            .filter(Boolean)
        },

        getFilteredIds: () => {
          const state = get()
          const { searchQuery, statusFilter, sortBy, sortOrder } = state.filters
          
          let filteredIds = state.ids

          // 검색 필터
          if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filteredIds = filteredIds.filter(id => {
              const script = state.entities[id]
              return script && (
                script.title.toLowerCase().includes(query) ||
                script.description?.toLowerCase().includes(query) ||
                script.filename.toLowerCase().includes(query)
              )
            })
          }

          // 상태 필터
          if (statusFilter !== 'all') {
            filteredIds = filteredIds.filter(id => 
              state.entities[id]?.status === statusFilter
            )
          }

          // 정렬
          filteredIds.sort((a, b) => {
            const scriptA = state.entities[a]
            const scriptB = state.entities[b]
            
            if (!scriptA || !scriptB) return 0

            let comparison = 0
            switch (sortBy) {
              case 'title':
                comparison = scriptA.title.localeCompare(scriptB.title)
                break
              case 'created_at':
                comparison = new Date(scriptA.created_at).getTime() - new Date(scriptB.created_at).getTime()
                break
              case 'updated_at':
                comparison = new Date(scriptA.updated_at || scriptA.created_at).getTime() - 
                           new Date(scriptB.updated_at || scriptB.created_at).getTime()
                break
            }

            return sortOrder === 'desc' ? -comparison : comparison
          })

          return filteredIds
        },

        getVisibleScripts: () => {
          const state = get()
          const filteredIds = state.getFilteredIds()
          const { currentPage, pageSize } = state.filters
          
          const startIndex = (currentPage - 1) * pageSize
          const endIndex = startIndex + pageSize
          
          return filteredIds
            .slice(startIndex, endIndex)
            .map(id => state.entities[id])
            .filter(Boolean)
        },

        // 통계
        getStats: () => {
          const state = get()
          const statusCounts: Record<Script['status'], number> = {
            script_ready: 0,
            video_ready: 0, 
            uploaded: 0,
            scheduled: 0,
            error: 0
          }

          state.ids.forEach(id => {
            const script = state.entities[id]
            if (script) {
              statusCounts[script.status] = (statusCounts[script.status] || 0) + 1
            }
          })

          return {
            total: state.ids.length,
            byStatus: statusCounts,
            selected: state.selectedIds.size
          }
        },

        // 상태 관리
        setLoading: (loading: boolean) => set((state) => {
          state.isLoading = loading
          if (loading) {
            state.error = null
          }
        }),

        setUpdating: (id: string, updating: boolean) => set((state) => {
          if (updating) {
            state.isUpdating[id] = true
          } else {
            delete state.isUpdating[id]
          }
        }),

        setError: (error: string | null) => set((state) => {
          state.error = error
          state.isLoading = false
        })
      }))
    ),
    {
      name: 'scripts-store', // Redux DevTools에서 표시될 이름
      partialize: (state: ScriptsState) => ({
        // persist할 상태만 선택 (선택사항)
        filters: state.filters,
      })
    }
  )
)

/**
 * 스크립트 선택 상태만 구독하는 훅
 * 선택 변경 시에만 리렌더링
 */
export const useScriptSelection = () => {
  return useScriptsStore(state => ({
    selectedIds: state.selectedIds,
    selectedScripts: state.getSelectedScripts(),
    selectScript: state.selectScript,
    deselectScript: state.deselectScript,
    toggleSelection: state.toggleSelection,
    selectAll: state.selectAll,
    deselectAll: state.deselectAll,
    selectByStatus: state.selectByStatus
  }))
}

/**
 * 필터 상태만 구독하는 훅  
 * 필터 변경 시에만 리렌더링
 */
export const useScriptFilters = () => {
  return useScriptsStore(state => ({
    filters: state.filters,
    setFilters: state.setFilters,
    resetFilters: state.resetFilters,
    setSearchQuery: state.setSearchQuery,
    setStatusFilter: state.setStatusFilter,
    setSorting: state.setSorting,
    setPage: state.setPage
  }))
}

/**
 * 현재 화면에 표시되는 스크립트만 구독하는 훅
 * 페이지네이션된 결과에 최적화
 */
export const useVisibleScripts = () => {
  return useScriptsStore(state => ({
    scripts: state.getVisibleScripts(),
    totalCount: state.getFilteredIds().length,
    isLoading: state.isLoading,
    error: state.error
  }))
}

/**
 * 스크립트 통계만 구독하는 훅
 * 통계 정보가 필요한 대시보드 컴포넌트에서 사용
 */
export const useScriptStats = () => {
  return useScriptsStore(state => state.getStats())
}