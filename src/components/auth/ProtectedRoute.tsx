import React, { useEffect, useState } from 'react'
import { useAuthState } from '@/hooks/useAuthState'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthRedirect } from '@/hooks/useAuthState'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { 
  AccessDenied, 
  NotAuthenticated, 
  EmailVerificationRequired,
  PermissionLoading 
} from './AccessDenied'
import type { UserRole, Permission } from '@/types/auth'

interface ProtectedRouteProps {
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
  
  // Redirect options
  redirectTo?: string
  redirectOnAuth?: string
  redirectOnDenied?: string
  
  // Fallback components
  loadingComponent?: React.ComponentType
  accessDeniedComponent?: React.ComponentType
  notAuthenticatedComponent?: React.ComponentType
  emailVerificationComponent?: React.ComponentType
  
  // Additional options
  checkProfile?: boolean
  allowIncompleteProfile?: boolean
  showLoadingOnInit?: boolean
}

/**
 * Protected route component that handles authentication and authorization
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  requireEmailVerification = true,
  allowedRoles,
  deniedRoles,
  requiredPermissions,
  requireAllPermissions = false,
  redirectTo,
  redirectOnAuth,
  redirectOnDenied,
  loadingComponent: LoadingComponent = PermissionLoading,
  accessDeniedComponent: AccessDeniedComponent = AccessDenied,
  notAuthenticatedComponent: NotAuthenticatedComponent = NotAuthenticated,
  emailVerificationComponent: EmailVerificationComponent = EmailVerificationRequired,
  checkProfile = true,
  allowIncompleteProfile = false,
  showLoadingOnInit = true
}: ProtectedRouteProps) {
  const {
    isAuthenticated,
    isInitialized,
    isLoading,
    hasUser,
    hasProfile,
    isEmailVerified,
    needsEmailVerification,
    userRole
  } = useAuthState()
  
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    isRole, 
    isAnyRole 
  } = usePermissions()
  
  const { getRedirectPath } = useAuthRedirect()
  const navigate = useNavigate()

  // Handle redirects
  useEffect(() => {
    if (!isInitialized) return

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && redirectOnAuth) {
      window.location.href = redirectOnAuth
      return
    }

    // Redirect unauthenticated users to sign in
    if (!isAuthenticated && requireAuth && redirectTo) {
      window.location.href = redirectTo
      return
    }
  }, [isAuthenticated, isInitialized, redirectTo, redirectOnAuth, requireAuth])

  // Show loading while initializing
  if (!isInitialized || (showLoadingOnInit && isLoading)) {
    return <LoadingComponent />
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    if (redirectTo) {
      window.location.href = redirectTo
      return <LoadingComponent />
    }
    return <NotAuthenticatedComponent />
  }

  // If not requiring auth and user is authenticated, check if should redirect
  if (!requireAuth && isAuthenticated) {
    if (redirectOnAuth) {
      window.location.href = redirectOnAuth
      return <LoadingComponent />
    }
    return <>{children}</>
  }

  // From here, user is authenticated (if required)
  if (!isAuthenticated && !requireAuth) {
    return <>{children}</>
  }

  // Check email verification
  if (requireEmailVerification && needsEmailVerification) {
    return <EmailVerificationComponent />
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
        window.location.href = redirectOnDenied
        return <LoadingComponent />
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
        window.location.href = redirectOnDenied
        return <LoadingComponent />
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
        window.location.href = redirectOnDenied
        return <LoadingComponent />
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
 * HOC for creating protected routes
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

/**
 * Specialized protected route components
 */

// Admin only route
export function AdminRoute({ 
  children, 
  ...props 
}: Omit<ProtectedRouteProps, 'allowedRoles'>) {
  return (
    <ProtectedRoute
      {...props}
      allowedRoles="administrator"
    >
      {children}
    </ProtectedRoute>
  )
}

// Social worker only route
export function SocialWorkerRoute({ 
  children, 
  ...props 
}: Omit<ProtectedRouteProps, 'allowedRoles'>) {
  return (
    <ProtectedRoute
      {...props}
      allowedRoles="social_worker"
    >
      {children}
    </ProtectedRoute>
  )
}

// Patient only route
export function PatientRoute({ 
  children, 
  ...props 
}: Omit<ProtectedRouteProps, 'allowedRoles'>) {
  return (
    <ProtectedRoute
      {...props}
      allowedRoles="patient"
    >
      {children}
    </ProtectedRoute>
  )
}

// Staff only route (admin or social worker)
export function StaffRoute({ 
  children, 
  ...props 
}: Omit<ProtectedRouteProps, 'allowedRoles'>) {
  return (
    <ProtectedRoute
      {...props}
      allowedRoles={['administrator', 'social_worker']}
    >
      {children}
    </ProtectedRoute>
  )
}

// Public route (no authentication required)
export function PublicRoute({ 
  children, 
  redirectOnAuth,
  ...props 
}: Omit<ProtectedRouteProps, 'requireAuth'>) {
  const { isAuthenticated, userRole } = useAuthState()
  const { getRedirectPath } = useAuthRedirect()

  const defaultRedirect = redirectOnAuth || getRedirectPath(userRole)

  return (
    <ProtectedRoute
      {...props}
      requireAuth={false}
      redirectOnAuth={defaultRedirect}
    >
      {children}
    </ProtectedRoute>
  )
}

// Guest route (only for unauthenticated users)
export function GuestRoute({ 
  children, 
  redirectOnAuth,
  ...props 
}: Omit<ProtectedRouteProps, 'requireAuth' | 'redirectOnAuth'>) {
  const { userRole } = useAuthState()
  const { getRedirectPath } = useAuthRedirect()

  const defaultRedirect = redirectOnAuth || getRedirectPath(userRole)

  return (
    <ProtectedRoute
      {...props}
      requireAuth={false}
      redirectOnAuth={defaultRedirect}
    >
      {children}
    </ProtectedRoute>
  )
}

/**
 * Route guard that checks multiple conditions
 */
interface RouteGuardProps extends ProtectedRouteProps {
  guards?: Array<{
    condition: boolean
    component: React.ComponentType
    redirect?: string
  }>
}

export function RouteGuard({ 
  children, 
  guards = [], 
  ...protectedRouteProps 
}: RouteGuardProps) {
  // Check custom guards first
  for (const guard of guards) {
    if (!guard.condition) {
      if (guard.redirect) {
        window.location.href = guard.redirect
        return <PermissionLoading />
      }
      return <guard.component />
    }
  }

  // Fall back to standard protected route logic
  return (
    <ProtectedRoute {...protectedRouteProps}>
      {children}
    </ProtectedRoute>
  )
}

/**
 * Conditional route wrapper
 */
interface ConditionalRouteProps {
  children: React.ReactNode
  condition: boolean
  fallback?: React.ReactNode
  redirect?: string
}

export function ConditionalRoute({
  children,
  condition,
  fallback = null,
  redirect
}: ConditionalRouteProps) {
  if (!condition) {
    if (redirect) {
      window.location.href = redirect
      return <PermissionLoading />
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Development-only route (only shows in development mode)
 */
export function DevRoute({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== 'development') {
    return (
      <AccessDenied
        title="개발 모드 전용"
        message="이 페이지는 개발 모드에서만 접근할 수 있습니다."
      />
    )
  }

  return <>{children}</>
}

/**
 * Maintenance mode route
 */
interface MaintenanceRouteProps {
  children: React.ReactNode
  isMaintenanceMode?: boolean
  maintenanceComponent?: React.ComponentType
  allowedRoles?: UserRole[]
}

export function MaintenanceRoute({
  children,
  isMaintenanceMode = false,
  maintenanceComponent: MaintenanceComponent,
  allowedRoles = ['administrator']
}: MaintenanceRouteProps) {
  const { isAnyRole } = usePermissions()

  if (isMaintenanceMode && !isAnyRole(allowedRoles)) {
    if (MaintenanceComponent) {
      return <MaintenanceComponent />
    }
    
    return (
      <AccessDenied
        title="시스템 점검 중"
        message="현재 시스템 점검이 진행 중입니다. 잠시 후 다시 시도해주세요."
        showActions={false}
      />
    )
  }

  return <>{children}</>
}

export function ProtectedRouteWithSupabase({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setIsAuthenticated(true)
        } else {
          navigate('/auth/login')
        }
      } catch {
        console.error("Error occurred")
        navigate('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setIsAuthenticated(false)
          navigate('/auth/login')
        } else if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // 리다이렉트 처리 중
  }

  return <>{children}</>
} 