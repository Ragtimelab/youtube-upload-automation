import { useMemo, useCallback, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import {
  PermissionsContext,
  DEFAULT_PERMISSIONS,
  ROLE_HIERARCHY,
  type UserRole,
  type Permission,
  type User,
  type PermissionsContextValue,
  type PermissionsProviderProps
} from '@/types/permissions'

/**
 * React 19 최적화된 전역 권한 관리 시스템
 * 사용자 권한에 따른 UI/UX 제어 및 보안 강화
 */


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
        const response = await api.get('/auth/me')
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

// 권한 관련 훅들과 컴포넌트들은 다음 위치로 분리됨:
// - 훅들: @/hooks/usePermissions
// - 컴포넌트들: @/components/guards