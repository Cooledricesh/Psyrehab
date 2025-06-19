// Goal Evaluations service functions
import { supabase } from '@/lib/supabase'

// Temporary types until Supabase types are properly generated
type TablesInsert<T extends string> = any
type TablesUpdate<T extends string> = any
type GoalEvaluationWithDetails = any

// Get goal evaluations for a specific goal
export async function getGoalEvaluations(goalId: string) {
  const { data, error } = await supabase
    .from('goal_evaluations')
    .select(`
      *,
      goal:rehabilitation_goals!goal_evaluations_goal_id_fkey(
        id,
        title,
        goal_type,
        status,
        target_completion_rate,
        actual_completion_rate
      ),
      evaluator:social_workers!goal_evaluations_evaluated_by_fkey(
        user_id,
        full_name,
        employee_id,
        department
      )
    `)
    .eq('goal_id', goalId)
    .order('evaluation_date', { ascending: false })

  if (error) throw error
  return data
}

// Get a specific goal evaluation with full details
export async function getGoalEvaluationWithDetails(evaluationId: string): Promise<GoalEvaluationWithDetails | null> {
  const { data, error } = await supabase
    .from('goal_evaluations')
    .select(`
      *,
      goal:rehabilitation_goals!goal_evaluations_goal_id_fkey(
        id,
        title,
        description,
        goal_type,
        status,
        start_date,
        end_date,
        target_completion_rate,
        actual_completion_rate,
        patient:patients!rehabilitation_goals_patient_id_fkey(
          id,
          patient_identifier,
          full_name
        ),
        category:goal_categories!rehabilitation_goals_category_id_fkey(
          id,
          name,
          color,
          icon
        )
      ),
      evaluator:social_workers!goal_evaluations_evaluated_by_fkey(
        user_id,
        full_name,
        employee_id,
        department
      )
    `)
    .eq('id', evaluationId)
    .single()

  if (error) throw error
  return data
}

// Create a new goal evaluation
export async function createGoalEvaluation(evaluation: TablesInsert<'goal_evaluations'>) {
  const { data, error } = await supabase
    .from('goal_evaluations')
    .insert(evaluation)
    .select(`
      *,
      goal:rehabilitation_goals!goal_evaluations_goal_id_fkey(
        id,
        title,
        goal_type
      ),
      evaluator:social_workers!goal_evaluations_evaluated_by_fkey(
        full_name,
        employee_id
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Update a goal evaluation
export async function updateGoalEvaluation(id: string, updates: TablesUpdate<'goal_evaluations'>) {
  const { data, error } = await supabase
    .from('goal_evaluations')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      goal:rehabilitation_goals!goal_evaluations_goal_id_fkey(
        id,
        title,
        goal_type
      ),
      evaluator:social_workers!goal_evaluations_evaluated_by_fkey(
        full_name,
        employee_id
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Delete a goal evaluation
export async function deleteGoalEvaluation(id: string) {
  const { error } = await supabase
    .from('goal_evaluations')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get goal evaluations with filters
export async function getGoalEvaluationsWithFilters(filters: {
  goalId?: string
  patientId?: string
  evaluatorId?: string
  evaluationType?: string
  dateFrom?: string
  dateTo?: string
  completionRateMin?: number
  completionRateMax?: number
  limit?: number
  offset?: number
}) {
  let query = supabase
    .from('goal_evaluations')
    .select(`
      *,
      goal:rehabilitation_goals!goal_evaluations_goal_id_fkey(
        id,
        title,
        goal_type,
        status,
        patient:patients!rehabilitation_goals_patient_id_fkey(
          id,
          patient_identifier,
          full_name
        ),
        category:goal_categories!rehabilitation_goals_category_id_fkey(
          id,
          name,
          color
        )
      ),
      evaluator:social_workers!goal_evaluations_evaluated_by_fkey(
        user_id,
        full_name,
        employee_id
      )
    `)

  // Apply filters
  if (filters.goalId) {
    query = query.eq('goal_id', filters.goalId)
  }
  if (filters.evaluatorId) {
    query = query.eq('evaluated_by', filters.evaluatorId)
  }
  if (filters.evaluationType) {
    query = query.eq('evaluation_type', filters.evaluationType)
  }
  if (filters.dateFrom) {
    query = query.gte('evaluation_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('evaluation_date', filters.dateTo)
  }
  if (filters.completionRateMin !== undefined) {
    query = query.gte('completion_rate', filters.completionRateMin)
  }
  if (filters.completionRateMax !== undefined) {
    query = query.lte('completion_rate', filters.completionRateMax)
  }
  if (filters.patientId) {
    // Join with rehabilitation_goals to filter by patient
    query = query.eq('goal.patient_id', filters.patientId)
  }

  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit)
  }
  if (filters.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
  }

  query = query.order('evaluation_date', { ascending: false })

  const { data, error } = await query

  if (error) throw error
  return data
}

// Get evaluation statistics
export async function getEvaluationStatistics(filters?: {
  goalId?: string
  patientId?: string
  evaluatorId?: string
  dateFrom?: string
  dateTo?: string
}) {
  let query = supabase
    .from('goal_evaluations')
    .select(`
      id,
      evaluation_type,
      completion_rate,
      evaluation_date,
      goal:rehabilitation_goals!goal_evaluations_goal_id_fkey(
        patient_id,
        goal_type,
        category:goal_categories!rehabilitation_goals_category_id_fkey(
          name
        )
      )
    `)

  // Apply filters
  if (filters?.goalId) {
    query = query.eq('goal_id', filters.goalId)
  }
  if (filters?.evaluatorId) {
    query = query.eq('evaluated_by', filters.evaluatorId)
  }
  if (filters?.dateFrom) {
    query = query.gte('evaluation_date', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('evaluation_date', filters.dateTo)
  }
  if (filters?.patientId) {
    query = query.eq('goal.patient_id', filters.patientId)
  }

  const { data, error } = await query

  if (error) throw error

  if (!data || data.length === 0) {
    return {
      total_evaluations: 0,
      average_completion_rate: 0,
      evaluation_types: {},
      goal_types: {},
      categories: {},
      monthly_trends: {},
    }
  }

  // Calculate statistics
  const stats = {
    total_evaluations: data.length,
    average_completion_rate: Math.round(
      data.reduce((sum, e) => sum + (e.completion_rate || 0), 0) / data.length
    ),
    evaluation_types: data.reduce((acc, evaluation) => {
      acc[evaluation.evaluation_type] = (acc[evaluation.evaluation_type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    goal_types: data.reduce((acc, evaluation) => {
      const goalType = (evaluation.goal as unknown)?.goal_type || 'unknown'
      acc[goalType] = (acc[goalType] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    categories: data.reduce((acc, evaluation) => {
      const categoryName = (evaluation.goal as unknown)?.category?.name || 'unknown'
      acc[categoryName] = (acc[categoryName] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    monthly_trends: data.reduce((acc, evaluation) => {
      const month = evaluation.evaluation_date.substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          count: 0,
          total_completion_rate: 0,
          average_completion_rate: 0,
        }
      }
      acc[month].count++
      acc[month].total_completion_rate += evaluation.completion_rate || 0
      acc[month].average_completion_rate = Math.round(
        acc[month].total_completion_rate / acc[month].count
      )
      return acc
    }, {} as Record<string, unknown>),
  }

  return stats
}

// Get recent evaluations (for dashboard)
export async function getRecentGoalEvaluations(limit = 10) {
  const { data, error } = await supabase
    .from('goal_evaluations')
    .select(`
      *,
      goal:rehabilitation_goals!goal_evaluations_goal_id_fkey(
        id,
        title,
        goal_type,
        patient:patients!rehabilitation_goals_patient_id_fkey(
          patient_identifier,
          full_name
        )
      ),
      evaluator:social_workers!goal_evaluations_evaluated_by_fkey(
        full_name,
        employee_id
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Get evaluation progress for a goal
export async function getGoalEvaluationProgress(goalId: string) {
  const { data, error } = await supabase
    .from('goal_evaluations')
    .select(`
      id,
      evaluation_date,
      completion_rate,
      evaluation_type,
      evaluation_notes
    `)
    .eq('goal_id', goalId)
    .order('evaluation_date', { ascending: true })

  if (error) throw error

  if (!data || data.length === 0) {
    return {
      evaluations: [],
      trend: 'no_data',
      progress_rate: 0,
      latest_completion_rate: 0,
    }
  }

  // Calculate progress trend
  const completionRates = data
    .filter(e => e.completion_rate !== null)
    .map(e => e.completion_rate)

  let trend = 'stable'
  if (completionRates.length >= 2) {
    const first = completionRates[0]
    const last = completionRates[completionRates.length - 1]
    const difference = last - first
    
    if (difference > 10) trend = 'improving'
    else if (difference < -10) trend = 'declining'
    else trend = 'stable'
  }

  const progressRate = completionRates.length >= 2
    ? Math.round(
        (completionRates[completionRates.length - 1] - completionRates[0]) / completionRates.length
      )
    : 0

  return {
    evaluations: data,
    trend,
    progress_rate: progressRate,
    latest_completion_rate: completionRates[completionRates.length - 1] || 0,
  }
}

// Bulk create evaluations
export async function bulkCreateEvaluations(evaluations: TablesInsert<'goal_evaluations'>[]) {
  const { data, error } = await supabase
    .from('goal_evaluations')
    .insert(evaluations)
    .select(`
      *,
      goal:rehabilitation_goals!goal_evaluations_goal_id_fkey(
        id,
        title,
        goal_type
      ),
      evaluator:social_workers!goal_evaluations_evaluated_by_fkey(
        full_name,
        employee_id
      )
    `)

  if (error) throw error
  return data
}

// Get evaluation types
export const EVALUATION_TYPES = {
  INITIAL: 'initial',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  MILESTONE: 'milestone',
  FINAL: 'final',
  AD_HOC: 'ad_hoc',
} as const

export const EVALUATION_TYPE_LABELS = {
  [EVALUATION_TYPES.INITIAL]: '초기 평가',
  [EVALUATION_TYPES.WEEKLY]: '주간 평가',
  [EVALUATION_TYPES.MONTHLY]: '월간 평가',
  [EVALUATION_TYPES.MILESTONE]: '마일스톤 평가',
  [EVALUATION_TYPES.FINAL]: '최종 평가',
  [EVALUATION_TYPES.AD_HOC]: '수시 평가',
} as const

// Helper functions
export const getEvaluationTypeLabel = (type: string) =>
  EVALUATION_TYPE_LABELS[type as keyof typeof EVALUATION_TYPE_LABELS] || type

export const calculateProgressTrend = (evaluations: unknown[]) => {
  if (evaluations.length < 2) return 'insufficient_data'
  
  const rates = evaluations
    .filter(e => e.completion_rate !== null)
    .map(e => e.completion_rate)
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
  
  if (rates.length < 2) return 'insufficient_data'
  
  const first = rates[0]
  const last = rates[rates.length - 1]
  const difference = last - first
  
  if (difference > 10) return 'improving'
  if (difference < -10) return 'declining'
  return 'stable'
}

export const getProgressTrendLabel = (trend: string) => {
  const labels = {
    improving: '개선 중',
    declining: '하락 중',
    stable: '안정적',
    insufficient_data: '데이터 부족',
  }
  return labels[trend as keyof typeof labels] || trend
} 