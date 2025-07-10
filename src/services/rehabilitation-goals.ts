// Rehabilitation Goals service functions
import { supabase } from '@/lib/supabase'

// Temporary types until Supabase types are properly generated
type TablesInsert = Record<string, unknown>
type TablesUpdate = Record<string, unknown>
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

// Get completed rehabilitation goals for a patient (6-month goals only)
export async function getPatientCompletedGoals(patientId: string) {
  // JOIN을 사용하여 한 번에 필요한 데이터 가져오기
  const { data, error } = await supabase
    .from('rehabilitation_goals')
    .select(`
      *,
      created_by:social_workers!created_by_social_worker_id(
        user_id,
        full_name,
        employee_id
      )
    `)
    .eq('patient_id', patientId)
    .eq('status', 'completed')
    .eq('goal_type', 'six_month')
    .order('completion_date', { ascending: false })

  if (error) throw error
  
  // 모든 하위 목표를 한 번에 조회하여 성능 최적화
  if (data && data.length > 0) {
    const goalIds = data.map(g => g.id)
    
    // 모든 월간 목표를 한 번에 조회
    const { data: allMonthlyGoals } = await supabase
      .from('rehabilitation_goals')
      .select('id, parent_goal_id')
      .in('parent_goal_id', goalIds)
      .eq('goal_type', 'monthly')
    
    if (allMonthlyGoals && allMonthlyGoals.length > 0) {
      const monthlyGoalIds = allMonthlyGoals.map(g => g.id)
      
      // 모든 주간 목표를 한 번에 조회
      const { data: allWeeklyGoals } = await supabase
        .from('rehabilitation_goals')
        .select('id, parent_goal_id, status')
        .in('parent_goal_id', monthlyGoalIds)
        .eq('goal_type', 'weekly')
      
      // 각 6개월 목표별로 달성률 계산
      for (const goal of data) {
        // 해당 6개월 목표의 월간 목표 찾기
        const monthlyGoals = allMonthlyGoals.filter(m => m.parent_goal_id === goal.id)
        const monthlyIds = monthlyGoals.map(m => m.id)
        
        // 해당 월간 목표들의 주간 목표 찾기
        const weeklyGoals = allWeeklyGoals?.filter(w => monthlyIds.includes(w.parent_goal_id)) || []
        
        const totalWeeklyGoals = weeklyGoals.length
        const completedWeeklyGoals = weeklyGoals.filter(g => g.status === 'completed').length
        
        // 24개 주간 목표를 기준으로 달성률 계산
        const calculatedRate = totalWeeklyGoals > 0 
          ? Math.round((completedWeeklyGoals / 24) * 100) 
          : 0
        
        // 저장된 달성률이 0이거나 없으면 계산된 값 사용
        if (!goal.actual_completion_rate || goal.actual_completion_rate === 0) {
          goal.actual_completion_rate = calculatedRate
        }
      }
    }
  }
  
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
      category:goal_categories!rehabilitation_goals_category_id_fkey(
        id,
        name,
        description,
        color,
        icon
      ),
      sub_goals:rehabilitation_goals!parent_goal_id(
        id,
        title,
        description,
        goal_type,
        status,
        target_completion_rate,
        actual_completion_rate,
        start_date,
        end_date
      )
    `)
    .eq('id', goalId)
    .single()

  if (error) throw error
  return data
}

// Create a new rehabilitation goal
export async function createRehabilitationGoal(goal: TablesInsert) {
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
export async function updateRehabilitationGoal(goalId: string, updates: TablesUpdate) {
  // Also update the updated_at timestamp
  const goalUpdates = {
    ...updates,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('rehabilitation_goals')
    .update(goalUpdates)
    .eq('id', goalId)
    .select(`
      *,
      patient:patients!rehabilitation_goals_patient_id_fkey(
        id,
        patient_identifier,
        full_name
      ),
      category:goal_categories!rehabilitation_goals_category_id_fkey(
        name,
        color
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Delete a rehabilitation goal (soft delete by setting status to 'deleted')
export async function deleteRehabilitationGoal(goalId: string) {
  const { error } = await supabase
    .from('rehabilitation_goals')
    .update({ 
      status: 'deleted',
      updated_at: new Date().toISOString()
    })
    .eq('id', goalId)

  if (error) throw error
}

// Get rehabilitation goals with filters
export async function getRehabilitationGoalsWithFilters(filters: {
  patientId?: string
  socialWorkerId?: string
  status?: string[]
  goalType?: string[]
  categoryId?: string
  dateFrom?: string
  dateTo?: string
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
        user_id,
        full_name,
        employee_id
      ),
      category:goal_categories!rehabilitation_goals_category_id_fkey(
        id,
        name,
        color,
        icon
      )
    `)

  // Apply filters
  if (filters.patientId) {
    query = query.eq('patient_id', filters.patientId)
  }
  if (filters.socialWorkerId) {
    query = query.eq('created_by_social_worker_id', filters.socialWorkerId)
  }
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }
  if (filters.goalType && filters.goalType.length > 0) {
    query = query.in('goal_type', filters.goalType)
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }
  if (filters.dateFrom) {
    query = query.gte('start_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('end_date', filters.dateTo)
  }

  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit)
  }
  if (filters.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) throw error
  return data
}

// Update goal completion rate
export async function updateGoalCompletionRate(goalId: string, completionRate: number, notes?: string) {
  const updates: TablesUpdate = {
    actual_completion_rate: completionRate,
    updated_at: new Date().toISOString()
  }

  // Auto-update status based on completion rate
  if (completionRate === 100) {
    updates.status = 'completed'
    updates.completion_date = new Date().toISOString().split('T')[0]
  } else if (completionRate > 0) {
    updates.status = 'active'
  }

  if (notes) {
    updates.achievement_notes = notes
  }

  return updateRehabilitationGoal(goalId, updates)
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
    .select('*')

  // Apply filters
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
      active_goals: 0,
      pending_goals: 0,
      on_hold_goals: 0,
      average_completion_rate: 0,
      average_duration_days: 0,
      ai_suggested_count: 0,
      completion_rate: 0,
      goals_by_type: {},
      goals_by_category: {}
    }
  }

  const stats = {
    total_goals: data.length,
    completed_goals: data.filter(g => g.status === 'completed').length,
    active_goals: data.filter(g => g.status === 'active').length,
    pending_goals: data.filter(g => g.status === 'pending').length,
    on_hold_goals: data.filter(g => g.status === 'on_hold').length,
    average_completion_rate: Math.round(
      data.reduce((sum, g) => sum + (g.actual_completion_rate || 0), 0) / data.length
    ),
    average_duration_days: Math.round(
      data
        .filter(g => g.completion_date && g.start_date)
        .reduce((sum, g) => {
          const start = new Date(g.start_date)
          const end = new Date(g.completion_date)
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          return sum + days
        }, 0) / data.filter(g => g.completion_date && g.start_date).length || 0
    ),
    ai_suggested_count: data.filter(g => g.is_ai_suggested).length,
    completion_rate: Math.round(
      (data.filter(g => g.status === 'completed').length / data.length) * 100
    ),
    goals_by_type: data.reduce((acc, g) => {
      acc[g.goal_type] = (acc[g.goal_type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    goals_by_category: {} // Would need category data to populate this
  }

  return stats
}

// Get active goals for a patient
export async function getActiveGoalsForPatient(patientId: string) {
  const { data, error } = await supabase
    .from('rehabilitation_goals')
    .select(`
      *,
      category:goal_categories!rehabilitation_goals_category_id_fkey(
        name,
        color,
        icon
      ),
      sub_goals:rehabilitation_goals!parent_goal_id(
        id,
        title,
        status,
        actual_completion_rate
      )
    `)
    .eq('patient_id', patientId)
    .in('status', ['active'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get overdue goals
export async function getOverdueGoals(socialWorkerId?: string) {
  const today = new Date().toISOString().split('T')[0]
  
  let query = supabase
    .from('rehabilitation_goals')
    .select(`
      *,
      patient:patients!rehabilitation_goals_patient_id_fkey(
        id,
        patient_identifier,
        full_name
      ),
      created_by:social_workers!rehabilitation_goals_created_by_social_worker_id_fkey(
        full_name
      )
    `)
    .lt('end_date', today)
    .in('status', ['active', 'pending'])

  if (socialWorkerId) {
    query = query.eq('created_by_social_worker_id', socialWorkerId)
  }

  const { data, error } = await query.order('end_date', { ascending: true })

  if (error) throw error
  return data
}

// Get patient's active goals with progress information
export async function getPatientActiveGoals(patientId: string) {
  // JOIN을 사용하여 한 번에 필요한 데이터 가져오기
  const { data, error } = await supabase
    .from('rehabilitation_goals')
    .select(`
      *,
      created_by:social_workers!created_by_social_worker_id(
        user_id,
        full_name,
        employee_id
      )
    `)
    .eq('patient_id', patientId)
    .in('status', ['active'])
    .eq('goal_type', 'six_month')
    .order('created_at', { ascending: false })

  if (error) throw error
  
  // 모든 하위 목표 진행률을 한 번에 계산
  if (data && data.length > 0) {
    const goalIds = data.map(g => g.id)
    
    // 모든 월간 목표를 한 번에 조회
    const { data: allMonthlyGoals } = await supabase
      .from('rehabilitation_goals')
      .select('id, parent_goal_id, status')
      .in('parent_goal_id', goalIds)
      .eq('goal_type', 'monthly')
    
    if (allMonthlyGoals && allMonthlyGoals.length > 0) {
      const monthlyGoalIds = allMonthlyGoals.map(g => g.id)
      
      // 모든 주간 목표를 한 번에 조회
      const { data: allWeeklyGoals } = await supabase
        .from('rehabilitation_goals')
        .select('id, parent_goal_id, status')
        .in('parent_goal_id', monthlyGoalIds)
        .eq('goal_type', 'weekly')
      
      // 각 6개월 목표별로 진행률 계산
      for (const goal of data) {
        // 해당 6개월 목표의 월간 목표 찾기
        const monthlyGoals = allMonthlyGoals.filter(m => m.parent_goal_id === goal.id)
        const monthlyIds = monthlyGoals.map(m => m.id)
        
        // 해당 월간 목표들의 주간 목표 찾기
        const weeklyGoals = allWeeklyGoals?.filter(w => monthlyIds.includes(w.parent_goal_id)) || []
        
        const totalWeeklyGoals = weeklyGoals.length
        const completedWeeklyGoals = weeklyGoals.filter(g => g.status === 'completed').length
        
        // 진행률 계산 (24주 기준)
        goal.progress = totalWeeklyGoals > 0 
          ? Math.round((completedWeeklyGoals / 24) * 100) 
          : 0
        
        // 통계 정보 추가
        goal.stats = {
          totalMonthly: monthlyGoals.length,
          totalWeekly: totalWeeklyGoals,
          completedWeekly: completedWeeklyGoals
        }
      }
    }
  }
  
  return data
}

// Batch update goal statuses
export async function batchUpdateGoalStatuses(goalIds: string[], newStatus: string) {
  const { error } = await supabase
    .from('rehabilitation_goals')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .in('id', goalIds)

  if (error) throw error
}

// Helper function to calculate goal progress based on sub-goals
export async function calculateGoalProgress(parentGoalId: string) {
  const { data: subGoals, error } = await supabase
    .from('rehabilitation_goals')
    .select('actual_completion_rate, status')
    .eq('parent_goal_id', parentGoalId)

  if (error) throw error

  if (!subGoals || subGoals.length === 0) {
    return null
  }

  const totalProgress = subGoals.reduce((sum, goal) => sum + (goal.actual_completion_rate || 0), 0)
  const averageProgress = Math.round(totalProgress / subGoals.length)

  return {
    average_progress: averageProgress,
    completed_sub_goals: subGoals.filter(g => g.status === 'completed').length,
    total_sub_goals: subGoals.length
  }
}

// Goal type constants
export const GOAL_TYPES = {
  SIX_MONTH: 'six_month',
  MONTHLY: 'monthly',
  WEEKLY: 'weekly',
  DAILY: 'daily',
  CUSTOM: 'custom'
} as const

export const GOAL_TYPE_LABELS = {
  [GOAL_TYPES.SIX_MONTH]: '6개월 목표',
  [GOAL_TYPES.MONTHLY]: '월간 목표',
  [GOAL_TYPES.WEEKLY]: '주간 목표',
  [GOAL_TYPES.DAILY]: '일일 목표',
  [GOAL_TYPES.CUSTOM]: '사용자 지정'
} as const

export const GOAL_STATUSES = {
  PENDING: 'pending',
  ACTIVE: 'active',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled',
  DELETED: 'deleted'
} as const

export const GOAL_STATUS_LABELS = {
  [GOAL_STATUSES.PENDING]: '대기 중',
  [GOAL_STATUSES.ACTIVE]: '활성',
  [GOAL_STATUSES.IN_PROGRESS]: '진행 중',
  [GOAL_STATUSES.COMPLETED]: '완료',
  [GOAL_STATUSES.ON_HOLD]: '보류',
  [GOAL_STATUSES.CANCELLED]: '취소',
  [GOAL_STATUSES.DELETED]: '삭제됨'
} as const

// Helper functions
export const getGoalTypeLabel = (type: string) =>
  GOAL_TYPE_LABELS[type as keyof typeof GOAL_TYPE_LABELS] || type

export const getGoalStatusLabel = (status: string) =>
  GOAL_STATUS_LABELS[status as keyof typeof GOAL_STATUS_LABELS] || status

export const getGoalStatusColor = (status: string) => {
  const colors = {
    [GOAL_STATUSES.PENDING]: '#6B7280',
    [GOAL_STATUSES.ACTIVE]: '#3B82F6',
    [GOAL_STATUSES.IN_PROGRESS]: '#F59E0B',
    [GOAL_STATUSES.COMPLETED]: '#10B981',
    [GOAL_STATUSES.ON_HOLD]: '#8B5CF6',
    [GOAL_STATUSES.CANCELLED]: '#EF4444',
    [GOAL_STATUSES.DELETED]: '#991B1B'
  }
  return colors[status as keyof typeof colors] || '#6B7280'
}

export const calculateDaysRemaining = (endDate: string) => {
  const end = new Date(endDate)
  const today = new Date()
  const diffTime = end.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export const isGoalOverdue = (endDate: string, status: string) => {
  return calculateDaysRemaining(endDate) < 0 && 
         status !== GOAL_STATUSES.COMPLETED && status !== GOAL_STATUSES.CANCELLED
}