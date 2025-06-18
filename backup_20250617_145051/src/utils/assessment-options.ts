// Assessment options and related constants
// These match the data in the assessment_options table

export interface AssessmentOption {
  id: string
  option_type: string
  option_value: string
  option_label: string
  option_order: number
}

// Focus time options
export const FOCUS_TIME_OPTIONS = [
  { value: '5min', label: '5분 정도', order: 1 },
  { value: '15min', label: '15분 정도', order: 2 },
  { value: '30min', label: '30분 정도', order: 3 },
  { value: '1hour', label: '1시간 이상', order: 4 },
] as const

// Social preference options
export const SOCIAL_PREFERENCE_OPTIONS = [
  { value: 'individual', label: '혼자 하는 게 편함', order: 1 },
  { value: 'small_group', label: '소수의 사람들과는 괜찮음 (2-3명)', order: 2 },
  { value: 'large_group', label: '많은 사람과도 괜찮음 (10명 이상)', order: 3 },
] as const

// Past success options
export const PAST_SUCCESS_OPTIONS = [
  { value: 'crafting', label: '만들기/그리기', order: 1 },
  { value: 'sports', label: '운동/산책', order: 2 },
  { value: 'cooking', label: '요리/베이킹', order: 3 },
  { value: 'reading', label: '독서/학습', order: 4 },
  { value: 'music', label: '음악 감상', order: 5 },
  { value: 'social', label: '사람들과 대화', order: 6 },
] as const

// Constraint options
export const CONSTRAINT_OPTIONS = [
  { value: 'financial', label: '재정적 제약', order: 1 },
  { value: 'transportation', label: '교통편 제약', order: 2 },
  { value: 'physical', label: '신체적 제약', order: 3 },
  { value: 'time', label: '시간 제약', order: 4 },
  { value: 'family', label: '가족 반대', order: 5 },
  { value: 'confidence', label: '자신감 부족', order: 6 },
] as const

// Motivation level scale (1-10)
export const MOTIVATION_LEVELS = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}점`,
  description: i === 0 ? '매우 낮음' : 
               i === 4 ? '보통' : 
               i === 9 ? '매우 높음' : ''
}))

// Assessment form validation
export const ASSESSMENT_VALIDATION = {
  motivation_level: { min: 1, max: 10 },
  focus_time: FOCUS_TIME_OPTIONS.map(opt => opt.value),
  social_preference: SOCIAL_PREFERENCE_OPTIONS.map(opt => opt.value),
  past_successes: PAST_SUCCESS_OPTIONS.map(opt => opt.value),
  constraints: CONSTRAINT_OPTIONS.map(opt => opt.value),
} as const

// Helper functions
export const getFocusTimeLabel = (value: string) => 
  FOCUS_TIME_OPTIONS.find(opt => opt.value === value)?.label || value

export const getSocialPreferenceLabel = (value: string) => 
  SOCIAL_PREFERENCE_OPTIONS.find(opt => opt.value === value)?.label || value

export const getPastSuccessLabel = (value: string) => 
  PAST_SUCCESS_OPTIONS.find(opt => opt.value === value)?.label || value

export const getConstraintLabel = (value: string) => 
  CONSTRAINT_OPTIONS.find(opt => opt.value === value)?.label || value

export const getMotivationDescription = (level: number) => {
  if (level <= 2) return '매우 낮음'
  if (level <= 4) return '낮음'
  if (level <= 6) return '보통'
  if (level <= 8) return '높음'
  return '매우 높음'
} 