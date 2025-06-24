// 목표 설정 페이지에서 사용하는 상수들

export const STEPS = [
  { id: 1, title: '환자 선택', completed: false },
  { id: 2, title: '평가 수행', completed: false },
  { id: 3, title: 'AI 분석', completed: false },
  { id: 4, title: '목표 추천', completed: false },
  { id: 5, title: '완료', completed: false }
];

export const FOCUS_TIME_OPTIONS = [
  { value: '5min', label: '5분 정도' },
  { value: '15min', label: '15분 정도' },
  { value: '30min', label: '30분 정도' },
  { value: '1hour', label: '1시간 이상' },
];

export const PAST_SUCCESS_OPTIONS = [
  { value: 'cooking', label: '요리/베이킹' },
  { value: 'exercise', label: '운동/산책' },
  { value: 'reading', label: '독서/공부' },
  { value: 'crafting', label: '만들기/그리기' },
  { value: 'socializing', label: '사람 만나기/대화' },
  { value: 'entertainment', label: '음악/영화 감상' },
  { value: 'organizing', label: '정리/청소' },
  { value: 'none', label: '특별히 없음' }
];

export const CONSTRAINT_OPTIONS = [
  { value: 'transport', label: '교통편 문제 (대중교통 이용 어려움)' },
  { value: 'financial', label: '경제적 부담 (비용 지출 어려움)' },
  { value: 'time', label: '시간 제약 (다른 일정으로 바쁨)' },
  { value: 'physical', label: '신체적 제약 (거동 불편, 체력 부족)' },
  { value: 'family', label: '가족 반대 (가족이 활동 반대)' },
  { value: 'none', label: '별다른 제약 없음' }
];

export const SOCIAL_PREFERENCE_OPTIONS = [
  { value: 'alone', label: '혼자 하는 게 훨씬 편함' },
  { value: 'close_family', label: '가족이나 아주 가까운 사람과만 괜찮음' },
  { value: 'small_group', label: '소수의 사람들과는 괜찮음 (2-3명)' },
  { value: 'medium_group', label: '어느 정도 사람들과도 괜찮음 (5-10명)' },
  { value: 'large_group', label: '많은 사람과도 괜찮음 (10명 이상)' }
];

export const MAX_POLLING_ATTEMPTS = 15;
export const POLLING_INTERVAL = 5000; // 5초

// 매핑 객체들
export const PAST_SUCCESS_MAPPING: Record<string, string> = {
  'cooking': '요리/베이킹',
  'exercise': '운동/산책',
  'reading': '독서/공부',
  'crafting': '만들기/그리기',
  'socializing': '사람 만나기/대화',
  'entertainment': '음악/영화 감상',
  'organizing': '정리/청소',
  'none': '특별히 없음'
};

export const CONSTRAINT_MAPPING: Record<string, string> = {
  'transport': '교통편 문제 (대중교통 이용 어려움)',
  'financial': '경제적 부담 (비용 지출 어려움)',
  'time': '시간 제약 (다른 일정으로 바쁨)',
  'physical': '신체적 제약 (거동 불편, 체력 부족)',
  'family': '가족 반대 (가족이 활동 반대)',
  'none': '별다른 제약 없음'
};

// 메시지 상수
export const MESSAGES = {
  processing: '처리 중...',
  error: {
    default: '오류가 발생했습니다. 다시 시도해주세요.',
    auth: '권한 확인을 위해 재로그인 중입니다...',
    noGoalSelected: '목표를 선택해주세요.',
    noPatient: '환자를 선택해주세요.',
    saveGoal: '목표 저장 중 오류가 발생했습니다:',
    aiRecommendationFailed: 'AI 추천 처리 중 오류가 발생했습니다.',
    aiRecommendationTimeout: 'AI 추천 처리가 예상보다 오래 걸리고 있습니다. n8n에서 여러 번 재시도했지만 적절한 결과를 얻지 못했습니다. 잠시 후 다시 시도해주세요.',
    aiRequestFailed: 'AI 추천 요청에 실패했습니다. 다시 시도해주세요.',
    missingData: '필요한 데이터가 없습니다.',
    deleteGoalsFailed: '기존 목표 삭제 중 오류',
    updatePatientFailed: '환자 정보 업데이트 중 오류',
    goalSaveFailed: (error: string) => `목표 저장 중 오류가 발생했습니다:\n${error}`,
    deactivateRecommendationFailed: '이전 AI 추천 비활성화 중 오류'
  },
  success: {
    assessmentSaved: '평가가 성공적으로 저장되었습니다.',
    aiRecommendationReceived: 'AI 추천이 완료되었습니다.',
    goalsSaved: '목표가 성공적으로 저장되었습니다.'
  },
  info: {
    autoLoginAttempt: '🔍 자동 로그인 체크 시작...',
    noSession: '🔐 세션이 없음. 개발용 admin 자동 로그인 시도...',
    loginSuccess: '✅ 개발용 admin 자동 로그인 성공!',
    alreadyLoggedIn: '✅ 이미 로그인된 상태입니다.',
    forceLoginSuccess: '✅ 강제 로그인 성공!'
  },
  confirm: {
    saveGoals: '선택한 계획으로 목표를 저장하시겠습니까?'
  }
};

// 스타일 관련 상수
export const STYLES = {
  button: {
    primary: 'px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors',
    secondary: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors',
    disabled: 'px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed'
  },
  card: {
    base: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
    hover: 'hover:shadow-md transition-shadow cursor-pointer',
    selected: 'ring-2 ring-blue-500 ring-offset-2'
  }
};
