import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, type DashboardStats } from '@/services/dashboard-stats'

// 대시보드 통계 조회 훅
export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
    staleTime: 1000 * 60 * 5, // 5분간 신선함 유지
    gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
} 