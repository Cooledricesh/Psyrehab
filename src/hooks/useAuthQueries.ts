import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { AuthService } from '@/services/auth'
import { supabase } from '@/lib/supabase'
import { 
  authQueryKeys, 
  authMutationKeys, 
  invalidateAuthQueries,
  clearUserDataFromCache 
} from '@/lib/queryClient'
import type { 
  User, 
  UserProfile, 
  UserRole, 
  SignUpForm,
  AuthResult 
} from '@/types/auth'

/**
 * Hook to get current user session with TanStack Query
 */
export function useCurrentUser() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: authQueryKeys.currentUser(),
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    },
    enabled: !!user, // Only run if user exists in auth context
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: false, // Don't refetch on mount if data exists
  })
}

/**
 * Hook to get current user's session
 */
export function useSession() {
  return useQuery({
    queryKey: authQueryKeys.session(),
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes (formerly cacheTime)
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to get user profile data
 */
export function useUserProfile(userId?: string) {
  const { user } = useAuth()
  const targetUserId = userId || user?.id
  
  return useQuery({
    queryKey: authQueryKeys.userProfile(targetUserId),
    queryFn: async () => {
      if (!targetUserId) throw new Error('User ID is required')
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()
      
      if (error) throw error
      return data as UserProfile
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (formerly cacheTime)
  })
}

/**
 * Hook to get user role and permissions
 */
export function useUserRole(userId?: string) {
  const { user } = useAuth()
  const targetUserId = userId || user?.id
  
  return useQuery({
    queryKey: authQueryKeys.userRole(targetUserId),
    queryFn: async () => {
      if (!targetUserId) throw new Error('User ID is required')
      
      const profile = await AuthService.getUserProfile(targetUserId)
      if (!profile.success || !profile.data) {
        throw new Error(profile.error || 'Failed to get user profile')
      }
      
      return {
        role: profile.data.role,
        permissions: AuthService.getRolePermissions(profile.data.role)
      }
    },
    enabled: !!targetUserId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes (formerly cacheTime)
  })
}

/**
 * Hook to get user permissions
 */
export function useUserPermissions(userId?: string) {
  const { user } = useAuth()
  const targetUserId = userId || user?.id
  
  return useQuery({
    queryKey: authQueryKeys.userPermissions(targetUserId),
    queryFn: async () => {
      if (!targetUserId) throw new Error('User ID is required')
      
      const hasPermission = await AuthService.hasPermission(targetUserId, 'read_own_profile')
      return {
        hasBasicAccess: hasPermission.success && hasPermission.data,
        // Add more specific permission checks as needed
      }
    },
    enabled: !!targetUserId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get user settings
 */
export function useUserSettings(userId?: string) {
  const { user } = useAuth()
  const targetUserId = userId || user?.id
  
  return useQuery({
    queryKey: authQueryKeys.userSettings(targetUserId),
    queryFn: async () => {
      if (!targetUserId) throw new Error('User ID is required')
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', targetUserId)
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }
      
      // Return default settings if no record exists
      return data || {
        user_id: targetUserId,
        notifications: {
          email: true,
          push: true,
          sms: false,
          weekly_reports: true,
          goal_reminders: true
        },
        display: {
          theme: 'light',
          language: 'ko',
          date_format: 'YYYY-MM-DD',
          compact_view: false
        },
        privacy: {
          profile_visibility: 'private',
          show_online_status: true,
          allow_data_collection: true
        },
        app: {
          auto_save: true,
          show_deletion_confirmation: true,
          show_tutorials: true,
          timezone: 'Asia/Seoul'
        }
      }
    },
    enabled: !!targetUserId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

// ==================== MUTATIONS ====================

/**
 * Hook for sign in mutation
 */
export function useSignInMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationKey: [authMutationKeys.signIn],
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await AuthService.signInWithPassword(email, password)
      if (!result.success) {
        throw new Error(result.error || 'Sign in failed')
      }
      return result
    },
    onSuccess: async (data) => {
      // Invalidate and refetch user data
      await invalidateAuthQueries()
      
      // Prefetch user profile if user ID is available
      if (data.data?.user?.id) {
        await queryClient.prefetchQuery({
          queryKey: authQueryKeys.userProfile(data.data.user.id),
          queryFn: async () => {
            const profile = await AuthService.getUserProfile(data.data.user.id)
            return profile.data
          }
        })
      }
    },
    onError: (error) => {
      console.error("Error occurred")
    }
  })
}

/**
 * Hook for sign up mutation
 */
export function useSignUpMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationKey: [authMutationKeys.signUp],
    mutationFn: async ({ email, password, userData }: { 
      email: string; 
      password: string; 
      userData: SignUpForm 
    }) => {
      const result = await AuthService.signUpWithPassword(email, password, userData)
      if (!result.success) {
        throw new Error(result.error || 'Sign up failed')
      }
      return result
    },
    onSuccess: async () => {
      // Clear any existing auth data
      clearUserDataFromCache()
    },
    onError: (error) => {
      console.error("Error occurred")
    }
  })
}

/**
 * Hook for sign out mutation
 */
export function useSignOutMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationKey: [authMutationKeys.signOut],
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    },
    onSuccess: async () => {
      // Clear all cached data
      clearUserDataFromCache()
      queryClient.clear()
    },
    onError: (error) => {
      console.error("Error occurred")
    }
  })
}

/**
 * Hook for password reset mutation
 */
export function usePasswordResetMutation() {
  return useMutation({
    mutationKey: [authMutationKeys.resetPassword],
    mutationFn: async (email: string) => {
      const result = await AuthService.resetPassword(email)
      if (!result.success) {
        throw new Error(result.error || 'Password reset failed')
      }
      return result
    },
    onError: (error) => {
      console.error("Error occurred")
    }
  })
}

/**
 * Hook for updating user profile
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationKey: [authMutationKeys.updateProfile],
    mutationFn: async (profileData: Partial<UserProfile>) => {
      if (!user?.id) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      // Update the profile in cache
      if (user?.id) {
        queryClient.setQueryData(
          authQueryKeys.userProfile(user.id),
          (oldData: UserProfile | undefined) => ({
            ...oldData,
            ...data
          })
        )
      }
    },
    onError: (error) => {
      console.error("Error occurred")
    }
  })
}

/**
 * Hook for updating user settings
 */
export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationKey: [authMutationKeys.updateSettings],
    mutationFn: async (settings: any) => {
      if (!user?.id) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Update settings in cache
      if (user?.id) {
        queryClient.setQueryData(authQueryKeys.userSettings(user.id), data)
      }
    },
    onError: (error) => {
      console.error("Error occurred")
    }
  })
}

/**
 * Hook for email verification
 */
export function useEmailVerificationMutation() {
  return useMutation({
    mutationKey: [authMutationKeys.verifyEmail],
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      })
      
      if (error) throw error
      return data
    },
    onSuccess: async () => {
      await invalidateAuthQueries()
    },
    onError: (error) => {
      console.error("Error occurred")
    }
  })
}

/**
 * Hook for resending email verification
 */
export function useResendVerificationMutation() {
  return useMutation({
    mutationKey: [authMutationKeys.resendVerification],
    mutationFn: async (email: string) => {
      const result = await AuthService.resendEmailConfirmation(email)
      if (!result.success) {
        throw new Error(result.error || 'Failed to resend verification')
      }
      return result
    },
    onError: (error) => {
      console.error("Error occurred")
    }
  })
} 