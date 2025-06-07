// AI Goal Recommendations related React Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPatientAIRecommendations,
  getAIRecommendationWithDetails,
  getActivePatientRecommendation,
  createAIRecommendation,
  updateAIRecommendation,
  applyAIRecommendation,
  deactivateAIRecommendation,
  deleteAIRecommendation,
  getAIRecommendations,
  generateAIRecommendationFromAssessment,
  getAIRecommendationStatistics,
  getRecentAIRecommendations,
} from '@/services/ai-recommendations'

// Temporary types until Supabase types are properly generated
type TablesInsert<T extends string> = any
type TablesUpdate<T extends string> = any

// Query keys
export const aiRecommendationKeys = {
  all: ['ai-recommendations'] as const,
  lists: () => [...aiRecommendationKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...aiRecommendationKeys.lists(), filters] as const,
  patient: (patientId: string) => [...aiRecommendationKeys.all, 'patient', patientId] as const,
  activePatient: (patientId: string) => [...aiRecommendationKeys.all, 'active-patient', patientId] as const,
  details: () => [...aiRecommendationKeys.all, 'detail'] as const,
  detail: (id: string) => [...aiRecommendationKeys.details(), id] as const,
  statistics: () => [...aiRecommendationKeys.all, 'statistics'] as const,
  stats: (filters?: Record<string, any>) => [...aiRecommendationKeys.statistics(), filters] as const,
  recent: (limit?: number) => [...aiRecommendationKeys.all, 'recent', limit] as const,
}

// Get AI recommendations for a patient
export function usePatientAIRecommendations(patientId: string) {
  return useQuery({
    queryKey: aiRecommendationKeys.patient(patientId),
    queryFn: () => getPatientAIRecommendations(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get active AI recommendation for a patient
export function useActivePatientRecommendation(patientId: string) {
  return useQuery({
    queryKey: aiRecommendationKeys.activePatient(patientId),
    queryFn: () => getActivePatientRecommendation(patientId),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get AI recommendation details
export function useAIRecommendationDetails(recommendationId: string) {
  return useQuery({
    queryKey: aiRecommendationKeys.detail(recommendationId),
    queryFn: () => getAIRecommendationWithDetails(recommendationId),
    enabled: !!recommendationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get AI recommendations with filters
export function useAIRecommendations(filters: {
  patientId?: string
  isActive?: boolean
  dateFrom?: string
  dateTo?: string
  hasAssessment?: boolean
  appliedBy?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: aiRecommendationKeys.list(filters),
    queryFn: () => getAIRecommendations(filters),
    enabled: Object.values(filters).some(value => value !== undefined),
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

// Get AI recommendation statistics
export function useAIRecommendationStatistics(filters?: {
  dateFrom?: string
  dateTo?: string
  socialWorkerId?: string
}) {
  return useQuery({
    queryKey: aiRecommendationKeys.stats(filters),
    queryFn: () => getAIRecommendationStatistics(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get recent AI recommendations
export function useRecentAIRecommendations(limit = 10) {
  return useQuery({
    queryKey: aiRecommendationKeys.recent(limit),
    queryFn: () => getRecentAIRecommendations(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Create AI recommendation mutation
export function useCreateAIRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recommendation: TablesInsert<'ai_goal_recommendations'>) => 
      createAIRecommendation(recommendation),
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.patient(data.patient_id) })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.statistics() })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.recent() })
    },
  })
}

// Update AI recommendation mutation
export function useUpdateAIRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate<'ai_goal_recommendations'> }) =>
      updateAIRecommendation(id, updates),
    onSuccess: (data) => {
      // Update the specific recommendation in cache
      queryClient.setQueryData(aiRecommendationKeys.detail(data.id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.patient(data.patient_id) })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.statistics() })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.recent() })
    },
  })
}

// Apply AI recommendation mutation
export function useApplyAIRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ recommendationId, appliedBy }: { recommendationId: string; appliedBy: string }) =>
      applyAIRecommendation(recommendationId, appliedBy),
    onSuccess: (data) => {
      // Update caches
      queryClient.setQueryData(aiRecommendationKeys.detail(data.id), data)
      queryClient.setQueryData(aiRecommendationKeys.activePatient(data.patient_id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.patient(data.patient_id) })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.statistics() })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.recent() })
    },
  })
}

// Deactivate AI recommendation mutation
export function useDeactivateAIRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivateAIRecommendation,
    onSuccess: (data) => {
      // Update the specific recommendation in cache
      queryClient.setQueryData(aiRecommendationKeys.detail(data.id), data)
      
      // Clear active patient recommendation if this was it
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.activePatient(data.patient_id) })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.patient(data.patient_id) })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.statistics() })
    },
  })
}

// Delete AI recommendation mutation
export function useDeleteAIRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAIRecommendation,
    onSuccess: (_, deletedId) => {
      // Remove from cache and invalidate related queries
      queryClient.removeQueries({ queryKey: aiRecommendationKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.statistics() })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.recent() })
    },
  })
}

// Generate AI recommendation from assessment mutation
export function useGenerateAIRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      patientId, 
      assessmentId, 
      socialWorkerId 
    }: { 
      patientId: string
      assessmentId: string
      socialWorkerId?: string 
    }) => generateAIRecommendationFromAssessment(patientId, assessmentId, socialWorkerId),
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.patient(data.patient_id) })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.statistics() })
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.recent() })
    },
  })
}

// Bulk operations for AI recommendations
export function useBulkAIRecommendations() {
  const queryClient = useQueryClient()

  const bulkApply = useMutation({
    mutationFn: async (applications: { recommendationId: string; appliedBy: string }[]) => {
      const results = await Promise.all(
        applications.map(({ recommendationId, appliedBy }) => 
          applyAIRecommendation(recommendationId, appliedBy)
        )
      )
      return results
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.all })
    },
  })

  const bulkDeactivate = useMutation({
    mutationFn: async (recommendationIds: string[]) => {
      const results = await Promise.all(
        recommendationIds.map(id => deactivateAIRecommendation(id))
      )
      return results
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.all })
    },
  })

  const bulkDelete = useMutation({
    mutationFn: async (recommendationIds: string[]) => {
      await Promise.all(recommendationIds.map(id => deleteAIRecommendation(id)))
      return recommendationIds
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: aiRecommendationKeys.all })
    },
  })

  return {
    bulkApply,
    bulkDeactivate,
    bulkDelete,
  }
}

// Prefetch functions for performance optimization
export function usePrefetchAIRecommendations() {
  const queryClient = useQueryClient()

  const prefetchPatientRecommendations = (patientId: string) => {
    queryClient.prefetchQuery({
      queryKey: aiRecommendationKeys.patient(patientId),
      queryFn: () => getPatientAIRecommendations(patientId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  const prefetchActivePatientRecommendation = (patientId: string) => {
    queryClient.prefetchQuery({
      queryKey: aiRecommendationKeys.activePatient(patientId),
      queryFn: () => getActivePatientRecommendation(patientId),
      staleTime: 2 * 60 * 1000, // 2 minutes
    })
  }

  const prefetchRecommendationDetails = (recommendationId: string) => {
    queryClient.prefetchQuery({
      queryKey: aiRecommendationKeys.detail(recommendationId),
      queryFn: () => getAIRecommendationWithDetails(recommendationId),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })
  }

  const prefetchStatistics = (filters?: {
    dateFrom?: string
    dateTo?: string
    socialWorkerId?: string
  }) => {
    queryClient.prefetchQuery({
      queryKey: aiRecommendationKeys.stats(filters),
      queryFn: () => getAIRecommendationStatistics(filters),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })
  }

  return {
    prefetchPatientRecommendations,
    prefetchActivePatientRecommendation,
    prefetchRecommendationDetails,
    prefetchStatistics,
  }
}

// Utility hooks for specific workflows
export function usePatientRecommendationWorkflow(patientId: string) {
  const patientRecommendations = usePatientAIRecommendations(patientId)
  const activeRecommendation = useActivePatientRecommendation(patientId)
  const generateRecommendation = useGenerateAIRecommendation()
  const applyRecommendation = useApplyAIRecommendation()
  const deactivateRecommendation = useDeactivateAIRecommendation()

  return {
    // Data
    recommendations: patientRecommendations.data,
    activeRecommendation: activeRecommendation.data,
    
    // Loading states
    isLoadingRecommendations: patientRecommendations.isLoading,
    isLoadingActive: activeRecommendation.isLoading,
    isGenerating: generateRecommendation.isPending,
    isApplying: applyRecommendation.isPending,
    isDeactivating: deactivateRecommendation.isPending,
    
    // Error states
    recommendationsError: patientRecommendations.error,
    activeError: activeRecommendation.error,
    generateError: generateRecommendation.error,
    applyError: applyRecommendation.error,
    deactivateError: deactivateRecommendation.error,
    
    // Actions
    generateFromAssessment: generateRecommendation.mutate,
    applyRecommendation: applyRecommendation.mutate,
    deactivateRecommendation: deactivateRecommendation.mutate,
    
    // Refetch functions
    refetchRecommendations: patientRecommendations.refetch,
    refetchActive: activeRecommendation.refetch,
  }
} 