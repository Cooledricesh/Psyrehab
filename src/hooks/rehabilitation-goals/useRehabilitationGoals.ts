// Rehabilitation Goals related React Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPatientRehabilitationGoals,
  createRehabilitationGoal,
  updateRehabilitationGoal,
  deleteRehabilitationGoal,
  getRehabilitationGoals,
  updateGoalCompletion,
  getGoalStatistics,
} from '@/services/rehabilitation-goals'

// Temporary types until Supabase types are properly generated
type TablesInsert<T extends string> = any
type TablesUpdate<T extends string> = any

// Query keys
export const rehabilitationGoalKeys = {
  all: ['rehabilitation-goals'] as const,
  lists: () => [...rehabilitationGoalKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...rehabilitationGoalKeys.lists(), filters] as const,
  patient: (patientId: string) => [...rehabilitationGoalKeys.all, 'patient', patientId] as const,
  details: () => [...rehabilitationGoalKeys.all, 'detail'] as const,
  detail: (id: string) => [...rehabilitationGoalKeys.details(), id] as const,
  statistics: () => [...rehabilitationGoalKeys.all, 'statistics'] as const,
  stats: (filters?: Record<string, unknown>) => [...rehabilitationGoalKeys.statistics(), filters] as const,
}

// Get rehabilitation goals for a patient
export function usePatientRehabilitationGoals(patientId: string) {
  return useQuery({
    queryKey: rehabilitationGoalKeys.patient(patientId),
    queryFn: () => getPatientRehabilitationGoals(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get rehabilitation goals with filters
export function useRehabilitationGoals(filters: {
  patientId?: string
  socialWorkerId?: string
  status?: string
  goalType?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: rehabilitationGoalKeys.list(filters),
    queryFn: () => getRehabilitationGoals(filters),
    enabled: Object.values(filters).some(value => value !== undefined),
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

// Get goal statistics
export function useGoalStatistics(filters?: {
  patientId?: string
  socialWorkerId?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: rehabilitationGoalKeys.stats(filters),
    queryFn: () => getGoalStatistics(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Create rehabilitation goal mutation
export function useCreateRehabilitationGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (goal: TablesInsert<'rehabilitation_goals'>) => 
      createRehabilitationGoal(goal),
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: rehabilitationGoalKeys.patient(data.patient_id) })
      queryClient.invalidateQueries({ queryKey: rehabilitationGoalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rehabilitationGoalKeys.statistics() })
    },
  })
}

// Update rehabilitation goal mutation
export function useUpdateRehabilitationGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate<'rehabilitation_goals'> }) =>
      updateRehabilitationGoal(id, updates),
    onSuccess: (data) => {
      // Update the specific goal in cache
      queryClient.setQueryData(rehabilitationGoalKeys.detail(data.id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: rehabilitationGoalKeys.patient(data.patient_id) })
      queryClient.invalidateQueries({ queryKey: rehabilitationGoalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rehabilitationGoalKeys.statistics() })
    },
  })
}

// Update goal completion mutation
export function useUpdateGoalCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ goalId, completionRate }: { goalId: string; completionRate: number }) =>
      updateGoalCompletion(goalId, completionRate),
    onSuccess: (data) => {
      // Update the specific goal in cache
      queryClient.setQueryData(rehabilitationGoalKeys.detail(data.id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: rehabilitationGoalKeys.patient(data.patient_id) })
      queryClient.invalidateQueries({ queryKey: rehabilitationGoalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rehabilitationGoalKeys.statistics() })
    },
  })
}

// Delete rehabilitation goal mutation
export function useDeleteRehabilitationGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRehabilitationGoal,
    onSuccess: (_, deletedId) => {
      // Remove from cache and invalidate related queries
      queryClient.removeQueries({ queryKey: rehabilitationGoalKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: rehabilitationGoalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rehabilitationGoalKeys.statistics() })
    },
  })
}

// Bulk operations for rehabilitation goals
export function useBulkRehabilitationGoals() {
  const queryClient = useQueryClient()

  const bulkUpdateCompletion = useMutation({
    mutationFn: async (updates: { goalId: string; completionRate: number }[]) => {
      const results = await Promise.all(
        updates.map(({ goalId, completionRate }) => 
          updateGoalCompletion(goalId, completionRate)
        )
      )
      return results
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: rehabilitationGoalKeys.all })
    },
  })

  const bulkDelete = useMutation({
    mutationFn: async (goalIds: string[]) => {
      await Promise.all(goalIds.map(id => deleteRehabilitationGoal(id)))
      return goalIds
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: rehabilitationGoalKeys.all })
    },
  })

  return {
    bulkUpdateCompletion,
    bulkDelete,
  }
}

// Prefetch functions for performance optimization
export function usePrefetchRehabilitationGoals() {
  const queryClient = useQueryClient()

  const prefetchPatientGoals = (patientId: string) => {
    queryClient.prefetchQuery({
      queryKey: rehabilitationGoalKeys.patient(patientId),
      queryFn: () => getPatientRehabilitationGoals(patientId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  const prefetchStatistics = (filters?: {
    patientId?: string
    socialWorkerId?: string
    dateFrom?: string
    dateTo?: string
  }) => {
    queryClient.prefetchQuery({
      queryKey: rehabilitationGoalKeys.stats(filters),
      queryFn: () => getGoalStatistics(filters),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })
  }

  return {
    prefetchPatientGoals,
    prefetchStatistics,
  }
}

// Utility hooks for specific workflows
export function usePatientGoalManagement(patientId: string) {
  const patientGoals = usePatientRehabilitationGoals(patientId)
  const createGoal = useCreateRehabilitationGoal()
  const updateGoal = useUpdateRehabilitationGoal()
  const updateCompletion = useUpdateGoalCompletion()
  const deleteGoal = useDeleteRehabilitationGoal()
  const statistics = useGoalStatistics({ patientId })

  return {
    // Data
    goals: patientGoals.data,
    statistics: statistics.data,
    
    // Loading states
    isLoadingGoals: patientGoals.isLoading,
    isLoadingStats: statistics.isLoading,
    isCreating: createGoal.isPending,
    isUpdating: updateGoal.isPending,
    isUpdatingCompletion: updateCompletion.isPending,
    isDeleting: deleteGoal.isPending,
    
    // Error states
    goalsError: patientGoals.error,
    statsError: statistics.error,
    createError: createGoal.error,
    updateError: updateGoal.error,
    completionError: updateCompletion.error,
    deleteError: deleteGoal.error,
    
    // Actions
    createGoal: createGoal.mutate,
    updateGoal: updateGoal.mutate,
    updateCompletion: updateCompletion.mutate,
    deleteGoal: deleteGoal.mutate,
    
    // Refetch functions
    refetchGoals: patientGoals.refetch,
    refetchStatistics: statistics.refetch,
  }
} 