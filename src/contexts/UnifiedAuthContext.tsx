import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/services/auth';
import type { 
  UserProfile, 
  UserRole, 
  Permission, 
  SignUpUserData,
  AuthError,
  AuthResult 
} from '@/types/auth';

// Unified Auth State Interface
interface UnifiedAuthState {
  // User & Session
  user: SupabaseUser | null;
  session: Session | null;
  profile: UserProfile | null;
  
  // States
  loading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;
  
  // Role & Permissions
  role: UserRole | null;
  permissions: Permission[];
  
  // Admin-specific
  isAdmin: boolean;
  adminLevel?: number;
}

// Unified Auth Context Interface
interface UnifiedAuthContextType extends UnifiedAuthState {
  // Core Methods
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (data: SignUpUserData) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  
  // Profile & Settings
  updateProfile: (updates: Partial<UserProfile>) => Promise<AuthResult>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  
  // Permission System
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isRole: (role: UserRole) => boolean;
  isAnyRole: (roles: UserRole[]) => boolean;
  
  // Data Refresh
  refreshUserData: () => Promise<void>;
  
  // Admin Methods
  checkAdminAccess: () => boolean;
  getAdminLevel: () => number;
}

// Create Unified Auth Context
const UnifiedAuthContext = createContext<UnifiedAuthContextType | null>(null);

// Unified Auth Provider
export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UnifiedAuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    initialized: false,
    isAuthenticated: false,
    role: null,
    permissions: [],
    isAdmin: false,
    adminLevel: 0
  });

  // Initialize authentication
  const initializeAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('세션 가져오기 오류:', error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          initialized: true 
        }));
        return;
      }

      if (session?.user) {
        await handleUserSession(session);
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          initialized: true 
        }));
      }
    } catch (error) {
      console.error('인증 초기화 오류:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        initialized: true 
      }));
    }
  }, []);

  // Handle user session
  const handleUserSession = useCallback(async (session: Session) => {
    try {
      const user = session.user;
      const profile = await AuthService.getUserProfile(user.id);
      
      if (profile) {
        const permissions = await AuthService.getUserPermissions(user.id);
        const isAdmin = profile.role === 'admin';
        const adminLevel = isAdmin ? (profile as any).admin_level || 1 : 0;

        setState({
          user,
          session,
          profile,
          loading: false,
          initialized: true,
          isAuthenticated: true,
          role: profile.role,
          permissions,
          isAdmin,
          adminLevel
        });
      } else {
        // Profile not found - clean up
        await AuthService.signOut();
        setState({
          user: null,
          session: null,
          profile: null,
          loading: false,
          initialized: true,
          isAuthenticated: false,
          role: null,
          permissions: [],
          isAdmin: false,
          adminLevel: 0
        });
      }
    } catch (error) {
      console.error('사용자 세션 처리 오류:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        initialized: true 
      }));
    }
  }, []);

  // Auth methods
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const result = await AuthService.signIn(email, password);
      
      if (result.success && result.session) {
        await handleUserSession(result.session);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return {
        success: false,
        error: error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.'
      };
    }
  }, [handleUserSession]);

  const signUp = useCallback(async (data: SignUpUserData): Promise<AuthResult> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const result = await AuthService.signUp(data.email, data.password, data);
      
      if (!result.success) {
        setState(prev => ({ ...prev, loading: false }));
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return {
        success: false,
        error: error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.'
      };
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await AuthService.signOut();
      
      setState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        initialized: true,
        isAuthenticated: false,
        role: null,
        permissions: [],
        isAdmin: false,
        adminLevel: 0
      });
    } catch (error) {
      console.error('로그아웃 오류:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<AuthResult> => {
    if (!state.user) {
      return { success: false, error: '사용자가 인증되지 않았습니다.' };
    }

    try {
      const result = await AuthService.updateProfile(state.user.id, updates);
      
      if (result.success && result.profile) {
        setState(prev => ({ 
          ...prev, 
          profile: result.profile as UserProfile 
        }));
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '프로필 업데이트 중 오류가 발생했습니다.'
      };
    }
  }, [state.user]);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
    try {
      return await AuthService.updatePassword(currentPassword, newPassword);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '비밀번호 업데이트 중 오류가 발생했습니다.'
      };
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      return await AuthService.resetPassword(email);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '비밀번호 재설정 중 오류가 발생했습니다.'
      };
    }
  }, []);

  const refreshUserData = useCallback(async (): Promise<void> => {
    if (!state.user) return;

    try {
      const profile = await AuthService.getUserProfile(state.user.id);
      const permissions = await AuthService.getUserPermissions(state.user.id);
      
      if (profile) {
        const isAdmin = profile.role === 'admin';
        const adminLevel = isAdmin ? (profile as any).admin_level || 1 : 0;

        setState(prev => ({ 
          ...prev, 
          profile,
          role: profile.role,
          permissions,
          isAdmin,
          adminLevel
        }));
      }
    } catch (error) {
      console.error('사용자 데이터 새로고침 오류:', error);
    }
  }, [state.user]);

  // Permission methods
  const hasPermission = useCallback((permission: Permission): boolean => {
    return state.permissions.includes(permission);
  }, [state.permissions]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(permission => state.permissions.includes(permission));
  }, [state.permissions]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every(permission => state.permissions.includes(permission));
  }, [state.permissions]);

  const isRole = useCallback((role: UserRole): boolean => {
    return state.role === role;
  }, [state.role]);

  const isAnyRole = useCallback((roles: UserRole[]): boolean => {
    return state.role ? roles.includes(state.role) : false;
  }, [state.role]);

  const checkAdminAccess = useCallback((): boolean => {
    return state.isAdmin;
  }, [state.isAdmin]);

  const getAdminLevel = useCallback((): number => {
    return state.adminLevel || 0;
  }, [state.adminLevel]);

  // Auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          await handleUserSession(session);
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            initialized: true,
            isAuthenticated: false,
            role: null,
            permissions: [],
            isAdmin: false,
            adminLevel: 0
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setState(prev => ({ ...prev, session }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [handleUserSession]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Memoized context value
  const contextValue = useMemo(() => ({
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePassword,
    resetPassword,
    refreshUserData,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isRole,
    isAnyRole,
    checkAdminAccess,
    getAdminLevel
  }), [
    state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePassword,
    resetPassword,
    refreshUserData,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isRole,
    isAnyRole,
    checkAdminAccess,
    getAdminLevel
  ]);

  return (
    <UnifiedAuthContext.Provider value={contextValue}>
      {children}
    </UnifiedAuthContext.Provider>
  );
}

// Unified Auth Hook
export function useUnifiedAuth(): UnifiedAuthContextType {
  const context = useContext(UnifiedAuthContext);
  
  if (!context) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  
  return context;
}

// Backward compatibility hooks
export function useAuth() {
  return useUnifiedAuth();
}

export function useAdminAuth() {
  const auth = useUnifiedAuth();
  
  if (!auth.isAdmin) {
    throw new Error('useAdminAuth can only be used by admin users');
  }
  
  return auth;
}

// Export types for external use
export type { UnifiedAuthState, UnifiedAuthContextType };