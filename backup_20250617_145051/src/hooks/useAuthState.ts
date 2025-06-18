import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole, AnyUserProfile } from '@/types/auth'
import { isSessionExpired, shouldRefreshToken } from '@/utils/auth'

/**
 * Hook for checking authentication state with utilities
 */
export function useAuthState() {
  const { user, session, profile, loading, initialized } = useAuth()

  return useMemo(() => ({
    // Basic states
    isAuthenticated: !!user && !!session,
    isLoading: loading || !initialized,
    isInitialized: initialized,
    
    // User states
    hasUser: !!user,
    hasProfile: !!profile,
    hasSession: !!session,
    
    // Email verification
    isEmailVerified: !!user?.email_confirmed_at,
    needsEmailVerification: !!user && !user.email_confirmed_at,
    
    // Profile completeness
    hasCompleteProfile: !!profile && !!profile.full_name,
    
    // Session validity
    isSessionValid: session ? !isSessionExpired(session.expires_at || 0) : false,
    needsTokenRefresh: session ? shouldRefreshToken(session.expires_at || 0) : false,
    
    // User info
    userEmail: user?.email || null,
    userId: user?.id || null,
    userRole: profile?.role || null,
    userName: profile?.full_name || null,
    
    // Ready states
    isReady: initialized && !loading,
    isAuthReady: initialized && !loading && !!user && !!session && !!profile
  }), [user, session, profile, loading, initialized])
}

/**
 * Hook for managing authentication loading states
 */
export function useAuthLoading() {
  const { loading, initialized } = useAuth()
  const [actionLoading, setActionLoading] = useState(false)

  const setLoading = (isLoading: boolean) => {
    setActionLoading(isLoading)
  }

  return useMemo(() => ({
    isInitializing: !initialized,
    isAuthLoading: loading,
    isActionLoading: actionLoading,
    isAnyLoading: loading || actionLoading || !initialized,
    setLoading
  }), [loading, initialized, actionLoading])
}

/**
 * Hook for user profile utilities
 */
export function useUserProfile() {
  const { profile, updateProfile } = useAuth()

  const getDisplayName = () => {
    if (!profile) return 'Unknown User'
    return profile.full_name || 'Unnamed User'
  }

  const getInitials = () => {
    const name = getDisplayName()
    if (name === 'Unknown User' || name === 'Unnamed User') return 'UU'
    
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleDisplayName = () => {
    if (!profile?.role) return '역할 없음'
    
    switch (profile.role) {
      case 'administrator':
        return '관리자'
      case 'social_worker':
        return '사회복지사'
      case 'patient':
        return '환자'
      default:
        return '알 수 없는 역할'
    }
  }

  const isProfileComplete = () => {
    if (!profile) return false
    
    // Basic requirements for all roles
    if (!profile.full_name) return false
    
    // Role-specific requirements
    switch (profile.role) {
      case 'social_worker':
        // Social workers should have employee_id and department
        return !!(profile as any).employee_id
      case 'patient':
        // Patients should have patient_identifier
        return !!(profile as any).patient_identifier
      case 'administrator':
        // Administrators are complete with just basic info
        return true
      default:
        return false
    }
  }

  const getMissingProfileFields = (): string[] => {
    if (!profile) return ['프로필 정보']
    
    const missing: string[] = []
    
    if (!profile.full_name) missing.push('이름')
    
    switch (profile.role) {
      case 'social_worker':
        if (!(profile as any).employee_id) missing.push('직원 번호')
        if (!(profile as any).department) missing.push('부서')
        if (!(profile as any).contact_number) missing.push('연락처')
        break
      case 'patient':
        if (!(profile as any).patient_identifier) missing.push('환자 식별번호')
        if (!(profile as any).date_of_birth) missing.push('생년월일')
        break
    }
    
    return missing
  }

  return useMemo(() => ({
    profile,
    displayName: getDisplayName(),
    initials: getInitials(),
    roleDisplayName: getRoleDisplayName(),
    isComplete: isProfileComplete(),
    missingFields: getMissingProfileFields(),
    updateProfile
  }), [profile, updateProfile])
}

/**
 * Hook for session management
 */
export function useSession() {
  const { session, refresh } = useAuth()
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const refreshSession = async () => {
    try {
      await refresh()
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to refresh session:', error)
    }
  }

  const sessionInfo = useMemo(() => {
    if (!session) {
      return {
        isValid: false,
        expiresAt: null,
        expiresIn: 0,
        needsRefresh: false,
        timeUntilExpiry: 0
      }
    }

    const expiresAt = new Date((session.expires_at || 0) * 1000)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    const expiresIn = Math.max(0, Math.floor(timeUntilExpiry / 1000))

    return {
      isValid: !isSessionExpired(session.expires_at || 0),
      expiresAt,
      expiresIn,
      needsRefresh: shouldRefreshToken(session.expires_at || 0),
      timeUntilExpiry: Math.max(0, timeUntilExpiry)
    }
  }, [session])

  // Auto-refresh session when needed
  useEffect(() => {
    if (sessionInfo.needsRefresh && sessionInfo.isValid) {
      refreshSession()
    }
  }, [sessionInfo.needsRefresh, sessionInfo.isValid])

  return useMemo(() => ({
    session,
    ...sessionInfo,
    lastRefresh,
    refreshSession
  }), [session, sessionInfo, lastRefresh])
}

/**
 * Hook for tracking user activity and idle state
 */
export function useUserActivity() {
  const [isIdle, setIsIdle] = useState(false)
  const [lastActivity, setLastActivity] = useState(new Date())
  const { signOut } = useAuth()

  const IDLE_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  const AUTO_LOGOUT_TIMEOUT = 60 * 60 * 1000 // 1 hour

  const updateActivity = () => {
    setLastActivity(new Date())
    setIsIdle(false)
  }

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const updateActivityWrapper = () => updateActivity()
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, updateActivityWrapper, true)
    })

    // Check for idle state
    const idleInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity.getTime()
      
      if (timeSinceLastActivity > IDLE_TIMEOUT && !isIdle) {
        setIsIdle(true)
      }
      
      // Auto logout after extended idle time
      if (timeSinceLastActivity > AUTO_LOGOUT_TIMEOUT) {
        signOut()
      }
    }, 60000) // Check every minute

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivityWrapper, true)
      })
      clearInterval(idleInterval)
    }
  }, [lastActivity, isIdle, signOut])

  return useMemo(() => ({
    isIdle,
    lastActivity,
    timeSinceLastActivity: Date.now() - lastActivity.getTime(),
    updateActivity
  }), [isIdle, lastActivity])
}

/**
 * Hook for online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

/**
 * Hook for auth redirects and navigation
 */
export function useAuthRedirect() {
  const { isAuthenticated, isInitialized } = useAuthState()

  const getRedirectPath = (userRole: UserRole | null): string => {
    if (!userRole) return '/auth/signin'
    
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

  const shouldRedirectToAuth = (currentPath: string): boolean => {
    const authPaths = ['/auth/signin', '/auth/signup', '/auth/reset-password']
    return !isAuthenticated && !authPaths.includes(currentPath) && isInitialized
  }

  const shouldRedirectFromAuth = (currentPath: string): boolean => {
    const authPaths = ['/auth/signin', '/auth/signup']
    return isAuthenticated && authPaths.includes(currentPath)
  }

  return {
    getRedirectPath,
    shouldRedirectToAuth,
    shouldRedirectFromAuth,
    isAuthenticated,
    isInitialized
  }
}

/**
 * Hook for authentication form state management
 */
export function useAuthForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setFieldError = (field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const clearFieldError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  const setFieldTouched = (field: string, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }))
  }

  const clearAllErrors = () => {
    setErrors({})
  }

  const resetForm = () => {
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }

  const hasErrors = Object.keys(errors).length > 0
  const isFieldTouched = (field: string) => touched[field] || false
  const getFieldError = (field: string) => errors[field] || ''

  return {
    errors,
    touched,
    isSubmitting,
    hasErrors,
    setFieldError,
    clearFieldError,
    setFieldTouched,
    clearAllErrors,
    resetForm,
    setIsSubmitting,
    isFieldTouched,
    getFieldError
  }
} 