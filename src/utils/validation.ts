// Validation utilities for forms and data

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation
export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

// Phone number validation (Korean format)
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(010|011|016|017|018|019)-?\d{3,4}-?\d{4}$/
  return phoneRegex.test(phone)
}

// Date validation
export const isValidDate = (date: string): boolean => {
  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime())
}

// Required field validation
export const isRequired = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && value.trim() !== ''
}

// Length validation
export const isValidLength = (
  value: string,
  min: number,
  max?: number
): boolean => {
  if (max) {
    return value.length >= min && value.length <= max
  }
  return value.length >= min
}

// Number validation
export const isValidNumber = (value: string | number): boolean => {
  return !isNaN(Number(value))
}

// Range validation
export const isInRange = (
  value: number,
  min: number,
  max: number
): boolean => {
  return value >= min && value <= max
}

// Patient ID validation (Korean resident registration number format)
export const isValidPatientId = (id: string): boolean => {
  // Basic format validation: XXXXXX-XXXXXXX
  const idRegex = /^\d{6}-\d{7}$/
  return idRegex.test(id)
}

// Goal progress validation (0-100)
export const isValidProgress = (progress: number): boolean => {
  return isInRange(progress, 0, 100)
} 