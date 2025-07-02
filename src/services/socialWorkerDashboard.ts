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
    

    // 시작된 목표들만 필터링
    const startedGoals = (weeklyGoals || []).filter(goal => {
      const startDate = new Date(goal.start_date)
      return differenceInWeeks(currentWeekStart, startDate) >= 0
    })

    if (startedGoals.length > 0) {
      // 모든 목표의 이번 주 점검 기록을 한 번에 조회
      const goalIds = startedGoals.map(g => g.id)
      const { data: weeklyChecks } = await supabase
        .from('weekly_check_ins')
        .select('goal_id')
        .in('goal_id', goalIds)
        .gte('check_in_date', currentWeekStart.toISOString().split('T')[0])
        .lte('check_in_date', now.toISOString().split('T')[0])

      const checkedGoalIds = new Set(weeklyChecks?.map(c => c.goal_id) || [])

      // 점검되지 않은 목표들만 추가
      for (const goal of startedGoals) {
        if (!checkedGoalIds.has(goal.id)) {
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

    if (weeklyGoals && weeklyGoals.length > 0) {
      // 모든 목표의 최근 4주 점검 기록을 한 번에 조회
      const goalIds = weeklyGoals.map(g => g.id)
      const { data: allRecentChecks } = await supabase
        .from('weekly_check_ins')
        .select('goal_id, is_completed, check_in_date')
        .in('goal_id', goalIds)
        .gte('check_in_date', fourWeeksAgo.toISOString().split('T')[0])
        .order('check_in_date', { ascending: false })

      // 목표별로 체크인 그룹화
      const checksByGoal = new Map<string, any[]>()
      for (const check of allRecentChecks || []) {
        if (!checksByGoal.has(check.goal_id)) {
          checksByGoal.set(check.goal_id, [])
        }
        checksByGoal.get(check.goal_id)!.push(check)
      }

      // 각 목표별로 4주 연속 실패 확인
      for (const goal of weeklyGoals) {
        const recentChecks = checksByGoal.get(goal.id) || []
        
        if (recentChecks.length >= 4) {
          // 최근 4개의 체크만 확인
          const last4Checks = recentChecks.slice(0, 4)
          const allFailed = last4Checks.every(check => check.is_completed === false)

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
    // 모든 환자 조회 (status 필드 조건 제거)
    const { data: allPatients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name, patient_identifier, status')

    if (patientsError || !allPatients) {
      console.error('Error fetching patients:', patientsError)
      return []
    }


    // 활성 상태인 환자만 필터링 (inactive가 아닌 환자)
    const activePatients = allPatients.filter(p => p.status !== 'inactive')

    if (activePatients.length === 0) {
      return []
    }

    // 활성 목표가 있는 환자들을 조회
    const { data: goalsData, error: goalsError } = await supabase
      .from('rehabilitation_goals')
      .select('patient_id, status')
      .in('patient_id', activePatients.map(p => p.id))

    if (goalsError) {
      console.error('Error fetching goals:', goalsError)
      return []
    }


    // 진행중이거나 대기중인 목표가 있는 환자들
    const patientsWithActiveGoals = goalsData
      ?.filter(g => g.status === 'in_progress' || g.status === 'pending')
      .map(g => g.patient_id) || []

    const patientsWithGoalsIds = [...new Set(patientsWithActiveGoals)]

    // 목표가 없는 환자 필터링
    const patientsWithoutGoals = activePatients.filter(
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

    // 이번 주의 모든 주간 점검 기록 조회
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const currentWeekEnd = new Date()
    
    
    // 주간 목표를 가진 환자들 조회
    const { data: weeklyGoals } = await supabase
      .from('rehabilitation_goals')
      .select('id, patient_id, title, start_date')
      .in('patient_id', assignedPatients)
      .eq('goal_type', 'weekly')
      .in('status', ['in_progress', 'pending'])


    if (!weeklyGoals || weeklyGoals.length === 0) {
      return { achieved: 0, failed: 0, pending: 0, total: 0 }
    }

    // 이번 주에 점검해야 할 목표만 필터링
    const goalsToCheck = weeklyGoals.filter(goal => {
      const startDate = new Date(goal.start_date)
      return startDate <= currentWeekEnd
    })


    if (goalsToCheck.length === 0) {
      return { achieved: 0, failed: 0, pending: 0, total: 0 }
    }

    const goalIds = goalsToCheck.map(g => g.id)
    
    const { data: weeklyChecks, error } = await supabase
      .from('weekly_check_ins')
      .select('goal_id, is_completed, check_in_date')
      .in('goal_id', goalIds)
      .gte('check_in_date', currentWeekStart.toISOString().split('T')[0])
      .lte('check_in_date', currentWeekEnd.toISOString().split('T')[0])

    if (error) {
      console.error('Error fetching weekly achievement rate:', error)
      return { achieved: 0, failed: 0, pending: 0, total: goalsToCheck.length }
    }


    // 체크인 데이터를 목표별로 그룹화 (가장 최신 것만 사용)
    const checksByGoal = new Map()
    for (const check of weeklyChecks || []) {
      if (!checksByGoal.has(check.goal_id) || 
          new Date(check.check_in_date) > new Date(checksByGoal.get(check.goal_id).check_in_date)) {
        checksByGoal.set(check.goal_id, check)
      }
    }

    const stats = {
      achieved: 0,
      failed: 0,
      pending: 0,
      total: goalsToCheck.length
    }

    // 각 목표에 대한 상태 확인
    for (const goal of goalsToCheck) {
      if (checksByGoal.has(goal.id)) {
        const check = checksByGoal.get(goal.id)
        if (check.is_completed === true) {
          stats.achieved++
        } else if (check.is_completed === false) {
          stats.failed++
        } else {
          stats.pending++
        }
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