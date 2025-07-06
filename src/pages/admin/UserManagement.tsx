'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { UserPlus } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

import type { UserRole } from '@/types/auth'
import { ROLE_NAMES } from '@/types/auth'
import { UserManagementService, type User } from '@/services/userManagement'
import { jobTitleRoles, getUserTable } from '@/utils/userManagement'
import { UserEditDialog, type EditFormData } from '@/components/admin/UserEditDialog'
import { UserDeleteDialog } from '@/components/admin/UserDeleteDialog'
import { UserTable } from '@/components/admin/UserTable'
import { UserFilter } from '@/components/admin/UserFilter'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    
    const result = await UserManagementService.loadUsers()
    
    if (result.success && result.users) {
      setUsers(result.users)
    } else {
      console.error("Error occurred")
      toast({
        title: '오류',
        description: result.error || '사용자 목록을 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
    
    setLoading(false)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowEditDialog(true)
  }

  const handleUpdateUser = async (user: User, editFormData: EditFormData) => {
    if (!user) return

    try {
      // 역할이 변경되었는지 확인
      const roleChanged = editFormData.role && editFormData.role !== user.role

      if (roleChanged) {
        // 역할 변경 처리
        const result = await UserManagementService.updateUserRole({
          userId: user.id,
          newRole: editFormData.role as UserRole
        })

        if (!result.success) {
          throw new Error(result.error || '역할 변경 실패')
        }
      }

      // 기본 정보 업데이트 (역할 변경 후 새로운 테이블에서)
      const table = roleChanged 
        ? getUserTable(editFormData.role)
        : getUserTable(user.role)
      
      // 모든 테이블에 동일한 필드가 있으므로 같은 데이터 사용
      const updateData = {
        full_name: editFormData.fullName,
        department: editFormData.department || null,
        contact_number: editFormData.contactNumber || null,
        is_active: editFormData.isActive,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('user_id', user.id)

      if (error) throw error

      // user_profiles 테이블 업데이트 제거 - 테이블이 존재하지 않음

      toast({
        title: '성공',
        description: roleChanged 
          ? '사용자 역할 및 정보가 업데이트되었습니다.' 
          : '사용자 정보가 업데이트되었습니다.'
      })

      setShowEditDialog(false)
      loadUsers()

    } catch (error) {
      console.error("사용자 업데이트 오류:", error)
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '사용자 정보 업데이트 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      // 현재 로그인한 사용자 정보 확인
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !currentUser) {
        throw new Error('인증 정보를 확인할 수 없습니다.')
      }

      // 관리자 권한 확인
      const { data: adminCheck, error: adminError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', currentUser.id)
        .eq('role_id', 'd7fcf425-85bc-42b4-8806-917ef6939a40') // administrator role_id
        .single()
      if (adminError || !adminCheck) {
        throw new Error('관리자 권한이 필요합니다.')
      }

      // 환자가 할당된 직원은 삭제할 수 없음
      if (jobTitleRoles.includes(selectedUser.role as any) && selectedUser.patientCount && selectedUser.patientCount > 0) {
        toast({
          title: '삭제 불가',
          description: `담당 환자가 ${selectedUser.patientCount}명 있는 직원은 삭제할 수 없습니다. 먼저 환자를 다른 직원에게 이관해주세요.`,
          variant: 'destructive'
        })
        setShowDeleteDialog(false)
        return
      }

      // 삭제 순서: 
      // 1. signup_requests (있을 경우)
      // 2. 프로필 (social_workers 또는 administrators)
      // 3. user_roles

      // 1. signup_requests에서 삭제 (승인 대기 중인 경우)
      if (selectedUser.role === 'pending') {
        const { error: requestError } = await supabase
          .from('signup_requests')
          .delete()
          .eq('id', selectedUser.id)  // pending 사용자는 signup_requests의 id를 사용

        if (requestError) {
          console.error("signup_requests 삭제 오류:", requestError)
          throw new Error(`신청서 삭제 실패: ${requestError.message}`)
        }
      } else {
        // 승인된 사용자의 경우 signup_requests에서도 삭제 시도 (있을 수 있음)
        const { error: requestError } = await supabase
          .from('signup_requests')
          .delete()
          .eq('user_id', selectedUser.id)

        if (requestError && !requestError.message.includes('No rows')) {
          console.error("signup_requests 삭제 오류:", requestError)
        }
      }

      // 2. 프로필 삭제
      if (selectedUser.role !== 'pending') {
        // 직급별 역할들은 모두 social_workers 테이블에 저장됨
        const table = getUserTable(selectedUser.role)
        
        // 프로필 삭제
        const { error: profileError } = await supabase
          .from(table)
          .delete()
          .eq('user_id', selectedUser.id)
        if (profileError) {
          console.error(`${table} 삭제 오류:`, profileError)
          
          // 409 에러 처리
          if (profileError.code === '23503' || profileError.message.includes('violates foreign key constraint')) {
            // 관련 데이터 확인
            if (jobTitleRoles.includes(selectedUser.role as any)) {
              const relatedData = []
              
              // 평가 기록 확인
              const { count: assessmentCount } = await supabase
                .from('assessments')
                .select('*', { count: 'exact', head: true })
                .eq('assessed_by', selectedUser.id)
              
              if (assessmentCount && assessmentCount > 0) {
                relatedData.push(`${assessmentCount}개의 평가 기록`)
              }
              
              // 재활 목표 확인
              const { count: goalCount } = await supabase
                .from('rehabilitation_goals')
                .select('*', { count: 'exact', head: true })
                .eq('created_by_social_worker_id', selectedUser.id)
              
              if (goalCount && goalCount > 0) {
                relatedData.push(`${goalCount}개의 재활 목표`)
              }
              
              throw new Error(`이 직원과 연결된 데이터가 있어 삭제할 수 없습니다: ${relatedData.join(', ')}`)
            } else if (selectedUser.role === 'administrator') {
              // 공지사항 확인
              const { count: announcementCount } = await supabase
                .from('announcements')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', selectedUser.id)
              
              if (announcementCount && announcementCount > 0) {
                throw new Error(`이 관리자가 작성한 ${announcementCount}개의 공지사항이 있어 삭제할 수 없습니다.`)
              }
            }
            
            throw new Error('연결된 데이터로 인해 삭제할 수 없습니다.')
          }
          
          // RLS 정책 문제인 경우
          if (profileError.message.includes('policy')) {
            throw new Error('관리자 권한이 부족합니다. RLS 정책을 확인하세요.')
          }
          
          throw new Error(`프로필 삭제 실패: ${profileError.message}`)
        }
      }

      // 3. 역할 삭제
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id)

      if (roleError && !roleError.message.includes('No rows')) {
        console.error("user_roles 삭제 오류:", roleError)
        throw new Error(`역할 삭제 실패: ${roleError.message}`)
      }

      // 4. Supabase Auth 계정 삭제 (승인된 사용자의 경우)
      if (selectedUser.role !== 'pending') {
        if (supabaseAdmin) {
          try {
            const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(selectedUser.id)
            
            if (authDeleteError) {
              console.error("Auth 계정 삭제 오류:", authDeleteError)
              // Auth 삭제 실패해도 다른 삭제는 성공했으므로 경고 메시지로 처리
              toast({
                title: '부분 삭제 완료',
                description: `${selectedUser.fullName}님의 프로필은 삭제되었지만, Auth 계정 삭제에 실패했습니다.`,
                variant: 'destructive'
              })
            } else {
              toast({
                title: '삭제 완료',
                description: `${selectedUser.fullName}님의 모든 계정 정보가 완전히 삭제되었습니다.`
              })
            }
          } catch (authError) {
            console.error("Auth 삭제 중 예외:", authError)
            toast({
              title: '부분 삭제 완료', 
              description: `${selectedUser.fullName}님의 프로필은 삭제되었지만, Auth 계정 삭제 중 오류가 발생했습니다.`,
              variant: 'destructive'
            })
          }
        } else {
          // Service Role Key가 없는 경우
          toast({
            title: '부분 삭제 완료',
            description: `${selectedUser.fullName}님의 프로필은 삭제되었습니다. Auth 계정 삭제를 위해서는 Service Role Key가 필요합니다.`,
            variant: 'default'
          })
        }
      } else {
        toast({
          title: '삭제 완료',
          description: `${selectedUser.fullName}님의 가입 신청이 삭제되었습니다.`
        })
      }


      setShowDeleteDialog(false)
      loadUsers()

    } catch (error: unknown) {
      console.error("삭제 중 오류 발생:", error)
      
      const errorMessage = error instanceof Error ? error.message : '사용자 삭제 중 오류가 발생했습니다.'
      
      toast({
        title: '삭제 실패',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  const handleApproveUser = async (user: User) => {
    if (!user.requestedRole) return
    
    try {
      // 1. signup_requests에서 신청 정보 가져오기 (email로 조회)
      const { data: request, error: fetchError } = await supabase
        .from('signup_requests')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'pending')
        .single()

      if (fetchError || !request) {
        throw new Error('신청 정보를 찾을 수 없습니다.')
      }

      // 2. user_id가 없으면 수동으로 연결 (트리거가 실행되지 않은 경우의 백업)
      let userId = request.user_id
      
      if (!userId) {
        // 이메일이 확인된 사용자 ID를 직접 조회 (서버 함수 사용)
        const { data, error } = await supabase.rpc('get_user_id_by_email', {
          user_email: request.email
        })

        if (error || !data) {
          throw new Error('사용자가 이메일 확인을 완료하지 않았습니다. 사용자에게 이메일 확인을 요청해주세요.')
        }

        userId = data

        // signup_requests에 user_id 업데이트
        const { error: updateUserIdError } = await supabase
          .from('signup_requests')
          .update({ user_id: userId })
          .eq('id', request.id)

        if (updateUserIdError) {
          console.error('user_id 업데이트 실패:', updateUserIdError)
        }
      }

      // Get role ID from database
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('role_name', user.requestedRole)
        .single()
      
      if (roleError || !roleData) {
        throw new Error('역할 조회 실패')
      }

      // 3. user_roles에 역할 할당
      const { error: roleAssignError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleData.id
        })

      if (roleAssignError && !roleAssignError.message.includes('duplicate')) {
        throw roleAssignError
      }

      // 4. 프로필 생성
      const table = getUserTable(user.requestedRole)
      
      // administrators 테이블은 employee_id, department, contact_number 컬럼이 없음
      const profileData = table === 'administrators' 
        ? {
            user_id: userId,
            full_name: request.full_name,
            is_active: true
          }
        : {
            user_id: userId,
            full_name: request.full_name,
            employee_id: request.employee_id || null,
            department: request.department || null,
            contact_number: request.contact_number || null,
            is_active: true
          }
      
      const { error: profileError } = await supabase
        .from(table)
        .insert(profileData)

      if (profileError && !profileError.message.includes('duplicate')) {
        throw profileError
      }

      // 5. signup_requests 상태 업데이트
      const { error: updateError } = await supabase
        .from('signup_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          review_notes: '승인 완료'
        })
        .eq('id', request.id)

      if (updateError) throw updateError

      toast({
        title: '성공',
        description: `${user.fullName}님의 ${ROLE_NAMES[user.requestedRole as UserRole] || user.requestedRole} 역할이 승인되었습니다.`
      })

      loadUsers()

    } catch (error) {
      console.error("Error occurred:", error)
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '사용자 승인 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.employeeId && user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = filterRole === 'all' || user.role === filterRole

    return matchesSearch && matchesRole
  })


  if (loading) {
    return <LoadingSpinner message="사용자 목록을 불러오는 중..." />
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-gray-600 mt-2">시스템 사용자를 관리하고 권한을 설정합니다</p>
        </div>
        <Button onClick={() => window.location.href = '/auth/sign-up'}>
          <UserPlus className="w-4 h-4 mr-2" />
          새 사용자 추가
        </Button>
      </div>

      {/* 필터 및 검색 */}
      <UserFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterRole={filterRole}
        onFilterRoleChange={setFilterRole}
        onRefresh={loadUsers}
      />

      {/* 사용자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
          <CardDescription>총 {filteredUsers.length}명의 사용자</CardDescription>
        </CardHeader>
        <CardContent>
          <UserTable
            users={filteredUsers}
            onEdit={handleEditUser}
            onDelete={(user) => {
              setSelectedUser(user)
              setShowDeleteDialog(true)
            }}
            onApprove={handleApproveUser}
          />
        </CardContent>
      </Card>

      {/* 수정 대화상자 */}
      <UserEditDialog
        user={selectedUser}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleUpdateUser}
      />

      {/* 삭제 확인 대화상자 */}
      <UserDeleteDialog
        user={selectedUser}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDelete={handleDeleteUser}
      />
    </div>
  )
}
