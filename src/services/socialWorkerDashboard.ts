import { supabase } from '@/lib/supabase'
import { startOfWeek, differenceInWeeks, subWeeks } from 'date-fns'

// 캐시 저장소
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 30000 // 30초 캐시

// 사회복지사 대시보드 통계 타입
export interface SocialWorkerDashboardStats {
  weeklyCheckPending: PatientWithGoal[]  // 주간 점검 미완료 환자
  consecutiveFailures: PatientWithGoal[]  // 4주 연속 실패 환자
  goalsNotSet: Patient[]                  // 목표 미설정 환자
  weeklyAchievementRate: {                // 주간 달성률 분포
    achieved: number
    failed: number
    pending: number
    total: number
  }
}

interface Patient {
  id: string
  name: string
  patient_identifier: string
}

interface PatientWithGoal extends Patient {
  goal_id: string
  goal_name: string
  goal_type: 'weekly' | 'monthly' | 'six_month'
  start_date: string
}

// 현재 사용자가 담당하는 환자 목록 조회
// 담당 필드가 없으므로 pending이 아닌 모든 환자를 조회
async function getAssignedPatients(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('id, status, full_name')
    .neq('status', 'pending')

  if (error) {
    console.error('Error fetching assigned patients:', error)
    return []
  }

  
  return data?.map(patient => patient.id) || []
}

// 주간 목표 점검 미완료 환자 조회 (현재 날짜가 포함된 주차의 pending 상태 목표)
export async function getWeeklyCheckPendingPatients(userId: string): Promise<PatientWithGoal[]> {
  try {
    const assignedPatients = await getAssignedPatients(userId)
    if (assignedPatients.length === 0) return []

    const pendingPatients: PatientWithGoal[] = []
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    
    // 각 환자의 현재 주차 pending 목표 확인
    for (const patientId of assignedPatients) {
      // 환자 정보 먼저 조회
      const { data: patientData } = await supabase
        .from('patients')
        .select('id, full_name, patient_identifier')
        .eq('id', patientId)
        .single()

      if (!patientData) continue

      // 현재 날짜가 포함된 주간 목표 중 pending 상태인 것 조회
      // start_date <= 오늘 <= end_date 이고 status가 pending인 목표
      const { data: currentWeekGoals } = await supabase
        .from('rehabilitation_goals')
        .select('id, title, status, sequence_number, start_date, end_date')
        .eq('patient_id', patientId)
        .eq('goal_type', 'weekly')
        .eq('status', 'pending')
        .lte('start_date', todayString)
        .gte('end_date', todayString)
        .order('sequence_number', { ascending: true })
        .limit(1)

      if (!currentWeekGoals || currentWeekGoals.length === 0) continue

      const pendingGoal = currentWeekGoals[0]
      
      pendingPatients.push({
        id: patientData.id,
        name: patientData.full_name,
        patient_identifier: patientData.patient_identifier,
        goal_id: pendingGoal.id,
        goal_name: `${pendingGoal.sequence_number}주차: ${pendingGoal.title}`,
        goal_type: 'weekly',
        start_date: pendingGoal.start_date
      })
    }

    return pendingPatients
  } catch (error) {
    console.error('Error in getWeeklyCheckPendingPatients:', error)
    return []
  }
}

// 4주 연속 실패 환자 조회
export async function getConsecutiveFailurePatients(userId: string): Promise<PatientWithGoal[]> {
  try {
    const assignedPatients = await getAssignedPatients(userId)
    
    if (assignedPatients.length === 0) {
      return []
    }

    const consecutiveFailures: PatientWithGoal[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 환자별로 최근 4주의 주간 목표 상태를 확인
    for (const patientId of assignedPatients) {
      // 환자 정보 먼저 조회
      const { data: patientData } = await supabase
        .from('patients')
        .select('id, full_name, patient_identifier')
        .eq('id', patientId)
        .single()

      if (!patientData) continue

      // 현재 활성화된 6개월 목표 찾기
      const { data: activeSixMonthGoals } = await supabase
        .from('rehabilitation_goals')
        .select('id')
        .eq('patient_id', patientId)
        .eq('goal_type', 'six_month')
        .in('status', ['active', 'in_progress'])
        
      if (!activeSixMonthGoals || activeSixMonthGoals.length === 0) continue
      
      const activeSixMonthGoal = activeSixMonthGoals[0]
      
      // 해당 6개월 목표의 모든 월간 목표 ID 가져오기
      const { data: monthlyGoals } = await supabase
        .from('rehabilitation_goals')
        .select('id')
        .eq('patient_id', patientId)
        .eq('goal_type', 'monthly')
        .eq('parent_goal_id', activeSixMonthGoal.id)
        
      if (!monthlyGoals || monthlyGoals.length === 0) continue
      
      const monthlyGoalIds = monthlyGoals.map(g => g.id)
      
      // 해당 월간 목표들의 주간 목표들 중 최근 5주 조회 (현재 주차 제외를 위해)
      const { data: weeklyGoals } = await supabase
        .from('rehabilitation_goals')
        .select('id, sequence_number, status, start_date, end_date, title, parent_goal_id')
        .eq('patient_id', patientId)
        .eq('goal_type', 'weekly')
        .in('parent_goal_id', monthlyGoalIds)
        .lte('start_date', today.toISOString().split('T')[0]) // 오늘 이전에 시작된 목표
        .order('start_date', { ascending: false }) // 최근 날짜부터
        .limit(5) // 최근 5개 (현재 주차 포함)

      if (!weeklyGoals || weeklyGoals.length === 0) continue

      // 현재 주차인 목표 제외 (end_date가 오늘 이후인 목표)
      const pastWeeklyGoals = weeklyGoals.filter(goal => {
        const endDate = new Date(goal.end_date)
        return endDate < today
      })

      if (pastWeeklyGoals.length < 4) {
        continue
      }

      // 이전 4주가 모두 cancelled(미달성) 상태인지 확인
      const recentFourWeeks = pastWeeklyGoals.slice(0, 4)
      const allFailed = recentFourWeeks.every(goal => goal.status === 'cancelled')
      
      if (allFailed) {
        // 연속 실패한 주차 정보 포함
        const weekNumbers = recentFourWeeks.map(g => g.sequence_number).filter(n => n !== null).sort((a, b) => a - b)
        const failureInfo = weekNumbers.length >= 2 
          ? `${weekNumbers[0]}-${weekNumbers[weekNumbers.length - 1]}주차 연속 미달성`
          : '최근 4주 연속 미달성'
        
        consecutiveFailures.push({
          id: patientData.id,
          name: patientData.full_name,
          patient_identifier: patientData.patient_identifier,
          goal_id: recentFourWeeks[0].id,
          goal_name: failureInfo,
          goal_type: 'weekly',
          start_date: recentFourWeeks[3].start_date // 가장 오래된 실패 주차의 시작일
        })
      }
    }

    return consecutiveFailures
  } catch (error) {
    console.error('Error in getConsecutiveFailurePatients:', error)
    return []
  }
}

// 목표 미설정 환자 조회
export async function getGoalsNotSetPatients(userId: string): Promise<Patient[]> {
  try {
    // pending 상태인 환자들을 조회 (목표 설정 대기)
    const { data: pendingPatients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name, patient_identifier, status')
      .eq('status', 'pending')

    if (patientsError || !pendingPatients) {
      console.error('Error fetching patients:', patientsError)
      return []
    }

    return pendingPatients.map(p => ({
      id: p.id,
      name: p.full_name,
      patient_identifier: p.patient_identifier
    }))
  } catch (error) {
    console.error('Error in getGoalsNotSetPatients:', error)
    return []
  }
}

// 주간 목표 달성률 분포 조회
export async function getWeeklyAchievementRate(userId: string): Promise<SocialWorkerDashboardStats['weeklyAchievementRate']> {
  try {
    const assignedPatients = await getAssignedPatients(userId)
    if (assignedPatients.length === 0) {
      return { achieved: 0, failed: 0, pending: 0, total: 0 }
    }

    // 현재 진행 중인 모든 주간 목표 조회
    const { data: weeklyGoals } = await supabase
      .from('rehabilitation_goals')
      .select('id, patient_id, title, start_date, status, sequence_number')
      .in('patient_id', assignedPatients)
      .eq('goal_type', 'weekly')
      .not('status', 'is', null)

    if (!weeklyGoals || weeklyGoals.length === 0) {
      return { achieved: 0, failed: 0, pending: 0, total: 0 }
    }

    // 현재 주차에 해당하는 목표들만 필터링
    const currentWeekGoals = weeklyGoals.filter(goal => {
      // 각 환자의 가장 최근 주차 목표만 포함
      const samePatientGoals = weeklyGoals.filter(g => g.patient_id === goal.patient_id)
      const maxSequence = Math.max(...samePatientGoals.map(g => g.sequence_number || 0))
      return goal.sequence_number === maxSequence
    })

    const stats = {
      achieved: 0,
      failed: 0,
      pending: 0,
      total: currentWeekGoals.length
    }

    // 각 목표의 상태 확인
    for (const goal of currentWeekGoals) {
      if (goal.status === 'completed') {
        stats.achieved++
      } else if (goal.status === 'cancelled') {
        stats.failed++
      } else if (goal.status === 'active' || goal.status === 'in_progress') {
        stats.pending++
      }
    }

    return stats
  } catch (error) {
    console.error('Error in getWeeklyAchievementRate:', error)
    return { achieved: 0, failed: 0, pending: 0, total: 0 }
  }
}

// 캐시 무효화 함수
export function invalidateDashboardCache(userId?: string) {
  if (userId) {
    cache.delete(`dashboard-${userId}`)
  } else {
    // 모든 대시보드 캐시 삭제
    cache.clear()
  }
}

// 모든 사회복지사 대시보드 통계 조회
export async function getSocialWorkerDashboardStats(userId: string): Promise<SocialWorkerDashboardStats> {
  try {
    // 캐시 확인
    const cacheKey = `dashboard-${userId}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
    }

    // 담당 환자 목록을 먼저 조회하여 공유
    const assignedPatients = await getAssignedPatients(userId)
    
    if (assignedPatients.length === 0) {
      return {
        weeklyCheckPending: [],
        consecutiveFailures: [],
        goalsNotSet: [],
        weeklyAchievementRate: { achieved: 0, failed: 0, pending: 0, total: 0 }
      }
    }

    // 병렬로 처리
    const [
      weeklyCheckPending,
      consecutiveFailures,
      goalsNotSet,
      weeklyAchievementRate
    ] = await Promise.all([
      getWeeklyCheckPendingPatients(userId),
      getConsecutiveFailurePatients(userId),
      getGoalsNotSetPatients(userId),
      getWeeklyAchievementRate(userId)
    ])

    const result = {
      weeklyCheckPending,
      consecutiveFailures,
      goalsNotSet,
      weeklyAchievementRate
    }

    // 캐시에 저장
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    return result
  } catch (error) {
    console.error('Error in getSocialWorkerDashboardStats:', error)
    return {
      weeklyCheckPending: [],
      consecutiveFailures: [],
      goalsNotSet: [],
      weeklyAchievementRate: { achieved: 0, failed: 0, pending: 0, total: 0 }
    }
  }
}