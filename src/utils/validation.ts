
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(010|011|016|017|018|019)-?\d{3,4}-?\d{4}$/
  return phoneRegex.test(phone)
}

export const isValidDate = (date: string): boolean => {
  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime())
}

export const isRequired = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && value.trim() !== ''
}

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

export const isValidNumber = (value: string | number): boolean => {
  return !isNaN(Number(value))
}

export const isInRange = (
  value: number,
  min: number,
  max: number
): boolean => {
  return value >= min && value <= max
}

export const isValidPatientId = (id: string): boolean => {
  const idRegex = /^\d{6}-\d{7}$/
  return idRegex.test(id)
}

export const isValidProgress = (progress: number): boolean => {
  return isInRange(progress, 0, 100)
} 