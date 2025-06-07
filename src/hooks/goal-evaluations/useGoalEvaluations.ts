// Goal Evaluations related React Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getGoalEvaluations,
  getGoalEvaluationWithDetails,
  createGoalEvaluation,
  updateGoalEvaluation,
  deleteGoalEvaluation,
  getGoalEvaluationsWithFilters,
  getEvaluationStatistics,
  getRecentGoalEvaluations,
  getGoalEvaluationProgress,
  bulkCreateEvaluations,
} from '@/services/goal-evaluations'

// Temporary types until Supabase types are properly generated
type TablesInsert<T extends string> = any
type TablesUpdate<T extends string> = any

// Query keys
export const goalEvaluationKeys = {
  all: ['goal-evaluations'] as const,
  lists: () => [...goalEvaluationKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...goalEvaluationKeys.lists(), filters] as const,
  goalEvaluations: (goalId: string) => [...goalEvaluationKeys.all, 'goal', goalId] as const,
  details: () => [...goalEvaluationKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalEvaluationKeys.details(), id] as const,
  statistics: () => [...goalEvaluationKeys.all, 'statistics'] as const,
  stats: (filters?: Record<string, any>) => [...goalEvaluationKeys.statistics(), filters] as const,
  progress: (goalId: string) => [...goalEvaluationKeys.all, 'progress', goalId] as const,
  recent: (limit?: number) => [...goalEvaluationKeys.all, 'recent', limit] as const,
}

// Get evaluations for a specific goal
export function useGoalEvaluations(goalId: string) {
  return useQuery({
    queryKey: goalEvaluationKeys.goalEvaluations(goalId),
    queryFn: () => getGoalEvaluations(goalId),
    enabled: !!goalId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get a specific goal evaluation with details
export function useGoalEvaluationWithDetails(evaluationId: string) {
  return useQuery({
    queryKey: goalEvaluationKeys.detail(evaluationId),
    queryFn: () => getGoalEvaluationWithDetails(evaluationId),
    enabled: !!evaluationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get goal evaluations with filters
export function useGoalEvaluationsWithFilters(filters: {
  goalId?: string
  patientId?: string
  evaluatorId?: string
  evaluationType?: string
  dateFrom?: string
  dateTo?: string
  completionRateMin?: number
  completionRateMax?: number
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: goalEvaluationKeys.list(filters),
    queryFn: () => getGoalEvaluationsWithFilters(filters),
    enabled: Object.values(filters).some(value => value !== undefined),
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

// Get evaluation statistics
export function useEvaluationStatistics(filters?: {
  goalId?: string
  patientId?: string
  evaluatorId?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: goalEvaluationKeys.stats(filters),
    queryFn: () => getEvaluationStatistics(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get goal evaluation progress
export function useGoalEvaluationProgress(goalId: string) {
  return useQuery({
    queryKey: goalEvaluationKeys.progress(goalId),
    queryFn: () => getGoalEvaluationProgress(goalId),
    enabled: !!goalId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get recent goal evaluations
export function useRecentGoalEvaluations(limit = 10) {
  return useQuery({
    queryKey: goalEvaluationKeys.recent(limit),
    queryFn: () => getRecentGoalEvaluations(limit),
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

// Create goal evaluation mutation
export function useCreateGoalEvaluation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (evaluation: TablesInsert<'goal_evaluations'>) => 
      createGoalEvaluation(evaluation),
    onSuccess: (data) => {
      // Add the new evaluation to the cache
      queryClient.setQueryData(goalEvaluationKeys.detail(data.id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: goalEvaluationKeys.goalEvaluations(data.goal_id) })
      queryClient.invalidateQueries({ queryKey: goalEvaluationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalEvaluationKeys.statistics() })
      queryClient.invalidateQueries({ queryKey: goalEvaluationKeys.progress(data.goal_id) })
      queryClient.invalidateQueries({ queryKey: goalEvaluationKeys.recent() })
      
      // Also invalidate rehabilitation goals cache as completion rate might have changed
      queryClient.invalidateQueries({ queryKey: ['rehabilitation-goals'] })
    },
  })
}

// Update goal evaluation mutation
export function useUpdateGoalEvaluation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate<'goal_evaluations'> }) =>
      updateGoalEvaluation(id, updates),
    onSuccess: (data) => {
      // Update the specific evaluation in cache
      queryClient.setQueryData(goalEvaluationKeys.detail(data.id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: goalEvaluationKeys.goalEvaluations(data.goal_id) })
      queryClient.invalidateQueries({ queryKey: goalEvaluationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalEvaluationKeys.statistics() })
      queryClient.invalidateQueries({ queryKey: goalEvaluationKeys.progress(data.goal_id) })
      queryClient.invalidateQueries({ queryKey: goalEvaluationKeys.recent() })
      
      // Also invalidate rehabilitation goals cache
      queryClient.invalidateQueries({ queryKey: ['rehabilitation-goals'] })
    },
  })
}

// Delete goal evaluation mutation
export function useDeleteGoalEvaluation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteGoalEvaluation,
    onSuccess: (_, deletedId) => {
      // Remove from cache and invalidate related queries
      queryClient.removeQueries({ queryKey: goalEvaluationKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: goalEvaluationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalEvaluationKeys.statistics() })
      queryClient.invalidateQueries({ queryKey: goalEvaluationKeys.recent() })
      
      // Also invalidate rehabilitation goals cache
      queryClient.invalidateQueries({ queryKey: ['rehabilitation-goals'] })
    },
  })
}

// Bulk create evaluations mutation
export function useBulkCreateEvaluations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bulkCreateEvaluations,
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: goalEvaluationKeys.all })
      queryClient.invalidateQueries({ queryKey: ['rehabilitation-goals'] })
    },
  })
}

// Prefetch functions for performance optimization
export function usePrefetchGoalEvaluations() {
  const queryClient = useQueryClient()

  const prefetchGoalEvaluations = (goalId: string) => {
    queryClient.prefetchQuery({
      queryKey: goalEvaluationKeys.goalEvaluations(goalId),
      queryFn: () => getGoalEvaluations(goalId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  const prefetchEvaluationProgress = (goalId: string) => {
    queryClient.prefetchQuery({
      queryKey: goalEvaluationKeys.progress(goalId),
      queryFn: () => getGoalEvaluationProgress(goalId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  const prefetchEvaluationStatistics = (filters?: {
    goalId?: string
    patientId?: string
    evaluatorId?: string
    dateFrom?: string
    dateTo?: string
  }) => {
    queryClient.prefetchQuery({
      queryKey: goalEvaluationKeys.stats(filters),
      queryFn: () => getEvaluationStatistics(filters),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })
  }

  return {
    prefetchGoalEvaluations,
    prefetchEvaluationProgress,
    prefetchEvaluationStatistics,
  }
}

// Utility hook for goal evaluation management
export function useGoalEvaluationManagement(goalId: string) {
  const evaluations = useGoalEvaluations(goalId)
  const progress = useGoalEvaluationProgress(goalId)
  const createEvaluation = useCreateGoalEvaluation()
  const updateEvaluation = useUpdateGoalEvaluation()
  const deleteEvaluation = useDeleteGoalEvaluation()
  const bulkCreate = useBulkCreateEvaluations()
  const statistics = useEvaluationStatistics({ goalId })

  return {
    // Data
    evaluations: evaluations.data,
    progress: progress.data,
    statistics: statistics.data,
    
    // Loading states
    isLoadingEvaluations: evaluations.isLoading,
    isLoadingProgress: progress.isLoading,
    isLoadingStats: statistics.isLoading,
    isCreating: createEvaluation.isPending,
    isUpdating: updateEvaluation.isPending,
    isDeleting: deleteEvaluation.isPending,
    isBulkCreating: bulkCreate.isPending,
    
    // Error states
    evaluationsError: evaluations.error,
    progressError: progress.error,
    statsError: statistics.error,
    createError: createEvaluation.error,
    updateError: updateEvaluation.error,
    deleteError: deleteEvaluation.error,
    bulkCreateError: bulkCreate.error,
    
    // Actions
    createEvaluation: createEvaluation.mutate,
    updateEvaluation: updateEvaluation.mutate,
    deleteEvaluation: deleteEvaluation.mutate,
    bulkCreateEvaluations: bulkCreate.mutate,
    
    // Refetch functions
    refetchEvaluations: evaluations.refetch,
    refetchProgress: progress.refetch,
    refetchStatistics: statistics.refetch,
  }
}

// Hook for patient evaluation overview
export function usePatientEvaluationOverview(patientId: string) {
  const evaluations = useGoalEvaluationsWithFilters({ patientId, limit: 50 })
  const statistics = useEvaluationStatistics({ patientId })

  return {
    // Data
    evaluations: evaluations.data,
    statistics: statistics.data,
    
    // Loading states
    isLoadingEvaluations: evaluations.isLoading,
    isLoadingStats: statistics.isLoading,
    
    // Error states
    evaluationsError: evaluations.error,
    statsError: statistics.error,
    
    // Refetch functions
    refetchEvaluations: evaluations.refetch,
    refetchStatistics: statistics.refetch,
  }
}

// Hook for evaluation filtering and sorting
export function useEvaluationFilters() {
  const getEvaluationsByType = (evaluations: any[], type: string) => {
    return evaluations?.filter(evaluation => evaluation.evaluation_type === type) || []
  }
  
  const getEvaluationsByDateRange = (evaluations: any[], startDate: string, endDate: string) => {
    return evaluations?.filter(evaluation => {
      const evalDate = new Date(evaluation.evaluation_date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return evalDate >= start && evalDate <= end
    }) || []
  }
  
  const getEvaluationsByCompletionRate = (evaluations: any[], min: number, max: number) => {
    return evaluations?.filter(evaluation => {
      const rate = evaluation.completion_rate
      return rate !== null && rate >= min && rate <= max
    }) || []
  }
  
  const sortEvaluationsByDate = (evaluations: any[], ascending = false) => {
    return [...(evaluations || [])].sort((a, b) => {
      const dateA = new Date(a.evaluation_date).getTime()
      const dateB = new Date(b.evaluation_date).getTime()
      return ascending ? dateA - dateB : dateB - dateA
    })
  }
  
  const sortEvaluationsByCompletionRate = (evaluations: any[], ascending = true) => {
    return [...(evaluations || [])].sort((a, b) => {
      const rateA = a.completion_rate || 0
      const rateB = b.completion_rate || 0
      return ascending ? rateA - rateB : rateB - rateA
    })
  }
  
  return {
    getEvaluationsByType,
    getEvaluationsByDateRange,
    getEvaluationsByCompletionRate,
    sortEvaluationsByDate,
    sortEvaluationsByCompletionRate,
  }
} 