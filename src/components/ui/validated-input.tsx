import React, { forwardRef, useState, useEffect } from 'react'
import { Input, InputProps } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff,
  HelpCircle
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface ValidatedInputProps extends Omit<InputProps, 'onChange'> {
  label?: string
  error?: string
  helperText?: string
  isValid?: boolean
  isValidating?: boolean
  required?: boolean
  showValidationIcon?: boolean
  validationDebounceMs?: number
  onChange?: (value: string) => void
  onValidationChange?: (isValid: boolean) => void
  mask?: string | ((value: string) => string)
  formatOnBlur?: (value: string) => string
  hint?: string
  maxLength?: number
  showCharCount?: boolean
}

/**
 * 검증 기능이 내장된 입력 컴포넌트
 */
export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({
    label,
    error,
    helperText,
    isValid,
    isValidating,
    required,
    showValidationIcon = true,
    onChange,
    mask,
    formatOnBlur,
    hint,
    maxLength,
    showCharCount,
    className,
    ...props
  }, ref) => {
    const [value, setValue] = useState(props.value || '')
    const [charCount, setCharCount] = useState(0)

    useEffect(() => {
      if (typeof props.value === 'string') {
        setValue(props.value)
        setCharCount(props.value.length)
      }
    }, [props.value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value

      // 최대 길이 제한
      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength)
      }

      // 마스킹 적용
      if (mask) {
        if (typeof mask === 'function') {
          newValue = mask(newValue)
        } else {
          newValue = applyMask(newValue, mask)
        }
      }

      setValue(newValue)
      setCharCount(newValue.length)
      onChange?.(newValue)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (formatOnBlur) {
        const formatted = formatOnBlur(value)
        setValue(formatted)
        onChange?.(formatted)
      }
      props.onBlur?.(e)
    }

    const getValidationIcon = () => {
      if (!showValidationIcon) return null

      if (isValidating) {
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      }

      if (error) {
        return <AlertCircle className="h-4 w-4 text-destructive" />
      }

      if (isValid) {
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      }

      return null
    }

    const inputClassName = cn(
      'transition-colors',
      error && 'border-destructive focus-visible:ring-destructive',
      isValid && !error && 'border-green-500 focus-visible:ring-green-500',
      className
    )

    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center gap-2">
            <Label htmlFor={props.id} className="text-sm font-medium">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {hint && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="focus-ring rounded-full"
                      aria-label="도움말 보기"
                      aria-describedby={`${props.id}-hint`}
                    >
                      <HelpCircle className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent id={`${props.id}-hint`}>
                    <p className="text-xs">{hint}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}

        <div className="relative">
          <Input
            {...props}
            ref={ref}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={inputClassName}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${props.id}-error` : 
              helperText ? `${props.id}-helper` : 
              undefined
            }
          />
          
          {getValidationIcon() && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getValidationIcon()}
            </div>
          )}
        </div>

        <div className="flex justify-between items-start">
          <div className="flex-1">
            {error && (
              <Alert variant="destructive" className="py-2" id={`${props.id}-error`}>
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {helperText && !error && (
              <p 
                className="text-xs text-muted-foreground" 
                id={`${props.id}-helper`}
              >
                {helperText}
              </p>
            )}
          </div>

          {showCharCount && maxLength && (
            <Badge 
              variant={charCount > maxLength * 0.9 ? 'destructive' : 'secondary'}
              className="text-xs ml-2"
            >
              {charCount}/{maxLength}
            </Badge>
          )}
        </div>
      </div>
    )
  }
)

ValidatedInput.displayName = 'ValidatedInput'

/**
 * 비밀번호 입력 컴포넌트
 */
export interface ValidatedPasswordInputProps extends ValidatedInputProps {
  showPasswordToggle?: boolean
  strengthIndicator?: boolean
}

export const ValidatedPasswordInput = forwardRef<HTMLInputElement, ValidatedPasswordInputProps>(
  ({ showPasswordToggle = true, strengthIndicator = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [strength, setStrength] = useState(0)

    const calculatePasswordStrength = (password: string): number => {
      let score = 0
      
      // 길이
      if (password.length >= 8) score += 1
      if (password.length >= 12) score += 1
      
      // 문자 유형
      if (/[a-z]/.test(password)) score += 1
      if (/[A-Z]/.test(password)) score += 1
      if (/\d/.test(password)) score += 1
      if (/[^a-zA-Z0-9]/.test(password)) score += 1
      
      return Math.min(score, 5)
    }

    const handlePasswordChange = (value: string) => {
      setStrength(calculatePasswordStrength(value))
      props.onChange?.(value)
    }

    const getStrengthColor = (strength: number): string => {
      switch (strength) {
        case 0:
        case 1: return 'bg-red-500'
        case 2: return 'bg-orange-500'
        case 3: return 'bg-yellow-500'
        case 4: return 'bg-blue-500'
        case 5: return 'bg-green-500'
        default: return 'bg-gray-300'
      }
    }

    const getStrengthText = (strength: number): string => {
      switch (strength) {
        case 0:
        case 1: return '매우 약함'
        case 2: return '약함'
        case 3: return '보통'
        case 4: return '강함'
        case 5: return '매우 강함'
        default: return ''
      }
    }

    return (
      <div className="space-y-2">
        <ValidatedInput
          {...props}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          onChange={handlePasswordChange}
          className={cn(
            showPasswordToggle && 'pr-10',
            props.className
          )}
        />

        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-ring"
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            aria-pressed={showPassword}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}

        {strengthIndicator && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    level <= strength ? getStrengthColor(strength) : 'bg-muted'
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              비밀번호 강도: {getStrengthText(strength)}
            </p>
          </div>
        )}
      </div>
    )
  }
)

ValidatedPasswordInput.displayName = 'ValidatedPasswordInput'

/**
 * 마스킹 함수들
 */
export const masks = {
  phone: (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  },

  postcode: (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}`
  },

  credit: (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{4})(?=\d)/g, '$1-')
  },

  date: (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 4) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`
  }
}

/**
 * 기본 마스킹 적용 함수
 */
function applyMask(value: string, mask: string): string {
  let masked = ''
  let valueIndex = 0
  
  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    const maskChar = mask[i]
    const valueChar = value[valueIndex]
    
    if (maskChar === '9') {
      // 숫자만 허용
      if (/\d/.test(valueChar)) {
        masked += valueChar
        valueIndex++
      } else {
        valueIndex++
        i-- // 마스크 위치 유지
      }
    } else if (maskChar === 'A') {
      // 영문자만 허용
      if (/[a-zA-Z]/.test(valueChar)) {
        masked += valueChar
        valueIndex++
      } else {
        valueIndex++
        i-- // 마스크 위치 유지
      }
    } else if (maskChar === '*') {
      // 모든 문자 허용
      masked += valueChar
      valueIndex++
    } else {
      // 고정 문자
      masked += maskChar
    }
  }
  
  return masked
} 