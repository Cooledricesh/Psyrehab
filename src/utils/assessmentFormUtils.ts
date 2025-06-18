import { 
  AssessmentStep, 
  AssessmentData, 
  AssessmentFieldConfig,
  ConcentrationTimeOptions,
  MotivationLevelOptions,
  PastSuccessesOptions,
  ConstraintsOptions,
  SocialPreferenceOptions
} from '@/types/assessment'
import { 
  ASSESSMENT_FORM_CONFIGS, 
  ASSESSMENT_STEP_ORDER, 
  ASSESSMENT_FORM_VALIDATION,
  ASSESSMENT_STEP_DURATION 
} from '@/config/assessmentFormConfig'

// 폼 데이터 유효성 검사
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  completionPercentage: number
}

export interface ValidationError {
  step: AssessmentStep
  field: string
  message: string
  type: 'required' | 'format' | 'range' | 'dependency'
}

export interface ValidationWarning {
  step: AssessmentStep
  field: string
  message: string
  type: 'quality' | 'recommendation' | 'consistency'
}

// 단계별 진행률 계산
export function calculateStepProgress(
  step: AssessmentStep, 
  formData: Partial<AssessmentData>
): number {
  const config = ASSESSMENT_FORM_CONFIGS[step]
  if (!config) return 0

  const requiredFields = config.validation.required_fields
  const totalFields = config.fields.length
  const filledFields = config.fields.filter(field => {
    const value = getFieldValue(formData, step, field.id)
    return isFieldFilled(field, value)
  }).length

  // 필수 필드 가중치 부여
  const requiredWeight = 0.7 // 필수 필드 70% 가중치
  const optionalWeight = 0.3 // 선택 필드 30% 가중치

  const requiredProgress = requiredFields.reduce((acc, fieldId) => {
    const field = config.fields.find(f => f.id === fieldId)
    if (!field) return acc
    
    const value = getFieldValue(formData, step, fieldId)
    return acc + (isFieldFilled(field, value) ? 1 : 0)
  }, 0) / requiredFields.length

  const optionalProgress = (filledFields - requiredFields.filter(fieldId => {
    const field = config.fields.find(f => f.id === fieldId)
    if (!field) return false
    const value = getFieldValue(formData, step, fieldId)
    return isFieldFilled(field, value)
  }).length) / Math.max(1, totalFields - requiredFields.length)

  return Math.round((requiredProgress * requiredWeight + optionalProgress * optionalWeight) * 100)
}

// 전체 평가 진행률 계산
export function calculateOverallProgress(formData: Partial<AssessmentData>): {
  overall: number
  byStep: Record<AssessmentStep, number>
  completedSteps: AssessmentStep[]
  currentStep: AssessmentStep | null
} {
  const byStep: Record<AssessmentStep, number> = {} as Record<AssessmentStep, number>
  
  ASSESSMENT_STEP_ORDER.forEach(step => {
    byStep[step] = calculateStepProgress(step, formData)
  })

  const overall = Math.round(
    Object.values(byStep).reduce((sum, progress) => sum + progress, 0) / 
    ASSESSMENT_STEP_ORDER.length
  )

  const completedSteps = ASSESSMENT_STEP_ORDER.filter(step => 
    byStep[step] >= (ASSESSMENT_FORM_VALIDATION.step_minimum_completion[step] * 100)
  )

  const currentStep = ASSESSMENT_STEP_ORDER.find(step => 
    byStep[step] < (ASSESSMENT_FORM_VALIDATION.step_minimum_completion[step] * 100)
  ) || null

  return { overall, byStep, completedSteps, currentStep }
}

// 폼 데이터 유효성 검사
export function validateAssessmentForm(formData: Partial<AssessmentData>): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // 각 단계별 검사
  ASSESSMENT_STEP_ORDER.forEach(step => {
    const stepValidation = validateStep(step, formData)
    errors.push(...stepValidation.errors)
    warnings.push(...stepValidation.warnings)
  })

  // 전체 일관성 검사
  const consistencyWarnings = checkFormConsistency(formData)
  warnings.push(...consistencyWarnings)

  const progress = calculateOverallProgress(formData)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    completionPercentage: progress.overall
  }
}

// 단계별 유효성 검사
export function validateStep(
  step: AssessmentStep, 
  formData: Partial<AssessmentData>
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const config = ASSESSMENT_FORM_CONFIGS[step]

  if (!config) return { errors, warnings }

  // 필수 필드 검사
  config.validation.required_fields.forEach(fieldId => {
    const field = config.fields.find(f => f.id === fieldId)
    if (!field) return

    const value = getFieldValue(formData, step, fieldId)
    
    if (!isFieldFilled(field, value)) {
      errors.push({
        step,
        field: fieldId,
        message: `${field.label}은(는) 필수 입력 항목입니다.`,
        type: 'required'
      })
    }
  })

  // 필드별 개별 검사
  config.fields.forEach(field => {
    const value = getFieldValue(formData, step, field.id)
    
    // 조건부 필수 검사
    if (field.condition && shouldShowField(field.condition, formData, step)) {
      if (field.required && !isFieldFilled(field, value)) {
        errors.push({
          step,
          field: field.id,
          message: `${field.label}은(는) 현재 조건에서 필수 입력 항목입니다.`,
          type: 'dependency'
        })
      }
    }

    // 값 범위 검사
    if (value !== undefined && value !== null && value !== '') {
      const rangeError = validateFieldRange(field, value)
      if (rangeError) {
        errors.push({
          step,
          field: field.id,
          message: rangeError,
          type: 'range'
        })
      }
    }

    // 데이터 품질 검사
    const qualityWarning = checkFieldQuality(field, value, step)
    if (qualityWarning) {
      warnings.push(qualityWarning)
    }
  })

  return { errors, warnings }
}

type StepDataType = ConcentrationTimeOptions | MotivationLevelOptions | PastSuccessesOptions | ConstraintsOptions | SocialPreferenceOptions

// 필드 값 가져오기
function getFieldValue(
  formData: Partial<AssessmentData>, 
  step: AssessmentStep, 
  fieldId: string
): string | number | boolean | string[] | undefined {
  const stepData = formData[step] as StepDataType | undefined
  return stepData?.[fieldId as keyof StepDataType]
}

// 필드가 채워졌는지 확인
function isFieldFilled(field: AssessmentFieldConfig, value: string | number | boolean | string[] | undefined): boolean {
  if (value === null || value === undefined) return false
  
  switch (field.type) {
    case 'text':
    case 'textarea':
      return typeof value === 'string' && value.trim().length > 0
    
    case 'number':
      return typeof value === 'number' && !isNaN(value)
    
    case 'radio':
      return typeof value === 'string' && value.length > 0
    
    case 'checkbox':
    case 'multiselect':
      return Array.isArray(value) && value.length > 0
    
    case 'scale':
      return typeof value === 'number' && value >= (field.min || 1) && value <= (field.max || 5)
    
    default:
      return Boolean(value)
  }
}

// 조건부 필드 표시 여부 확인
function shouldShowField(
  condition: AssessmentFieldConfig['condition'],
  formData: Partial<AssessmentData>,
  step: AssessmentStep
): boolean {
  if (!condition) return true

  const fieldValue = getFieldValue(formData, step, condition.field)

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value
    case 'not_equals':
      return fieldValue !== condition.value
    case 'includes':
      return Array.isArray(fieldValue) && fieldValue.includes(condition.value)
    case 'not_includes':
      return !Array.isArray(fieldValue) || !fieldValue.includes(condition.value)
    case 'greater_than':
      return typeof fieldValue === 'number' && fieldValue > condition.value
    case 'less_than':
      return typeof fieldValue === 'number' && fieldValue < condition.value
    default:
      return true
  }
}

// 필드 값 범위 검사
function validateFieldRange(field: AssessmentFieldConfig, value: string | number | boolean | string[]): string | null {
  switch (field.type) {
    case 'number':
    case 'scale':
      if (typeof value === 'number') {
        if (field.min !== undefined && value < field.min) {
          return `${field.label}은(는) ${field.min} 이상이어야 합니다.`
        }
        if (field.max !== undefined && value > field.max) {
          return `${field.label}은(는) ${field.max} 이하여야 합니다.`
        }
      }
      break

    case 'text':
    case 'textarea':
      if (typeof value === 'string') {
        // 최소 길이 검사
        const minLength = ASSESSMENT_FORM_VALIDATION.data_quality_checks.min_text_length[field.id as keyof typeof ASSESSMENT_FORM_VALIDATION.data_quality_checks.min_text_length]
        if (minLength && value.trim().length < minLength) {
          return `${field.label}은(는) 최소 ${minLength}자 이상 입력해주세요.`
        }
      }
      break

    case 'multiselect':
    case 'checkbox':
      if (Array.isArray(value)) {
        const minSelections = ASSESSMENT_FORM_VALIDATION.data_quality_checks.min_selections[field.id as keyof typeof ASSESSMENT_FORM_VALIDATION.data_quality_checks.min_selections]
        if (minSelections && value.length < minSelections) {
          return `${field.label}에서 최소 ${minSelections}개 이상 선택해주세요.`
        }
      }
      break
  }

  // 커스텀 검증
  if (field.validation?.custom) {
    return field.validation.custom(value, {} as Partial<AssessmentData>) // formData 전체를 넘길 수도 있음
  }

  return null
}

// 필드 품질 검사 (경고)
function checkFieldQuality(
  field: AssessmentFieldConfig, 
  value: string | number | boolean | string[] | undefined, 
  step: AssessmentStep
): ValidationWarning | null {
  // 텍스트 필드 품질 검사
  if ((field.type === 'text' || field.type === 'textarea') && typeof value === 'string') {
    const text = value.trim()
    
    // 너무 짧은 텍스트
    if (text.length > 0 && text.length < 5) {
      return {
        step,
        field: field.id,
        message: '더 구체적으로 설명해주시면 더 나은 평가가 가능합니다.',
        type: 'quality'
      }
    }

    // 반복적인 문자
    if (text.length > 0 && /(.)\1{4,}/.test(text)) {
      return {
        step,
        field: field.id,
        message: '의미 있는 내용을 입력해주세요.',
        type: 'quality'
      }
    }
  }

  // 스케일 극단값 경고
  if (field.type === 'scale' && typeof value === 'number') {
    if (value === field.min || value === field.max) {
      return {
        step,
        field: field.id,
        message: '극단적인 값을 선택하셨습니다. 정확한 평가인지 다시 한 번 확인해주세요.',
        type: 'consistency'
      }
    }
  }

  return null
}

// 폼 일관성 검사
function checkFormConsistency(formData: Partial<AssessmentData>): ValidationWarning[] {
  const warnings: ValidationWarning[] = []

  // 동기 수준과 과거 성공 경험 일관성
  const motivationLevel = formData.motivation_level
  const pastSuccesses = formData.past_successes

  if (motivationLevel && pastSuccesses) {
    const avgMotivation = (
      (motivationLevel.goal_clarity || 0) +
      (motivationLevel.effort_willingness || 0) +
      (motivationLevel.confidence_level || 0)
    ) / 3

    const hasSuccesses = pastSuccesses.achievement_areas && pastSuccesses.achievement_areas.length > 0

    if (avgMotivation <= 2 && hasSuccesses) {
      warnings.push({
        step: 'motivation_level',
        field: 'general',
        message: '과거 성공 경험이 있음에도 동기 수준이 낮게 평가되었습니다. 이에 대한 구체적인 설명이 필요할 수 있습니다.',
        type: 'consistency'
      })
    }
  }

  // 제약 조건과 사회적 선호도 일관성
  const constraints = formData.constraints
  const socialPreference = formData.social_preference

  if (constraints && socialPreference) {
    const hasEmotionalBarriers = constraints.emotional_barriers?.includes('social_anxiety')
    const comfortWithStrangers = socialPreference.comfort_with_strangers || 0

    if (hasEmotionalBarriers && comfortWithStrangers >= 4) {
      warnings.push({
        step: 'social_preference',
        field: 'comfort_with_strangers',
        message: '사회불안이 있다고 하셨는데 낯선 사람과의 상호작용에 편안하다고 평가하셨습니다. 이 부분을 재검토해주세요.',
        type: 'consistency'
      })
    }
  }

  return warnings
}

// 다음 추천 단계 가져오기
export function getNextRecommendedStep(formData: Partial<AssessmentData>): AssessmentStep | null {
  const progress = calculateOverallProgress(formData)
  return progress.currentStep
}

// 폼 데이터 요약 생성
export interface FormSummary {
  completionPercentage: number
  completedSteps: number
  totalSteps: number
  estimatedTimeRemaining: number // 분
  strengthAreas: string[]
  improvementNeeded: string[]
  nextActions: string[]
}

export function generateFormSummary(formData: Partial<AssessmentData>): FormSummary {
  const progress = calculateOverallProgress(formData)
  const validation = validateAssessmentForm(formData)
  
  // 남은 시간 추정
  const remainingSteps = ASSESSMENT_STEP_ORDER.filter(step => 
    progress.byStep[step] < (ASSESSMENT_FORM_VALIDATION.step_minimum_completion[step] * 100)
  )
  
  const estimatedTimeRemaining = remainingSteps.reduce((total, step) => {
    return total + (ASSESSMENT_STEP_DURATION[step] || 10)
  }, 0)

  // 강점 영역 식별
  const strengthAreas = ASSESSMENT_STEP_ORDER
    .filter(step => progress.byStep[step] >= 80)
    .map(step => ASSESSMENT_FORM_CONFIGS[step].title)

  // 개선 필요 영역
  const improvementNeeded = validation.errors
    .map(error => `${ASSESSMENT_FORM_CONFIGS[error.step].title}: ${error.message}`)
    .slice(0, 3) // 상위 3개만

  // 다음 행동 추천
  const nextActions: string[] = []
  const nextStep = getNextRecommendedStep(formData)
  
  if (nextStep) {
    nextActions.push(`${ASSESSMENT_FORM_CONFIGS[nextStep].title} 단계를 완료해주세요.`)
  }
  
  if (validation.warnings.length > 0) {
    nextActions.push('일부 입력 내용에 대한 재검토가 필요합니다.')
  }
  
  if (progress.overall >= 80) {
    nextActions.push('평가를 완료하고 결과를 검토해주세요.')
  }

  return {
    completionPercentage: progress.overall,
    completedSteps: progress.completedSteps.length,
    totalSteps: ASSESSMENT_STEP_ORDER.length,
    estimatedTimeRemaining,
    strengthAreas,
    improvementNeeded,
    nextActions
  }
}

// 자동 저장 데이터 정리
export function sanitizeFormDataForStorage(formData: Partial<AssessmentData>): Partial<AssessmentData> {
  const sanitized = { ...formData }
  
  // 빈 문자열을 null로 변환
  ASSESSMENT_STEP_ORDER.forEach(step => {
    const stepData = sanitized[step] as StepDataType | undefined
    if (stepData) {
      Object.keys(stepData).forEach(key => {
        const typedKey = key as keyof StepDataType
        const value = stepData[typedKey] as string | number | boolean | string[] | null | undefined
        if (value === '') {
          (stepData as Record<string, unknown>)[typedKey] = null
        }
        // 빈 배열 정리
        if (Array.isArray(value) && value.length === 0) {
          (stepData as Record<string, unknown>)[typedKey] = null
        }
      })
    }
  })

  return sanitized
}

// 백분율을 색상으로 변환 (진행률 표시용)
export function getProgressColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600'
  if (percentage >= 60) return 'text-blue-600'
  if (percentage >= 40) return 'text-yellow-600'
  if (percentage >= 20) return 'text-orange-600'
  return 'text-red-600'
}

// 단계 완료 상태 아이콘
export function getStepStatusIcon(step: AssessmentStep, formData: Partial<AssessmentData>): {
  icon: 'check' | 'warning' | 'clock' | 'x'
  color: string
} {
  const progress = calculateStepProgress(step, formData)
  const validation = validateStep(step, formData)
  
  if (progress >= 90 && validation.errors.length === 0) {
    return { icon: 'check', color: 'text-green-600' }
  }
  
  if (validation.errors.length > 0) {
    return { icon: 'x', color: 'text-red-600' }
  }
  
  if (progress >= 50) {
    return { icon: 'warning', color: 'text-yellow-600' }
  }
  
  return { icon: 'clock', color: 'text-gray-400' }
} 