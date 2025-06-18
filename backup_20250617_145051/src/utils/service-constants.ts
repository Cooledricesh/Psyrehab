// Service Records related constants

// Service types
export const SERVICE_TYPES = {
  INDIVIDUAL_COUNSELING: 'individual_counseling',
  GROUP_COUNSELING: 'group_counseling',
  SKILLS_TRAINING: 'skills_training',
  VOCATIONAL_TRAINING: 'vocational_training',
  SOCIAL_SUPPORT: 'social_support',
  CRISIS_INTERVENTION: 'crisis_intervention',
  ASSESSMENT: 'assessment',
  CASE_MANAGEMENT: 'case_management',
  FAMILY_COUNSELING: 'family_counseling',
  RECREATIONAL_THERAPY: 'recreational_therapy',
} as const

export const SERVICE_TYPE_LABELS = {
  [SERVICE_TYPES.INDIVIDUAL_COUNSELING]: '개별 상담',
  [SERVICE_TYPES.GROUP_COUNSELING]: '집단 상담',
  [SERVICE_TYPES.SKILLS_TRAINING]: '기능 훈련',
  [SERVICE_TYPES.VOCATIONAL_TRAINING]: '직업 훈련',
  [SERVICE_TYPES.SOCIAL_SUPPORT]: '사회적 지원',
  [SERVICE_TYPES.CRISIS_INTERVENTION]: '위기 개입',
  [SERVICE_TYPES.ASSESSMENT]: '평가',
  [SERVICE_TYPES.CASE_MANAGEMENT]: '사례 관리',
  [SERVICE_TYPES.FAMILY_COUNSELING]: '가족 상담',
  [SERVICE_TYPES.RECREATIONAL_THERAPY]: '여가 치료',
} as const

// Service categories
export const SERVICE_CATEGORIES = {
  COUNSELING: 'counseling',
  TRAINING: 'training',
  SUPPORT: 'support',
  ASSESSMENT: 'assessment',
  INTERVENTION: 'intervention',
  THERAPY: 'therapy',
} as const

export const SERVICE_CATEGORY_LABELS = {
  [SERVICE_CATEGORIES.COUNSELING]: '상담',
  [SERVICE_CATEGORIES.TRAINING]: '훈련',
  [SERVICE_CATEGORIES.SUPPORT]: '지원',
  [SERVICE_CATEGORIES.ASSESSMENT]: '평가',
  [SERVICE_CATEGORIES.INTERVENTION]: '개입',
  [SERVICE_CATEGORIES.THERAPY]: '치료',
} as const

// Service locations
export const SERVICE_LOCATIONS = [
  { value: 'center', label: '센터 내' },
  { value: 'home', label: '가정 방문' },
  { value: 'hospital', label: '병원' },
  { value: 'community', label: '지역사회' },
  { value: 'workplace', label: '직장' },
  { value: 'online', label: '온라인' },
  { value: 'phone', label: '전화' },
  { value: 'other', label: '기타' },
] as const

// Duration options (in minutes)
export const DURATION_OPTIONS = [
  { value: 30, label: '30분' },
  { value: 60, label: '1시간' },
  { value: 90, label: '1시간 30분' },
  { value: 120, label: '2시간' },
  { value: 180, label: '3시간' },
  { value: 240, label: '4시간' },
] as const

// Participants count options for group sessions
export const PARTICIPANTS_COUNT_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}명`,
}))

// Helper functions
export const getServiceTypeLabel = (serviceType: string) =>
  SERVICE_TYPE_LABELS[serviceType as keyof typeof SERVICE_TYPE_LABELS] || serviceType

export const getServiceCategoryLabel = (category: string) =>
  SERVICE_CATEGORY_LABELS[category as keyof typeof SERVICE_CATEGORY_LABELS] || category

export const getLocationLabel = (location: string) =>
  SERVICE_LOCATIONS.find(l => l.value === location)?.label || location

export const getDurationLabel = (minutes: number) => {
  if (minutes < 60) return `${minutes}분`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
}

// Service validation
export const SERVICE_VALIDATION = {
  service_type: Object.values(SERVICE_TYPES),
  service_category: Object.values(SERVICE_CATEGORIES),
  duration_minutes: { min: 15, max: 480 }, // 15분 ~ 8시간
  participants_count: { min: 1, max: 50 },
} as const

// Default values
export const DEFAULT_SERVICE_VALUES = {
  duration_minutes: 60,
  is_group_session: false,
  participants_count: 1,
  service_category: SERVICE_CATEGORIES.COUNSELING,
} as const 