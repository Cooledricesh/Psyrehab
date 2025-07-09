import { z } from 'zod'

// 공통 정규식 패턴
export const REGEX_PATTERNS = {
  // 한국 전화번호 (010-1234-5678, 02-123-4567, 031-123-4567 등)
  PHONE_KR: /^(\+82-?)?0?([1-9]{1}[0-9]{1,2})-?([0-9]{3,4})-?([0-9]{4})$/,
  
  // 이메일 (RFC 표준)
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // 환자 식별번호 (P2024001, PAT-2024-001 등)
  PATIENT_ID: /^(P|PAT)[-]?20\d{2}[-]?\d{3,6}$/,
  
  // 사회복지사 ID (SW2024001, SWK-2024-001 등)
  SOCIAL_WORKER_ID: /^(SW|SWK)[-]?20\d{2}[-]?\d{3,6}$/,
  
  // 한글 이름 (2-10자)
  NAME_KR: /^[가-힣]{2,10}$/,
  
  // 영문 이름 (2-50자)
  NAME_EN: /^[a-zA-Z\s]{2,50}$/,
  
  // 한글+영문 이름
  NAME_MIXED: /^[가-힣a-zA-Z\s]{2,50}$/,
  
  // 숫자만
  NUMBERS_ONLY: /^\d+$/,
  
  // 알파벳+숫자
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  
  // 한국 우편번호 (12345 또는 123-456)
  POSTAL_CODE_KR: /^\d{5}$|^\d{3}-\d{3}$/,
  
  // URL
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/
}

// 공통 에러 메시지
export const ERROR_MESSAGES = {
  REQUIRED: '필수 입력 항목입니다',
  INVALID_FORMAT: '올바른 형식이 아닙니다',
  INVALID_EMAIL: '올바른 이메일 주소를 입력해주세요',
  INVALID_PHONE: '올바른 전화번호를 입력해주세요 (예: 010-1234-5678)',
  INVALID_NAME: '이름은 2자 이상 50자 이하로 입력해주세요',
  INVALID_PATIENT_ID: '올바른 환자 식별번호 형식이 아닙니다 (예: P2024001)',
  INVALID_SOCIAL_WORKER_ID: '올바른 사회복지사 ID 형식이 아닙니다 (예: SW2024001)',
  MIN_LENGTH: (min: number) => `최소 ${min}자 이상 입력해주세요`,
  MAX_LENGTH: (max: number) => `최대 ${max}자까지 입력 가능합니다`,
  MIN_VALUE: (min: number) => `최소값은 ${min}입니다`,
  MAX_VALUE: (max: number) => `최대값은 ${max}입니다`,
  INVALID_DATE: '올바른 날짜를 입력해주세요',
  FUTURE_DATE_NOT_ALLOWED: '미래 날짜는 입력할 수 없습니다',
  PAST_DATE_NOT_ALLOWED: '과거 날짜는 입력할 수 없습니다',
  INVALID_AGE: '올바른 나이를 입력해주세요 (0-120세)',
  PASSWORD_TOO_WEAK: '비밀번호는 8자 이상이며 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다',
  PASSWORDS_DO_NOT_MATCH: '비밀번호가 일치하지 않습니다',
  INVALID_URL: '올바른 URL을 입력해주세요'
}

// 기본 검증 스키마들
export const commonValidations = {
  // 이메일 검증
  email: z
    .string()
    .email(ERROR_MESSAGES.INVALID_EMAIL)
    .optional()
    .or(z.literal('')),

  // 필수 이메일 검증
  emailRequired: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED)
    .email(ERROR_MESSAGES.INVALID_EMAIL),

  // 전화번호 검증
  phone: z
    .string()
    .regex(REGEX_PATTERNS.PHONE_KR, ERROR_MESSAGES.INVALID_PHONE)
    .optional()
    .or(z.literal('')),

  // 필수 전화번호 검증
  phoneRequired: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED)
    .regex(REGEX_PATTERNS.PHONE_KR, ERROR_MESSAGES.INVALID_PHONE),

  // 한글 이름 검증
  nameKorean: z
    .string()
    .min(2, ERROR_MESSAGES.MIN_LENGTH(2))
    .max(50, ERROR_MESSAGES.MAX_LENGTH(50))
    .regex(REGEX_PATTERNS.NAME_KR, '한글 이름을 입력해주세요'),

  // 혼합 이름 검증 (한글+영문)
  nameMixed: z
    .string()
    .min(2, ERROR_MESSAGES.MIN_LENGTH(2))
    .max(50, ERROR_MESSAGES.MAX_LENGTH(50))
    .regex(REGEX_PATTERNS.NAME_MIXED, ERROR_MESSAGES.INVALID_NAME),

  // 환자 식별번호 검증
  patientId: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED)
    .max(20, ERROR_MESSAGES.MAX_LENGTH(20))
    .regex(REGEX_PATTERNS.PATIENT_ID, ERROR_MESSAGES.INVALID_PATIENT_ID),

  // 사회복지사 ID 검증
  socialWorkerId: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED)
    .max(20, ERROR_MESSAGES.MAX_LENGTH(20))
    .regex(REGEX_PATTERNS.SOCIAL_WORKER_ID, ERROR_MESSAGES.INVALID_SOCIAL_WORKER_ID),

  // 비밀번호 검증
  password: z
    .string()
    .min(8, ERROR_MESSAGES.MIN_LENGTH(8))
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      ERROR_MESSAGES.PASSWORD_TOO_WEAK
    ),

  // URL 검증
  url: z
    .string()
    .regex(REGEX_PATTERNS.URL, ERROR_MESSAGES.INVALID_URL)
    .optional()
    .or(z.literal('')),

  // 날짜 검증 (과거/현재만)
  dateNotFuture: z
    .string()
    .refine((date) => {
      if (!date) return true
      const inputDate = new Date(date)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // 오늘 끝까지 허용
      return inputDate <= today
    }, ERROR_MESSAGES.FUTURE_DATE_NOT_ALLOWED),

  // 날짜 검증 (미래/현재만)
  dateNotPast: z
    .string()
    .refine((date) => {
      if (!date) return true
      const inputDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // 오늘부터 허용
      return inputDate >= today
    }, ERROR_MESSAGES.PAST_DATE_NOT_ALLOWED),

  // 생년월일 검증 (0-120세)
  dateOfBirth: z
    .string()
    .refine((date) => {
      if (!date) return true
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      let calculatedAge = age
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--
      }
      
      return calculatedAge >= 0 && calculatedAge <= 120
    }, ERROR_MESSAGES.INVALID_AGE),

  // 텍스트 길이 제한
  textLength: (min: number, max: number) => z
    .string()
    .min(min, ERROR_MESSAGES.MIN_LENGTH(min))
    .max(max, ERROR_MESSAGES.MAX_LENGTH(max)),

  // 숫자 범위 검증
  numberRange: (min: number, max: number) => z
    .number()
    .min(min, ERROR_MESSAGES.MIN_VALUE(min))
    .max(max, ERROR_MESSAGES.MAX_VALUE(max)),

  // 양수 검증
  positiveNumber: z
    .number()
    .positive('양수만 입력 가능합니다'),

  // 음이 아닌 수 검증
  nonNegativeNumber: z
    .number()
    .nonnegative('0 이상의 숫자만 입력 가능합니다'),

  // 퍼센트 검증 (0-100)
  percentage: z
    .number()
    .min(0, '0% 이상이어야 합니다')
    .max(100, '100% 이하여야 합니다'),

  // 우편번호 검증
  postalCode: z
    .string()
    .regex(REGEX_PATTERNS.POSTAL_CODE_KR, '올바른 우편번호를 입력해주세요 (예: 12345)')
    .optional()
    .or(z.literal(''))
}

// 조건부 검증 헬퍼
export const conditionalValidation = {
  // 특정 조건에서만 필수
  requiredIf: <T>(condition: boolean, schema: z.ZodType<T>) =>
    condition ? schema : schema.optional(),

  // 특정 값일 때만 검증
  validateIf: <T>(condition: boolean, schema: z.ZodType<T>, fallback: z.ZodType<T>) =>
    condition ? schema : fallback,

  // 다른 필드 값에 따른 조건부 검증
  dependentValidation: <T>(
    dependentField: string,
    dependentValue: unknown,
    schema: z.ZodType<T>,
    fallback?: z.ZodType<T>
  ) => z.any().refine((data) => {
    if (data[dependentField] === dependentValue) {
      return schema.safeParse(data).success
    }
    return fallback ? fallback.safeParse(data).success : true
  })
}

// 배열 검증 헬퍼
export const arrayValidations = {
  // 중복 없는 문자열 배열
  uniqueStrings: (minLength = 0, maxLength = 100) => z
    .array(z.string().min(1, '빈 값은 허용되지 않습니다'))
    .min(minLength, `최소 ${minLength}개 이상 입력해주세요`)
    .max(maxLength, `최대 ${maxLength}개까지 입력 가능합니다`)
    .refine((arr) => new Set(arr).size === arr.length, '중복된 항목이 있습니다'),

  // 선택된 옵션들 검증
  multiSelect: <T extends string>(options: readonly T[], min = 1, max = 10) => z
    .array(z.enum(options as [T, ...T[]]))
    .min(min, `최소 ${min}개 이상 선택해주세요`)
    .max(max, `최대 ${max}개까지 선택 가능합니다`)
}

// 비밀번호 확인 검증
export const passwordConfirmSchema = (passwordField = 'password') => ({
  confirmPassword: z.string()
    .min(1, ERROR_MESSAGES.REQUIRED)
    .refine((val, ctx) => {
      const password = (ctx.parent as unknown)[passwordField]
      return val === password
    }, ERROR_MESSAGES.PASSWORDS_DO_NOT_MATCH)
})

// 폼 스키마 합성 헬퍼
export const createFormSchema = <T extends z.ZodRawShape>(shape: T) => {
  return z.object(shape)
}

// 동적 스키마 생성 헬퍼
export const createDynamicSchema = <T extends z.ZodRawShape>(
  baseShape: T,
  additionalFields?: Partial<T>
) => {
  return z.object({
    ...baseShape,
    ...additionalFields
  })
}

// 스키마 확장 헬퍼
export const extendSchema = <T extends z.ZodType, U extends z.ZodRawShape>(
  baseSchema: T,
  additionalShape: U
) => {
  if (baseSchema instanceof z.ZodObject) {
    return baseSchema.extend(additionalShape)
  }
  throw new Error('Base schema must be a ZodObject to extend')
}

// 검증 결과 타입 추출 헬퍼
export type InferSchemaType<T extends z.ZodType> = z.infer<T>

// 검증 실행 헬퍼
export const validateData = <T>(schema: z.ZodType<T>, data: unknown) => {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: null
    }
  }
  
  return {
    success: false,
    data: null,
    errors: result.error.errors
  }
}

// 필드별 에러 추출 헬퍼
export const extractFieldErrors = (errors: z.ZodError) => {
  const fieldErrors: Record<string, string> = {}
  
  errors.errors.forEach((error) => {
    const field = error.path.join('.')
    if (!fieldErrors[field]) {
      fieldErrors[field] = error.message
    }
  })
  
  return fieldErrors
} 