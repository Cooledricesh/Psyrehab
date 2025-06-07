import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// 실제 데이터베이스 스키마에 맞춘 AI 추천 데이터 타입 정의
export interface AIRecommendation {
  id: string
  patient_id: string
  assessment_id: string | null
  recommendation_date: string
  patient_analysis: any // JSONB
  six_month_goals: string // 마크다운 형식의 목표
  monthly_plans: any // JSONB
  weekly_plans: any // JSONB
  execution_strategy: any // JSONB
  success_indicators: any // JSONB
  is_active: boolean
  applied_at: string | null
  applied_by: string | null
  created_at: string
  updated_at: string
  assessment_data: any // JSONB
}

// 마크다운에서 파싱된 목표 구조
export interface ParsedGoal {
  id: number
  title: string
  description: string
  purpose: string
  sixMonthTarget: string
  monthlyPlans: Array<{
    month: number
    description: string
  }>
  weeklyPlans: Array<{
    week: number
    description: string
  }>
}

// AI 추천 요청 훅 (기존 API 엔드포인트 사용)
export function useRequestAIRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assessmentId: string) => {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assessmentId }),
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

// 평가의 AI 추천 조회 훅 (평가 ID가 없으면 환자 ID로 폴백)
export function useAIRecommendationByAssessment(
  assessmentId: string | null, 
  patientId?: string | null
) {
  return useQuery({
    queryKey: ['ai-recommendation-by-assessment', assessmentId, patientId],
    queryFn: async () => {
      // 먼저 평가 ID로 조회 시도
      if (assessmentId) {
        const { data, error } = await supabase
          .from('ai_goal_recommendations')
          .select('*')
          .eq('assessment_id', assessmentId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          throw new Error(error.message)
        }

        if (data) {
          return data as AIRecommendation
        }
      }

      // 평가 ID로 찾지 못했거나 평가 ID가 없으면 환자 ID로 조회
      if (patientId) {
        const { data, error } = await supabase
          .from('ai_goal_recommendations')
          .select('*')
          .eq('patient_id', patientId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          throw new Error(error.message)
        }

        return data as AIRecommendation | null
      }

      return null
    },
    enabled: !!(assessmentId || patientId),
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
      const updateData: any = {
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
export function parseAIRecommendationGoals(markdownText: string): ParsedGoal[] {
  const goals: ParsedGoal[] = []
  
  // 목표 섹션을 찾아서 파싱
  const goalSections = markdownText.match(/### 목표 \d+:[^#]*/g)
  
  if (!goalSections) return goals

  goalSections.forEach((section, index) => {
    const goalMatch = section.match(/### 목표 (\d+): (.+)/)
    if (!goalMatch) return

    const goalId = parseInt(goalMatch[1])
    const title = goalMatch[2].trim()

    // 목적 추출
    const purposeMatch = section.match(/\* 목적: (.+)/)
    const purpose = purposeMatch ? purposeMatch[1].trim() : ''

    // 6개월 목표 추출
    const sixMonthMatch = section.match(/\* 6개월 목표: (.+)/)
    const sixMonthTarget = sixMonthMatch ? sixMonthMatch[1].trim() : ''

    // 전체 설명 (목적 + 6개월 목표)
    const description = `${purpose} ${sixMonthTarget}`.trim()

    // 월간 계획 추출
    const monthlySection = section.match(/#### 월간 소목표([\s\S]*?)(?=#### |$)/)?.[1] || ''
    const monthlyPlans = extractMonthlyPlans(monthlySection)

    // 주간 계획 추출
    const weeklySection = section.match(/#### 주간 계획[^#]*/)?.[0] || ''
    const weeklyPlans = extractWeeklyPlans(weeklySection)

    goals.push({
      id: goalId,
      title,
      description,
      purpose,
      sixMonthTarget,
      monthlyPlans,
      weeklyPlans
    })
  })

  return goals
}

// 월간 계획 파싱 헬퍼 함수
function extractMonthlyPlans(monthlySection: string): Array<{ month: number; description: string }> {
  const plans: Array<{ month: number; description: string }> = []
  const monthlyMatches = monthlySection.match(/\* (\d+)개월차: (.+)/g)
  
  if (monthlyMatches) {
    monthlyMatches.forEach(match => {
      const monthMatch = match.match(/\* (\d+)개월차: (.+)/)
      if (monthMatch) {
        plans.push({
          month: parseInt(monthMatch[1]),
          description: monthMatch[2].trim()
        })
      }
    })
  }
  
  return plans
}

// 주간 계획 파싱 헬퍼 함수
function extractWeeklyPlans(weeklySection: string): Array<{ week: number; description: string }> {
  const plans: Array<{ week: number; description: string }> = []
  const weeklyMatches = weeklySection.match(/\* (\d+)주차: (.+)/g)
  
  if (weeklyMatches) {
    // 처음 8주만 표시 (너무 많으면 UI가 복잡해짐)
    weeklyMatches.slice(0, 8).forEach(match => {
      const weekMatch = match.match(/\* (\d+)주차: (.+)/)
      if (weekMatch) {
        plans.push({
          week: parseInt(weekMatch[1]),
          description: weekMatch[2].trim()
        })
      }
    })
  }
  
  return plans
}

// AI 추천으로부터 재활 목표 생성 훅
export function useGenerateGoalsFromRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      recommendationId,
      patientId,
      selectedGoalIds
    }: {
      recommendationId: string
      patientId: string
      selectedGoalIds: number[]
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

      // 마크다운을 파싱하여 목표 추출
      const parsedGoals = parseAIRecommendationGoals(recommendation.six_month_goals)
      
      // 선택된 목표들만 필터링
      const selectedGoals = parsedGoals.filter(goal => selectedGoalIds.includes(goal.id))
      
      // 각 목표를 개별 재활 목표로 변환
      const goals = selectedGoals.map(goal => ({
        patient_id: patientId,
        title: goal.title,
        description: goal.description,
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
  let targetDate = new Date(today)

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