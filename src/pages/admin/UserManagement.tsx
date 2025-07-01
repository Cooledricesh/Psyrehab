'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { Search, UserPlus, Edit2, Trash2, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

import type { UserRole } from '@/types/auth'
import { ROLE_NAMES } from '@/types/auth'
import { UserManagementService } from '@/services'

interface User {
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
  requestedRole?: UserRole  // 요청한 역할 추가
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  // 수정 폼 데이터
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    department: '',
    contactNumber: '',
    isActive: true,
    role: '' as UserRole | ''
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)

      // 사회복지사 조회
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
        requestedRole: request.requested_role as 'social_worker' | 'administrator'
      }))
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

      setUsers(uniqueUsers)

    } catch (error) {
      console.error("Error in loadUsers:", error)
      console.error("Error occurred")
      toast({
        title: '오류',
        description: '사용자 목록을 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditFormData({
      fullName: user.fullName,
      department: user.department || '',
      contactNumber: user.contactNumber || '',
      isActive: user.isActive,
      role: user.role === 'pending' ? '' : user.role
    })
    setShowEditDialog(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      // 역할이 변경되었는지 확인
      const roleChanged = editFormData.role && editFormData.role !== selectedUser.role

      if (roleChanged) {
        // 역할 변경 처리
        const result = await UserManagementService.updateUserRole({
          userId: selectedUser.id,
          newRole: editFormData.role as UserRole
        })

        if (!result.success) {
          throw new Error(result.error || '역할 변경 실패')
        }
      }

      // 기본 정보 업데이트 (역할 변경 후 새로운 테이블에서)
      const table = roleChanged 
        ? (editFormData.role === 'administrator' || editFormData.role === 'director' || editFormData.role === 'vice_director' || editFormData.role === 'department_head' || editFormData.role === 'manager_level' || editFormData.role === 'section_chief'
          ? 'administrators' 
          : 'social_workers')
        : (selectedUser.role === 'staff' || selectedUser.role === 'assistant_manager' || selectedUser.role === 'social_worker' ? 'social_workers' : 'administrators')
      
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
        .eq('user_id', selectedUser.id)

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

      // 환자가 할당된 사회복지사는 삭제할 수 없음
      if (selectedUser.role === 'social_worker' && selectedUser.patientCount && selectedUser.patientCount > 0) {
        toast({
          title: '삭제 불가',
          description: `담당 환자가 ${selectedUser.patientCount}명 있는 사회복지사는 삭제할 수 없습니다. 먼저 환자를 다른 사회복지사에게 이관해주세요.`,
          variant: 'destructive'
        })
        setShowDeleteDialog(false)
        return
      }

      console.log('삭제 시작:', selectedUser.id, selectedUser.fullName, selectedUser.role)

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
        console.log('signup_requests 삭제 성공')
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
        const table = selectedUser.role === 'social_worker' ? 'social_workers' : 'administrators'
        
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
            if (selectedUser.role === 'social_worker') {
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
              
              throw new Error(`이 사회복지사와 연결된 데이터가 있어 삭제할 수 없습니다: ${relatedData.join(', ')}`)
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
        console.log(`${table} 프로필 삭제 성공`)
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
      console.log('user_roles 삭제 성공')

      // 4. Supabase Auth 계정 삭제 (승인된 사용자의 경우)
      if (selectedUser.role !== 'pending') {
        try {
          const { error: authDeleteError } = await supabase.auth.admin.deleteUser(selectedUser.id)
          
          if (authDeleteError) {
            console.error("Auth 계정 삭제 오류:", authDeleteError)
            // Auth 삭제 실패해도 다른 삭제는 성공했으므로 경고 메시지로 처리
            toast({
              title: '부분 삭제 완료',
              description: `${selectedUser.fullName}님의 프로필은 삭제되었지만, Auth 계정 삭제에 실패했습니다. Supabase Dashboard에서 수동으로 삭제해주세요.`,
              variant: 'destructive',
              duration: 8000
            })
          } else {
            console.log('Auth 계정 삭제 성공')
            toast({
              title: '삭제 완료',
              description: `${selectedUser.fullName}님의 모든 계정 정보가 완전히 삭제되었습니다.`,
              duration: 5000
            })
          }
        } catch (authError) {
          console.error("Auth 삭제 중 예외:", authError)
          toast({
            title: '부분 삭제 완료', 
            description: `${selectedUser.fullName}님의 프로필은 삭제되었지만, Auth 계정 삭제 중 오류가 발생했습니다.`,
            variant: 'destructive',
            duration: 8000
          })
        }
      } else {
        toast({
          title: '삭제 완료',
          description: `${selectedUser.fullName}님의 가입 신청이 삭제되었습니다.`,
          duration: 5000
        })
      }

      console.log('사용자 삭제 완료:', selectedUser.fullName)

      setShowDeleteDialog(false)
      loadUsers()

    } catch (error: unknown) {
      console.error("삭제 중 오류 발생:", error)
      
      const errorMessage = error instanceof Error ? error.message : '사용자 삭제 중 오류가 발생했습니다.'
      
      toast({
        title: '삭제 실패',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000
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

      const roleMap = {
        'social_worker': '6a5037f6-5553-47f9-824f-bf1e767bda95',
        'administrator': 'd7fcf425-85bc-42b4-8806-917ef6939a40'
      }

      // 3. user_roles에 역할 할당
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleMap[user.requestedRole as keyof typeof roleMap]
        })

      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError
      }

      // 4. 프로필 생성
      const table = user.requestedRole === 'social_worker' ? 'social_workers' : 'administrators'
      const { error: profileError } = await supabase
        .from(table)
        .insert({
          user_id: userId,
          full_name: request.full_name,
          employee_id: request.employee_id || null,
          department: request.department || null,
          contact_number: request.contact_number || null,
          is_active: true
        })

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
        description: `${user.fullName}님의 ${user.requestedRole === 'social_worker' ? '사회복지사' : '관리자'} 역할이 승인되었습니다.`
      })

      loadUsers()

    } catch (error: unknown) {
      console.error("Error occurred:", error)
      toast({
        title: '오류',
        description: error.message || '사용자 승인 중 오류가 발생했습니다.',
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

  const getRoleBadge = (role: string) => {
    const badges: Record<string, JSX.Element> = {
      social_worker: <Badge className="bg-blue-100 text-blue-800">사회복지사</Badge>,
      administrator: <Badge className="bg-purple-100 text-purple-800">관리자</Badge>,
      patient: <Badge className="bg-green-100 text-green-800">환자</Badge>,
      pending: <Badge className="bg-yellow-100 text-yellow-800">승인 대기</Badge>,
      staff: <Badge className="bg-gray-100 text-gray-800">사원</Badge>,
      assistant_manager: <Badge className="bg-indigo-100 text-indigo-800">주임</Badge>,
      section_chief: <Badge className="bg-cyan-100 text-cyan-800">계장</Badge>,
      manager_level: <Badge className="bg-teal-100 text-teal-800">과장</Badge>,
      department_head: <Badge className="bg-orange-100 text-orange-800">부장</Badge>,
      vice_director: <Badge className="bg-pink-100 text-pink-800">부원장</Badge>,
      director: <Badge className="bg-red-100 text-red-800">원장</Badge>,
      attending_physician: <Badge className="bg-emerald-100 text-emerald-800">주치의</Badge>
    }
    return badges[role] || <Badge>{role}</Badge>
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        활성
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        비활성
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">사용자 목록을 불러오는 중...</p>
        </div>
      </div>
    )
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
      <Card>
        <CardHeader>
          <CardTitle>사용자 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="이름, 이메일, 직원번호로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="역할 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="administrator">관리자</SelectItem>
                <SelectItem value="social_worker">사회복지사</SelectItem>
                <SelectItem value="staff">사원</SelectItem>
                <SelectItem value="assistant_manager">주임</SelectItem>
                <SelectItem value="section_chief">계장</SelectItem>
                <SelectItem value="manager_level">과장</SelectItem>
                <SelectItem value="department_head">부장</SelectItem>
                <SelectItem value="vice_director">부원장</SelectItem>
                <SelectItem value="director">원장</SelectItem>
                <SelectItem value="attending_physician">주치의</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadUsers}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
          <CardDescription>총 {filteredUsers.length}명의 사용자</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>직원번호</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>담당 환자</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{user.employeeId || '-'}</TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                  <TableCell>
                    {user.role === 'social_worker' ? `${user.patientCount || 0}명` : '-'}
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.needsApproval ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveUser(user)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {user.requestedRole === 'administrator' ? '관리자 승인' : '사회복지사 승인'}
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowDeleteDialog(true)
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 수정 대화상자 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>사용자 정보 수정</DialogTitle>
            <DialogDescription>
              {selectedUser?.fullName}님의 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">이름</Label>
              <Input
                id="fullName"
                value={editFormData.fullName}
                onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="role">역할</Label>
              <Select 
                value={editFormData.role || selectedUser?.role || ''} 
                onValueChange={(value) => setEditFormData({ ...editFormData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  {UserManagementService.getAvailableRoles().map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">부서</Label>
              <Input
                id="department"
                value={editFormData.department}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contactNumber">연락처</Label>
              <Input
                id="contactNumber"
                value={editFormData.contactNumber}
                onChange={(e) => setEditFormData({ ...editFormData, contactNumber: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={editFormData.isActive}
                onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isActive">활성 상태</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              취소
            </Button>
            <Button onClick={handleUpdateUser}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 대화상자 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white">  
          <DialogHeader>
            <DialogTitle>사용자 삭제</DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-start gap-3 mt-4">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p>정말로 <strong>{selectedUser?.fullName}</strong>을(를) 삭제하시겠습니까?</p>
                  <p className="mt-2 text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
