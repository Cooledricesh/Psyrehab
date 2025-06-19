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

const initialAuthState: AuthState = {
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false
}

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


interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)

    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      dispatch({ type: 'SET_SESSION', payload: session })

      if (session?.user) {
        dispatch({ type: 'SET_USER', payload: session.user })

        dispatch({ type: 'SET_PROFILE', payload: profile })
      }
    } catch {
      console.error("Error occurred")
    } finally {
      dispatch({ type: 'SET_INITIALIZED', payload: true })
    }
  }, [])

    try {
      dispatch({ type: 'SET_SESSION', payload: session })

      if (session?.user) {
        dispatch({ type: 'SET_USER', payload: session.user })
        
        dispatch({ type: 'SET_PROFILE', payload: profile })
      } else {
        dispatch({ type: 'SET_USER', payload: null })
        dispatch({ type: 'SET_PROFILE', payload: null })
      }
    } catch {
      console.error("Error occurred")
    }
  }, [])

    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      
      if (result.success && result.user && result.session) {
        dispatch({ type: 'SET_USER', payload: result.user })
        dispatch({ type: 'SET_SESSION', payload: result.session })
        dispatch({ type: 'SET_PROFILE', payload: result.profile || null })
        
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error: unknown) {
      return { success: false, error: error.message || '로그인 중 오류가 발생했습니다.' }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

    try {
      dispatch({ type: 'SET_LOADING', payload: true })

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
          return signInResult
        }
      }

      return { success: false, error: result.error }
    } catch (error: unknown) {
      return { success: false, error: error.message || '회원가입 중 오류가 발생했습니다.' }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [signIn])

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      await AuthService.signOut()
      
      dispatch({ type: 'RESET' })
    } catch {
      console.error("Error occurred")
      dispatch({ type: 'RESET' })
    }
  }, [])

    try {
      return result
    } catch (error: unknown) {
      return { success: false, error: error.message || '비밀번호 재설정 중 오류가 발생했습니다.' }
    }
  }, [])

    try {
      if (!state.user?.id) {
        return { success: false, error: '사용자 정보를 찾을 수 없습니다.' }
      }

      dispatch({ type: 'SET_LOADING', payload: true })

      
      if (result.success && result.profile) {
        dispatch({ type: 'SET_PROFILE', payload: result.profile })
        return { success: true, profile: result.profile }
      }

      return { success: false, error: result.error }
    } catch (error: unknown) {
      return { success: false, error: error.message || '프로필 업데이트 중 오류가 발생했습니다.' }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [state.user?.id])

    try {
      return result
    } catch (error: unknown) {
      return { success: false, error: error.message || '비밀번호 변경 중 오류가 발생했습니다.' }
    }
  }, [])

    if (!state.profile?.role) {
      return false
    }

    return rolePermissions.includes(permission as Permission)
  }, [state.profile?.role])

    return state.profile?.role === role
  }, [state.profile?.role])

  useEffect(() => {
    let mounted = true

    initializeAuth()

    const { data: { subscription } } = onAuthStateChange(async (event) => {
      if (!mounted) return

      console.log('Auth state changed:', event, session?.user?.email)

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            dispatch({ type: 'SET_USER', payload: session.user })
            dispatch({ type: 'SET_SESSION', payload: session })
            
            try {
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
            try {
              dispatch({ type: 'SET_PROFILE', payload: profile })
            } catch {
              console.error("Error occurred")
            }
          }
          break
      }

      dispatch({ type: 'SET_LOADING', payload: false })
    })

    setupAuthListeners()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [initializeAuth])

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

export function useAuth(): AuthContextType {
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

export { AuthContext } 