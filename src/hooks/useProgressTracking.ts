import { useQuery } from '@tanstack/react-query'
import { 
  getAllProgressData, 
  getProgressStats, 
  getPatientProgress, 
  getWeeklyActivities, 
  getProgressAlerts,
  type ProgressStats,
  type PatientProgress,
  type WeeklyActivity,
  type ProgressAlert
} from '@/services/progress-tracking'

// 전체 진행 추적 데이터를 조회하는 훅
export const useProgressTracking = () => {
  return useQuery({
    queryKey: ['progress', 'all'],
    queryFn: getAllProgressData,
    staleTime: 1000 * 60 * 5, // 5분간 신선함 유지
    gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
}

// 진행률 통계만 조회하는 훅
export const useProgressStats = () => {
  return useQuery<ProgressStats>({
    queryKey: ['progress', 'stats'],
    queryFn: getProgressStats,
    staleTime: 1000 * 60 * 3, // 3분간 신선함 유지
    gcTime: 1000 * 60 * 10,
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

// 환자별 진행 현황만 조회하는 훅
export const usePatientProgress = () => {
  return useQuery<PatientProgress[]>({
    queryKey: ['progress', 'patients'],
    queryFn: getPatientProgress,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

// 주간 활동만 조회하는 훅
export const useWeeklyActivities = () => {
  return useQuery<WeeklyActivity[]>({
    queryKey: ['progress', 'weekly'],
    queryFn: getWeeklyActivities,
    staleTime: 1000 * 60 * 10, // 10분간 신선함 유지
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

// 알림 및 주의사항만 조회하는 훅
export const useProgressAlerts = () => {
  return useQuery<ProgressAlert[]>({
    queryKey: ['progress', 'alerts'],
    queryFn: getProgressAlerts,
    staleTime: 1000 * 60 * 2, // 2분간 신선함 유지 (알림은 자주 갱신)
    gcTime: 1000 * 60 * 10,
    retry: 2,
    refetchOnWindowFocus: true, // 창 포커스 시 알림 갱신
  })
} 