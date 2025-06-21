// Rehabilitation Goals service functions
import { supabase } from '@/lib/supabase'

// Temporary types until Supabase types are properly generated
type TablesInsert<T extends string> = Record<string, unknown>
type TablesUpdate<T extends string> = Record<string, unknown>
type RehabilitationGoalWithDetails = Record<string, unknown>

// Get rehabilitation goals for a patient
export async function getPatientRehabilitationGoals(patientId: string) {
  const { data, error } = await supabase
    .from('rehabilitation_goals')
    .select(`
      *,
      patient:patients!rehabilitation_goals_patient_id_fkey(
        id,
        patient_identifier,
        full_name,
        status
      ),
      created_by:social_workers!rehabilitation_goals_created_by_social_worker_id_fkey(
        user_id,
        full_name,
        employee_id
      )
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get a specific rehabilitation goal with full details
export async function getRehabilitationGoalWithDetails(goalId: string): Promise<RehabilitationGoalWithDetails | null> {
  const { data, error } = await supabase
    .from('rehabilitation_goals')
    .select(`
      *,
      patient:patients!rehabilitation_goals_patient_id_fkey(
        id,
        patient_identifier,
        full_name,
        date_of_birth,
        gender,
        status
      ),
      created_by:social_workers!rehabilitation_goals_created_by_social_worker_id_fkey(
        user_id,
        full_name,
        employee_id,
        department
      ),
      parent_goal:rehabilitation_goals!rehabilitation_goals_parent_goal_id_fkey(
        id,
        title,
        goal_type,
        status,
        start_date,
        end_date
      ),
      child_goals:rehabilitation_goals!rehabilitation_goals_parent_goal_id_fkey(
        id,
        title,
        goal_type,
        status,
        start_date,
        end_date,
        actual_completion_rate,
        sequence_number
      ),
      source_recommendation:ai_goal_recommendations!rehabilitation_goals_source_recommendation_id_fkey(
        id,
        recommendation_date,
        patient_analysis,
        is_active
      )
    `)
    .eq('id', goalId)
    .single()

  if (error) throw error
  return data
}

// Create a new rehabilitation goal
export async function createRehabilitationGoal(goal: TablesInsert<'rehabilitation_goals'>) {
  const { data, error } = await supabase
    .from('rehabilitation_goals')
    .insert(goal)
    .select(`
      *,
      patient:patients!rehabilitation_goals_patient_id_fkey(
        id,
        patient_identifier,
        full_name
      ),
      created_by:social_workers!rehabilitation_goals_created_by_social_worker_id_fkey(
        full_name,
        employee_id
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Update a rehabilitation goal
export async function updateRehabilitationGoal(id: string, updates: TablesUpdate<'rehabilitation_goals'>) {
  const { data, error } = await supabase
    .from('rehabilitation_goals')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      patient:patients!rehabilitation_goals_patient_id_fkey(
        id,
        patient_identifier,
        full_name
      ),
      created_by:social_workers!rehabilitation_goals_created_by_social_worker_id_fkey(
        full_name,
        employee_id
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Delete a rehabilitation goal
export async function deleteRehabilitationGoal(id: string) {
  const { error } = await supabase
    .from('rehabilitation_goals')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get rehabilitation goals with filters
export async function getRehabilitationGoals(filters: {
  patientId?: string
  socialWorkerId?: string
  status?: string
  goalType?: string
  parentGoalId?: string | null
  isAiSuggested?: boolean
  isFromAiRecommendation?: boolean
  priorityMin?: number
  priorityMax?: number
  dateFrom?: string
  dateTo?: string
  weekNumber?: number
  monthNumber?: number
  limit?: number
  offset?: number
}) {
  let query = supabase
    .from('rehabilitation_goals')
    .select(`
      *,
      patient:patients!rehabilitation_goals_patient_id_fkey(
        id,
        patient_identifier,
        full_name,
        status
      ),
      created_by:social_workers!rehabilitation_goals_created_by_social_worker_id_fkey(
        full_name,
        employee_id
      ),
      parent_goal:rehabilitation_goals!rehabilitation_goals_parent_goal_id_fkey(
        id,
        title,
        goal_type
      ),
      source_recommendation:ai_goal_recommendations!rehabilitation_goals_source_recommendation_id_fkey(
        id,
        recommendation_date
      )
    `)

  // Apply filters
  if (filters.patientId) {
    query = query.eq('patient_id', filters.patientId)
  }
  if (filters.socialWorkerId) {
    query = query.eq('created_by_social_worker_id', filters.socialWorkerId)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.goalType) {
    query = query.eq('goal_type', filters.goalType)
  }
  if (filters.parentGoalId !== undefined) {
    if (filters.parentGoalId === null) {
      query = query.is('parent_goal_id', null)
    } else {
      query = query.eq('parent_goal_id', filters.parentGoalId)
    }
  }
  if (filters.isAiSuggested !== undefined) {
    query = query.eq('is_ai_suggested', filters.isAiSuggested)
  }
  if (filters.isFromAiRecommendation !== undefined) {
    query = query.eq('is_from_ai_recommendation', filters.isFromAiRecommendation)
  }
  if (filters.priorityMin !== undefined) {
    query = query.gte('priority', filters.priorityMin)
  }
  if (filters.priorityMax !== undefined) {
    query = query.lte('priority', filters.priorityMax)
  }
  if (filters.dateFrom) {
    query = query.gte('start_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('end_date', filters.dateTo)
  }
  if (filters.weekNumber !== undefined) {
    query = query.eq('week_number', filters.weekNumber)
  }
  if (filters.monthNumber !== undefined) {
    query = query.eq('month_number', filters.monthNumber)
  }

  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit)
  }
  if (filters.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
  }

  query = query.order('sequence_number', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) throw error
  return data
}

// Get goal hierarchy (parent with children)
export async function getGoalHierarchy(parentGoalId: string) {
  const { data, error } = await supabase
    .from('rehabilitation_goals')
    .select(`
      *,
      child_goals:rehabilitation_goals!rehabilitation_goals_parent_goal_id_fkey(
        *,
        patient:patients!rehabilitation_goals_patient_id_fkey(
          patient_identifier,
          full_name
        )
      ),
      patient:patients!rehabilitation_goals_patient_id_fkey(
        id,
        patient_identifier,
        full_name
      ),
      created_by:social_workers!rehabilitation_goals_created_by_social_worker_id_fkey(
        full_name,
        employee_id
      )
    `)
    .eq('id', parentGoalId)
    .single()

  if (error) throw error
  return data
}

// Get goals by week/month
export async function getGoalsByTimeFrame(
  patientId: string,
  timeFrame: 'week' | 'month',
  timeNumber: number
) {
  const column = timeFrame === 'week' ? 'week_number' : 'month_number'
  
  const { data, error } = await supabase
    .from('rehabilitation_goals')
    .select(`
      *,
      patient:patients!rehabilitation_goals_patient_id_fkey(
        patient_identifier,
        full_name
      ),
      created_by:social_workers!rehabilitation_goals_created_by_social_worker_id_fkey(
        full_name,
        employee_id
      )
    `)
    .eq('patient_id', patientId)
    .eq(column, timeNumber)
    .order('sequence_number', { ascending: true, nullsFirst: false })
    .order('priority', { ascending: false })

  if (error) throw error
  return data
}

// Update goal completion rate
export async function updateGoalCompletion(goalId: string, completionRate: number, notes?: string) {
  const updates: TablesUpdate<'rehabilitation_goals'> = {
    actual_completion_rate: completionRate,
  }

  // Auto-update status based on completion rate
  if (completionRate === 100) {
    updates.status = 'completed'
    updates.completion_date = new Date().toISOString().split('T')[0]
  } else if (completionRate > 0) {
    updates.status = 'in_progress'
  }

  // Add notes to evaluation criteria if provided
  if (notes) {
    const { data: currentGoal } = await supabase
      .from('rehabilitation_goals')
      .select('evaluation_criteria')
      .eq('id', goalId)
      .single()

    if (currentGoal) {
      const currentCriteria = currentGoal.evaluation_criteria || {}
      updates.evaluation_criteria = {
        ...currentCriteria,
        progress_notes: [
          ...(currentCriteria.progress_notes || []),
          {
            date: new Date().toISOString(),
            completion_rate: completionRate,
            notes,
          },
        ],
      }
    }
  }

  const { data, error } = await supabase
    .from('rehabilitation_goals')
    .update(updates)
    .eq('id', goalId)
    .select(`
      *,
      patient:patients!rehabilitation_goals_patient_id_fkey(
        patient_identifier,
        full_name
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Create goals from AI recommendation (updated for structured data)
export async function createGoalsFromAIRecommendation(
  recommendationId: string,
  socialWorkerId: string,
  selectedPlanNumbers?: number[] // Optional array of plan numbers from the recommendation
) {
  // First, get the AI recommendation
  const { data: recommendation, error: recommendationError } = await supabase
    .from('ai_goal_recommendations')
    .select('*')
    .eq('id', recommendationId)
    .single()

  if (recommendationError) throw recommendationError

  // Get structured recommendations array
  const allPlans = recommendation.recommendations || []

  // Filter plans if specific ones are selected
  const plansToCreate = selectedPlanNumbers 
    ? allPlans.filter((plan: unknown) => selectedPlanNumbers.includes(plan.plan_number))
    : allPlans

  const createdGoals = []

  for (const plan of plansToCreate) {
    // Create the main 6-month goal
    const mainGoal = {
      patient_id: recommendation.patient_id,
      created_by_social_worker_id: socialWorkerId,
      title: plan.title,
      description: plan.purpose,
      goal_type: 'long_term',
      status: 'pending',
      priority: 3, // Default to medium priority
      target_completion_rate: 100,
      is_ai_suggested: true,
      is_from_ai_recommendation: true,
      source_recommendation_id: recommendationId,
      ai_suggestion_details: {
        original_ai_plan: plan,
        plan_number: plan.plan_number,
        six_month_goal: plan.sixMonthGoal,
      },
      evaluation_criteria: {
        type: 'behavioral_observation',
        description: `${plan.title} 달성을 위한 평가`,
        measurement_method: 'monthly_assessment',
        target_value: plan.sixMonthGoal,
      },
    }

    const { data: createdMainGoal, error: mainGoalError } = await supabase
      .from('rehabilitation_goals')
      .insert(mainGoal)
      .select()
      .single()

    if (mainGoalError) throw mainGoalError
    createdGoals.push(createdMainGoal)

    // Create monthly sub-goals
    if (plan.monthlyGoals && plan.monthlyGoals.length > 0) {
      for (const monthlyGoal of plan.monthlyGoals) {
        const monthlyGoalData = {
          patient_id: recommendation.patient_id,
          created_by_social_worker_id: socialWorkerId,
          parent_goal_id: createdMainGoal.id,
          title: `${monthlyGoal.month}개월차: ${plan.title}`,
          description: monthlyGoal.goal,
          goal_type: 'short_term',
          status: 'pending',
          priority: mainGoal.priority,
          month_number: monthlyGoal.month,
          sequence_number: monthlyGoal.month,
          target_completion_rate: 100,
          is_ai_suggested: true,
          is_from_ai_recommendation: true,
          source_recommendation_id: recommendationId,
          ai_suggestion_details: {
            monthly_goal: monthlyGoal,
            plan_number: plan.plan_number,
          },
        }

        const { data: createdMonthlyGoal, error: monthlyGoalError } = await supabase
          .from('rehabilitation_goals')
          .insert(monthlyGoalData)
          .select()
          .single()

        if (monthlyGoalError) throw monthlyGoalError
        createdGoals.push(createdMonthlyGoal)

        // Create weekly sub-goals for this month
        const relevantWeeklyPlans = plan.weeklyPlans?.filter((weekPlan: unknown) => 
          weekPlan.month === monthlyGoal.month
        ) || []

        for (const weekPlan of relevantWeeklyPlans) {
          const weeklyGoalData = {
            patient_id: recommendation.patient_id,
            created_by_social_worker_id: socialWorkerId,
            parent_goal_id: createdMonthlyGoal.id,
            title: `${weekPlan.week}주차: ${plan.title}`,
            description: weekPlan.plan,
            goal_type: 'weekly',
            status: 'pending',
            priority: mainGoal.priority,
            week_number: weekPlan.week,
            month_number: weekPlan.month,
            sequence_number: weekPlan.week,
            target_completion_rate: 100,
            is_ai_suggested: true,
            is_from_ai_recommendation: true,
            source_recommendation_id: recommendationId,
            ai_suggestion_details: {
              weekly_plan: weekPlan,
              plan_number: plan.plan_number,
            },
          }

          const { data: createdWeeklyGoal, error: weeklyGoalError } = await supabase
            .from('rehabilitation_goals')
            .insert(weeklyGoalData)
            .select()
            .single()

          if (weeklyGoalError) throw weeklyGoalError
          createdGoals.push(createdWeeklyGoal)
        }
      }
    }
  }

  return createdGoals
}

// Get goal statistics
export async function getGoalStatistics(filters?: {
  patientId?: string
  socialWorkerId?: string
  dateFrom?: string
  dateTo?: string
}) {
  let query = supabase
    .from('rehabilitation_goals')
    .select('id, patient_id, status, goal_type, priority, actual_completion_rate, created_at, is_ai_suggested')

  if (filters?.patientId) {
    query = query.eq('patient_id', filters.patientId)
  }
  if (filters?.socialWorkerId) {
    query = query.eq('created_by_social_worker_id', filters.socialWorkerId)
  }
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  const { data, error } = await query

  if (error) throw error

  if (!data || data.length === 0) {
    return {
      total_goals: 0,
      completed_goals: 0,
      in_progress_goals: 0,
      pending_goals: 0,
      average_completion_rate: 0,
      ai_suggested_count: 0,
      completion_rate: 0,
      goals_by_type: {},
      goals_by_priority: {},
      unique_patients: 0,
    }
  }

  const stats = {
    total_goals: data.length,
    completed_goals: data.filter(g => g.status === 'completed').length,
    in_progress_goals: data.filter(g => g.status === 'in_progress').length,
    pending_goals: data.filter(g => g.status === 'pending').length,
    average_completion_rate: Math.round(
      data.reduce((sum, g) => sum + (g.actual_completion_rate || 0), 0) / data.length
    ),
    ai_suggested_count: data.filter(g => g.is_ai_suggested).length,
    completion_rate: Math.round(
      (data.filter(g => g.status === 'completed').length / data.length) * 100
    ),
    goals_by_type: data.reduce((acc, g) => {
      acc[g.goal_type] = (acc[g.goal_type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    goals_by_priority: data.reduce((acc, g) => {
      const priority = g.priority || 0
      acc[priority] = (acc[priority] || 0) + 1
      return acc
    }, {} as Record<number, number>),
    unique_patients: new Set(data.map(g => g.patient_id)).size,
  }

  return stats
}

// Get recent goals (for dashboard)
export async function getRecentRehabilitationGoals(limit = 10) {
  const { data, error } = await supabase
    .from('rehabilitation_goals')
    .select(`
      *,
      patient:patients!rehabilitation_goals_patient_id_fkey(
        patient_identifier,
        full_name
      ),
      created_by:social_workers!rehabilitation_goals_created_by_social_worker_id_fkey(
        full_name,
        employee_id
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
} 