// Weekly Check-ins related React Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getGoalWeeklyCheckIns,
  createWeeklyCheckIn,
  updateWeeklyCheckIn,
  deleteWeeklyCheckIn,
  getWeeklyCheckInsWithFilters,
} from '@/services/weekly-check-ins'

// Temporary types until Supabase types are properly generated
type TablesInsert = Record<string, unknown>
type TablesUpdate = Record<string, unknown>

// Query keys
export const weeklyCheckInKeys = {
  all: ['weekly-check-ins'] as const,
  lists: () => [...weeklyCheckInKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...weeklyCheckInKeys.lists(), filters] as const,
  goalCheckIns: (goalId: string) => [...weeklyCheckInKeys.all, 'goal', goalId] as const,
  details: () => [...weeklyCheckInKeys.all, 'detail'] as const,
  detail: (id: string) => [...weeklyCheckInKeys.details(), id] as const,
  statistics: () => [...weeklyCheckInKeys.all, 'statistics'] as const,
  stats: (filters?: Record<string, unknown>) => [...weeklyCheckInKeys.statistics(), filters] as const,
  progress: (goalId: string) => [...weeklyCheckInKeys.all, 'progress', goalId] as const,
  recent: (limit?: number) => [...weeklyCheckInKeys.all, 'recent', limit] as const,
}

// Get weekly check-ins for a specific goal
export function useGoalWeeklyCheckIns(goalId: string) {
  return useQuery({
    queryKey: weeklyCheckInKeys.goalCheckIns(goalId),
    queryFn: () => getGoalWeeklyCheckIns(goalId),
    enabled: !!goalId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get weekly check-ins with filters
export function useWeeklyCheckInsWithFilters(filters: {
  goalId?: string
  patientId?: string
  checkerId?: string
  weekNumber?: number
  dateFrom?: string
  dateTo?: string
  isCompleted?: boolean
  moodRatingMin?: number
  moodRatingMax?: number
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: weeklyCheckInKeys.list(filters),
    queryFn: () => getWeeklyCheckInsWithFilters(filters),
    enabled: Object.values(filters).some(value => value !== undefined),
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

// Create weekly check-in mutation
export function useCreateWeeklyCheckIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (checkIn: TablesInsert) => 
      createWeeklyCheckIn(checkIn),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: weeklyCheckInKeys.goalCheckIns(data.goal_id) })
      queryClient.invalidateQueries({ queryKey: weeklyCheckInKeys.lists() })
      queryClient.invalidateQueries({ queryKey: weeklyCheckInKeys.statistics() })
      
      // Also invalidate rehabilitation goals cache as this might affect goal progress
      queryClient.invalidateQueries({ queryKey: ['rehabilitation-goals'] })
    },
  })
}

// Update weekly check-in mutation
export function useUpdateWeeklyCheckIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate }) =>
      updateWeeklyCheckIn(id, updates),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: weeklyCheckInKeys.goalCheckIns(data.goal_id) })
      queryClient.invalidateQueries({ queryKey: weeklyCheckInKeys.lists() })
      queryClient.invalidateQueries({ queryKey: weeklyCheckInKeys.statistics() })
      
      // Also invalidate rehabilitation goals cache
      queryClient.invalidateQueries({ queryKey: ['rehabilitation-goals'] })
    },
  })
}

// Delete weekly check-in mutation
export function useDeleteWeeklyCheckIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWeeklyCheckIn,
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: weeklyCheckInKeys.lists() })
      queryClient.invalidateQueries({ queryKey: weeklyCheckInKeys.statistics() })
      
      // Also invalidate rehabilitation goals cache
      queryClient.invalidateQueries({ queryKey: ['rehabilitation-goals'] })
    },
  })
}

// Utility hook for weekly check-in management
export function useWeeklyCheckInManagement(goalId: string) {
  const checkIns = useGoalWeeklyCheckIns(goalId)
  const createCheckIn = useCreateWeeklyCheckIn()
  const updateCheckIn = useUpdateWeeklyCheckIn()
  const deleteCheckIn = useDeleteWeeklyCheckIn()

  return {
    // Data
    checkIns: checkIns.data,
    
    // Loading states
    isLoadingCheckIns: checkIns.isLoading,
    isCreating: createCheckIn.isPending,
    isUpdating: updateCheckIn.isPending,
    isDeleting: deleteCheckIn.isPending,
    
    // Error states
    checkInsError: checkIns.error,
    createError: createCheckIn.error,
    updateError: updateCheckIn.error,
    deleteError: deleteCheckIn.error,
    
    // Actions
    createCheckIn: createCheckIn.mutate,
    updateCheckIn: updateCheckIn.mutate,
    deleteCheckIn: deleteCheckIn.mutate,
    
    // Refetch functions
    refetchCheckIns: checkIns.refetch,
  }
}

// Hook for patient weekly overview
export function usePatientWeeklyOverview(patientId: string) {
  const checkIns = useWeeklyCheckInsWithFilters({ patientId, limit: 50 })

  return {
    // Data
    checkIns: checkIns.data,
    
    // Loading states
    isLoadingCheckIns: checkIns.isLoading,
    
    // Error states
    checkInsError: checkIns.error,
    
    // Refetch functions
    refetchCheckIns: checkIns.refetch,
  }
}

// Hook for check-in filtering and sorting
export function useCheckInFilters() {
  const getCheckInsByWeek = (checkIns: unknown[], weekNumber: number) => {
    return checkIns?.filter(checkIn => checkIn.week_number === weekNumber) || []
  }
  
  const getCheckInsByDateRange = (checkIns: unknown[], startDate: string, endDate: string) => {
    return checkIns?.filter(checkIn => {
      const checkDate = new Date(checkIn.check_in_date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return checkDate >= start && checkDate <= end
    }) || []
  }
  
  const getCompletedCheckIns = (checkIns: unknown[]) => {
    return checkIns?.filter(checkIn => checkIn.is_completed) || []
  }
  
  const getCheckInsByMoodRange = (checkIns: unknown[], min: number, max: number) => {
    return checkIns?.filter(checkIn => {
      const mood = checkIn.mood_rating
      return mood !== null && mood >= min && mood <= max
    }) || []
  }
  
  const sortCheckInsByWeek = (checkIns: unknown[], ascending = true) => {
    return [...(checkIns || [])].sort((a, b) => {
      return ascending ? a.week_number - b.week_number : b.week_number - a.week_number
    })
  }
  
  const sortCheckInsByDate = (checkIns: unknown[], ascending = false) => {
    return [...(checkIns || [])].sort((a, b) => {
      const dateA = new Date(a.check_in_date).getTime()
      const dateB = new Date(b.check_in_date).getTime()
      return ascending ? dateA - dateB : dateB - dateA
    })
  }
  
  const sortCheckInsByMood = (checkIns: unknown[], ascending = true) => {
    return [...(checkIns || [])].sort((a, b) => {
      const moodA = a.mood_rating || 0
      const moodB = b.mood_rating || 0
      return ascending ? moodA - moodB : moodB - moodA
    })
  }
  
  return {
    getCheckInsByWeek,
    getCheckInsByDateRange,
    getCompletedCheckIns,
    getCheckInsByMoodRange,
    sortCheckInsByWeek,
    sortCheckInsByDate,
    sortCheckInsByMood,
  }
}

// Prefetch functions for performance optimization
export function usePrefetchWeeklyCheckIns() {
  const queryClient = useQueryClient()

  const prefetchGoalCheckIns = (goalId: string) => {
    queryClient.prefetchQuery({
      queryKey: weeklyCheckInKeys.goalCheckIns(goalId),
      queryFn: () => getGoalWeeklyCheckIns(goalId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  return {
    prefetchGoalCheckIns,
  }
} 