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
// 담당 필드가 없으므로 inactive가 아닌 모든 환자를 조회
async function getAssignedPatients(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('id, status')
    .neq('status', 'inactive')

  if (error) {
    console.error('Error fetching assigned patients:', error)
    return []
  }

  return data?.map(patient => patient.id) || []
}

// 주간 목표 점검 미완료 환자 조회 (아직 체크하지 않은 현재 주 목표)
export async function getWeeklyCheckPendingPatients(userId: string): Promise<PatientWithGoal[]> {
  try {
    const assignedPatients = await getAssignedPatients(userId)
    if (assignedPatients.length === 0) return []

    const pendingPatients: PatientWithGoal[] = []
    
    // 각 환자의 현재 진행 중인 주간 목표 확인
    for (const patientId of assignedPatients) {
      // 해당 환자의 활성 월간 목표들 조회
      const { data: monthlyGoals } = await supabase
        .from('rehabilitation_goals')
        .select(`
          id,
          title,
          patients!inner (
            id,
            full_name,
            patient_identifier
          )
        `)
        .eq('patient_id', patientId)
        .eq('goal_type', 'monthly')
        .in('status', ['active', 'in_progress'])

      if (!monthlyGoals || monthlyGoals.length === 0) continue

      // 각 월간 목표의 현재 주차 목표 확인
      for (const monthlyGoal of monthlyGoals) {
        // 가장 최근 주차의 목표 조회
        const { data: weeklyGoals } = await supabase
          .from('rehabilitation_goals')
          .select('id, title, status, sequence_number')
          .eq('parent_goal_id', monthlyGoal.id)
          .eq('goal_type', 'weekly')
          .order('sequence_number', { ascending: false })
          .limit(1)

        if (!weeklyGoals || weeklyGoals.length === 0) continue

        const currentWeekGoal = weeklyGoals[0]
        
        // 아직 달성/미달성 체크하지 않은 목표만 포함
        if (currentWeekGoal.status === 'active' || currentWeekGoal.status === 'in_progress') {
          const patient = monthlyGoal.patients as any
          pendingPatients.push({
            id: patient.id,
            name: patient.full_name,
            patient_identifier: patient.patient_identifier,
            goal_id: currentWeekGoal.id,
            goal_name: `${currentWeekGoal.sequence_number}주차: ${currentWeekGoal.title}`,
            goal_type: 'weekly',
            start_date: ''
          })
          break // 환자당 하나만 표시
        }
      }
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
    if (assignedPatients.length === 0) return []

    const consecutiveFailures: PatientWithGoal[] = []
    const today = new Date()
    
    // 환자별로 최근 4주의 주간 목표 상태를 확인
    for (const patientId of assignedPatients) {
      // 해당 환자의 활성 월간 목표들 조회
      const { data: monthlyGoals } = await supabase
        .from('rehabilitation_goals')
        .select(`
          id,
          title,
          start_date,
          patients!inner (
            id,
            full_name,
            patient_identifier
          )
        `)
        .eq('patient_id', patientId)
        .eq('goal_type', 'monthly')
        .in('status', ['active', 'in_progress'])

      if (!monthlyGoals || monthlyGoals.length === 0) continue

      // 각 월간 목표에 대해 확인
      for (const monthlyGoal of monthlyGoals) {
        // 해당 월간 목표의 주간 목표들 조회 (최근 4주)
        const { data: weeklyGoals } = await supabase
          .from('rehabilitation_goals')
          .select('id, sequence_number, status, start_date, title')
          .eq('parent_goal_id', monthlyGoal.id)
          .eq('goal_type', 'weekly')
          .order('sequence_number', { ascending: false })
          .limit(4)

        if (!weeklyGoals || weeklyGoals.length < 4) continue

        // 최근 4주가 모두 cancelled(미달성) 상태인지 확인
        const allFailed = weeklyGoals.every(goal => goal.status === 'cancelled')
        
        if (allFailed) {
          const patient = monthlyGoal.patients as any
          // 가장 최근 실패한 주간 목표 정보 사용
          const latestWeeklyGoal = weeklyGoals[0]
          consecutiveFailures.push({
            id: patient.id,
            name: patient.full_name,
            patient_identifier: patient.patient_identifier,
            goal_id: latestWeeklyGoal.id,
            goal_name: `${monthlyGoal.title} - ${latestWeeklyGoal.title}`,
            goal_type: 'weekly',
            start_date: monthlyGoal.start_date
          })
          break // 환자당 하나만 표시
        }
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
    // 모든 환자 조회
    const { data: allPatients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name, patient_identifier, status')

    if (patientsError || !allPatients) {
      console.error('Error fetching patients:', patientsError)
      return []
    }

    // discharged, transferred 상태가 아닌 모든 환자 (active, inactive, on_hold 포함)
    const eligiblePatients = allPatients.filter(p => 
      p.status !== 'discharged' && p.status !== 'transferred'
    )

    if (eligiblePatients.length === 0) {
      return []
    }

    // 활성 목표가 있는 환자들을 조회
    const { data: goalsData, error: goalsError } = await supabase
      .from('rehabilitation_goals')
      .select('patient_id, status')
      .in('patient_id', eligiblePatients.map(p => p.id))

    if (goalsError) {
      console.error('Error fetching goals:', goalsError)
      return []
    }

    // 진행중이거나 활성 상태인 목표가 있는 환자들
    const patientsWithActiveGoals = goalsData
      ?.filter(g => g.status === 'active' || g.status === 'in_progress' || g.status === 'pending')
      .map(g => g.patient_id) || []

    const patientsWithGoalsIds = [...new Set(patientsWithActiveGoals)]

    // 목표가 없는 환자 필터링
    const patientsWithoutGoals = eligiblePatients.filter(
      patient => !patientsWithGoalsIds.includes(patient.id)
    )

    return patientsWithoutGoals.map(p => ({
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

// 모든 사회복지사 대시보드 통계 조회
export async function getSocialWorkerDashboardStats(userId: string): Promise<SocialWorkerDashboardStats> {
  try {
    // 캐시 확인
    const cacheKey = `dashboard-${userId}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
    }

    const startTime = Date.now()
    
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

    const endTime = Date.now()
    console.log(`대시보드 로딩 시간: ${endTime - startTime}ms`)
    
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