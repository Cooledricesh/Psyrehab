import { Link } from 'react-router-dom'
import { Users, Target, TrendingUp, FileText, ArrowRight, Calendar, CheckCircle, Clock } from 'lucide-react'
import { useActivePatients, useProgressStats } from '@/hooks/queries/useProgressTracking'
import { usePatientGoals } from '@/hooks/queries/useProgressTracking'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export default function Home() {
  // 실제 데이터 조회
  const { data: patients, isLoading: patientsLoading } = useActivePatients()
  const { data: stats, isLoading: statsLoading } = useProgressStats()

  // 현재 사용자가 담당하는 환자들의 주간 목표 조회
  const { data: weeklyGoalsData, isLoading: weeklyGoalsLoading } = useQuery({
    queryKey: ['currentWeeklyGoals'],
    queryFn: async () => {
      // 현재 주의 시작일과 종료일 계산
      const today = new Date()
      const dayOfWeek = today.getDay()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - dayOfWeek)
      startOfWeek.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)

      // 현재 주에 해당하는 주간 목표들 조회
      const { data, error } = await supabase
        .from('rehabilitation_goals')
        .select(`
          *,
          patients(
            id,
            full_name,
            patient_identifier
          ),
          goal_categories(
            name,
            icon,
            color
          )
        `)
        .eq('goal_type', 'weekly')
        .eq('plan_status', 'active')
        .gte('start_date', startOfWeek.toISOString().split('T')[0])
        .lte('end_date', endOfWeek.toISOString().split('T')[0])
        .order('start_date')
        .limit(10)

      if (error) throw error
      return data || []
    },
  })

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          정신건강 재활 플랫폼
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          전문적인 정신건강 관리와 재활 프로그램을 제공합니다. 
          환자 중심의 맞춤형 케어 솔루션으로 더 나은 회복을 지원합니다.
        </p>
        <Link to="/dashboard" className="inline-flex items-center gap-2">
          <button className="btn btn-primary text-lg px-8 py-3">
            대시보드로 이동
            <ArrowRight size={20} />
          </button>
        </Link>
      </div>

      {/* 실제 통계 데이터 */}
      <div className="card p-8">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
          플랫폼 현황
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {statsLoading ? '-' : patients?.length || 0}
            </div>
            <div className="text-gray-600">활성 환자</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-600 mb-2">
              {statsLoading ? '-' : `${Math.round(stats?.achievementRate || 0)}%`}
            </div>
            <div className="text-gray-600">목표 달성률</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-yellow-600 mb-2">
              {statsLoading ? '-' : `${Math.round(stats?.averageProgress || 0)}%`}
            </div>
            <div className="text-gray-600">평균 진행률</div>
          </div>
        </div>
      </div>

      {/* 현재 담당 환자들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            담당 환자 ({patientsLoading ? '-' : patients?.length || 0}명)
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {patientsLoading ? (
              <div className="text-center py-4 text-gray-500">로딩 중...</div>
            ) : patients && patients.length > 0 ? (
              patients.map((patient) => (
                <Link
                  key={patient.id}
                  to={`/progress-tracking?patient=${patient.id}`}
                  className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{patient.full_name}</p>
                      <p className="text-sm text-gray-500">
                        ID: {patient.patient_identifier}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        활성
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                <p>현재 담당 환자가 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 이번 주 주간 목표 */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-green-600" />
            이번 주 주간 목표
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {weeklyGoalsLoading ? (
              <div className="text-center py-4 text-gray-500">로딩 중...</div>
            ) : weeklyGoalsData && weeklyGoalsData.length > 0 ? (
              weeklyGoalsData.map((goal) => (
                <div
                  key={goal.id}
                  className="p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{goal.title}</p>
                      <p className="text-xs text-gray-500">
                        {goal.patients?.full_name} • {goal.sequence_number}주차
                      </p>
                    </div>
                    <div className="ml-2">
                      {goal.status === 'completed' ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <Clock size={16} className="text-yellow-600" />
                      )}
                    </div>
                  </div>
                  {goal.description && (
                    <p className="text-xs text-gray-600 truncate">
                      {goal.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      goal.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : goal.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {goal.status === 'completed' ? '완료' : 
                       goal.status === 'active' ? '진행중' : '대기'}
                    </span>
                    <span className="text-xs text-gray-500">
                      진행률: {goal.progress || 0}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target size={48} className="mx-auto mb-4 text-gray-300" />
                <p>이번 주 주간 목표가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 hover:shadow-md transition-shadow duration-200">
          <div className="mb-4">
            <div className="inline-block p-3 bg-blue-50 rounded-lg">
              <Users size={24} className="text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            환자 관리
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed">
            종합적인 환자 정보 관리와 진료 기록 시스템
          </p>
          <Link to="/patient-management">
            <button className="btn btn-secondary w-full">
              시작하기
            </button>
          </Link>
        </div>

        <div className="card p-6 hover:shadow-md transition-shadow duration-200">
          <div className="mb-4">
            <div className="inline-block p-3 bg-green-50 rounded-lg">
              <Target size={24} className="text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            목표 설정
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed">
            AI 기반 개인화된 재활 목표 수립과 관리
          </p>
          <Link to="/goal-setting">
            <button className="btn btn-secondary w-full">
              시작하기
            </button>
          </Link>
        </div>

        <div className="card p-6 hover:shadow-md transition-shadow duration-200">
          <div className="mb-4">
            <div className="inline-block p-3 bg-yellow-50 rounded-lg">
              <TrendingUp size={24} className="text-yellow-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            진행 추적
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed">
            실시간 진행상황 모니터링과 데이터 분석
          </p>
          <Link to="/progress-tracking">
            <button className="btn btn-secondary w-full">
              시작하기
            </button>
          </Link>
        </div>

        <div className="card p-6 hover:shadow-md transition-shadow duration-200">
          <div className="mb-4">
            <div className="inline-block p-3 bg-pink-50 rounded-lg">
              <FileText size={24} className="text-pink-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            보고서
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed">
            종합적인 진료 보고서 및 통계 데이터
          </p>
          <Link to="/reports">
            <button className="btn btn-secondary w-full">
              시작하기
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
} 