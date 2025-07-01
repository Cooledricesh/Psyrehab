import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/auth';

export interface UpdateUserRoleParams {
  userId: string;
  newRole: UserRole;
}

export class UserManagementService {
  /**
   * 사용 가능한 역할 목록을 반환합니다.
   */
  static getAvailableRoles() {
    return [
      { value: 'staff', label: '사원' },
      { value: 'assistant_manager', label: '주임' },
      { value: 'section_chief', label: '계장' },
      { value: 'manager_level', label: '과장' },
      { value: 'department_head', label: '부장' },
      { value: 'vice_director', label: '부원장' },
      { value: 'director', label: '원장' },
      { value: 'attending_physician', label: '주치의' },
      { value: 'administrator', label: '관리자' }
    ];
  }

  /**
   * 사용자의 역할을 변경합니다.
   * 단순히 user_roles 테이블의 role_id만 업데이트합니다.
   */
  static async updateUserRole({ userId, newRole }: UpdateUserRoleParams): Promise<{ success: boolean; error?: string }> {
    console.log('🔄 사용자 역할 변경 시작:', { userId, newRole });

    try {
      // 1. 새로운 역할의 ID를 데이터베이스에서 직접 조회
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('role_name', newRole)
        .single();

      if (roleError || !roleData) {
        throw new Error(`역할을 찾을 수 없습니다: ${newRole}`);
      }

      const newRoleId = roleData.id;
      console.log(`역할 ${newRole}의 ID: ${newRoleId}`);

      // 2. user_roles 테이블에서 역할 업데이트
      const { error: roleUpdateError } = await supabase
        .from('user_roles')
        .update({ 
          role_id: newRoleId
        })
        .eq('user_id', userId);

      if (roleUpdateError) {
        throw new Error(`역할 업데이트 실패: ${roleUpdateError.message}`);
      }

      console.log('✅ 사용자 역할 변경 완료');
      return { success: true };

    } catch (error) {
      console.error('❌ 역할 변경 중 오류:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      };
    }
  }

  /**
   * 사용자를 삭제합니다.
   */
  static async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ 사용자 삭제 시작:', userId);

      // 1. 사용자의 현재 역할 확인
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (
            role_name
          )
        `)
        .eq('user_id', userId)
        .single();

      if (roleError || !userRole) {
        throw new Error('사용자 역할을 찾을 수 없습니다.');
      }

      const roleName = userRole.roles?.role_name;
      const socialWorkerRoles = ['staff', 'assistant_manager', 'section_chief', 'manager_level', 'department_head', 'vice_director', 'director', 'attending_physician'];
      const adminRoles = ['administrator'];

      // 2. 해당하는 프로필 테이블에서 삭제
      if (socialWorkerRoles.includes(roleName)) {
        const { error: deleteError } = await supabase
          .from('social_workers')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          throw new Error(`프로필 삭제 실패: ${deleteError.message}`);
        }
      } else if (adminRoles.includes(roleName)) {
        const { error: deleteError } = await supabase
          .from('administrators')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          throw new Error(`프로필 삭제 실패: ${deleteError.message}`);
        }
      }

      // 3. user_roles에서 삭제
      const { error: roleDeleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleDeleteError) {
        throw new Error(`역할 삭제 실패: ${roleDeleteError.message}`);
      }

      // 4. auth.users에서 삭제 (Supabase Admin API 필요)
      // 주의: 이 기능은 서버사이드에서만 가능하며, 
      // 클라이언트에서는 보안상의 이유로 직접 삭제할 수 없습니다.
      // 실제 구현시에는 서버 API를 통해 처리해야 합니다.

      console.log('✅ 사용자 삭제 완료');
      return { success: true };

    } catch (error) {
      console.error('❌ 사용자 삭제 중 오류:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      };
    }
  }
}