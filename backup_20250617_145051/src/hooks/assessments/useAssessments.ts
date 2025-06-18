// Assessment related React Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AssessmentService } from '@/services/assessments'
import type {
  AssessmentData,
  AssessmentCreateRequest,
  AssessmentUpdateRequest,
  AssessmentListParams,
  AssessmentStats,
  AssessmentComparison,
  AssessmentVisualizationData
} from '@/types/assessment'

// Query keys
export const assessmentKeys = {
  all: ['assessments'] as const,
  lists: () => [...assessmentKeys.all, 'list'] as const,
  list: (params: AssessmentListParams) => [...assessmentKeys.lists(), params] as const,
  details: () => [...assessmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...assessmentKeys.details(), id] as const,
  stats: (patientId: string) => [...assessmentKeys.all, 'stats', patientId] as const,
  comparison: (currentId: string, previousId?: string) => [...assessmentKeys.all, 'comparison', currentId, previousId] as const,
  visualization: (patientId: string) => [...assessmentKeys.all, 'visualization', patientId] as const,
}

// Get assessments list with filtering and pagination
export function useAssessments(params: AssessmentListParams = {}) {
  return useQuery({
    queryKey: assessmentKeys.list(params),
    queryFn: () => AssessmentService.getAssessments(params),
    keepPreviousData: true, // Keep previous data while loading new page
  })
}

// Get patient-specific assessments
export function usePatientAssessments(patientId: string, additionalParams: Omit<AssessmentListParams, 'filters'> = {}) {
  const params: AssessmentListParams = {
    ...additionalParams,
    filters: {
      patient_id: patientId,
      ...additionalParams.filters
    }
  }

  return useQuery({
    queryKey: assessmentKeys.list(params),
    queryFn: () => AssessmentService.getAssessments(params),
    enabled: !!patientId,
    keepPreviousData: true,
  })
}

// Get specific assessment details
export function useAssessment(assessmentId: string) {
  return useQuery({
    queryKey: assessmentKeys.detail(assessmentId),
    queryFn: () => AssessmentService.getAssessment(assessmentId),
    enabled: !!assessmentId,
  })
}

// Get patient assessment statistics
export function usePatientAssessmentStats(patientId: string) {
  return useQuery({
    queryKey: assessmentKeys.stats(patientId),
    queryFn: () => AssessmentService.getPatientAssessmentStats(patientId),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get assessment comparison
export function useAssessmentComparison(currentId: string, previousId?: string) {
  return useQuery({
    queryKey: assessmentKeys.comparison(currentId, previousId),
    queryFn: () => AssessmentService.compareAssessments(currentId, previousId),
    enabled: !!currentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get visualization data for patient
export function useAssessmentVisualization(patientId: string) {
  return useQuery({
    queryKey: assessmentKeys.visualization(patientId),
    queryFn: () => AssessmentService.getVisualizationData(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Create assessment mutation
export function useCreateAssessment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: AssessmentCreateRequest) => AssessmentService.createAssessment(request),
    onSuccess: (data) => {
      // Add to cache
      queryClient.setQueryData(assessmentKeys.detail(data.id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.stats(data.patient_id) })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.visualization(data.patient_id) })
      
      // Invalidate comparisons that might involve this assessment
      queryClient.invalidateQueries({ 
        queryKey: assessmentKeys.all,
        predicate: (query) => query.queryKey.includes('comparison')
      })
    },
  })
}

// Update assessment mutation
export function useUpdateAssessment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: AssessmentUpdateRequest }) =>
      AssessmentService.updateAssessment(id, request),
    onSuccess: (data) => {
      // Update the specific assessment in cache
      queryClient.setQueryData(assessmentKeys.detail(data.id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.stats(data.patient_id) })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.visualization(data.patient_id) })
      
      // Invalidate comparisons
      queryClient.invalidateQueries({ 
        queryKey: assessmentKeys.all,
        predicate: (query) => query.queryKey.includes('comparison')
      })
    },
  })
}

// Update assessment status mutation
export function useUpdateAssessmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AssessmentData['status'] }) =>
      AssessmentService.updateAssessmentStatus(id, status),
    onSuccess: (data) => {
      // Update the specific assessment in cache
      queryClient.setQueryData(assessmentKeys.detail(data.id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.stats(data.patient_id) })
      
      // If status changed to completed, invalidate visualization data
      if (data.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: assessmentKeys.visualization(data.patient_id) })
        queryClient.invalidateQueries({ 
          queryKey: assessmentKeys.all,
          predicate: (query) => query.queryKey.includes('comparison')
        })
      }
    },
  })
}

// Delete assessment mutation
export function useDeleteAssessment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => AssessmentService.deleteAssessment(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: assessmentKeys.detail(deletedId) })
      
      // Invalidate lists and related queries
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() })
      queryClient.invalidateQueries({ 
        queryKey: assessmentKeys.all,
        predicate: (query) => query.queryKey.includes('stats') || 
                              query.queryKey.includes('visualization') ||
                              query.queryKey.includes('comparison')
      })
    },
  })
}

// Duplicate assessment mutation
export function useDuplicateAssessment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, newPatientId }: { id: string; newPatientId?: string }) =>
      AssessmentService.duplicateAssessment(id, newPatientId),
    onSuccess: (data) => {
      // Add to cache
      queryClient.setQueryData(assessmentKeys.detail(data.id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.stats(data.patient_id) })
    },
  })
}

// Custom hooks for common use cases

// Hook to get latest assessment for a patient
export function useLatestAssessment(patientId: string) {
  return usePatientAssessments(patientId, {
    limit: 1,
    sort_by: 'assessment_date',
    sort_order: 'desc',
    filters: { status: 'completed' }
  })
}

// Hook to get draft assessments for a patient
export function useDraftAssessments(patientId: string) {
  return usePatientAssessments(patientId, {
    filters: { status: 'draft' }
  })
}

// Hook to get completed assessments for a patient with pagination
export function useCompletedAssessments(patientId: string, page: number = 1, limit: number = 10) {
  return usePatientAssessments(patientId, {
    page,
    limit,
    sort_by: 'assessment_date',
    sort_order: 'desc',
    filters: { status: 'completed' }
  })
}

// Hook to check if assessment is due (based on last completed assessment)
export function useAssessmentDue(patientId: string, daysSinceLastAssessment: number = 30) {
  const { data: latestAssessment } = useLatestAssessment(patientId)
  
  return useQuery({
    queryKey: [...assessmentKeys.all, 'due', patientId, daysSinceLastAssessment],
    queryFn: () => {
      if (!latestAssessment?.data?.[0]) {
        return { isDue: true, daysSinceLastAssessment: null }
      }
      
      const lastAssessmentDate = new Date(latestAssessment.data[0].assessment_date)
      const today = new Date()
      const daysSinceLast = Math.floor((today.getTime() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        isDue: daysSinceLast >= daysSinceLastAssessment,
        daysSinceLastAssessment: daysSinceLast,
        lastAssessmentDate: lastAssessmentDate.toISOString().split('T')[0]
      }
    },
    enabled: !!patientId,
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

// =================
// HISTORY TRACKING HOOKS
// =================

/**
 * Hook to get assessment history with filtering
 */
export function useAssessmentHistory(params: AssessmentHistoryParams) {
  return useQuery({
    queryKey: ['assessment-history', params],
    queryFn: () => AssessmentService.getAssessmentHistory(params),
    enabled: !!(params.assessment_id || params.patient_id),
  })
}

/**
 * Hook to get assessment version information
 */
export function useAssessmentVersionInfo(assessmentId: string) {
  return useQuery({
    queryKey: ['assessment-version-info', assessmentId],
    queryFn: () => AssessmentService.getAssessmentVersionInfo(assessmentId),
    enabled: !!assessmentId,
  })
}

/**
 * Hook to get assessment timeline for a patient
 */
export function useAssessmentTimeline(patientId: string) {
  return useQuery({
    queryKey: ['assessment-timeline', patientId],
    queryFn: () => AssessmentService.getAssessmentTimeline(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get milestones for a patient
 */
export function useMilestones(patientId: string) {
  return useQuery({
    queryKey: ['milestones', patientId],
    queryFn: () => AssessmentService.getMilestones(patientId),
    enabled: !!patientId,
  })
}

/**
 * Hook to get insights for a patient
 */
export function useInsights(patientId: string, activeOnly: boolean = true) {
  return useQuery({
    queryKey: ['insights', patientId, activeOnly],
    queryFn: () => AssessmentService.getInsights(patientId, activeOnly),
    enabled: !!patientId,
  })
}

/**
 * Mutation hook to create a history entry
 */
export function useCreateHistoryEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateHistoryEntryRequest) => 
      AssessmentService.createHistoryEntry(request),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['assessment-history', { assessment_id: variables.assessment_id }] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['assessment-version-info', variables.assessment_id] 
      })
    },
  })
}

/**
 * Mutation hook to create a milestone
 */
export function useCreateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (milestone: Omit<AssessmentMilestone, 'id' | 'created_at' | 'created_by'>) => 
      AssessmentService.createMilestone(milestone),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['milestones', data.patient_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['assessment-timeline', data.patient_id] 
      })
    },
  })
}

/**
 * Mutation hook to create an insight
 */
export function useCreateInsight() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (insight: Omit<ProgressInsight, 'id' | 'created_at' | 'created_by'>) => 
      AssessmentService.createInsight(insight),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['insights', data.patient_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['assessment-timeline', data.patient_id] 
      })
    },
  })
} 