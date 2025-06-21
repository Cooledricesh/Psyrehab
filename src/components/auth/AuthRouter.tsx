import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthState } from '@/hooks/useAuthState'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  AccessDenied, 
  NotAuthenticated, 
  EmailVerificationRequired,
  PermissionLoading 
} from './AccessDenied'
import type { UserRole, Permission } from '@/types/auth'

interface AuthRouterProps {
  children: React.ReactNode
  
  // Authentication requirements
  requireAuth?: boolean
  requireEmailVerification?: boolean
  
  // Role-based access
  allowedRoles?: UserRole | UserRole[]
  deniedRoles?: UserRole | UserRole[]
  
  // Permission-based access
  requiredPermissions?: Permission | Permission[]
  requireAllPermissions?: boolean
  
  // Redirect options (React Router paths)
  redirectTo?: string
  redirectOnAuth?: string
  redirectOnDenied?: string
  
  // Fallback components
  loadingComponent?: React.ComponentType
  accessDeniedComponent?: React.ComponentType
  notAuthenticatedComponent?: React.ComponentType
  
  // Additional options
  checkProfile?: boolean
  preserveLocation?: boolean
}

/**
 * Auth router that works with React Router
 * Uses Navigate component instead of window.location
 */
export function AuthRouter({
  children,
  requireAuth = true,
  requireEmailVerification = true,
  allowedRoles,
  deniedRoles,
  requiredPermissions,
  requireAllPermissions = false,
  redirectTo = '/auth/signin',
  redirectOnAuth,
  redirectOnDenied,
  loadingComponent: LoadingComponent = PermissionLoading,
  accessDeniedComponent: AccessDeniedComponent = AccessDenied,
  checkProfile = true,
  preserveLocation = true
}: AuthRouterProps) {
  const location = useLocation()
  const {
    isAuthenticated,
    isInitialized,
    isLoading,
    hasProfile,
    needsEmailVerification
  } = useAuthState()
  
  const { 
    hasAnyPermission, 
    hasAllPermissions, 
    isAnyRole 
  } = usePermissions()

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return <LoadingComponent />
  }

  // Build redirect URL with current location
  const buildRedirectUrl = (baseUrl: string) => {
    if (!preserveLocation) return baseUrl
    return `${baseUrl}?redirect=${encodeURIComponent(location.pathname + location.search)}`
  }


  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={buildRedirectUrl(redirectTo)} replace />
  }

  // If not requiring auth and user is authenticated, check if should redirect
  if (!requireAuth && isAuthenticated && redirectOnAuth) {
    return <Navigate to={redirectOnAuth} replace />
  }

  // From here, user is authenticated (if required)
  if (!isAuthenticated && !requireAuth) {
    return <>{children}</>
  }

  // Check email verification
  if (requireEmailVerification && needsEmailVerification) {
    return <EmailVerificationRequired />
  }

  // Check profile requirements
  if (checkProfile && !hasProfile) {
    return (
      <AccessDeniedComponent 
        title="프로필 정보 없음"
        message="사용자 프로필 정보가 없습니다. 관리자에게 문의하세요."
      />
    )
  }

  // Check denied roles first
  if (deniedRoles) {
    const deniedRoleArray = Array.isArray(deniedRoles) ? deniedRoles : [deniedRoles]
    if (isAnyRole(deniedRoleArray)) {
      if (redirectOnDenied) {
        return <Navigate to={redirectOnDenied} replace />
      }
      return (
        <AccessDeniedComponent 
          title="접근 제한됨"
          message="현재 역할로는 이 페이지에 접근할 수 없습니다."
        />
      )
    }
  }

  // Check allowed roles
  if (allowedRoles) {
    const allowedRoleArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    if (!isAnyRole(allowedRoleArray)) {
      if (redirectOnDenied) {
        return <Navigate to={redirectOnDenied} replace />
      }
      return (
        <AccessDeniedComponent 
          title="권한 부족"
          message={`이 페이지는 ${allowedRoleArray.map(role => 
            role === 'administrator' ? '관리자' :
            role === 'social_worker' ? '사회복지사' :
            role === 'patient' ? '환자' : role
          ).join(', ')}만 접근할 수 있습니다.`}
        />
      )
    }
  }

  // Check required permissions
  if (requiredPermissions) {
    const permissionArray = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
    
    const hasRequiredPermissions = requireAllPermissions
      ? hasAllPermissions(permissionArray)
      : hasAnyPermission(permissionArray)

    if (!hasRequiredPermissions) {
      if (redirectOnDenied) {
        return <Navigate to={redirectOnDenied} replace />
      }
      return (
        <AccessDeniedComponent 
          title="권한 부족"
          message="이 페이지에 접근하기 위한 권한이 없습니다."
        />
      )
    }
  }

  // All checks passed
  return <>{children}</>
}

/**
 * Specialized router components for React Router
 */

// Admin only router
export function AdminRouter({ children, ...props }: Omit<AuthRouterProps, 'allowedRoles'>) {
  return (
    <AuthRouter {...props} allowedRoles="administrator">
      {children}
    </AuthRouter>
  )
}

// Social worker only router
export function SocialWorkerRouter({ children, ...props }: Omit<AuthRouterProps, 'allowedRoles'>) {
  return (
    <AuthRouter {...props} allowedRoles="social_worker">
      {children}
    </AuthRouter>
  )
}

// Patient only router
export function PatientRouter({ children, ...props }: Omit<AuthRouterProps, 'allowedRoles'>) {
  return (
    <AuthRouter {...props} allowedRoles="patient">
      {children}
    </AuthRouter>
  )
}

// Staff only router (admin or social worker)
export function StaffRouter({ children, ...props }: Omit<AuthRouterProps, 'allowedRoles'>) {
  return (
    <AuthRouter {...props} allowedRoles={['administrator', 'social_worker']}>
      {children}
    </AuthRouter>
  )
}

// Public router (no authentication required)
export function PublicRouter({ 
  children, 
  redirectOnAuth,
  ...props 
}: Omit<AuthRouterProps, 'requireAuth'>) {
  const { userRole } = useAuthState()

  const defaultRedirect = redirectOnAuth || (() => {
    switch (userRole) {
      case 'administrator':
        return '/admin/dashboard'
      case 'social_worker':
        return '/social-worker/dashboard'
      case 'patient':
        return '/patient/dashboard'
      default:
        return '/dashboard'
    }
  })()

  return (
    <AuthRouter
      {...props}
      requireAuth={false}
      redirectOnAuth={defaultRedirect}
    >
      {children}
    </AuthRouter>
  )
}

// Guest router (only for unauthenticated users)
export function GuestRouter({ 
  children, 
  redirectOnAuth = '/dashboard',
  ...props 
}: Omit<AuthRouterProps, 'requireAuth' | 'redirectOnAuth'>) {
  return (
    <AuthRouter
      {...props}
      requireAuth={false}
      redirectOnAuth={redirectOnAuth}
    >
      {children}
    </AuthRouter>
  )
}

/**
 * Auth redirect handler for handling login redirects
 */
export function AuthRedirectHandler() {
  const location = useLocation()
  const { isAuthenticated, userRole } = useAuthState()

  // Get redirect URL from query params
  const searchParams = new URLSearchParams(location.search)
  const redirectTo = searchParams.get('redirect')

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />
  }

  // If there's a redirect URL, go there
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />
  }

  // Otherwise, redirect to role-based dashboard
  const defaultRedirect = (() => {
    switch (userRole) {
      case 'administrator':
        return '/admin/dashboard'
      case 'social_worker':
        return '/social-worker/dashboard'
      case 'patient':
        return '/patient/dashboard'
      default:
        return '/dashboard'
    }
  })()

  return <Navigate to={defaultRedirect} replace />
}

/**
 * Auto-redirect component for root path
 */
export function RootRedirect() {
  const { isAuthenticated, userRole } = useAuthState()

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />
  }

  const redirectTo = (() => {
    switch (userRole) {
      case 'administrator':
        return '/admin/dashboard'
      case 'social_worker':
        return '/social-worker/dashboard'
      case 'patient':
        return '/patient/dashboard'
      default:
        return '/dashboard'
    }
  })()

  return <Navigate to={redirectTo} replace />
}

/**
 * Hook for programmatic navigation with auth checks
 */
export function useAuthNavigation() {
  const { isAuthenticated, userRole } = useAuthState()
  const { isAnyRole, hasAnyPermission } = usePermissions()

  const canNavigateTo = (
    path: string,
    options?: {
      roles?: UserRole[]
      permissions?: Permission[]
      requireAuth?: boolean
    }
  ): boolean => {
    const { roles, permissions, requireAuth = true } = options || {}

    // Check authentication
    if (requireAuth && !isAuthenticated) {
      return false
    }

    // Check roles
    if (roles && !isAnyRole(roles)) {
      return false
    }

    // Check permissions
    if (permissions && !hasAnyPermission(permissions)) {
      return false
    }

    return true
  }

  const getDefaultDashboard = (): string => {
    switch (userRole) {
      case 'administrator':
        return '/admin/dashboard'
      case 'social_worker':
        return '/social-worker/dashboard'
      case 'patient':
        return '/patient/dashboard'
      default:
        return '/dashboard'
    }
  }

  const buildAuthUrl = (path: string, currentPath?: string): string => {
    if (currentPath) {
      return `/auth/signin?redirect=${encodeURIComponent(currentPath)}`
    }
    return '/auth/signin'
  }

  return {
    canNavigateTo,
    getDefaultDashboard,
    buildAuthUrl,
    isAuthenticated,
    userRole
  }
}

/**
 * Component for handling 404 errors with auth context
 */
export function NotFoundWithAuth() {
  const { isAuthenticated } = useAuthState()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* 404 Icon */}
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-3-8a9 9 0 110 18 9 9 0 010-18z" />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">페이지를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>

          <div className="space-y-3">
            {isAuthenticated ? (
              <AuthRedirectHandler />
            ) : (
              <div className="flex space-x-3">
                <Navigate to="/auth/signin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 