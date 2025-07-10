import { ZodError } from 'zod'

// 에러 타입 정의
export type ErrorType = 
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'CONFLICT_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR'

export interface AppError {
  type: ErrorType
  message: string
  details?: unknown
  field?: string
  code?: string
}

// 에러 메시지 한국어 매핑
const errorMessages: Record<string, string> = {
  // 네트워크 에러
  'Network Error': '네트워크 연결을 확인해주세요',
  'Failed to fetch': '서버에 연결할 수 없습니다',
  'Request timeout': '요청 시간이 초과되었습니다',
  
  // 인증/권한 에러
  'Unauthorized': '로그인이 필요합니다',
  'Forbidden': '접근 권한이 없습니다',
  'Invalid credentials': '잘못된 인증 정보입니다',
  
  // 데이터 에러
  'Not found': '요청한 데이터를 찾을 수 없습니다',
  'Conflict': '이미 존재하는 데이터입니다',
  'Bad request': '잘못된 요청입니다',
  
  // 환자 관련 에러
  'Patient not found': '환자 정보를 찾을 수 없습니다',
  'Patient identifier already exists': '이미 존재하는 환자 식별번호입니다',
  'Social worker not found': '사회복지사 정보를 찾을 수 없습니다',
  'Social worker already assigned': '이미 배정된 사회복지사입니다',
  'Invalid patient status': '올바르지 않은 환자 상태입니다',
  'Cannot discharge active patient': '활성 상태의 환자는 퇴원 처리할 수 없습니다',
  
  // 서버 에러
  'Internal server error': '서버 내부 오류가 발생했습니다',
  'Service unavailable': '서비스를 일시적으로 사용할 수 없습니다',
  'Database error': '데이터베이스 오류가 발생했습니다',
}

// Supabase 에러 코드 매핑
const supabaseErrorMessages: Record<string, string> = {
  '23505': '이미 존재하는 데이터입니다',
  '23503': '참조된 데이터가 존재하지 않습니다',
  '23514': '데이터 제약 조건을 위반했습니다',
  '42501': '접근 권한이 없습니다',
  'PGRST116': '요청한 데이터를 찾을 수 없습니다',
  'PGRST301': '잘못된 요청 형식입니다',
}

// Zod 에러를 사용자 친화적 메시지로 변환
export function formatZodError(error: ZodError): AppError[] {
  return error.errors.map((err) => ({
    type: 'VALIDATION_ERROR',
    message: err.message,
    field: err.path.join('.'),
    details: err
  }))
}

// Helper type guards
function isErrorWithCode(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code: unknown }).code === 'string'
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string'
}

function isErrorWithStatus(error: unknown): error is { status: number } | { response: { status: number } } {
  if (typeof error !== 'object' || error === null) return false
  if ('status' in error && typeof (error as { status: unknown }).status === 'number') return true
  if ('response' in error && typeof (error as { response: unknown }).response === 'object' && 
      (error as { response: unknown }).response !== null && 
      'status' in (error as { response: { status: unknown } }).response &&
      typeof (error as { response: { status: unknown } }).response.status === 'number') return true
  return false
}

// 일반 에러를 AppError로 변환
export function parseError(error: unknown): AppError {
  // Zod 검증 에러
  if (error instanceof ZodError) {
    const firstError = error.errors[0]
    return {
      type: 'VALIDATION_ERROR',
      message: firstError.message,
      field: firstError.path.join('.'),
      details: error.errors
    }
  }

  // Supabase 에러
  if (isErrorWithCode(error) && supabaseErrorMessages[error.code]) {
    return {
      type: getErrorTypeFromCode(error.code),
      message: supabaseErrorMessages[error.code],
      code: error.code,
      details: error
    }
  }

  // HTTP 상태 코드 기반 에러
  if (isErrorWithStatus(error)) {
    const status = 'status' in error ? error.status : error.response.status
    return {
      type: getErrorTypeFromStatus(status),
      message: getMessageFromStatus(status),
      code: status.toString(),
      details: error
    }
  }

  // 네트워크 에러
  if (isErrorWithMessage(error) && error.message.includes('fetch')) {
    return {
      type: 'NETWORK_ERROR',
      message: '네트워크 연결을 확인해주세요',
      details: error
    }
  }

  // 알려진 에러 메시지
  if (isErrorWithMessage(error)) {
    const knownMessage = errorMessages[error.message]
    if (knownMessage) {
      return {
        type: 'UNKNOWN_ERROR',
        message: knownMessage,
        details: error
      }
    }
  }

  // 기본 에러
  return {
    type: 'UNKNOWN_ERROR',
    message: isErrorWithMessage(error) ? error.message : '알 수 없는 오류가 발생했습니다',
    details: error
  }
}

// HTTP 상태 코드에서 에러 타입 추출
function getErrorTypeFromStatus(status: number): ErrorType {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR'
    case 401:
      return 'AUTHENTICATION_ERROR'
    case 403:
      return 'AUTHORIZATION_ERROR'
    case 404:
      return 'NOT_FOUND_ERROR'
    case 409:
      return 'CONFLICT_ERROR'
    case 500:
    case 502:
    case 503:
    case 504:
      return 'SERVER_ERROR'
    default:
      return 'UNKNOWN_ERROR'
  }
}

// Supabase 에러 코드에서 에러 타입 추출
function getErrorTypeFromCode(code: string): ErrorType {
  switch (code) {
    case '23505':
      return 'CONFLICT_ERROR'
    case '23503':
    case 'PGRST116':
      return 'NOT_FOUND_ERROR'
    case '23514':
    case 'PGRST301':
      return 'VALIDATION_ERROR'
    case '42501':
      return 'AUTHORIZATION_ERROR'
    default:
      return 'SERVER_ERROR'
  }
}

// HTTP 상태 코드에서 메시지 추출
function getMessageFromStatus(status: number): string {
  switch (status) {
    case 400:
      return '잘못된 요청입니다'
    case 401:
      return '로그인이 필요합니다'
    case 403:
      return '접근 권한이 없습니다'
    case 404:
      return '요청한 데이터를 찾을 수 없습니다'
    case 409:
      return '이미 존재하는 데이터입니다'
    case 500:
      return '서버 내부 오류가 발생했습니다'
    case 502:
      return '서버 게이트웨이 오류입니다'
    case 503:
      return '서비스를 일시적으로 사용할 수 없습니다'
    case 504:
      return '서버 응답 시간이 초과되었습니다'
    default:
      return '알 수 없는 오류가 발생했습니다'
  }
}

// 에러 로깅 유틸리티
export function logError(error: AppError, context?: string) {
  const logData = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      type: error.type,
      message: error.message,
      field: error.field,
      code: error.code
    },
    details: error.details
  }

  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('Application Error:', logData)
  }
}

// 재시도 가능한 에러인지 확인
export function isRetryableError(error: AppError): boolean {
  return [
    'NETWORK_ERROR',
    'SERVER_ERROR'
  ].includes(error.type)
}

// 사용자에게 표시할 에러 메시지 생성
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.type) {
    case 'VALIDATION_ERROR':
      return error.field 
        ? `${error.field}: ${error.message}`
        : error.message
    case 'NETWORK_ERROR':
      return '네트워크 연결을 확인하고 다시 시도해주세요'
    case 'AUTHENTICATION_ERROR':
      return '로그인이 필요합니다. 다시 로그인해주세요'
    case 'AUTHORIZATION_ERROR':
      return '이 작업을 수행할 권한이 없습니다'
    case 'NOT_FOUND_ERROR':
      return '요청한 정보를 찾을 수 없습니다'
    case 'CONFLICT_ERROR':
      return '이미 존재하는 정보입니다. 다른 값을 입력해주세요'
    case 'SERVER_ERROR':
      return '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요'
    default:
      return error.message || '알 수 없는 오류가 발생했습니다'
  }
}

// React Query 에러 핸들러
export function createQueryErrorHandler(context: string) {
  return (error: unknown) => {
    const appError = parseError(error)
    logError(appError, context)
    return appError
  }
}

// 폼 에러 핸들러
export function handleFormError(error: unknown, setError: (field: string, error: unknown) => void) {
  const appError = parseError(error)
  
  if (appError.type === 'VALIDATION_ERROR' && appError.field) {
    setError(appError.field, {
      type: 'manual',
      message: appError.message
    })
  }
  
  return appError
} 