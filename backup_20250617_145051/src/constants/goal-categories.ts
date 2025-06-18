import { GoalCategory } from '@/types/goals'

// 기본 목표 카테고리 상수
export const DEFAULT_GOAL_CATEGORIES: Omit<GoalCategory, 'id'>[] = [
  {
    name: '정신건강 관리',
    description: '스트레스 관리, 감정 조절, 정신적 안정성 향상을 위한 목표',
    icon: 'brain',
    color: '#8B5CF6', // purple-500
  },
  {
    name: '사회적 관계',
    description: '대인관계 개선, 사회적 기술 향상, 커뮤니티 참여 목표',
    icon: 'users',
    color: '#10B981', // emerald-500
  },
  {
    name: '일상생활 기능',
    description: '자립생활 기술, 일상 루틴 관리, 생활 기능 향상 목표',
    icon: 'home',
    color: '#3B82F6', // blue-500
  },
  {
    name: '직업재활',
    description: '취업 준비, 직업 기술 향상, 직장 적응을 위한 목표',
    icon: 'briefcase',
    color: '#F59E0B', // amber-500
  },
  {
    name: '교육 및 학습',
    description: '지식 습득, 기술 개발, 교육 프로그램 참여 목표',
    icon: 'book-open',
    color: '#EF4444', // red-500
  },
  {
    name: '신체건강',
    description: '신체활동, 건강관리, 운동 및 체력 향상 목표',
    icon: 'heart',
    color: '#EC4899', // pink-500
  },
  {
    name: '여가활동',
    description: '취미활동, 레크리에이션, 문화예술 참여 목표',
    icon: 'palette',
    color: '#14B8A6', // teal-500
  },
  {
    name: '주거 안정',
    description: '주거환경 개선, 주택 확보, 생활환경 정비 목표',
    icon: 'house',
    color: '#84CC16', // lime-500
  },
]

// 목표 태그 카테고리
export const GOAL_TAG_CATEGORIES = {
  DIFFICULTY: 'difficulty',
  DURATION: 'duration',
  SUPPORT: 'support',
  PRIORITY: 'priority',
  METHOD: 'method',
  RESOURCE: 'resource',
} as const

// 난이도 태그
export const DIFFICULTY_TAGS = [
  { id: 'easy', label: '쉬움', color: '#10B981', category: GOAL_TAG_CATEGORIES.DIFFICULTY },
  { id: 'medium', label: '보통', color: '#F59E0B', category: GOAL_TAG_CATEGORIES.DIFFICULTY },
  { id: 'hard', label: '어려움', color: '#EF4444', category: GOAL_TAG_CATEGORIES.DIFFICULTY },
  { id: 'challenging', label: '도전적', color: '#8B5CF6', category: GOAL_TAG_CATEGORIES.DIFFICULTY },
] as const

// 기간 태그
export const DURATION_TAGS = [
  { id: 'short-term', label: '단기', color: '#06B6D4', category: GOAL_TAG_CATEGORIES.DURATION },
  { id: 'medium-term', label: '중기', color: '#3B82F6', category: GOAL_TAG_CATEGORIES.DURATION },
  { id: 'long-term', label: '장기', color: '#6366F1', category: GOAL_TAG_CATEGORIES.DURATION },
  { id: 'ongoing', label: '지속적', color: '#8B5CF6', category: GOAL_TAG_CATEGORIES.DURATION },
] as const

// 지원 수준 태그
export const SUPPORT_TAGS = [
  { id: 'independent', label: '독립적', color: '#10B981', category: GOAL_TAG_CATEGORIES.SUPPORT },
  { id: 'minimal-support', label: '최소 지원', color: '#84CC16', category: GOAL_TAG_CATEGORIES.SUPPORT },
  { id: 'moderate-support', label: '중간 지원', color: '#F59E0B', category: GOAL_TAG_CATEGORIES.SUPPORT },
  { id: 'intensive-support', label: '집중 지원', color: '#EF4444', category: GOAL_TAG_CATEGORIES.SUPPORT },
] as const

// 방법론 태그
export const METHOD_TAGS = [
  { id: 'individual', label: '개별 활동', color: '#3B82F6', category: GOAL_TAG_CATEGORIES.METHOD },
  { id: 'group', label: '그룹 활동', color: '#10B981', category: GOAL_TAG_CATEGORIES.METHOD },
  { id: 'family', label: '가족 참여', color: '#EC4899', category: GOAL_TAG_CATEGORIES.METHOD },
  { id: 'peer', label: '동료 지원', color: '#14B8A6', category: GOAL_TAG_CATEGORIES.METHOD },
  { id: 'professional', label: '전문가 개입', color: '#8B5CF6', category: GOAL_TAG_CATEGORIES.METHOD },
  { id: 'technology', label: '기술 활용', color: '#6366F1', category: GOAL_TAG_CATEGORIES.METHOD },
] as const

// 리소스 태그
export const RESOURCE_TAGS = [
  { id: 'internal', label: '내부 자원', color: '#10B981', category: GOAL_TAG_CATEGORIES.RESOURCE },
  { id: 'external', label: '외부 자원', color: '#3B82F6', category: GOAL_TAG_CATEGORIES.RESOURCE },
  { id: 'community', label: '지역사회', color: '#F59E0B', category: GOAL_TAG_CATEGORIES.RESOURCE },
  { id: 'government', label: '정부 지원', color: '#EF4444', category: GOAL_TAG_CATEGORIES.RESOURCE },
  { id: 'private', label: '민간 기관', color: '#8B5CF6', category: GOAL_TAG_CATEGORIES.RESOURCE },
] as const

// 모든 태그 통합
export const ALL_GOAL_TAGS = [
  ...DIFFICULTY_TAGS,
  ...DURATION_TAGS,
  ...SUPPORT_TAGS,
  ...METHOD_TAGS,
  ...RESOURCE_TAGS,
]

// 태그 카테고리별 색상 매핑
export const TAG_CATEGORY_COLORS = {
  [GOAL_TAG_CATEGORIES.DIFFICULTY]: '#8B5CF6',
  [GOAL_TAG_CATEGORIES.DURATION]: '#3B82F6',
  [GOAL_TAG_CATEGORIES.SUPPORT]: '#10B981',
  [GOAL_TAG_CATEGORIES.PRIORITY]: '#EF4444',
  [GOAL_TAG_CATEGORIES.METHOD]: '#14B8A6',
  [GOAL_TAG_CATEGORIES.RESOURCE]: '#F59E0B',
} as const

// 카테고리 아이콘 매핑
export const CATEGORY_ICONS = {
  'brain': '🧠',
  'users': '👥',
  'home': '🏠',
  'briefcase': '💼',
  'book-open': '📖',
  'heart': '❤️',
  'palette': '🎨',
  'house': '🏡',
} as const

// 목표 상태별 색상
export const GOAL_STATUS_COLORS = {
  pending: '#6B7280',    // gray-500
  active: '#3B82F6',     // blue-500
  completed: '#10B981',  // emerald-500
  on_hold: '#F59E0B',    // amber-500
  cancelled: '#EF4444',  // red-500
} as const

// 우선순위별 색상
export const GOAL_PRIORITY_COLORS = {
  high: '#EF4444',    // red-500
  medium: '#F59E0B',  // amber-500
  low: '#10B981',     // emerald-500
} as const

// 목표 유형별 색상
export const GOAL_TYPE_COLORS = {
  six_month: '#8B5CF6',  // purple-500
  monthly: '#3B82F6',    // blue-500
  weekly: '#10B981',     // emerald-500
} as const

// 카테고리 필터 옵션
export const CATEGORY_FILTER_OPTIONS = [
  { value: 'all', label: '전체 카테고리' },
  { value: 'mental_health', label: '정신건강 관리' },
  { value: 'social', label: '사회적 관계' },
  { value: 'daily_living', label: '일상생활 기능' },
  { value: 'vocational', label: '직업재활' },
  { value: 'education', label: '교육 및 학습' },
  { value: 'physical_health', label: '신체건강' },
  { value: 'leisure', label: '여가활동' },
  { value: 'housing', label: '주거 안정' },
]

// 태그 검색을 위한 유틸리티 함수
export function getTagById(tagId: string) {
  return ALL_GOAL_TAGS.find(tag => tag.id === tagId)
}

export function getTagsByCategory(category: string) {
  return ALL_GOAL_TAGS.filter(tag => tag.category === category)
}

export function getCategoryIcon(iconName: string): string {
  return CATEGORY_ICONS[iconName as keyof typeof CATEGORY_ICONS] || '📋'
} 