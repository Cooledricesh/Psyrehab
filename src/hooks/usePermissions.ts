import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RolePermissionsService } from '@/services/rolePermissions';
import type { Permission, UserRole } from '@/types/auth';

export interface UsePermissionsReturn {
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  loading: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPermissions();

    // 권한 변경 실시간 구독
    const subscription = supabase
      .channel('role_permissions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'role_permissions'
      }, () => {
        loadUserPermissions();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserPermissions = async () => {
    try {
      setLoading(true);
      
      // 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPermissions([]);
        return;
      }

      // 사용자 프로필에서 역할 조회
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        // user_profiles에 없으면 개별 테이블에서 조회
        const { data: socialWorker } = await supabase
          .from('social_workers')
          .select('user_id')
          .eq('user_id', user.id)
          .single();
        
        if (socialWorker) {
          const perms = await RolePermissionsService.getPermissionsForRole('staff' as UserRole);
          setPermissions(perms);
          return;
        }

        const { data: admin } = await supabase
          .from('administrators')
          .select('user_id')
          .eq('user_id', user.id)
          .single();
        
        if (admin) {
          const perms = await RolePermissionsService.getPermissionsForRole('administrator' as UserRole);
          setPermissions(perms);
          return;
        }

        setPermissions([]);
        return;
      }

      // 역할에 따른 권한 조회
      const rolePermissions = await RolePermissionsService.getPermissionsForRole(profile.role as UserRole);
      setPermissions(rolePermissions);
    } catch (error) {
      console.error('권한 로드 오류:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: Permission[]): boolean => {
    return perms.some(perm => permissions.includes(perm));
  };

  const hasAllPermissions = (perms: Permission[]): boolean => {
    return perms.every(perm => permissions.includes(perm));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading
  };
}