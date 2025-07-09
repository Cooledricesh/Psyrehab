// Since we can't use hooks outside of React components, we'll create a toast function
let toastFunction: ((options: any) => void) | null = null

export function setToastFunction(toast: (options: any) => void) {
  toastFunction = toast
}

interface ErrorHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
  context?: string
}

/**
 * 에러를 처리하고 적절한 방식으로 사용자에게 알립니다.
 * 개발 환경에서는 콘솔에도 로그를 남깁니다.
 */
export function handleError(
  error: unknown,
  message?: string,
  options: ErrorHandlerOptions = {}
): void {
  const {
    showToast = true,
    logToConsole = process.env.NODE_ENV === 'development',
    context
  } = options

  // 에러 메시지 추출
  const errorMessage = message || '오류가 발생했습니다.'
  let errorDetails = ''

  if (error instanceof Error) {
    errorDetails = error.message
  } else if (typeof error === 'string') {
    errorDetails = error
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorDetails = String(error.message)
  }

  // 개발 환경에서는 콘솔에 상세 정보 출력
  if (logToConsole) {
    console.error(`[${context || 'Error'}]`, {
      message: errorMessage,
      details: errorDetails,
      error
    })
  }

  // 사용자에게 토스트 메시지 표시
  if (showToast && toastFunction) {
    toastFunction({
      title: '오류',
      description: errorMessage,
      variant: 'destructive'
    })
  }
}

/**
 * 비동기 함수를 안전하게 실행하고 에러를 처리합니다.
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage?: string,
  options?: ErrorHandlerOptions
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    handleError(error, errorMessage, options)
    return null
  }
}

/**
 * API 에러를 처리합니다.
 */
export function handleApiError(
  error: unknown,
  context: string
): void {
  let message = '요청 처리 중 오류가 발생했습니다.'

  if (error instanceof Error) {
    // Supabase 에러 처리
    if (error.message.includes('Failed to fetch')) {
      message = '네트워크 연결을 확인해주세요.'
    } else if (error.message.includes('JWT')) {
      message = '인증이 만료되었습니다. 다시 로그인해주세요.'
    } else if (error.message.includes('Row level security')) {
      message = '권한이 없습니다.'
    } else if (error.message.includes('duplicate key')) {
      message = '이미 존재하는 데이터입니다.'
    }
  }

  handleError(error, message, { context })
}

/**
 * 폼 검증 에러를 처리합니다.
 */
export function handleValidationError(
  errors: Record<string, string>,
  context?: string
): void {
  const errorMessages = Object.values(errors).filter(Boolean)
  
  if (errorMessages.length === 0) return

  const message = errorMessages.length === 1 
    ? errorMessages[0] 
    : '입력값을 확인해주세요.'

  if (toastFunction) {
    toastFunction({
      title: '입력 오류',
      description: message,
      variant: 'destructive'
    })
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context || 'Validation'}]`, errors)
  }
}

/**
 * 성공 메시지를 표시합니다.
 */
export function showSuccess(message: string, title = '성공'): void {
  if (toastFunction) {
    toastFunction({
      title,
      description: message,
      variant: 'default'
    })
  }
}

/**
 * 경고 메시지를 표시합니다.
 */
export function showWarning(message: string, title = '주의'): void {
  if (toastFunction) {
    toastFunction({
      title,
      description: message,
      variant: 'default'
    })
  }
}

/**
 * 정보 메시지를 표시합니다.
 */
export function showInfo(message: string, title = '안내'): void {
  if (toastFunction) {
    toastFunction({
      title,
      description: message,
      variant: 'default'
    })
  }
}