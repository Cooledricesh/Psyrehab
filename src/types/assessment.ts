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
    previous_value: any
    current_value: any
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
    value: any
  }
  dependencies?: Array<{
    field: string
    affects: 'options' | 'validation' | 'visibility'
    mapping?: Record<string, any>
  }>
  validation?: {
    pattern?: string
    message?: string
    custom?: (value: any, formData: any) => string | null
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

// API 응답 타입들
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

// History tracking types
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
  old_value: any
  new_value: any
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

// Assessment timeline and progression
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
  supporting_data: any[]
  actionable_recommendations: string[]
  priority: 'low' | 'medium' | 'high'
}

// History query and filtering
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

// Progress tracking requests
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

// Analytics and reporting
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