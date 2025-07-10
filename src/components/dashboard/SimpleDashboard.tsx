import { useState, useEffect } from 'react'
import { getSocialWorkerDashboardStats, invalidateDashboardCache } from '@/services/socialWorkerDashboard'
import { Loader2, Target, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import type { SocialWorkerDashboardStats } from '@/services/socialWorkerDashboard'
import { eventBus, EVENTS } from '@/lib/eventBus'
import { handleApiError } from '@/utils/error-handler'

export function SimpleDashboard() {
  const [socialWorkerStats, setSocialWorkerStats] = useState<SocialWorkerDashboardStats | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // 사용자 역할 확인
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')
      
      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select(`
          roles (
            role_name
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle()
      
      interface UserRoleData {
        roles?: {
          role_name: string
        }
      }
      const roleName = (userRoleData as UserRoleData)?.roles?.role_name
      setUserRole(roleName)
      
      // 역할에 따라 다른 데이터 로드
      const allowedRoles = [
        'staff', 
        'assistant_manager', 
        'section_chief',
        'manager_level',
        'department_head',
        'vice_director',
        'director',
        'administrator'
      ]
      
      if (allowedRoles.includes(roleName)) {
        // 캐시 무효화 후 대시보드 데이터 로드
        invalidateDashboardCache(user.id)
        const swStats = await getSocialWorkerDashboardStats(user.id)
        setSocialWorkerStats(swStats)
      } else {
        // 다른 역할은 이 대시보드를 볼 수 없음
        setError('이 대시보드에 접근할 권한이 없습니다.')
      }
    } catch (error) {
      handleApiError(error, 'SimpleDashboard.fetchDashboardData')
      setError('대시보드 데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true
    
    const loadData = async () => {
      if (isActive) {
        await fetchDashboardData()
      }
    }
    
    loadData()
    
    // 목표 상태 변경 시 대시보드 새로고침
    const handleGoalStatusUpdate = () => {
      fetchDashboardData()
    }
    
    // 이벤트 리스너 등록
    eventBus.on(EVENTS.GOAL_STATUS_UPDATED, handleGoalStatusUpdate)
    eventBus.on(EVENTS.PATIENT_STATUS_CHANGED, handleGoalStatusUpdate)
    eventBus.on(EVENTS.MONTHLY_GOAL_COMPLETED, handleGoalStatusUpdate)
    
    return () => {
      isActive = false
      // 이벤트 리스너 해제
      eventBus.off(EVENTS.GOAL_STATUS_UPDATED, handleGoalStatusUpdate)
      eventBus.off(EVENTS.PATIENT_STATUS_CHANGED, handleGoalStatusUpdate)
      eventBus.off(EVENTS.MONTHLY_GOAL_COMPLETED, handleGoalStatusUpdate)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">통계를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">데이터 로딩 오류</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  // 사원/주임/관리자용 대시보드
  if ((userRole === 'staff' || userRole === 'assistant_manager' || userRole === 'administrator') && socialWorkerStats) {
    return (
      <div className="p-6">
        {/* 긴급 알림 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* 4주 연속 목표 달성 */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">대단해요!</h3>
                <p className="text-3xl font-bold text-green-600">
                  {socialWorkerStats.fourWeeksAchieved?.length || 0}명
                </p>
                <p className="text-sm text-gray-500 mt-1">4주 연속 달성 회원</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </div>

          {/* 주간 점검 미완료 */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500 cursor-pointer hover:shadow-lg transition-shadow"
               onClick={() => navigate('/progress-tracking')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">주간 체크 미완료</h3>
                <p className="text-3xl font-bold text-red-600">{socialWorkerStats.weeklyCheckPending.length}명</p>
                <p className="text-sm text-gray-500 mt-1">지난 주간 목표 점검 필요</p>
              </div>
              <Clock className="h-8 w-8 text-red-500 opacity-80" />
            </div>
          </div>

          {/* 4주 연속 실패 환자 */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500 cursor-pointer hover:shadow-lg transition-shadow"
               onClick={() => navigate('/progress-tracking')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">긴급 개입 필요</h3>
                <p className="text-3xl font-bold text-orange-600">{socialWorkerStats.consecutiveFailures.length}명</p>
                <p className="text-sm text-gray-500 mt-1">4주 연속 미달성 회원</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </div>

          {/* 목표 미설정 환자 */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500 cursor-pointer hover:shadow-lg transition-shadow"
               onClick={() => navigate('/goal-setting')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">목표 설정 필요</h3>
                <p className="text-3xl font-bold text-yellow-600">{socialWorkerStats.goalsNotSet.length}명</p>
                <p className="text-sm text-gray-500 mt-1">목표 미설정 회원</p>
              </div>
              <Target className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* 상세 정보 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 4주 연속 달성 환자 리스트 */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              4주 연속 목표 달성 회원
            </h2>
            {socialWorkerStats.fourWeeksAchieved?.length > 0 ? (
              <div className="space-y-2">
                {socialWorkerStats.fourWeeksAchieved.map((patient, index) => (
                  <div key={`achieved-${patient.goal_id}-${index}`} 
                       className="p-3 bg-green-50 rounded-lg hover:bg-green-100 cursor-pointer transition-colors"
                       onClick={() => navigate(`/patients/${patient.id}`)}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-600">{patient.goal_name}</p>
                      </div>
                      <span className="text-sm text-green-600 font-medium">우수</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">해당되는 환자가 없습니다.</p>
            )}
          </div>

          {/* 긴급 개입 필요 환자 리스트 */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              긴급 개입 필요 회원
            </h2>
            {socialWorkerStats.consecutiveFailures.length > 0 ? (
              <div className="space-y-2">
                {socialWorkerStats.consecutiveFailures.map((patient, index) => (
                  <div key={`failure-${patient.goal_id}-${index}`} 
                       className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 cursor-pointer transition-colors"
                       onClick={() => navigate(`/patients/${patient.id}`)}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-600">{patient.goal_name}</p>
                      </div>
                      <span className="text-sm text-orange-600 font-medium">긴급</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">해당되는 환자가 없습니다.</p>
            )}
          </div>
          
          {/* 주간 점검 미완료 환자 리스트 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-red-600" />
              주간 체크 미완료 회원
            </h2>
            {socialWorkerStats.weeklyCheckPending.length > 0 ? (
              <div className="space-y-2">
                {socialWorkerStats.weeklyCheckPending.slice(0, 5).map((patient, index) => (
                  <div key={`pending-${patient.goal_id}-${index}`} 
                       className="p-3 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                       onClick={() => navigate(`/patients/${patient.id}`)}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-600">목표: {patient.goal_name}</p>
                      </div>
                      <span className="text-sm text-red-600">점검 필요</span>
                    </div>
                  </div>
                ))}
                {socialWorkerStats.weeklyCheckPending.length > 5 && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    +{socialWorkerStats.weeklyCheckPending.length - 5}명 더 있음
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">모든 환자의 주간 점검이 완료되었습니다.</p>
            )}
          </div>

          {/* 목표 설정 필요 환자 리스트 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-yellow-600" />
              목표 설정 필요 회원
            </h2>
            {socialWorkerStats.goalsNotSet.length > 0 ? (
              <div className="space-y-2">
                {socialWorkerStats.goalsNotSet.slice(0, 5).map((patient, index) => (
                  <div key={`notset-${patient.id}-${index}`} 
                       className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 cursor-pointer transition-colors"
                       onClick={() => navigate(`/patients/${patient.id}`)}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-600">병록번호: {patient.patient_identifier}</p>
                      </div>
                      <span className="text-sm text-yellow-600 font-medium">목표 설정 대기</span>
                    </div>
                  </div>
                ))}
                {socialWorkerStats.goalsNotSet.length > 5 && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    +{socialWorkerStats.goalsNotSet.length - 5}명 더 있음
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">모든 회원이 목표 진행중입니다.</p>
            )}
          </div>
        </div>

        {/* 새로고침 버튼 */}
        <div className="mt-6 text-right">
          <button
            onClick={fetchDashboardData}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            🔄 통계 새로고침
          </button>
        </div>
      </div>
    )
  }

  // 데이터 로딩 실패 시 fallback
  return (
    <div className="p-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">대시보드 데이터를 불러올 수 없습니다.</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
} 