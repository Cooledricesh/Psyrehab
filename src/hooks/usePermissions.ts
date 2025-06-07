import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { 
  Permission, 
  UserRole, 
  UsePermissionsReturn 
} from '@/types/auth'
import { ROLE_PERMISSIONS } from '@/types/auth'

/**
 * Custom hook for managing user permissions
 * Provides utilities to check permissions and roles
 */
export function usePermissions(): UsePermissionsReturn {
  const { profile } = useAuth()

  // Get current user's permissions based on role
  const userPermissions = useMemo(() => {
    if (!profile?.role) return []
    return ROLE_PERMISSIONS[profile.role as UserRole] || []
  }, [profile?.role])

  // Check if user has a specific permission
  const hasPermission = useMemo(() => (permission: Permission): boolean => {
    return userPermissions.includes(permission)
  }, [userPermissions])

  // Check if user has any of the provided permissions
  const hasAnyPermission = useMemo(() => (permissions: Permission[]): boolean => {
    return permissions.some(permission => userPermissions.includes(permission))
  }, [userPermissions])

  // Check if user has all of the provided permissions
  const hasAllPermissions = useMemo(() => (permissions: Permission[]): boolean => {
    return permissions.every(permission => userPermissions.includes(permission))
  }, [userPermissions])

  // Check if user has a specific role
  const isRole = useMemo(() => (role: UserRole): boolean => {
    return profile?.role === role
  }, [profile?.role])

  // Check if user has any of the provided roles
  const isAnyRole = useMemo(() => (roles: UserRole[]): boolean => {
    return profile?.role ? roles.includes(profile.role as UserRole) : false
  }, [profile?.role])

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isRole,
    isAnyRole
  }
}

/**
 * Hook for checking if user is an administrator
 */
export function useIsAdmin(): boolean {
  const { isRole } = usePermissions()
  return isRole('administrator')
}

/**
 * Hook for checking if user is a social worker
 */
export function useIsSocialWorker(): boolean {
  const { isRole } = usePermissions()
  return isRole('social_worker')
}

/**
 * Hook for checking if user is a patient
 */
export function useIsPatient(): boolean {
  const { isRole } = usePermissions()
  return isRole('patient')
}

/**
 * Hook for checking if user is staff (admin or social worker)
 */
export function useIsStaff(): boolean {
  const { isAnyRole } = usePermissions()
  return isAnyRole(['administrator', 'social_worker'])
}

/**
 * Hook for getting user's role-based capabilities
 */
export function useUserCapabilities() {
  const { profile } = useAuth()
  const { hasPermission, isRole } = usePermissions()

  return useMemo(() => {
    if (!profile?.role) {
      return {
        canManageUsers: false,
        canManagePatients: false,
        canViewAnalytics: false,
        canManageGoals: false,
        canCreateAssessments: false,
        canManageServices: false,
        canViewAllData: false,
        canUpdateOwnProfile: false,
        role: null
      }
    }

    const capabilities = {
      role: profile.role,
      canUpdateOwnProfile: hasPermission('update_own_profile'),
      canViewOwnData: hasPermission('view_own_data'),
      canSubmitCheckIns: hasPermission('submit_check_ins'),
      canViewOwnGoals: hasPermission('view_own_goals'),
      canManageUsers: hasPermission('manage_users'),
      canManageSocialWorkers: hasPermission('manage_social_workers'),
      canManagePatients: hasPermission('manage_patients'),
      canViewAllData: hasPermission('view_all_data'),
      canManageSystemSettings: hasPermission('manage_system_settings'),
      canViewAnalytics: hasPermission('view_analytics'),
      canManageGoals: hasPermission('manage_goals'),
      canManageAssessments: hasPermission('manage_assessments'),
      canManageServices: hasPermission('manage_services'),
      canManageAssignedPatients: hasPermission('manage_assigned_patients'),
      canCreateGoals: hasPermission('create_goals'),
      canUpdateGoals: hasPermission('update_goals'),
      canViewPatientData: hasPermission('view_patient_data'),
      canCreateAssessments: hasPermission('create_assessments'),
      canViewOwnAnalytics: hasPermission('view_own_analytics')
    }

    // Role-specific shortcuts
    if (isRole('administrator')) {
      return {
        ...capabilities,
        isAdmin: true,
        isStaff: true,
        isClient: false
      }
    }

    if (isRole('social_worker')) {
      return {
        ...capabilities,
        isAdmin: false,
        isStaff: true,
        isClient: false
      }
    }

    if (isRole('patient')) {
      return {
        ...capabilities,
        isAdmin: false,
        isStaff: false,
        isClient: true
      }
    }

    return capabilities
  }, [profile?.role, hasPermission, isRole])
}

/**
 * Hook for permission-based conditional rendering
 */
export function useConditionalRender() {
  const { hasPermission, hasAnyPermission, isRole, isAnyRole } = usePermissions()

  return useMemo(() => ({
    // Render component only if user has permission
    withPermission: (permission: Permission, component: React.ReactNode, fallback?: React.ReactNode) => {
      return hasPermission(permission) ? component : (fallback || null)
    },

    // Render component only if user has any of the permissions
    withAnyPermission: (permissions: Permission[], component: React.ReactNode, fallback?: React.ReactNode) => {
      return hasAnyPermission(permissions) ? component : (fallback || null)
    },

    // Render component only if user has specific role
    withRole: (role: UserRole, component: React.ReactNode, fallback?: React.ReactNode) => {
      return isRole(role) ? component : (fallback || null)
    },

    // Render component only if user has any of the roles
    withAnyRole: (roles: UserRole[], component: React.ReactNode, fallback?: React.ReactNode) => {
      return isAnyRole(roles) ? component : (fallback || null)
    }
  }), [hasPermission, hasAnyPermission, isRole, isAnyRole])
}

/**
 * Hook for getting permission status with loading state
 */
export function usePermissionStatus(permission: Permission) {
  const { profile, loading, initialized } = useAuth()
  const { hasPermission } = usePermissions()

  return useMemo(() => ({
    hasPermission: initialized ? hasPermission(permission) : false,
    loading: loading || !initialized,
    denied: initialized && !hasPermission(permission),
    granted: initialized && hasPermission(permission)
  }), [permission, hasPermission, loading, initialized])
}

/**
 * Hook for getting role status with loading state
 */
export function useRoleStatus(role: UserRole) {
  const { profile, loading, initialized } = useAuth()
  const { isRole } = usePermissions()

  return useMemo(() => ({
    isRole: initialized ? isRole(role) : false,
    loading: loading || !initialized,
    matches: initialized && isRole(role),
    differs: initialized && !isRole(role)
  }), [role, isRole, loading, initialized])
} 