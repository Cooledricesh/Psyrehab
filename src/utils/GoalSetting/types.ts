// 목표 설정 페이지에서 사용하는 타입 정의

export interface AssessmentFormData {
  focusTime: string;
  motivationLevel: number;
  pastSuccesses: string[];
  pastSuccessesOther: string;
  constraints: string[];
  constraintsOther: string;
  socialPreference: string;
}

export interface Patient {
  id: string;
  patient_identifier: string;
  full_name: string;
  birth_date: string;
  gender: string;
  diagnosis: string;
  diagnosis_code: string;
  diagnosis_date: string;
  initial_diagnosis_date: string;
  phone_number?: string;
  emergency_contact?: unknown;
  address?: unknown;
  primary_social_worker_id: string;
  status: string;
  additional_info?: {
    hospitalized?: boolean;
    hospitalization_date?: string;
    discharge_date?: string;
  };
  created_at: string;
  updated_at: string;
  age?: number;
  diagnosisDuration?: string;
}

export interface Step {
  id: number;
  title: string;
  completed: boolean;
}

export interface AIRecommendation {
  id: string;
  patient_id: string;
  assessment_id: string;
  n8n_processing_status: string;
  n8n_processed_at?: string;
  recommendations?: {
    options: Array<{
      plan_id: string;
      title: string;
      description: string;
      sixMonthGoals: Array<{
        goal: string;
        monthlyPlans: Array<{
          month: number;
          activities: string[];
          weeklyPlans: Array<{
            week: string;
            tasks: string[];
          }>;
        }>;
      }>;
    }>;
  };
  created_at: string;
  updated_at: string;
}

export interface GoalData {
  patient_id: string;
  parent_goal_id?: string;
  title: string;
  description?: string;
  category_id?: string;
  goal_type: 'six_month' | 'monthly' | 'weekly';
  sequence_number: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'active' | 'completed' | 'on_hold' | 'cancelled';
  progress: number;
  actual_completion_rate?: number;
  target_completion_rate?: number;
  priority?: string;
  is_ai_suggested: boolean;
  is_from_ai_recommendation: boolean;
  source_recommendation_id?: string;
  created_by_social_worker_id: string;
}
