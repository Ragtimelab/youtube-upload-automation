import { useContext, useMemo } from 'react'
import { PermissionsContext } from '@/types/permissions'
import type { Permission, UserRole } from '@/types/permissions'

/**
 * 권한 Context 훅
 * React Refresh 호환성을 위해 별도 파일로 분리
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
    renderIfAllowed: (_children: React.ReactNode) => 
      canAccess ? _children : fallback || null
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
    renderIfAllowed: (_children: React.ReactNode) =>
      canAccess ? _children : fallback || null
  }), [canAccess, fallback])
}