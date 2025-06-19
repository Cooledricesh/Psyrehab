import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import type { 
  AuthContextType, 
  AuthState, 
  AuthAction, 
  AnyUserProfile, 
  UserRole, 
  Permission 
} from '@/types/auth'
import { 
  AuthService, 
  onAuthStateChange, 
  getCurrentUser, 
  getCurrentSession,
  getUserProfile,
  checkUserPermission
} from '@/services/auth'
import { setupAuthListeners, supabase } from '@/lib/supabase'
import { ROLE_PERMISSIONS } from '@/types/auth'

// Initial auth state
const initialAuthState: AuthState = {
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false
}

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_USER':
      return { ...state, user: action.payload }
    
    case 'SET_SESSION':
      return { ...state, session: action.payload }
    
    case 'SET_PROFILE':
      return { ...state, profile: action.payload }
    
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload, loading: false }
    
    case 'RESET':
      return { ...initialAuthState, initialized: true, loading: false }
    
    default:
      return state
  }
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider props
interface AuthProviderProps {
  children: React.ReactNode
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      // Get current session
      const session = await getCurrentSession()
      dispatch({ type: 'SET_SESSION', payload: session })

      if (session?.user) {
        dispatch({ type: 'SET_USER', payload: session.user })

        // Get user profile
        const profile = await getUserProfile(session.user.id)
        dispatch({ type: 'SET_PROFILE', payload: profile })
      }
    } catch {
      console.error("Error occurred")
    } finally {
      dispatch({ type: 'SET_INITIALIZED', payload: true })
    }
  }, [])

  // Refresh auth state
  const refresh = useCallback(async () => {
    try {
      const session = await getCurrentSession()
      dispatch({ type: 'SET_SESSION', payload: session })

      if (session?.user) {
        dispatch({ type: 'SET_USER', payload: session.user })
        
        const profile = await getUserProfile(session.user.id)
        dispatch({ type: 'SET_PROFILE', payload: profile })
      } else {
        dispatch({ type: 'SET_USER', payload: null })
        dispatch({ type: 'SET_PROFILE', payload: null })
      }
    } catch {
      console.error("Error occurred")
    }
  }, [])

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      const result = await AuthService.signIn({ email, password })
      
      if (result.success && result.user && result.session) {
        dispatch({ type: 'SET_USER', payload: result.user })
        dispatch({ type: 'SET_SESSION', payload: result.session })
        dispatch({ type: 'SET_PROFILE', payload: result.profile || null })
        
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error: any) {
      return { success: false, error: error.message || '로그인 중 오류가 발생했습니다.' }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  // Sign up
  const signUp = useCallback(async (email: string, password: string, userData: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      const result = await AuthService.signUp({
        email,
        password,
        confirmPassword: password,
        full_name: userData.full_name,
        role: userData.role,
        ...userData
      })

      if (result.success) {
        if (result.requiresEmailConfirmation) {
          return { 
            success: true, 
            requiresEmailConfirmation: true,
            message: '이메일 확인이 필요합니다. 이메일을 확인해주세요.'
          }
        } else if (result.user) {
          // Auto sign in after successful signup
          const signInResult = await signIn(email, password)
          return signInResult
        }
      }

      return { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: error.message || '회원가입 중 오류가 발생했습니다.' }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [signIn])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      await AuthService.signOut()
      
      // Reset state
      dispatch({ type: 'RESET' })
    } catch {
      console.error("Error occurred")
      // Reset state even if sign out fails
      dispatch({ type: 'RESET' })
    }
  }, [])

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      const result = await AuthService.resetPassword(email)
      return result
    } catch (error: any) {
      return { success: false, error: error.message || '비밀번호 재설정 중 오류가 발생했습니다.' }
    }
  }, [])

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<AnyUserProfile>) => {
    try {
      if (!state.user?.id) {
        return { success: false, error: '사용자 정보를 찾을 수 없습니다.' }
      }

      dispatch({ type: 'SET_LOADING', payload: true })

      const result = await AuthService.updateProfile(state.user.id, updates)
      
      if (result.success && result.profile) {
        dispatch({ type: 'SET_PROFILE', payload: result.profile })
        return { success: true, profile: result.profile }
      }

      return { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: error.message || '프로필 업데이트 중 오류가 발생했습니다.' }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [state.user?.id])

  // Update password
  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      const result = await AuthService.updatePassword(currentPassword, newPassword)
      return result
    } catch (error: any) {
      return { success: false, error: error.message || '비밀번호 변경 중 오류가 발생했습니다.' }
    }
  }, [])

  // Check permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.profile?.role) {
      return false
    }

    const rolePermissions = ROLE_PERMISSIONS[state.profile.role as UserRole] || []
    return rolePermissions.includes(permission as Permission)
  }, [state.profile?.role])

  // Check role
  const isRole = useCallback((role: UserRole): boolean => {
    return state.profile?.role === role
  }, [state.profile?.role])

  // Setup auth listeners on mount
  useEffect(() => {
    let mounted = true

    // Initialize auth state
    initializeAuth()

    // Setup auth state change listener
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state changed:', event, session?.user?.email)

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            dispatch({ type: 'SET_USER', payload: session.user })
            dispatch({ type: 'SET_SESSION', payload: session })
            
            // Get user profile
            try {
              const profile = await getUserProfile(session.user.id)
              dispatch({ type: 'SET_PROFILE', payload: profile })
            } catch {
              console.error("Error occurred")
            }
          }
          break

        case 'SIGNED_OUT':
          dispatch({ type: 'RESET' })
          break

        case 'TOKEN_REFRESHED':
          if (session) {
            dispatch({ type: 'SET_SESSION', payload: session })
          }
          break

        case 'USER_UPDATED':
          if (session?.user) {
            dispatch({ type: 'SET_USER', payload: session.user })
            // Refresh profile in case user data changed
            try {
              const profile = await getUserProfile(session.user.id)
              dispatch({ type: 'SET_PROFILE', payload: profile })
            } catch {
              console.error("Error occurred")
            }
          }
          break
      }

      dispatch({ type: 'SET_LOADING', payload: false })
    })

    // Setup additional auth listeners
    setupAuthListeners()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [initializeAuth])

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword,
    hasPermission,
    isRole,
    refresh
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Export context for testing
export { AuthContext } 