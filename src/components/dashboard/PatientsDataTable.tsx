import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  Users,
  Calendar,
  Target,
  UserPlus
} from 'lucide-react'
import { getPatients, getPatientStats } from '@/services/patient-management'
import type { Patient, PatientStats } from '@/services/patient-management'
import { supabase } from '@/lib/supabase'
import PatientRegistrationModal from '@/components/PatientRegistrationModal'
import { eventBus, EVENTS } from '@/lib/eventBus'

interface PatientWithGoal extends Patient {
  activeGoal?: {
    id: string
    title: string
    start_date: string
    goal_type: 'weekly' | 'monthly' | 'six_month'
  }
}

export function PatientsDataTable() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<PatientWithGoal[]>([])
  const [stats, setStats] = useState<PatientStats>({
    totalPatients: 0,
    activePatients: 0,
    pendingPatients: 0,
    completedPatients: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [canViewAssignee, setCanViewAssignee] = useState(false)
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)

  useEffect(() => {
    checkUserRole()
    fetchData()
    
    // 이벤트 리스너 등록
    const handleStatusChange = () => fetchData()
    eventBus.on(EVENTS.PATIENT_STATUS_CHANGED, handleStatusChange)
    
    return () => {
      eventBus.off(EVENTS.PATIENT_STATUS_CHANGED, handleStatusChange)
    }
  }, [])
  
  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select(`
          roles (
            role_name
          )
        `)
        .eq('user_id', user.id)
        .single()
      
      const roleName = (userRoleData as any)?.roles?.role_name
      const managementRoles = ['section_chief', 'manager_level', 'department_head', 'vice_director', 'director', 'administrator']
      setCanViewAssignee(managementRoles.includes(roleName))
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // 환자 목록과 통계를 병렬로 가져오기
      const [patientsResult, statsResult] = await Promise.all([
        getPatients(),
        getPatientStats()
      ])
      
      // 각 환자의 6개월 목표 정보 가져오기
      const patientsWithGoals = await Promise.all(
        patientsResult.map(async (patient) => {
          try {
            const { data: goalData, error } = await supabase
              .from('rehabilitation_goals')
              .select('id, title, start_date, goal_type')
              .eq('patient_id', patient.id)
              .eq('goal_type', 'six_month')
              .in('status', ['active'])
              .maybeSingle()
            
            if (error) {
              console.error(`목표 조회 실패 - 환자 ${patient.id}:`, error)
              return { ...patient, activeGoal: undefined } as PatientWithGoal
            }
            
            return {
              ...patient,
              activeGoal: goalData ? {
                id: goalData.id,
                title: goalData.title,
                start_date: goalData.start_date,
                goal_type: goalData.goal_type as 'weekly' | 'monthly' | 'six_month'
              } : undefined
            } as PatientWithGoal
          } catch (err) {
            console.error(`목표 조회 중 예외 발생 - 환자 ${patient.id}:`, err)
            return { ...patient, activeGoal: undefined } as PatientWithGoal
          }
        })
      )

      setPatients(patientsWithGoals)
      setStats(statsResult)
    } catch (err) {
      console.error('환자 데이터 로드 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.social_worker?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesStatus = true
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        matchesStatus = patient.hasActiveGoal === true
      } else if (statusFilter === 'pending') {
        matchesStatus = patient.hasActiveGoal === false && patient.status !== 'completed'
      } else if (statusFilter === 'completed') {
        matchesStatus = patient.status === 'completed'
      }
    }
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (patient: PatientWithGoal) => {
    if (patient.status === 'completed') {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">입원 중</Badge>
    } else if (patient.hasActiveGoal) {
      return <Badge variant="default" className="bg-green-100 text-green-800">목표 진행 중</Badge>
    } else {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">목표 설정 대기</Badge>
    }
  }
  
  const getGenderText = (gender: string) => {
    if (!gender) return '-'
    
    switch (gender.toLowerCase()) {
      case 'male':
      case 'm':
      case '남성':
      case '남':
      case 'man':
      case '1':
        return '남성'
      case 'female':
      case 'f':
      case '여성':
      case '여':
      case 'woman':
      case '2':
        return '여성'
      case 'other':
      case '기타':
      case '0':
        return '기타'
      default:
        return gender
    }
  }

  const handleCloseModals = () => {
    setIsRegistrationModalOpen(false)
    fetchData()
  }
  
  const handleViewDetail = (patientId: string) => {
    navigate(`/patients/${patientId}`)
  }
  
  const handleGoalSetting = (patientId: string) => {
    navigate(`/patients/${patientId}/goals`)
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>회원 목록</CardTitle>
          <CardDescription>등록된 회원들의 상세 정보</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col space-y-1.5 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              회원 목록
            </CardTitle>
            <CardDescription>
              총 {stats.totalPatients}명의 회원이 등록되어 있습니다
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              내보내기
            </Button>
            <Button size="sm" onClick={() => setIsRegistrationModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              회원 추가
            </Button>
          </div>
        </div>
        
        {/* 필터 및 검색 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="회원명, 진단명 또는 담당자로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'pending', 'completed'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? '전체' :
                 status === 'active' ? '목표 진행 중' :
                 status === 'pending' ? '목표 설정 대기' : '입원 중'}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>환자명</TableHead>
                <TableHead>나이</TableHead>
                <TableHead>성별</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>6개월 목표</TableHead>
                <TableHead>목표 시작 날짜</TableHead>
                {canViewAssignee && <TableHead>담당자</TableHead>}
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canViewAssignee ? 8 : 7} className="h-24 text-center">
                    검색 조건에 맞는 회원이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.age ? `${patient.age}세` : '-'}</TableCell>
                    <TableCell>{getGenderText(patient.gender || '')}</TableCell>
                    <TableCell>{getStatusBadge(patient)}</TableCell>
                    <TableCell>
                      {patient.activeGoal ? (
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{patient.activeGoal.title}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {patient.activeGoal ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(patient.activeGoal.start_date).toLocaleDateString('ko-KR')}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    {canViewAssignee && (
                      <TableCell>
                        {patient.social_worker?.full_name || '미배정'}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">메뉴 열기</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>작업</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetail(patient.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            상세보기
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            정보수정
                          </DropdownMenuItem>
                          {!patient.hasActiveGoal && patient.status !== 'completed' && (
                            <DropdownMenuItem onClick={() => handleGoalSetting(patient.id)}>
                              <Target className="mr-2 h-4 w-4" />
                              목표 설정
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            보고서 생성
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* 테이블 하단 통계 */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.activePatients}
              </div>
              <div className="text-sm text-gray-500">목표 진행 중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingPatients}
              </div>
              <div className="text-sm text-gray-500">목표 설정 대기</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.completedPatients}
              </div>
              <div className="text-sm text-gray-500">입원 중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalPatients}
              </div>
              <div className="text-sm text-gray-500">전체 회원</div>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* 회원 등록 모달 */}
      <PatientRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={handleCloseModals}
        onSuccess={handleCloseModals}
      />
    </Card>
  )
}