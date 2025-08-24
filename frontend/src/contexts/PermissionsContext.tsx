import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'

/**
 * React 19 최적화된 전역 권한 관리 시스템
 * 사용자 권한에 따른 UI/UX 제어 및 보안 강화
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

interface PermissionsContextValue {
  // 사용자 정보
  user: User | null
  isLoading: boolean
  error: string | null
  
  // 권한 확인
  permissions: Permission
  hasPermission: (permission: keyof Permission) => boolean
  hasAnyPermission: (permissions: (keyof Permission)[]) => boolean
  hasAllPermissions: (permissions: (keyof Permission)[]) => boolean
  
  // 역할 확인
  isAdmin: boolean
  isManager: boolean
  isEditor: boolean
  isViewer: boolean
  hasRole: (role: UserRole) => boolean
  hasMinimumRole: (minimumRole: UserRole) => boolean
  
  // 액션
  refreshPermissions: () => Promise<void>
}

interface PermissionsProviderProps {
  children: React.ReactNode
  fallbackRole?: UserRole
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null)

// 역할별 기본 권한 정의
const DEFAULT_PERMISSIONS: Record<UserRole, Permission> = {
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
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  manager: 3,
  editor: 2,
  viewer: 1,
}

/**
 * 권한 Provider 컴포넌트
 */
export function PermissionsProvider({ 
  children, 
  fallbackRole = 'editor' // 개발 환경에서 기본 역할
}: PermissionsProviderProps) {
  const [user, setUser] = useState<User | null>(null)

  // 현재 사용자 정보 조회
  const { 
    data: userData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/auth/me')
        return response.data
      } catch (error) {
        // API가 없는 경우 fallback 사용자 생성
        console.warn('User API not available, using fallback user:', error)
        return {
          id: 'fallback-user',
          username: 'Developer',
          email: 'dev@local',
          role: fallbackRole,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000,   // 10분
  })

  // 사용자 데이터 업데이트
  useEffect(() => {
    if (userData) {
      setUser(userData)
    }
  }, [userData])

  // 권한 계산 (메모이제이션)
  const permissions = useMemo<Permission>(() => {
    if (!user) {
      return DEFAULT_PERMISSIONS.viewer // 기본적으로 최소 권한
    }
    
    return DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.viewer
  }, [user])

  // 권한 확인 함수들
  const hasPermission = useCallback((permission: keyof Permission): boolean => {
    return permissions[permission]
  }, [permissions])

  const hasAnyPermission = useCallback((permissionList: (keyof Permission)[]): boolean => {
    return permissionList.some(permission => permissions[permission])
  }, [permissions])

  const hasAllPermissions = useCallback((permissionList: (keyof Permission)[]): boolean => {
    return permissionList.every(permission => permissions[permission])
  }, [permissions])

  // 역할 확인 함수들
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role
  }, [user])

  const hasMinimumRole = useCallback((minimumRole: UserRole): boolean => {
    if (!user) return false
    const userLevel = ROLE_HIERARCHY[user.role] || 0
    const minimumLevel = ROLE_HIERARCHY[minimumRole] || 0
    return userLevel >= minimumLevel
  }, [user])

  // 권한 새로고침
  const refreshPermissions = useCallback(async () => {
    await refetch()
  }, [refetch])

  // Context 값 최적화
  const contextValue = useMemo<PermissionsContextValue>(() => ({
    // 사용자 정보
    user,
    isLoading,
    error: error?.message || null,
    
    // 권한
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // 역할 확인
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',  
    isEditor: user?.role === 'editor',
    isViewer: user?.role === 'viewer',
    hasRole,
    hasMinimumRole,
    
    // 액션
    refreshPermissions,
  }), [
    user,
    isLoading,
    error,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasMinimumRole,
    refreshPermissions,
  ])

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  )
}

/**
 * 권한 Context 훅
 */
export function usePermissions() {
  const context = useContext(PermissionsContext)
  
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider')
  }
  
  return context
}

/**
 * 권한 확인 전용 훅
 * 특정 권한만 필요한 컴포넌트에서 사용하여 리렌더링 최소화
 */
export function usePermissionCheck(permission: keyof Permission) {
  const { hasPermission } = usePermissions()
  
  return useMemo(() => ({
    hasPermission: hasPermission(permission),
    permission
  }), [hasPermission, permission])
}

/**
 * 역할 확인 전용 훅
 */
export function useRole() {
  const { user, isAdmin, isManager, isEditor, isViewer, hasRole, hasMinimumRole } = usePermissions()
  
  return useMemo(() => ({
    currentRole: user?.role || null,
    isAdmin,
    isManager, 
    isEditor,
    isViewer,
    hasRole,
    hasMinimumRole
  }), [user?.role, isAdmin, isManager, isEditor, isViewer, hasRole, hasMinimumRole])
}

/**
 * 권한 기반 컴포넌트 렌더링 훅
 */
export function usePermissionGuard(
  requiredPermission: keyof Permission,
  fallback?: React.ReactNode
) {
  const { hasPermission } = usePermissions()
  const canAccess = hasPermission(requiredPermission)
  
  return useMemo(() => ({
    canAccess,
    renderIfAllowed: (children: React.ReactNode) => 
      canAccess ? children : fallback || null
  }), [canAccess, fallback])
}

/**
 * 역할 기반 컴포넌트 렌더링 훅
 */
export function useRoleGuard(
  minimumRole: UserRole,
  fallback?: React.ReactNode
) {
  const { hasMinimumRole } = usePermissions()
  const canAccess = hasMinimumRole(minimumRole)
  
  return useMemo(() => ({
    canAccess,
    renderIfAllowed: (children: React.ReactNode) =>
      canAccess ? children : fallback || null
  }), [canAccess, fallback])
}

/**
 * 권한 기반 조건부 렌더링 컴포넌트
 */
interface PermissionGuardProps {
  permission: keyof Permission
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({ permission, fallback, children }: PermissionGuardProps) {
  const { hasPermission } = usePermissions()
  
  if (!hasPermission(permission)) {
    return <>{fallback || null}</>
  }
  
  return <>{children}</>
}

/**
 * 역할 기반 조건부 렌더링 컴포넌트  
 */
interface RoleGuardProps {
  minimumRole: UserRole
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function RoleGuard({ minimumRole, fallback, children }: RoleGuardProps) {
  const { hasMinimumRole } = usePermissions()
  
  if (!hasMinimumRole(minimumRole)) {
    return <>{fallback || null}</>
  }
  
  return <>{children}</>
}