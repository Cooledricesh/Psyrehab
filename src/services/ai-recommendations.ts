// AI Goal Recommendations service functions
import { supabase } from '@/lib/supabase'

// Temporary types until Supabase types are properly generated
type TablesInsert<T extends string> = any
type TablesUpdate<T extends string> = any
type AIGoalRecommendationWithDetails = any

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
    six_month_goals: [
      {
        id: "goal_1",
        title: "사회적 기능 향상",
        category: "social_functioning",
        priority: "high",
        description: "대인관계 기술 개발 및 사회적 참여 증대",
        target_outcome: "주 2회 이상 사회적 활동 참여",
        time_frame: "six_months",
        interventions: ["social_skills_training", "group_therapy"],
        success_criteria: ["사회적 상호작용 빈도 증가", "자신감 향상"],
        potential_barriers: ["사회적 불안", "과거 부정적 경험"],
        adaptation_strategies: ["점진적 노출", "지지적 환경 조성"]
      }
    ],
    monthly_plans: Array.from({ length: 6 }, (_, index) => ({
      month: index + 1,
      goals: [`goal_1 관련 월별 목표 ${index + 1}`],
      interventions: ["개별 상담", "집단 프로그램"],
      milestones: [`${index + 1}개월차 주요 성과 지표`],
      focus_areas: ["사회적 기능", "정서 조절"]
    })),
    weekly_plans: Array.from({ length: 24 }, (_, index) => ({
      week: index + 1,
      month: Math.floor(index / 4) + 1,
      objectives: [`${index + 1}주차 목표`],
      activities: ["개별 상담 1회", "집단 활동 1회"],
      measurements: ["행동 관찰", "자가 평가"]
    })),
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