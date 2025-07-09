import { useForm, UseFormProps, UseFormReturn, FieldValues, Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCallback, useEffect, useState } from 'react'
import { parseError, AppError } from '@/lib/error-handling'
import { extractFieldErrors } from '@/lib/validations/common-validation'
import { handleApiError } from '@/utils/error-handler'

export interface UseValidatedFormOptions<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema: z.ZodType<T>
  onSubmitSuccess?: (data: T) => void | Promise<void>
  onSubmitError?: (error: AppError) => void
  enableRealTimeValidation?: boolean
  debounceMs?: number
  showSuccessMessage?: boolean
}

export interface UseValidatedFormReturn<T extends FieldValues> extends UseFormReturn<T> {
  submitWithValidation: (data: T) => Promise<void>
  isSubmitting: boolean
  submitError: AppError | null
  clearSubmitError: () => void
  validateField: (field: Path<T>, value: unknown) => Promise<boolean>
  validateAllFields: () => Promise<boolean>
  hasValidationErrors: boolean
  fieldErrors: Record<string, string>
}

/**
 * 검증이 통합된 폼 훅
 * React Hook Form + Zod 검증 + 에러 처리를 통합
 */
export function useValidatedForm<T extends FieldValues>({
  schema,
  onSubmitSuccess,
  onSubmitError,
  enableRealTimeValidation = false,
  showSuccessMessage = true,
  ...formOptions
}: UseValidatedFormOptions<T>): UseValidatedFormReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<AppError | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: enableRealTimeValidation ? 'onChange' : 'onSubmit',
    ...formOptions
  })

  const { formState: { errors }, setError, clearErrors } = form

  // 필드 에러를 추출하여 상태로 관리
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const extracted = Object.entries(errors).reduce((acc, [key, error]) => {
        if (error?.message) {
          acc[key] = error.message
        }
        return acc
      }, {} as Record<string, string>)
      setFieldErrors(extracted)
    } else {
      setFieldErrors({})
    }
  }, [errors])

  // 제출 에러 클리어
  const clearSubmitError = useCallback(() => {
    setSubmitError(null)
  }, [])

  // 단일 필드 검증
  const validateField = useCallback(async (field: Path<T>, value: unknown): Promise<boolean> => {
    try {
      // 전체 폼 데이터를 가져와서 해당 필드만 업데이트하여 검증
      const currentData = form.getValues()
      const testData = { ...currentData, [field]: value }
      
      const result = schema.safeParse(testData)
      
      if (result.success) {
        // 해당 필드의 에러 제거
        form.clearErrors(field)
        return true
      } else {
        // 해당 필드의 에러만 설정
        const fieldError = result.error.errors.find(err => 
          err.path.length > 0 && err.path[0] === field
        )
        
        if (fieldError) {
          form.setError(field, {
            type: 'validation',
            message: fieldError.message
          })
        }
        return false
      }
    } catch (error) {
      handleApiError(error, 'useValidatedForm.validateField')
      return false
    }
  }, [schema, form])

  // 전체 필드 검증
  const validateAllFields = useCallback(async (): Promise<boolean> => {
    try {
      const currentData = form.getValues()
      const result = schema.safeParse(currentData)
      
      if (result.success) {
        clearErrors()
        return true
      } else {
        // 모든 에러를 폼에 설정
        const fieldErrors = extractFieldErrors(result.error)
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as Path<T>, {
            type: 'validation',
            message
          })
        })
        return false
      }
    } catch (error) {
      handleApiError(error, 'useValidatedForm.validateAllFields')
      return false
    }
  }, [schema, form, clearErrors])

  // 검증과 함께 제출
  const submitWithValidation = useCallback(async (data: T) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // 스키마 검증
      const validationResult = schema.safeParse(data)
      
      if (!validationResult.success) {
        const fieldErrors = extractFieldErrors(validationResult.error)
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as Path<T>, {
            type: 'validation',
            message
          })
        })
        throw new Error('Validation failed')
      }

      // 검증 성공 시 제출 핸들러 호출
      if (onSubmitSuccess) {
        await onSubmitSuccess(validationResult.data)
      }

      // 성공 시 폼 리셋 (옵션)
      if (showSuccessMessage) {
        // 여기서 성공 토스트 메시지를 표시할 수 있음
        console.log('Form submitted successfully')
      }

    } catch (error) {
      const appError = parseError(error)
      setSubmitError(appError)
      
      if (onSubmitError) {
        onSubmitError(appError)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [schema, onSubmitSuccess, onSubmitError, setError, showSuccessMessage])

  const hasValidationErrors = Object.keys(fieldErrors).length > 0

  return {
    ...form,
    submitWithValidation,
    isSubmitting,
    submitError,
    clearSubmitError,
    validateField,
    validateAllFields,
    hasValidationErrors,
    fieldErrors
  }
}

/**
 * 디바운스된 필드 검증 훅
 */
export function useDebouncedValidation<T extends FieldValues>(
  validateFn: (field: Path<T>, value: unknown) => Promise<boolean>,
  delay: number = 300
) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const debouncedValidate = useCallback((field: Path<T>, value: unknown) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const newTimeoutId = setTimeout(() => {
      validateFn(field, value)
    }, delay)

    setTimeoutId(newTimeoutId)
  }, [validateFn, delay, timeoutId])

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  return debouncedValidate
}

/**
 * 조건부 검증 훅
 */
export function useConditionalValidation<T extends FieldValues>(
  condition: boolean,
  schema: z.ZodType<T>
) {
  const conditionalSchema = condition ? schema : z.any()
  
  return conditionalSchema
}

/**
 * 다단계 폼 검증 훅
 */
export function useMultiStepValidation<T extends FieldValues>(
  steps: Array<{
    name: string
    schema: z.ZodType<Partial<T>>
    fields: (keyof T)[]
  }>
) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(new Array(steps.length).fill(false))

  const validateStep = useCallback(async (stepIndex: number, data: Partial<T>) => {
    const step = steps[stepIndex]
    if (!step) return false

    try {
      const result = step.schema.safeParse(data)
      const isValid = result.success

      setCompletedSteps(prev => {
        const newCompleted = [...prev]
        newCompleted[stepIndex] = isValid
        return newCompleted
      })

      return isValid
    } catch (error) {
      handleApiError(error, 'useMultiStepValidation.validateStep')
      return false
    }
  }, [steps])

  const goToNextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, steps.length])

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const canProceedToNext = completedSteps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  return {
    currentStep,
    setCurrentStep,
    completedSteps,
    validateStep,
    goToNextStep,
    goToPreviousStep,
    canProceedToNext,
    isLastStep,
    isFirstStep,
    currentStepConfig: steps[currentStep]
  }
}

/**
 * 비동기 검증 훅 (서버 사이드 검증)
 */
export function useAsyncValidation<T>(
  validationFn: (value: T) => Promise<boolean>,
  errorMessage: string = '검증에 실패했습니다'
) {
  const [isValidating, setIsValidating] = useState(false)
  const [lastValidatedValue, setLastValidatedValue] = useState<T | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const validate = useCallback(async (value: T) => {
    // 이미 검증된 값이면 스킵
    if (value === lastValidatedValue && isValid !== null) {
      return isValid
    }

    setIsValidating(true)
    try {
      const result = await validationFn(value)
      setIsValid(result)
      setLastValidatedValue(value)
      return result
    } catch (error) {
      handleApiError(error, 'useAsyncValidation.validate')
      setIsValid(false)
      return false
    } finally {
      setIsValidating(false)
    }
  }, [validationFn, lastValidatedValue, isValid])

  const reset = useCallback(() => {
    setIsValidating(false)
    setLastValidatedValue(null)
    setIsValid(null)
  }, [])

  return {
    validate,
    isValidating,
    isValid,
    errorMessage: isValid === false ? errorMessage : undefined,
    reset
  }
} 