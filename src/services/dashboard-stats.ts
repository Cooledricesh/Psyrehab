import { supabase } from '@/lib/supabase'

// 대시보드 통계 타입 정의
export interface DashboardStats {
  totalPatients: number
  activeGoals: number
  thisWeekSessions: number
  completionRate: number
  pendingPatients: number
  avgPatientsPerWorker: number
  patientChangeFromLastMonth: number
  completedSixMonthGoals: number
  totalWeeklyCheckPending: number
  fourWeeksAchievedCount: number
  newPatientsThisMonth: number
}

// 총 환자 수 조회 (discharged 제외)
export const getTotalPatients = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'discharged')
    
    if (error) {
      console.error("Error occurred")
      return 0
    }
    
    return count || 0
  } catch {
    console.error("Error occurred")
    return 0
  }
}

// 활성 목표 수 조회 (진행 중인 재활 목표)
export const getActiveGoals = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('rehabilitation_goals')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending'])
    
    if (error) {
      console.error("Error occurred")
      return 0
    }
    
    return count || 0
  } catch {
    console.error("Error occurred")
    return 0
  }
}

// 이번 주 세션 수 조회 (service_records 테이블에서)
export const getThisWeekSessions = async (): Promise<number> => {
  try {
    // 이번 주 시작일 (월요일) 계산
    const now = new Date()
    const currentDay = now.getDay()
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1
    const mondayDate = new Date(now)
    mondayDate.setDate(now.getDate() - daysFromMonday)
    mondayDate.setHours(0, 0, 0, 0)
    
    const { count, error } = await supabase
      .from('service_records')
      .select('*', { count: 'exact', head: true })
      .gte('service_date_time', mondayDate.toISOString())
    
    if (error) {
      console.error("Error occurred")
      return 0
    }
    
    return count || 0
  } catch {
    console.error("Error occurred")
    return 0
  }
}

// 목표 완료율 계산
export const getCompletionRate = async (): Promise<number> => {
  try {
    // 전체 목표 수
    const { count: totalGoals, error: totalError } = await supabase
      .from('rehabilitation_goals')
      .select('*', { count: 'exact', head: true })
    
    if (totalError) {
      console.error('Error fetching total goals:', totalError)
      return 0
    }
    
    // 완료된 목표 수
    const { count: completedGoals, error: completedError } = await supabase
      .from('rehabilitation_goals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
    
    if (completedError) {
      console.error('Error fetching completed goals:', completedError)
      return 0
    }
    
    if (!totalGoals || totalGoals === 0) {
      return 0
    }
    
    return Math.round(((completedGoals || 0) / totalGoals) * 100)
  } catch {
    console.error("Error occurred")
    return 0
  }
}

// 목표 설정 대기 환자 수 조회 (pending 상태)
export const getPendingPatients = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    
    if (error) {
      console.error("Error occurred")
      return 0
    }
    
    return count || 0
  } catch {
    console.error("Error occurred")
    return 0
  }
}

// 지난달 대비 환자 수 변화 계산
export const getPatientChangeFromLastMonth = async (): Promise<number> => {
  try {
    const now = new Date()
    
    // 지난달 마지막 날짜 계산
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    lastMonthEnd.setHours(23, 59, 59, 999)
    
    // 지난달 마지막날까지의 환자 수 조회 (created_at 기준, discharged 제외)
    const { count: lastMonthCount, error: lastMonthError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', lastMonthEnd.toISOString())
      .neq('status', 'discharged')
    
    if (lastMonthError) {
      console.error("Error fetching last month patients:", lastMonthError)
      return 0
    }
    
    // 현재 총 환자 수 (이미 discharged 제외됨)
    const currentCount = await getTotalPatients()
    
    // 증감 계산
    const change = currentCount - (lastMonthCount || 0)
    
    return change
  } catch (error) {
    console.error("Error in getPatientChangeFromLastMonth:", error)
    return 0
  }
}

// 달성한 6개월 목표 수 조회
export const getCompletedSixMonthGoals = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('rehabilitation_goals')
      .select('*', { count: 'exact', head: true })
      .eq('goal_type', 'six_month')
      .eq('status', 'completed')
    
    if (error) {
      console.error("Error fetching completed six month goals:", error)
      return 0
    }
    
    return count || 0
  } catch (error) {
    console.error("Error in getCompletedSixMonthGoals:", error)
    return 0
  }
}

// 전체 주간 체크 미완료 환자 수 조회
export const getTotalWeeklyCheckPending = async (): Promise<number> => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 모든 환자의 이전 주차 pending 주간 목표 조회
    const { data: pendingWeeklyGoals, error } = await supabase
      .from('rehabilitation_goals')
      .select(`
        id,
        patient_id,
        patients!inner(status)
      `)
      .eq('goal_type', 'weekly')
      .eq('status', 'pending')
      .lt('end_date', today.toISOString().split('T')[0]) // 종료일이 오늘보다 이전
      .neq('patients.status', 'discharged')
    
    if (error) {
      console.error("Error fetching weekly pending goals:", error)
      return 0
    }
    
    // 중복된 patient_id 제거 (한 환자가 여러 pending 목표를 가질 수 있음)
    const uniquePatients = new Set(pendingWeeklyGoals?.map(goal => goal.patient_id) || [])
    
    return uniquePatients.size
  } catch (error) {
    console.error("Error in getTotalWeeklyCheckPending:", error)
    return 0
  }
}

// 사회복지사당 평균 담당 환자 수 계산
export const getAvgPatientsPerWorker = async (): Promise<number> => {
  try {
    // 주임과 사원 역할의 사용자 수 조회
    const { data: workerData, error: workerError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        roles!inner(
          id,
          role_name
        )
      `)
      .in('roles.role_name', ['assistant_manager', 'staff'])
    
    if (workerError) {
      console.error("Error fetching workers:", workerError)
      return 0
    }
    
    const workerCount = workerData?.length || 0
    
    // 전체 환자 수 조회
    const totalPatients = await getTotalPatients()
    
    if (workerCount === 0) {
      return 0
    }
    
    // 평균 계산 (소수점 첫째 자리까지)
    const average = Math.round((totalPatients / workerCount) * 10) / 10
    
    return average
  } catch (error) {
    console.error("Error in getAvgPatientsPerWorker:", error)
    return 0
  }
}

// 월별 환자수 추이 데이터 조회
export const getMonthlyPatientTrend = async (months: number = 3) => {
  try {
    // 현재 날짜와 n개월 전 날짜 계산
    const now = new Date()
    const monthsAgo = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
    
    // 월별 데이터를 저장할 배열
    const chartData = []
    
    // 지정된 기간 동안의 각 월 초를 계산
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(monthsAgo.getFullYear(), monthsAgo.getMonth() + i, 1)
      const monthKey = `${monthDate.getMonth() + 1}월`
      
      // 해당 월의 첫날과 마지막 날 계산
      const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      
      // 해당 월의 마지막 날까지 생성된 전체 환자 수 조회
      const { count: totalCount, error: totalError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .lte('created_at', lastDay.toISOString())
        .neq('status', 'discharged')
      
      // 해당 월에 신규로 생성된 환자 수 조회
      const { count: newCount, error: newError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDay.toISOString())
        .lte('created_at', lastDay.toISOString())
      
      if (totalError) {
        console.error(`Error fetching total patients for ${monthKey}:`, totalError)
      }
      if (newError) {
        console.error(`Error fetching new patients for ${monthKey}:`, newError)
      }
      
      chartData.push({
        month: monthKey,
        patients: totalCount || 0,
        newPatients: newCount || 0
      })
    }
    
    return chartData
  } catch (error) {
    console.error("Error in getMonthlyPatientTrend:", error)
    return []
  }
}

// 전체 4주 연속 달성 환자 수 조회
export const getFourWeeksAchievedCount = async (): Promise<number> => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 모든 활성 환자 조회
    const { data: activePatients, error: patientsError } = await supabase
      .from('patients')
      .select('id')
      .neq('status', 'discharged')
    
    if (patientsError || !activePatients) {
      console.error('Error fetching active patients:', patientsError)
      return 0
    }
    
    // 병렬 처리로 성능 개선
    const fourWeeksAchievedResults = await Promise.all(
      activePatients.map(async (patient): Promise<boolean> => {
        try {
          const patientId = patient.id
          
          // 활성 6개월 목표 조회 - 'active' 상태로 변경
          const { data: activeSixMonthGoals } = await supabase
            .from('rehabilitation_goals')
            .select('id')
            .eq('patient_id', patientId)
            .eq('goal_type', 'six_month')
            .in('status', ['active']) // 'pending'에서 'active'로 변경
            .limit(1)
          
          if (!activeSixMonthGoals || activeSixMonthGoals.length === 0) return false
          
          const activeSixMonthGoal = activeSixMonthGoals[0]
          
          // 해당 6개월 목표의 모든 월간 목표 ID 가져오기
          const { data: monthlyGoals } = await supabase
            .from('rehabilitation_goals')
            .select('id')
            .eq('patient_id', patientId)
            .eq('goal_type', 'monthly')
            .eq('parent_goal_id', activeSixMonthGoal.id)
          
          if (!monthlyGoals || monthlyGoals.length === 0) return false
          
          const monthlyGoalIds = monthlyGoals.map(g => g.id)
          
          // 최근 5주의 주간 목표 조회
          const { data: weeklyGoals } = await supabase
            .from('rehabilitation_goals')
            .select('id, status, start_date, end_date')
            .eq('patient_id', patientId)
            .eq('goal_type', 'weekly')
            .in('parent_goal_id', monthlyGoalIds)
            .lte('start_date', today.toISOString().split('T')[0])
            .order('start_date', { ascending: false })
            .limit(5)
          
          if (!weeklyGoals || weeklyGoals.length === 0) return false
          
          // 현재 주차 제외 (end_date가 오늘 이후인 목표)
          const pastWeeklyGoals = weeklyGoals.filter(goal => {
            const endDate = new Date(goal.end_date)
            return endDate < today
          })
          
          if (pastWeeklyGoals.length < 4) return false
          
          // 이전 4주가 모두 completed 상태인지 확인
          const recentFourWeeks = pastWeeklyGoals.slice(0, 4)
          const allAchieved = recentFourWeeks.every(goal => goal.status === 'completed')
          
          return allAchieved
        } catch (error) {
          console.error(`Error processing patient ${patient.id}:`, error)
          return false
        }
      })
    )
    
    // true 값의 개수를 세어 반환
    const fourWeeksAchievedCount = fourWeeksAchievedResults.filter(result => result === true).length
    
    return fourWeeksAchievedCount
  } catch (error) {
    console.error("Error in getFourWeeksAchievedCount:", error)
    return 0
  }
}

// 이번 달 신규 회원 수 조회
export const getNewPatientsThisMonth = async (): Promise<number> => {
  try {
    const now = new Date()
    
    // 이번 달의 첫날 계산
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    firstDayOfMonth.setHours(0, 0, 0, 0)
    
    // 이번 달에 생성된 환자 수 조회
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString())
    
    if (error) {
      console.error("Error fetching new patients this month:", error)
      return 0
    }
    
    return count || 0
  } catch (error) {
    console.error("Error in getNewPatientsThisMonth:", error)
    return 0
  }
}

// 모든 대시보드 통계를 한 번에 조회
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const [totalPatients, activeGoals, thisWeekSessions, completionRate, pendingPatients, avgPatientsPerWorker, patientChangeFromLastMonth, completedSixMonthGoals, totalWeeklyCheckPending, fourWeeksAchievedCount, newPatientsThisMonth] = await Promise.all([
      getTotalPatients(),
      getActiveGoals(),
      getThisWeekSessions(),
      getCompletionRate(),
      getPendingPatients(),
      getAvgPatientsPerWorker(),
      getPatientChangeFromLastMonth(),
      getCompletedSixMonthGoals(),
      getTotalWeeklyCheckPending(),
      getFourWeeksAchievedCount(),
      getNewPatientsThisMonth()
    ])
    
    return {
      totalPatients,
      activeGoals,
      thisWeekSessions,
      completionRate,
      pendingPatients,
      avgPatientsPerWorker,
      patientChangeFromLastMonth,
      completedSixMonthGoals,
      totalWeeklyCheckPending,
      fourWeeksAchievedCount,
      newPatientsThisMonth
    }
  } catch {
    console.error("Error occurred")
    return {
      totalPatients: 0,
      activeGoals: 0,
      thisWeekSessions: 0,
      completionRate: 0,
      pendingPatients: 0,
      avgPatientsPerWorker: 0,
      patientChangeFromLastMonth: 0,
      completedSixMonthGoals: 0,
      totalWeeklyCheckPending: 0,
      fourWeeksAchievedCount: 0,
      newPatientsThisMonth: 0
    }
  }
} 