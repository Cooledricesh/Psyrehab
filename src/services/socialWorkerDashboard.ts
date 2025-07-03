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
    .select('id, status')
    .neq('status', 'pending')

  if (error) {
    console.error('Error fetching assigned patients:', error)
    return []
  }

  return data?.map(patient => patient.id) || []
}

// 주간 목표 점검 미완료 환자 조회 (오늘 날짜 기준 지난 주차 중 미체크 목표)
export async function getWeeklyCheckPendingPatients(userId: string): Promise<PatientWithGoal[]> {
  try {
    const assignedPatients = await getAssignedPatients(userId)
    if (assignedPatients.length === 0) return []

    const pendingPatients: PatientWithGoal[] = []
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    
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

      // 각 월간 목표의 주간 목표들 중 시작일이 오늘 이전인 것들 확인
      for (const monthlyGoal of monthlyGoals) {
        // 시작일이 오늘 이전이고 아직 체크하지 않은 주간 목표 조회
        const { data: weeklyGoals } = await supabase
          .from('rehabilitation_goals')
          .select('id, title, status, sequence_number, start_date, end_date')
          .eq('parent_goal_id', monthlyGoal.id)
          .eq('goal_type', 'weekly')
          .in('status', ['active', 'in_progress'])
          .lte('start_date', today.toISOString().split('T')[0])
          .order('sequence_number', { ascending: true })

        if (!weeklyGoals || weeklyGoals.length === 0) continue

        // 첫 번째 미체크 목표만 추가 (환자당 하나)
        const firstPendingGoal = weeklyGoals[0]
        const patient = monthlyGoal.patients as any
        
        pendingPatients.push({
          id: patient.id,
          name: patient.full_name,
          patient_identifier: patient.patient_identifier,
          goal_id: firstPendingGoal.id,
          goal_name: `${firstPendingGoal.sequence_number}주차: ${firstPendingGoal.title}`,
          goal_type: 'weekly',
          start_date: firstPendingGoal.start_date
        })
        break // 환자당 하나만 표시
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
    today.setHours(0, 0, 0, 0)
    
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
        // 오늘 날짜 이전에 시작된 주간 목표들 조회 (최근 4개)
        const { data: weeklyGoals } = await supabase
          .from('rehabilitation_goals')
          .select('id, sequence_number, status, start_date, title')
          .eq('parent_goal_id', monthlyGoal.id)
          .eq('goal_type', 'weekly')
          .lte('start_date', today.toISOString().split('T')[0])
          .order('sequence_number', { ascending: false })
          .limit(4)

        if (!weeklyGoals || weeklyGoals.length < 4) continue

        // 최근 4주가 모두 cancelled(미달성) 상태인지 확인
        const allFailed = weeklyGoals.every(goal => goal.status === 'cancelled')
        
        if (allFailed) {
          const patient = monthlyGoal.patients as any
          // 연속 실패한 주차 정보 포함
          const weekNumbers = weeklyGoals.map(g => g.sequence_number).sort((a, b) => a - b)
          const failureInfo = `${weekNumbers[0]}-${weekNumbers[3]}주차 연속 미달성`
          
          consecutiveFailures.push({
            id: patient.id,
            name: patient.full_name,
            patient_identifier: patient.patient_identifier,
            goal_id: weeklyGoals[0].id,
            goal_name: `${monthlyGoal.title} (${failureInfo})`,
            goal_type: 'weekly',
            start_date: monthlyGoal.start_date
          })
          break // 환자당 하나만 표시
        }
      }
    }

    console.log(`4주 연속 실패 환자 수: ${consecutiveFailures.length}명`)
    consecutiveFailures.forEach(patient => {
      console.log(`- ${patient.name}: ${patient.goal_name}`)
    })

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