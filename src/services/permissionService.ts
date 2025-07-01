import { supabase } from '@/lib/supabase';
import type { UserRole, Permission } from '@/types/auth';
import { ROLE_PERMISSIONS } from '@/types/auth';

export class PermissionService {
  /**
   * 모든 역할의 권한 설정을 가져옵니다.
   */
  static async getRolePermissions(): Promise<Record<UserRole, Permission[]>> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role_name, permission');

      if (error) {
        console.error('권한 조회 오류:', error);
        // 오류 시 기본 권한 반환
        return ROLE_PERMISSIONS;
      }

      // 데이터가 없으면 기본 권한 반환
      if (!data || data.length === 0) {
        return ROLE_PERMISSIONS;
      }

      // 데이터를 UserRole별로 그룹화
      const permissions: Record<string, Permission[]> = {};
      
      data.forEach(item => {
        if (!permissions[item.role_name]) {
          permissions[item.role_name] = [];
        }
        permissions[item.role_name].push(item.permission as Permission);
      });

      // 기본 권한과 병합 (DB에 없는 역할은 기본값 사용)
      return {
        ...ROLE_PERMISSIONS,
        ...permissions
      } as Record<UserRole, Permission[]>;
    } catch (error) {
      console.error('권한 조회 중 예외 발생:', error);
      return ROLE_PERMISSIONS;
    }
  }

  /**
   * 역할별 권한을 저장합니다.
   */
  static async saveRolePermissions(permissions: Record<UserRole, Permission[]>): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. 기존 권한 모두 삭제
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 레코드 삭제

      if (deleteError) {
        console.error('기존 권한 삭제 오류:', deleteError);
      }

      // 2. 새 권한 삽입
      const insertData: Array<{ role_name: string; permission: string }> = [];
      
      Object.entries(permissions).forEach(([role, perms]) => {
        perms.forEach(permission => {
          insertData.push({
            role_name: role,
            permission: permission
          });
        });
      });

      if (insertData.length > 0) {
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(insertData);

        if (insertError) {
          throw new Error(`권한 저장 실패: ${insertError.message}`);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('권한 저장 중 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '권한 저장 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 특정 사용자의 권한을 확인합니다.
   */
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      // 1. 사용자의 역할 조회
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select(`
          roles (
            role_name
          )
        `)
        .eq('user_id', userId)
        .single();

      if (roleError || !userRole?.roles?.role_name) {
        console.error('사용자 역할 조회 오류:', roleError);
        return [];
      }

      const roleName = userRole.roles.role_name as UserRole;

      // 2. 해당 역할의 권한 조회
      const { data: permissions, error: permError } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role_name', roleName);

      if (permError) {
        console.error('권한 조회 오류:', permError);
        // DB 오류 시 기본 권한 반환
        return ROLE_PERMISSIONS[roleName] || [];
      }

      // 권한이 없으면 기본 권한 반환
      if (!permissions || permissions.length === 0) {
        return ROLE_PERMISSIONS[roleName] || [];
      }

      return permissions.map(p => p.permission as Permission);
    } catch (error) {
      console.error('사용자 권한 조회 중 예외 발생:', error);
      return [];
    }
  }
}