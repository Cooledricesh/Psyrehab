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
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string, userData: SignUpForm) => Promise<AuthResult>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<AuthResult>
  updateProfile: (updates: Partial<UserProfile>) => Promise<AuthResult>
  
  refreshUserData: () => Promise<void>
  invalidateAuth: () => Promise<void>
  prefetchUserProfile: (userId: string) => Promise<void>
  
  userQuery: ReturnType<typeof useCurrentUser>
  sessionQuery: ReturnType<typeof useSession>
  profileQuery: ReturnType<typeof useUserProfile>
  roleQuery: ReturnType<typeof useUserRole>
  settingsQuery: ReturnType<typeof useUserSettings>
  
  signInMutation: ReturnType<typeof useSignInMutation>
  signUpMutation: ReturnType<typeof useSignUpMutation>
  signOutMutation: ReturnType<typeof useSignOutMutation>
  passwordResetMutation: ReturnType<typeof usePasswordResetMutation>
  updateProfileMutation: ReturnType<typeof useUpdateProfileMutation>
  updateSettingsMutation: ReturnType<typeof useUpdateSettingsMutation>
  
  isAuthenticating: boolean
  isUpdatingProfile: boolean
  isResettingPassword: boolean
}


interface EnhancedAuthProviderProps {
  children: React.ReactNode
}

/**
 * Enhanced Auth Provider that integrates TanStack Query with authentication
 */
export function EnhancedAuthProvider({ children }: EnhancedAuthProviderProps) {
  
  
  

    try {
      return result
    } catch (error: unknown) {
      return { 
        success: false, 
        error: error.message || '로그인에 실패했습니다.' 
      }
    }
  }, [signInMutation])

    try {
      return result
    } catch (error: unknown) {
      return { 
        success: false, 
        error: error.message || '회원가입에 실패했습니다.' 
      }
    }
  }, [signUpMutation])

    await signOutMutation.mutateAsync()
  }, [signOutMutation])

    try {
      return result
    } catch (error: unknown) {
      return { 
        success: false, 
        error: error.message || '비밀번호 재설정에 실패했습니다.' 
      }
    }
  }, [passwordResetMutation])

    try {
      return { 
        success: true, 
        data: result 
      }
    } catch (error: unknown) {
      return { 
        success: false, 
        error: error.message || '프로필 업데이트에 실패했습니다.' 
      }
    }
  }, [updateProfileMutation])

    await invalidateAuthQueries()
  }, [])

    await invalidateAuthQueries()
  }, [])

    await queryClient.prefetchQuery({
      queryKey: authQueryKeys.userProfile(userId),
      queryFn: async () => {
        return null
      }
    })
  }, [queryClient])

  useEffect(() => {
    if (userQuery.data && userQuery.data !== auth.user) {
      console.log('Syncing user data from query to context')
    }
  }, [userQuery.data, auth.user])

  useEffect(() => {
    if (profileQuery.data && profileQuery.data !== auth.profile) {
      console.log('Syncing profile data from query to context')
    }
  }, [profileQuery.data, auth.profile])

  const contextValue: EnhancedAuthContextType = {
    user: userQuery.data || auth.user,
    session: sessionQuery.data || auth.session,
    profile: profileQuery.data || auth.profile,
    loading: auth.loading || userQuery.isLoading || sessionQuery.isLoading,
    initialized: auth.initialized && !userQuery.isLoading,
    
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword: auth.updatePassword, // Keep original implementation
    hasPermission: auth.hasPermission,
    isRole: auth.isRole,
    refresh: refreshUserData,
    
    refreshUserData,
    invalidateAuth,
    prefetchUserProfile,
    
    userQuery,
    sessionQuery,
    profileQuery,
    roleQuery,
    settingsQuery,
    
    signInMutation,
    signUpMutation,
    signOutMutation,
    passwordResetMutation,
    updateProfileMutation,
    updateSettingsMutation,
    
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
  
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider')
  }
  
  return context
}

/**
 * Hook for convenience - automatically uses enhanced auth if available, falls back to regular auth
 */
export function useAuthWithQuery(): EnhancedAuthContextType | AuthContextType {
  
  return enhancedContext || regularContext
} 