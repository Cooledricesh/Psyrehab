import React, { forwardRef, useEffect, useRef } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'
import { 
  useMaskedInput, 
  MaskType, 
  FormatOptions,
  calculateCursorPosition 
} from '@/lib/formatting/input-masking'

// =============================================================================
// MASKED INPUT COMPONENT
// =============================================================================

export interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  maskType?: MaskType
  formatOptions?: FormatOptions
  value?: string
  onChange?: (value: string, rawValue: string) => void
  onValidationChange?: (isValid: boolean) => void
  showValidation?: boolean
  validationClassName?: string
  invalidClassName?: string
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({
    maskType = 'phone',
    formatOptions = {},
    value = '',
    onChange,
    onValidationChange,
    showValidation = true,
    validationClassName = 'border-green-500',
    invalidClassName = 'border-red-500',
    className,
    ...props
  }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const cursorPositionRef = useRef<number>(0)

    const {
      value: maskedValue,
      isValid,
      handleChange,
      getRawValue,
      placeholder: maskPlaceholder
    } = useMaskedInput(value, maskType, formatOptions)

    // 외부 value 변경 시 내부 상태 동기화
    useEffect(() => {
      if (value !== maskedValue) {
        handleChange(value)
      }
    }, [value])

    // 유효성 상태 변경 알림
    useEffect(() => {
      if (onValidationChange) {
        onValidationChange(isValid)
      }
    }, [isValid, onValidationChange])

    // 커서 위치 복원
    useEffect(() => {
      if (inputRef.current && cursorPositionRef.current !== undefined) {
        inputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current)
      }
    }, [maskedValue])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const oldValue = maskedValue
      const oldCursor = e.target.selectionStart || 0

      handleChange(inputValue)

      // 커서 위치 계산 및 저장
      const newCursor = calculateCursorPosition(oldValue, inputValue, oldCursor)
      cursorPositionRef.current = newCursor

      // 외부 onChange 호출
      if (onChange) {
        onChange(inputValue, getRawValue())
      }
    }

    const validationClass = showValidation 
      ? (isValid ? validationClassName : invalidClassName)
      : ''

    return (
      <Input
        ref={ref || inputRef}
        value={maskedValue}
        onChange={handleInputChange}
        placeholder={props.placeholder || maskPlaceholder}
        className={cn(validationClass, className)}
        {...props}
      />
    )
  }
)

MaskedInput.displayName = 'MaskedInput'

// =============================================================================
// SPECIALIZED MASKED INPUT COMPONENTS
// =============================================================================

/**
 * 전화번호 입력 컴포넌트
 */
export const PhoneInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="phone"
      {...props}
    />
  )
)

PhoneInput.displayName = 'PhoneInput'

/**
 * 환자 식별번호 입력 컴포넌트
 */
export const PatientIdInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="patientId"
      {...props}
    />
  )
)

PatientIdInput.displayName = 'PatientIdInput'

/**
 * 시간 입력 컴포넌트
 */
export const TimeInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="time"
      {...props}
    />
  )
)

TimeInput.displayName = 'TimeInput'

/**
 * 날짜 입력 컴포넌트
 */
export const DateInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="date"
      {...props}
    />
  )
)

DateInput.displayName = 'DateInput'

/**
 * 주민등록번호 앞자리 입력 컴포넌트
 */
export const BirthNumberInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="birthNumber"
      {...props}
    />
  )
)

BirthNumberInput.displayName = 'BirthNumberInput'

/**
 * 우편번호 입력 컴포넌트
 */
export const ZipCodeInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="zipCode"
      {...props}
    />
  )
)

ZipCodeInput.displayName = 'ZipCodeInput'

// =============================================================================
// CURRENCY INPUT COMPONENT
// =============================================================================

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | string
  onChange?: (value: number) => void
  currency?: string
  showCurrency?: boolean
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({
    value = 0,
    onChange,
    currency = '원',
    showCurrency = true,
    className,
    ...props
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')

    useEffect(() => {
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
      const formatted = numValue.toLocaleString('ko-KR')
      setDisplayValue(formatted)
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/[^\d]/g, '')
      const numValue = parseInt(inputValue) || 0
      
      setDisplayValue(numValue.toLocaleString('ko-KR'))
      
      if (onChange) {
        onChange(numValue)
      }
    }

    return (
      <div className="relative">
        <Input
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          className={cn('pr-8', className)}
          {...props}
        />
        {showCurrency && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            {currency}
          </span>
        )}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput' 