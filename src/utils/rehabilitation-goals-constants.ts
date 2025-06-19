
export const REHAB_GOAL_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled',
  DEFERRED: 'deferred',
} as const

export const REHAB_GOAL_STATUS_LABELS = {
  [REHAB_GOAL_STATUS.PENDING]: '대기 중',
  [REHAB_GOAL_STATUS.IN_PROGRESS]: '진행 중',
  [REHAB_GOAL_STATUS.COMPLETED]: '완료',
  [REHAB_GOAL_STATUS.ON_HOLD]: '보류',
  [REHAB_GOAL_STATUS.CANCELLED]: '취소',
  [REHAB_GOAL_STATUS.DEFERRED]: '연기',
} as const

export const REHAB_GOAL_TYPES = {
  LONG_TERM: 'long_term',
  SHORT_TERM: 'short_term',
  WEEKLY: 'weekly',
  DAILY: 'daily',
  MILESTONE: 'milestone',
  OTHER: 'other',
} as const

export const REHAB_GOAL_TYPE_LABELS = {
  [REHAB_GOAL_TYPES.LONG_TERM]: '장기 목표',
  [REHAB_GOAL_TYPES.SHORT_TERM]: '단기 목표',
  [REHAB_GOAL_TYPES.WEEKLY]: '주간 목표',
  [REHAB_GOAL_TYPES.DAILY]: '일일 목표',
  [REHAB_GOAL_TYPES.MILESTONE]: '마일스톤',
  [REHAB_GOAL_TYPES.OTHER]: '기타',
} as const

export const REHAB_GOAL_PRIORITIES = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  MINIMAL: 1,
} as const

export const REHAB_GOAL_PRIORITY_LABELS = {
  [REHAB_GOAL_PRIORITIES.CRITICAL]: '매우 높음',
  [REHAB_GOAL_PRIORITIES.HIGH]: '높음',
  [REHAB_GOAL_PRIORITIES.MEDIUM]: '보통',
  [REHAB_GOAL_PRIORITIES.LOW]: '낮음',
  [REHAB_GOAL_PRIORITIES.MINIMAL]: '최소',
} as const

export const REHAB_GOAL_CATEGORIES = {
  SOCIAL_SKILLS: 'social_skills',
  COGNITIVE_FUNCTION: 'cognitive_function',
  EMOTIONAL_REGULATION: 'emotional_regulation',
  INDEPENDENT_LIVING: 'independent_living',
  VOCATIONAL_SKILLS: 'vocational_skills',
  COMMUNICATION: 'communication',
  SELF_CARE: 'self_care',
  CRISIS_MANAGEMENT: 'crisis_management',
  MEDICATION_COMPLIANCE: 'medication_compliance',
  PHYSICAL_HEALTH: 'physical_health',
  FAMILY_RELATIONSHIPS: 'family_relationships',
  COMMUNITY_INTEGRATION: 'community_integration',
} as const

export const REHAB_GOAL_CATEGORY_LABELS = {
  [REHAB_GOAL_CATEGORIES.SOCIAL_SKILLS]: '사회적 기능',
  [REHAB_GOAL_CATEGORIES.COGNITIVE_FUNCTION]: '인지 기능',
  [REHAB_GOAL_CATEGORIES.EMOTIONAL_REGULATION]: '감정 조절',
  [REHAB_GOAL_CATEGORIES.INDEPENDENT_LIVING]: '독립 생활',
  [REHAB_GOAL_CATEGORIES.VOCATIONAL_SKILLS]: '직업 기능',
  [REHAB_GOAL_CATEGORIES.COMMUNICATION]: '의사소통',
  [REHAB_GOAL_CATEGORIES.SELF_CARE]: '자기 관리',
  [REHAB_GOAL_CATEGORIES.CRISIS_MANAGEMENT]: '위기 관리',
  [REHAB_GOAL_CATEGORIES.MEDICATION_COMPLIANCE]: '복약 순응',
  [REHAB_GOAL_CATEGORIES.PHYSICAL_HEALTH]: '신체 건강',
  [REHAB_GOAL_CATEGORIES.FAMILY_RELATIONSHIPS]: '가족 관계',
  [REHAB_GOAL_CATEGORIES.COMMUNITY_INTEGRATION]: '지역사회 통합',
} as const

export const COMPLETION_RATE_RANGES = {
  NOT_STARTED: { min: 0, max: 0, label: '시작 안함' },
  MINIMAL: { min: 1, max: 25, label: '최소 진행 (1-25%)' },
  PARTIAL: { min: 26, max: 50, label: '부분 달성 (26-50%)' },
  SUBSTANTIAL: { min: 51, max: 75, label: '상당 진행 (51-75%)' },
  NEAR_COMPLETE: { min: 76, max: 99, label: '거의 완료 (76-99%)' },
  COMPLETE: { min: 100, max: 100, label: '완료 (100%)' },
} as const

export const EVALUATION_CRITERIA_TYPES = {
  BEHAVIORAL_OBSERVATION: 'behavioral_observation',
  SELF_REPORT: 'self_report',
  STANDARDIZED_ASSESSMENT: 'standardized_assessment',
  FUNCTIONAL_PERFORMANCE: 'functional_performance',
  FREQUENCY_COUNT: 'frequency_count',
  DURATION_MEASUREMENT: 'duration_measurement',
  QUALITY_RATING: 'quality_rating',
  COMPLETION_CHECKLIST: 'completion_checklist',
} as const

export const EVALUATION_CRITERIA_TYPE_LABELS = {
  [EVALUATION_CRITERIA_TYPES.BEHAVIORAL_OBSERVATION]: '행동 관찰',
  [EVALUATION_CRITERIA_TYPES.SELF_REPORT]: '자가 보고',
  [EVALUATION_CRITERIA_TYPES.STANDARDIZED_ASSESSMENT]: '표준화 평가',
  [EVALUATION_CRITERIA_TYPES.FUNCTIONAL_PERFORMANCE]: '기능적 수행',
  [EVALUATION_CRITERIA_TYPES.FREQUENCY_COUNT]: '빈도 측정',
  [EVALUATION_CRITERIA_TYPES.DURATION_MEASUREMENT]: '지속시간 측정',
  [EVALUATION_CRITERIA_TYPES.QUALITY_RATING]: '품질 평가',
  [EVALUATION_CRITERIA_TYPES.COMPLETION_CHECKLIST]: '완료 체크리스트',
} as const

export const GOAL_DURATIONS = {
  ONE_WEEK: { weeks: 1, label: '1주' },
  TWO_WEEKS: { weeks: 2, label: '2주' },
  ONE_MONTH: { weeks: 4, label: '1개월' },
  TWO_MONTHS: { weeks: 8, label: '2개월' },
  THREE_MONTHS: { weeks: 12, label: '3개월' },
  SIX_MONTHS: { weeks: 24, label: '6개월' },
  ONE_YEAR: { weeks: 52, label: '1년' },
} as const

export const getRehabGoalStatusLabel = (status: string) =>
  REHAB_GOAL_STATUS_LABELS[status as keyof typeof REHAB_GOAL_STATUS_LABELS] || status

export const getRehabGoalTypeLabel = (type: string) =>
  REHAB_GOAL_TYPE_LABELS[type as keyof typeof REHAB_GOAL_TYPE_LABELS] || type

export const getRehabGoalPriorityLabel = (priority: number) =>
  REHAB_GOAL_PRIORITY_LABELS[priority as keyof typeof REHAB_GOAL_PRIORITY_LABELS] || `우선순위 ${priority}`

export const getRehabGoalCategoryLabel = (category: string) =>
  REHAB_GOAL_CATEGORY_LABELS[category as keyof typeof REHAB_GOAL_CATEGORY_LABELS] || category

export const getEvaluationCriteriaTypeLabel = (type: string) =>
  EVALUATION_CRITERIA_TYPE_LABELS[type as keyof typeof EVALUATION_CRITERIA_TYPE_LABELS] || type

export const getCompletionRateCategory = (rate: number) => {
  for (const [key, range] of Object.entries(COMPLETION_RATE_RANGES)) {
    if (rate >= range.min && rate <= range.max) {
      return { key, ...range }
    }
  }
  return { key: 'UNKNOWN', min: 0, max: 0, label: '알 수 없음' }
}

export const calculateGoalProgress = (startDate: string, endDate: string, currentDate?: string) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const current = currentDate ? new Date(currentDate) : new Date()
  
  const totalDuration = end.getTime() - start.getTime()
  const elapsedDuration = current.getTime() - start.getTime()
  
  if (elapsedDuration <= 0) return 0
  if (current >= end) return 100
  
  return Math.round((elapsedDuration / totalDuration) * 100)
}

export const getGoalUrgency = (priority: number, endDate: string, currentDate?: string) => {
  const current = currentDate ? new Date(currentDate) : new Date()
  const end = new Date(endDate)
  const daysUntilEnd = Math.ceil((end.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntilEnd < 0) return 'OVERDUE'
  if (priority >= 4 && daysUntilEnd <= 7) return 'URGENT'
  if (priority >= 3 && daysUntilEnd <= 14) return 'HIGH'
  if (daysUntilEnd <= 30) return 'MODERATE'
  return 'LOW'
}

export const getUrgencyLabel = (urgency: string) => {
  const labels = {
    OVERDUE: '기한 초과',
    URGENT: '긴급',
    HIGH: '높음',
    MODERATE: '보통',
    LOW: '낮음',
  }
  return labels[urgency as keyof typeof labels] || urgency
}

export const GOAL_VALIDATION = {
  title: {
    minLength: 5,
    maxLength: 200,
    required: true,
  },
  description: {
    maxLength: 1000,
    required: false,
  },
  priority: {
    min: 1,
    max: 5,
    default: 3,
  },
  target_completion_rate: {
    min: 0,
    max: 100,
    default: 100,
  },
  actual_completion_rate: {
    min: 0,
    max: 100,
    default: 0,
  },
  sequence_number: {
    min: 1,
    max: 1000,
  },
  week_number: {
    min: 1,
    max: 52,
  },
  month_number: {
    min: 1,
    max: 12,
  },
} as const

export const REHAB_DEFAULT_GOAL_STRUCTURE = {
  title: '',
  description: '',
  status: REHAB_GOAL_STATUS.PENDING,
  goal_type: REHAB_GOAL_TYPES.OTHER,
  priority: REHAB_GOAL_PRIORITIES.MEDIUM,
  target_completion_rate: 100,
  actual_completion_rate: 0,
  is_ai_suggested: false,
  is_from_ai_recommendation: false,
} as const

export const DEFAULT_EVALUATION_CRITERIA = {
  type: EVALUATION_CRITERIA_TYPES.BEHAVIORAL_OBSERVATION,
  description: '',
  measurement_method: '',
  frequency: 'weekly',
  target_value: '',
  notes: '',
} as const

export const REHAB_GOAL_HIERARCHY = {
  MAX_DEPTH: 3, // Long-term -> Short-term -> Weekly
  MAX_CHILDREN_PER_PARENT: 10,
  ALLOWED_PARENT_CHILD_TYPES: {
    [REHAB_GOAL_TYPES.LONG_TERM]: [REHAB_GOAL_TYPES.SHORT_TERM, REHAB_GOAL_TYPES.MILESTONE],
    [REHAB_GOAL_TYPES.SHORT_TERM]: [REHAB_GOAL_TYPES.WEEKLY, REHAB_GOAL_TYPES.DAILY],
    [REHAB_GOAL_TYPES.WEEKLY]: [REHAB_GOAL_TYPES.DAILY],
    [REHAB_GOAL_TYPES.MILESTONE]: [],
    [REHAB_GOAL_TYPES.DAILY]: [],
    [REHAB_GOAL_TYPES.OTHER]: [REHAB_GOAL_TYPES.OTHER],
  },
} as const 