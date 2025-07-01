import { supabase } from '@/lib/supabase';
import type { Permission, UserRole } from '@/types/auth';

export interface RolePermission {
  id: string;
  role_name: string;
  permission: string;
  created_at: string;
  updated_at: string;
}

export class RolePermissionsService {
  /**
   * 특정 역할의 권한 목록 조회
   */
  static async getPermissionsForRole(role: UserRole): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role_name', role);

      if (error) throw error;

      return data?.map(item => item.permission as Permission) || [];
    } catch (error) {
      console.error('역할 권한 조회 오류:', error);
      return [];
    }
  }

  /**
   * 모든 역할의 권한 조회
   */
  static async getAllRolePermissions(): Promise<Record<UserRole, Permission[]>> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role_name, permission')
        .order('role_name');

      if (error) throw error;

      // 역할별로 그룹화
      const grouped = data?.reduce((acc, item) => {
        const role = item.role_name as UserRole;
        if (!acc[role]) {
          acc[role] = [];
        }
        acc[role].push(item.permission as Permission);
        return acc;
      }, {} as Record<UserRole, Permission[]>);

      return grouped || {};
    } catch (error) {
      console.error('전체 역할 권한 조회 오류:', error);
      return {} as Record<UserRole, Permission[]>;
    }
  }

  /**
   * 역할의 권한 업데이트
   */
  static async updateRolePermissions(role: UserRole, permissions: Permission[]): Promise<boolean> {
    try {
      // 트랜잭션으로 처리하기 위해 먼저 기존 권한 삭제
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_name', role);

      if (deleteError) throw deleteError;

      // 새로운 권한 추가
      if (permissions.length > 0) {
        const insertData = permissions.map(permission => ({
          role_name: role,
          permission
        }));

        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error('역할 권한 업데이트 오류:', error);
      return false;
    }
  }

  /**
   * 사용자가 특정 권한을 가지고 있는지 확인
   */
  static async userHasPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      // 사용자의 역할 조회
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) return false;

      // 해당 역할이 권한을 가지고 있는지 확인
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role_name', profile.role)
        .eq('permission', permission)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('권한 확인 오류:', error);
      return false;
    }
  }

  /**
   * 여러 권한 중 하나라도 가지고 있는지 확인
   */
  static async userHasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) return false;

      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role_name', profile.role)
        .in('permission', permissions);

      return !error && data && data.length > 0;
    } catch (error) {
      console.error('권한 확인 오류:', error);
      return false;
    }
  }

  /**
   * 모든 권한을 가지고 있는지 확인
   */
  static async userHasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) return false;

      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role_name', profile.role)
        .in('permission', permissions);

      return !error && data && data.length === permissions.length;
    } catch (error) {
      console.error('권한 확인 오류:', error);
      return false;
    }
  }
}