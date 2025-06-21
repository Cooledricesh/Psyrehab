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

interface User {
  id: string
  email: string
  fullName: string
  role: 'social_worker' | 'administrator' | 'patient' | 'pending'
  roleId: string
  isActive: boolean
  createdAt: string
  employeeId?: string
  department?: string
  contactNumber?: string
  patientCount?: number
  needsApproval?: boolean
  requestedRole?: 'social_worker' | 'administrator'  // 요청한 역할 추가
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
    isActive: true
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

      // 승인 대기 중인 신청서 조회
      console.log('Fetching pending signup requests...')
      const { data: pendingRequests, error: requestError } = await supabase
        .from('signup_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      console.log('Pending requests:', pendingRequests)
      console.log('Request error:', requestError)

      if (requestError) throw requestError

      // 승인 대기 사용자 변환
      const pendingUsers: User[] = (pendingRequests || []).map(request => ({
        id: request.user_id,
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
          role: 'social_worker' as const,
          roleId: '6a5037f6-5553-47f9-824f-bf1e767bda95',
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
          role: 'administrator' as const,
          roleId: 'd7fcf425-85bc-42b4-8806-917ef6939a40',
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

    } catch {
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
      isActive: user.isActive
    })
    setShowEditDialog(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      const table = selectedUser.role === 'social_worker' ? 'social_workers' : 'administrators'
      
      const { error } = await supabase
        .from(table)
        .update({
          full_name: editFormData.fullName,
          department: editFormData.department || null,
          contact_number: editFormData.contactNumber || null,
          is_active: editFormData.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', selectedUser.id)

      if (error) throw error

      toast({
        title: '성공',
        description: '사용자 정보가 업데이트되었습니다.'
      })

      setShowEditDialog(false)
      loadUsers()

    } catch {
      console.error("Error occurred")
      toast({
        title: '오류',
        description: '사용자 정보 업데이트 중 오류가 발생했습니다.',
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
          description: '담당 환자가 있는 사회복지사는 삭제할 수 없습니다.',
          variant: 'destructive'
        })
        return
      }

      console.log('삭제 시작:', selectedUser.id, selectedUser.fullName, selectedUser.role)

      // 1. 프로필 먼저 삭제 (외래키 제약 때문에)
      if (selectedUser.role !== 'pending') {
        const table = selectedUser.role === 'social_worker' ? 'social_workers' : 'administrators'
        
        // 먼저 데이터 존재 여부 확인
        const { data: existingProfile, error: checkError } = await supabase
          .from(table)
          .select('user_id')
          .eq('user_id', selectedUser.id)
          .single()
        
        console.log(`${table} 테이블에서 ${selectedUser.id} 확인:`, existingProfile, checkError)
        
        if (existingProfile) {
          console.log(`${table}에서 삭제 시도 중...`)
          const { error: profileError } = await supabase
            .from(table)
            .delete()
            .eq('user_id', selectedUser.id)

          if (profileError) {
            console.error("Error occurred")
            // RLS 정책 문제인 경우 더 명확한 에러 메시지
            if (profileError.message.includes('policy')) {
              throw new Error('관리자 권한이 부족합니다. RLS 정책을 확인하세요.')
            }
            throw new Error(`프로필 삭제 실패: ${profileError.message}`)
          }
          console.log(`${table} 프로필 삭제 성공`)
        } else {
          console.log(`${table}에 프로필이 없음`)
        }
      }

      // 2. 역할 삭제
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id)

      if (roleError) {
        console.error("Error occurred")
        // "No rows" 에러가 아닌 경우에만 실제 에러로 처리
        if (!roleError.message.includes('No rows') && !roleError.message.includes('0 rows')) {
          throw new Error(`역할 삭제 실패: ${roleError.message}`)
        }
      }
      console.log('user_roles 삭제 성공 또는 없음')

      // 3. signup_requests에서도 삭제
      const { error: requestError } = await supabase
        .from('signup_requests')
        .delete()
        .eq('user_id', selectedUser.id)

      if (requestError) {
        console.error("Error occurred")
        // "No rows" 에러가 아닌 경우에만 실제 에러로 처리
        if (!requestError.message.includes('No rows') && !requestError.message.includes('0 rows')) {
          throw new Error(`신청서 삭제 실패: ${requestError.message}`)
        }
      }
      console.log('signup_requests 삭제 성공 또는 없음')

      // 4. Auth 사용자는 클라이언트에서 삭제 불가
      // Supabase Dashboard에서 수동으로 삭제해야 함

      console.log('사용자 삭제 완료:', selectedUser.fullName)

      toast({
        title: '삭제 성공',
        description: `${selectedUser.fullName}님의 프로필이 삭제되었습니다. Auth 계정은 Supabase Dashboard에서 삭제해주세요.`,
        duration: 5000
      })

      setShowDeleteDialog(false)
      loadUsers()

    } catch (error: unknown) {
      console.error("Error occurred")
      toast({
        title: '삭제 실패',
        description: error.message || '사용자 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
        duration: 5000
      })
    }
  }

  const handleApproveUser = async (user: User) => {
    if (!user.requestedRole) return
    
    try {
      // 1. signup_requests에서 신청 정보 가져오기
      const { data: request, error: fetchError } = await supabase
        .from('signup_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

      if (fetchError || !request) {
        throw new Error('신청 정보를 찾을 수 없습니다.')
      }

      const roleMap = {
        'social_worker': '6a5037f6-5553-47f9-824f-bf1e767bda95',
        'administrator': 'd7fcf425-85bc-42b4-8806-917ef6939a40'
      }

      // 2. user_roles에 역할 할당
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role_id: roleMap[user.requestedRole]
        })

      if (roleError) throw roleError

      // 3. 프로필 생성
      const table = user.requestedRole === 'social_worker' ? 'social_workers' : 'administrators'
      const { error: profileError } = await supabase
        .from(table)
        .insert({
          user_id: user.id,
          full_name: request.full_name,
          employee_id: request.employee_id,
          department: request.department,
          contact_number: request.contact_number,
          is_active: true
        })

      if (profileError) throw profileError

      // 4. signup_requests 상태 업데이트
      const { error: updateError } = await supabase
        .from('signup_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', request.id)

      if (updateError) throw updateError

      toast({
        title: '성공',
        description: `${user.fullName}님의 ${user.requestedRole === 'social_worker' ? '사회복지사' : '관리자'} 역할이 승인되었습니다.`
      })

      loadUsers()

    } catch (error: unknown) {
      console.error("Error occurred")
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
    const badges = {
      social_worker: <Badge className="bg-blue-100 text-blue-800">사회복지사</Badge>,
      administrator: <Badge className="bg-purple-100 text-purple-800">관리자</Badge>,
      patient: <Badge className="bg-green-100 text-green-800">환자</Badge>,
      pending: <Badge className="bg-yellow-100 text-yellow-800">승인 대기</Badge>
    }
    return badges[role as keyof typeof badges]
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
                <SelectItem value="social_worker">사회복지사</SelectItem>
                <SelectItem value="administrator">관리자</SelectItem>
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
