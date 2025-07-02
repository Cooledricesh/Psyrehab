import { supabase } from '@/lib/supabase'
import { startOfWeek, differenceInWeeks, subWeeks } from 'date-fns'

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
async function getAssignedPatients(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('id')
    .eq('primary_social_worker_id', userId)
    .eq('status', 'active')

  if (error) {
    console.error('Error fetching assigned patients:', error)
    return []
  }

  return data?.map(patient => patient.id) || []
}

// 주간 목표 점검 미완료 환자 조회
export async function getWeeklyCheckPendingPatients(userId: string): Promise<PatientWithGoal[]> {
  try {
    // 1. 담당 환자 목록 조회
    const assignedPatients = await getAssignedPatients(userId)
    if (assignedPatients.length === 0) return []

    // 2. 주간 목표를 가진 환자들 조회
    const { data: weeklyGoals, error: goalsError } = await supabase
      .from('rehabilitation_goals')
      .select(`
        id,
        title,
        patient_id,
        goal_type,
        start_date,
        patients!inner (
          id,
          full_name,
          patient_identifier
        )
      `)
      .in('patient_id', assignedPatients)
      .eq('goal_type', 'weekly')
      .in('status', ['in_progress', 'pending'])

    if (goalsError) {
      console.error('Error fetching weekly goals:', goalsError)
      return []
    }

    // 3. 각 목표에 대해 이번 주 점검 여부 확인
    const pendingPatients: PatientWithGoal[] = []
    const now = new Date()
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 }) // 월요일 시작

    for (const goal of weeklyGoals || []) {
      const startDate = new Date(goal.start_date)
      const weeksSinceStart = differenceInWeeks(currentWeekStart, startDate)
      
      // 목표 시작 후 경과한 주차인지 확인
      if (weeksSinceStart >= 0) {
        // 이번 주의 점검 기록 확인
        const { data: weeklyCheck } = await supabase
          .from('weekly_check_ins')
          .select('id')
          .eq('goal_id', goal.id)
          .gte('check_in_date', currentWeekStart.toISOString().split('T')[0])
          .lte('check_in_date', now.toISOString().split('T')[0])
          .limit(1)

        // 점검 기록이 없으면 미완료로 추가
        if (!weeklyCheck || weeklyCheck.length === 0) {
          const patient = goal.patients as any
          pendingPatients.push({
            id: patient.id,
            name: patient.full_name,
            patient_identifier: patient.patient_identifier,
            goal_id: goal.id,
            goal_name: goal.title,
            goal_type: goal.goal_type,
            start_date: goal.start_date
          })
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

    // 주간 목표를 가진 환자들 조회
    const { data: weeklyGoals, error: goalsError } = await supabase
      .from('rehabilitation_goals')
      .select(`
        id,
        title,
        patient_id,
        goal_type,
        start_date,
        patients!inner (
          id,
          full_name,
          patient_identifier
        )
      `)
      .in('patient_id', assignedPatients)
      .eq('goal_type', 'weekly')
      .in('status', ['in_progress', 'pending'])

    if (goalsError) {
      console.error('Error fetching weekly goals:', goalsError)
      return []
    }

    const consecutiveFailures: PatientWithGoal[] = []
    const fourWeeksAgo = subWeeks(new Date(), 4)

    for (const goal of weeklyGoals || []) {
      // 최근 4주간의 점검 기록 조회
      const { data: recentChecks } = await supabase
        .from('weekly_check_ins')
        .select('is_completed')
        .eq('goal_id', goal.id)
        .gte('check_in_date', fourWeeksAgo.toISOString().split('T')[0])
        .order('check_in_date', { ascending: false })
        .limit(4)

      // 4주 연속 실패인지 확인
      if (recentChecks && recentChecks.length >= 4) {
        const allFailed = recentChecks.every(check => 
          check.is_completed === false
        )

        if (allFailed) {
          const patient = goal.patients as any
          consecutiveFailures.push({
            id: patient.id,
            name: patient.full_name,
            patient_identifier: patient.patient_identifier,
            goal_id: goal.id,
            goal_name: goal.title,
            goal_type: goal.goal_type,
            start_date: goal.start_date
          })
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
    const assignedPatients = await getAssignedPatients(userId)
    if (assignedPatients.length === 0) return []

    // 먼저 활성 목표가 있는 환자들을 조회
    const { data: patientsWithGoals } = await supabase
      .from('rehabilitation_goals')
      .select('patient_id')
      .in('patient_id', assignedPatients)
      .in('status', ['in_progress', 'pending'])

    const patientsWithGoalsIds = patientsWithGoals?.map(g => g.patient_id) || []

    // 담당 환자 중 활성 목표가 없는 환자 조회
    const patientsWithoutGoals = assignedPatients
      .filter(patientId => !patientsWithGoalsIds.includes(patientId))

    // 목표가 없는 환자들의 정보 조회
    if (patientsWithoutGoals.length === 0) return []
    
    const { data: patientData, error } = await supabase
      .from('patients')
      .select('id, full_name, patient_identifier')
      .in('id', patientsWithoutGoals)

    if (error) {
      console.error('Error fetching patients without goals:', error)
      return []
    }

    return patientData?.map(p => ({
      id: p.id,
      name: p.full_name,
      patient_identifier: p.patient_identifier
    })) || []
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

    // 이번 주의 모든 주간 점검 기록 조회
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    
    // 주간 목표 ID 먼저 조회
    const { data: weeklyGoalIds } = await supabase
      .from('rehabilitation_goals')
      .select('id')
      .in('patient_id', assignedPatients)
      .eq('goal_type', 'weekly')
      .in('status', ['in_progress', 'pending'])

    const goalIds = weeklyGoalIds?.map(g => g.id) || []
    if (goalIds.length === 0) {
      return { achieved: 0, failed: 0, pending: 0, total: 0 }
    }

    const { data: weeklyChecks, error } = await supabase
      .from('weekly_check_ins')
      .select('is_completed')
      .in('goal_id', goalIds)
      .gte('check_in_date', currentWeekStart.toISOString().split('T')[0])

    if (error) {
      console.error('Error fetching weekly achievement rate:', error)
      return { achieved: 0, failed: 0, pending: 0, total: 0 }
    }

    const stats = {
      achieved: 0,
      failed: 0,
      pending: 0,
      total: 0
    }

    for (const check of weeklyChecks || []) {
      stats.total++
      if (check.is_completed === true) {
        stats.achieved++
      } else if (check.is_completed === false) {
        stats.failed++
      } else {
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

    return {
      weeklyCheckPending,
      consecutiveFailures,
      goalsNotSet,
      weeklyAchievementRate
    }
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