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
  ai_recommendations?: any[] // AIGoalRecommendation[]
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