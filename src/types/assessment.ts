// 평가 시스템 타입 정의

// 기본 평가 단계 타입
export type AssessmentStep = 
  | 'concentration_time'
  | 'motivation_level' 
  | 'past_successes'
  | 'constraints'
  | 'social_preference'

// 집중 시간 평가 옵션
export interface ConcentrationTimeOptions {
  duration: number // 분 단위
  environment: 'quiet' | 'moderate' | 'noisy'
  time_of_day: 'morning' | 'afternoon' | 'evening'
  notes?: string
}

// 동기 수준 평가 옵션
export interface MotivationLevelOptions {
  self_motivation: 1 | 2 | 3 | 4 | 5
  external_motivation: 1 | 2 | 3 | 4 | 5
  goal_clarity: 1 | 2 | 3 | 4 | 5
  confidence_level: 1 | 2 | 3 | 4 | 5
  notes?: string
}

// 과거 성공 경험 평가 옵션
export interface PastSuccessesOptions {
  academic_achievements: boolean
  work_experience: boolean
  social_achievements: boolean
  creative_accomplishments: boolean
  physical_achievements: boolean
  personal_growth: boolean
  descriptions: string[]
  most_significant?: string
  notes?: string
}

// 제약 조건 평가 옵션
export interface ConstraintsOptions {
  physical_limitations: string[]
  cognitive_challenges: string[]
  emotional_barriers: string[]
  social_obstacles: string[]
  environmental_factors: string[]
  financial_constraints: boolean
  time_limitations: string[]
  severity_rating: 1 | 2 | 3 | 4 | 5
  notes?: string
}

// 사회적 선호 평가 옵션
export interface SocialPreferenceOptions {
  group_size_preference: 'individual' | 'small_group' | 'large_group' | 'flexible'
  interaction_style: 'active_participant' | 'observer' | 'leader' | 'supporter'
  communication_preference: 'verbal' | 'written' | 'non_verbal' | 'mixed'
  support_type_needed: string[]
  comfort_with_strangers: 1 | 2 | 3 | 4 | 5
  collaboration_willingness: 1 | 2 | 3 | 4 | 5
  notes?: string
}

// 전체 평가 데이터 타입
export interface AssessmentData {
  id?: string
  patient_id: string
  assessor_id: string
  assessment_date: string
  concentration_time: ConcentrationTimeOptions
  motivation_level: MotivationLevelOptions
  past_successes: PastSuccessesOptions
  constraints: ConstraintsOptions
  social_preference: SocialPreferenceOptions
  overall_notes?: string
  status: 'draft' | 'completed' | 'reviewed'
  created_at?: string
  updated_at?: string
}

// 평가 결과 요약 타입
export interface AssessmentSummary {
  id: string
  patient_id: string
  patient_name: string
  assessment_date: string
  assessor_name: string
  overall_score: number
  strengths: string[]
  areas_for_improvement: string[]
  recommendations: string[]
  status: AssessmentData['status']
}

// 평가 비교 타입
export interface AssessmentComparison {
  current: AssessmentData
  previous?: AssessmentData
  changes: {
    step: AssessmentStep
    field: string
    previous_value: unknown
    current_value: unknown
    change_type: 'improvement' | 'decline' | 'stable'
  }[]
  overall_progress: 'improvement' | 'decline' | 'stable'
  progress_score: number
}

// 평가 통계 타입
export interface AssessmentStats {
  total_assessments: number
  completed_assessments: number
  average_scores: {
    concentration: number
    motivation: number
    social_comfort: number
  }
  progress_trend: 'improving' | 'declining' | 'stable'
  last_assessment_date?: string
}

// 평가 폼 설정 타입
export interface AssessmentFormConfig {
  step: AssessmentStep
  title: string
  description: string
  fields: AssessmentFieldConfig[]
  validation: AssessmentValidationConfig
}

export interface AssessmentFieldConfig {
  id: string
  type: 'text' | 'number' | 'textarea' | 'radio' | 'checkbox' | 'multiselect' | 'scale'
  label: string
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string; label: string; description?: string }>
  min?: number
  max?: number
  step?: number
  scaleLabels?: {
    min: string
    max: string
    steps?: string[]
  }
  condition?: {
    field: string
    operator: 'equals' | 'not_equals' | 'includes' | 'not_includes' | 'greater_than' | 'less_than'
    value: unknown
  }
  dependencies?: Array<{
    field: string
    affects: 'options' | 'validation' | 'visibility'
    mapping?: Record<string, unknown>
  }>
  validation?: {
    pattern?: string
    message?: string
    custom?: (value: unknown, formData: unknown) => string | null
  }
}

export interface AssessmentValidationConfig {
  required_fields: string[]
  conditional_logic?: {
    field: string
    condition: string
    action: 'show' | 'hide' | 'require'
    target: string[]
  }[]
}

export interface AssessmentListResponse {
  data: AssessmentSummary[]
  count: number
  page: number
  limit: number
  total_pages: number
}

export interface AssessmentDetailResponse {
  data: AssessmentData
}

export interface AssessmentCreateRequest {
  patient_id: string
  assessment_data: Omit<AssessmentData, 'id' | 'created_at' | 'updated_at'>
}

export interface AssessmentUpdateRequest {
  assessment_data: Partial<Omit<AssessmentData, 'id' | 'patient_id' | 'created_at'>>
}

// 필터 및 검색 타입
export interface AssessmentFilters {
  patient_id?: string
  assessor_id?: string
  date_from?: string
  date_to?: string
  status?: AssessmentData['status']
  search?: string
}

export interface AssessmentListParams {
  page?: number
  limit?: number
  sort_by?: 'assessment_date' | 'created_at' | 'patient_name' | 'status'
  sort_order?: 'asc' | 'desc'
  filters?: AssessmentFilters
}

// 시각화 데이터 타입
export interface AssessmentVisualizationData {
  patient_id: string
  timeline: {
    date: string
    scores: {
      concentration: number
      motivation: number
      social_comfort: number
      overall: number
    }
  }[]
  trends: {
    improving: string[]
    declining: string[]
    stable: string[]
  }
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    category: string
    description: string
    timeline: string
  }[]
}

export interface AssessmentHistory {
  id: string
  assessment_id: string
  version: number
  change_type: 'created' | 'updated' | 'status_changed' | 'completed' | 'reviewed'
  changed_by: string
  changed_at: string
  changes: AssessmentChangeDetails
  snapshot: Partial<AssessmentData>
  notes?: string
}

export interface AssessmentChangeDetails {
  field_changes: FieldChange[]
  status_change?: {
    from: AssessmentData['status']
    to: AssessmentData['status']
  }
  score_changes?: {
    concentration: ScoreChange
    motivation: ScoreChange
    social_comfort: ScoreChange
    overall: ScoreChange
  }
  completion_change?: {
    from: number
    to: number
  }
}

export interface FieldChange {
  field_path: string
  field_name: string
  old_value: unknown
  new_value: unknown
  change_type: 'added' | 'modified' | 'removed'
  impact_level: 'minor' | 'moderate' | 'significant'
}

export interface ScoreChange {
  from: number
  to: number
  difference: number
  percentage_change: number
  trend: 'improved' | 'declined' | 'stable'
}

export interface AssessmentTimeline {
  patient_id: string
  assessments: AssessmentTimelineEntry[]
  overall_progress: ProgressAnalysis
  milestones: AssessmentMilestone[]
  insights: ProgressInsight[]
}

export interface AssessmentTimelineEntry {
  assessment_id: string
  assessment_date: string
  version: number
  status: AssessmentData['status']
  scores: {
    concentration: number
    motivation: number
    social_comfort: number
    overall: number
  }
  completion_percentage: number
  key_changes: string[]
  notes?: string
}

export interface ProgressAnalysis {
  trend: 'improving' | 'stable' | 'declining' | 'mixed'
  trend_confidence: number // 0-1
  rate_of_change: number // scores per month
  consistency: number // 0-1, how consistent the progress is
  projected_outcomes: ProjectedOutcome[]
  risk_factors: RiskFactor[]
}

export interface ProjectedOutcome {
  timeframe: string // '1_month' | '3_months' | '6_months'
  predicted_score: number
  confidence_interval: [number, number]
  assumptions: string[]
}

export interface RiskFactor {
  factor: string
  severity: 'low' | 'moderate' | 'high'
  description: string
  recommendations: string[]
}

export interface AssessmentMilestone {
  id: string
  assessment_id: string
  milestone_type: 'improvement' | 'setback' | 'breakthrough' | 'plateau'
  date: string
  description: string
  significance: 'minor' | 'moderate' | 'major'
  impact_areas: string[]
  contributing_factors: string[]
}

export interface ProgressInsight {
  id: string
  insight_type: 'pattern' | 'correlation' | 'anomaly' | 'trend'
  title: string
  description: string
  confidence: number // 0-1
  supporting_data: unknown[]
  actionable_recommendations: string[]
  priority: 'low' | 'medium' | 'high'
}

export interface AssessmentHistoryParams {
  assessment_id?: string
  patient_id?: string
  date_from?: string
  date_to?: string
  change_types?: ('created' | 'updated' | 'status_changed' | 'completed' | 'reviewed')[]
  changed_by?: string
  include_snapshots?: boolean
  page?: number
  limit?: number
}

export interface AssessmentVersionInfo {
  assessment_id: string
  current_version: number
  total_versions: number
  created_at: string
  last_modified: string
  last_modified_by: string
  modification_count: number
  major_changes: number
  minor_changes: number
}

export interface CreateHistoryEntryRequest {
  assessment_id: string
  change_type: AssessmentHistory['change_type']
  changes: AssessmentChangeDetails
  snapshot: Partial<AssessmentData>
  notes?: string
}

export interface ProgressTrackingConfig {
  auto_track_changes: boolean
  track_score_thresholds: {
    minor_change: number // e.g., 0.5 points
    moderate_change: number // e.g., 1.0 points
    significant_change: number // e.g., 2.0 points
  }
  milestone_detection: {
    improvement_threshold: number
    setback_threshold: number
    plateau_duration_days: number
  }
  insight_generation: {
    min_assessments_for_trends: number
    correlation_threshold: number
    anomaly_detection_sensitivity: number
  }
}

export interface ProgressReport {
  patient_id: string
  report_period: {
    from: string
    to: string
  }
  summary: ProgressSummary
  detailed_analysis: DetailedProgressAnalysis
  recommendations: RecommendationSet
  charts_data: ProgressChartsData
}

export interface ProgressSummary {
  total_assessments: number
  completed_assessments: number
  average_completion_rate: number
  overall_progress_score: number
  key_improvements: string[]
  areas_of_concern: string[]
  next_recommended_actions: string[]
}

export interface DetailedProgressAnalysis {
  score_trends: {
    concentration: TrendAnalysis
    motivation: TrendAnalysis
    social_comfort: TrendAnalysis
    overall: TrendAnalysis
  }
  pattern_analysis: PatternAnalysis
  correlation_analysis: CorrelationAnalysis
  seasonal_effects: SeasonalEffect[]
}

export interface TrendAnalysis {
  direction: 'improving' | 'declining' | 'stable'
  slope: number
  r_squared: number
  significant_changes: SignificantChange[]
  predicted_trajectory: number[]
}

export interface PatternAnalysis {
  recurring_patterns: RecurringPattern[]
  cyclical_behavior: CyclicalBehavior[]
  response_patterns: ResponsePattern[]
}

export interface RecurringPattern {
  pattern_type: string
  frequency: string
  strength: number
  description: string
}

export interface CyclicalBehavior {
  cycle_type: 'weekly' | 'monthly' | 'seasonal'
  cycle_length: number
  amplitude: number
  description: string
}

export interface ResponsePattern {
  trigger: string
  typical_response: string
  response_strength: number
  consistency: number
}

export interface CorrelationAnalysis {
  strong_correlations: Correlation[]
  weak_correlations: Correlation[]
  potential_causations: PotentialCausation[]
}

export interface Correlation {
  factor_a: string
  factor_b: string
  correlation_coefficient: number
  significance: number
  description: string
}

export interface PotentialCausation {
  cause: string
  effect: string
  confidence: number
  supporting_evidence: string[]
}

export interface SeasonalEffect {
  season: string
  effect_type: 'positive' | 'negative' | 'neutral'
  magnitude: number
  affected_areas: string[]
  description: string
}

export interface SignificantChange {
  date: string
  change_magnitude: number
  change_direction: 'improvement' | 'decline'
  potential_causes: string[]
  impact_duration: string
}

export interface RecommendationSet {
  immediate_actions: Recommendation[]
  short_term_goals: Recommendation[]
  long_term_strategies: Recommendation[]
  risk_mitigation: Recommendation[]
}

export interface Recommendation {
  id: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  title: string
  description: string
  rationale: string
  expected_outcome: string
  timeline: string
  resources_needed: string[]
  success_metrics: string[]
}

export interface ProgressChartsData {
  score_timeline: TimelineDataPoint[]
  trend_lines: TrendLineData[]
  milestone_markers: MilestoneMarker[]
  comparison_benchmarks: BenchmarkData[]
  heatmap_data: HeatmapDataPoint[]
}

export interface TimelineDataPoint {
  date: string
  scores: {
    concentration: number
    motivation: number
    social_comfort: number
    overall: number
  }
  milestone?: string
  notes?: string
}

export interface TrendLineData {
  metric: string
  data_points: { date: string; value: number; predicted?: boolean }[]
  trend_equation: string
  confidence_bounds?: { upper: number[]; lower: number[] }
}

export interface MilestoneMarker {
  date: string
  type: 'improvement' | 'setback' | 'breakthrough' | 'plateau'
  description: string
  significance: number
}

export interface BenchmarkData {
  benchmark_type: 'population_average' | 'age_group' | 'condition_specific'
  data_points: { date: string; value: number }[]
  description: string
}

export interface HeatmapDataPoint {
  date: string
  metric: string
  value: number
  normalized_value: number // 0-1 scale for heatmap coloring
}

// 평가 카테고리 타입
export interface AssessmentCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string; // 하위 카테고리를 위한 부모 ID
  level: number; // 카테고리 레벨 (0: 최상위, 1: 2단계 등)
  order: number; // 정렬 순서
  isActive: boolean;
  color?: string; // 카테고리 색상
  icon?: string; // 아이콘 이름
  createdAt: string;
  updatedAt: string;
  children?: AssessmentCategory[]; // 하위 카테고리들
}

// 평가 옵션 타입
export interface AssessmentOption {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  type: AssessmentType;
  isRequired: boolean;
  isActive: boolean;
  order: number;
  
  // 구성 옵션들
  config: AssessmentConfig;
  
  // 스코어링 설정
  scoring: ScoringConfig;
  
  // 메타데이터
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  
  // 사용 통계
  usageCount: number;
  lastUsed?: string;
}

// 평가 유형
export enum AssessmentType {
  MULTIPLE_CHOICE = 'multiple_choice',
  SINGLE_CHOICE = 'single_choice',
  SCALE = 'scale',
  TEXT = 'text',
  NUMERIC = 'numeric',
  BOOLEAN = 'boolean',
  DATE = 'date',
  TIME = 'time',
  FILE_UPLOAD = 'file_upload',
  SIGNATURE = 'signature',
  DRAWING = 'drawing',
  MATRIX = 'matrix', // 매트릭스 형태의 질문
  RANKING = 'ranking' // 순위 매기기
}

// 평가 설정
export interface AssessmentConfig {
  // 공통 설정
  instructions?: string;
  helpText?: string;
  placeholder?: string;
  
  // 선택형 질문 설정
  choices?: AssessmentChoice[];
  allowMultiple?: boolean;
  randomizeOrder?: boolean;
  
  // 스케일 설정
  scaleMin?: number;
  scaleMax?: number;
  scaleStep?: number;
  scaleLabels?: { [key: number]: string };
  
  // 텍스트 설정
  maxLength?: number;
  minLength?: number;
  pattern?: string; // 정규식 패턴
  
  // 숫자 설정
  numberMin?: number;
  numberMax?: number;
  decimalPlaces?: number;
  
  // 파일 업로드 설정
  allowedFileTypes?: string[];
  maxFileSize?: number; // MB 단위
  maxFiles?: number;
  
  // 매트릭스 설정
  matrixRows?: string[];
  matrixColumns?: string[];
  
  // 랭킹 설정
  rankingItems?: string[];
  maxRankings?: number;
  
  // 조건부 표시 설정
  conditionalLogic?: ConditionalLogic[];
}

// 선택지 타입
export interface AssessmentChoice {
  id: string;
  text: string;
  value: unknown;
  order: number;
  isExclusive?: boolean; // 이 선택지를 고르면 다른 것 선택 불가
  triggerSkip?: string[]; // 이 선택지를 고르면 건너뛸 질문들
  color?: string;
  icon?: string;
}

// 조건부 로직
export interface ConditionalLogic {
  condition: LogicCondition;
  action: LogicAction;
  targetQuestionIds?: string[];
}

export interface LogicCondition {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: unknown;
}

export interface LogicAction {
  type: 'show' | 'hide' | 'require' | 'skip' | 'jump';
  targetId?: string; // 점프할 질문이나 섹션 ID
}

// 스코어링 설정
export interface ScoringConfig {
  enabled: boolean;
  type: ScoringType;
  method: ScoringMethod;
  
  // 가중치 설정
  weight?: number;
  
  // 점수 매핑
  scoreMapping?: { [key: string]: number };
  
  // 범위별 해석
  interpretations?: ScoreInterpretation[];
  
  // 계산 공식 (고급 스코어링용)
  formula?: string;
}

// 스코어링 유형
export enum ScoringType {
  NONE = 'none',
  SIMPLE = 'simple', // 단순 점수
  WEIGHTED = 'weighted', // 가중치 적용
  PERCENTILE = 'percentile', // 백분율
  CUSTOM = 'custom' // 사용자 정의 공식
}

// 스코어링 방법
export enum ScoringMethod {
  SUM = 'sum', // 합계
  AVERAGE = 'average', // 평균
  MAX = 'max', // 최대값
  MIN = 'min', // 최소값
  COUNT = 'count', // 개수
  CUSTOM_FORMULA = 'custom_formula' // 사용자 정의 공식
}

// 점수 해석
export interface ScoreInterpretation {
  id: string;
  minScore: number;
  maxScore: number;
  label: string;
  description: string;
  color: string;
  severity?: 'low' | 'normal' | 'high' | 'critical';
  recommendations?: string[];
}

// 평가 템플릿
export interface AssessmentTemplate {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  
  // 템플릿 설정
  isPublic: boolean;
  isActive: boolean;
  version: number;
  
  // 구성 요소
  sections: AssessmentSection[];
  
  // 전체 스코어링 설정
  overallScoring?: ScoringConfig;
  
  // 완료 설정
  completionSettings: CompletionSettings;
  
  // 메타데이터
  estimatedDuration: number; // 분 단위
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  
  // 권한 설정
  permissions: TemplatePermissions;
  
  // 생성/수정 정보
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
  
  // 사용 통계
  usageCount: number;
  averageCompletionTime?: number;
  averageScore?: number;
}

// 평가 섹션
export interface AssessmentSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  questions: AssessmentQuestion[];
  
  // 섹션 설정
  isOptional?: boolean;
  timeLimit?: number; // 초 단위
  randomizeQuestions?: boolean;
  
  // 조건부 표시
  conditionalLogic?: ConditionalLogic[];
}

// 평가 질문
export interface AssessmentQuestion {
  id: string;
  sectionId: string;
  optionId: string; // AssessmentOption 참조
  order: number;
  
  // 질문별 개별 설정 (옵션 설정을 오버라이드)
  overrideConfig?: Partial<AssessmentConfig>;
  overrideScoring?: Partial<ScoringConfig>;
  
  // 질문별 조건부 로직
  conditionalLogic?: ConditionalLogic[];
}

// 완료 설정
export interface CompletionSettings {
  allowSaveProgress: boolean; // 진행상황 저장 허용
  allowResume: boolean; // 이어서 하기 허용
  showProgressBar: boolean; // 진행바 표시
  shuffleSections: boolean; // 섹션 순서 섞기
  requireAllSections: boolean; // 모든 섹션 필수
  showResults: boolean; // 결과 즉시 표시
  allowRetake: boolean; // 재응답 허용
  retakeLimit?: number; // 재응답 제한 횟수
  retakeCooldown?: number; // 재응답 대기 시간(시간 단위)
}

// 템플릿 권한
export interface TemplatePermissions {
  canView: string[]; // 사용자 역할 또는 ID
  canUse: string[];
  canEdit: string[];
  canDelete: string[];
  isPublic: boolean;
}

// 평가 인스턴스 (실제 평가 세션)
export interface AssessmentInstance {
  id: string;
  templateId: string;
  patientId: string;
  therapistId: string;
  sessionId?: string;
  
  // 상태
  status: AssessmentStatus;
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
  
  // 응답 데이터
  responses: AssessmentResponse[];
  
  // 점수 및 결과
  scores: AssessmentScore[];
  overallScore?: number;
  
  // 메타데이터
  version: number; // 사용된 템플릿 버전
  duration?: number; // 실제 소요 시간(초)
  
  // 설정
  settings: {
    allowPause: boolean;
    showTimer: boolean;
    enableAutoSave: boolean;
    autoSaveInterval: number; // 초 단위
  };
}

// 평가 상태
export enum AssessmentStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

// 평가 응답
export interface AssessmentResponse {
  questionId: string;
  optionId: string;
  value: unknown;
  timestamp: string;
  timeSpent?: number; // 이 질문에 소요된 시간(초)
  
  // 메타데이터
  isSkipped?: boolean;
  isChanged?: boolean; // 답변이 변경되었는지
  changeHistory?: ResponseChange[];
}

// 응답 변경 이력
export interface ResponseChange {
  oldValue: unknown;
  newValue: unknown;
  timestamp: string;
  reason?: string;
}

// 평가 점수
export interface AssessmentScore {
  sectionId?: string; // 섹션별 점수 (null이면 전체 점수)
  categoryId?: string; // 카테고리별 점수
  
  rawScore: number;
  normalizedScore: number; // 정규화된 점수 (0-100)
  percentile?: number;
  
  interpretation?: ScoreInterpretation;
  
  // 점수 구성 요소
  components?: ScoreComponent[];
}

// 점수 구성 요소
export interface ScoreComponent {
  questionId: string;
  rawValue: unknown;
  score: number;
  weight: number;
  explanation?: string;
}

// 평가 결과 보고서
export interface AssessmentReport {
  instanceId: string;
  templateName: string;
  patientInfo: {
    id: string;
    name: string;
    age?: number;
    gender?: string;
  };
  therapistInfo: {
    id: string;
    name: string;
  };
  
  // 요약
  summary: {
    completionDate: string;
    duration: number;
    overallScore: number;
    overallInterpretation: string;
    
    // 주요 지표
    keyFindings: string[];
    recommendations: string[];
    riskFactors: string[];
  };
  
  // 상세 점수
  detailedScores: {
    sectionScores: AssessmentScore[];
    categoryScores: AssessmentScore[];
    trendData?: TrendData[];
  };
  
  // 차트 데이터
  chartData: {
    radarChart?: RadarChartData;
    barChart?: BarChartData;
    lineChart?: LineChartData;
  };
  
  // 비교 데이터
  comparisons?: {
    previousAssessments?: ComparisonData[];
    normativeData?: NormativeData;
    benchmarks?: BenchmarkData[];
  };
  
  // 생성 정보
  generatedAt: string;
  generatedBy: string;
  version: string;
}

// 트렌드 데이터
export interface TrendData {
  date: string;
  score: number;
  category: string;
}

// 차트 데이터 타입들
export interface RadarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
  }[];
}

export interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

// 비교 데이터
export interface ComparisonData {
  date: string;
  score: number;
  change: number;
  interpretation: string;
}

// 표준 데이터
export interface NormativeData {
  ageGroup: string;
  gender?: string;
  mean: number;
  standardDeviation: number;
  percentiles: { [key: number]: number };
}

// 평가 통계
export interface AssessmentStatistics {
  categoryId?: string;
  templateId?: string;
  
  // 기본 통계
  totalAssessments: number;
  completedAssessments: number;
  averageCompletionTime: number;
  averageScore: number;
  
  // 완료율
  completionRate: number;
  
  // 점수 분포
  scoreDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  
  // 시간별 통계
  timeStats: {
    byMonth: { month: string; count: number; avgScore: number }[];
    byWeek: { week: string; count: number; avgScore: number }[];
    byDay: { day: string; count: number; avgScore: number }[];
  };
  
  // 사용자별 통계
  userStats: {
    therapistId: string;
    therapistName: string;
    assessmentCount: number;
    averageScore: number;
  }[];
  
  // 최근 트렌드
  trends: {
    period: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
    significance: 'high' | 'medium' | 'low';
  };
}

// 기본값들
export const defaultAssessmentConfig: AssessmentConfig = {
  instructions: '',
  helpText: '',
  placeholder: '',
  choices: [],
  allowMultiple: false,
  randomizeOrder: false,
  maxLength: 500,
  minLength: 0,
  conditionalLogic: []
};

export const defaultScoringConfig: ScoringConfig = {
  enabled: false,
  type: ScoringType.NONE,
  method: ScoringMethod.SUM,
  weight: 1,
  scoreMapping: {},
  interpretations: []
};

export const defaultCompletionSettings: CompletionSettings = {
  allowSaveProgress: true,
  allowResume: true,
  showProgressBar: true,
  shuffleSections: false,
  requireAllSections: true,
  showResults: true,
  allowRetake: false,
  retakeLimit: 1,
  retakeCooldown: 24
};

export const defaultTemplatePermissions: TemplatePermissions = {
  canView: ['therapist', 'admin'],
  canUse: ['therapist'],
  canEdit: ['admin'],
  canDelete: ['admin'],
  isPublic: false
}; 