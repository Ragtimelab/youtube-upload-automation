import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import type { UserRole } from '@/types/permissions'

/**
 * 역할 기반 조건부 렌더링 컴포넌트  
 * React Refresh 호환성을 위해 별도 파일로 분리
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