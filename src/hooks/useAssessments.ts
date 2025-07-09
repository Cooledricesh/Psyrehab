import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AssessmentData, CreateAssessmentData } from '@/types/assessment'
import { handleApiError } from '@/utils/error-handler'

// API functions (실제 구현에서는 Supabase 클라이언트 사용)
const assessmentApi = {
  // 모든 평가 조회
  getAll: async (): Promise<AssessmentData[]> => {
    // 실제 구현에서는 Supabase에서 데이터를 가져옴
    // 현재는 모의 데이터 반환
    return []
  },

  // 특정 평가 조회
  getById: async (): Promise<AssessmentData | null> => {
    // 실제 구현에서는 Supabase에서 특정 ID의 데이터를 가져옴
    return null
  },

  // 환자별 평가 조회
  getByPatientId: async (): Promise<AssessmentData[]> => {
    // 실제 구현에서는 환자 ID로 필터링된 데이터를 가져옴
    return []
  },

  // 새 평가 생성
  create: async (data: CreateAssessmentData): Promise<AssessmentData> => {
    // 실제 구현에서는 Supabase에 데이터를 저장
    const newAssessment: AssessmentData = {
      id: `assessment_${Date.now()}`,
      patient_id: data.patient_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data
    }
    return newAssessment
  },

  // 평가 업데이트
  update: async (id: string, data: Partial<AssessmentData>): Promise<AssessmentData> => {
    // 실제 구현에서는 Supabase에서 데이터를 업데이트
    const updatedAssessment: AssessmentData = {
      id,
      updated_at: new Date().toISOString(),
      ...data
    } as AssessmentData
    return updatedAssessment
  },

  // 평가 삭제
  delete: async (id: string): Promise<void> => {
    // 실제 구현에서는 Supabase에서 데이터를 삭제
    console.log(`Deleting assessment ${id}`)
  },

  // 날짜 범위별 평가 조회
  getByDateRange: async (): Promise<AssessmentData[]> => {
    // 실제 구현에서는 날짜 범위로 필터링된 데이터를 가져옴
    return []
  }
}

// Query keys
export const assessmentKeys = {
  all: ['assessments'] as const,
  lists: () => [...assessmentKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...assessmentKeys.lists(), { filters }] as const,
  details: () => [...assessmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...assessmentKeys.details(), id] as const,
  byPatient: (patientId: string) => [...assessmentKeys.all, 'byPatient', patientId] as const,
  byDateRange: (startDate: string, endDate: string) => [...assessmentKeys.all, 'byDateRange', startDate, endDate] as const,
}

// 모든 평가 조회 훅
export const useAssessments = (filters?: Record<string, unknown>) => {
  return useQuery({
    queryKey: assessmentKeys.list(filters || {}),
    queryFn: () => assessmentApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: false,
  })
}

// 특정 평가 조회 훅
export const useAssessment = (id: string) => {
  return useQuery({
    queryKey: assessmentKeys.detail(id),
    queryFn: () => assessmentApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

// 환자별 평가 조회 훅
export const usePatientAssessments = (patientId: string) => {
  return useQuery({
    queryKey: assessmentKeys.byPatient(patientId),
    queryFn: () => assessmentApi.getByPatientId(patientId),
    enabled: !!patientId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

// 날짜 범위별 평가 조회 훅
export const useDateRangeAssessments = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: assessmentKeys.byDateRange(startDate, endDate),
    queryFn: () => assessmentApi.getByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

// 평가 생성 훅
export const useCreateAssessment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAssessmentData) => assessmentApi.create(data),
    onSuccess: (newAssessment) => {
      // 전체 평가 목록 무효화
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() })
      
      // 환자별 평가 목록 무효화
      queryClient.invalidateQueries({ 
        queryKey: assessmentKeys.byPatient(newAssessment.patient_id) 
      })

      // 새로운 평가를 캐시에 추가
      queryClient.setQueryData(
        assessmentKeys.detail(newAssessment.id),
        newAssessment
      )
    },
    onError: (error) => {
      handleApiError(error, 'useCreateAssessment.onError')
    }
  })
}

// 평가 업데이트 훅
export const useUpdateAssessment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssessmentData> }) => 
      assessmentApi.update(id, data),
    onSuccess: (updatedAssessment) => {
      // 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() })
      queryClient.invalidateQueries({ 
        queryKey: assessmentKeys.byPatient(updatedAssessment.patient_id) 
      })

      // 업데이트된 평가를 캐시에 설정
      queryClient.setQueryData(
        assessmentKeys.detail(updatedAssessment.id),
        updatedAssessment
      )
    },
    onError: (error) => {
      handleApiError(error, 'useUpdateAssessment.onError')
    }
  })
}

// 평가 삭제 훅
export const useDeleteAssessment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => assessmentApi.delete(id),
    onSuccess: (_, deletedId) => {
      // 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all })

      // 삭제된 평가를 캐시에서 제거
      queryClient.removeQueries({ queryKey: assessmentKeys.detail(deletedId) })
    },
    onError: (error) => {
      handleApiError(error, 'useDeleteAssessment.onError')
    }
  })
}

// 대량 작업을 위한 훅들
export const useBulkDeleteAssessments = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => assessmentApi.delete(id)))
      return ids
    },
    onSuccess: (deletedIds) => {
      // 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all })

      // 삭제된 평가들을 캐시에서 제거
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: assessmentKeys.detail(id) })
      })
    },
    onError: (error) => {
      handleApiError(error, 'useBulkDeleteAssessments.onError')
    }
  })
}

// 평가 통계 훅 (추가 기능)
export const useAssessmentStats = () => {
  const { data: assessments = [] } = useAssessments()

  return {
    totalAssessments: assessments.length,
    uniquePatients: new Set(assessments.map(a => a.patient_id)).size,
    recentAssessments: assessments.filter(a => {
      const createdDate = new Date(a.created_at)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return createdDate >= sevenDaysAgo
    }).length,
    averageScores: calculateAverageScores(assessments)
  }
}

// 평균 점수 계산 유틸리티
const calculateAverageScores = (assessments: AssessmentData[]) => {
  if (assessments.length === 0) {
    return { concentration: 0, motivation: 0, success: 0, constraints: 0, social: 0, overall: 0 }
  }

  const totalCount = assessments.length
  
  const sums = assessments.reduce((acc, assessment) => {
    // 집중력 점수 계산 (분 단위를 1-5 점수로 변환)
    const concentrationScore = Math.min(5, Math.max(1, assessment.concentration_time.duration / 60))
    
    // 동기 점수 계산 (1-5 척도의 평균)
    const motivationScore = (
      (assessment.motivation_level.goal_clarity || 0) +
      (assessment.motivation_level.effort_willingness || 0) +
      (assessment.motivation_level.confidence_level || 0) +
      (assessment.motivation_level.external_support || 0)
    ) / 4

    // 성공경험 점수 계산
    const successScore = Math.min(5, Math.max(1, 
      (assessment.past_successes.achievement_areas?.length || 0) * 0.5 +
      (assessment.past_successes.most_significant_achievement ? 2 : 0) +
      (assessment.past_successes.learning_from_success ? 1 : 0) +
      (assessment.past_successes.transferable_strategies ? 1 : 0)
    ))

    // 제약요인 점수 계산 (역점수: 제약이 적을수록 높은 점수)
    const constraintsScore = 6 - (assessment.constraints.severity_rating || 3)

    // 사회성 점수 계산
    const socialScore = (
      (assessment.social_preference.comfort_with_strangers || 0) +
      (assessment.social_preference.collaboration_willingness || 0)
    ) / 2

    acc.concentration += concentrationScore
    acc.motivation += motivationScore
    acc.success += successScore
    acc.constraints += constraintsScore
    acc.social += socialScore
    acc.overall += (concentrationScore + motivationScore + successScore + constraintsScore + socialScore) / 5

    return acc
  }, { concentration: 0, motivation: 0, success: 0, constraints: 0, social: 0, overall: 0 })

  return {
    concentration: Number((sums.concentration / totalCount).toFixed(2)),
    motivation: Number((sums.motivation / totalCount).toFixed(2)),
    success: Number((sums.success / totalCount).toFixed(2)),
    constraints: Number((sums.constraints / totalCount).toFixed(2)),
    social: Number((sums.social / totalCount).toFixed(2)),
    overall: Number((sums.overall / totalCount).toFixed(2))
  }
} 