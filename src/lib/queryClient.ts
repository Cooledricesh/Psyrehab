import { QueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { AuthError } from '@supabase/supabase-js'
import { handleApiError } from '@/utils/error-handler'

/**
 * Authentication-aware query client configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time for authentication queries
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Cache time for user data
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry configuration for authentication
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (isAuthError(error)) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      // Refetch on window focus for critical auth data
      refetchOnWindowFocus: (query) => {
        // Only refetch user session and profile data on focus
        return query.queryKey[0] === 'auth' || query.queryKey[0] === 'user'
      },
      // Network error handling
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry configuration for mutations
      retry: (failureCount, error) => {
        // Don't retry auth mutations on client errors
        if (isAuthError(error) || isClientError(error)) {
          return false
        }
        return failureCount < 2
      },
      // Global error handling for mutations
      onError: (error) => {
        handleApiError(error, 'queryClient.mutations.onError')
        
        // Handle authentication errors globally
        if (isAuthError(error)) {
          handleAuthError(error)
        }
      },
    },
  },
})

/**
 * Check if error is an authentication error
 */
function isAuthError(error: unknown): boolean {
  if (error instanceof AuthError) {
    return true
  }
  
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as unknown).status
    return status === 401 || status === 403
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as unknown).message?.toLowerCase() || ''
    return message.includes('unauthorized') || 
           message.includes('forbidden') || 
           message.includes('invalid token') ||
           message.includes('token expired') ||
           message.includes('session expired')
  }
  
  return false
}

/**
 * Check if error is a client error (4xx)
 */
function isClientError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as unknown).status
    return status >= 400 && status < 500
  }
  return false
}

/**
 * Handle authentication errors globally
 */
async function handleAuthError(error: unknown) {
  console.warn('Authentication error detected:', error)
  
  try {
    // Clear invalid session
    await supabase.auth.signOut()
    
    // Invalidate all auth-related queries
    queryClient.invalidateQueries({ queryKey: ['auth'] })
    queryClient.invalidateQueries({ queryKey: ['user'] })
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    
    // Clear user-specific cached data
    queryClient.removeQueries({ 
      predicate: (query) => {
        const key = query.queryKey[0]
        return typeof key === 'string' && (
          key.includes('user') || 
          key.includes('profile') || 
          key.includes('auth')
        )
      }
    })
    
    // Redirect to sign in (this would typically be handled by the auth context)
    // window.location.href = '/auth/signin'
  } catch (cleanupError) {
    handleApiError(cleanupError, 'queryClient.handleAuthError.cleanup')
  }
}

/**
 * Query keys for authentication-related queries
 */
export const authQueryKeys = {
  // Base keys
  auth: ['auth'] as const,
  user: ['user'] as const,
  profile: ['profile'] as const,
  
  // Specific keys
  session: () => ['auth', 'session'] as const,
  currentUser: () => ['auth', 'current-user'] as const,
  userProfile: (userId?: string) => ['profile', 'user', userId] as const,
  userRole: (userId?: string) => ['auth', 'role', userId] as const,
  userPermissions: (userId?: string) => ['auth', 'permissions', userId] as const,
  
  // Settings and preferences
  userSettings: (userId?: string) => ['user', 'settings', userId] as const,
  userPreferences: (userId?: string) => ['user', 'preferences', userId] as const,
  
  // Role-specific queries
  adminData: () => ['auth', 'admin-data'] as const,
  socialWorkerData: (workerId?: string) => ['auth', 'social-worker', workerId] as const,
  patientData: (patientId?: string) => ['auth', 'patient', patientId] as const,
} as const

/**
 * Mutation keys for authentication-related mutations
 */
export const authMutationKeys = {
  signIn: 'auth-signin',
  signUp: 'auth-signup',
  signOut: 'auth-signout',
  resetPassword: 'auth-reset-password',
  updatePassword: 'auth-update-password',
  updateProfile: 'auth-update-profile',
  updateSettings: 'user-update-settings',
  verifyEmail: 'auth-verify-email',
  resendVerification: 'auth-resend-verification',
} as const

/**
 * Utility function to invalidate auth queries
 */
export async function invalidateAuthQueries() {
  await queryClient.invalidateQueries({ queryKey: authQueryKeys.auth })
  await queryClient.invalidateQueries({ queryKey: authQueryKeys.user })
  await queryClient.invalidateQueries({ queryKey: authQueryKeys.profile })
}

/**
 * Utility function to clear user data from cache
 */
export function clearUserDataFromCache() {
  queryClient.removeQueries({ queryKey: authQueryKeys.user })
  queryClient.removeQueries({ queryKey: authQueryKeys.profile })
  queryClient.removeQueries({ queryKey: authQueryKeys.auth })
}

/**
 * Utility function to prefetch user data
 */
export async function prefetchUserData() {
  // This would be implemented with actual query functions
  // await queryClient.prefetchQuery({
  //   queryKey: authQueryKeys.userProfile(userId),
  //   queryFn: () => getUserProfile(userId)
  // })
}

/**
 * Check if user data is cached
 */
export function isUserDataCached(userId: string): boolean {
  const profileData = queryClient.getQueryData(authQueryKeys.userProfile(userId))
  const userData = queryClient.getQueryData(authQueryKeys.currentUser())
  return !!(profileData && userData)
} 