import { useState, useEffect } from 'react'
import { getDashboardStats } from '@/services/dashboard-stats'
import { getSocialWorkerDashboardStats } from '@/services/socialWorkerDashboard'
import { Loader2, Users, Target, Calendar, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import type { SocialWorkerDashboardStats } from '@/services/socialWorkerDashboard'

export function SimpleDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeGoals: 0,
    thisWeekSessions: 0,
    completionRate: 0
  })
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
      
      const roleName = (userRoleData as any)?.roles?.role_name
      setUserRole(roleName)
      
      // 역할에 따라 다른 데이터 로드
      if (roleName === 'staff' || roleName === 'assistant_manager') {
        // 사원/주임용 대시보드 데이터
        const swStats = await getSocialWorkerDashboardStats(user.id)
        setSocialWorkerStats(swStats)
      } else {
        // 기존 대시보드 데이터
        const dashboardData = await getDashboardStats()
        setStats(dashboardData)
      }
    } catch (error) {
      console.error("대시보드 데이터 로딩 오류:", error)
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
    
    return () => {
      isActive = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">대시보드</h1>
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
        <h1 className="text-2xl font-bold mb-4">대시보드</h1>
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

  // 사원/주임용 대시보드
  if ((userRole === 'staff' || userRole === 'assistant_manager') && socialWorkerStats) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">대시보드</h1>
        
        {/* 긴급 알림 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* 주간 점검 미완료 */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500 cursor-pointer hover:shadow-lg transition-shadow"
               onClick={() => navigate('/progress-tracking')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">주간 점검 미완료</h3>
                <p className="text-3xl font-bold text-red-600">{socialWorkerStats.weeklyCheckPending.length}</p>
                <p className="text-sm text-gray-500 mt-1">이번 주 점검 필요</p>
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
                <p className="text-3xl font-bold text-orange-600">{socialWorkerStats.consecutiveFailures.length}</p>
                <p className="text-sm text-gray-500 mt-1">4주 연속 목표 실패</p>
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
                <p className="text-3xl font-bold text-yellow-600">{socialWorkerStats.goalsNotSet.length}</p>
                <p className="text-sm text-gray-500 mt-1">목표가 없는 환자</p>
              </div>
              <Target className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </div>

          {/* 주간 달성률 */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">주간 달성률</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {socialWorkerStats.weeklyAchievementRate.total > 0 
                    ? Math.round((socialWorkerStats.weeklyAchievementRate.achieved / socialWorkerStats.weeklyAchievementRate.total) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-gray-500 mt-1">이번 주 목표 달성</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* 상세 정보 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 긴급 개입 필요 환자 리스트 */}
          {socialWorkerStats.consecutiveFailures.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                긴급 개입 필요 환자
              </h2>
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
            </div>
          )}
          
          {/* 주간 점검 미완료 환자 리스트 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-red-600" />
              주간 점검 미완료 환자
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

          {/* 주간 달성률 분포 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              주간 목표 달성률 분포
            </h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-gray-700 flex-1">달성</span>
                <span className="font-semibold text-green-600">
                  {socialWorkerStats.weeklyAchievementRate.achieved}명
                </span>
              </div>
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-gray-700 flex-1">미달성</span>
                <span className="font-semibold text-red-600">
                  {socialWorkerStats.weeklyAchievementRate.failed}명
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-700 flex-1">미점검</span>
                <span className="font-semibold text-gray-600">
                  {socialWorkerStats.weeklyAchievementRate.pending}명
                </span>
              </div>
              <div className="mt-4 pt-3 border-t">
                <p className="text-sm text-gray-600">
                  전체 {socialWorkerStats.weeklyAchievementRate.total}명 중
                  <span className="font-semibold text-green-600 ml-1">
                    {socialWorkerStats.weeklyAchievementRate.achieved}명
                  </span>이 목표를 달성했습니다.
                </p>
              </div>
            </div>
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

  // 기존 대시보드 (다른 역할용)
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">대시보드</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* 총 환자 수 */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">총 환자 수</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalPatients}</p>
              <p className="text-sm text-gray-500 mt-1">등록된 전체 환자</p>
            </div>
            <Users className="h-8 w-8 text-blue-500 opacity-80" />
          </div>
        </div>

        {/* 활성 목표 */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">활성 목표</h3>
              <p className="text-3xl font-bold text-green-600">{stats.activeGoals}</p>
              <p className="text-sm text-gray-500 mt-1">진행 중인 재활 목표</p>
            </div>
            <Target className="h-8 w-8 text-green-500 opacity-80" />
          </div>
        </div>

        {/* 이번 주 세션 */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">이번 주 세션</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.thisWeekSessions}</p>
              <p className="text-sm text-gray-500 mt-1">월요일부터 현재까지</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500 opacity-80" />
          </div>
        </div>

        {/* 완료율 */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">목표 완료율</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.completionRate}%</p>
              <p className="text-sm text-gray-500 mt-1">전체 목표 대비</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500 opacity-80" />
          </div>
        </div>
      </div>

      {/* 최근 활동 섹션 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-gray-600" />
          실시간 통계 요약
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600 mb-2">
              <span className="font-semibold text-blue-600">{stats.totalPatients}명</span>의 환자가 
              현재 시스템에 등록되어 있습니다.
            </p>
            <p className="text-gray-600">
              이 중 <span className="font-semibold text-green-600">{stats.activeGoals}개</span>의 
              재활 목표가 활발히 진행되고 있습니다.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600 mb-2">
              이번 주에는 총 <span className="font-semibold text-purple-600">{stats.thisWeekSessions}회</span>의 
              세션이 진행되었습니다.
            </p>
            <p className="text-gray-600">
              전체 목표 중 <span className="font-semibold text-orange-600">{stats.completionRate}%</span>가 
              성공적으로 완료되었습니다.
            </p>
          </div>
        </div>
        
        {/* 새로고침 버튼 */}
        <div className="mt-4 text-right">
          <button
            onClick={fetchDashboardData}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            🔄 통계 새로고침
          </button>
        </div>
      </div>
    </div>
  )
} 