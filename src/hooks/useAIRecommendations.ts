import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ENV } from '@/lib/env'
import { handleApiError } from '@/utils/error-handler'

// 새로운 AI 추천 데이터 타입 정의 (n8n이 직접 구조화된 데이터를 저장)
export interface AIRecommendation {
  id: string
  patient_id: string
  assessment_id: string | null
  recommendation_date: string
  recommendations: Array<{
    plan_number: number
    title: string
    purpose: string
    sixMonthGoal: string
    monthlyGoals: Array<{
      month: number
      goal: string
    }>
    weeklyPlans: Array<{
      week: number
      month: number
      plan: string
    }>
  }>
  patient_analysis?: unknown
  success_indicators?: unknown
  execution_strategy?: unknown
  is_active: boolean
  applied_at: string | null
  applied_by: string | null
  created_at: string
  updated_at: string
}

// 파싱된 목표 구조 (이제 직접 recommendations 배열에서 가져옴)
export interface ParsedGoal {
  plan_number: number
  title: string
  purpose: string
  sixMonthGoal: string
  monthlyGoals: Array<{
    month: number
    goal: string
  }>
  weeklyPlans: Array<{
    week: number
    month: number
    plan: string
  }>
}

// AI 추천 요청 훅 (n8n webhook 직접 호출)
export function useRequestAIRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assessmentId: string) => {
      if (!ENV.N8N_WEBHOOK_URL) {
        throw new Error('N8N webhook URL이 설정되지 않았습니다')
      }

      // 평가 데이터 조회
      const { data: assessment, error: fetchError } = await supabase
        .from('assessments')
        .select(`
          *,
          patient:patients!inner(
            id,
            full_name,
            date_of_birth,
            gender,
            additional_info
          )
        `)
        .eq('id', assessmentId)
        .single();

      if (fetchError || !assessment) {
        throw new Error('Assessment를 찾을 수 없습니다');
      }

      // n8n으로 전송할 데이터 구성
      const aiPayload = {
        assessmentId: assessment.id,
        patientId: assessment.patient_id,
        patientInfo: {
          age: assessment.patient.date_of_birth ? 
            Math.floor((new Date().getTime() - new Date(assessment.patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
          gender: assessment.patient.gender || null,
          diagnosis: assessment.patient.additional_info?.diagnosis || null
        },
        assessmentData: {
          focusTime: assessment.focus_time,
          motivationLevel: assessment.motivation_level,
          pastSuccesses: assessment.past_successes || [],
          constraints: assessment.constraints || [],
          socialPreference: assessment.social_preference
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(ENV.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiPayload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to request AI recommendation')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // 해당 평가의 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['assessment', data.data.assessmentId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['ai-recommendation-by-assessment', data.data.assessmentId] 
      })
    },
  })
}

// 환자별 AI 추천 조회 훅
export function useAIRecommendationsByPatient(patientId: string | null) {
  return useQuery({
    queryKey: ['ai-recommendations-by-patient', patientId],
    queryFn: async () => {
      if (!patientId) return []

      const { data, error } = await supabase
        .from('ai_goal_recommendations')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data as AIRecommendation[]
    },
    enabled: !!patientId,
  })
}

// 평가의 AI 추천 조회 훅 - 평가 ID만으로 조회하도록 수정
export function useAIRecommendationByAssessment(
  assessmentId: string | null
) {
  return useQuery({
    queryKey: ['ai-recommendation-by-assessment', assessmentId],
    queryFn: async () => {
      // 평가 ID가 없으면 null 반환
      if (!assessmentId) {
        return null;
      }

      // 평가 ID로만 조회 (환자 ID 조건 제거)
      const { data, error } = await supabase
        .from('ai_goal_recommendations')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        handleApiError(error, 'useAIRecommendations.useAIRecommendationByAssessment');
        throw new Error(error.message)
      }

      console.log('AI 추천 조회 결과:', data);
      return data as AIRecommendation | null
    },
    enabled: !!assessmentId,  // assessmentId가 있을 때만 실행
    refetchInterval: false,    // 자동 리페치 비활성화
    staleTime: 0,             // 항상 새로운 데이터 요청
    cacheTime: 0,             // 캐시 시간도 0으로
  })
}

// 특정 AI 추천 조회 훅
export function useAIRecommendation(recommendationId: string | null) {
  return useQuery({
    queryKey: ['ai-recommendation', recommendationId],
    queryFn: async () => {
      if (!recommendationId) return null

      const { data, error } = await supabase
        .from('ai_goal_recommendations')
        .select('*')
        .eq('id', recommendationId)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as AIRecommendation
    },
    enabled: !!recommendationId,
  })
}

// AI 추천 적용/비활성화 훅
export function useUpdateAIRecommendationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      recommendationId, 
      isActive,
      appliedBy 
    }: { 
      recommendationId: string
      isActive: boolean
      appliedBy?: string
    }) => {
      const updateData: unknown = {
        is_active: isActive,
        updated_at: new Date().toISOString()
      }

      if (!isActive) {
        // 비활성화하는 경우
        updateData.applied_at = null
        updateData.applied_by = null
      } else if (appliedBy) {
        // 활성화/적용하는 경우
        updateData.applied_at = new Date().toISOString()
        updateData.applied_by = appliedBy
      }

      const { data, error } = await supabase
        .from('ai_goal_recommendations')
        .update(updateData)
        .eq('id', recommendationId)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: (data) => {
      // 관련 쿼리 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['ai-recommendation', data.id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['ai-recommendations-by-patient', data.patient_id] 
      })
      if (data.assessment_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['ai-recommendation-by-assessment', data.assessment_id] 
        })
      }
    },
  })
}

// 마크다운 형식의 목표를 파싱하여 구조화된 데이터로 변환하는 함수
// 파싱 함수들은 더 이상 필요하지 않음 (n8n이 구조화된 데이터를 직접 저장)
export function parseAIRecommendationGoals(data: unknown): ParsedGoal[] {
  console.warn('parseAIRecommendationGoals is deprecated. Data is now structured by n8n.')
  
  // 기존 코드와의 호환성을 위해 빈 배열 반환
  if (!data || !Array.isArray(data)) return []
  
  // 만약 이미 구조화된 데이터라면 그대로 반환
  return data as ParsedGoal[]
}


// AI 추천으로부터 재활 목표 생성 훅 (구조화된 데이터 사용)
export function useGenerateGoalsFromRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      recommendationId,
      patientId,
      selectedPlanNumbers
    }: {
      recommendationId: string
      patientId: string
      selectedPlanNumbers: number[]
    }) => {
      // AI 추천 데이터 조회
      const { data: recommendation, error: fetchError } = await supabase
        .from('ai_goal_recommendations')
        .select('*')
        .eq('id', recommendationId)
        .single()

      if (fetchError || !recommendation) {
        throw new Error('Failed to fetch AI recommendation')
      }

      // 구조화된 recommendations 배열에서 선택된 계획들만 필터링
      const selectedGoals = recommendation.recommendations.filter(
        (plan: unknown) => selectedPlanNumbers.includes(plan.plan_number)
      )
      
      // 각 목표를 개별 재활 목표로 변환
      const goals = selectedGoals.map((plan: unknown) => ({
        patient_id: patientId,
        title: plan.title,
        description: plan.purpose,
        target_date: calculateTargetDate('6개월'),
        priority: 'medium' as const,
        status: 'active' as const,
        progress: 0,
        ai_recommendation_id: recommendationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      // 재활 목표 일괄 생성
      const { data: createdGoals, error: createError } = await supabase
        .from('rehabilitation_goals')
        .insert(goals)
        .select()

      if (createError) {
        throw new Error(createError.message)
      }

      // AI 추천을 적용됨으로 표시
      await supabase
        .from('ai_goal_recommendations')
        .update({
          applied_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', recommendationId)

      return {
        goals: createdGoals,
        selectedGoals
      }
    },
    onSuccess: (data, variables) => {
      // 관련 쿼리 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['ai-recommendation', variables.recommendationId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['patient-goals', variables.patientId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['rehabilitation-goals'] 
      })
    },
  })
}

// 타임라인 문자열을 목표 날짜로 변환하는 유틸리티 함수
function calculateTargetDate(timeline: string): string {
  const today = new Date()
  const targetDate = new Date(today)

  // 타임라인 파싱 (예: "2주", "1개월", "3개월", "6개월" 등)
  const timelineMatch = timeline.match(/(\d+)([주월년])/g)
  
  if (timelineMatch) {
    timelineMatch.forEach(match => {
      const [, num, unit] = match.match(/(\d+)([주월년])/) || []
      const value = parseInt(num)
      
      switch (unit) {
        case '주':
          targetDate.setDate(targetDate.getDate() + (value * 7))
          break
        case '개월':
        case '월':
          targetDate.setMonth(targetDate.getMonth() + value)
          break
        case '년':
          targetDate.setFullYear(targetDate.getFullYear() + value)
          break
      }
    })
  } else {
    // 기본값: 1개월
    targetDate.setMonth(targetDate.getMonth() + 1)
  }

  return targetDate.toISOString().split('T')[0] // YYYY-MM-DD 형식
} 