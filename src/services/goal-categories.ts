// Goal Categories service functions
import { supabase } from '@/lib/supabase'

// Temporary types until Supabase types are properly generated
type TablesInsert<T extends string> = any
type TablesUpdate<T extends string> = any
type GoalCategory = any

// Get all goal categories
export async function getGoalCategories(includeInactive = false) {
  let query = supabase
    .from('goal_categories')
    .select('*')
    .order('name', { ascending: true })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// Get a specific goal category by ID
export async function getGoalCategory(id: string): Promise<GoalCategory | null> {
  const { data, error } = await supabase
    .from('goal_categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Create a new goal category
export async function createGoalCategory(category: TablesInsert<'goal_categories'>) {
  const { data, error } = await supabase
    .from('goal_categories')
    .insert(category)
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Update a goal category
export async function updateGoalCategory(id: string, updates: TablesUpdate<'goal_categories'>) {
  const { data, error } = await supabase
    .from('goal_categories')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Delete a goal category (soft delete by setting is_active to false)
export async function deleteGoalCategory(id: string, hardDelete = false) {
  if (hardDelete) {
    const { error } = await supabase
      .from('goal_categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  } else {
    // Soft delete
    const { data, error } = await supabase
      .from('goal_categories')
      .update({ is_active: false })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }
}

// Restore a soft-deleted goal category
export async function restoreGoalCategory(id: string) {
  const { data, error } = await supabase
    .from('goal_categories')
    .update({ is_active: true })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Get goal categories with goal counts
export async function getGoalCategoriesWithCounts() {
  const { data, error } = await supabase
    .from('goal_categories')
    .select(`
      *,
      goal_count:rehabilitation_goals(count)
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

// Get goals by category
export async function getGoalsByCategory(categoryId: string, filters?: {
  patientId?: string
  status?: string
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
        full_name
      ),
      created_by:social_workers!rehabilitation_goals_created_by_social_worker_id_fkey(
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
    .eq('category_id', categoryId)

  // Apply additional filters
  if (filters?.patientId) {
    query = query.eq('patient_id', filters.patientId)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  // Apply pagination
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) throw error
  return data
}

// Get category statistics
export async function getCategoryStatistics(categoryId?: string) {
  let query = supabase
    .from('rehabilitation_goals')
    .select(`
      id,
      status,
      category_id,
      created_at,
      actual_completion_rate,
      goal_categories!rehabilitation_goals_category_id_fkey(
        id,
        name
      )
    `)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
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
      categories: {},
    }
  }

  // Calculate statistics
  const stats = {
    total_goals: data.length,
    completed_goals: data.filter(g => g.status === 'completed').length,
    in_progress_goals: data.filter(g => g.status === 'in_progress').length,
    pending_goals: data.filter(g => g.status === 'pending').length,
    average_completion_rate: Math.round(
      data.reduce((sum, g) => sum + (g.actual_completion_rate || 0), 0) / data.length
    ),
    categories: data.reduce((acc, goal) => {
      const categoryId = goal.category_id
      const categoryName = (goal.goal_categories as unknown)?.name || 'Unknown'
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          name: categoryName,
          total: 0,
          completed: 0,
          in_progress: 0,
          pending: 0,
          average_completion_rate: 0,
        }
      }
      
      acc[categoryId].total++
      if (goal.status === 'completed') acc[categoryId].completed++
      if (goal.status === 'in_progress') acc[categoryId].in_progress++
      if (goal.status === 'pending') acc[categoryId].pending++
      
      return acc
    }, {} as Record<string, unknown>),
  }

  // Calculate average completion rates for each category
  Object.keys(stats.categories).forEach(categoryId => {
    const categoryGoals = data.filter(g => g.category_id === categoryId)
    stats.categories[categoryId].average_completion_rate = Math.round(
      categoryGoals.reduce((sum, g) => sum + (g.actual_completion_rate || 0), 0) / categoryGoals.length
    )
  })

  return stats
}

// Bulk update categories for goals
export async function bulkUpdateGoalCategories(updates: { goalId: string; categoryId: string }[]) {
  const results = []
  
  for (const update of updates) {
    const { data, error } = await supabase
      .from('rehabilitation_goals')
      .update({ category_id: update.categoryId })
      .eq('id', update.goalId)
      .select(`
        id,
        category:goal_categories!rehabilitation_goals_category_id_fkey(
          id,
          name,
          color
        )
      `)
      .single()

    if (error) throw error
    results.push(data)
  }

  return results
}

// Get available icons for categories
export const AVAILABLE_CATEGORY_ICONS = [
  'heart',
  'users',
  'briefcase',
  'home',
  'music',
  'book',
  'shield',
  'target',
  'activity',
  'brain',
  'pill',
  'calendar',
  'clock',
  'star',
  'trophy',
  'tools',
] as const

// Get available colors for categories
export const AVAILABLE_CATEGORY_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#A855F7', // Purple
] as const

// Helper function to get category by name
export async function getCategoryByName(name: string): Promise<GoalCategory | null> {
  const { data, error } = await supabase
    .from('goal_categories')
    .select('*')
    .eq('name', name)
    .eq('is_active', true)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
  return data || null
}

// Helper function to ensure default categories exist
export async function ensureDefaultCategories() {
  const defaultCategories = [
    {
      name: '건강 관리',
      description: '신체 및 정신 건강 관리',
      color: '#EF4444',
      icon: 'heart',
    },
    {
      name: '사회적 관계',
      description: '대인관계 및 사회적 상호작용 기술 향상',
      color: '#10B981',
      icon: 'users',
    },
    {
      name: '직업 역량',
      description: '취업 준비 및 직업 유지를 위한 역량 강화',
      color: '#F59E0B',
      icon: 'briefcase',
    },
    {
      name: '일상생활 자립',
      description: '일상생활에 필요한 자기 관리 기술 향상',
      color: '#3B82F6',
      icon: 'home',
    },
    {
      name: '여가 활동',
      description: '여가 시간 활용 및 취미 활동 개발',
      color: '#8B5CF6',
      icon: 'music',
    },
    {
      name: '교육 및 학습',
      description: '교육 참여 및 새로운 기술 학습',
      color: '#6B7280',
      icon: 'book',
    },
    {
      name: '약물 관리',
      description: '규칙적인 약물 복용 및 자가 관리',
      color: '#14B8A6',
      icon: 'pill',
    },
  ]

  const existingCategories = await getGoalCategories(true)
  const existingNames = existingCategories.map(cat => cat.name)

  const categoriesToCreate = defaultCategories.filter(
    cat => !existingNames.includes(cat.name)
  )

  if (categoriesToCreate.length > 0) {
    const { data, error } = await supabase
      .from('goal_categories')
      .insert(categoriesToCreate)
      .select('*')

    if (error) throw error
    return data
  }

  return []
} 