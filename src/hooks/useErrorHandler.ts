import { useCallback } from 'react'
import { AppError, parseError, getUserFriendlyMessage, isRetryableError } from '@/lib/error-handling'
import { useToastHelpers } from '@/components/ui/toast'

// =============================================================================
// ERROR HANDLER HOOK
// =============================================================================

export interface ErrorHandlerOptions {
  showToast?: boolean
  context?: string
  retryAction?: () => void | Promise<void>
  onError?: (error: AppError) => void
}

export function useErrorHandler() {
  const toast = useToastHelpers()

  const handleError = useCallback((
    error: any,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      context,
      retryAction,
      onError
    } = options

    // 에러 파싱 및 표준화
    const appError = parseError(error)
    
    // 콘솔에 에러 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context || 'Unknown'}] Error:`, appError)
    }

    // 사용자 친화적 메시지 생성
    const userMessage = getUserFriendlyMessage(appError)

    // Toast 알림 표시
    if (showToast) {
      const toastOptions: any = {
        duration: getToastDuration(appError.type)
      }

      // 재시도 가능한 에러인 경우 재시도 버튼 추가
      if (retryAction && isRetryableError(appError)) {
        toastOptions.action = {
          label: '다시 시도',
          onClick: retryAction
        }
      }

      // 에러 타입에 따른 Toast 표시
      switch (appError.type) {
        case 'VALIDATION_ERROR':
          toast.warning('입력 확인 필요', userMessage, toastOptions)
          break
        case 'AUTHENTICATION_ERROR':
          toast.error('인증 오류', userMessage, toastOptions)
          break
        case 'AUTHORIZATION_ERROR':
          toast.error('권한 오류', userMessage, toastOptions)
          break
        case 'NOT_FOUND_ERROR':
          toast.info('정보 없음', userMessage, toastOptions)
          break
        case 'CONFLICT_ERROR':
          toast.warning('데이터 충돌', userMessage, toastOptions)
          break
        case 'NETWORK_ERROR':
        case 'SERVER_ERROR':
          toast.error('서버 오류', userMessage, toastOptions)
          break
        default:
          toast.error('오류 발생', userMessage, toastOptions)
      }
    }

    // 커스텀 에러 핸들러 호출
    if (onError) {
      onError(appError)
    }

    return appError
  }, [toast])

  // 폼 에러 처리용 헬퍼
  const handleFormError = useCallback((
    error: any,
    setError: (field: string, error: any) => void,
    options: Omit<ErrorHandlerOptions, 'showToast'> = {}
  ) => {
    const appError = handleError(error, { ...options, showToast: false })
    
    // 폼 필드별 에러 설정
    if (appError.type === 'VALIDATION_ERROR' && appError.field) {
      setError(appError.field, {
        type: 'manual',
        message: appError.message
      })
      
      // 필드 에러는 warning으로 표시
      toast.warning('입력 확인', appError.message)
    } else {
      // 전체 폼 에러는 일반 에러로 처리
      handleError(error, { ...options, showToast: true })
    }

    return appError
  }, [handleError, toast])

  // Query 에러 처리용 헬퍼
  const handleQueryError = useCallback((
    error: any,
    context: string,
    retryFn?: () => void
  ) => {
    return handleError(error, {
      context: `Query: ${context}`,
      retryAction: retryFn,
      showToast: true
    })
  }, [handleError])

  // Mutation 에러 처리용 헬퍼
  const handleMutationError = useCallback((
    error: any,
    context: string,
    retryFn?: () => void
  ) => {
    return handleError(error, {
      context: `Mutation: ${context}`,
      retryAction: retryFn,
      showToast: true
    })
  }, [handleError])

  // 성공 메시지 표시 헬퍼
  const showSuccess = useCallback((
    title: string,
    description?: string
  ) => {
    toast.success(title, description)
  }, [toast])

  // 정보 메시지 표시 헬퍼
  const showInfo = useCallback((
    title: string,
    description?: string
  ) => {
    toast.info(title, description)
  }, [toast])

  // 경고 메시지 표시 헬퍼
  const showWarning = useCallback((
    title: string,
    description?: string
  ) => {
    toast.warning(title, description)
  }, [toast])

  return {
    handleError,
    handleFormError,
    handleQueryError,
    handleMutationError,
    showSuccess,
    showInfo,
    showWarning
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getToastDuration(errorType: string): number {
  switch (errorType) {
    case 'VALIDATION_ERROR':
      return 6000 // 검증 에러는 사용자가 읽을 시간 필요
    case 'AUTHENTICATION_ERROR':
    case 'AUTHORIZATION_ERROR':
      return 8000 // 인증/권한 에러는 중요하므로 오래 표시
    case 'NETWORK_ERROR':
    case 'SERVER_ERROR':
      return 10000 // 네트워크/서버 에러는 가장 오래 표시
    default:
      return 5000
  }
}

// =============================================================================
// SPECIALIZED ERROR HANDLERS
// =============================================================================

/**
 * React Query용 에러 핸들러
 */
export function createQueryErrorHandler(
  context: string,
  toast: ReturnType<typeof useToastHelpers>
) {
  return (error: any) => {
    const appError = parseError(error)
    const userMessage = getUserFriendlyMessage(appError)
    
    console.error(`[Query: ${context}] Error:`, appError)
    
    toast.error(
      '데이터 로딩 실패',
      userMessage,
      {
        duration: getToastDuration(appError.type)
      }
    )
    
    return appError
  }
}

/**
 * 인증 관련 특화 에러 핸들러
 */
export function useAuthErrorHandler() {
  const { handleError, showWarning } = useErrorHandler()

  const handleAuthError = useCallback((error: any) => {
    const appError = parseError(error)
    
    if (appError.type === 'AUTHENTICATION_ERROR') {
      // 인증 에러시 로그인 페이지로 리다이렉트 유도
      handleError(error, {
        context: 'Authentication',
        showToast: true,
        onError: () => {
          setTimeout(() => {
            showWarning(
              '로그인 필요',
              '다시 로그인해주세요',
              {
                action: {
                  label: '로그인 페이지로 이동',
                  onClick: () => {
                    window.location.href = '/auth/signin'
                  }
                }
              }
            )
          }, 1000)
        }
      })
    } else {
      handleError(error, { context: 'Authentication' })
    }
    
    return appError
  }, [handleError, showWarning])

  return { handleAuthError }
}

/**
 * 파일 업로드 특화 에러 핸들러
 */
export function useFileUploadErrorHandler() {
  const { handleError } = useErrorHandler()

  const handleUploadError = useCallback((error: any, filename?: string) => {
    const appError = parseError(error)
    
    let customMessage = appError.message
    
    // 파일 업로드 관련 특화 메시지
    if (appError.message.includes('file size')) {
      customMessage = '파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.'
    } else if (appError.message.includes('file type')) {
      customMessage = '지원하지 않는 파일 형식입니다.'
    } else if (filename) {
      customMessage = `${filename} 업로드에 실패했습니다. ${appError.message}`
    }

    return handleError({
      ...appError,
      message: customMessage
    }, {
      context: 'File Upload',
      showToast: true
    })
  }, [handleError])

  return { handleUploadError }
} 