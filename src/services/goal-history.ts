// Goal History service functions
import { supabase } from '@/lib/supabase'

// Temporary types until Supabase types are properly generated
type TablesInsert = Record<string, unknown>
type GoalHistoryWithDetails = Record<string, unknown>

// Get goal history for a specific goal
export async function getGoalHistory(goalId: string) {
  const { data, error } = await supabase
    .from('goal_history')
    .select(`
      *,
      goal:rehabilitation_goals!goal_history_goal_id_fkey(
        id,
        title,
        goal_type,
        status,
        patient:patients!rehabilitation_goals_patient_id_fkey(
          id,
          patient_identifier,
          full_name
        )
      ),
      changed_by_user:social_workers!goal_history_changed_by_fkey(
        user_id,
        full_name,
        employee_id,
        department
      )
    `)
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get a specific goal history entry with full details
export async function getGoalHistoryWithDetails(historyId: string): Promise<GoalHistoryWithDetails | null> {
  const { data, error } = await supabase
    .from('goal_history')
    .select(`
      *,
      goal:rehabilitation_goals!goal_history_goal_id_fkey(
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
          full_name,
          date_of_birth
        ),
        category:goal_categories!rehabilitation_goals_category_id_fkey(
          id,
          name,
          color,
          icon
        )
      ),
      changed_by_user:social_workers!goal_history_changed_by_fkey(
        user_id,
        full_name,
        employee_id,
        department
      )
    `)
    .eq('id', historyId)
    .single()

  if (error) throw error
  return data
}

// Create a new goal history entry
export async function createGoalHistoryEntry(history: TablesInsert) {
  const { data, error } = await supabase
    .from('goal_history')
    .insert(history)
    .select(`
      *,
      goal:rehabilitation_goals!goal_history_goal_id_fkey(
        id,
        title,
        goal_type
      ),
      changed_by_user:social_workers!goal_history_changed_by_fkey(
        full_name,
        employee_id
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Get goal history with filters
export async function getGoalHistoryWithFilters(filters: {
  goalId?: string
  patientId?: string
  changedBy?: string
  changeType?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}) {
  let query = supabase
    .from('goal_history')
    .select(`
      *,
      goal:rehabilitation_goals!goal_history_goal_id_fkey(
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
      changed_by_user:social_workers!goal_history_changed_by_fkey(
        user_id,
        full_name,
        employee_id
      )
    `)

  // Apply filters
  if (filters.goalId) {
    query = query.eq('goal_id', filters.goalId)
  }
  if (filters.changedBy) {
    query = query.eq('changed_by', filters.changedBy)
  }
  if (filters.changeType) {
    query = query.eq('change_type', filters.changeType)
  }
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo)
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

// Get goal history statistics
export async function getGoalHistoryStatistics(filters?: {
  goalId?: string
  patientId?: string
  changedBy?: string
  dateFrom?: string
  dateTo?: string
}) {
  let query = supabase
    .from('goal_history')
    .select(`
      id,
      change_type,
      created_at,
      goal:rehabilitation_goals!goal_history_goal_id_fkey(
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
  if (filters?.changedBy) {
    query = query.eq('changed_by', filters.changedBy)
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
      total_changes: 0,
      change_types: {},
      goal_types: {},
      categories: {},
      monthly_activity: {},
      recent_activity_trend: 'no_data',
    }
  }

  // Calculate statistics
  const stats = {
    total_changes: data.length,
    change_types: data.reduce((acc, history) => {
      acc[history.change_type] = (acc[history.change_type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    goal_types: data.reduce((acc, history) => {
      const goalType = (history.goal as unknown)?.goal_type || 'unknown'
      acc[goalType] = (acc[goalType] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    categories: data.reduce((acc, history) => {
      const categoryName = (history.goal as unknown)?.category?.name || 'unknown'
      acc[categoryName] = (acc[categoryName] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    monthly_activity: data.reduce((acc, history) => {
      const month = history.created_at.substring(0, 7) // YYYY-MM
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    recent_activity_trend: data.length >= 10 ? 'active' : data.length >= 5 ? 'moderate' : 'low',
  }

  return stats
}

// Get recent goal history (for dashboard)
export async function getRecentGoalHistory(limit = 10) {
  const { data, error } = await supabase
    .from('goal_history')
    .select(`
      *,
      goal:rehabilitation_goals!goal_history_goal_id_fkey(
        id,
        title,
        goal_type,
        patient:patients!rehabilitation_goals_patient_id_fkey(
          patient_identifier,
          full_name
        )
      ),
      changed_by_user:social_workers!goal_history_changed_by_fkey(
        full_name,
        employee_id
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Get change timeline for a goal
export async function getGoalChangeTimeline(goalId: string) {
  const { data, error } = await supabase
    .from('goal_history')
    .select(`
      id,
      change_type,
      previous_values,
      new_values,
      change_reason,
      created_at,
      changed_by_user:social_workers!goal_history_changed_by_fkey(
        full_name,
        employee_id
      )
    `)
    .eq('goal_id', goalId)
    .order('created_at', { ascending: true })

  if (error) throw error

  if (!data || data.length === 0) {
    return {
      timeline: [],
      total_changes: 0,
      change_frequency: 0,
      most_common_change: null,
    }
  }

  // Calculate change frequency (changes per week)
  const firstChange = new Date(data[0].created_at)
  const lastChange = new Date(data[data.length - 1].created_at)
  const daysDiff = Math.ceil((lastChange.getTime() - firstChange.getTime()) / (1000 * 60 * 60 * 24))
  const weeksDiff = Math.max(1, Math.ceil(daysDiff / 7))
  const changeFrequency = Math.round((data.length / weeksDiff) * 10) / 10

  // Find most common change type
  const changeTypeCounts = data.reduce((acc, change) => {
    acc[change.change_type] = (acc[change.change_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mostCommonChange = Object.entries(changeTypeCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null

  return {
    timeline: data,
    total_changes: data.length,
    change_frequency: changeFrequency, // changes per week
    most_common_change: mostCommonChange,
  }
}

// Track goal change automatically (utility function)
export async function trackGoalChange(
  goalId: string,
  changeType: string,
  previousValues: unknown,
  newValues: unknown,
  changedBy: string,
  changeReason?: string
) {
  return createGoalHistoryEntry({
    goal_id: goalId,
    change_type: changeType,
    previous_values: previousValues,
    new_values: newValues,
    changed_by: changedBy,
    change_reason: changeReason,
  })
}

// Change type constants
export const CHANGE_TYPES = {
  CREATED: 'created',
  UPDATED: 'updated',
  STATUS_CHANGED: 'status_changed',
  PROGRESS_UPDATED: 'progress_updated',
  DEADLINE_EXTENDED: 'deadline_extended',
  CATEGORY_CHANGED: 'category_changed',
  DELETED: 'deleted',
  RESTORED: 'restored',
} as const

export const CHANGE_TYPE_LABELS = {
  [CHANGE_TYPES.CREATED]: '목표 생성',
  [CHANGE_TYPES.UPDATED]: '목표 수정',
  [CHANGE_TYPES.STATUS_CHANGED]: '상태 변경',
  [CHANGE_TYPES.PROGRESS_UPDATED]: '진행률 업데이트',
  [CHANGE_TYPES.DEADLINE_EXTENDED]: '마감일 연장',
  [CHANGE_TYPES.CATEGORY_CHANGED]: '카테고리 변경',
  [CHANGE_TYPES.DELETED]: '목표 삭제',
  [CHANGE_TYPES.RESTORED]: '목표 복원',
} as const

export const CHANGE_TYPE_COLORS = {
  [CHANGE_TYPES.CREATED]: '#10B981',
  [CHANGE_TYPES.UPDATED]: '#3B82F6',
  [CHANGE_TYPES.STATUS_CHANGED]: '#8B5CF6',
  [CHANGE_TYPES.PROGRESS_UPDATED]: '#F59E0B',
  [CHANGE_TYPES.DEADLINE_EXTENDED]: '#F97316',
  [CHANGE_TYPES.CATEGORY_CHANGED]: '#6B7280',
  [CHANGE_TYPES.DELETED]: '#EF4444',
  [CHANGE_TYPES.RESTORED]: '#059669',
} as const

// Helper functions
export const getChangeTypeLabel = (type: string) =>
  CHANGE_TYPE_LABELS[type as keyof typeof CHANGE_TYPE_LABELS] || type

export const getChangeTypeColor = (type: string) =>
  CHANGE_TYPE_COLORS[type as keyof typeof CHANGE_TYPE_COLORS] || '#6B7280'

export const formatChangeValues = (previousValues: unknown, newValues: unknown) => {
  const changes = []
  
  if (previousValues && newValues) {
    for (const key in newValues) {
      if (previousValues[key] !== newValues[key]) {
        changes.push({
          field: key,
          from: previousValues[key],
          to: newValues[key],
        })
      }
    }
  }
  
  return changes
}

export const getChangeActivityLevel = (changeCount: number, timeSpanWeeks: number) => {
  const changesPerWeek = changeCount / Math.max(1, timeSpanWeeks)
  
  if (changesPerWeek >= 2) return 'high'
  if (changesPerWeek >= 0.5) return 'moderate'
  return 'low'
}

export const getActivityLevelLabel = (level: string) => {
  const labels = {
    high: '높음',
    moderate: '보통',
    low: '낮음',
  }
  return labels[level as keyof typeof labels] || level
} 