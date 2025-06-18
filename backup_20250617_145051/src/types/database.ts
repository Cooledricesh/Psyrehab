// Database types - Generated from Supabase schema
// Re-export types from supabase.ts for convenience

export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  User,
  SocialWorker,
  Administrator,
  Patient,
  Assessment,
  RehabilitationGoal,
  AIGoalRecommendation,
  GoalEvaluation,
  WeeklyCheckIn,
  ServiceRecord,
  GoalCategory,
  GoalHistory,
  AssessmentOption,
  Role,
  UserRole,
  SocialWorkerDashboard,
  PatientCurrentProgress,
  GoalMetrics,
  AssessmentStatistics,
  GoalTimeline,
  GoalHierarchy,
  PendingWeeklyCheckins,
  WeeklyProgressOverview,
} from './supabase'

// AI Recommendation structured data types (n8n stores structured data directly)
export interface AIRecommendationPlan {
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

export interface StructuredAIRecommendation {
  id: string
  patient_id: string
  assessment_id: string | null
  recommendation_date: string
  recommendations: AIRecommendationPlan[]
  patient_analysis?: any
  success_indicators?: any
  execution_strategy?: any
  is_active: boolean
  applied_at: string | null
  applied_by: string | null
  created_at: string
  updated_at: string
}

// Additional derived types for the application
export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'social_worker'
  department?: string
  employee_id?: string
  contact_number?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PatientWithProgress {
  id: string
  patient_identifier: string
  full_name: string
  current_progress?: any // PatientCurrentProgress
  goal_metrics?: any // GoalMetrics
  primary_social_worker?: {
    full_name: string
    employee_id?: string
  }
}

export interface GoalWithDetails {
  id: string
  title: string
  description?: string
  category?: any // GoalCategory
  evaluations?: any[] // GoalEvaluation[]
  weekly_check_ins?: any[] // WeeklyCheckIn[]
  child_goals?: any[] // RehabilitationGoal[]
  parent_goal?: any // RehabilitationGoal
}

// Assessment related types
export interface AssessmentWithRecommendations {
  id: string
  patient_id: string
  assessment_date: string
  ai_recommendation_status?: 'pending' | 'processing' | 'completed' | 'failed'
  ai_recommendation_id?: string | null
  ai_recommendations?: StructuredAIRecommendation[]
}

// Assessment status checking types
export interface AIRecommendationStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  recommendationId: string | null
}

// Goal hierarchy types
export type GoalType = 'six_month' | 'monthly' | 'weekly' | 'other'
export type GoalStatus = 'pending' | 'active' | 'completed' | 'on_hold' | 'cancelled'

// Assessment stage types
export type FocusTime = '5min' | '15min' | '30min' | '1hour'
export type SocialPreference = 'individual' | 'small_group' | 'large_group'

// Service record types
export interface ServiceRecordWithDetails {
  id: string
  service_type: string
  patient?: any // Patient
  social_worker?: {
    full_name: string
    employee_id?: string
  }
} 