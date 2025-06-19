import { 
  PASSWORD_REQUIREMENTS, 
  AUTH_ERROR_CODES, 
  AUTH_ERROR_MESSAGES,
  RATE_LIMITS 
} from '@/constants/auth'
import type { AuthErrorCode, UserRole } from '@/types/auth'

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password strength validation
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
} {
  const errors: string[] = []
  
  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    errors.push(`비밀번호는 최소 ${PASSWORD_REQUIREMENTS.MIN_LENGTH}자 이상이어야 합니다.`)
  }
  
  // Check uppercase
  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('대문자를 포함해야 합니다.')
  }
  
  // Check lowercase
  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('소문자를 포함해야 합니다.')
  }
  
  // Check number
  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('숫자를 포함해야 합니다.')
  }
  
  // Check special character
  if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL_CHAR && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('특수문자를 포함해야 합니다.')
  }
  
  // Check forbidden patterns
  const lowercasePassword = password.toLowerCase()
  for (const pattern of PASSWORD_REQUIREMENTS.FORBIDDEN_PATTERNS) {
    if (lowercasePassword.includes(pattern)) {
      errors.push(`"${pattern}"과 같은 일반적인 패턴은 사용할 수 없습니다.`)
    }
  }
  
  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  if (errors.length === 0) {
    const score = calculatePasswordScore(password)
    if (score >= 80) strength = 'strong'
    else if (score >= 60) strength = 'medium'
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
}

// Calculate password strength score
function calculatePasswordScore(password: string): number {
  let score = 0
  
  // Length bonus
  score += Math.min(password.length * 2, 20)
  
  // Character variety bonus
  if (/[a-z]/.test(password)) score += 10
  if (/[A-Z]/.test(password)) score += 10
  if (/\d/.test(password)) score += 10
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15
  
  // Complexity bonus
  const uniqueChars = new Set(password).size
  score += uniqueChars * 2
  
  // Pattern penalty
  if (/(.)\1{2,}/.test(password)) score -= 10 // Repeated characters
  if (/012|123|234|345|456|567|678|789|890/.test(password)) score -= 10 // Sequential numbers
  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/.test(password.toLowerCase())) score -= 10 // Sequential letters
  
  return Math.max(0, Math.min(100, score))
}

// Password confirmation validation
export function validatePasswordConfirmation(password: string, confirmPassword: string): {
  isValid: boolean
  error?: string
} {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: '비밀번호가 일치하지 않습니다.'
    }
  }
  
  return { isValid: true }
}

// Full name validation
export function validateFullName(name: string): {
  isValid: boolean
  error?: string
} {
  if (!name || name.trim().length < 2) {
    return {
      isValid: false,
      error: '이름은 2자 이상 입력해주세요.'
    }
  }
  
  if (name.length > 50) {
    return {
      isValid: false,
      error: '이름은 50자 이하로 입력해주세요.'
    }
  }
  
  // Check for valid characters (Korean, English, spaces)
  if (!/^[가-힣a-zA-Z\s]+$/.test(name)) {
    return {
      isValid: false,
      error: '이름은 한글, 영문, 공백만 사용할 수 있습니다.'
    }
  }
  
  return { isValid: true }
}

// Employee ID validation (for social workers)
export function validateEmployeeId(employeeId: string): {
  isValid: boolean
  error?: string
} {
  if (!employeeId || employeeId.trim().length === 0) {
    return {
      isValid: false,
      error: '직원 번호를 입력해주세요.'
    }
  }
  
  // Employee ID format: SW-YYYY-XXXX (e.g., SW-2024-0001)
  const employeeIdRegex = /^SW-\d{4}-\d{4}$/
  if (!employeeIdRegex.test(employeeId)) {
    return {
      isValid: false,
      error: '직원 번호 형식이 올바르지 않습니다. (예: SW-2024-0001)'
    }
  }
  
  return { isValid: true }
}

// Patient identifier validation
export function validatePatientIdentifier(identifier: string): {
  isValid: boolean
  error?: string
} {
  if (!identifier || identifier.trim().length === 0) {
    return {
      isValid: false,
      error: '환자 식별번호를 입력해주세요.'
    }
  }
  
  // Patient ID format: P-YYYY-XXXX (e.g., P-2024-0001)
  const patientIdRegex = /^P-\d{4}-\d{4}$/
  if (!patientIdRegex.test(identifier)) {
    return {
      isValid: false,
      error: '환자 식별번호 형식이 올바르지 않습니다. (예: P-2024-0001)'
    }
  }
  
  return { isValid: true }
}

// Phone number validation
export function validatePhoneNumber(phone: string): {
  isValid: boolean
  error?: string
} {
  if (!phone || phone.trim().length === 0) {
    return { isValid: true } // Phone is optional
  }
  
  // Korean phone number format: 010-XXXX-XXXX or 02-XXX-XXXX or 031-XXX-XXXX etc.
  const phoneRegex = /^(\d{2,3})-(\d{3,4})-(\d{4})$/
  if (!phoneRegex.test(phone)) {
    return {
      isValid: false,
      error: '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)'
    }
  }
  
  return { isValid: true }
}

// Date of birth validation
export function validateDateOfBirth(dateOfBirth: string): {
  isValid: boolean
  error?: string
} {
  if (!dateOfBirth) {
    return { isValid: true } // Optional field
  }
  
  const date = new Date(dateOfBirth)
  const now = new Date()
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: '유효한 날짜를 입력해주세요.'
    }
  }
  
  // Check if date is not in the future
  if (date > now) {
    return {
      isValid: false,
      error: '생년월일은 미래 날짜일 수 없습니다.'
    }
  }
  
  // Check reasonable age range (0-120 years)
  const age = now.getFullYear() - date.getFullYear()
  if (age > 120) {
    return {
      isValid: false,
      error: '유효한 생년월일을 입력해주세요.'
    }
  }
  
  return { isValid: true }
}

// Rate limiting helper
export function getRateLimitKey(type: 'signin' | 'signup' | 'reset', identifier: string): string {
  return `rate_limit_${type}_${identifier}`
}

export function checkRateLimit(type: 'signin' | 'signup' | 'reset', identifier: string): {
  allowed: boolean
  remainingAttempts?: number
  resetTime?: number
} {
  const key = getRateLimitKey(type, identifier)
  const stored = localStorage.getItem(key)
  
  if (!stored) {
    return { allowed: true }
  }
  
  const data = JSON.parse(stored)
  const now = Date.now()
  
  // Check if lockout period has expired
  if (data.lockedUntil && now > data.lockedUntil) {
    localStorage.removeItem(key)
    return { allowed: true }
  }
  
  // Check if still locked out
  if (data.lockedUntil && now <= data.lockedUntil) {
    return {
      allowed: false,
      resetTime: data.lockedUntil
    }
  }
  
  // Check attempts within time window
  const maxAttempts = RATE_LIMITS[`${type.toUpperCase()}_ATTEMPTS` as keyof typeof RATE_LIMITS] as number
  const remainingAttempts = maxAttempts - data.attempts
  
  return {
    allowed: remainingAttempts > 0,
    remainingAttempts
  }
}

export function recordAttempt(type: 'signin' | 'signup' | 'reset', identifier: string, success: boolean): void {
  if (success) {
    // Clear rate limit on success
    localStorage.removeItem(getRateLimitKey(type, identifier))
    return
  }
  
  const key = getRateLimitKey(type, identifier)
  const stored = localStorage.getItem(key)
  const now = Date.now()
  
  const data = stored ? JSON.parse(stored) : { attempts: 0, firstAttempt: now }
  
  data.attempts += 1
  data.lastAttempt = now
  
  const maxAttempts = RATE_LIMITS[`${type.toUpperCase()}_ATTEMPTS` as keyof typeof RATE_LIMITS] as number
  
  if (data.attempts >= maxAttempts) {
    data.lockedUntil = now + RATE_LIMITS.LOCKOUT_DURATION
  }
  
  localStorage.setItem(key, JSON.stringify(data))
}

// Error message helper
export function getAuthErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error
  }
  
  if (error?.code && AUTH_ERROR_MESSAGES[error.code as AuthErrorCode]) {
    return AUTH_ERROR_MESSAGES[error.code as AuthErrorCode]
  }
  
  if (error?.message) {
    // Map common Supabase errors
    const message = error.message.toLowerCase()
    
    if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
      return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.INVALID_CREDENTIALS]
    }
    
    if (message.includes('email not confirmed') || message.includes('email confirmation')) {
      return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED]
    }
    
    if (message.includes('too many requests') || message.includes('rate limit')) {
      return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.TOO_MANY_REQUESTS]
    }
    
    if (message.includes('weak password') || message.includes('password')) {
      return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.WEAK_PASSWORD]
    }
    
    if (message.includes('email') && message.includes('already')) {
      return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS]
    }
    
    return error.message
  }
  
  return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.UNKNOWN_ERROR]
}

// User role helpers
export function isAdminRole(role: UserRole): boolean {
  return role === 'administrator'
}

export function isStaffRole(role: UserRole): boolean {
  return role === 'administrator' || role === 'social_worker'
}

export function isClientRole(role: UserRole): boolean {
  return role === 'patient'
}

// Session helpers
export function isSessionExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt * 1000
}

export function shouldRefreshToken(expiresAt: number, threshold: number = 300): boolean {
  return Date.now() >= (expiresAt - threshold) * 1000
}

// Generate secure random password
export function generateRandomPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = lowercase + uppercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
} 