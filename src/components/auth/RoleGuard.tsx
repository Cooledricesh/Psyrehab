import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthState } from '@/hooks/useAuthState'
import type { UserRole, Permission } from '@/types/auth'

interface RoleGuardProps {
  children: React.ReactNode
  roles?: UserRole | UserRole[]
  permissions?: Permission | Permission[]
  fallback?: React.ReactNode
  requireAll?: boolean // For multiple permissions, require all or any
  allowedRoles?: UserRole[]
  deniedRoles?: UserRole[]
  showFallback?: boolean
}

/**
 * Role-based access control component
 * Conditionally renders children based on user roles and permissions
 */
export function RoleGuard({
  children,
  roles,
  permissions,
  fallback = null,
  requireAll = false,
  allowedRoles,
  deniedRoles,
  showFallback = true
}: RoleGuardProps) {
  const { hasPermission: _hasPermission, hasAnyPermission, hasAllPermissions, isRole: _isRole, isAnyRole } = usePermissions()
  const { isAuthenticated, isInitialized } = useAuthState()

  // Don't render anything while auth is initializing
  if (!isInitialized) {
    return null
  }

  // User must be authenticated
  if (!isAuthenticated) {
    return showFallback ? fallback : null
  }

  // Check denied roles first
  if (deniedRoles && deniedRoles.length > 0) {
    if (isAnyRole(deniedRoles)) {
      return showFallback ? fallback : null
    }
  }

  // Check allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    if (!isAnyRole(allowedRoles)) {
      return showFallback ? fallback : null
    }
  }

  // Check specific roles
  if (roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles]
    if (!isAnyRole(roleArray)) {
      return showFallback ? fallback : null
    }
  }

  // Check permissions
  if (permissions) {
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
    
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissionArray)
      : hasAnyPermission(permissionArray)

    if (!hasRequiredPermissions) {
      return showFallback ? fallback : null
    }
  }

  // All checks passed, render children
  return <>{children}</>
}

/**
 * Component that only renders for administrators
 */
export function AdminOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard roles="administrator" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Component that only renders for social workers
 */
export function SocialWorkerOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard roles="social_worker" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Component that only renders for patients
 */
export function PatientOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard roles="patient" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Component that only renders for staff (admin or social worker)
 */
export function StaffOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard roles={['administrator', 'social_worker']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Component that renders different content based on user role
 */
interface RoleSwitchProps {
  adminContent?: React.ReactNode
  socialWorkerContent?: React.ReactNode
  patientContent?: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleSwitch({
  adminContent,
  socialWorkerContent,
  patientContent,
  fallback = null
}: RoleSwitchProps) {
  const { isRole } = usePermissions()
  const { isAuthenticated, isInitialized } = useAuthState()

  if (!isInitialized || !isAuthenticated) {
    return <>{fallback}</>
  }

  if (isRole('administrator') && adminContent) {
    return <>{adminContent}</>
  }

  if (isRole('social_worker') && socialWorkerContent) {
    return <>{socialWorkerContent}</>
  }

  if (isRole('patient') && patientContent) {
    return <>{patientContent}</>
  }

  return <>{fallback}</>
}

/**
 * Permission-based rendering component
 */
interface PermissionGuardProps {
  children: React.ReactNode
  permission: Permission | Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
  showFallback?: boolean
}

export function PermissionGuard({
  children,
  permission,
  requireAll = false,
  fallback = null,
  showFallback = true
}: PermissionGuardProps) {
  return (
    <RoleGuard 
      permissions={permission}
      requireAll={requireAll}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  )
}

/**
 * Component that conditionally renders based on authentication state
 */
interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  fallback?: React.ReactNode
}

export function AuthGuard({
  children,
  requireAuth = true,
  fallback = null
}: AuthGuardProps) {
  const { isAuthenticated, isInitialized } = useAuthState()

  if (!isInitialized) {
    return null
  }

  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>
  }

  if (!requireAuth && isAuthenticated) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * HOC for role-based access control
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    roles?: UserRole | UserRole[]
    permissions?: Permission | Permission[]
    requireAll?: boolean
    fallback?: React.ComponentType<unknown>
  }
) {
  return function GuardedComponent(props: P) {
    const FallbackComponent = options.fallback

    return (
      <RoleGuard 
        roles={options.roles}
        permissions={options.permissions}
        requireAll={options.requireAll}
        fallback={FallbackComponent ? <FallbackComponent /> : null}
      >
        <Component {...props} />
      </RoleGuard>
    )
  }
}

/**
 * HOC for permission-based access control
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission | Permission[],
  options?: {
    requireAll?: boolean
    fallback?: React.ComponentType<unknown>
  }
) {
  return function PermissionGuardedComponent(props: P) {
    const FallbackComponent = options?.fallback

    return (
      <PermissionGuard 
        permission={permission}
        requireAll={options?.requireAll}
        fallback={FallbackComponent ? <FallbackComponent /> : null}
      >
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

/**
 * Utility component for debugging permissions
 */
export function PermissionDebugger() {
  const { profile } = useAuthState()
  const capabilities = usePermissions()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Debug Info</h4>
      <p><strong>Role:</strong> {profile?.role || 'None'}</p>
      <p><strong>User:</strong> {profile?.full_name || 'Unknown'}</p>
      <p><strong>Permissions:</strong></p>
      <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '200px' }}>
        {JSON.stringify(capabilities, null, 2)}
      </pre>
    </div>
  )
} 