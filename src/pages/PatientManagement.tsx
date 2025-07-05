import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { getPatients, getPatientStats, updatePatientStatus } from '@/services/patient-management'
import type { Patient, PatientStats } from '@/services/patient-management'
import PatientRegistrationModal from '@/components/PatientRegistrationModal'
import { eventBus, EVENTS } from '@/lib/eventBus'
import { GoalService } from '@/services/goalSetting';
import { supabase } from '@/lib/supabase'

export default function PatientManagement() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [stats, setStats] = useState<PatientStats>({
    totalPatients: 0,
    activePatients: 0,
    inactivePatients: 0,
    completedPatients: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canViewAssignee, setCanViewAssignee] = useState(false)
  
  // 모달 상태 관리
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)

  useEffect(() => {
    checkUserRole()
    fetchData()
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
      // 계장 이상 직급인지 확인
      const managementRoles = ['section_chief', 'manager_level', 'department_head', 'vice_director', 'director', 'administrator']
      setCanViewAssignee(managementRoles.includes(roleName))
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('🔍 환자 데이터 가져오기 시작...')
      
      // 환자 목록과 통계를 병렬로 가져오기
      const [patientsResult, statsResult] = await Promise.all([
        getPatients(),
        getPatientStats()
      ])

      console.log('✅ 환자 목록 로드 성공:', patientsResult.length, '명')
      console.log('✅ 환자 통계 로드 성공:', statsResult)

      setPatients(patientsResult)
      setStats(statsResult)
      setError(null)
    } catch (err: unknown) {
      console.error('❌ 환자 데이터 로드 실패:', err)
      setError((err as any).message || '환자 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 상세 페이지로 이동
  const handleViewDetail = (patientId: string) => {
    navigate(`/patients/${patientId}`)
  }


  const handleStatusChange = async (patientId: string, newStatus: string) => {
    try {
      // UI 상태를 DB 상태로 변환
      let dbStatus: 'active' | 'pending' | 'discharged'
      if (newStatus === 'discharged') {
        dbStatus = 'discharged'
      } else if (newStatus === 'pending') {
        dbStatus = 'pending'
      } else {
        dbStatus = 'active'
      }
      
      // patient-management.ts의 updatePatientStatus가 목표 삭제를 처리함
      await updatePatientStatus(patientId, dbStatus)
      await fetchData() // 데이터 새로고침
      
      // 상태 변경 이벤트 발생
      eventBus.emit(EVENTS.PATIENT_STATUS_CHANGED, { patientId, newStatus: dbStatus })
    } catch (error) {
      console.error("Error occurred:", error)
      alert('상태 변경에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleCloseModals = () => {
    setIsRegistrationModalOpen(false)
    fetchData() // 데이터 새로고침
  }

  const getGenderText = (gender: string) => {
    if (!gender) return '정보 없음'
    
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


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">환자 데이터를 불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchData} variant="outline">다시 시도</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
          <p className="text-gray-600 mt-1">등록된 회원들을 조회하고 관리할 수 있습니다.</p>
        </div>
        <Button onClick={() => setIsRegistrationModalOpen(true)}>
          새 회원 등록
        </Button>
      </div>

      {/* 환자 목록 테이블 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">회원 목록</h2>
        </div>
        
        {patients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">등록된 회원이 없습니다.</p>
            <Button 
              onClick={() => setIsRegistrationModalOpen(true)}
              className="mt-4"
            >
              첫 번째 회원 등록하기
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    회원명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    나이
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    성별
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    진단명
                  </th>
                  {canViewAssignee && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      담당자
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.age ? `${patient.age}세` : '정보 없음'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getGenderText(patient.gender || '')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.diagnosis}</div>
                    </td>
                    {canViewAssignee && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {patient.social_worker ? patient.social_worker.full_name : '미배정'}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold rounded px-2 py-1 ${
                          patient.status === 'completed' 
                            ? 'bg-blue-100 text-blue-800'
                            : patient.hasActiveGoal 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {patient.status === 'completed' 
                            ? '입원 중' 
                            : patient.hasActiveGoal 
                              ? '목표 진행 중' 
                              : '목표 설정 대기'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetail(patient.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          상세보기
                        </button>
                        {patient.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusChange(patient.id, 'discharged')}
                            className="text-red-600 hover:text-red-900"
                          >
                            퇴원
                          </button>
                        )}
                        {patient.status === 'completed' && (
                          <button
                            onClick={() => handleStatusChange(patient.id, 'pending')}
                            className="text-green-600 hover:text-green-900"
                          >
                            재등록
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 환자 등록 모달 */}
      <PatientRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={handleCloseModals}
        onSuccess={handleCloseModals}
      />
    </div>
  )
} 