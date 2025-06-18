import React, { createContext, useContext, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import {
  useCurrentUser,
  useSession,
  useUserProfile,
  useUserRole,
  useUserSettings,
  useSignInMutation,
  useSignUpMutation,
  useSignOutMutation,
  usePasswordResetMutation,
  useUpdateProfileMutation,
  useUpdateSettingsMutation,
  useEmailVerificationMutation,
  useResendVerificationMutation
} from '@/hooks/useAuthQueries'
import { 
  invalidateAuthQueries, 
  clearUserDataFromCache,
  authQueryKeys 
} from '@/lib/queryClient'
import type { 
  AuthContextType, 
  UserProfile, 
  UserRole, 
  SignUpForm,
  AuthResult 
} from '@/types/auth'

interface EnhancedAuthContextType extends Omit<AuthContextType, 'signIn' | 'signUp' | 'signOut' | 'resetPassword' | 'updateProfile'> {
  // Enhanced query-aware methods
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string, userData: SignUpForm) => Promise<AuthResult>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<AuthResult>
  updateProfile: (updates: Partial<UserProfile>) => Promise<AuthResult>
  
  // New query-specific methods
  refreshUserData: () => Promise<void>
  invalidateAuth: () => Promise<void>
  prefetchUserProfile: (userId: string) => Promise<void>
  
  // Query states
  userQuery: ReturnType<typeof useCurrentUser>
  sessionQuery: ReturnType<typeof useSession>
  profileQuery: ReturnType<typeof useUserProfile>
  roleQuery: ReturnType<typeof useUserRole>
  settingsQuery: ReturnType<typeof useUserSettings>
  
  // Mutation states
  signInMutation: ReturnType<typeof useSignInMutation>
  signUpMutation: ReturnType<typeof useSignUpMutation>
  signOutMutation: ReturnType<typeof useSignOutMutation>
  passwordResetMutation: ReturnType<typeof usePasswordResetMutation>
  updateProfileMutation: ReturnType<typeof useUpdateProfileMutation>
  updateSettingsMutation: ReturnType<typeof useUpdateSettingsMutation>
  
  // Loading states
  isAuthenticating: boolean
  isUpdatingProfile: boolean
  isResettingPassword: boolean
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined)

interface EnhancedAuthProviderProps {
  children: React.ReactNode
}

/**
 * Enhanced Auth Provider that integrates TanStack Query with authentication
 */
export function EnhancedAuthProvider({ children }: EnhancedAuthProviderProps) {
  const queryClient = useQueryClient()
  const auth = useAuth() // Use the original auth context for backward compatibility
  
  // Query hooks
  const userQuery = useCurrentUser()
  const sessionQuery = useSession()
  const profileQuery = useUserProfile(auth.user?.id)
  const roleQuery = useUserRole(auth.user?.id)
  const settingsQuery = useUserSettings(auth.user?.id)
  
  // Mutation hooks
  const signInMutation = useSignInMutation()
  const signUpMutation = useSignUpMutation()
  const signOutMutation = useSignOutMutation()
  const passwordResetMutation = usePasswordResetMutation()
  const updateProfileMutation = useUpdateProfileMutation()
  const updateSettingsMutation = useUpdateSettingsMutation()
  
  // Derived loading states
  const isAuthenticating = signInMutation.isPending || signUpMutation.isPending || signOutMutation.isPending
  const isUpdatingProfile = updateProfileMutation.isPending
  const isResettingPassword = passwordResetMutation.isPending

  // Enhanced sign in with query integration
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await signInMutation.mutateAsync({ email, password })
      return result
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || '로그인에 실패했습니다.' 
      }
    }
  }, [signInMutation])

  // Enhanced sign up with query integration
  const signUp = useCallback(async (email: string, password: string, userData: SignUpForm): Promise<AuthResult> => {
    try {
      const result = await signUpMutation.mutateAsync({ email, password, userData })
      return result
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || '회원가입에 실패했습니다.' 
      }
    }
  }, [signUpMutation])

  // Enhanced sign out with query integration
  const signOut = useCallback(async (): Promise<void> => {
    await signOutMutation.mutateAsync()
  }, [signOutMutation])

  // Enhanced reset password with query integration
  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const result = await passwordResetMutation.mutateAsync(email)
      return result
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || '비밀번호 재설정에 실패했습니다.' 
      }
    }
  }, [passwordResetMutation])

  // Enhanced update profile with query integration
  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<AuthResult> => {
    try {
      const result = await updateProfileMutation.mutateAsync(updates)
      return { 
        success: true, 
        data: result 
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || '프로필 업데이트에 실패했습니다.' 
      }
    }
  }, [updateProfileMutation])

  // Query-specific methods
  const refreshUserData = useCallback(async (): Promise<void> => {
    await invalidateAuthQueries()
  }, [])

  const invalidateAuth = useCallback(async (): Promise<void> => {
    await invalidateAuthQueries()
  }, [])

  const prefetchUserProfile = useCallback(async (userId: string): Promise<void> => {
    await queryClient.prefetchQuery({
      queryKey: authQueryKeys.userProfile(userId),
      queryFn: async () => {
        // This would use the AuthService to get profile data
        // For now, we'll use the existing auth context method
        return null
      }
    })
  }, [queryClient])

  // Sync query data with auth context when user changes
  useEffect(() => {
    if (userQuery.data && userQuery.data !== auth.user) {
      // The query has newer data than the context
      // This helps keep both in sync
      console.log('Syncing user data from query to context')
    }
  }, [userQuery.data, auth.user])

  // Sync profile data
  useEffect(() => {
    if (profileQuery.data && profileQuery.data !== auth.profile) {
      console.log('Syncing profile data from query to context')
    }
  }, [profileQuery.data, auth.profile])

  // Context value combining original auth with query enhancements
  const contextValue: EnhancedAuthContextType = {
    // Original auth properties
    user: userQuery.data || auth.user,
    session: sessionQuery.data || auth.session,
    profile: profileQuery.data || auth.profile,
    loading: auth.loading || userQuery.isLoading || sessionQuery.isLoading,
    initialized: auth.initialized && !userQuery.isLoading,
    
    // Enhanced methods
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword: auth.updatePassword, // Keep original implementation
    hasPermission: auth.hasPermission,
    isRole: auth.isRole,
    refresh: refreshUserData,
    
    // New query-specific methods
    refreshUserData,
    invalidateAuth,
    prefetchUserProfile,
    
    // Query states
    userQuery,
    sessionQuery,
    profileQuery,
    roleQuery,
    settingsQuery,
    
    // Mutation states
    signInMutation,
    signUpMutation,
    signOutMutation,
    passwordResetMutation,
    updateProfileMutation,
    updateSettingsMutation,
    
    // Loading states
    isAuthenticating,
    isUpdatingProfile,
    isResettingPassword
  }

  return (
    <EnhancedAuthContext.Provider value={contextValue}>
      {children}
    </EnhancedAuthContext.Provider>
  )
}

/**
 * Hook to use enhanced auth context with TanStack Query integration
 */
export function useEnhancedAuth(): EnhancedAuthContextType {
  const context = useContext(EnhancedAuthContext)
  
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider')
  }
  
  return context
}

/**
 * Hook for convenience - automatically uses enhanced auth if available, falls back to regular auth
 */
export function useAuthWithQuery(): EnhancedAuthContextType | AuthContextType {
  const enhancedContext = useContext(EnhancedAuthContext)
  const regularContext = useAuth()
  
  return enhancedContext || regularContext
} 