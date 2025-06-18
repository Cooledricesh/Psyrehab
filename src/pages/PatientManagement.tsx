import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getPatients, getPatientStats, updatePatientStatus } from '@/services/patient-management'
import type { Patient, PatientStats } from '@/services/patient-management'
import PatientRegistrationModal from '@/components/PatientRegistrationModal'
import PatientDetailModal from '@/components/PatientDetailModal'
import PatientEditModal from '@/components/PatientEditModal'
import { eventBus, EVENTS } from '@/lib/eventBus'
import { GoalService } from '@/services/goalSetting'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function PatientManagement() {
  const { isAuthenticated, loading: authLoading, hasPermission, isRole } = useUnifiedAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [stats, setStats] = useState<PatientStats>({
    totalPatients: 0,
    activePatients: 0,
    inactivePatients: 0,
    completedPatients: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user has permission to access patient management
  const canAccessPatients = hasPermission('patients:read') || isRole('social_worker') || isRole('administrator')
  const canEditPatients = hasPermission('patients:write') || isRole('social_worker') || isRole('administrator')
  const canRegisterPatients = hasPermission('patients:create') || isRole('social_worker') || isRole('administrator')
  
  // 모달 상태 관리
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

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
    } catch (err) {
      console.error('❌ 환자 데이터 로드 실패:', err)
      const errorMessage = err instanceof Error ? err.message : '환자 데이터를 불러오는 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 모달 핸들러들
  const handleViewDetail = (patientId: string) => {
    setSelectedPatientId(patientId)
    setIsDetailModalOpen(true)
  }

  const handleEditPatient = (patientId: string) => {
    setSelectedPatientId(patientId)
    setIsEditModalOpen(true)
  }

  const handleEditFromDetail = () => {
    setIsDetailModalOpen(false)
    setIsEditModalOpen(true)
  }

  const handleStatusChange = async (patientId: string, newStatus: string) => {
    try {
      // UI 상태를 DB 상태로 변환
      let dbStatus: 'active' | 'inactive' | 'discharged'
      if (newStatus === 'discharged') {
        dbStatus = 'discharged'
        
        // 입원 처리 시 활성 목표들을 비활성화
        await GoalService.holdPatientGoals(patientId)
      } else if (newStatus === 'inactive') {
        dbStatus = 'inactive'
      } else {
        dbStatus = 'active'
      }
      
      await updatePatientStatus(patientId, dbStatus)
      await fetchData() // 데이터 새로고침
      
      // 상태 변경 이벤트 발생
      eventBus.emit(EVENTS.PATIENT_STATUS_CHANGED, { patientId, newStatus: dbStatus })
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleCloseModals = () => {
    setIsRegistrationModalOpen(false)
    setIsDetailModalOpen(false)
    setIsEditModalOpen(false)
    setSelectedPatientId(null)
  }

  const handleRefreshData = () => {
    fetchData()
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '활성'
      case 'inactive':
        return '비활성'
      case 'completed':
        return '완료'
      default:
        return '알 수 없음'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 환자의 실제 상태를 계산하는 함수 추가
  const getPatientDisplayStatus = (patient: Patient): string => {
    // 환자 목록에서 각 환자의 목표 상태를 확인하여 표시 상태 결정
    // 이 정보는 서버에서 계산해서 보내주는 것이 이상적이지만,
    // 현재는 클라이언트에서 처리
    if (patient.status === 'completed') {
      return 'completed'
    }
    // TODO: 목표 유무에 따른 상태 구분 필요
    // 현재는 DB status를 그대로 사용
    return patient.status
  }

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <div className="text-lg text-gray-600">인증 정보를 확인하는 중...</div>
        </div>
      </div>
    )
  }

  // Check authentication and permissions
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600">이 페이지에 접근하려면 로그인해주세요.</p>
        </div>
      </div>
    )
  }

  if (!canAccessPatients) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600">환자 관리 기능에 접근할 권한이 없습니다.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <div className="text-lg text-gray-600">환자 데이터를 불러오는 중...</div>
        </div>
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
        {canRegisterPatients && (
          <Button onClick={() => setIsRegistrationModalOpen(true)}>
            새 회원 등록
          </Button>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">담당 회원수</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">목표 진행 중</p>
              <p className="text-2xl font-bold text-green-600">{stats.activePatients}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">목표 설정 대기</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactivePatients}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">입원 중</p>
              <p className="text-2xl font-bold text-blue-600">{stats.completedPatients}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 환자 목록 테이블 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">회원 목록</h2>
        </div>
        
        {patients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">등록된 회원이 없습니다.</p>
            {canRegisterPatients && (
              <Button 
                onClick={() => setIsRegistrationModalOpen(true)}
                className="mt-4"
              >
                첫 번째 회원 등록하기
              </Button>
            )}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.registration_date}</div>
                    </td>
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
                          상세
                        </button>
                        {canEditPatients && (
                          <button
                            onClick={() => handleEditPatient(patient.id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            편집
                          </button>
                        )}
                        {canEditPatients && patient.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusChange(patient.id, 'discharged')}
                            className="text-red-600 hover:text-red-900"
                          >
                            입원
                          </button>
                        )}
                        {canEditPatients && patient.status === 'completed' && (
                          <button
                            onClick={() => handleStatusChange(patient.id, 'inactive')}
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

      {/* 모달들 */}
      <PatientRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={handleCloseModals}
        onSuccess={handleRefreshData}
      />

      {selectedPatientId && (
        <>
          <PatientDetailModal
            isOpen={isDetailModalOpen}
            onClose={handleCloseModals}
            patientId={selectedPatientId}
            onEdit={handleEditFromDetail}
          />

          <PatientEditModal
            isOpen={isEditModalOpen}
            onClose={handleCloseModals}
            patientId={selectedPatientId}
            onSuccess={handleRefreshData}
          />
        </>
      )}
    </div>
  )
} 