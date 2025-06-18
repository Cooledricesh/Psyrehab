import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Scale } from '@/components/ui/scale'
import { MultiSelect } from '@/components/ui/multi-select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, Save, Send, AlertCircle } from 'lucide-react'
import { assessmentFormConfigs, assessmentStepOrder, assessmentStepIcons } from '@/config/assessment-forms'
import { 
  shouldRenderField, 
  getFieldOptions, 
  validateStep, 
  calculateFormCompleteness, 
  findNextIncompleteField 
} from '@/lib/assessment-utils'
import type { AssessmentData, AssessmentStep, AssessmentFieldConfig } from '@/types/assessment'
import { cn } from '@/lib/utils'
import { FocusOnChange, useLiveAnnouncement } from '@/components/ui/live-region'

interface AssessmentFormProps {
  patientId: string
  assessorId: string
  initialData?: Partial<AssessmentData>
  onSubmit: (data: AssessmentData) => void
  onSaveDraft?: (data: Partial<AssessmentData>) => void
  isLoading?: boolean
  className?: string
}

interface FormErrors {
  [key: string]: string
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({
  patientId,
  assessorId,
  initialData,
  onSubmit,
  onSaveDraft,
  isLoading = false,
  className
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [formData, setFormData] = useState<Partial<AssessmentData>>({
    patient_id: patientId,
    assessor_id: assessorId,
    assessment_date: new Date().toISOString().split('T')[0],
    status: 'draft',
    concentration_time: {
      duration: 30,
      environment: 'quiet',
      time_of_day: 'morning',
      notes: ''
    },
    motivation_level: {
      self_motivation: 3,
      external_motivation: 3,
      goal_clarity: 3,
      confidence_level: 3,
      notes: ''
    },
    past_successes: {
      academic_achievements: false,
      work_experience: false,
      social_achievements: false,
      creative_accomplishments: false,
      physical_achievements: false,
      personal_growth: false,
      descriptions: [],
      most_significant: '',
      notes: ''
    },
    constraints: {
      physical_limitations: [],
      cognitive_challenges: [],
      emotional_barriers: [],
      social_obstacles: [],
      environmental_factors: [],
      financial_constraints: false,
      time_limitations: [],
      severity_rating: 3,
      notes: ''
    },
    social_preference: {
      group_size_preference: 'small_group',
      interaction_style: 'active_participant',
      communication_preference: 'verbal',
      support_type_needed: [],
      comfort_with_strangers: 3,
      collaboration_willingness: 3,
      notes: ''
    },
    overall_notes: '',
    ...initialData
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const { announce } = useLiveAnnouncement()

  const currentStepKey = assessmentStepOrder[currentStep]
  const currentConfig = assessmentFormConfigs[currentStepKey]
  const isLastStep = currentStep === assessmentStepOrder.length - 1
  const totalSteps = assessmentStepOrder.length
  const progress = ((currentStep + 1) / totalSteps) * 100
  
  // 폼 완성도 계산
  const allFields = Object.fromEntries(
    assessmentStepOrder.map(stepKey => [stepKey, assessmentFormConfigs[stepKey].fields])
  ) as Record<AssessmentStep, AssessmentFieldConfig[]>
  
  const completeness = calculateFormCompleteness(formData, allFields)
  const nextIncompleteField = findNextIncompleteField(formData, allFields, currentStep, assessmentStepOrder)

  // 필드 값 업데이트
  const updateFieldValue = (stepKey: AssessmentStep, fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [fieldId]: value
      }
    }))
    
    // 에러 제거
    const errorKey = `${stepKey}.${fieldId}`
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }

  // 필드 렌더링
  const renderField = (field: AssessmentFieldConfig) => {
    const stepData = formData[currentStepKey] as any
    
    // 조건부 렌더링 확인
    if (!shouldRenderField(field, stepData, formData)) {
      return null
    }

    const value = stepData?.[field.id]
    const errorKey = `${currentStepKey}.${field.id}`
    const hasError = !!errors[errorKey]
    
    // 동적 옵션 가져오기
    const fieldOptions = getFieldOptions(field, stepData, formData)

    const baseProps = {
      name: field.id,
      required: field.required,
      disabled: isLoading
    }

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className={cn(field.required && 'after:content-["*"] after:text-red-500')}>
              {field.label}
            </Label>
            <Input
              {...baseProps}
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => {
                const newValue = field.type === 'number' ? Number(e.target.value) : e.target.value
                updateFieldValue(currentStepKey, field.id, newValue)
              }}
              min={field.min}
              max={field.max}
              step={field.step}
              className={cn(hasError && 'border-red-500')}
            />
            {hasError && (
              <p className="text-sm text-red-600">{errors[errorKey]}</p>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className={cn(field.required && 'after:content-["*"] after:text-red-500')}>
              {field.label}
            </Label>
            <Textarea
              {...baseProps}
              id={field.id}
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => updateFieldValue(currentStepKey, field.id, e.target.value)}
              className={cn(hasError && 'border-red-500')}
              rows={3}
            />
            {hasError && (
              <p className="text-sm text-red-600">{errors[errorKey]}</p>
            )}
          </div>
        )

      case 'radio':
        return (
          <div key={field.id} className="space-y-3">
            <Label className={cn(field.required && 'after:content-["*"] after:text-red-500')}>
              {field.label}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(newValue) => updateFieldValue(currentStepKey, field.id, newValue)}
              disabled={isLoading}
              className={cn(hasError && 'border border-red-500 rounded-md p-3')}
            >
              {fieldOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                  <Label htmlFor={`${field.id}-${option.value}`} className="cursor-pointer">
                    <div>
                      <div>{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-gray-500 mt-1">{option.description}</div>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {hasError && (
              <p className="text-sm text-red-600">{errors[errorKey]}</p>
            )}
          </div>
        )

      case 'scale':
        return (
          <div key={field.id} className="space-y-3">
            <Label className={cn(field.required && 'after:content-["*"] after:text-red-500')}>
              {field.label}
            </Label>
            <Scale
              value={value}
              onChange={(newValue) => updateFieldValue(currentStepKey, field.id, newValue)}
              min={field.min}
              max={field.max}
              labels={field.options}
              disabled={isLoading}
              className={cn(hasError && 'border border-red-500 rounded-md p-3')}
            />
            {hasError && (
              <p className="text-sm text-red-600">{errors[errorKey]}</p>
            )}
          </div>
        )

      case 'multiselect':
        return (
          <div key={field.id} className="space-y-2">
            <Label className={cn(field.required && 'after:content-["*"] after:text-red-500')}>
              {field.label}
            </Label>
            <MultiSelect
              options={fieldOptions.map(opt => ({
                value: opt.value.toString(),
                label: opt.label
              }))}
              value={value || []}
              onChange={(newValue) => updateFieldValue(currentStepKey, field.id, newValue)}
              placeholder="선택해주세요"
              disabled={isLoading}
              className={cn(hasError && 'border-red-500')}
            />
            {hasError && (
              <p className="text-sm text-red-600">{errors[errorKey]}</p>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={field.id}
                checked={value || false}
                onChange={(e) => updateFieldValue(currentStepKey, field.id, e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor={field.id} className="cursor-pointer">
                {field.label}
              </Label>
            </div>
            {hasError && (
              <p className="text-sm text-red-600">{errors[errorKey]}</p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // 유효성 검사
  const validateCurrentStep = (): boolean => {
    const stepData = formData[currentStepKey] as any
    const stepErrors = validateStep(currentConfig.fields, stepData, formData)
    
    // 에러 키에 스텝 접두사 추가
    const prefixedErrors: FormErrors = {}
    Object.entries(stepErrors).forEach(([key, value]) => {
      prefixedErrors[`${currentStepKey}.${key}`] = value
    })

    setErrors(prefixedErrors)
    return Object.keys(prefixedErrors).length === 0
  }

  // 다음 단계로
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1))
    } else {
      // 에러가 있을 때 첫 번째 에러 필드에 포커스
      const firstErrorKey = Object.keys(errors)[0]
      if (firstErrorKey) {
        const fieldId = firstErrorKey.split('.')[1]
        const errorField = document.getElementById(fieldId) as HTMLElement
        if (errorField) {
          errorField.focus()
          announce('입력 오류가 있습니다. 필수 항목을 확인해주세요.', 'assertive')
        }
      }
    }
  }

  // 이전 단계로
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  // 임시 저장
  const handleSaveDraft = async () => {
    if (onSaveDraft) {
      await onSaveDraft({ ...formData, status: 'draft' })
      announce('임시 저장이 완료되었습니다.', 'polite')
    }
  }

  // 최종 제출
  const handleSubmit = async () => {
    // 모든 단계 검증
    let allValid = true
    for (let i = 0; i < totalSteps; i++) {
      setCurrentStep(i)
      if (!validateCurrentStep()) {
        allValid = false
        announce(`${i + 1}단계에 오류가 있습니다. 확인해주세요.`, 'assertive')
        break
      }
    }

    if (allValid) {
      await onSubmit({ 
        ...formData, 
        status: 'completed',
        assessment_date: formData.assessment_date || new Date().toISOString().split('T')[0]
      } as AssessmentData)
      announce('평가가 성공적으로 완료되었습니다.', 'polite')
    }
  }

  // 단계 변경 시 포커스 관리 및 알림
  useEffect(() => {
    const stepTitle = currentConfig.title
    announce(`${stepTitle} 단계로 이동했습니다. ${currentStep + 1}단계 중 ${totalSteps}단계입니다.`, 'polite')
    
    // 단계 변경 후 첫 번째 입력 필드에 포커스
    setTimeout(() => {
      const firstInput = document.querySelector(`[data-step="${currentStep}"] input, [data-step="${currentStep}"] textarea, [data-step="${currentStep}"] button`) as HTMLElement
      if (firstInput) {
        firstInput.focus()
      }
    }, 100)
  }, [currentStep, currentConfig.title, totalSteps, announce])

  return (
    <div className={cn('max-w-4xl mx-auto space-y-6', className)}>
      {/* 진행 상황 표시 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{assessmentStepIcons[currentStepKey]}</span>
                {currentConfig.title}
              </CardTitle>
              <CardDescription>{currentConfig.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {currentStep + 1} / {totalSteps}
              </div>
              <div className="text-xs text-blue-600 font-medium">
                완성도: {Math.round(completeness)}%
              </div>
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      {/* 현재 단계 폼 */}
      <Card>
        <CardContent className="p-6" data-step={currentStep}>
          <FocusOnChange 
            shouldFocus={true} 
            focusTarget="input, textarea, button"
            announceMessage={`${currentConfig.title} 단계의 입력 필드입니다.`}
          >
            <div className="space-y-6">
              {currentConfig.fields.map(renderField)}
            </div>
          </FocusOnChange>
        </CardContent>
      </Card>

      {/* 전체 노트 (마지막 단계에서만) */}
      {isLastStep && (
        <Card>
          <CardHeader>
            <CardTitle>전체 관찰사항</CardTitle>
            <CardDescription>평가 전반에 대한 추가 의견이나 관찰사항을 기록해주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="전체적인 평가 소견, 특이사항, 추천사항 등을 기록해주세요"
              value={formData.overall_notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, overall_notes: e.target.value }))}
              rows={4}
              disabled={isLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* 에러 메시지 */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            필수 입력 항목을 확인해주세요. 오류가 있는 필드를 수정한 후 다시 시도해주세요.
          </AlertDescription>
        </Alert>
      )}

      {/* 네비게이션 버튼 */}
      <div className="flex items-center justify-between" role="navigation" aria-label="평가 단계 네비게이션">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0 || isLoading}
          aria-label="이전 단계로 이동"
          className="focus-ring"
        >
          <ChevronLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          이전
        </Button>

        <div className="flex items-center gap-2">
          {/* 다음 미완성 필드로 이동 */}
          {nextIncompleteField && nextIncompleteField.stepIndex !== currentStep && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(nextIncompleteField.stepIndex)}
              disabled={isLoading}
              className="text-orange-600 border-orange-300 hover:bg-orange-50 focus-ring"
              aria-label={`미완성 항목이 있는 ${nextIncompleteField.stepIndex + 1}단계로 이동`}
            >
              미완성 항목으로
            </Button>
          )}

          {/* 임시 저장 */}
          <Button
            variant="ghost"
            onClick={handleSaveDraft}
            disabled={isLoading}
            aria-label="현재 진행 상황을 임시 저장"
            className="focus-ring"
          >
            <Save className="w-4 h-4 mr-2" aria-hidden="true" />
            임시 저장
          </Button>

          {/* 다음/완료 */}
          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              aria-label="평가를 완료하고 제출"
              className="focus-ring"
            >
              <Send className="w-4 h-4 mr-2" aria-hidden="true" />
              평가 완료
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={isLoading}
              aria-label="다음 단계로 이동"
              className="focus-ring"
            >
              다음
              <ChevronRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* 단계 인디케이터 */}
      <div className="flex justify-center">
        <nav aria-label="평가 단계" role="navigation">
          <ol className="flex items-center gap-2" role="list">
            {assessmentStepOrder.map((stepKey, index) => {
              const stepConfig = assessmentFormConfigs[stepKey]
              const isCompleted = index < currentStep
              const isCurrent = index === currentStep
              
              return (
                <li key={stepKey} role="listitem">
                  <button
                    onClick={() => setCurrentStep(index)}
                    className={cn(
                      'w-8 h-8 rounded-full text-xs font-medium transition-colors focus-ring',
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    )}
                    disabled={isLoading}
                    aria-label={`${stepConfig.title} (${index + 1}단계)`}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-describedby={`step-${index}-status`}
                  >
                    {index + 1}
                  </button>
                  <span id={`step-${index}-status`} className="sr-only">
                    {isCompleted ? '완료됨' : isCurrent ? '현재 진행 중' : '미완료'}
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>
      </div>
    </div>
  )
}

export default AssessmentForm 
export default AssessmentForm 