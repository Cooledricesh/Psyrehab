// 목표 레벨 타입 정의 (문서 스펙에 맞춤)
export type GoalType = 'six_month' | 'monthly' | 'weekly'

// 목표 상태 타입 정의  
export type GoalStatus = 'pending' | 'active' | 'completed' | 'on_hold' | 'cancelled'

// 목표 우선순위 타입 정의
export type GoalPriority = 'high' | 'medium' | 'low'

// 목표 카테고리 인터페이스 (문서 스펙에 따라 별도 테이블)
export interface GoalCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

// 기본 목표 인터페이스 (문서 스펙에 맞춤)
export interface BaseGoal {
  id: string
  patient_id: string
  parent_goal_id?: string
  title: string
  description: string
  category_id: string // FK to goal_categories
  goal_type: GoalType // 문서 스펙: goal_type
  sequence_number: number // 문서 스펙: 목표 순서
  start_date: string
  end_date: string // 문서 스펙: end_date
  status: GoalStatus
  progress: number // 0-100 백분율
  actual_completion_rate: number // 문서 스펙: 실제 달성률
  target_completion_rate: number // 문서 스펙: 목표 달성률
  priority: GoalPriority
  
  is_ai_suggested: boolean
  source_recommendation_id?: string
  is_from_ai_recommendation: boolean
  
  // 메타데이터
  created_at: string
  updated_at: string
  created_by_social_worker_id: string // 문서 스펙
  
  // 추가 속성 (현재 구현에서 유지)
  tags?: string[]
  notes?: string
  success_metrics?: string[]
  methods?: string[]
}

// 6개월 목표 (문서 스펙에 맞춤)
export interface SixMonthGoal extends BaseGoal {
  goal_type: 'six_month'
  duration_months: number // 보통 6개월
  
  // 장기 목표 특화 속성
  overall_vision?: string
  key_milestones?: string[]
  expected_outcomes?: string[]
  risk_factors?: string[]
  support_required?: string[]
}

// 월별 목표
export interface MonthlyGoal extends BaseGoal {
  goal_type: 'monthly'
  parent_goal_id: string // 6개월 목표 ID
  month_number: number // 1-6
  
  // 월별 목표 특화 속성
  specific_objectives?: string[]
  weekly_breakdown?: string[]
  measurement_criteria?: string[]
  required_resources?: string[]
}

// 주별 목표
export interface WeeklyGoal extends BaseGoal {
  goal_type: 'weekly'
  parent_goal_id: string // 월별 목표 ID
  week_number: number // 1-4
  
  // 주별 목표 특화 속성
  daily_tasks?: DailyTask[]
  frequency_per_week?: number
  duration_minutes?: number
  completion_criteria?: string[]
  
  // 체크인 관련
  check_in_required?: boolean
  check_in_frequency?: 'daily' | 'twice_weekly' | 'weekly'
}

// 일별 작업 인터페이스 (문서 스펙)
export interface DailyTask {
  id: string
  weekly_goal_id: string
  title: string
  description: string
  day_of_week: number // 0=일요일, 1=월요일, ..., 6=토요일
  estimated_duration: number // 분 단위
  status: 'pending' | 'completed' | 'skipped'
  completion_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

// 주간 체크인 인터페이스 (문서 스펙)
export interface WeeklyCheckIn {
  id: string
  goal_id: string
  week_number: number
  check_in_date: string
  is_completed: boolean
  completion_notes?: string
  obstacles_faced?: string
  support_needed?: string
  mood_rating: number // 1-5
  checked_by: string // social_worker user_id
  created_at: string
  updated_at: string
}

// 목표 평가 인터페이스 (문서 스펙)
export interface GoalEvaluation {
  id: string
  goal_id: string
  evaluation_type: 'weekly' | 'monthly' | 'six_month'
  evaluation_date: string
  completion_rate: number // 0-100
  evaluation_notes?: string
  strengths?: Record<string, unknown>
  challenges?: Record<string, unknown>
  next_steps?: Record<string, unknown>
  evaluated_by: string // social_worker user_id
  created_at: string
  updated_at: string
}

// 목표 관계 매핑 (문서 스펙에 맞춤)
export interface GoalHierarchy {
  sixMonthGoal: SixMonthGoal
  monthlyGoals: MonthlyGoal[]
  weeklyGoals: WeeklyGoal[]
  dailyTasks: DailyTask[]
  weeklyCheckIns: WeeklyCheckIn[]
  evaluations: GoalEvaluation[]
}

// 목표 진척도 계산 결과
export interface GoalProgress {
  goalId: string
  goal_type: GoalType
  progressPercentage: number
  actualCompletionRate: number // 문서 스펙
  targetCompletionRate: number // 문서 스펙
  completedSubgoals: number
  totalSubgoals: number
  
  // 하위 목표들의 진척도
  childrenProgress?: GoalProgress[]
  
  // 예상 완료일
  estimatedCompletion?: string
  
  // 지연 여부
  isDelayed: boolean
  delayReason?: string
}

// 목표 히스토리 추적 (문서 스펙)
export interface GoalHistory {
  id: string
  goal_id: string
  changed_by: string // social_worker user_id
  change_type: 'created' | 'updated' | 'status_changed' | 'completed'
  previous_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  change_reason?: string
  created_at: string
}

// 목표 생성 요청 인터페이스 (문서 스펙 반영)
export interface CreateGoalRequest {
  patient_id: string
  parent_goal_id?: string
  title: string
  description: string
  category_id: string // FK to goal_categories
  goal_type: GoalType
  sequence_number?: number
  end_date: string
  target_completion_rate?: number
  priority?: GoalPriority
  
  is_ai_suggested?: boolean
  source_recommendation_id?: string
  
  // 선택적 속성
  tags?: string[]
  success_metrics?: string[]
  methods?: string[]
  notes?: string
}

// 목표 업데이트 요청 인터페이스
export interface UpdateGoalRequest {
  title?: string
  description?: string
  status?: GoalStatus
  priority?: GoalPriority
  progress?: number
  actual_completion_rate?: number
  end_date?: string
  notes?: string
  tags?: string[]
  success_metrics?: string[]
  methods?: string[]
}

// 목표 검색/필터 인터페이스 (문서 스펙 반영)
export interface GoalFilters {
  patient_id?: string
  goal_type?: GoalType
  category_id?: string
  status?: GoalStatus
  priority?: GoalPriority
  date_range?: {
    start: string
    end: string
  }
  tags?: string[]
  search_query?: string
  is_ai_suggested?: boolean
  created_by_social_worker_id?: string
}

// 목표 통계 인터페이스 (문서 스펙 반영)
export interface GoalStatistics {
  totalGoals: number
  goalsByType: Record<GoalType, number>
  goalsByStatus: Record<GoalStatus, number>
  goalsByCategory: Record<string, number>
  
  averageProgress: number
  averageActualCompletionRate: number
  averageTargetCompletionRate: number
  completionRate: number
  
  // 시간별 통계
  goalsThisWeek: number
  goalsThisMonth: number
  completedThisWeek: number
  completedThisMonth: number
  
  aiSuggestedGoals: number
  aiSuggestedCompletionRate: number
  
  // 지연된 목표
  delayedGoals: number
  atRiskGoals: number
}

// 유틸리티 타입들
export type GoalWithChildren = BaseGoal & {
  children?: GoalWithChildren[]
  category?: GoalCategory
}

export type GoalTreeNode = {
  goal: BaseGoal
  children: GoalTreeNode[]
  depth: number
  isExpanded?: boolean
} 