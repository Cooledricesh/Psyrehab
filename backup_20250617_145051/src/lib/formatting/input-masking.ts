import { useState, useCallback } from 'react'

// =============================================================================
// INPUT MASKING AND FORMATTING UTILITIES
// =============================================================================

/**
 * 마스킹 패턴 인터페이스
 */
export interface MaskPattern {
  pattern: string
  placeholder?: string
  transform?: (value: string) => string
  validate?: (value: string) => boolean
}

/**
 * 포맷팅 옵션
 */
export interface FormatOptions {
  mask?: string
  placeholder?: string
  allowEmpty?: boolean
  transform?: 'uppercase' | 'lowercase' | 'capitalize'
  maxLength?: number
  minLength?: number
}

// =============================================================================
// MASK PATTERNS
// =============================================================================

/**
 * 미리 정의된 마스킹 패턴들
 */
export const MASK_PATTERNS: Record<string, MaskPattern> = {
  // 전화번호 패턴
  phone: {
    pattern: '000-0000-0000',
    placeholder: '010-1234-5678',
    transform: (value: string) => value.replace(/[^\d]/g, ''),
    validate: (value: string) => /^\d{10,11}$/.test(value.replace(/[^\d]/g, ''))
  },

  // 환자 식별번호 패턴
  patientId: {
    pattern: 'AAA-0000',
    placeholder: 'PSY-0001',
    transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
    validate: (value: string) => /^[A-Z]{3}-?\d{4}$/.test(value)
  },

  // 주민등록번호 패턴 (앞 6자리만)
  birthNumber: {
    pattern: '000000-0',
    placeholder: '901201-1',
    transform: (value: string) => value.replace(/[^\d]/g, ''),
    validate: (value: string) => /^\d{6}-?\d{1}$/.test(value)
  },

  // 우편번호 패턴
  zipCode: {
    pattern: '00000',
    placeholder: '12345',
    transform: (value: string) => value.replace(/[^\d]/g, ''),
    validate: (value: string) => /^\d{5}$/.test(value)
  },

  // 시간 패턴
  time: {
    pattern: '00:00',
    placeholder: '14:30',
    transform: (value: string) => value.replace(/[^\d]/g, ''),
    validate: (value: string) => {
      const time = value.replace(/[^\d]/g, '')
      if (time.length !== 4) return false
      const hours = parseInt(time.substring(0, 2))
      const minutes = parseInt(time.substring(2, 4))
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
    }
  },

  // 날짜 패턴
  date: {
    pattern: '0000-00-00',
    placeholder: '2024-01-01',
    transform: (value: string) => value.replace(/[^\d]/g, ''),
    validate: (value: string) => {
      const date = value.replace(/[^\d]/g, '')
      if (date.length !== 8) return false
      const year = parseInt(date.substring(0, 4))
      const month = parseInt(date.substring(4, 6))
      const day = parseInt(date.substring(6, 8))
      return year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31
    }
  },

  // 금액 패턴
  currency: {
    pattern: '0,000,000',
    placeholder: '1,000,000',
    transform: (value: string) => value.replace(/[^\d]/g, ''),
    validate: (value: string) => /^\d+$/.test(value.replace(/[^\d]/g, ''))
  }
}

// =============================================================================
// CORE MASKING FUNCTIONS
// =============================================================================

/**
 * 문자열에 마스크 패턴 적용
 */
export function applyMask(value: string, pattern: string): string {
  if (!value || !pattern) return value

  const cleanValue = value.replace(/[^\w]/g, '')
  let maskedValue = ''
  let valueIndex = 0

  for (let i = 0; i < pattern.length && valueIndex < cleanValue.length; i++) {
    const patternChar = pattern[i]
    const valueChar = cleanValue[valueIndex]

    if (patternChar === '0') {
      // 숫자 자리
      if (/\d/.test(valueChar)) {
        maskedValue += valueChar
        valueIndex++
      } else {
        break
      }
    } else if (patternChar === 'A') {
      // 영문 대문자 자리
      if (/[A-Za-z]/.test(valueChar)) {
        maskedValue += valueChar.toUpperCase()
        valueIndex++
      } else {
        break
      }
    } else if (patternChar === 'a') {
      // 영문 소문자 자리
      if (/[A-Za-z]/.test(valueChar)) {
        maskedValue += valueChar.toLowerCase()
        valueIndex++
      } else {
        break
      }
    } else if (patternChar === 'X') {
      // 영숫자 자리
      if (/[A-Za-z0-9]/.test(valueChar)) {
        maskedValue += valueChar
        valueIndex++
      } else {
        break
      }
    } else {
      // 고정 문자 (하이픈, 콜론 등)
      maskedValue += patternChar
    }
  }

  return maskedValue
}

/**
 * 마스크에서 실제 값만 추출
 */
export function extractValue(maskedValue: string, pattern: string): string {
  if (!maskedValue || !pattern) return maskedValue

  let extractedValue = ''
  let patternIndex = 0

  for (let i = 0; i < maskedValue.length && patternIndex < pattern.length; i++) {
    const char = maskedValue[i]
    const patternChar = pattern[patternIndex]

    if (['0', 'A', 'a', 'X'].includes(patternChar)) {
      extractedValue += char
      patternIndex++
    } else if (char === patternChar) {
      patternIndex++
    } else {
      // 패턴과 맞지 않는 경우 건너뛰기
      continue
    }
  }

  return extractedValue
}

// =============================================================================
// FORMATTING FUNCTIONS
// =============================================================================

/**
 * 전화번호 포맷팅
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/[^\d]/g, '')
  
  if (digits.length === 0) return ''
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length <= 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
}

/**
 * 환자 식별번호 포맷팅
 */
export function formatPatientId(value: string): string {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  
  if (clean.length === 0) return ''
  if (clean.length <= 3) return clean
  if (clean.length <= 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`
  
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`
}

/**
 * 시간 포맷팅 (HH:MM)
 */
export function formatTime(value: string): string {
  const digits = value.replace(/[^\d]/g, '')
  
  if (digits.length === 0) return ''
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`
  
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD)
 */
export function formatDate(value: string): string {
  const digits = value.replace(/[^\d]/g, '')
  
  if (digits.length === 0) return ''
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
  
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}

/**
 * 금액 포맷팅 (천 단위 콤마)
 */
export function formatCurrency(value: string | number): string {
  const numValue = typeof value === 'string' ? value.replace(/[^\d]/g, '') : value.toString()
  
  if (!numValue || numValue === '0') return '0'
  
  return parseInt(numValue).toLocaleString('ko-KR')
}

/**
 * 주민등록번호 앞자리 포맷팅
 */
export function formatBirthNumber(value: string): string {
  const digits = value.replace(/[^\d]/g, '')
  
  if (digits.length === 0) return ''
  if (digits.length <= 6) return digits
  if (digits.length <= 7) return `${digits.slice(0, 6)}-${digits.slice(6)}`
  
  return `${digits.slice(0, 6)}-${digits.slice(6, 7)}`
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * 전화번호 유효성 검사
 */
export function validatePhone(value: string): boolean {
  const digits = value.replace(/[^\d]/g, '')
  return /^01[0-9]-?\d{3,4}-?\d{4}$/.test(value) && digits.length >= 10 && digits.length <= 11
}

/**
 * 환자 식별번호 유효성 검사
 */
export function validatePatientId(value: string): boolean {
  return /^[A-Z]{3}-?\d{4}$/.test(value.toUpperCase())
}

/**
 * 시간 유효성 검사
 */
export function validateTime(value: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
  if (!timeRegex.test(value)) return false
  
  const [hours, minutes] = value.split(':').map(Number)
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

/**
 * 날짜 유효성 검사
 */
export function validateDate(value: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(value)) return false
  
  const date = new Date(value)
  return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

// =============================================================================
// REACT HOOK FOR INPUT MASKING
// =============================================================================

/**
 * 입력 마스킹을 위한 React Hook
 */
export function useMaskedInput(
  initialValue: string = '',
  maskType: keyof typeof MASK_PATTERNS | string,
  options: FormatOptions = {}
) {
  const [value, setValue] = useState(initialValue)
  const [isValid, setIsValid] = useState(true)

  const maskPattern = typeof maskType === 'string' && MASK_PATTERNS[maskType] 
    ? MASK_PATTERNS[maskType] 
    : null

  const handleChange = useCallback((inputValue: string) => {
    let processedValue = inputValue

    // 길이 제한
    if (options.maxLength && processedValue.length > options.maxLength) {
      processedValue = processedValue.slice(0, options.maxLength)
    }

    // 변환 적용
    if (options.transform) {
      switch (options.transform) {
        case 'uppercase':
          processedValue = processedValue.toUpperCase()
          break
        case 'lowercase':
          processedValue = processedValue.toLowerCase()
          break
        case 'capitalize':
          processedValue = processedValue.charAt(0).toUpperCase() + processedValue.slice(1).toLowerCase()
          break
      }
    }

    // 마스크 패턴 적용
    if (maskPattern) {
      if (maskPattern.transform) {
        processedValue = maskPattern.transform(processedValue)
      }
      if (maskPattern.pattern) {
        processedValue = applyMask(processedValue, maskPattern.pattern)
      }
    } else if (options.mask) {
      processedValue = applyMask(processedValue, options.mask)
    }

    setValue(processedValue)

    // 유효성 검사
    if (maskPattern?.validate) {
      setIsValid(maskPattern.validate(processedValue))
    } else if (options.minLength) {
      setIsValid(processedValue.length >= options.minLength)
    } else {
      setIsValid(true)
    }
  }, [maskPattern, options])

  const reset = useCallback(() => {
    setValue('')
    setIsValid(true)
  }, [])

  const getRawValue = useCallback(() => {
    if (maskPattern?.pattern) {
      return extractValue(value, maskPattern.pattern)
    }
    return value
  }, [value, maskPattern])

  return {
    value,
    isValid,
    handleChange,
    reset,
    getRawValue,
    placeholder: maskPattern?.placeholder || options.placeholder
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * 커서 위치 계산 (마스킹 후)
 */
export function calculateCursorPosition(
  oldValue: string,
  newValue: string,
  oldCursor: number
): number {
  // 간단한 구현: 새 값의 길이에 비례하여 커서 위치 조정
  const ratio = newValue.length / Math.max(oldValue.length, 1)
  return Math.min(Math.round(oldCursor * ratio), newValue.length)
}

/**
 * 마스킹된 값에서 실제 입력 문자 수 계산
 */
export function getInputCharacterCount(value: string, pattern: string): number {
  let count = 0
  let patternIndex = 0

  for (let i = 0; i < value.length && patternIndex < pattern.length; i++) {
    const patternChar = pattern[patternIndex]
    
    if (['0', 'A', 'a', 'X'].includes(patternChar)) {
      count++
      patternIndex++
    } else {
      patternIndex++
    }
  }

  return count
}

/**
 * 포맷팅 함수 매핑
 */
export const formatters = {
  phone: formatPhone,
  patientId: formatPatientId,
  time: formatTime,
  date: formatDate,
  currency: formatCurrency,
  birthNumber: formatBirthNumber
} as const

/**
 * 검증 함수 매핑
 */
export const validators = {
  phone: validatePhone,
  patientId: validatePatientId,
  time: validateTime,
  date: validateDate
} as const

// =============================================================================
// EXPORT TYPES
// =============================================================================

export type FormatterType = keyof typeof formatters
export type ValidatorType = keyof typeof validators
export type MaskType = keyof typeof MASK_PATTERNS 