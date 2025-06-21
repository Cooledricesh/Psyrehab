// Goal History related React Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getGoalHistory,
  getGoalHistoryWithDetails,
  createGoalHistoryEntry,
  getGoalHistoryWithFilters,
  getGoalHistoryStatistics,
  getRecentGoalHistory,
  getGoalChangeTimeline,
  trackGoalChange,
} from '@/services/goal-history'

// Temporary types until Supabase types are properly generated
type TablesInsert = Record<string, unknown>

// Query keys
export const goalHistoryKeys = {
  all: ['goal-history'] as const,
  lists: () => [...goalHistoryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...goalHistoryKeys.lists(), filters] as const,
  goalHistory: (goalId: string) => [...goalHistoryKeys.all, 'goal', goalId] as const,
  details: () => [...goalHistoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalHistoryKeys.details(), id] as const,
  statistics: () => [...goalHistoryKeys.all, 'statistics'] as const,
  stats: (filters?: Record<string, unknown>) => [...goalHistoryKeys.statistics(), filters] as const,
  timeline: (goalId: string) => [...goalHistoryKeys.all, 'timeline', goalId] as const,
  recent: (limit?: number) => [...goalHistoryKeys.all, 'recent', limit] as const,
}

// Get goal history for a specific goal
export function useGoalHistory(goalId: string) {
  return useQuery({
    queryKey: goalHistoryKeys.goalHistory(goalId),
    queryFn: () => getGoalHistory(goalId),
    enabled: !!goalId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get a specific goal history entry with details
export function useGoalHistoryWithDetails(historyId: string) {
  return useQuery({
    queryKey: goalHistoryKeys.detail(historyId),
    queryFn: () => getGoalHistoryWithDetails(historyId),
    enabled: !!historyId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Get goal history with filters
export function useGoalHistoryWithFilters(filters: {
  goalId?: string
  patientId?: string
  changedBy?: string
  changeType?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: goalHistoryKeys.list(filters),
    queryFn: () => getGoalHistoryWithFilters(filters),
    enabled: Object.values(filters).some(value => value !== undefined),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get goal history statistics
export function useGoalHistoryStatistics(filters?: {
  goalId?: string
  patientId?: string
  changedBy?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: goalHistoryKeys.stats(filters),
    queryFn: () => getGoalHistoryStatistics(filters),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Get goal change timeline
export function useGoalChangeTimeline(goalId: string) {
  return useQuery({
    queryKey: goalHistoryKeys.timeline(goalId),
    queryFn: () => getGoalChangeTimeline(goalId),
    enabled: !!goalId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get recent goal history
export function useRecentGoalHistory(limit = 10) {
  return useQuery({
    queryKey: goalHistoryKeys.recent(limit),
    queryFn: () => getRecentGoalHistory(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Create goal history entry mutation
export function useCreateGoalHistoryEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (history: TablesInsert) => 
      createGoalHistoryEntry(history),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: goalHistoryKeys.goalHistory(data.goal_id) })
      queryClient.invalidateQueries({ queryKey: goalHistoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalHistoryKeys.statistics() })
      queryClient.invalidateQueries({ queryKey: goalHistoryKeys.timeline(data.goal_id) })
      queryClient.invalidateQueries({ queryKey: goalHistoryKeys.recent() })
    },
  })
}

// Track goal change mutation (utility mutation)
export function useTrackGoalChange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      goalId,
      changeType,
      previousValues,
      newValues,
      changedBy,
      changeReason,
    }: {
      goalId: string
      changeType: string
      previousValues: unknown
      newValues: unknown
      changedBy: string
      changeReason?: string
    }) => trackGoalChange(goalId, changeType, previousValues, newValues, changedBy, changeReason),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: goalHistoryKeys.goalHistory(data.goal_id) })
      queryClient.invalidateQueries({ queryKey: goalHistoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalHistoryKeys.statistics() })
      queryClient.invalidateQueries({ queryKey: goalHistoryKeys.timeline(data.goal_id) })
      queryClient.invalidateQueries({ queryKey: goalHistoryKeys.recent() })
    },
  })
}

// Prefetch functions for performance optimization
export function usePrefetchGoalHistory() {
  const queryClient = useQueryClient()

  const prefetchGoalHistory = (goalId: string) => {
    queryClient.prefetchQuery({
      queryKey: goalHistoryKeys.goalHistory(goalId),
      queryFn: () => getGoalHistory(goalId),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })
  }

  const prefetchGoalTimeline = (goalId: string) => {
    queryClient.prefetchQuery({
      queryKey: goalHistoryKeys.timeline(goalId),
      queryFn: () => getGoalChangeTimeline(goalId),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })
  }

  const prefetchHistoryStatistics = (filters?: {
    goalId?: string
    patientId?: string
    changedBy?: string
    dateFrom?: string
    dateTo?: string
  }) => {
    queryClient.prefetchQuery({
      queryKey: goalHistoryKeys.stats(filters),
      queryFn: () => getGoalHistoryStatistics(filters),
      staleTime: 15 * 60 * 1000, // 15 minutes
    })
  }

  return {
    prefetchGoalHistory,
    prefetchGoalTimeline,
    prefetchHistoryStatistics,
  }
}

// Utility hook for goal history management
export function useGoalHistoryManagement(goalId: string) {
  const history = useGoalHistory(goalId)
  const timeline = useGoalChangeTimeline(goalId)
  const createHistoryEntry = useCreateGoalHistoryEntry()
  const trackChange = useTrackGoalChange()
  const statistics = useGoalHistoryStatistics({ goalId })

  return {
    // Data
    history: history.data,
    timeline: timeline.data,
    statistics: statistics.data,
    
    // Loading states
    isLoadingHistory: history.isLoading,
    isLoadingTimeline: timeline.isLoading,
    isLoadingStats: statistics.isLoading,
    isCreating: createHistoryEntry.isPending,
    isTracking: trackChange.isPending,
    
    // Error states
    historyError: history.error,
    timelineError: timeline.error,
    statsError: statistics.error,
    createError: createHistoryEntry.error,
    trackError: trackChange.error,
    
    // Actions
    createHistoryEntry: createHistoryEntry.mutate,
    trackChange: trackChange.mutate,
    
    // Refetch functions
    refetchHistory: history.refetch,
    refetchTimeline: timeline.refetch,
    refetchStatistics: statistics.refetch,
  }
}

// Hook for patient history overview
export function usePatientHistoryOverview(patientId: string) {
  const history = useGoalHistoryWithFilters({ patientId, limit: 50 })
  const statistics = useGoalHistoryStatistics({ patientId })

  return {
    // Data
    history: history.data,
    statistics: statistics.data,
    
    // Loading states
    isLoadingHistory: history.isLoading,
    isLoadingStats: statistics.isLoading,
    
    // Error states
    historyError: history.error,
    statsError: statistics.error,
    
    // Refetch functions
    refetchHistory: history.refetch,
    refetchStatistics: statistics.refetch,
  }
}

// Hook for history filtering and analysis
export function useHistoryFilters() {
  const getHistoryByChangeType = (history: unknown[], changeType: string) => {
    return history?.filter(entry => entry.change_type === changeType) || []
  }
  
  const getHistoryByDateRange = (history: unknown[], startDate: string, endDate: string) => {
    return history?.filter(entry => {
      const entryDate = new Date(entry.created_at)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return entryDate >= start && entryDate <= end
    }) || []
  }
  
  const getHistoryByChanger = (history: unknown[], changerId: string) => {
    return history?.filter(entry => entry.changed_by === changerId) || []
  }
  
  const sortHistoryByDate = (history: unknown[], ascending = false) => {
    return [...(history || [])].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return ascending ? dateA - dateB : dateB - dateA
    })
  }
  
  const groupHistoryByMonth = (history: unknown[]) => {
    return history?.reduce((acc, entry) => {
      const month = entry.created_at.substring(0, 7) // YYYY-MM
      if (!acc[month]) acc[month] = []
      acc[month].push(entry)
      return acc
    }, {} as Record<string, unknown[]>) || {}
  }
  
  const groupHistoryByChangeType = (history: unknown[]) => {
    return history?.reduce((acc, entry) => {
      const type = entry.change_type
      if (!acc[type]) acc[type] = []
      acc[type].push(entry)
      return acc
    }, {} as Record<string, unknown[]>) || {}
  }
  
  return {
    getHistoryByChangeType,
    getHistoryByDateRange,
    getHistoryByChanger,
    sortHistoryByDate,
    groupHistoryByMonth,
    groupHistoryByChangeType,
  }
}

// Hook for change analysis
export function useChangeAnalysis(goalId: string) {
  const timeline = useGoalChangeTimeline(goalId)
  
  const getChangeFrequency = () => {
    return timeline.data?.change_frequency || 0
  }
  
  const getMostCommonChange = () => {
    return timeline.data?.most_common_change || null
  }
  
  const getTotalChanges = () => {
    return timeline.data?.total_changes || 0
  }
  
  const getChangeActivity = () => {
    const frequency = getChangeFrequency()
    if (frequency >= 2) return 'high'
    if (frequency >= 0.5) return 'moderate'
    return 'low'
  }
  
  return {
    timeline: timeline.data,
    isLoading: timeline.isLoading,
    error: timeline.error,
    getChangeFrequency,
    getMostCommonChange,
    getTotalChanges,
    getChangeActivity,
    refetch: timeline.refetch,
  }
} 