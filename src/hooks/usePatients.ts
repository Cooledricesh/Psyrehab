import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PatientService, type PatientCreateData, type PatientUpdateData, type PatientListParams } from '@/services/patients'

// Query Keys
export const patientQueryKeys = {
  all: ['patients'] as const,
  lists: () => [...patientQueryKeys.all, 'list'] as const,
  list: (params: PatientListParams) => [...patientQueryKeys.lists(), params] as const,
  details: () => [...patientQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientQueryKeys.details(), id] as const,
  stats: () => [...patientQueryKeys.all, 'stats'] as const,
}

// 환자 목록 조회 훅
export function usePatients(params: PatientListParams = {}) {
  return useQuery({
    queryKey: patientQueryKeys.list(params),
    queryFn: () => PatientService.getPatients(params),
    staleTime: 5 * 60 * 1000, // 5분
    retry: 2,
  })
}

// 환자 상세 조회 훅
export function usePatient(id: string) {
  return useQuery({
    queryKey: patientQueryKeys.detail(id),
    queryFn: () => PatientService.getPatient(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5분
    retry: 2,
  })
}

// 환자 통계 조회 훅
export function usePatientStats() {
  return useQuery({
    queryKey: patientQueryKeys.stats(),
    queryFn: () => PatientService.getPatientStats(),
    staleTime: 10 * 60 * 1000, // 10분
    retry: 2,
  })
}

// 환자 등록 훅
export function useCreatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (patientData: PatientCreateData) => PatientService.createPatient(patientData),
    onSuccess: (newPatient) => {
      // 환자 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.lists() })
      // 통계 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.stats() })
      
      // 새로 생성된 환자를 캐시에 추가
      queryClient.setQueryData(
        patientQueryKeys.detail(newPatient.id),
        newPatient
      )
    },
    onError: (error: Error) => {
      console.error('환자 등록 실패:', error.message)
    },
  })
}

// 환자 정보 수정 훅
export function useUpdatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PatientUpdateData }) => 
      PatientService.updatePatient(id, data),
    onSuccess: (updatedPatient, { id }) => {
      // 환자 상세 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.detail(id) })
      // 환자 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.lists() })
      
      // 업데이트된 환자 정보를 캐시에 설정
      queryClient.setQueryData(
        patientQueryKeys.detail(id),
        updatedPatient
      )
    },
    onError: (error: Error) => {
      console.error('환자 정보 수정 실패:', error.message)
    },
  })
}

// 환자 삭제 훅
export function useDeletePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => PatientService.deletePatient(id),
    onSuccess: (_, id) => {
      // 환자 상세 쿼리 제거
      queryClient.removeQueries({ queryKey: patientQueryKeys.detail(id) })
      // 환자 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.lists() })
      // 통계 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.stats() })
    },
    onError: (error: Error) => {
      console.error('환자 삭제 실패:', error.message)
    },
  })
}

// 사회복지사 배정 훅
export function useAssignSocialWorker() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ patientId, socialWorkerId }: { patientId: string; socialWorkerId: string }) =>
      PatientService.assignSocialWorker(patientId, socialWorkerId),
    onSuccess: (_, { patientId }) => {
      // 해당 환자 상세 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.detail(patientId) })
      // 환자 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.lists() })
    },
    onError: (error: Error) => {
      console.error('사회복지사 배정 실패:', error.message)
    },
  })
}

// 환자 상태 변경 훅
export function useUpdatePatientStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      PatientService.updatePatientStatus(id, status),
    onSuccess: (_, { id }) => {
      // 해당 환자 상세 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.detail(id) })
      // 환자 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.lists() })
      // 통계 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.stats() })
    },
    onError: (error: Error) => {
      console.error('환자 상태 변경 실패:', error.message)
    },
  })
}

// 환자 목록 프리페치 훅
export function usePrefetchPatients() {
  const queryClient = useQueryClient()

  return (params: PatientListParams) => {
    queryClient.prefetchQuery({
      queryKey: patientQueryKeys.list(params),
      queryFn: () => PatientService.getPatients(params),
      staleTime: 5 * 60 * 1000,
    })
  }
}

// 환자 상세 프리페치 훅
export function usePrefetchPatient() {
  const queryClient = useQueryClient()

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: patientQueryKeys.detail(id),
      queryFn: () => PatientService.getPatient(id),
      staleTime: 5 * 60 * 1000,
    })
  }
} 