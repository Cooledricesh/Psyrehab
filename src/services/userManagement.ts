import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/auth';
import { handleApiError } from '@/utils/error-handler';

export interface UpdateUserRoleParams {
  userId: string;
  newRole: UserRole;
}

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole | 'pending'
  roleId: string
  isActive: boolean
  createdAt: string
  employeeId?: string
  department?: string
  contactNumber?: string
  patientCount?: number
  needsApproval?: boolean
  requestedRole?: UserRole
}

export class UserManagementService {
  /**
   * 모든 사용자 목록을 조회합니다.
   */
  static async loadUsers(): Promise<{ success: boolean; users?: User[]; error?: string }> {
    try {
      // 직원 조회
      const { data: socialWorkers, error: swError } = await supabase
        .from('social_workers')
        .select(`
          user_id,
          full_name,
          employee_id,
          department,
          contact_number,
          is_active,
          created_at
        `)

      if (swError) throw swError

      // 관리자 조회
      const { data: administrators, error: adminError } = await supabase
        .from('administrators')
        .select(`
          user_id,
          full_name,
          is_active,
          created_at
        `)

      if (adminError) throw adminError

      // 모든 사용자의 역할 정보 조회
      const allUserIds = [
        ...(socialWorkers || []).map(sw => sw.user_id),
        ...(administrators || []).map(admin => admin.user_id)
      ]

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role_id
        `)
        .in('user_id', allUserIds)
      
      if (rolesError) throw rolesError

      // 모든 역할 정보 조회
      const { data: allRoles, error: allRolesError } = await supabase
        .from('roles')
        .select('id, role_name')
      
      if (allRolesError) throw allRolesError
      
      // 역할 ID로 역할 이름을 찾을 수 있는 맵 생성
      const roleIdToName = new Map(
        (allRoles || []).map(r => [r.id, r.role_name])
      )

      // 역할 정보를 맵으로 변환
      const roleMap = new Map(
        (userRoles || []).map(ur => [
          ur.user_id,
          {
            role_id: ur.role_id,
            role_name: roleIdToName.get(ur.role_id) || 'unknown'
          }
        ])
      )

      // 승인 대기 중인 신청서 조회
      const { data: pendingRequests, error: requestError } = await supabase
        .from('signup_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (requestError) throw requestError

      // 승인 대기 사용자 변환
      const pendingUsers: User[] = (pendingRequests || []).map(request => ({
        id: request.id, // signup_requests의 id를 사용
        email: request.email,
        fullName: request.full_name,
        role: 'pending' as const,
        roleId: '',
        isActive: false,
        createdAt: request.created_at,
        employeeId: request.employee_id,
        department: request.department,
        contactNumber: request.contact_number,
        needsApproval: true,
        requestedRole: request.requested_role as UserRole
      }))

      // 환자 수 카운트
      const patientCounts: Record<string, number> = {}
      if (socialWorkers) {
        for (const sw of socialWorkers) {
          const { count } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('primary_social_worker_id', sw.user_id)
          
          patientCounts[sw.user_id] = count || 0
        }
      }

      // 데이터 변환
      const allUsers: User[] = [
        ...(socialWorkers || []).map(sw => ({
          id: sw.user_id,
          email: '', // email은 나중에 채워질 예정
          fullName: sw.full_name,
          role: (roleMap.get(sw.user_id)?.role_name || 'staff') as UserRole,
          roleId: roleMap.get(sw.user_id)?.role_id || '',
          isActive: sw.is_active,
          createdAt: sw.created_at,
          employeeId: sw.employee_id,
          department: sw.department,
          contactNumber: sw.contact_number,
          patientCount: patientCounts[sw.user_id] || 0
        })),
        ...(administrators || []).map(admin => ({
          id: admin.user_id,
          email: '', // email은 나중에 채워질 예정
          fullName: admin.full_name,
          role: (roleMap.get(admin.user_id)?.role_name || 'administrator') as UserRole,
          roleId: roleMap.get(admin.user_id)?.role_id || '',
          isActive: admin.is_active,
          createdAt: admin.created_at,
          employeeId: '',
          department: '',
          contactNumber: ''
        }))
      ]

      // 중복 제거
      const uniqueUsers = Array.from(
        new Map([...allUsers, ...pendingUsers].map(user => [user.id, user])).values()
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return { success: true, users: uniqueUsers }

    } catch (error) {
      handleApiError(error, 'UserManagementService.loadUsers')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '사용자 목록을 불러오는 중 오류가 발생했습니다.' 
      }
    }
  }

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
      handleApiError(error, 'UserManagementService.updateUserRole');
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
      handleApiError(error, 'UserManagementService.deleteUser');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      };
    }
  }
}