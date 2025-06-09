import { useState, useEffect } from 'react'
import { getDashboardStats } from '@/services/dashboard-stats'
import { Loader2, Users, Target, Calendar, TrendingUp } from 'lucide-react'

export function SimpleDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeGoals: 0,
    thisWeekSessions: 0,
    completionRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const dashboardData = await getDashboardStats()
      setStats(dashboardData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('대시보드 데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
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