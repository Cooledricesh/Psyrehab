import { supabase } from '@/lib/supabase'

// 대시보드 통계 타입 정의
export interface DashboardStats {
  totalPatients: number
  activeGoals: number
  thisWeekSessions: number
  completionRate: number
  pendingPatients: number
  avgPatientsPerWorker: number
}

// 총 환자 수 조회
export const getTotalPatients = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
    
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
      .in('status', ['pending', 'in_progress'])
    
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

// 사회복지사당 평균 담당 환자 수 계산
export const getAvgPatientsPerWorker = async (): Promise<number> => {
  try {
    // 주임과 사원 역할의 사용자 수 조회
    const { data: workerData, error: workerError } = await supabase
      .from('user_roles')
      .select('user_id, roles!inner(role_name)')
      .in('roles.role_name', ['assistant_manager', 'staff'])
    
    if (workerError) {
      console.error("Error fetching workers:", workerError)
      return 0
    }
    
    const workerCount = workerData?.length || 0
    
    // 전체 환자 수 조회
    const totalPatients = await getTotalPatients()
    
    console.log('Worker count:', workerCount)
    console.log('Total patients:', totalPatients)
    
    if (workerCount === 0) {
      console.log('No workers found')
      return 0
    }
    
    // 평균 계산 (소수점 첫째 자리까지)
    const average = Math.round((totalPatients / workerCount) * 10) / 10
    console.log('Average patients per worker:', average)
    
    return average
  } catch (error) {
    console.error("Error in getAvgPatientsPerWorker:", error)
    return 0
  }
}

// 모든 대시보드 통계를 한 번에 조회
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const [totalPatients, activeGoals, thisWeekSessions, completionRate, pendingPatients, avgPatientsPerWorker] = await Promise.all([
      getTotalPatients(),
      getActiveGoals(),
      getThisWeekSessions(),
      getCompletionRate(),
      getPendingPatients(),
      getAvgPatientsPerWorker()
    ])
    
    return {
      totalPatients,
      activeGoals,
      thisWeekSessions,
      completionRate,
      pendingPatients,
      avgPatientsPerWorker
    }
  } catch {
    console.error("Error occurred")
    return {
      totalPatients: 0,
      activeGoals: 0,
      thisWeekSessions: 0,
      completionRate: 0,
      pendingPatients: 0,
      avgPatientsPerWorker: 0
    }
  }
} 