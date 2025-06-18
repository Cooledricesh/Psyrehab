/**
 * Legacy compatibility hooks for gradual migration to unified auth system
 * 
 * These hooks provide backward compatibility during the migration period.
 * Components can continue using their existing auth hooks while we gradually
 * migrate them to the new unified system.
 */

import { useMemo } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import type { UserProfile, AuthResult, SignUpUserData } from '@/types/auth';

// Legacy AuthContext compatibility
export function useLegacyAuth() {
  const unifiedAuth = useUnifiedAuth();

  return useMemo(() => ({
    // Direct mappings
    user: unifiedAuth.user,
    session: unifiedAuth.session,
    profile: unifiedAuth.profile,
    loading: unifiedAuth.loading,
    isAuthenticated: unifiedAuth.isAuthenticated,
    
    // Method mappings
    signIn: unifiedAuth.signIn,
    signUp: unifiedAuth.signUp,
    signOut: unifiedAuth.signOut,
    updateProfile: unifiedAuth.updateProfile,
    refreshUserData: unifiedAuth.refreshUserData,
    
    // Permission methods (for components that expect them)
    hasPermission: unifiedAuth.hasPermission,
    checkUserRole: unifiedAuth.isRole,
    
    // Additional legacy properties that might be expected
    initialized: unifiedAuth.initialized,
    role: unifiedAuth.role,
    permissions: unifiedAuth.permissions
  }), [unifiedAuth]);
}

// Legacy AdminAuthContext compatibility  
export function useLegacyAdminAuth() {
  const unifiedAuth = useUnifiedAuth();

  return useMemo(() => ({
    // Admin-specific properties
    user: unifiedAuth.user,
    session: unifiedAuth.session,
    profile: unifiedAuth.profile,
    loading: unifiedAuth.loading,
    isAuthenticated: unifiedAuth.isAuthenticated,
    isAdmin: unifiedAuth.isAdmin,
    adminLevel: unifiedAuth.adminLevel,
    
    // Admin methods
    signIn: unifiedAuth.signIn,
    signOut: unifiedAuth.signOut,
    checkAdminAccess: unifiedAuth.checkAdminAccess,
    getAdminLevel: unifiedAuth.getAdminLevel,
    
    // Permission methods
    hasPermission: unifiedAuth.hasPermission,
    hasAnyPermission: unifiedAuth.hasAnyPermission,
    hasAllPermissions: unifiedAuth.hasAllPermissions,
    
    // Legacy admin-specific methods that components might expect
    refreshAdminData: unifiedAuth.refreshUserData,
    updateAdminProfile: unifiedAuth.updateProfile,
    
    // State flags
    initialized: unifiedAuth.initialized,
    role: unifiedAuth.role,
    permissions: unifiedAuth.permissions
  }), [unifiedAuth]);
}

// Legacy AuthQueryContext compatibility
export function useLegacyAuthQueries() {
  const unifiedAuth = useUnifiedAuth();

  return useMemo(() => ({
    // Query-like interface
    auth: {
      user: unifiedAuth.user,
      session: unifiedAuth.session,
      profile: unifiedAuth.profile,
      isAuthenticated: unifiedAuth.isAuthenticated,
      loading: unifiedAuth.loading,
      error: null // Unified auth doesn't expose error state the same way
    },
    
    // Mutation-like methods
    mutations: {
      signIn: {
        mutateAsync: unifiedAuth.signIn,
        isLoading: unifiedAuth.loading
      },
      signUp: {
        mutateAsync: unifiedAuth.signUp,
        isLoading: unifiedAuth.loading
      },
      signOut: {
        mutateAsync: unifiedAuth.signOut,
        isLoading: unifiedAuth.loading
      },
      updateProfile: {
        mutateAsync: unifiedAuth.updateProfile,
        isLoading: unifiedAuth.loading
      },
      resetPassword: {
        mutateAsync: unifiedAuth.resetPassword,
        isLoading: unifiedAuth.loading
      }
    },
    
    // Query methods
    queries: {
      profile: {
        data: unifiedAuth.profile,
        isLoading: unifiedAuth.loading,
        refetch: unifiedAuth.refreshUserData
      },
      permissions: {
        data: unifiedAuth.permissions,
        isLoading: unifiedAuth.loading,
        refetch: unifiedAuth.refreshUserData
      }
    },
    
    // Utility methods
    invalidateAuth: unifiedAuth.refreshUserData,
    refetchUser: unifiedAuth.refreshUserData
  }), [unifiedAuth]);
}

// Legacy useAuthState compatibility
export function useLegacyAuthState() {
  const unifiedAuth = useUnifiedAuth();

  return useMemo(() => ({
    // State properties
    isAuthenticated: unifiedAuth.isAuthenticated,
    isLoading: unifiedAuth.loading,
    isInitialized: unifiedAuth.initialized,
    user: unifiedAuth.user,
    profile: unifiedAuth.profile,
    role: unifiedAuth.role,
    permissions: unifiedAuth.permissions,
    
    // Computed state
    isAdmin: unifiedAuth.isAdmin,
    isPatient: unifiedAuth.role === 'patient',
    isSocialWorker: unifiedAuth.role === 'social_worker',
    
    // Methods
    hasRole: unifiedAuth.isRole,
    hasPermission: unifiedAuth.hasPermission,
    hasAnyRole: unifiedAuth.isAnyRole,
    
    // State management
    refresh: unifiedAuth.refreshUserData
  }), [unifiedAuth]);
}

// Migration helper hook - provides info about which auth system is being used
export function useAuthMigrationStatus() {
  const unifiedAuth = useUnifiedAuth();
  
  return {
    isUsingUnifiedAuth: true,
    unifiedAuthVersion: '1.0.0',
    migrationComplete: true, // Set to false during migration period
    deprecationWarnings: {
      authContext: 'Use useUnifiedAuth() instead of useAuth()',
      adminAuthContext: 'Use useUnifiedAuth() instead of useAdminAuth()',
      authQueryContext: 'Use useUnifiedAuth() instead of useAuthQueries()',
      protectedRoute: 'Use UnifiedProtectedRoute instead of ProtectedRoute'
    }
  };
}

// Transition helpers for gradual migration
export function createLegacyAuthHook(hookName: string) {
  return function() {
    console.warn(`🔄 [Migration] ${hookName} is deprecated. Please migrate to useUnifiedAuth().`);
    return useUnifiedAuth();
  };
}

// Export legacy hooks with deprecation warnings
export const useAuthWithWarning = createLegacyAuthHook('useAuth');
export const useAdminAuthWithWarning = createLegacyAuthHook('useAdminAuth');
export const useAuthQueriesWithWarning = createLegacyAuthHook('useAuthQueries');
export const useAuthStateWithWarning = createLegacyAuthHook('useAuthState');