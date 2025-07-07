import { supabase } from '@/lib/supabase'
import { startOfWeek, differenceInWeeks, subWeeks } from 'date-fns'

// 캐시 저장소
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 30000 // 30초 캐시
const MAX_CACHE_SIZE = 100 // 최대 캐시 크기
const MAX_PERMISSION_CACHE_SIZE = 50 // 권한 캐시 최대 크기

// 사회복지사 대시보드 통계 타입
export interface SocialWorkerDashboardStats {
  weeklyCheckPending: PatientWithGoal[]  // 주간 점검 미완료 환자
  consecutiveFailures: PatientWithGoal[]  // 4주 연속 실패 환자
  goalsNotSet: Patient[]                  // 목표 미설정 환자
  fourWeeksAchieved: PatientWithGoal[]   // 4주 연속 목표 달성 환자
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

// 권한 체크 결과를 캐시
let permissionCache = new Map<string, { canViewAll: boolean, timestamp: number }>()
const PERMISSION_CACHE_TTL = 300000 // 5분 캐시

// 캐시 크기 관리 함수
function manageCacheSize<T>(cache: Map<string, T>, maxSize: number): void {
  if (cache.size > maxSize) {
    // 가장 오래된 항목들 제거 (전체의 20%)
    const keysToDelete = Math.ceil(maxSize * 0.2)
    const keys = Array.from(cache.keys())
    for (let i = 0; i < keysToDelete; i++) {
      cache.delete(keys[i])
    }
  }
}

// 만료된 캐시 항목 정리
function cleanExpiredCache<T extends { timestamp: number }>(cache: Map<string, T>, ttl: number): void {
  const now = Date.now()
  const expiredKeys: string[] = []
  
  cache.forEach((value, key) => {
    if (now - value.timestamp > ttl) {
      expiredKeys.push(key)
    }
  })
  
  expiredKeys.forEach(key => cache.delete(key))
}

// 현재 사용자가 담당하는 환자 목록 조회
async function getAssignedPatients(userId: string): Promise<string[]> {
  // 권한 캐시 확인
  const permissionCacheKey = `permission-${userId}`
  const cachedPermission = permissionCache.get(permissionCacheKey)
  let canViewAllData = false
  
  if (cachedPermission && Date.now() - cachedPermission.timestamp < PERMISSION_CACHE_TTL) {
    canViewAllData = cachedPermission.canViewAll
  } else {
    // 권한 체크 (캐시 없을 때만)
    try {
      const { getUserProfile, hasPermission } = await import('@/lib/supabase')
      canViewAllData = await hasPermission(userId, 'view_all_data')
      
      // 권한 결과 캐시
      permissionCache.set(permissionCacheKey, {
        canViewAll: canViewAllData,
        timestamp: Date.now()
      })
      
      // 캐시 크기 관리
      manageCacheSize(permissionCache, MAX_PERMISSION_CACHE_SIZE)
    } catch (error) {
      console.error('Permission check failed:', error)
      canViewAllData = false
    }
  }
  
  // 권한에 따라 환자 목록 조회
  let query = supabase
    .from('patients')
    .select('id, status, full_name')
  
  // 권한이 없으면 담당 환자만 조회
  if (!canViewAllData) {
    query = query.eq('primary_social_worker_id', userId)
  }
  
  const { data, error } = await query

  if (error) {
    console.error('Error fetching patients:', error)
    return []
  }
  
  return data?.map(patient => patient.id) || []
}

// 주간 목표 점검 미완료 환자 조회 (이번 주차 제외하고 이전 주간 목표 중 pending 상태인 목표)
export async function getWeeklyCheckPendingPatients(userId: string): Promise<PatientWithGoal[]> {
  try {
    const assignedPatients = await getAssignedPatients(userId)
    if (assignedPatients.length === 0) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 각 환자의 이전 주차 pending 목표 확인 (병렬 처리)
    const pendingPatientsResults = await Promise.all(
      assignedPatients.map(async (patientId): Promise<PatientWithGoal | null> => {
        try {
          // 환자 정보 먼저 조회
          const { data: patientData } = await supabase
            .from('patients')
            .select('id, full_name, patient_identifier')
            .eq('id', patientId)
            .single()

          if (!patientData) return null

          // 현재 활성화된 6개월 목표 찾기
          const { data: activeSixMonthGoals } = await supabase
            .from('rehabilitation_goals')
            .select('id')
            .eq('patient_id', patientId)
            .eq('goal_type', 'six_month')
            .in('status', ['active'])
            
          if (!activeSixMonthGoals || activeSixMonthGoals.length === 0) return null
          
          const activeSixMonthGoal = activeSixMonthGoals[0]
          
          // 해당 6개월 목표의 모든 월간 목표 ID 가져오기
          const { data: monthlyGoals } = await supabase
            .from('rehabilitation_goals')
            .select('id')
            .eq('patient_id', patientId)
            .eq('goal_type', 'monthly')
            .eq('parent_goal_id', activeSixMonthGoal.id)
            
          if (!monthlyGoals || monthlyGoals.length === 0) return null
          
          const monthlyGoalIds = monthlyGoals.map(g => g.id)
          
          // 해당 월간 목표들의 주간 목표들 중 이전 주차들만 조회 (end_date가 오늘보다 이전)
          const { data: pastWeeklyGoals } = await supabase
            .from('rehabilitation_goals')
            .select('id, sequence_number, status, start_date, end_date, title')
            .eq('patient_id', patientId)
            .eq('goal_type', 'weekly')
            .in('parent_goal_id', monthlyGoalIds)
            .lt('end_date', today.toISOString().split('T')[0]) // 종료일이 오늘보다 이전
            .eq('status', 'pending') // pending 상태인 목표만
            .order('start_date', { ascending: false }) // 최근 날짜부터
            .limit(1) // 가장 최근 pending 목표 1개만

          if (!pastWeeklyGoals || pastWeeklyGoals.length === 0) return null

          const pendingGoal = pastWeeklyGoals[0]
          
          return {
            id: patientData.id,
            name: patientData.full_name,
            patient_identifier: patientData.patient_identifier,
            goal_id: pendingGoal.id,
            goal_name: `${pendingGoal.sequence_number}주차: ${pendingGoal.title}`,
            goal_type: 'weekly',
            start_date: pendingGoal.start_date
          }
        } catch (error) {
          console.error(`Error processing patient ${patientId}:`, error)
          return null
        }
      })
    )

    // null 값 필터링
    const pendingPatients = pendingPatientsResults.filter((patient): patient is PatientWithGoal => patient !== null)

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

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 환자별로 최근 4주의 주간 목표 상태를 확인 (병렬 처리)
    const consecutiveFailuresResults = await Promise.all(
      assignedPatients.map(async (patientId): Promise<PatientWithGoal | null> => {
        try {
          // 환자 정보 먼저 조회
          const { data: patientData } = await supabase
            .from('patients')
            .select('id, full_name, patient_identifier')
            .eq('id', patientId)
            .single()

          if (!patientData) return null

          // 현재 활성화된 6개월 목표 찾기
          const { data: activeSixMonthGoals } = await supabase
            .from('rehabilitation_goals')
            .select('id')
            .eq('patient_id', patientId)
            .eq('goal_type', 'six_month')
            .in('status', ['active'])
            
          if (!activeSixMonthGoals || activeSixMonthGoals.length === 0) return null
          
          const activeSixMonthGoal = activeSixMonthGoals[0]
          
          // 해당 6개월 목표의 모든 월간 목표 ID 가져오기
          const { data: monthlyGoals } = await supabase
            .from('rehabilitation_goals')
            .select('id')
            .eq('patient_id', patientId)
            .eq('goal_type', 'monthly')
            .eq('parent_goal_id', activeSixMonthGoal.id)
            
          if (!monthlyGoals || monthlyGoals.length === 0) return null
          
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

          if (!weeklyGoals || weeklyGoals.length === 0) return null

          // 현재 주차인 목표 제외 (end_date가 오늘 이후인 목표)
          const pastWeeklyGoals = weeklyGoals.filter(goal => {
            const endDate = new Date(goal.end_date)
            return endDate < today
          })

          if (pastWeeklyGoals.length < 4) {
            return null
          }

          // 이전 4주가 모두 cancelled(미달성) 상태인지 확인
          const recentFourWeeks = pastWeeklyGoals.slice(0, 4)
          const allFailed = recentFourWeeks.every(goal => goal.status === 'cancelled')
          
          if (allFailed) {
            // 연속 실패한 주차 정보 포함
            const weekNumbers = recentFourWeeks.map(g => g.sequence_number).filter(n => n !== null).sort((a, b) => a - b)
            const failureInfo = '4주 연속 목표 미달성'
            
            return {
              id: patientData.id,
              name: patientData.full_name,
              patient_identifier: patientData.patient_identifier,
              goal_id: recentFourWeeks[0].id,
              goal_name: failureInfo,
              goal_type: 'weekly',
              start_date: recentFourWeeks[3].start_date // 가장 오래된 실패 주차의 시작일
            }
          }

          return null
        } catch (error) {
          console.error(`Error processing patient ${patientId}:`, error)
          return null
        }
      })
    )

    // null 값 필터링
    const consecutiveFailures = consecutiveFailuresResults.filter((patient): patient is PatientWithGoal => patient !== null)

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

// 4주 연속 달성 환자 조회
export async function get4WeeksAchievedPatients(userId: string): Promise<PatientWithGoal[]> {
  try {
    const assignedPatients = await getAssignedPatients(userId)
    
    if (assignedPatients.length === 0) {
      return []
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 환자별로 최근 4주의 주간 목표 상태를 확인 (병렬 처리)
    const fourWeeksAchievedResults = await Promise.all(
      assignedPatients.map(async (patientId): Promise<PatientWithGoal | null> => {
        try {
          // 환자 정보 먼저 조회
          const { data: patientData } = await supabase
            .from('patients')
            .select('id, full_name, patient_identifier')
            .eq('id', patientId)
            .single()

          if (!patientData) return null

          // 현재 활성화된 6개월 목표 찾기
          const { data: activeSixMonthGoals } = await supabase
            .from('rehabilitation_goals')
            .select('id')
            .eq('patient_id', patientId)
            .eq('goal_type', 'six_month')
            .in('status', ['active'])
            
          if (!activeSixMonthGoals || activeSixMonthGoals.length === 0) return null
          
          const activeSixMonthGoal = activeSixMonthGoals[0]
          
          // 해당 6개월 목표의 모든 월간 목표 ID 가져오기
          const { data: monthlyGoals } = await supabase
            .from('rehabilitation_goals')
            .select('id')
            .eq('patient_id', patientId)
            .eq('goal_type', 'monthly')
            .eq('parent_goal_id', activeSixMonthGoal.id)
            
          if (!monthlyGoals || monthlyGoals.length === 0) return null
          
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

          if (!weeklyGoals || weeklyGoals.length === 0) return null

          // 현재 주차인 목표 제외 (end_date가 오늘 이후인 목표)
          const pastWeeklyGoals = weeklyGoals.filter(goal => {
            const endDate = new Date(goal.end_date)
            return endDate < today
          })

          if (pastWeeklyGoals.length < 4) {
            return null
          }

          // 이전 4주가 모두 completed(달성) 상태인지 확인
          const recentFourWeeks = pastWeeklyGoals.slice(0, 4)
          const allAchieved = recentFourWeeks.every(goal => goal.status === 'completed')
          
          if (allAchieved) {
            // 연속 달성한 주차 정보 포함
            const weekNumbers = recentFourWeeks.map(g => g.sequence_number).filter(n => n !== null).sort((a, b) => a - b)
            const achievementInfo = '4주 연속 목표 달성'
            
            return {
              id: patientData.id,
              name: patientData.full_name,
              patient_identifier: patientData.patient_identifier,
              goal_id: recentFourWeeks[0].id,
              goal_name: achievementInfo,
              goal_type: 'weekly',
              start_date: recentFourWeeks[3].start_date // 가장 오래된 달성 주차의 시작일
            }
          }

          return null
        } catch (error) {
          console.error(`Error processing patient ${patientId}:`, error)
          return null
        }
      })
    )

    // null 값 필터링
    const fourWeeksAchieved = fourWeeksAchievedResults.filter((patient): patient is PatientWithGoal => patient !== null)

    return fourWeeksAchieved
  } catch (error) {
    console.error('Error in get4WeeksAchievedPatients:', error)
    return []
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
  
  // 만료된 권한 캐시도 정리
  cleanExpiredCache(permissionCache, PERMISSION_CACHE_TTL)
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
        fourWeeksAchieved: []
      }
    }

    // 병렬로 처리
    const [
      weeklyCheckPending,
      consecutiveFailures,
      goalsNotSet,
      fourWeeksAchieved
    ] = await Promise.all([
      getWeeklyCheckPendingPatients(userId),
      getConsecutiveFailurePatients(userId),
      getGoalsNotSetPatients(userId),
      get4WeeksAchievedPatients(userId)
    ])

    const result = {
      weeklyCheckPending,
      consecutiveFailures,
      goalsNotSet,
      fourWeeksAchieved
    }

    // 캐시에 저장
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })
    
    // 캐시 크기 관리 및 만료된 항목 정리
    manageCacheSize(cache, MAX_CACHE_SIZE)
    cleanExpiredCache(cache, CACHE_TTL)
    
    return result
  } catch (error) {
    console.error('Error in getSocialWorkerDashboardStats:', error)
    return {
      weeklyCheckPending: [],
      consecutiveFailures: [],
      goalsNotSet: [],
      fourWeeksAchieved: []
    }
  }
}