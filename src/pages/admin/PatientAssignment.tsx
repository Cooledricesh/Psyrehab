'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Users, UserCheck, UserX, Search, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { handleApiError } from '@/utils/error-handler'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Patient {
  id: string
  patient_identifier: string
  full_name: string
  primary_social_worker_id: string | null
  status: string
  social_worker?: {
    user_id: string
    full_name: string
  }
}

interface SocialWorker {
  user_id: string
  full_name: string
  is_active: boolean
  patient_count?: number
}

export default function PatientAssignment() {  const [patients, setPatients] = useState<Patient[]>([])
  const [socialWorkers, setSocialWorkers] = useState<SocialWorker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState<string>('all')
  const [assigningPatientId, setAssigningPatientId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // 환자 목록 조회
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select(`
          id,
          patient_identifier,
          full_name,
          primary_social_worker_id,
          status,
          social_worker:primary_social_worker_id(
            user_id,
            full_name
          )
        `)
        .order('full_name')

      if (patientsError) throw patientsError

      // 사회복지사 목록 조회
      const { data: workersData, error: workersError } = await supabase
        .from('social_workers')
        .select('*')
        .eq('is_active', true)
        .order('full_name')
      if (workersError) throw workersError
      
      // 각 사회복지사의 역할 확인
      const workersWithRoles = await Promise.all(
        (workersData || []).map(async (worker) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select(`
              roles (
                role_name
              )
            `)
            .eq('user_id', worker.user_id)
            .single()
          
          return {
            ...worker,
            role_name: roleData?.roles?.role_name
          }
        })
      )
      
      // 사원, 주임, 계장만 필터링 (과장 이상 제외)
      const filteredWorkers = workersWithRoles.filter(worker => {
        return worker.role_name === 'staff' || worker.role_name === 'assistant_manager' || worker.role_name === 'section_chief'
      })

      // 각 사회복지사별 담당 환자 수 계산
      const workerPatientCounts = new Map<string, number>()
      patientsData?.forEach(patient => {
        if (patient.primary_social_worker_id) {
          const count = workerPatientCounts.get(patient.primary_social_worker_id) || 0
          workerPatientCounts.set(patient.primary_social_worker_id, count + 1)
        }
      })

      // 사회복지사 목록에 환자 수 추가
      const workersWithCount = filteredWorkers?.map(worker => ({
        ...worker,
        patient_count: workerPatientCounts.get(worker.user_id) || 0
      }))

      setPatients(patientsData || [])
      setSocialWorkers(workersWithCount || [])

    } catch (error: unknown) {
      handleApiError(error, 'PatientAssignment.loadData')
      toast.error('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }
  const assignPatient = async (patientId: string, socialWorkerId: string | null) => {
    try {
      setAssigningPatientId(patientId)

      const { error } = await supabase
        .from('patients')
        .update({ 
          primary_social_worker_id: socialWorkerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId)

      if (error) throw error

      toast.success(socialWorkerId ? '담당 사회복지사가 배정되었습니다.' : '담당 사회복지사 배정이 해제되었습니다.')
      await loadData()

    } catch (error: unknown) {
      handleApiError(error, 'PatientAssignment.assignPatient')
      toast.error('배정 중 오류가 발생했습니다.')
    } finally {
      setAssigningPatientId(null)
    }
  }

  // 필터링된 환자 목록
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.patient_identifier.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesWorkerFilter = selectedWorkerFilter === 'all' ||
                               (selectedWorkerFilter === 'unassigned' && !patient.primary_social_worker_id) ||
                               (selectedWorkerFilter !== 'unassigned' && patient.primary_social_worker_id === selectedWorkerFilter)
    
    return matchesSearch && matchesWorkerFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">환자 담당 배정 관리</h1>
        <p className="text-gray-600">환자별 담당 사회복지사를 배정하거나 변경할 수 있습니다.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">전체 환자</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">배정된 환자</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patients.filter(p => p.primary_social_worker_id).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">미배정 환자</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patients.filter(p => !p.primary_social_worker_id).length}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>환자 목록</CardTitle>
          <CardDescription>환자를 검색하고 담당 사회복지사를 배정하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="환자명 또는 환자번호로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedWorkerFilter} onValueChange={setSelectedWorkerFilter}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="담당자 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 환자</SelectItem>
                <SelectItem value="unassigned">미배정 환자</SelectItem>
                <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">사회복지사별</div>
                {socialWorkers.map(worker => (
                  <SelectItem key={worker.user_id} value={worker.user_id}>
                    {worker.full_name} ({worker.patient_count || 0}명)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {/* 환자 목록 테이블 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>환자번호</TableHead>
                  <TableHead>환자명</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>담당 사회복지사</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      검색 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map(patient => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.patient_identifier}</TableCell>
                      <TableCell>{patient.full_name}</TableCell>
                      <TableCell>
                        <Badge variant={patient.status === 'active' || patient.status === 'pending' ? 'default' : 'secondary'}>
                          {patient.status === 'active' || patient.status === 'pending' ? '활성' : '비활성'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {patient.social_worker ? (
                          <span className="text-sm">{patient.social_worker.full_name}</span>
                        ) : (
                          <span className="text-sm text-gray-500">미배정</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={patient.primary_social_worker_id || 'unassigned'}
                          onValueChange={(value) => {
                            const workerId = value === 'unassigned' ? null : value
                            assignPatient(patient.id, workerId)
                          }}
                          disabled={assigningPatientId === patient.id}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">미배정</SelectItem>
                            {socialWorkers.map(worker => (
                              <SelectItem key={worker.user_id} value={worker.user_id}>
                                {worker.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}