import { createContext } from 'react'

/**
 * 권한 관련 타입 정의
 */

export type UserRole = 'admin' | 'manager' | 'editor' | 'viewer'

export interface Permission {
  // 스크립트 관련 권한
  canCreateScript: boolean
  canEditScript: boolean
  canDeleteScript: boolean
  canViewScript: boolean
  
  // 업로드 관련 권한
  canUploadVideo: boolean
  canDeleteVideo: boolean
  canManageUploads: boolean
  
  // YouTube 관련 권한
  canUploadYouTube: boolean
  canScheduleYouTube: boolean
  canManageYouTube: boolean
  canViewAnalytics: boolean
  
  // 시스템 관리 권한
  canManageSettings: boolean
  canViewLogs: boolean
  canManageUsers: boolean
  canAccessDashboard: boolean
  
  // 고급 기능 권한
  canBatchUpload: boolean
  canExportData: boolean
  canManageChannels: boolean
  canAccessAPI: boolean
}

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

export interface PermissionsContextValue {
  // 사용자 정보
  user: User | null
  isLoading: boolean
  error: string | null
  
  // 권한 확인
  permissions: Permission
  hasPermission: (_permission: keyof Permission) => boolean
  hasAnyPermission: (_permissionList: (keyof Permission)[]) => boolean
  hasAllPermissions: (_permissionList: (keyof Permission)[]) => boolean
  
  // 역할 확인
  isAdmin: boolean
  isManager: boolean
  isEditor: boolean
  isViewer: boolean
  hasRole: (_role: UserRole) => boolean
  hasMinimumRole: (_minimumRole: UserRole) => boolean
  
  // 액션
  refreshPermissions: () => Promise<void>
}

export interface PermissionsProviderProps {
  children: React.ReactNode
  fallbackRole?: UserRole
}

export const PermissionsContext = createContext<PermissionsContextValue | null>(null)

// 역할별 기본 권한 정의
export const DEFAULT_PERMISSIONS: Record<UserRole, Permission> = {
  admin: {
    // 모든 권한
    canCreateScript: true,
    canEditScript: true,
    canDeleteScript: true,
    canViewScript: true,
    canUploadVideo: true,
    canDeleteVideo: true,
    canManageUploads: true,
    canUploadYouTube: true,
    canScheduleYouTube: true,
    canManageYouTube: true,
    canViewAnalytics: true,
    canManageSettings: true,
    canViewLogs: true,
    canManageUsers: true,
    canAccessDashboard: true,
    canBatchUpload: true,
    canExportData: true,
    canManageChannels: true,
    canAccessAPI: true,
  },
  manager: {
    // 관리자 권한 (사용자 관리 제외)
    canCreateScript: true,
    canEditScript: true,
    canDeleteScript: true,
    canViewScript: true,
    canUploadVideo: true,
    canDeleteVideo: true,
    canManageUploads: true,
    canUploadYouTube: true,
    canScheduleYouTube: true,
    canManageYouTube: true,
    canViewAnalytics: true,
    canManageSettings: true,
    canViewLogs: true,
    canManageUsers: false,
    canAccessDashboard: true,
    canBatchUpload: true,
    canExportData: true,
    canManageChannels: true,
    canAccessAPI: true,
  },
  editor: {
    // 편집자 권한
    canCreateScript: true,
    canEditScript: true,
    canDeleteScript: false,
    canViewScript: true,
    canUploadVideo: true,
    canDeleteVideo: false,
    canManageUploads: false,
    canUploadYouTube: true,
    canScheduleYouTube: true,
    canManageYouTube: false,
    canViewAnalytics: true,
    canManageSettings: false,
    canViewLogs: false,
    canManageUsers: false,
    canAccessDashboard: true,
    canBatchUpload: true,
    canExportData: false,
    canManageChannels: false,
    canAccessAPI: false,
  },
  viewer: {
    // 조회 권한만
    canCreateScript: false,
    canEditScript: false,
    canDeleteScript: false,
    canViewScript: true,
    canUploadVideo: false,
    canDeleteVideo: false,
    canManageUploads: false,
    canUploadYouTube: false,
    canScheduleYouTube: false,
    canManageYouTube: false,
    canViewAnalytics: true,
    canManageSettings: false,
    canViewLogs: false,
    canManageUsers: false,
    canAccessDashboard: true,
    canBatchUpload: false,
    canExportData: false,
    canManageChannels: false,
    canAccessAPI: false,
  },
}

// 역할 우선순위 정의 (높을수록 상위 권한)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  manager: 3,
  editor: 2,
  viewer: 1,
}