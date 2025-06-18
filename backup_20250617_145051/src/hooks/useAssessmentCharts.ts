import { useQuery } from '@tanstack/react-query'
import { assessmentService } from '@/services/assessmentService'
import { AssessmentData } from '@/types/assessment'
import type { AssessmentComparisonItem } from '@/components/assessments/charts/AssessmentComparisonChart'

// 환자의 모든 평가 데이터 가져오기
export function usePatientAssessments(patientId: string) {
  return useQuery({
    queryKey: ['assessments', 'patient', patientId],
    queryFn: () => assessmentService.getAssessmentsByPatient(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  })
}

// 최신 평가 데이터 가져오기
export function useLatestAssessment(patientId: string) {
  return useQuery({
    queryKey: ['assessments', 'latest', patientId],
    queryFn: async () => {
      const assessments = await assessmentService.getAssessmentsByPatient(patientId)
      return assessments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0] || null
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000, // 2분
  })
}

// 평가 히스토리 (추세 분석용) 가져오기
export function useAssessmentHistory(patientId: string, limit?: number) {
  return useQuery({
    queryKey: ['assessments', 'history', patientId, limit],
    queryFn: async () => {
      const assessments = await assessmentService.getAssessmentsByPatient(patientId)
      const sorted = assessments.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      return limit ? sorted.slice(-limit) : sorted
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

// 여러 환자의 평가 데이터 비교용
export function useMultiplePatientAssessments(patientIds: string[]) {
  return useQuery({
    queryKey: ['assessments', 'multiple', patientIds],
    queryFn: async () => {
      const promises = patientIds.map(async (id) => {
        const assessments = await assessmentService.getAssessmentsByPatient(id)
        return {
          patientId: id,
          assessments
        }
      })
      return Promise.all(promises)
    },
    enabled: patientIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

// 비교 차트용 데이터 준비
export function useAssessmentComparison(patientIds: string[], patientNames?: Record<string, string>) {
  const { data: multipleData, ...query } = useMultiplePatientAssessments(patientIds)
  
  const comparisonData: AssessmentComparisonItem[] = multipleData?.map(({ patientId, assessments }) => ({
    name: patientNames?.[patientId] || `환자 ${patientId}`,
    assessments
  })) || []

  return {
    ...query,
    data: comparisonData
  }
}

// 대시보드용 통합 데이터
export function useDashboardData(patientId: string, comparisonPatientIds?: string[]) {
  const assessmentsQuery = usePatientAssessments(patientId)
  const comparisonQuery = useAssessmentComparison(comparisonPatientIds || [])

  return {
    // 주요 환자 데이터
    assessments: assessmentsQuery.data || [],
    isLoading: assessmentsQuery.isLoading,
    error: assessmentsQuery.error,
    
    // 비교 데이터
    comparisonData: comparisonQuery.data || [],
    isComparisonLoading: comparisonQuery.isLoading,
    comparisonError: comparisonQuery.error,
    
    // 전체 로딩 상태
    isAnyLoading: assessmentsQuery.isLoading || comparisonQuery.isLoading,
    
    // 새로고침 함수
    refetch: () => {
      assessmentsQuery.refetch()
      comparisonQuery.refetch()
    }
  }
}

// 평가 통계 계산 훅
export function useAssessmentStats(assessments: AssessmentData[]) {
  if (assessments.length === 0) {
    return {
      totalCount: 0,
      averageScore: 0,
      latestScore: 0,
      improvementTrend: null,
      frequencyDays: 0
    }
  }

  // 점수 계산 함수
  const calculateScore = (assessment: AssessmentData): number => {
    const concentrationScore = Math.min(5, Math.max(1, assessment.concentration_time.duration / 60))
    const motivationScore = (
      (assessment.motivation_level.goal_clarity || 0) +
      (assessment.motivation_level.effort_willingness || 0) +
      (assessment.motivation_level.confidence_level || 0) +
      (assessment.motivation_level.external_support || 0)
    ) / 4
    const successScore = Math.min(5, Math.max(1, 
      (assessment.past_successes.achievement_areas?.length || 0) * 0.5 +
      (assessment.past_successes.most_significant_achievement ? 2 : 0) +
      (assessment.past_successes.learning_from_success ? 1 : 0) +
      (assessment.past_successes.transferable_strategies ? 1 : 0)
    ))
    const constraintsScore = 6 - (assessment.constraints.severity_rating || 3)
    const socialScore = (
      (assessment.social_preference.comfort_with_strangers || 0) +
      (assessment.social_preference.collaboration_willingness || 0)
    ) / 2

    return (concentrationScore + motivationScore + successScore + constraintsScore + socialScore) / 5
  }

  const scores = assessments.map(calculateScore)
  const sortedByDate = [...assessments].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // 평균 점수
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

  // 최신 점수
  const latestScore = scores[scores.length - 1] || 0

  // 개선 추세 (최근 3개 평가 기준)
  let improvementTrend = null
  if (assessments.length >= 3) {
    const recentScores = scores.slice(-3)
    const isImproving = recentScores[2] > recentScores[0]
    const changeRate = ((recentScores[2] - recentScores[0]) / recentScores[0]) * 100
    improvementTrend = { isImproving, changeRate }
  }

  // 평가 주기
  let frequencyDays = 0
  if (sortedByDate.length > 1) {
    const firstDate = new Date(sortedByDate[0].created_at)
    const lastDate = new Date(sortedByDate[sortedByDate.length - 1].created_at)
    const totalDays = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
    frequencyDays = Math.round(totalDays / (assessments.length - 1))
  }

  return {
    totalCount: assessments.length,
    averageScore: Math.round(averageScore * 10) / 10,
    latestScore: Math.round(latestScore * 10) / 10,
    improvementTrend,
    frequencyDays
  }
}
