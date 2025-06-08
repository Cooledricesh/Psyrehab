import React from 'react'
import { Users, Target, TrendingUp, Calendar, Activity, CheckCircle, RefreshCw } from 'lucide-react'
import { LineChart, BarChart, PieChart, KPICard } from '@/components/charts'
import { SearchBar, FilterPanel, QuickFilters } from '@/components/filters'
import RealtimeStatus from '@/components/ui/RealtimeStatus'
import { DashboardProvider } from '@/contexts/DashboardContext'
import { 
  useDashboardStats, 
  useChartData, 
  useLoadingStates, 
  useErrorStates,
  useRealTimeData,
  usePatientsData 
} from '@/hooks/useDashboardData'

interface DashboardStats {
  totalPatients: number
  activeGoals: number
  thisWeekSessions: number
  upcomingTasks: number
  goalCompletionRate: number
}

interface Patient {
  id: string
  name: string
  status: string
  lastSession?: string
}

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  loading?: boolean
}

const StatCard = ({ title, value, change, changeType, icon, loading }: StatCardProps) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600'
      case 'negative':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-24 mt-2"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 leading-none">
            {value}
          </p>
          {change && (
            <p className={`text-sm mt-2 ${getChangeColor()}`}>
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  )
}

const DashboardContent: React.FC = () => {
  const { stats, loading: statsLoading } = useDashboardStats()
  const { chartData, loading: chartsLoading } = useChartData()
  const { patients } = usePatientsData({ limit: 5 })
  const { isLoading } = useLoadingStates()
  const { hasErrors } = useErrorStates()
  const { isAutoRefreshEnabled, toggleAutoRefresh, manualRefresh, lastUpdated } = useRealTimeData()
  
  // Filter states
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterValues, setFilterValues] = React.useState<Record<string, any>>({})
  const [activeQuickFilters, setActiveQuickFilters] = React.useState<string[]>([])

  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Filter configurations
  const searchSuggestions = [
    { id: '1', title: '김영희', subtitle: '환자', category: '환자' },
    { id: '2', title: '인지 훈련', subtitle: '목표 유형', category: '목표' },
    { id: '3', title: '사회 기술', subtitle: '목표 유형', category: '목표' },
    { id: '4', title: '일상 생활', subtitle: '목표 유형', category: '목표' },
  ]

  const filterGroups = [
    {
      id: 'status',
      label: '상태',
      type: 'checkbox' as const,
      options: [
        { value: 'active', label: '활성', count: 45 },
        { value: 'inactive', label: '비활성', count: 12 },
        { value: 'completed', label: '완료', count: 23 },
        { value: 'on-hold', label: '보류', count: 8 },
      ],
    },
    {
      id: 'goalType',
      label: '목표 유형',
      type: 'checkbox' as const,
      options: [
        { value: 'cognitive', label: '인지 훈련', count: 35 },
        { value: 'social', label: '사회 기술', count: 25 },
        { value: 'daily_living', label: '일상 생활', count: 20 },
        { value: 'vocational', label: '직업 훈련', count: 15 },
        { value: 'other', label: '기타', count: 5 },
      ],
    },
    {
      id: 'dateRange',
      label: '기간',
      type: 'date' as const,
    },
    {
      id: 'ageRange',
      label: '연령대',
      type: 'range' as const,
      min: 18,
      max: 80,
    },
  ]

  const quickFilterOptions = [
    {
      id: 'active-patients',
      label: '활성 환자',
      color: 'green' as const,
      count: 45,
      filters: { status: ['active'] },
    },
    {
      id: 'high-priority',
      label: '높은 우선순위',
      color: 'red' as const,
      count: 12,
      filters: { priority: ['high'] },
    },
    {
      id: 'this-week',
      label: '이번 주',
      color: 'blue' as const,
      count: 28,
      filters: { dateRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] } },
    },
    {
      id: 'cognitive-goals',
      label: '인지 훈련',
      color: 'purple' as const,
      count: 35,
      filters: { goalType: ['cognitive'] },
    },
  ]

  // Filter handlers
  const handleFilterChange = (filterId: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [filterId]: value }))
  }

  const handleFilterReset = () => {
    setFilterValues({})
    setActiveQuickFilters([])
  }

  const handleQuickFilterToggle = (filterId: string, filters: Record<string, any>) => {
    if (activeQuickFilters.includes(filterId)) {
      setActiveQuickFilters(prev => prev.filter(id => id !== filterId))
      // Remove the filters
      const newFilterValues = { ...filterValues }
      Object.keys(filters).forEach(key => {
        delete newFilterValues[key]
      })
      setFilterValues(newFilterValues)
    } else {
      setActiveQuickFilters(prev => [...prev, filterId])
      // Apply the filters
      setFilterValues(prev => ({ ...prev, ...filters }))
    }
  }

  const handleSearchSuggestionSearch = (query: string) => {
    // Handle search logic
    console.log('Searching for:', query)
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            대시보드
          </h1>
          <p className="text-gray-600">
            정신건강 재활 플랫폼에 오신 것을 환영합니다.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <RealtimeStatus
            connectionStatus={'connected'}
            connectedCount={4}
            totalCount={4}
            lastUpdate={lastUpdated}
            onReconnect={() => console.log('Reconnecting...')}
            showDetails={true}
          />
          <div className="text-sm text-gray-500">
            마지막 업데이트: {formatLastUpdated(lastUpdated)}
          </div>
          <button
            onClick={manualRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            새로고침
          </button>
          <button
            onClick={toggleAutoRefresh}
            className={`px-3 py-2 text-sm rounded-lg border ${
              isAutoRefreshEnabled 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            자동 새로고침 {isAutoRefreshEnabled ? '켜짐' : '꺼짐'}
          </button>
        </div>
      </div>

      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            일부 데이터를 불러오는 중 오류가 발생했습니다. 모의 데이터가 표시됩니다.
          </p>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar */}
          <SearchBar
            placeholder="환자, 목표, 세션 검색..."
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearchSuggestionSearch}
            suggestions={searchSuggestions}
            className="w-full"
          />

          {/* Quick Filters */}
          <QuickFilters
            filters={quickFilterOptions}
            activeFilters={activeQuickFilters}
            onFilterToggle={handleQuickFilterToggle}
            onClearAll={() => {
              setActiveQuickFilters([])
              setFilterValues({})
            }}
          />
        </div>

        {/* Advanced Filters Panel */}
        <div className="lg:col-span-1">
          <FilterPanel
            groups={filterGroups}
            values={filterValues}
            onChange={handleFilterChange}
            onReset={handleFilterReset}
            defaultExpanded={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="총 환자 수"
          value={stats.totalPatients}
          change="+12% 이번 달"
          changeType="positive"
          icon={<Users size={24} />}
          loading={statsLoading}
        />
        <StatCard
          title="활성 목표"
          value={stats.activeGoals}
          change="+8% 이번 달"
          changeType="positive"
          icon={<Target size={24} />}
          loading={statsLoading}
        />
        <StatCard
          title="완료된 목표"
          value={stats.completedGoals}
          change="+15% 이번 달"
          changeType="positive"
          icon={<CheckCircle size={24} />}
          loading={statsLoading}
        />
        <StatCard
          title="목표 달성률"
          value={`${stats.goalCompletionRate}%`}
          change="+5% 지난 달 대비"
          changeType="positive"
          icon={<TrendingUp size={24} />}
          loading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="평균 세션 시간"
          value={stats.averageSessionDuration}
          suffix=" 분"
          trendValue={5}
          trend="up"
          color="blue"
          size="md"
        />
        <KPICard
          title="월간 활성 사용자"
          value={stats.monthlyActiveUsers}
          suffix=" 명"
          trendValue={12}
          trend="up"
          color="green"
          size="md"
        />
        <KPICard
          title="이번 주 세션"
          value={stats.thisWeekSessions}
          suffix=" 회"
          trendValue={2}
          trend="down"
          color="yellow"
          size="md"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">진행률 추이</h3>
          {chartsLoading ? (
            <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
          ) : (
            <LineChart
              data={{
                labels: chartData.progressTrend.labels,
                datasets: [
                  {
                    label: '목표 달성률',
                    data: chartData.progressTrend.goalAchievementRate,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                  },
                  {
                    label: '환자 참여율',
                    data: chartData.progressTrend.patientEngagementRate,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                  },
                ],
              }}
              height={250}
            />
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">목표 유형별 분포</h3>
          {chartsLoading ? (
            <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
          ) : (
            <PieChart
              data={{
                labels: chartData.goalDistribution.labels,
                datasets: [
                  {
                    data: chartData.goalDistribution.data,
                    backgroundColor: [
                      '#3B82F6',
                      '#10B981',
                      '#F59E0B',
                      '#EF4444',
                      '#8B5CF6',
                    ],
                  },
                ],
              }}
              height={250}
            />
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">주간 성과</h3>
        {chartsLoading ? (
          <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
        ) : (
          <BarChart
            data={{
              labels: chartData.weeklyPerformance.labels,
              datasets: [
                {
                  label: '완료된 목표',
                  data: chartData.weeklyPerformance.completedGoals,
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                },
                {
                  label: '새로운 목표',
                  data: chartData.weeklyPerformance.newGoals,
                  backgroundColor: 'rgba(16, 185, 129, 0.8)',
                },
              ],
            }}
            height={300}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 환자</h3>
          <div className="space-y-3">
            {patients.length > 0 ? (
              patients.slice(0, 5).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-500">
                      마지막 세션: {patient.lastSession ? new Date(patient.lastSession).toLocaleDateString('ko-KR') : '없음'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    patient.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : patient.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {patient.status === 'active' ? '활성' : 
                     patient.status === 'completed' ? '완료' : 
                     patient.status === 'on-hold' ? '대기' : '비활성'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">환자 데이터가 없습니다.</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">새 세션 예약</p>
                  <p className="text-sm text-gray-500">환자와 새로운 세션을 예약합니다</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">목표 생성</p>
                  <p className="text-sm text-gray-500">새로운 재활 목표를 설정합니다</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">진행률 업데이트</p>
                  <p className="text-sm text-gray-500">환자 진행 상황을 업데이트합니다</p>
                </div>
              </div>
            </button>
                      </div>
          </div>
        </div>

        {/* Filtered Results Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                환자 목록
                {(searchQuery || Object.keys(filterValues).length > 0) && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (필터 적용됨)
                  </span>
                )}
              </h3>
              <div className="text-sm text-gray-500">
                총 {patients.length}명
              </div>
            </div>
          </div>
          <div className="p-6">
            {patients.length > 0 ? (
              <div className="space-y-4">
                {patients.map((patient, index) => (
                  <div key={patient.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {patient.name?.charAt(0) || 'N'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{patient.name || '이름 없음'}</div>
                        <div className="text-sm text-gray-500">
                          상태: {patient.status || '알 수 없음'} | 
                          마지막 세션: {patient.lastSession || '기록 없음'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        patient.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : patient.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.status || '상태 없음'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">필터 조건에 맞는 환자가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

const Dashboard: React.FC = () => {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  )
}

export default Dashboard 