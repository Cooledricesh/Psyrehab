import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  SocialWorkerService, 
  type SocialWorkerListParams 
} from '@/services/social-workers'

// Query Keys
export const socialWorkerKeys = {
  all: ['social-workers'] as const,
  lists: () => [...socialWorkerKeys.all, 'list'] as const,
  list: (params: SocialWorkerListParams) => [...socialWorkerKeys.lists(), params] as const,
  details: () => [...socialWorkerKeys.all, 'detail'] as const,
  detail: (id: string) => [...socialWorkerKeys.details(), id] as const,
  active: () => [...socialWorkerKeys.all, 'active'] as const,
  workload: () => [...socialWorkerKeys.all, 'workload'] as const,
  patients: (id: string) => [...socialWorkerKeys.detail(id), 'patients'] as const,
  recommended: () => [...socialWorkerKeys.all, 'recommended'] as const,
}

/**
 * 사회복지사 목록 조회 훅
 */
export function useSocialWorkers(params: SocialWorkerListParams = {}) {
  return useQuery({
    queryKey: socialWorkerKeys.list(params),
    queryFn: () => SocialWorkerService.getSocialWorkers(params),
    staleTime: 5 * 60 * 1000, // 5분
  })
}

/**
 * 단일 사회복지사 조회 훅
 */
export function useSocialWorker(id: string) {
  return useQuery({
    queryKey: socialWorkerKeys.detail(id),
    queryFn: () => SocialWorkerService.getSocialWorker(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5분
  })
}

/**
 * 활성 사회복지사 목록 조회 훅 (드롭다운용)
 */
export function useActiveSocialWorkers() {
  return useQuery({
    queryKey: socialWorkerKeys.active(),
    queryFn: () => SocialWorkerService.getActiveSocialWorkers(),
    staleTime: 10 * 60 * 1000, // 10분
  })
}

/**
 * 사회복지사 업무량 통계 조회 훅
 */
export function useSocialWorkerWorkloadStats() {
  return useQuery({
    queryKey: socialWorkerKeys.workload(),
    queryFn: () => SocialWorkerService.getSocialWorkerWorkloadStats(),
    staleTime: 5 * 60 * 1000, // 5분
  })
}

/**
 * 특정 사회복지사의 담당 환자 목록 조회 훅
 */
export function usePatientsBySocialWorker(socialWorkerId: string) {
  return useQuery({
    queryKey: socialWorkerKeys.patients(socialWorkerId),
    queryFn: () => SocialWorkerService.getPatientsBySocialWorker(socialWorkerId),
    enabled: !!socialWorkerId,
    staleTime: 5 * 60 * 1000, // 5분
  })
}

/**
 * 추천 사회복지사 조회 훅
 */
export function useRecommendedSocialWorkers(limit: number = 3) {
  return useQuery({
    queryKey: [...socialWorkerKeys.recommended(), limit],
    queryFn: () => SocialWorkerService.getRecommendedSocialWorkers(limit),
    staleTime: 5 * 60 * 1000, // 5분
  })
}

/**
 * 환자에게 사회복지사 배정 Mutation
 */
export function useAssignSocialWorker() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ patientId, socialWorkerId }: { patientId: string; socialWorkerId: string }) =>
      SocialWorkerService.assignSocialWorkerToPatient(patientId, socialWorkerId),
    onSuccess: (_, { patientId, socialWorkerId }) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      queryClient.invalidateQueries({ queryKey: socialWorkerKeys.all })
      queryClient.invalidateQueries({ queryKey: socialWorkerKeys.patients(socialWorkerId) })
    },
  })
}

/**
 * 환자의 사회복지사 배정 해제 Mutation
 */
export function useUnassignSocialWorker() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (patientId: string) =>
      SocialWorkerService.unassignSocialWorkerFromPatient(patientId),
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      queryClient.invalidateQueries({ queryKey: socialWorkerKeys.all })
    },
  })
} 