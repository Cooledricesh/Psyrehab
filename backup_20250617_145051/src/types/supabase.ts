export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      administrators: {
        Row: {
          admin_level: number | null
          created_at: string
          full_name: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_level?: number | null
          created_at?: string
          full_name: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_level?: number | null
          created_at?: string
          full_name?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_goal_recommendations: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          assessment_data: Json | null
          assessment_id: string | null
          created_at: string
          execution_strategy: Json | null
          id: string
          is_active: boolean | null
          // New structured format
          recommendations: Json
          patient_analysis: Json
          patient_id: string
          recommendation_date: string
          success_indicators: Json | null
          updated_at: string
          // Legacy fields (deprecated but kept for backward compatibility)
          monthly_plans: Json | null
          six_month_goals: Json | null
          weekly_plans: Json | null
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          assessment_data?: Json | null
          assessment_id?: string | null
          created_at?: string
          execution_strategy?: Json | null
          id?: string
          is_active?: boolean | null
          // New structured format
          recommendations: Json
          patient_analysis: Json
          patient_id: string
          recommendation_date: string
          success_indicators?: Json | null
          updated_at?: string
          // Legacy fields (deprecated but kept for backward compatibility)
          monthly_plans?: Json | null
          six_month_goals?: Json | null
          weekly_plans?: Json | null
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          assessment_data?: Json | null
          assessment_id?: string | null
          created_at?: string
          execution_strategy?: Json | null
          id?: string
          is_active?: boolean | null
          // New structured format
          recommendations?: Json
          patient_analysis?: Json
          patient_id?: string
          recommendation_date?: string
          success_indicators?: Json | null
          updated_at?: string
          // Legacy fields (deprecated but kept for backward compatibility)
          monthly_plans?: Json | null
          six_month_goals?: Json | null
          weekly_plans?: Json | null
        }
        Relationships: []
      }
      assessment_options: {
        Row: {
          created_at: string
          id: string
          option_label: string
          option_order: number | null
          option_type: string
          option_value: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_label: string
          option_order?: number | null
          option_type: string
          option_value: string
        }
        Update: {
          created_at?: string
          id?: string
          option_label?: string
          option_order?: number | null
          option_type?: string
          option_value?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          assessed_by: string
          assessment_date: string
          constraints: string[] | null
          created_at: string
          focus_time: string
          id: string
          motivation_level: number
          notes: string | null
          past_successes: string[] | null
          patient_id: string
          social_preference: string
          updated_at: string
          // AI recommendation tracking fields
          ai_recommendation_status: string | null
          ai_recommendation_id: string | null
        }
        Insert: {
          assessed_by: string
          assessment_date?: string
          constraints?: string[] | null
          created_at?: string
          focus_time: string
          id?: string
          motivation_level: number
          notes?: string | null
          past_successes?: string[] | null
          patient_id: string
          social_preference: string
          updated_at?: string
          // AI recommendation tracking fields
          ai_recommendation_status?: string | null
          ai_recommendation_id?: string | null
        }
        Update: {
          assessed_by?: string
          assessment_date?: string
          constraints?: string[] | null
          created_at?: string
          focus_time?: string
          id?: string
          motivation_level?: number
          notes?: string | null
          past_successes?: string[] | null
          patient_id?: string
          social_preference?: string
          updated_at?: string
          // AI recommendation tracking fields
          ai_recommendation_status?: string | null
          ai_recommendation_id?: string | null
        }
        Relationships: []
      }
      goal_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      goal_evaluations: {
        Row: {
          challenges: Json | null
          completion_rate: number | null
          created_at: string
          evaluated_by: string
          evaluation_date: string
          evaluation_notes: string | null
          evaluation_type: string
          goal_id: string
          id: string
          next_steps: Json | null
          strengths: Json | null
          updated_at: string
        }
        Insert: {
          challenges?: Json | null
          completion_rate?: number | null
          created_at?: string
          evaluated_by: string
          evaluation_date: string
          evaluation_notes?: string | null
          evaluation_type: string
          goal_id: string
          id?: string
          next_steps?: Json | null
          strengths?: Json | null
          updated_at?: string
        }
        Update: {
          challenges?: Json | null
          completion_rate?: number | null
          created_at?: string
          evaluated_by?: string
          evaluation_date?: string
          evaluation_notes?: string | null
          evaluation_type?: string
          goal_id?: string
          id?: string
          next_steps?: Json | null
          strengths?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      goal_history: {
        Row: {
          change_reason: string | null
          change_type: string
          changed_by: string
          created_at: string
          goal_id: string
          id: string
          new_values: Json | null
          previous_values: Json | null
        }
        Insert: {
          change_reason?: string | null
          change_type: string
          changed_by: string
          created_at?: string
          goal_id: string
          id?: string
          new_values?: Json | null
          previous_values?: Json | null
        }
        Update: {
          change_reason?: string | null
          change_type?: string
          changed_by?: string
          created_at?: string
          goal_id?: string
          id?: string
          new_values?: Json | null
          previous_values?: Json | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          additional_info: Json | null
          admission_date: string | null
          contact_info: Json | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          gender: string | null
          id: string
          patient_identifier: string
          primary_social_worker_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          additional_info?: Json | null
          admission_date?: string | null
          contact_info?: Json | null
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          gender?: string | null
          id?: string
          patient_identifier: string
          primary_social_worker_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          additional_info?: Json | null
          admission_date?: string | null
          contact_info?: Json | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          patient_identifier?: string
          primary_social_worker_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rehabilitation_goals: {
        Row: {
          actual_completion_rate: number | null
          ai_suggestion_details: Json | null
          category_id: string | null
          completion_date: string | null
          created_at: string
          created_by_social_worker_id: string
          description: string | null
          end_date: string | null
          evaluation_criteria: Json | null
          goal_type: string | null
          id: string
          is_ai_suggested: boolean
          is_from_ai_recommendation: boolean | null
          month_number: number | null
          parent_goal_id: string | null
          patient_id: string
          priority: number | null
          sequence_number: number | null
          source_recommendation_id: string | null
          start_date: string | null
          status: string
          target_completion_rate: number | null
          title: string
          updated_at: string
          week_number: number | null
        }
        Insert: {
          actual_completion_rate?: number | null
          ai_suggestion_details?: Json | null
          category_id?: string | null
          completion_date?: string | null
          created_at?: string
          created_by_social_worker_id: string
          description?: string | null
          end_date?: string | null
          evaluation_criteria?: Json | null
          goal_type?: string | null
          id?: string
          is_ai_suggested?: boolean
          is_from_ai_recommendation?: boolean | null
          month_number?: number | null
          parent_goal_id?: string | null
          patient_id: string
          priority?: number | null
          sequence_number?: number | null
          source_recommendation_id?: string | null
          start_date?: string | null
          status?: string
          target_completion_rate?: number | null
          title: string
          updated_at?: string
          week_number?: number | null
        }
        Update: {
          actual_completion_rate?: number | null
          ai_suggestion_details?: Json | null
          category_id?: string | null
          completion_date?: string | null
          created_at?: string
          created_by_social_worker_id?: string
          description?: string | null
          end_date?: string | null
          evaluation_criteria?: Json | null
          goal_type?: string | null
          id?: string
          is_ai_suggested?: boolean
          is_from_ai_recommendation?: boolean | null
          month_number?: number | null
          parent_goal_id?: string | null
          patient_id?: string
          priority?: number | null
          sequence_number?: number | null
          source_recommendation_id?: string | null
          start_date?: string | null
          status?: string
          target_completion_rate?: number | null
          title?: string
          updated_at?: string
          week_number?: number | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          role_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          role_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          role_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_records: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          is_group_session: boolean | null
          location: string | null
          notes: string | null
          participants_count: number | null
          patient_id: string
          service_category: string | null
          service_date_time: string
          service_type: string
          social_worker_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_group_session?: boolean | null
          location?: string | null
          notes?: string | null
          participants_count?: number | null
          patient_id: string
          service_category?: string | null
          service_date_time: string
          service_type: string
          social_worker_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_group_session?: boolean | null
          location?: string | null
          notes?: string | null
          participants_count?: number | null
          patient_id?: string
          service_category?: string | null
          service_date_time?: string
          service_type?: string
          social_worker_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_workers: {
        Row: {
          contact_number: string | null
          created_at: string
          department: string | null
          employee_id: string | null
          full_name: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_number?: string | null
          created_at?: string
          department?: string | null
          employee_id?: string | null
          full_name: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_number?: string | null
          created_at?: string
          department?: string | null
          employee_id?: string | null
          full_name?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          role_id?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_check_ins: {
        Row: {
          check_in_date: string
          checked_by: string
          completion_notes: string | null
          created_at: string
          goal_id: string
          id: string
          is_completed: boolean
          mood_rating: number | null
          obstacles_faced: string | null
          support_needed: string | null
          updated_at: string
          week_number: number
        }
        Insert: {
          check_in_date: string
          checked_by: string
          completion_notes?: string | null
          created_at?: string
          goal_id: string
          id?: string
          is_completed?: boolean
          mood_rating?: number | null
          obstacles_faced?: string | null
          support_needed?: string | null
          updated_at?: string
          week_number: number
        }
        Update: {
          check_in_date?: string
          checked_by?: string
          completion_notes?: string | null
          created_at?: string
          goal_id?: string
          id?: string
          is_completed?: boolean
          mood_rating?: number | null
          obstacles_faced?: string | null
          support_needed?: string | null
          updated_at?: string
          week_number?: number
        }
        Relationships: []
      }
    }
    Views: {
      assessment_statistics: {
        Row: {
          ai_recommendations_count: number | null
          applied_recommendations_count: number | null
          assessment_count: number | null
          avg_motivation_level: number | null
          most_common_focus_time: string | null
          most_common_social_preference: string | null
          patient_id: string | null
          patient_name: string | null
        }
        Relationships: []
      }
      goal_hierarchy: {
        Row: {
          created_by_name: string | null
          goal_type: string | null
          id: string | null
          level: number | null
          parent_goal_id: string | null
          path: string[] | null
          patient_id: string | null
          patient_name: string | null
          sequence_number: number | null
          status: string | null
          title: string | null
        }
        Relationships: []
      }
      goal_metrics: {
        Row: {
          active_goals_count: number | null
          ai_recommended_goals_count: number | null
          avg_monthly_completion_rate: number | null
          avg_six_month_completion_rate: number | null
          avg_weekly_completion_rate: number | null
          completed_monthly_goals: number | null
          completed_six_month_goals: number | null
          completed_weekly_goals: number | null
          last_assessment_date: string | null
          last_goal_created_at: string | null
          monthly_goals_count: number | null
          patient_id: string | null
          patient_name: string | null
          six_month_goals_count: number | null
          total_assessments: number | null
          weekly_goals_count: number | null
        }
        Relationships: []
      }
      goal_timeline: {
        Row: {
          actual_completion_rate: number | null
          days_remaining: number | null
          due_date: string | null
          goal_id: string | null
          goal_title: string | null
          goal_type: string | null
          patient_id: string | null
          patient_name: string | null
          sequence_number: number | null
          start_date: string | null
          status: string | null
          timeline_status: string | null
        }
        Relationships: []
      }
      patient_current_progress: {
        Row: {
          current_six_month_goal_id: string | null
          current_week_goals_count: number | null
          last_assessment_date: string | null
          next_assessment_due_date: string | null
          overall_progress_percentage: number | null
          patient_id: string | null
          patient_name: string | null
        }
        Relationships: []
      }
      pending_weekly_checkins: {
        Row: {
          current_week: number | null
          goal_id: string | null
          goal_title: string | null
          patient_id: string | null
          patient_name: string | null
          social_worker_id: string | null
        }
        Relationships: []
      }
      social_worker_dashboard: {
        Row: {
          active_goals_count: number | null
          patient_count: number | null
          recent_assessments_count: number | null
          recently_completed_goals: number | null
          social_worker_name: string | null
          user_id: string | null
          weekly_check_ins_count: number | null
        }
        Relationships: []
      }
      weekly_progress_overview: {
        Row: {
          check_in_date: string | null
          goal_id: string | null
          goal_title: string | null
          goal_type: string | null
          is_completed: boolean | null
          mood_rating: number | null
          obstacles_faced: string | null
          patient_id: string | null
          week_number: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// 편의를 위한 타입 별칭들
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// 주요 테이블 타입들
export type SocialWorker = Tables<'social_workers'>
export type Administrator = Tables<'administrators'>
export type Patient = Tables<'patients'>
export type Assessment = Tables<'assessments'>
export type RehabilitationGoal = Tables<'rehabilitation_goals'>
export type AIGoalRecommendation = Tables<'ai_goal_recommendations'>
export type GoalEvaluation = Tables<'goal_evaluations'>
export type WeeklyCheckIn = Tables<'weekly_check_ins'>
export type ServiceRecord = Tables<'service_records'>
export type GoalCategory = Tables<'goal_categories'>
export type GoalHistory = Tables<'goal_history'>
export type AssessmentOption = Tables<'assessment_options'>
export type Role = Tables<'roles'>
export type UserRole = Tables<'user_roles'>

// 뷰 타입들
export type SocialWorkerDashboard = Database['public']['Views']['social_worker_dashboard']['Row']
export type PatientCurrentProgress = Database['public']['Views']['patient_current_progress']['Row']
export type GoalMetrics = Database['public']['Views']['goal_metrics']['Row']
export type AssessmentStatistics = Database['public']['Views']['assessment_statistics']['Row']
export type GoalTimeline = Database['public']['Views']['goal_timeline']['Row']
export type GoalHierarchy = Database['public']['Views']['goal_hierarchy']['Row']
export type PendingWeeklyCheckins = Database['public']['Views']['pending_weekly_checkins']['Row']
export type WeeklyProgressOverview = Database['public']['Views']['weekly_progress_overview']['Row']

// Union types
export type User = SocialWorker | Administrator 