import { create } from 'zustand'
import type { UploadProgress, ID } from '@/shared/types'

interface UploadState {
  // 업로드 진행 상태
  uploads: Record<ID, UploadProgress>
  
  // 액션
  setUploadProgress: (scriptId: ID, progress: UploadProgress) => void
  removeUpload: (scriptId: ID) => void
  clearUploads: () => void
  
  // 헬퍼 메서드
  getUpload: (scriptId: ID) => UploadProgress | undefined
  isUploading: (scriptId: ID) => boolean
  getUploadPercentage: (scriptId: ID) => number
}

export const useUploadStore = create<UploadState>((set, get) => ({
  uploads: {},

  setUploadProgress: (scriptId, progress) =>
    set((state) => ({
      uploads: {
        ...state.uploads,
        [scriptId]: progress,
      },
    })),

  removeUpload: (scriptId) =>
    set((state) => {
      const { [scriptId]: removed, ...rest } = state.uploads
      return { uploads: rest }
    }),

  clearUploads: () => set({ uploads: {} }),

  getUpload: (scriptId) => get().uploads[scriptId],

  isUploading: (scriptId) => {
    const upload = get().uploads[scriptId]
    return upload !== undefined && upload.percentage < 100
  },

  getUploadPercentage: (scriptId) => {
    const upload = get().uploads[scriptId]
    return upload?.percentage || 0
  },
}))