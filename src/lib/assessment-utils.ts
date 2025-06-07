import type { AssessmentFieldConfig, AssessmentData, AssessmentStep } from '@/types/assessment'

/**
 * 필드의 조건부 렌더링 여부를 확인합니다
 */
export function shouldRenderField(
  field: AssessmentFieldConfig,
  stepData: any,
  formData: Partial<AssessmentData>
): boolean {
  if (!field.condition) return true

  const { field: conditionField, operator, value } = field.condition
  
  // 현재 스텝 데이터에서 조건 필드 값 가져오기
  let fieldValue = stepData?.[conditionField]
  
  // 다른 스텝의 필드를 참조하는 경우
  if (fieldValue === undefined) {
    const [stepKey, fieldKey] = conditionField.includes('.') 
      ? conditionField.split('.') 
      : [null, conditionField]
    
    if (stepKey && formData[stepKey as AssessmentStep]) {
      fieldValue = (formData[stepKey as AssessmentStep] as any)?.[fieldKey]
    }
  }

  switch (operator) {
    case 'equals':
      return fieldValue === value
    case 'not_equals':
      return fieldValue !== value
    case 'includes':
      return Array.isArray(fieldValue) ? fieldValue.includes(value) : false
    case 'not_includes':
      return Array.isArray(fieldValue) ? !fieldValue.includes(value) : true
    case 'greater_than':
      return typeof fieldValue === 'number' && fieldValue > value
    case 'less_than':
      return typeof fieldValue === 'number' && fieldValue < value
    default:
      return true
  }
}

/**
 * 필드의 동적 옵션을 가져옵니다
 */
export function getFieldOptions(
  field: AssessmentFieldConfig,
  stepData: any,
  formData: Partial<AssessmentData>
): Array<{ value: string; label: string; description?: string }> {
  if (!field.dependencies) return field.options || []

  let options = [...(field.options || [])]

  field.dependencies.forEach(dependency => {
    if (dependency.affects === 'options' && dependency.mapping) {
      const dependentFieldValue = stepData?.[dependency.field]
      if (dependentFieldValue && dependency.mapping[dependentFieldValue]) {
        options = dependency.mapping[dependentFieldValue]
      }
    }
  })

  return options
}

/**
 * 필드의 동적 유효성 검사를 수행합니다
 */
export function validateField(
  field: AssessmentFieldConfig,
  value: any,
  stepData: any,
  formData: Partial<AssessmentData>
): string | null {
  // 기본 필수 필드 검사
  if (field.required && (value === undefined || value === null || value === '')) {
    return `${field.label}은(는) 필수 입력 항목입니다.`
  }

  // 숫자 범위 검사
  if (field.type === 'number' && value !== undefined && value !== null && value !== '') {
    const numValue = Number(value)
    if (field.min !== undefined && numValue < field.min) {
      return `${field.label}은(는) ${field.min} 이상이어야 합니다.`
    }
    if (field.max !== undefined && numValue > field.max) {
      return `${field.label}은(는) ${field.max} 이하여야 합니다.`
    }
  }

  // 패턴 검사
  if (field.validation?.pattern && value) {
    const regex = new RegExp(field.validation.pattern)
    if (!regex.test(value)) {
      return field.validation.message || `${field.label}의 형식이 올바르지 않습니다.`
    }
  }

  // 커스텀 유효성 검사
  if (field.validation?.custom) {
    return field.validation.custom(value, formData)
  }

  return null
}

/**
 * 스텝의 모든 필드에 대해 유효성 검사를 수행합니다
 */
export function validateStep(
  fields: AssessmentFieldConfig[],
  stepData: any,
  formData: Partial<AssessmentData>
): Record<string, string> {
  const errors: Record<string, string> = {}

  fields.forEach(field => {
    // 조건부 렌더링되지 않는 필드는 검사하지 않음
    if (!shouldRenderField(field, stepData, formData)) return

    const value = stepData?.[field.id]
    const error = validateField(field, value, stepData, formData)
    
    if (error) {
      errors[field.id] = error
    }
  })

  return errors
}

/**
 * 폼 데이터의 완성도를 계산합니다 (백분율)
 */
export function calculateFormCompleteness(
  formData: Partial<AssessmentData>,
  allFields: Record<AssessmentStep, AssessmentFieldConfig[]>
): number {
  let totalRequiredFields = 0
  let completedRequiredFields = 0

  Object.entries(allFields).forEach(([stepKey, fields]) => {
    const stepData = formData[stepKey as AssessmentStep]
    
    fields.forEach(field => {
      if (!field.required) return
      if (!shouldRenderField(field, stepData, formData)) return
      
      totalRequiredFields++
      
      const value = stepData?.[field.id]
      if (value !== undefined && value !== null && value !== '') {
        completedRequiredFields++
      }
    })
  })

  return totalRequiredFields > 0 ? (completedRequiredFields / totalRequiredFields) * 100 : 0
}

/**
 * 다음 미완성 필드를 찾습니다
 */
export function findNextIncompleteField(
  formData: Partial<AssessmentData>,
  allFields: Record<AssessmentStep, AssessmentFieldConfig[]>,
  currentStep: number,
  stepOrder: AssessmentStep[]
): { stepIndex: number; fieldId: string } | null {
  // 현재 스텝부터 검사
  for (let i = currentStep; i < stepOrder.length; i++) {
    const stepKey = stepOrder[i]
    const fields = allFields[stepKey] || []
    const stepData = formData[stepKey]

    for (const field of fields) {
      if (!field.required) continue
      if (!shouldRenderField(field, stepData, formData)) continue
      
      const value = stepData?.[field.id]
      if (value === undefined || value === null || value === '') {
        return { stepIndex: i, fieldId: field.id }
      }
    }
  }

  return null
} 