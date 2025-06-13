// AI Goal Recommendations related constants

// Goal categories for mental health rehabilitation
export const GOAL_CATEGORIES = {
  SOCIAL_FUNCTIONING: 'social_functioning',
  COGNITIVE_SKILLS: 'cognitive_skills', 
  EMOTIONAL_REGULATION: 'emotional_regulation',
  INDEPENDENT_LIVING: 'independent_living',
  VOCATIONAL_SKILLS: 'vocational_skills',
  COMMUNICATION: 'communication',
  SELF_CARE: 'self_care',
  CRISIS_MANAGEMENT: 'crisis_management',
  MEDICATION_ADHERENCE: 'medication_adherence',
  PHYSICAL_HEALTH: 'physical_health',
} as const

export const GOAL_CATEGORY_LABELS = {
  [GOAL_CATEGORIES.SOCIAL_FUNCTIONING]: '사회적 기능',
  [GOAL_CATEGORIES.COGNITIVE_SKILLS]: '인지 기능',
  [GOAL_CATEGORIES.EMOTIONAL_REGULATION]: '감정 조절',
  [GOAL_CATEGORIES.INDEPENDENT_LIVING]: '독립 생활',
  [GOAL_CATEGORIES.VOCATIONAL_SKILLS]: '직업 기능',
  [GOAL_CATEGORIES.COMMUNICATION]: '의사소통',
  [GOAL_CATEGORIES.SELF_CARE]: '자기 관리',
  [GOAL_CATEGORIES.CRISIS_MANAGEMENT]: '위기 관리',
  [GOAL_CATEGORIES.MEDICATION_ADHERENCE]: '복약 순응',
  [GOAL_CATEGORIES.PHYSICAL_HEALTH]: '신체 건강',
} as const

// Goal priority levels
export const GOAL_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  MAINTENANCE: 'maintenance',
} as const

export const GOAL_PRIORITY_LABELS = {
  [GOAL_PRIORITIES.CRITICAL]: '긴급',
  [GOAL_PRIORITIES.HIGH]: '높음',
  [GOAL_PRIORITIES.MEDIUM]: '보통',
  [GOAL_PRIORITIES.LOW]: '낮음',
  [GOAL_PRIORITIES.MAINTENANCE]: '유지',
} as const

// Goal achievement levels
export const ACHIEVEMENT_LEVELS = {
  NOT_STARTED: 'not_started',
  STARTED: 'started', 
  IN_PROGRESS: 'in_progress',
  NEARLY_ACHIEVED: 'nearly_achieved',
  ACHIEVED: 'achieved',
  MAINTAINED: 'maintained',
  REGRESSED: 'regressed',
} as const

export const ACHIEVEMENT_LEVEL_LABELS = {
  [ACHIEVEMENT_LEVELS.NOT_STARTED]: '시작 안함',
  [ACHIEVEMENT_LEVELS.STARTED]: '시작함',
  [ACHIEVEMENT_LEVELS.IN_PROGRESS]: '진행 중',
  [ACHIEVEMENT_LEVELS.NEARLY_ACHIEVED]: '거의 달성',
  [ACHIEVEMENT_LEVELS.ACHIEVED]: '달성',
  [ACHIEVEMENT_LEVELS.MAINTAINED]: '유지됨',
  [ACHIEVEMENT_LEVELS.REGRESSED]: '후퇴',
} as const

// Intervention types that can be recommended
export const INTERVENTION_TYPES = {
  INDIVIDUAL_THERAPY: 'individual_therapy',
  GROUP_THERAPY: 'group_therapy',
  SKILLS_TRAINING: 'skills_training',
  BEHAVIORAL_INTERVENTION: 'behavioral_intervention',
  COGNITIVE_TRAINING: 'cognitive_training',
  SOCIAL_SKILLS_TRAINING: 'social_skills_training',
  VOCATIONAL_TRAINING: 'vocational_training',
  FAMILY_THERAPY: 'family_therapy',
  PEER_SUPPORT: 'peer_support',
  MEDICATION_MANAGEMENT: 'medication_management',
  CRISIS_PLANNING: 'crisis_planning',
  PSYCHOEDUCATION: 'psychoeducation',
} as const

export const INTERVENTION_TYPE_LABELS = {
  [INTERVENTION_TYPES.INDIVIDUAL_THERAPY]: '개별 치료',
  [INTERVENTION_TYPES.GROUP_THERAPY]: '집단 치료',
  [INTERVENTION_TYPES.SKILLS_TRAINING]: '기능 훈련',
  [INTERVENTION_TYPES.BEHAVIORAL_INTERVENTION]: '행동 개입',
  [INTERVENTION_TYPES.COGNITIVE_TRAINING]: '인지 훈련',
  [INTERVENTION_TYPES.SOCIAL_SKILLS_TRAINING]: '사회 기능 훈련',
  [INTERVENTION_TYPES.VOCATIONAL_TRAINING]: '직업 훈련',
  [INTERVENTION_TYPES.FAMILY_THERAPY]: '가족 치료',
  [INTERVENTION_TYPES.PEER_SUPPORT]: '동료 지원',
  [INTERVENTION_TYPES.MEDICATION_MANAGEMENT]: '약물 관리',
  [INTERVENTION_TYPES.CRISIS_PLANNING]: '위기 계획',
  [INTERVENTION_TYPES.PSYCHOEDUCATION]: '정신건강교육',
} as const

// Success indicators types
export const SUCCESS_INDICATOR_TYPES = {
  BEHAVIORAL: 'behavioral',
  COGNITIVE: 'cognitive',
  SOCIAL: 'social',
  FUNCTIONAL: 'functional',
  CLINICAL: 'clinical',
  SELF_REPORTED: 'self_reported',
} as const

export const SUCCESS_INDICATOR_TYPE_LABELS = {
  [SUCCESS_INDICATOR_TYPES.BEHAVIORAL]: '행동적 지표',
  [SUCCESS_INDICATOR_TYPES.COGNITIVE]: '인지적 지표',
  [SUCCESS_INDICATOR_TYPES.SOCIAL]: '사회적 지표',
  [SUCCESS_INDICATOR_TYPES.FUNCTIONAL]: '기능적 지표',
  [SUCCESS_INDICATOR_TYPES.CLINICAL]: '임상적 지표',
  [SUCCESS_INDICATOR_TYPES.SELF_REPORTED]: '자가보고 지표',
} as const

// Measurement frequencies for tracking
export const MEASUREMENT_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BI_WEEKLY: 'bi_weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  AS_NEEDED: 'as_needed',
} as const

export const MEASUREMENT_FREQUENCY_LABELS = {
  [MEASUREMENT_FREQUENCIES.DAILY]: '매일',
  [MEASUREMENT_FREQUENCIES.WEEKLY]: '매주',
  [MEASUREMENT_FREQUENCIES.BI_WEEKLY]: '격주',
  [MEASUREMENT_FREQUENCIES.MONTHLY]: '매월',
  [MEASUREMENT_FREQUENCIES.QUARTERLY]: '분기별',
  [MEASUREMENT_FREQUENCIES.AS_NEEDED]: '필요 시',
} as const

// AI recommendation confidence levels
export const CONFIDENCE_LEVELS = {
  VERY_LOW: 'very_low',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  VERY_HIGH: 'very_high',
} as const

export const CONFIDENCE_LEVEL_LABELS = {
  [CONFIDENCE_LEVELS.VERY_LOW]: '매우 낮음',
  [CONFIDENCE_LEVELS.LOW]: '낮음',
  [CONFIDENCE_LEVELS.MEDIUM]: '보통',
  [CONFIDENCE_LEVELS.HIGH]: '높음',
  [CONFIDENCE_LEVELS.VERY_HIGH]: '매우 높음',
} as const

// Time frame options for goals
export const TIME_FRAMES = {
  ONE_WEEK: 'one_week',
  TWO_WEEKS: 'two_weeks',
  ONE_MONTH: 'one_month',
  THREE_MONTHS: 'three_months',
  SIX_MONTHS: 'six_months',
  ONE_YEAR: 'one_year',
} as const

export const TIME_FRAME_LABELS = {
  [TIME_FRAMES.ONE_WEEK]: '1주',
  [TIME_FRAMES.TWO_WEEKS]: '2주',
  [TIME_FRAMES.ONE_MONTH]: '1개월',
  [TIME_FRAMES.THREE_MONTHS]: '3개월',
  [TIME_FRAMES.SIX_MONTHS]: '6개월',
  [TIME_FRAMES.ONE_YEAR]: '1년',
} as const

// Helper functions
export const getGoalCategoryLabel = (category: string) =>
  GOAL_CATEGORY_LABELS[category as keyof typeof GOAL_CATEGORY_LABELS] || category

export const getGoalPriorityLabel = (priority: string) =>
  GOAL_PRIORITY_LABELS[priority as keyof typeof GOAL_PRIORITY_LABELS] || priority

export const getAchievementLevelLabel = (level: string) =>
  ACHIEVEMENT_LEVEL_LABELS[level as keyof typeof ACHIEVEMENT_LEVEL_LABELS] || level

export const getInterventionTypeLabel = (type: string) =>
  INTERVENTION_TYPE_LABELS[type as keyof typeof INTERVENTION_TYPE_LABELS] || type

export const getSuccessIndicatorTypeLabel = (type: string) =>
  SUCCESS_INDICATOR_TYPE_LABELS[type as keyof typeof SUCCESS_INDICATOR_TYPE_LABELS] || type

export const getMeasurementFrequencyLabel = (frequency: string) =>
  MEASUREMENT_FREQUENCY_LABELS[frequency as keyof typeof MEASUREMENT_FREQUENCY_LABELS] || frequency

export const getConfidenceLevelLabel = (level: string) =>
  CONFIDENCE_LEVEL_LABELS[level as keyof typeof CONFIDENCE_LEVEL_LABELS] || level

export const getTimeFrameLabel = (timeFrame: string) =>
  TIME_FRAME_LABELS[timeFrame as keyof typeof TIME_FRAME_LABELS] || timeFrame

// Validation rules (updated for structured data from n8n)
export const AI_RECOMMENDATION_VALIDATION = {
  patient_analysis: {
    required: ['strengths', 'challenges', 'risk_factors', 'protective_factors'],
    maxLength: 5000,
  },
  recommendations: {
    minPlans: 1,
    maxPlans: 5,
    requiredFields: ['plan_number', 'title', 'purpose', 'sixMonthGoal', 'monthlyGoals', 'weeklyPlans'],
  },
  monthlyGoals: {
    requiredMonths: 6,
    requiredFields: ['month', 'goal'],
  },
  weeklyPlans: {
    weeksPerMonth: 4,
    requiredFields: ['week', 'month', 'plan'],
  },
  success_indicators: {
    minIndicators: 3,
    maxIndicators: 15,
    requiredFields: ['id', 'type', 'description', 'measurement_method', 'frequency'],
  },
  // Legacy validation rules (deprecated but kept for backward compatibility)
  six_month_goals: {
    minGoals: 1,
    maxGoals: 8,
    requiredFields: ['id', 'title', 'category', 'priority', 'description'],
    deprecated: true,
  },
  monthly_plans: {
    requiredMonths: 6,
    requiredFields: ['month', 'goals', 'interventions', 'milestones'],
    deprecated: true,
  },
  weekly_plans: {
    weeksPerMonth: 4,
    requiredFields: ['week', 'objectives', 'activities', 'measurements'],
    deprecated: true,
  },
} as const

// Default structures for AI recommendations (updated for structured data)
export const DEFAULT_PATIENT_ANALYSIS = {
  strengths: [],
  challenges: [],
  risk_factors: [],
  protective_factors: [],
  current_functioning_level: 'medium',
  motivation_level: 'medium',
  support_system_quality: 'medium',
  insights: '',
} as const

// New structured recommendation format
export const DEFAULT_RECOMMENDATION_PLAN = {
  plan_number: 1,
  title: '',
  purpose: '',
  sixMonthGoal: '',
  monthlyGoals: [],
  weeklyPlans: [],
} as const

export const DEFAULT_MONTHLY_GOAL = {
  month: 1,
  goal: '',
} as const

export const DEFAULT_WEEKLY_PLAN = {
  week: 1,
  month: 1,
  plan: '',
} as const

// Legacy default structures (deprecated but kept for backward compatibility)
export const DEFAULT_GOAL_STRUCTURE = {
  id: '',
  title: '',
  category: GOAL_CATEGORIES.SOCIAL_FUNCTIONING,
  priority: GOAL_PRIORITIES.MEDIUM,
  description: '',
  target_outcome: '',
  time_frame: TIME_FRAMES.SIX_MONTHS,
  interventions: [],
  success_criteria: [],
  potential_barriers: [],
  adaptation_strategies: [],
  deprecated: true,
} as const

export const DEFAULT_SUCCESS_INDICATOR = {
  id: '',
  type: SUCCESS_INDICATOR_TYPES.BEHAVIORAL,
  description: '',
  measurement_method: '',
  frequency: MEASUREMENT_FREQUENCIES.WEEKLY,
  target_value: '',
  baseline_value: '',
  tracking_notes: '',
} as const 