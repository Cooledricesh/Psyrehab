import { z } from 'zod'
import { AppError, parseError } from '../error-handling'

// =============================================================================
// SERVER-SIDE VALIDATION MIDDLEWARE
// =============================================================================

/**
 * 서버 사이드 검증 응답 인터페이스
 */
export interface ValidationResult<T = unknown> {
  success: boolean
  data?: T
  error?: AppError
  errors?: ValidationError[]
}

/**
 * 개별 검증 에러 인터페이스
 */
export interface ValidationError {
  field: string
  value: unknown
  message: string
  code: string
}

/**
 * 검증 미들웨어 옵션
 */
export interface ValidationMiddlewareOptions {
  sanitize?: boolean
  skipUnknown?: boolean
  customValidators?: ValidationFunction[]
}

/**
 * 커스텀 검증 함수 타입
 */
export type ValidationFunction<T = unknown> = (data: T) => Promise<ValidationError[]> | ValidationError[]

// =============================================================================
// CORE VALIDATION MIDDLEWARE
// =============================================================================

/**
 * Zod 스키마를 사용한 기본 검증 미들웨어
 */
export function createValidationMiddleware<T>(
  schema: z.ZodSchema<T>,
  options: ValidationMiddlewareOptions = {}
) {
  return async (data: unknown): Promise<ValidationResult<T>> => {
    try {
      // 1. 기본 스키마 검증
      const result = schema.safeParse(data)
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          value: err.code === 'invalid_type' ? data : getValueAtPath(data, err.path),
          message: getKoreanErrorMessage(err.code, err.message),
          code: err.code
        }))

        return {
          success: false,
          errors
        }
      }

      let validatedData = result.data

      // 2. 데이터 정화 (선택적)
      if (options.sanitize) {
        validatedData = sanitizeData(validatedData)
      }

      // 3. 커스텀 검증 실행
      if (options.customValidators) {
        const customErrors: ValidationError[] = []
        
        for (const validator of options.customValidators) {
          const errors = await validator(validatedData)
          customErrors.push(...errors)
        }

        if (customErrors.length > 0) {
          return {
            success: false,
            errors: customErrors
          }
        }
      }

      return {
        success: true,
        data: validatedData
      }

    } catch {
      return {
        success: false,
        error: parseError(error)
      }
    }
  }
}

/**
 * 비동기 검증을 위한 헬퍼 함수
 */
export async function validateAsync<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  customValidators: ValidationFunction[] = []
): Promise<ValidationResult<T>> {
  const middleware = createValidationMiddleware(schema, { 
    sanitize: true, 
    customValidators 
  })
  return await middleware(data)
}

// =============================================================================
// BUSINESS LOGIC VALIDATORS
// =============================================================================

/**
 * 환자 관련 비즈니스 검증
 */
export const patientValidators = {
  /**
   * 환자 식별번호 중복 검증
   */
  uniquePatientIdentifier: (supabase: unknown) => async (data: unknown): Promise<ValidationError[]> => {
    if (!data.patient_identifier) return []

    const { data: existing } = await supabase
      .from('patients')
      .select('id')
      .eq('patient_identifier', data.patient_identifier)
      .single()

    if (existing && existing.id !== data.id) {
      return [{
        field: 'patient_identifier',
        value: data.patient_identifier,
        message: '이미 존재하는 환자 식별번호입니다',
        code: 'DUPLICATE_IDENTIFIER'
      }]
    }

    return []
  },

  /**
   * 환자 나이 검증
   */
  validatePatientAge: () => async (data: unknown): Promise<ValidationError[]> => {
    if (!data.date_of_birth) return []

    const age = new Date().getFullYear() - new Date(data.date_of_birth).getFullYear()
    
    if (age < 0 || age > 120) {
      return [{
        field: 'date_of_birth',
        value: data.date_of_birth,
        message: '올바르지 않은 생년월일입니다',
        code: 'INVALID_AGE'
      }]
    }

    return []
  },

  /**
   * 사회복지사 배정 검증
   */
  validateSocialWorkerAssignment: (supabase: unknown) => async (data: unknown): Promise<ValidationError[]> => {
    if (!data.social_worker_id) return []

    const { data: socialWorker } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', data.social_worker_id)
      .eq('role', 'social_worker')
      .single()

    if (!socialWorker) {
      return [{
        field: 'social_worker_id',
        value: data.social_worker_id,
        message: '존재하지 않는 사회복지사입니다',
        code: 'INVALID_SOCIAL_WORKER'
      }]
    }

    return []
  }
}

/**
 * 서비스 관련 비즈니스 검증
 */
export const serviceValidators = {
  /**
   * 서비스 날짜 검증
   */
  validateServiceDate: () => async (data: unknown): Promise<ValidationError[]> => {
    if (!data.service_date_time) return []

    const serviceDate = new Date(data.service_date_time)
    const now = new Date()

    if (serviceDate > now) {
      return [{
        field: 'service_date_time',
        value: data.service_date_time,
        message: '미래 날짜의 서비스 기록은 생성할 수 없습니다',
        code: 'FUTURE_SERVICE_DATE'
      }]
    }

    return []
  },

  /**
   * 서비스 참가자 수 검증
   */
  validateServiceCapacity: (supabase: unknown) => async (data: unknown): Promise<ValidationError[]> => {
    if (!data.service_type || !data.participants) return []

    const { data: serviceType } = await supabase
      .from('service_types')
      .select('max_capacity')
      .eq('id', data.service_type)
      .single()

    if (serviceType && data.participants.length > serviceType.max_capacity) {
      return [{
        field: 'participants',
        value: data.participants,
        message: `최대 참가자 수(${serviceType.max_capacity}명)를 초과했습니다`,
        code: 'CAPACITY_EXCEEDED'
      }]
    }

    return []
  }
}

/**
 * 목표 관련 비즈니스 검증
 */
export const goalValidators = {
  /**
   * 목표 계층 구조 검증
   */
  validateGoalHierarchy: () => async (data: unknown): Promise<ValidationError[]> => {
    const errors: ValidationError[] = []

    // 6개월 목표는 부모가 없어야 함
    if (data.goal_type === 'long_term' && data.parent_goal_id) {
      errors.push({
        field: 'parent_goal_id',
        value: data.parent_goal_id,
        message: '6개월 목표는 부모 목표를 가질 수 없습니다',
        code: 'INVALID_HIERARCHY'
      })
    }

    // 주간 목표는 월간 목표를 부모로 가져야 함
    if (data.goal_type === 'weekly' && !data.parent_goal_id) {
      errors.push({
        field: 'parent_goal_id',
        value: data.parent_goal_id,
        message: '주간 목표는 월간 목표를 부모로 가져야 합니다',
        code: 'MISSING_PARENT'
      })
    }

    return errors
  },

  /**
   * 목표 날짜 검증
   */
  validateGoalDates: () => async (data: unknown): Promise<ValidationError[]> => {
    const errors: ValidationError[] = []

    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date)
      const endDate = new Date(data.end_date)

      if (startDate >= endDate) {
        errors.push({
          field: 'end_date',
          value: data.end_date,
          message: '종료일은 시작일보다 늦어야 합니다',
          code: 'INVALID_DATE_RANGE'
        })
      }

      // 목표 유형별 기간 검증
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (data.goal_type === 'long_term' && (duration < 150 || duration > 200)) {
        errors.push({
          field: 'end_date',
          value: data.end_date,
          message: '6개월 목표의 기간은 5-7개월 사이여야 합니다',
          code: 'INVALID_LONG_TERM_DURATION'
        })
      }

      if (data.goal_type === 'monthly' && (duration < 25 || duration > 35)) {
        errors.push({
          field: 'end_date',
          value: data.end_date,
          message: '월간 목표의 기간은 약 1개월이어야 합니다',
          code: 'INVALID_MONTHLY_DURATION'
        })
      }

      if (data.goal_type === 'weekly' && (duration < 6 || duration > 8)) {
        errors.push({
          field: 'end_date',
          value: data.end_date,
          message: '주간 목표의 기간은 약 1주일이어야 합니다',
          code: 'INVALID_WEEKLY_DURATION'
        })
      }
    }

    return errors
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * 중첩된 객체에서 경로를 통해 값 추출
 */
function getValueAtPath(obj: unknown, path: (string | number)[]): unknown {
  return path.reduce((current, key) => current?.[key], obj)
}

/**
 * Zod 에러 코드를 한국어 메시지로 변환
 */
function getKoreanErrorMessage(code: string, originalMessage: string): string {
  const messages: Record<string, string> = {
    'invalid_type': '올바르지 않은 데이터 형식입니다',
    'invalid_string': '올바르지 않은 문자열입니다',
    'too_small': '값이 너무 작습니다',
    'too_big': '값이 너무 큽니다',
    'invalid_email': '올바르지 않은 이메일 형식입니다',
    'invalid_url': '올바르지 않은 URL 형식입니다',
    'invalid_date': '올바르지 않은 날짜 형식입니다',
    'required': '필수 입력 항목입니다',
    'invalid_enum_value': '허용되지 않는 값입니다'
  }

  return messages[code] || originalMessage
}

/**
 * 데이터 정화 함수
 */
function sanitizeData<T>(data: T): T {
  if (typeof data === 'string') {
    // HTML 태그 제거 및 특수 문자 이스케이프
    return data
      .replace(/<[^>]*>/g, '') // HTML 태그 제거
      .replace(/[<>"'&]/g, (match) => {
        const escapeMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        }
        return escapeMap[match] || match
      }) as T
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item)) as T
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: unknown = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value)
    }
    return sanitized
  }

  return data
}

/**
 * 서버 검증 에러 응답 생성
 */
export function createValidationErrorResponse(errors: ValidationError[], requestId?: string) {
  return {
    success: false,
    error: {
      type: 'VALIDATION_ERROR' as const,
      message: '입력 데이터 검증에 실패했습니다',
      details: errors,
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId()
    }
  }
}

/**
 * 요청 ID 생성
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// =============================================================================
// RATE LIMITING UTILITIES
// =============================================================================

/**
 * Rate limiting 설정
 */
export const rateLimitConfig = {
  auth: {
    login: { windowMs: 15 * 60 * 1000, max: 5 }, // 15분에 5회
    signup: { windowMs: 60 * 60 * 1000, max: 3 }, // 1시간에 3회
  },
  api: {
    general: { windowMs: 15 * 60 * 1000, max: 100 }, // 15분에 100회
    upload: { windowMs: 60 * 60 * 1000, max: 10 }, // 1시간에 10회
    search: { windowMs: 60 * 1000, max: 30 }, // 1분에 30회
  }
}

/**
 * Rate limiting 체크 (메모리 기반 - 프로덕션에서는 Redis 사용 권장)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  config: { windowMs: number; max: number }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `${identifier}_${Math.floor(now / config.windowMs)}`
  
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + config.windowMs }
  
  if (now > current.resetTime) {
    // 윈도우 리셋
    current.count = 0
    current.resetTime = now + config.windowMs
  }
  
  current.count++
  rateLimitStore.set(key, current)
  
  return {
    allowed: current.count <= config.max,
    remaining: Math.max(0, config.max - current.count),
    resetTime: current.resetTime
  }
}

// =============================================================================
// EXPORT DEFAULT VALIDATION SCHEMAS
// =============================================================================

/**
 * 기본 서버 검증 스키마들
 */
export const serverSchemas = {
  // ID 검증
  id: z.string().uuid('올바르지 않은 ID 형식입니다'),
  
  // 페이지네이션
  pagination: z.object({
    page: z.number().min(1, '페이지는 1 이상이어야 합니다').default(1),
    limit: z.number().min(1).max(100, '한 번에 최대 100개까지 조회할 수 있습니다').default(20)
  }),
  
  // 날짜 범위
  dateRange: z.object({
    start_date: z.string().datetime('올바르지 않은 시작일 형식입니다'),
    end_date: z.string().datetime('올바르지 않은 종료일 형식입니다')
  }).refine(
    (data) => new Date(data.start_date) < new Date(data.end_date),
    {
      message: '종료일은 시작일보다 늦어야 합니다',
      path: ['end_date']
    }
  ),
  
  // 검색 쿼리
  search: z.object({
    q: z.string().min(1, '검색어를 입력해주세요').max(100, '검색어는 100자 이하여야 합니다'),
    filters: z.record(z.string()).optional()
  })
} 