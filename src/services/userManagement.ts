import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/auth';

export interface UpdateUserRoleParams {
  userId: string;
  newRole: UserRole;
}

export class UserManagementService {
  /**
   * 사용자의 역할을 변경합니다.
   * 기존 프로필 테이블에서 삭제하고 새로운 프로필 테이블에 생성합니다.
   */
  static async updateUserRole({ userId, newRole }: UpdateUserRoleParams): Promise<{ success: boolean; error?: string }> {
    console.log('🔄 사용자 역할 변경 시작:', { userId, newRole });

    try {
      // 1. 현재 사용자 정보 조회
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError || !currentUser) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      // 2. 기존 프로필 정보 백업 (social_workers에서 조회)
      let profileData: any = null;
      let currentRole: string | null = null;

      // social_workers 테이블에서 확인
      const { data: socialWorkerData } = await supabase
        .from('social_workers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (socialWorkerData) {
        currentRole = 'social_worker';
        profileData = socialWorkerData;
      } else {
        // administrators 테이블에서 확인
        const { data: adminData } = await supabase
          .from('administrators')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (adminData) {
          currentRole = 'administrator';
          profileData = adminData;
        }
      }

      if (!currentRole || !profileData) {
        throw new Error('사용자의 현재 프로필을 찾을 수 없습니다.');
      }

      console.log('📋 현재 역할:', currentRole, '→ 새 역할:', newRole);

      // 3. 동일한 역할로의 변경은 무시
      if (currentRole === newRole) {
        return { success: true };
      }

      // 4. 트랜잭션으로 역할 변경 처리
      // 4-1. 기존 프로필 삭제
      const deleteTable = currentRole === 'social_worker' ? 'social_workers' : 'administrators';
      const { error: deleteError } = await supabase
        .from(deleteTable)
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw new Error(`기존 프로필 삭제 실패: ${deleteError.message}`);
      }

      // 4-2. 새로운 프로필 생성
      const createData = {
        user_id: userId,
        full_name: profileData.full_name,
        is_active: profileData.is_active || true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 역할에 따라 적절한 테이블에 삽입
      let insertTable: string;
      let insertData: any;

      switch (newRole) {
        case 'social_worker':
        case 'staff':
        case 'assistant_manager':
        case 'section_chief':
        case 'manager_level':
        case 'department_head':
          insertTable = 'social_workers';
          insertData = {
            ...createData,
            employee_id: profileData.employee_id || null,
            department: profileData.department || null,
            contact_number: profileData.contact_number || null
          };
          break;
        
        case 'administrator':
        case 'vice_director':
        case 'director':
          insertTable = 'administrators';
          insertData = {
            ...createData,
            admin_level: newRole === 'director' ? 3 : newRole === 'vice_director' ? 2 : 1
          };
          break;

        case 'attending_physician':
          insertTable = 'social_workers'; // 임시로 social_workers 테이블 사용
          insertData = {
            ...createData,
            employee_id: profileData.employee_id || null,
            department: profileData.department || '의료진',
            contact_number: profileData.contact_number || null
          };
          break;

        default:
          throw new Error(`지원하지 않는 역할입니다: ${newRole}`);
      }

      const { error: insertError } = await supabase
        .from(insertTable)
        .insert(insertData);

      if (insertError) {
        // 롤백 시도
        await supabase
          .from(deleteTable)
          .insert(profileData);
        
        throw new Error(`새 프로필 생성 실패: ${insertError.message}`);
      }

      // 4-3. user_roles 테이블 업데이트
      // 먼저 역할 ID 조회
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', newRole)
        .single();

      if (roleError) {
        console.warn('역할 ID 조회 실패, roles 테이블이 없을 수 있습니다:', roleError);
      } else if (roleData) {
        // user_roles 업데이트
        const { error: userRoleError } = await supabase
          .from('user_roles')
          .update({ role_id: roleData.id })
          .eq('user_id', userId);

        if (userRoleError) {
          console.warn('user_roles 업데이트 실패:', userRoleError);
        }
      }

      console.log('✅ 사용자 역할 변경 완료');
      return { success: true };

    } catch (error) {
      console.error('❌ 역할 변경 중 오류:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '역할 변경 중 오류가 발생했습니다.' 
      };
    }
  }

  /**
   * 사용 가능한 역할 목록을 반환합니다.
   */
  static getAvailableRoles(): Array<{ value: UserRole; label: string }> {
    return [
      { value: 'administrator', label: '관리자' },
      { value: 'social_worker', label: '사회복지사' },
      { value: 'staff', label: '사원' },
      { value: 'assistant_manager', label: '주임' },
      { value: 'section_chief', label: '계장' },
      { value: 'manager_level', label: '과장' },
      { value: 'department_head', label: '부장' },
      { value: 'vice_director', label: '부원장' },
      { value: 'director', label: '원장' },
      { value: 'attending_physician', label: '주치의' }
    ];
  }
}