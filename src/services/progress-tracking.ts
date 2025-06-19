import { supabase } from '@/lib/supabase'

// 진행 추적 관련 타입 정의
export interface ProgressStats {
  averageProgress: number
  achievementRate: number
  participationRate: number
  trend: 'up' | 'down' | 'stable'
}

export interface PatientProgress {
  patientId: string
  patientName: string
  goalId: string
  goalTitle: string
  goalDescription: string
  targetValue: string
  currentValue: string
  progressPercentage: number
  trend: 'up' | 'down' | 'stable'
  lastUpdated: string
  status: string
}

export interface WeeklyActivity {
  date: string
  activities: {
    patientName: string
    activityType: string
    status: 'completed' | 'in-progress' | 'scheduled'
  }[]
}

export interface ProgressAlert {
  id: string
  type: 'warning' | 'info' | 'success'
  message: string
  patientName: string
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
}

// 전체 진행률 통계 조회
export const getProgressStats = async (): Promise<ProgressStats> => {
  try {
    // 전체 재활 목표 수와 완료된 목표 수 조회
    const { data: allGoals, error: goalsError } = await supabase
      .from('rehabilitation_goals')
      .select('id, status, actual_completion_rate')
    
    if (goalsError) {
      console.error('Error fetching goals:', goalsError)
      return {
        averageProgress: 0,
        achievementRate: 0,
        participationRate: 0,
        trend: 'stable'
      }
    }

    const totalGoals = allGoals?.length || 0
    const completedGoals = allGoals?.filter(goal => goal.status === 'completed').length || 0
    const inProgressGoals = allGoals?.filter(goal => goal.status === 'active' || goal.status === 'pending').length || 0
    
    // 평균 진행률 계산
    const totalProgress = allGoals?.reduce((sum, goal) => sum + (goal.actual_completion_rate || 0), 0) || 0
    const averageProgress = totalGoals > 0 ? Math.round(totalProgress / totalGoals) : 0
    
    // 목표 달성률 계산
    const achievementRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
    
    // 이번 주 세션 참여율 계산
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1) // 월요일
    startOfWeek.setHours(0, 0, 0, 0)
    
    const { data: weeklySessionsData, error: sessionsError } = await supabase
      .from('service_records')
      .select('id, service_date_time')
      .gte('service_date_time', startOfWeek.toISOString())
      .lte('service_date_time', new Date().toISOString())
    
    const scheduledSessions = weeklySessionsData?.length || 0
    const completedSessions = weeklySessionsData?.length || 0  // service_records에 기록되었다면 완료된 것으로 간주
    const participationRate = scheduledSessions > 0 ? Math.round((completedSessions / scheduledSessions) * 100) : 100
    
    // 추세 계산 (간단하게 평균 진행률 기준)
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (averageProgress >= 70) trend = 'up'
    else if (averageProgress < 40) trend = 'down'
    
    return {
      averageProgress,
      achievementRate,
      participationRate,
      trend
    }
  } catch {
    console.error("Error occurred")
    return {
      averageProgress: 0,
      achievementRate: 0,
      participationRate: 0,
      trend: 'stable'
    }
  }
}

// 개별 환자 진행 현황 조회
export const getPatientProgress = async (): Promise<PatientProgress[]> => {
  try {
    const { data, error } = await supabase
      .from('rehabilitation_goals')
      .select(`
        id,
        title,
        description,
        actual_completion_rate,
        status,
        updated_at,
        patients (
          id,
          full_name
        )
      `)
      .not('patients', 'is', null)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error("Error occurred")
      return []
    }

    return data?.map((goal: any) => {
      // 진행률 기반 추세 계산 (실제로는 이전 기록과 비교해야 함)
      let trend: 'up' | 'down' | 'stable' = 'stable'
      const progress = goal.actual_completion_rate || 0
      if (progress >= 80) trend = 'up'
      else if (progress < 30) trend = 'down'

      return {
        patientId: goal.patients?.id || '',
        patientName: goal.patients?.full_name || '알 수 없음',
        goalId: goal.id,
        goalTitle: goal.title,
        goalDescription: goal.description || '',
        targetValue: '목표값',  // 데이터베이스에 컬럼이 없으므로 기본값 사용
        currentValue: `${progress}%`,  // 완료율을 현재값으로 표시
        progressPercentage: progress,
        trend,
        lastUpdated: goal.updated_at,
        status: goal.status
      }
    }) || []
  } catch {
    console.error("Error occurred")
    return []
  }
}

// 주간 활동 요약 조회
export const getWeeklyActivities = async (): Promise<WeeklyActivity[]> => {
  try {
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1) // 월요일
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6) // 일요일
    endOfWeek.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('service_records')
      .select(`
        id,
        service_date_time,
        service_type,
        patients (
          full_name
        )
      `)
      .gte('service_date_time', startOfWeek.toISOString())
      .lte('service_date_time', endOfWeek.toISOString())
      .order('service_date_time', { ascending: true })

    if (error) {
      console.error("Error occurred")
      return []
    }

    // 날짜별로 그룹화
    const activitiesByDate: { [key: string]: WeeklyActivity } = {}
    
    data?.forEach((record: any) => {
      const date = new Date(record.service_date_time).toLocaleDateString('ko-KR', {
        weekday: 'long'
      })
      
      if (!activitiesByDate[date]) {
        activitiesByDate[date] = {
          date,
          activities: []
        }
      }
      
      activitiesByDate[date].activities.push({
        patientName: record.patients?.full_name || '알 수 없음',
        activityType: record.service_type || '상담',
        status: 'completed'  // service_records에 기록되었다면 완료된 것으로 간주
      })
    })

    return Object.values(activitiesByDate)
  } catch {
    console.error("Error occurred")
    return []
  }
}

// 알림 및 주의사항 조회
export const getProgressAlerts = async (): Promise<ProgressAlert[]> => {
  try {
    const alerts: ProgressAlert[] = []
    
    // 1. 다가오는 평가 일정은 goal_evaluations를 기반으로 확인
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    // 최근 평가로부터 일주일이 지난 목표들을 확인
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { data: recentEvaluations, error: evaluationError } = await supabase
      .from('goal_evaluations')
      .select(`
        goal_id,
        evaluation_date,
        rehabilitation_goals (
          title,
          patients (
            full_name
          )
        )
      `)
      .lt('evaluation_date', weekAgo.toISOString())
      .order('evaluation_date', { ascending: false })
    
    // 중복 제거를 위해 Map 사용
    const goalsNeedingEvaluation = new Map()
    recentEvaluations?.forEach((evaluation: any) => {
      if (!goalsNeedingEvaluation.has(evaluation.goal_id)) {
        const daysSinceEvaluation = Math.ceil((new Date().getTime() - new Date(evaluation.evaluation_date).getTime()) / (1000 * 60 * 60 * 24))
        goalsNeedingEvaluation.set(evaluation.goal_id, {
          title: evaluation.rehabilitation_goals?.title,
          patientName: evaluation.rehabilitation_goals?.patients?.full_name,
          daysSince: daysSinceEvaluation
        })
      }
    })
    
    goalsNeedingEvaluation.forEach((goal, goalId) => {
      alerts.push({
        id: `evaluation-needed-${goalId}`,
        type: 'info',
        message: `${goal.patientName}님의 "${goal.title}" 목표 평가가 ${goal.daysSince}일 지연되었습니다.`,
        patientName: goal.patientName || '알 수 없음',
        priority: 'medium'
      })
    })
    
    // 2. 진행률이 낮은 목표 확인
    const { data: lowProgressGoals, error: progressError } = await supabase
      .from('rehabilitation_goals')
      .select(`
        id,
        title,
        actual_completion_rate,
        patients (
          full_name
        )
      `)
      .lt('actual_completion_rate', 30)
      .eq('status', 'active')
    
    lowProgressGoals?.forEach((goal: any) => {
      alerts.push({
        id: `low-progress-${goal.id}`,
        type: 'warning',
        message: `${goal.patients?.full_name || '환자'}님의 "${goal.title}" 진행률이 ${goal.actual_completion_rate}%로 낮습니다.`,
        patientName: goal.patients?.full_name || '알 수 없음',
        priority: 'high'
      })
    })
    
    // 3. 높은 진행률 목표 격려
    const { data: highProgressGoals, error: highProgressError } = await supabase
      .from('rehabilitation_goals')
      .select(`
        id,
        title,
        actual_completion_rate,
        patients (
          full_name
        )
      `)
      .gte('actual_completion_rate', 80)
      .eq('status', 'active')
    
    highProgressGoals?.forEach((goal: any) => {
      alerts.push({
        id: `high-progress-${goal.id}`,
        type: 'success',
        message: `${goal.patients?.full_name || '환자'}님이 "${goal.title}" 목표를 ${goal.actual_completion_rate}% 달성했습니다!`,
        patientName: goal.patients?.full_name || '알 수 없음',
        priority: 'low'
      })
    })
    
    // 우선순위별로 정렬
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return alerts.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    
  } catch {
    console.error("Error occurred")
    return []
  }
}

// 모든 진행 추적 데이터를 한 번에 조회
export const getAllProgressData = async () => {
  try {
    const [stats, patientProgress, weeklyActivities, alerts] = await Promise.all([
      getProgressStats(),
      getPatientProgress(),
      getWeeklyActivities(),
      getProgressAlerts()
    ])

    return {
      stats,
      patientProgress,
      weeklyActivities,
      alerts
    }
  } catch {
    console.error("Error occurred")
    return {
      stats: {
        averageProgress: 0,
        achievementRate: 0,
        participationRate: 0,
        trend: 'stable' as const
      },
      patientProgress: [],
      weeklyActivities: [],
      alerts: []
    }
  }
} 