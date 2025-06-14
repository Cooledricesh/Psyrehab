export const FOCUS_TIME_OPTIONS = [
  { value: '5min', label: '5분 정도' },
  { value: '15min', label: '15분 정도' },
  { value: '30min', label: '30분 정도' },
  { value: '1hour+', label: '1시간 이상' },
]

export const PAST_SUCCESS_OPTIONS = [
  { value: 'cooking', label: '요리/베이킹' },
  { value: 'exercise', label: '운동/산책' },
  { value: 'reading', label: '독서/공부' },
  { value: 'crafting', label: '만들기/그리기' },
  { value: 'socializing', label: '사람 만나기/대화' },
  { value: 'entertainment', label: '음악/영화 감상' },
  { value: 'organizing', label: '정리/청소' },
  { value: 'none', label: '특별히 없음' },
]

export const CONSTRAINT_OPTIONS = [
  { value: 'transport', label: '교통편 문제 (대중교통 이용 어려움)' },
  { value: 'financial', label: '경제적 부담 (비용 지출 어려움)' },
  { value: 'time', label: '시간 제약 (다른 일정으로 바쁨)' },
  { value: 'physical', label: '신체적 제약 (거동 불편, 체력 부족)' },
  { value: 'family', label: '가족 반대 (가족이 활동 반대)' },
  { value: 'none', label: '별다른 제약 없음' },
]

export const SOCIAL_PREFERENCE_OPTIONS = [
  { value: 'alone', label: '혼자 하는 게 훨씬 편함' },
  { value: 'close_family', label: '가족이나 아주 가까운 사람과만 괜찮음' },
  { value: 'small_group', label: '소수의 사람들과는 괜찮음 (2-3명)' },
  { value: 'medium_group', label: '어느 정도 사람들과도 괜찮음 (5-10명)' },
  { value: 'large_group', label: '많은 사람과도 괜찮음 (10명 이상)' },
]

export const POLLING_CONFIG = {
  maxAttempts: 20,
  intervalMs: 3000,
}

export const WEBHOOK_URL = 'https://baclava.uk/webhook/91396e70-644f-4e36-be02-5b8ae847e273'

export const getMotivationMessage = (level: number): string => {
  if (level <= 2) return '현재 상태 유지가 우선'
  if (level <= 4) return '작은 변화라면 시도해볼 만함'
  if (level <= 6) return '적당한 도전 가능'
  if (level <= 8) return '새로운 도전 원함'
  return '큰 변화도 감당할 준비됨'
}
