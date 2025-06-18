// AI 추천 시스템 관련 타입 정의

// 집중 시간 평가 데이터
export interface ConcentrationTimeData {
  duration: number; // 분 단위
  focusTimeCategory: string; // '5min', '15min', '30min', '1hour'
  preferredEnvironment: 'quiet' | 'moderate' | 'noisy';
}

// 동기 수준 평가 데이터
export interface MotivationLevelData {
  overallLevel: number; // 1-10 전체 동기 수준
  intrinsicMotivation: number; // 1-5 내재적 동기
  externalInfluence: number; // 1-5 외재적 영향
  goalOrientation: number; // 1-5 목표 지향성
  selfEfficacy: number; // 1-5 자기 효능감
}

// 과거 성공 경험 데이터
export interface PastSuccessesData {
  categories: string[]; // 성공 카테고리 목록
  keyFactors: string[]; // 핵심 성공 요인들
  otherDetails: string; // 기타 상세 내용
}

// 제약 조건 데이터
export interface ConstraintsData {
  primaryConstraints: string[]; // 주요 제약 조건들
  severityRating: number; // 1-5 심각도 등급
  otherDetails: string; // 기타 상세 내용
}

// 사회적 선호 데이터
export interface SocialPreferenceData {
  preferenceType: 'individual' | 'small_group' | 'large_group';
  groupSizePreference: 'individual' | 'small' | 'large';
  interactionStyle: 'independent' | 'collaborative' | 'leader' | 'supporter';
}

// 환자 정보 (AI 분석용)
export interface PatientInfoForAI {
  age?: number | null;
  gender?: string | null;
  diagnosis?: string | null;
  medicalHistory?: string | null;
}

// 평가 데이터 (AI 분석용)
export interface AssessmentDataForAI {
  concentrationTime: ConcentrationTimeData;
  motivationLevel: MotivationLevelData;
  pastSuccesses: PastSuccessesData;
  constraints: ConstraintsData;
  socialPreference: SocialPreferenceData;
}

// 컨텍스트 정보
export interface ContextInfo {
  assessmentDate: string;
  assessorId: string;
  notes: string;
  previousAssessments: number;
  urgencyLevel: 'low' | 'medium' | 'high';
}

// AI 분석을 위한 완전한 데이터 구조
export interface AIAnalysisPayload {
  assessmentId: string;
  patientId: string;
  patientInfo: PatientInfoForAI;
  assessmentData: AssessmentDataForAI;
  contextInfo: ContextInfo;
  callbackUrl: string;
}

// 주간 계획 데이터
export interface WeeklyPlan {
  week: string | number; // 주차 (1, 2, 3, 4 또는 "1주차")
  month?: number; // 해당 월
  plan?: string; // 주간 계획 설명
  tasks?: string[]; // 주간 과제 목록
}

// 월간 계획 데이터
export interface MonthlyPlan {
  month: number | string; // 월차 (1, 2, 3, 4, 5, 6)
  goal?: string; // 월간 목표
  activities?: string[]; // 월간 활동 목록
  weeklyPlans?: WeeklyPlan[]; // 하위 주간 계획들
}

// 6개월 목표 데이터
export interface SixMonthGoalData {
  goal?: string; // 6개월 목표 설명
  monthlyPlans?: MonthlyPlan[]; // 월간 계획들
}

// AI 추천 목표 (단일 목표)
export interface AIRecommendationGoal {
  title: string; // 목표 제목
  purpose?: string; // 목표 목적
  plan_number?: number; // 계획 번호
  sixMonthGoal?: string; // 6개월 목표 설명
  sixMonthGoals?: SixMonthGoalData[]; // 6개월 목표 데이터 배열
  monthlyGoals?: MonthlyPlan[]; // 월간 목표들
  weeklyPlans?: WeeklyPlan[]; // 주간 계획들
  description?: string; // 목표 설명
  coreStrategy?: string; // 핵심 전략
}

// AI 추천 응답 구조
export interface AIRecommendationsResponse {
  goals?: AIRecommendationGoal[]; // 추천 목표 목록 (3개)
  reasoning?: string; // AI 추천 근거
  patient_analysis?: {
    insights?: string; // 환자 분석 인사이트
  };
}

// 목표 상세 계획 옵션
export interface GoalDetailOption {
  plan_id?: string; // 계획 ID
  title: string; // 옵션 제목
  description: string; // 옵션 설명
  sixMonthGoals?: SixMonthGoalData[]; // 6개월 목표 데이터
}

// 목표 상세 계획 응답
export interface DetailedGoalsResponse {
  selectedIndex?: number; // 선택된 목표 인덱스
  sixMonthGoal: AIRecommendationGoal; // 선택된 6개월 목표
  monthlyGoals: MonthlyPlan[]; // 월간 목표들
  weeklyGoals: WeeklyPlan[]; // 주간 목표들
  options?: GoalDetailOption[]; // 계획 옵션들
}

// 환자 기본 정보
export interface PatientBasicInfo {
  id: string;
  patient_identifier: string;
  full_name: string;
  birth_date: string;
  gender: string;
  diagnosis: string;
  primary_social_worker_id: string;
  status: string;
  age?: number;
}

// 데이터베이스의 AI 추천 레코드
export interface AIRecommendationRecord {
  id: string;
  patient_id: string;
  assessment_id?: string;
  recommendation_date: string;
  patient_analysis: Record<string, unknown>;
  assessment_data?: Record<string, unknown>;
  recommendations?: AIRecommendationGoal[];
  n8n_processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  n8n_processed_at?: string;
  n8n_error?: string;
  selected_plan_number?: number;
  goals_created_at?: string;
  is_active: boolean;
  applied_at?: string;
  applied_by?: string;
  created_at: string;
  updated_at: string;
}

// API 응답 타입들
export interface AIRecommendationApiResponse {
  success: boolean;
  message: string;
  data?: {
    assessmentId: string;
    patientId: string;
    status: string;
    n8nResponse?: unknown;
  };
  error?: string;
  details?: string;
}

// AI 추천 상태 확인 응답
export interface AIRecommendationStatusResponse {
  assessmentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processingStarted?: string;
  errorMessage?: string;
  recommendationId?: string;
}

// 평가 데이터 (데이터베이스에서 조회용)
export interface AssessmentRecord {
  id: string;
  patient_id: string;
  focus_time: string;
  motivation_level: number;
  past_successes: string[];
  constraints: string[];
  social_preference: string;
  notes?: string;
  ai_recommendation_status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_processing_started_at?: string;
  ai_error_message?: string;
  ai_recommendation_id?: string;
  assessed_by: string;
  created_at: string;
  updated_at: string;
  patient?: PatientBasicInfo;
}

// n8n 웹훅 완료 데이터
export interface N8nWebhookCompletionData {
  status: 'completed' | 'failed';
  assessmentId: string;
  recommendationId?: string;
  error?: string;
}

// 평가에서 AI 분석용으로 변환하는 함수의 반환 타입
export interface TransformedAssessmentData extends AIAnalysisPayload {
  // AIAnalysisPayload를 확장하여 추가 필드가 있을 경우 여기에 정의
}

// 목표 저장을 위한 데이터 구조
export interface GoalSaveData {
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
  priority?: 'high' | 'medium' | 'low';
  is_ai_suggested: boolean;
  is_from_ai_recommendation: boolean;
  source_recommendation_id?: string;
  created_by_social_worker_id: string;
}

// 에러 타입들
export interface AIRecommendationError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
}

// 유틸리티 타입들
export type ViewMode = 'monthly' | 'weekly';
export type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';