// AI Goal Recommendations service functions
import { supabase } from '@/lib/supabase'

// Temporary types until Supabase types are properly generated
type TablesInsert = Record<string, unknown>
type TablesUpdate = Record<string, unknown>
type AIGoalRecommendationWithDetails = Record<string, unknown>

// Get AI recommendations for a patient
export async function getPatientAIRecommendations(patientId: string) {
  const { data, error } = await supabase
    .from('ai_goal_recommendations')
    .select(`
      *,
      patient:patients!ai_goal_recommendations_patient_id_fkey(
        id,
        patient_identifier,
        full_name,
        date_of_birth,
        gender,
        status
      ),
      assessment:assessments!ai_goal_recommendations_assessment_id_fkey(
        id,
        stage,
        current_stage,
        created_at
      ),
      applied_by_user:social_workers!ai_goal_recommendations_applied_by_fkey(
        user_id,
        full_name,
        employee_id
      )
    `)
    .eq('patient_id', patientId)
    .order('recommendation_date', { ascending: false })

  if (error) throw error
  return data
}

// Get a specific AI recommendation with full details
export async function getAIRecommendationWithDetails(recommendationId: string): Promise<AIGoalRecommendationWithDetails | null> {
  const { data, error } = await supabase
    .from('ai_goal_recommendations')
    .select(`
      *,
      patient:patients!ai_goal_recommendations_patient_id_fkey(
        id,
        patient_identifier,
        full_name,
        date_of_birth,
        gender,
        status,
        emergency_contact_name,
        emergency_contact_number
      ),
      assessment:assessments!ai_goal_recommendations_assessment_id_fkey(
        id,
        stage,
        current_stage,
        responses,
        created_at,
        updated_at
      ),
      applied_by_user:social_workers!ai_goal_recommendations_applied_by_fkey(
        user_id,
        full_name,
        employee_id,
        department
      )
    `)
    .eq('id', recommendationId)
    .single()

  if (error) throw error
  return data
}

// Get active AI recommendation for a patient
export async function getActivePatientRecommendation(patientId: string) {
  const { data, error } = await supabase
    .from('ai_goal_recommendations')
    .select(`
      *,
      patient:patients!ai_goal_recommendations_patient_id_fkey(
        id,
        patient_identifier,
        full_name
      ),
      assessment:assessments!ai_goal_recommendations_assessment_id_fkey(
        id,
        stage,
        current_stage
      )
    `)
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .order('recommendation_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

// Get AI recommendation by assessment ID and patient ID
export async function getAIRecommendationByAssessment(
  assessmentId: string,
  patientId: string
): Promise<unknown | null> {
  const { data, error } = await supabase
    .from('ai_goal_recommendations')
    .select(`
      *,
      patient:patients!inner(full_name),
      assessment:assessments!inner(*),
      applied_by_social_worker:social_workers(full_name)
    `)
    .eq('assessment_id', assessmentId)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.error("Error occurred")
    return null
  }

  // recommendations 배열에서 데이터 추출
  const recommendations = data.recommendations || []
  
  return {
    ...data,
    // recommendations 배열은 이미 구조화된 데이터이므로 그대로 사용
    // 호환성을 위해 legacy 필드들도 포함 (deprecated)
    six_month_goals: recommendations,
    monthly_plans: recommendations.flatMap((rec: unknown) => rec.monthlyGoals || []),
    weekly_plans: recommendations.flatMap((rec: unknown) => rec.weeklyPlans || []),
    parsed_recommendations: recommendations.map((rec: unknown) => ({
      plan_number: rec.plan_number,
      title: rec.title,
      purpose: rec.purpose,
      six_month_goal: rec.sixMonthGoal,
      monthly_goals: rec.monthlyGoals,
      weekly_plans: rec.weeklyPlans
    }))
  }
}

// Create a new AI recommendation
export async function createAIRecommendation(recommendation: TablesInsert<'ai_goal_recommendations'>) {
  const { data, error } = await supabase
    .from('ai_goal_recommendations')
    .insert(recommendation)
    .select(`
      *,
      patient:patients!ai_goal_recommendations_patient_id_fkey(
        id,
        patient_identifier,
        full_name
      ),
      assessment:assessments!ai_goal_recommendations_assessment_id_fkey(
        id,
        stage,
        current_stage
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Update an AI recommendation
export async function updateAIRecommendation(id: string, updates: TablesUpdate<'ai_goal_recommendations'>) {
  const { data, error } = await supabase
    .from('ai_goal_recommendations')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      patient:patients!ai_goal_recommendations_patient_id_fkey(
        id,
        patient_identifier,
        full_name
      ),
      assessment:assessments!ai_goal_recommendations_assessment_id_fkey(
        id,
        stage,
        current_stage
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Apply an AI recommendation (mark as applied)
export async function applyAIRecommendation(recommendationId: string, appliedBy: string) {
  const { data, error } = await supabase
    .from('ai_goal_recommendations')
    .update({
      applied_at: new Date().toISOString(),
      applied_by: appliedBy,
      is_active: true,
    })
    .eq('id', recommendationId)
    .select(`
      *,
      patient:patients!ai_goal_recommendations_patient_id_fkey(
        id,
        patient_identifier,
        full_name
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Deactivate an AI recommendation
export async function deactivateAIRecommendation(recommendationId: string) {
  const { data, error } = await supabase
    .from('ai_goal_recommendations')
    .update({ is_active: false })
    .eq('id', recommendationId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete an AI recommendation
export async function deleteAIRecommendation(id: string) {
  const { error } = await supabase
    .from('ai_goal_recommendations')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get AI recommendations with filters
export async function getAIRecommendations(filters: {
  patientId?: string
  isActive?: boolean
  dateFrom?: string
  dateTo?: string
  hasAssessment?: boolean
  appliedBy?: string
  limit?: number
  offset?: number
}) {
  let query = supabase
    .from('ai_goal_recommendations')
    .select(`
      *,
      patient:patients!ai_goal_recommendations_patient_id_fkey(
        id,
        patient_identifier,
        full_name,
        status
      ),
      assessment:assessments!ai_goal_recommendations_assessment_id_fkey(
        id,
        stage,
        current_stage
      ),
      applied_by_user:social_workers!ai_goal_recommendations_applied_by_fkey(
        full_name,
        employee_id
      )
    `)

  // Apply filters
  if (filters.patientId) {
    query = query.eq('patient_id', filters.patientId)
  }
  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }
  if (filters.dateFrom) {
    query = query.gte('recommendation_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('recommendation_date', filters.dateTo)
  }
  if (filters.hasAssessment !== undefined) {
    if (filters.hasAssessment) {
      query = query.not('assessment_id', 'is', null)
    } else {
      query = query.is('assessment_id', null)
    }
  }
  if (filters.appliedBy) {
    query = query.eq('applied_by', filters.appliedBy)
  }

  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit)
  }
  if (filters.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
  }

  query = query.order('recommendation_date', { ascending: false })

  const { data, error } = await query

  if (error) throw error
  return data
}

// Generate AI recommendation based on assessment
export async function generateAIRecommendationFromAssessment(
  patientId: string,
  assessmentId: string,
  socialWorkerId?: string
) {
  // This function would integrate with an AI service to generate recommendations
  // For now, we'll create a placeholder structure that can be enhanced with actual AI integration
  
  // First, get the assessment data
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single()

  if (assessmentError) throw assessmentError

  // Get patient information
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single()

  if (patientError) throw patientError

  // Placeholder AI-generated recommendation structure
  // In a real implementation, this would call an AI service like OpenAI GPT, Claude, etc.
  const aiRecommendation = {
    patient_id: patientId,
    assessment_id: assessmentId,
    recommendation_date: new Date().toISOString().split('T')[0],
    assessment_data: assessment.responses,
    patient_analysis: {
      strengths: [
        "평가 결과를 바탕으로 식별된 강점",
        "사회적 지지체계 존재",
        "치료 동기 있음"
      ],
      challenges: [
        "주요 개선 필요 영역",
        "일상생활 기능 제한",
        "사회적 상호작용 어려움"
      ],
      risk_factors: [
        "재발 위험 요소",
        "환경적 스트레스 요인"
      ],
      protective_factors: [
        "보호 요인",
        "가족 지지",
        "치료 이력"
      ],
      current_functioning_level: "medium",
      motivation_level: "high",
      support_system_quality: "medium",
      insights: "평가 결과를 종합한 전반적 분석"
    },
    recommendations: [
      {
        plan_number: 1,
        title: "사회적 기능 향상 계획",
        purpose: "대인관계 기술 개발 및 사회적 참여 증대를 통한 전반적인 사회적 기능 향상",
        sixMonthGoal: "6개월 후 주 2회 이상 지속적인 사회적 활동 참여 및 대인관계 만족도 향상",
        monthlyGoals: [
          { month: 1, goal: "기본적인 사회적 기술 습득 및 불안 감소" },
          { month: 2, goal: "소규모 그룹 활동 참여 시작" },
          { month: 3, goal: "대화 기술 향상 및 관계 형성" },
          { month: 4, goal: "다양한 사회적 상황에서의 적응력 증진" },
          { month: 5, goal: "독립적인 사회적 활동 계획 및 실행" },
          { month: 6, goal: "장기적인 관계 유지 및 네트워크 구축" }
        ],
        weeklyPlans: [
          { week: 1, month: 1, plan: "개별 상담을 통한 현재 상태 평가 및 목표 설정" },
          { week: 2, month: 1, plan: "사회적 불안 관리 기법 학습" },
          { week: 3, month: 1, plan: "기본적인 대화 기술 연습" },
          { week: 4, month: 1, plan: "소규모 그룹 활동 관찰 및 준비" },
          { week: 5, month: 2, plan: "첫 번째 그룹 활동 참여" },
          { week: 6, month: 2, plan: "그룹 활동 경험 평가 및 피드백" },
          { week: 7, month: 2, plan: "대화 주제 확장 연습" },
          { week: 8, month: 2, plan: "갈등 상황 대처 방법 학습" },
          { week: 9, month: 3, plan: "새로운 관계 형성 도전" },
          { week: 10, month: 3, plan: "감정 표현 기술 향상" },
          { week: 11, month: 3, plan: "상호 지지적 관계 구축" },
          { week: 12, month: 3, plan: "관계 만족도 평가 및 조정" },
          { week: 13, month: 4, plan: "다양한 사회적 환경 경험" },
          { week: 14, month: 4, plan: "스트레스 관리 및 적응 기술" },
          { week: 15, month: 4, plan: "리더십 기술 개발" },
          { week: 16, month: 4, plan: "팀워크 및 협력 기술 향상" },
          { week: 17, month: 5, plan: "개인적인 사회적 목표 설정" },
          { week: 18, month: 5, plan: "독립적인 활동 계획 수립" },
          { week: 19, month: 5, plan: "자기 주도적 관계 관리" },
          { week: 20, month: 5, plan: "사회적 네트워크 확장" },
          { week: 21, month: 6, plan: "장기적 관계 유지 전략" },
          { week: 22, month: 6, plan: "지속적인 사회적 참여 계획" },
          { week: 23, month: 6, plan: "성과 평가 및 미래 계획" },
          { week: 24, month: 6, plan: "졸업 후 지속 관리 방안 수립" }
        ]
      },
      {
        plan_number: 2,
        title: "일상생활 기능 향상 계획",
        purpose: "독립적인 일상생활 수행 능력 향상 및 자립 준비",
        sixMonthGoal: "6개월 후 독립적인 일상생활 관리 및 기본적인 자립 기술 습득",
        monthlyGoals: [
          { month: 1, goal: "기본적인 일상생활 기술 평가 및 개선" },
          { month: 2, goal: "시간 관리 및 일정 계획 능력 향상" },
          { month: 3, goal: "금전 관리 및 예산 수립 기술 습득" },
          { month: 4, goal: "요리 및 가사 관리 기술 개발" },
          { month: 5, goal: "교통 이용 및 지역사회 자원 활용" },
          { month: 6, goal: "종합적인 자립생활 시뮬레이션" }
        ],
        weeklyPlans: [
          { week: 1, month: 1, plan: "현재 일상생활 기능 평가 및 목표 설정" },
          { week: 2, month: 1, plan: "개인 위생 및 건강 관리 기술 향상" },
          { week: 3, month: 1, plan: "기본적인 가사일 기술 학습" },
          { week: 4, month: 1, plan: "안전 관리 및 응급 상황 대처" }
        ]
      },
      {
        plan_number: 3,
        title: "직업 준비 및 기술 개발 계획",
        purpose: "취업을 위한 기본 역량 개발 및 직업 탐색 활동",
        sixMonthGoal: "6개월 후 자신에게 적합한 직업 분야 탐색 완료 및 기본 직무 기술 습득",
        monthlyGoals: [
          { month: 1, goal: "진로 탐색 및 직업 관심 분야 파악" },
          { month: 2, goal: "기본적인 직업 기술 및 태도 개발" },
          { month: 3, goal: "의사소통 및 대인관계 기술 향상" },
          { month: 4, goal: "실무 경험 및 현장 학습" },
          { month: 5, goal: "취업 준비 활동 및 이력서 작성" },
          { month: 6, goal: "모의 면접 및 취업 전략 수립" }
        ],
        weeklyPlans: [
          { week: 1, month: 1, plan: "적성 검사 및 흥미 탐색 활동" },
          { week: 2, month: 1, plan: "다양한 직업 정보 수집 및 분석" },
          { week: 3, month: 1, plan: "직업 체험 활동 계획 수립" },
          { week: 4, month: 1, plan: "기본적인 컴퓨터 활용 기술 학습" }
        ]
      }
    ],
    execution_strategy: {
      phase_1: "초기 평가 및 관계 형성 (1-2개월)",
      phase_2: "핵심 개입 및 기능 훈련 (3-4개월)",
      phase_3: "유지 및 일반화 (5-6개월)",
      key_principles: ["개별화된 접근", "강점 기반", "점진적 진행"],
      monitoring_schedule: "매주 진행 평가, 매월 목표 재검토"
    },
    success_indicators: [
      {
        id: "indicator_1",
        type: "behavioral",
        description: "사회적 활동 참여 빈도",
        measurement_method: "활동 일지 기록",
        frequency: "weekly",
        target_value: "주 2회 이상",
        baseline_value: "주 0-1회",
        tracking_notes: "참여한 활동 유형과 지속 시간 기록"
      },
      {
        id: "indicator_2", 
        type: "self_reported",
        description: "사회적 자신감 수준",
        measurement_method: "자기효능감 척도",
        frequency: "bi_weekly",
        target_value: "7점 이상 (10점 만점)",
        baseline_value: "4점",
        tracking_notes: "격주마다 표준화된 척도로 측정"
      }
    ],
    is_active: false
  }

  // Create the recommendation
  return createAIRecommendation(aiRecommendation)
}

// Get AI recommendation statistics
export async function getAIRecommendationStatistics(filters?: {
  dateFrom?: string
  dateTo?: string
  socialWorkerId?: string
}) {
  let query = supabase
    .from('ai_goal_recommendations')
    .select('id, patient_id, recommendation_date, is_active, applied_at, applied_by')

  if (filters?.dateFrom) {
    query = query.gte('recommendation_date', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('recommendation_date', filters.dateTo)
  }
  if (filters?.socialWorkerId) {
    query = query.eq('applied_by', filters.socialWorkerId)
  }

  const { data, error } = await query

  if (error) throw error

  if (!data || data.length === 0) {
    return {
      total_recommendations: 0,
      active_recommendations: 0,
      applied_recommendations: 0,
      unique_patients: 0,
      application_rate: 0,
    }
  }

  const stats = {
    total_recommendations: data.length,
    active_recommendations: data.filter(r => r.is_active).length,
    applied_recommendations: data.filter(r => r.applied_at).length,
    unique_patients: new Set(data.map(r => r.patient_id)).size,
    application_rate: Math.round(
      (data.filter(r => r.applied_at).length / data.length) * 100
    ),
  }

  return stats
}

// Get recent AI recommendations (for dashboard)
export async function getRecentAIRecommendations(limit = 10) {
  const { data, error } = await supabase
    .from('ai_goal_recommendations')
    .select(`
      *,
      patient:patients!ai_goal_recommendations_patient_id_fkey(
        patient_identifier,
        full_name
      ),
      applied_by_user:social_workers!ai_goal_recommendations_applied_by_fkey(
        full_name,
        employee_id
      )
    `)
    .order('recommendation_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
} 