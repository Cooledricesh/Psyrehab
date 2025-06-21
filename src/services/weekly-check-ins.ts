// Weekly Check-ins service functions
import { supabase } from '@/lib/supabase'

// Temporary types until Supabase types are properly generated
type TablesInsert = Record<string, unknown>
type TablesUpdate = Record<string, unknown>
type WeeklyCheckInWithDetails = Record<string, unknown>

// Get weekly check-ins for a specific goal
export async function getGoalWeeklyCheckIns(goalId: string) {
  const { data, error } = await supabase
    .from('weekly_check_ins')
    .select(`
      *,
      goal:rehabilitation_goals!weekly_check_ins_goal_id_fkey(
        id,
        title,
        goal_type,
        status,
        start_date,
        end_date,
        patient:patients!rehabilitation_goals_patient_id_fkey(
          id,
          patient_identifier,
          full_name
        )
      ),
      checker:social_workers!weekly_check_ins_checked_by_fkey(
        user_id,
        full_name,
        employee_id,
        department
      )
    `)
    .eq('goal_id', goalId)
    .order('week_number', { ascending: true })

  if (error) throw error
  return data
}

// Get a specific weekly check-in with full details
export async function getWeeklyCheckInWithDetails(checkInId: string): Promise<WeeklyCheckInWithDetails | null> {
  const { data, error } = await supabase
    .from('weekly_check_ins')
    .select(`
      *,
      goal:rehabilitation_goals!weekly_check_ins_goal_id_fkey(
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
      checker:social_workers!weekly_check_ins_checked_by_fkey(
        user_id,
        full_name,
        employee_id,
        department
      )
    `)
    .eq('id', checkInId)
    .single()

  if (error) throw error
  return data
}

// Create a new weekly check-in
export async function createWeeklyCheckIn(checkIn: TablesInsert) {
  const { data, error } = await supabase
    .from('weekly_check_ins')
    .insert(checkIn)
    .select(`
      *,
      goal:rehabilitation_goals!weekly_check_ins_goal_id_fkey(
        id,
        title,
        goal_type
      ),
      checker:social_workers!weekly_check_ins_checked_by_fkey(
        full_name,
        employee_id
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Update a weekly check-in
export async function updateWeeklyCheckIn(id: string, updates: TablesUpdate) {
  const { data, error } = await supabase
    .from('weekly_check_ins')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      goal:rehabilitation_goals!weekly_check_ins_goal_id_fkey(
        id,
        title,
        goal_type
      ),
      checker:social_workers!weekly_check_ins_checked_by_fkey(
        full_name,
        employee_id
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Delete a weekly check-in
export async function deleteWeeklyCheckIn(id: string) {
  const { error } = await supabase
    .from('weekly_check_ins')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get weekly check-ins with filters
export async function getWeeklyCheckInsWithFilters(filters: {
  goalId?: string
  patientId?: string
  checkerId?: string
  weekNumber?: number
  dateFrom?: string
  dateTo?: string
  isCompleted?: boolean
  moodRatingMin?: number
  moodRatingMax?: number
  limit?: number
  offset?: number
}) {
  let query = supabase
    .from('weekly_check_ins')
    .select(`
      *,
      goal:rehabilitation_goals!weekly_check_ins_goal_id_fkey(
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
      checker:social_workers!weekly_check_ins_checked_by_fkey(
        user_id,
        full_name,
        employee_id
      )
    `)

  // Apply filters
  if (filters.goalId) {
    query = query.eq('goal_id', filters.goalId)
  }
  if (filters.checkerId) {
    query = query.eq('checked_by', filters.checkerId)
  }
  if (filters.weekNumber !== undefined) {
    query = query.eq('week_number', filters.weekNumber)
  }
  if (filters.dateFrom) {
    query = query.gte('check_in_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('check_in_date', filters.dateTo)
  }
  if (filters.isCompleted !== undefined) {
    query = query.eq('is_completed', filters.isCompleted)
  }
  if (filters.moodRatingMin !== undefined) {
    query = query.gte('mood_rating', filters.moodRatingMin)
  }
  if (filters.moodRatingMax !== undefined) {
    query = query.lte('mood_rating', filters.moodRatingMax)
  }

  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit)
  }
  if (filters.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
  }

  query = query.order('check_in_date', { ascending: false })

  const { data, error } = await query

  if (error) throw error
  return data
}

// Get weekly check-in statistics
export async function getWeeklyCheckInStatistics(filters?: {
  goalId?: string
  patientId?: string
  checkerId?: string
  dateFrom?: string
  dateTo?: string
}) {
  let query = supabase
    .from('weekly_check_ins')
    .select(`
      id,
      week_number,
      is_completed,
      mood_rating,
      check_in_date,
      goal:rehabilitation_goals!weekly_check_ins_goal_id_fkey(
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
  if (filters?.checkerId) {
    query = query.eq('checked_by', filters.checkerId)
  }
  if (filters?.dateFrom) {
    query = query.gte('check_in_date', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('check_in_date', filters.dateTo)
  }
  if (filters?.patientId) {
    query = query.eq('goal.patient_id', filters.patientId)
  }

  const { data, error } = await query

  if (error) throw error

  if (!data || data.length === 0) {
    return {
      total_check_ins: 0,
      completed_check_ins: 0,
      completion_rate: 0,
      average_mood_rating: 0,
      weekly_trends: {},
      goal_types: {},
      categories: {},
      mood_distribution: {},
    }
  }

  // Calculate statistics
  const completedCheckIns = data.filter(c => c.is_completed)
  const moodRatings = data.filter(c => c.mood_rating !== null).map(c => c.mood_rating)

  const stats = {
    total_check_ins: data.length,
    completed_check_ins: completedCheckIns.length,
    completion_rate: Math.round((completedCheckIns.length / data.length) * 100),
    average_mood_rating: moodRatings.length > 0
      ? Math.round((moodRatings.reduce((sum, rating) => sum + rating, 0) / moodRatings.length) * 10) / 10
      : 0,
    weekly_trends: data.reduce((acc, checkIn) => {
      const week = `Week ${checkIn.week_number}`
      if (!acc[week]) {
        acc[week] = {
          total: 0,
          completed: 0,
          completion_rate: 0,
          mood_ratings: [],
          average_mood: 0,
        }
      }
      acc[week].total++
      if (checkIn.is_completed) acc[week].completed++
      if (checkIn.mood_rating !== null) acc[week].mood_ratings.push(checkIn.mood_rating)
      
      acc[week].completion_rate = Math.round((acc[week].completed / acc[week].total) * 100)
      acc[week].average_mood = acc[week].mood_ratings.length > 0
        ? Math.round((acc[week].mood_ratings.reduce((sum: number, rating: number) => sum + rating, 0) / acc[week].mood_ratings.length) * 10) / 10
        : 0
      
      return acc
    }, {} as Record<string, unknown>),
    goal_types: data.reduce((acc, checkIn) => {
      const goalType = (checkIn.goal as unknown)?.goal_type || 'unknown'
      if (!acc[goalType]) {
        acc[goalType] = { total: 0, completed: 0, completion_rate: 0 }
      }
      acc[goalType].total++
      if (checkIn.is_completed) acc[goalType].completed++
      acc[goalType].completion_rate = Math.round((acc[goalType].completed / acc[goalType].total) * 100)
      return acc
    }, {} as Record<string, unknown>),
    categories: data.reduce((acc, checkIn) => {
      const categoryName = (checkIn.goal as unknown)?.category?.name || 'unknown'
      if (!acc[categoryName]) {
        acc[categoryName] = { total: 0, completed: 0, completion_rate: 0 }
      }
      acc[categoryName].total++
      if (checkIn.is_completed) acc[categoryName].completed++
      acc[categoryName].completion_rate = Math.round((acc[categoryName].completed / acc[categoryName].total) * 100)
      return acc
    }, {} as Record<string, unknown>),
    mood_distribution: moodRatings.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1
      return acc
    }, {} as Record<number, number>),
  }

  return stats
}

// Get recent weekly check-ins (for dashboard)
export async function getRecentWeeklyCheckIns(limit = 10) {
  const { data, error } = await supabase
    .from('weekly_check_ins')
    .select(`
      *,
      goal:rehabilitation_goals!weekly_check_ins_goal_id_fkey(
        id,
        title,
        goal_type,
        patient:patients!rehabilitation_goals_patient_id_fkey(
          patient_identifier,
          full_name
        )
      ),
      checker:social_workers!weekly_check_ins_checked_by_fkey(
        full_name,
        employee_id
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Get weekly check-in progress for a goal
export async function getGoalWeeklyProgress(goalId: string) {
  const { data, error } = await supabase
    .from('weekly_check_ins')
    .select(`
      id,
      week_number,
      check_in_date,
      is_completed,
      mood_rating,
      completion_notes
    `)
    .eq('goal_id', goalId)
    .order('week_number', { ascending: true })

  if (error) throw error

  if (!data || data.length === 0) {
    return {
      check_ins: [],
      total_weeks: 0,
      completed_weeks: 0,
      completion_rate: 0,
      average_mood: 0,
      trend: 'no_data',
    }
  }

  const completedCheckIns = data.filter(c => c.is_completed)
  const moodRatings = data.filter(c => c.mood_rating !== null).map(c => c.mood_rating)

  // Calculate trend based on recent weeks
  let trend = 'stable'
  if (data.length >= 3) {
    const recentWeeks = data.slice(-3)
    const completedRecent = recentWeeks.filter(c => c.is_completed).length
    const completionRate = (completedRecent / recentWeeks.length) * 100
    
    if (completionRate >= 75) trend = 'improving'
    else if (completionRate <= 25) trend = 'declining'
    else trend = 'stable'
  }

  return {
    check_ins: data,
    total_weeks: data.length,
    completed_weeks: completedCheckIns.length,
    completion_rate: Math.round((completedCheckIns.length / data.length) * 100),
    average_mood: moodRatings.length > 0
      ? Math.round((moodRatings.reduce((sum, rating) => sum + rating, 0) / moodRatings.length) * 10) / 10
      : 0,
    trend,
  }
}

// Bulk create weekly check-ins
export async function bulkCreateWeeklyCheckIns(checkIns: TablesInsert[]) {
  const { data, error } = await supabase
    .from('weekly_check_ins')
    .insert(checkIns)
    .select(`
      *,
      goal:rehabilitation_goals!weekly_check_ins_goal_id_fkey(
        id,
        title,
        goal_type
      ),
      checker:social_workers!weekly_check_ins_checked_by_fkey(
        full_name,
        employee_id
      )
    `)

  if (error) throw error
  return data
}

// Generate weekly check-ins for a goal (create placeholder check-ins for each week)
export async function generateWeeklyCheckInsForGoal(
  goalId: string,
  startDate: string,
  endDate: string,
  checkerId: string
) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const weeksDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
  
  const checkIns = []
  for (let week = 1; week <= weeksDiff; week++) {
    const checkInDate = new Date(start)
    checkInDate.setDate(start.getDate() + (week - 1) * 7)
    
    checkIns.push({
      goal_id: goalId,
      week_number: week,
      check_in_date: checkInDate.toISOString().split('T')[0],
      is_completed: false,
      checked_by: checkerId,
    })
  }
  
  return bulkCreateWeeklyCheckIns(checkIns)
}

// Mood rating constants and helpers
export const MOOD_RATINGS = {
  VERY_LOW: 1,
  LOW: 2,
  NEUTRAL: 3,
  GOOD: 4,
  VERY_GOOD: 5,
} as const

export const MOOD_RATING_LABELS = {
  [MOOD_RATINGS.VERY_LOW]: '매우 나쁨',
  [MOOD_RATINGS.LOW]: '나쁨',
  [MOOD_RATINGS.NEUTRAL]: '보통',
  [MOOD_RATINGS.GOOD]: '좋음',
  [MOOD_RATINGS.VERY_GOOD]: '매우 좋음',
} as const

export const MOOD_RATING_COLORS = {
  [MOOD_RATINGS.VERY_LOW]: '#EF4444',
  [MOOD_RATINGS.LOW]: '#F97316',
  [MOOD_RATINGS.NEUTRAL]: '#6B7280',
  [MOOD_RATINGS.GOOD]: '#10B981',
  [MOOD_RATINGS.VERY_GOOD]: '#059669',
} as const

// Helper functions
export const getMoodRatingLabel = (rating: number) =>
  MOOD_RATING_LABELS[rating as keyof typeof MOOD_RATING_LABELS] || `기분 ${rating}`

export const getMoodRatingColor = (rating: number) =>
  MOOD_RATING_COLORS[rating as keyof typeof MOOD_RATING_COLORS] || '#6B7280'

export const calculateWeeklyTrend = (checkIns: unknown[]) => {
  if (checkIns.length < 3) return 'insufficient_data'
  
  const recentWeeks = checkIns.slice(-3)
  const completedRecent = recentWeeks.filter(c => c.is_completed).length
  const completionRate = (completedRecent / recentWeeks.length) * 100
  
  if (completionRate >= 75) return 'improving'
  if (completionRate <= 25) return 'declining'
  return 'stable'
}

export const getWeeklyTrendLabel = (trend: string) => {
  const labels = {
    improving: '개선 중',
    declining: '하락 중',
    stable: '안정적',
    insufficient_data: '데이터 부족',
  }
  return labels[trend as keyof typeof labels] || trend
} 