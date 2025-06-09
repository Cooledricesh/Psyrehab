import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  getProgressStats, 
  getPatientProgress, 
  getWeeklyActivities, 
  getProgressAlerts,
  type PatientProgress,
  type WeeklyActivity,
  type ProgressAlert
} from '@/services/progress-tracking'

export default function ProgressTracking() {
  const [stats, setStats] = useState({
    averageProgress: 53,
    achievementRate: 23,
    participationRate: 87,
    trend: 'up' as 'up' | 'down' | 'stable'
  })
  const [progressData, setProgressData] = useState<PatientProgress[]>([])
  const [weeklyActivities, setWeeklyActivities] = useState<WeeklyActivity[]>([])
  const [alerts, setAlerts] = useState<ProgressAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProgressLoading, setIsProgressLoading] = useState(true)
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(true)
  const [isAlertsLoading, setIsAlertsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getProgressStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch progress stats:', error)
        // 에러 시 기본값 유지
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const data = await getPatientProgress()
        setProgressData(data)
      } catch (error) {
        console.error('Failed to fetch patient progress:', error)
        // 에러 시 빈 배열 유지
        setProgressData([])
      } finally {
        setIsProgressLoading(false)
      }
    }

    fetchProgressData()
  }, [])

  useEffect(() => {
    const fetchWeeklyActivities = async () => {
      try {
        const data = await getWeeklyActivities()
        setWeeklyActivities(data)
      } catch (error) {
        console.error('Failed to fetch weekly activities:', error)
        setWeeklyActivities([])
      } finally {
        setIsActivitiesLoading(false)
      }
    }

    fetchWeeklyActivities()
  }, [])

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await getProgressAlerts()
        setAlerts(data)
      } catch (error) {
        console.error('Failed to fetch alerts:', error)
        setAlerts([])
      } finally {
        setIsAlertsLoading(false)
      }
    }

    fetchAlerts()
  }, [])

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      default: return '➡️'
    }
  }

  const getTrendText = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '상승 중'
      case 'down': return '하락 중'
      default: return '안정'
    }
  }

  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️'
      case 'info': return '📅'
      case 'success': return '🎉'
      default: return 'ℹ️'
    }
  }

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-l-4 border-yellow-400'
      case 'info': return 'bg-blue-50 border-l-4 border-blue-400'
      case 'success': return 'bg-green-50 border-l-4 border-green-400'
      default: return 'bg-gray-50 border-l-4 border-gray-400'
    }
  }

  return (
    <div className="space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">진행 추적</h1>
          <p className="text-gray-600">환자별 목표 달성 진행상황을 실시간으로 모니터링하세요</p>
        </header>
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">전체 평균 진행률</h3>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {isLoading ? '...' : `${stats.averageProgress.toFixed(1)}%`}
            </div>
            <div className="text-sm text-gray-500">
              {getTrendIcon(stats.trend)} {getTrendText(stats.trend)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">목표 달성률</h3>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {isLoading ? '...' : `${stats.achievementRate.toFixed(1)}%`}
            </div>
            <div className="text-sm text-gray-500">완료된 목표</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">참여 활성도</h3>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {isLoading ? '...' : `${stats.participationRate.toFixed(1)}%`}
            </div>
            <div className="text-sm text-gray-500">주간 평균</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">개선 추세</h3>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {getTrendIcon(stats.trend)}
            </div>
            <div className="text-sm text-gray-500">{getTrendText(stats.trend)}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">개별 진행 현황</h2>
              <Button variant="outline">📊 차트 보기</Button>
            </div>
          </div>
          
          <div className="p-6">
            {isProgressLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">환자 진행 현황을 불러오는 중...</div>
              </div>
            ) : progressData.length === 0 ? (
              <div className="text-center h-32 flex items-center justify-center">
                <div className="text-gray-500">아직 진행 중인 목표가 없습니다.</div>
              </div>
            ) : (
              <div className="space-y-6">
                {progressData.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{item.patientName}</h3>
                        <p className="text-sm text-gray-600">{item.goalTitle}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.goalDescription}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold">{item.progressPercentage}%</span>
                          <span className="text-lg">{getTrendIcon(item.trend)}</span>
                        </div>
                        <p className="text-xs text-gray-500">현재: {item.currentValue}</p>
                        <p className="text-xs text-gray-400">상태: {item.status}</p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>목표: {item.targetValue}</span>
                        <span>{item.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(item.progressPercentage)}`} 
                          style={{ width: `${item.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">세부사항</Button>
                        <Button variant="outline" size="sm">기록 추가</Button>
                        <Button variant="outline" size="sm">차트 보기</Button>
                      </div>
                      <div className="text-xs text-gray-400">
                        최종 업데이트: {new Date(item.lastUpdated).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">주간 활동 요약</h3>
            {isActivitiesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">주간 활동을 불러오는 중...</div>
              </div>
            ) : weeklyActivities.length === 0 ? (
              <div className="text-center h-32 flex items-center justify-center">
                <div className="text-gray-500">이번 주 활동 기록이 없습니다.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {weeklyActivities.map((activity, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="font-medium">{activity.date}</span>
                    <div className="flex space-x-2 flex-wrap">
                      {activity.activities.map((item, actIndex) => (
                        <span 
                          key={actIndex}
                          className={`px-2 py-1 rounded text-xs ${getActivityStatusColor(item.status)}`}
                        >
                          {item.patientName} {item.activityType}
                        </span>
                      ))}
                      {activity.activities.length === 0 && (
                        <span className="text-xs text-gray-500">활동 없음</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">알림 및 주의사항</h3>
            {isAlertsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">알림을 불러오는 중...</div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center h-32 flex items-center justify-center">
                <div className="text-gray-500">현재 알림이 없습니다.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert, index) => (
                  <div key={alert.id} className={`p-3 ${getAlertStyle(alert.type)}`}>
                    <p className="text-sm">
                      {getAlertIcon(alert.type)} {alert.message}
                    </p>
                    {alert.dueDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        마감: {new Date(alert.dueDate).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                ))}
                {alerts.length > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm">
                      더 보기 ({alerts.length - 5}개)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  )
} 