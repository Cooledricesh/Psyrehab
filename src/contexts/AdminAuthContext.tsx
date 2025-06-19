import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, UserRole, Permission, ROLE_PERMISSIONS, isAdminRole, hasPermission } from '@/types/auth';

interface AdminAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: Permission[];
}

interface AdminAuthContextType extends AdminAuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkPermission: (permission: Permission) => boolean;
  checkAnyPermission: (permissions: Permission[]) => boolean;
  checkAllPermissions: (permissions: Permission[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: true,
    error: null,
    permissions: [],
  });

  // 사용자 정보 로드
  const loadUser = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (session?.user) {
        // 사용자 프로필 정보 가져오기
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: profile.name || '',
          role: profile.role as UserRole,
          permissions: ROLE_PERMISSIONS[profile.role as UserRole] || [],
          status: profile.status || 'active',
          avatar: profile.avatar,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
          lastLogin: profile.last_login,
          emailVerified: session.user.email_confirmed_at ? true : false,
          phone: profile.phone,
          department: profile.department,
        };

        const isUserAdmin = isAdminRole(userData.role);

        setState({
          user: userData,
          isAuthenticated: true,
          isAdmin: isUserAdmin,
          isLoading: false,
          error: null,
          permissions: userData.permissions,
        });
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
          error: null,
          permissions: [],
        });
      }
    } catch {
      console.error("Error occurred");
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: ""instanceOf Error ? "Error" : 'Failed to load user',
      }));
    }
  };

  // 로그인
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadUser();
        
        // 관리자 권한 체크
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const userRole = profile?.role as UserRole;
        if (!isAdminRole(userRole)) {
          await supabase.auth.signOut();
          return { 
            success: false, 
            error: '관리자 권한이 없습니다.' 
          };
        }

        // 로그인 시간 업데이트
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);

        return { success: true };
      }

      return { success: false, error: '로그인에 실패했습니다.' };
    } catch {
      const errorMessage = ""instanceOf Error ? "Error" : '로그인에 실패했습니다.';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  // 로그아웃
  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setState({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
        error: null,
        permissions: [],
      });
    } catch {
      console.error("Error occurred");
    }
  };

  // 권한 체크 함수들
  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(state.permissions, permission);
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(state.permissions, permission));
  };

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(state.permissions, permission));
  };

  // 사용자 정보 새로고침
  const refreshUser = async (): Promise<void> => {
    await loadUser();
  };

  // 인증 상태 변화 감지
  useEffect(() => {
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        console.log('Admin auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadUser();
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            isAuthenticated: false,
            isAdmin: false,
            isLoading: false,
            error: null,
            permissions: [],
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value: AdminAuthContextType = {
    ...state,
    login,
    logout,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    refreshUser,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export default AdminAuthContext; 