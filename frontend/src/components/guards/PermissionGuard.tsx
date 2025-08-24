import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import type { Permission } from '@/types/permissions'

/**
 * 권한 기반 조건부 렌더링 컴포넌트
 * React Refresh 호환성을 위해 별도 파일로 분리
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