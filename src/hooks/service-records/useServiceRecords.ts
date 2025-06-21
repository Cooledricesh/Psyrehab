// Service Records related React Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPatientServiceRecords,
  getSocialWorkerServiceRecords,
  getServiceRecords,
  getServiceRecordWithDetails,
  createServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
  getPatientServiceStatistics,
  getSocialWorkerServiceStatistics,
  getRecentServiceRecords,
} from '@/services/service-records'

// Temporary types until Supabase types are properly generated
type TablesInsert = Record<string, unknown>
type TablesUpdate = Record<string, unknown>

// Query keys
export const serviceRecordKeys = {
  all: ['service-records'] as const,
  lists: () => [...serviceRecordKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...serviceRecordKeys.lists(), filters] as const,
  patient: (patientId: string) => [...serviceRecordKeys.all, 'patient', patientId] as const,
  socialWorker: (socialWorkerId: string) => [...serviceRecordKeys.all, 'social-worker', socialWorkerId] as const,
  details: () => [...serviceRecordKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceRecordKeys.details(), id] as const,
  statistics: () => [...serviceRecordKeys.all, 'statistics'] as const,
  patientStats: (patientId: string) => [...serviceRecordKeys.statistics(), 'patient', patientId] as const,
  socialWorkerStats: (socialWorkerId: string, dateFrom?: string, dateTo?: string) => 
    [...serviceRecordKeys.statistics(), 'social-worker', socialWorkerId, { dateFrom, dateTo }] as const,
  recent: (limit?: number) => [...serviceRecordKeys.all, 'recent', limit] as const,
}

// Get service records for a patient
export function usePatientServiceRecords(patientId: string) {
  return useQuery({
    queryKey: serviceRecordKeys.patient(patientId),
    queryFn: () => getPatientServiceRecords(patientId),
    enabled: !!patientId,
  })
}

// Get service records for a social worker
export function useSocialWorkerServiceRecords(socialWorkerId: string) {
  return useQuery({
    queryKey: serviceRecordKeys.socialWorker(socialWorkerId),
    queryFn: () => getSocialWorkerServiceRecords(socialWorkerId),
    enabled: !!socialWorkerId,
  })
}

// Get service records with filters
export function useServiceRecords(filters: {
  patientId?: string
  socialWorkerId?: string
  serviceType?: string
  serviceCategory?: string
  isGroupSession?: boolean
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: serviceRecordKeys.list(filters),
    queryFn: () => getServiceRecords(filters),
    enabled: Object.values(filters).some(value => value !== undefined),
  })
}

// Get service record details
export function useServiceRecordDetails(serviceRecordId: string) {
  return useQuery({
    queryKey: serviceRecordKeys.detail(serviceRecordId),
    queryFn: () => getServiceRecordWithDetails(serviceRecordId),
    enabled: !!serviceRecordId,
  })
}

// Get patient service statistics
export function usePatientServiceStatistics(patientId: string) {
  return useQuery({
    queryKey: serviceRecordKeys.patientStats(patientId),
    queryFn: () => getPatientServiceStatistics(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get social worker service statistics
export function useSocialWorkerServiceStatistics(socialWorkerId: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: serviceRecordKeys.socialWorkerStats(socialWorkerId, dateFrom, dateTo),
    queryFn: () => getSocialWorkerServiceStatistics(socialWorkerId, dateFrom, dateTo),
    enabled: !!socialWorkerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get recent service records
export function useRecentServiceRecords(limit = 10) {
  return useQuery({
    queryKey: serviceRecordKeys.recent(limit),
    queryFn: () => getRecentServiceRecords(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Create service record mutation
export function useCreateServiceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (serviceRecord: TablesInsert) => createServiceRecord(serviceRecord),
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.patient(data.patient_id) })
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.socialWorker(data.social_worker_id) })
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.lists() })
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.patientStats(data.patient_id) })
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.socialWorkerStats(data.social_worker_id) })
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.recent() })
    },
  })
}

// Update service record mutation
export function useUpdateServiceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate }) =>
      updateServiceRecord(id, updates),
    onSuccess: (data) => {
      // Update the specific service record in cache
      queryClient.setQueryData(serviceRecordKeys.detail(data.id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.patient(data.patient_id) })
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.socialWorker(data.social_worker_id) })
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.lists() })
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.patientStats(data.patient_id) })
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.socialWorkerStats(data.social_worker_id) })
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.recent() })
    },
  })
}

// Delete service record mutation
export function useDeleteServiceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteServiceRecord,
    onSuccess: (_, deletedId) => {
      // Remove from cache and invalidate related queries
      queryClient.removeQueries({ queryKey: serviceRecordKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.lists() })
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.statistics() })
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.recent() })
    },
  })
}

// Bulk operations
export function useBulkServiceRecords() {
  const queryClient = useQueryClient()

  const bulkCreate = useMutation({
    mutationFn: async (serviceRecords: TablesInsert[]) => {
      const results = await Promise.all(
        serviceRecords.map(record => createServiceRecord(record))
      )
      return results
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.all })
    },
  })

  const bulkUpdate = useMutation({
    mutationFn: async (updates: { id: string; updates: TablesUpdate }[]) => {
      const results = await Promise.all(
        updates.map(({ id, updates: updateData }) => updateServiceRecord(id, updateData))
      )
      return results
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.all })
    },
  })

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => deleteServiceRecord(id)))
      return ids
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: serviceRecordKeys.all })
    },
  })

  return {
    bulkCreate,
    bulkUpdate,
    bulkDelete,
  }
}

// Prefetch functions for performance optimization
export function usePrefetchServiceRecords() {
  const queryClient = useQueryClient()

  const prefetchPatientServiceRecords = (patientId: string) => {
    queryClient.prefetchQuery({
      queryKey: serviceRecordKeys.patient(patientId),
      queryFn: () => getPatientServiceRecords(patientId),
      staleTime: 2 * 60 * 1000, // 2 minutes
    })
  }

  const prefetchServiceRecordDetails = (serviceRecordId: string) => {
    queryClient.prefetchQuery({
      queryKey: serviceRecordKeys.detail(serviceRecordId),
      queryFn: () => getServiceRecordWithDetails(serviceRecordId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  const prefetchPatientStats = (patientId: string) => {
    queryClient.prefetchQuery({
      queryKey: serviceRecordKeys.patientStats(patientId),
      queryFn: () => getPatientServiceStatistics(patientId),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })
  }

  return {
    prefetchPatientServiceRecords,
    prefetchServiceRecordDetails,
    prefetchPatientStats,
  }
} 