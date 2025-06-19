import { AppError } from '../error-handling'

// =============================================================================
// LOGGING INTERFACES AND TYPES
// =============================================================================

export interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

export interface ErrorLogEntry {
  id: string
  timestamp: string
  level: keyof LogLevel
  error: AppError
  context?: string
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  stackTrace?: string
  metadata?: Record<string, any>
}

export interface ErrorMetrics {
  errorCount: number
  errorsByType: Record<string, number>
  errorsByContext: Record<string, number>
  lastError?: ErrorLogEntry
  errorRate: number // errors per hour
}

// =============================================================================
// ERROR LOGGER CLASS
// =============================================================================

class ErrorLogger {
  private logs: ErrorLogEntry[] = []
  private maxLogSize = 1000
  private sessionId: string
  private isEnabled: boolean

  constructor() {
    this.sessionId = this.generateSessionId()
    this.isEnabled = true
    
    // 개발 환경에서는 더 많은 로그 저장
    if (process.env.NODE_ENV === 'development') {
      this.maxLogSize = 5000
    }
  }

  /**
   * 에러 로그 생성 및 저장
   */
  logError(
    error: AppError,
    context?: string,
    metadata?: Record<string, any>
  ): ErrorLogEntry {
    if (!this.isEnabled) return {} as ErrorLogEntry

    const logEntry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      error: {
        type: error.type,
        message: error.message,
        field: error.field,
        code: error.code,
        details: this.sanitizeDetails(error.details)
      },
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      userAgent: navigator?.userAgent,
      url: window?.location?.href,
      stackTrace: this.extractStackTrace(error),
      metadata
    }

    // 로그 저장
    this.addLog(logEntry)

    // 콘솔 출력 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Log [${logEntry.id}]`)
      console.error("Error occurred")
      console.info('Context:', context)
      console.info('Metadata:', metadata)
      console.info('Full Log Entry:', logEntry)
      console.groupEnd()
    }

    // 외부 모니터링 서비스로 전송
    this.sendToExternalService(logEntry)

    return logEntry
  }

  /**
   * 경고 로그 생성
   */
  logWarning(
    message: string,
    context?: string,
    metadata?: Record<string, any>
  ): ErrorLogEntry {
    const warningError: AppError = {
      type: 'UNKNOWN_ERROR',
      message
    }

    const logEntry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'WARN',
      error: warningError,
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      userAgent: navigator?.userAgent,
      url: window?.location?.href,
      metadata
    }

    this.addLog(logEntry)

    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️  Warning [${context}]:`, message, metadata)
    }

    return logEntry
  }

  /**
   * 정보 로그 생성
   */
  logInfo(
    message: string,
    context?: string,
    metadata?: Record<string, any>
  ): ErrorLogEntry {
    const infoError: AppError = {
      type: 'UNKNOWN_ERROR',
      message
    }

    const logEntry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'INFO',
      error: infoError,
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      userAgent: navigator?.userAgent,
      url: window?.location?.href,
      metadata
    }

    this.addLog(logEntry)

    if (process.env.NODE_ENV === 'development') {
      console.info(`ℹ️  Info [${context}]:`, message, metadata)
    }

    return logEntry
  }

  /**
   * 에러 메트릭 생성
   */
  getErrorMetrics(): ErrorMetrics {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentErrors = this.logs.filter(
      log => new Date(log.timestamp) > oneHourAgo
    )

    const errorsByType: Record<string, number> = {}
    const errorsByContext: Record<string, number> = {}

    this.logs.forEach(log => {
      // 타입별 집계
      errorsByType[log.error.type] = (errorsByType[log.error.type] || 0) + 1
      
      // 컨텍스트별 집계
      if (log.context) {
        errorsByContext[log.context] = (errorsByContext[log.context] || 0) + 1
      }
    })

    return {
      errorCount: this.logs.length,
      errorsByType,
      errorsByContext,
      lastError: this.logs[this.logs.length - 1],
      errorRate: recentErrors.length
    }
  }

  /**
   * 로그 검색
   */
  searchLogs(filters: {
    level?: keyof LogLevel
    errorType?: string
    context?: string
    userId?: string
    timeRange?: { start: Date; end: Date }
  }): ErrorLogEntry[] {
    return this.logs.filter(log => {
      if (filters.level && log.level !== filters.level) return false
      if (filters.errorType && log.error.type !== filters.errorType) return false
      if (filters.context && log.context !== filters.context) return false
      if (filters.userId && log.userId !== filters.userId) return false
      
      if (filters.timeRange) {
        const logTime = new Date(log.timestamp)
        if (logTime < filters.timeRange.start || logTime > filters.timeRange.end) {
          return false
        }
      }
      
      return true
    })
  }

  /**
   * 로그 내보내기 (CSV 형태)
   */
  exportLogs(): string {
    const headers = [
      'ID', 'Timestamp', 'Level', 'Error Type', 'Message', 'Context', 
      'User ID', 'URL', 'Code', 'Field'
    ]
    
    const rows = this.logs.map(log => [
      log.id,
      log.timestamp,
      log.level,
      log.error.type,
      log.error.message.replace(/"/g, '""'), // CSV 이스케이프
      log.context || '',
      log.userId || '',
      log.url || '',
      log.error.code || '',
      log.error.field || ''
    ])

    const csvContent = [headers, ...rows]
      .map(row => `"${row.join('","')}"`)
      .join('\n')

    return csvContent
  }

  /**
   * 로그 클리어
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * 로깅 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private addLog(logEntry: ErrorLogEntry): void {
    this.logs.push(logEntry)
    
    // 최대 로그 크기 유지
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize)
    }

    // 로컬 스토리지에 저장 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      this.saveToLocalStorage()
    }
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getCurrentUserId(): string | undefined {
    // 실제 구현에서는 인증 컨텍스트에서 사용자 ID를 가져옴
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.id
      }
    } catch {
      // 무시
    }
    return undefined
  }

  private extractStackTrace(error: unknown): string | undefined {
    if (error.details?.stack) {
      return error.details.stack
    }
    if (error.stack) {
      return error.stack
    }
    return undefined
  }

  private sanitizeDetails(details: unknown): unknown {
    if (!details) return undefined
    
    // 민감한 정보 제거
    const sanitized = { ...details }
    
    // 비밀번호, 토큰 등 제거
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth']
    
    function removeSensitiveData(obj: unknown) {
      if (typeof obj !== 'object' || obj === null) return obj
      
      if (Array.isArray(obj)) {
        return obj.map(item => removeSensitiveData(item))
      }
      
      const cleaned: unknown = {}
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase()
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          cleaned[key] = '[REDACTED]'
        } else {
          cleaned[key] = removeSensitiveData(value)
        }
      }
      
      return cleaned
    }
    
    return removeSensitiveData(sanitized)
  }

  private saveToLocalStorage(): void {
    try {
      const recentLogs = this.logs.slice(-100) // 최근 100개만 저장
      localStorage.setItem('psyrehab_error_logs', JSON.stringify(recentLogs))
    } catch {
      // 로컬 스토리지 오류 무시
    }
  }

  private sendToExternalService(logEntry: ErrorLogEntry): void {
    // 프로덕션 환경에서는 실제 모니터링 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      // 예: Sentry, LogRocket, DataDog 등
      this.sendToSentry(logEntry)
    }
  }

  private sendToSentry(logEntry: ErrorLogEntry): void {
    // Sentry 전송 로직 (실제 구현 시 @sentry/browser 사용)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(logEntry.error, {
        tags: {
          context: logEntry.context,
          errorType: logEntry.error.type,
          level: logEntry.level
        },
        user: {
          id: logEntry.userId
        },
        extra: {
          metadata: logEntry.metadata,
          sessionId: logEntry.sessionId
        }
      })
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const errorLogger = new ErrorLogger()

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * 에러 로깅
 */
export function logError(
  error: AppError,
  context?: string,
  metadata?: Record<string, any>
): ErrorLogEntry {
  return errorLogger.logError(error, context, metadata)
}

/**
 * 경고 로깅
 */
export function logWarning(
  message: string,
  context?: string,
  metadata?: Record<string, any>
): ErrorLogEntry {
  return errorLogger.logWarning(message, context, metadata)
}

/**
 * 정보 로깅
 */
export function logInfo(
  message: string,
  context?: string,
  metadata?: Record<string, any>
): ErrorLogEntry {
  return errorLogger.logInfo(message, context, metadata)
}

/**
 * 성능 메트릭 로깅
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
): void {
  logInfo(
    `Performance: ${operation} took ${duration}ms`,
    'Performance',
    {
      operation,
      duration,
      ...metadata
    }
  )
}

/**
 * 사용자 액션 로깅
 */
export function logUserAction(
  action: string,
  metadata?: Record<string, any>
): void {
  logInfo(
    `User Action: ${action}`,
    'User Activity',
    {
      action,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  )
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * 함수 실행 시간 측정 데코레이터
 */
export function measurePerformance<T extends (...args: unknown[]) => any>(
  fn: T,
  context: string
): T {
  return ((...args: unknown[]) => {
    const start = performance.now()
    
    try {
      const result = fn(...args)
      
      // Promise인 경우
      if (result && typeof result.then === 'function') {
        return result
          .then((value: unknown) => {
            const duration = performance.now() - start
            logPerformance(context, duration, { args, success: true })
            return value
          })
          .catch((error: unknown) => {
            const duration = performance.now() - start
            logPerformance(context, duration, { args, success: false, error })
            throw error
          })
      }
      
      // 동기 함수인 경우
      const duration = performance.now() - start
      logPerformance(context, duration, { args, success: true })
      return result
      
    } catch {
      const duration = performance.now() - start
      logPerformance(context, duration, { args, success: false, error })
      throw error
    }
  }) as T
}

/**
 * React Hook용 성능 측정
 */
export function usePerformanceLogger(operation: string) {
  const start = performance.now()
  
  return {
    end: (metadata?: Record<string, any>) => {
      const duration = performance.now() - start
      logPerformance(operation, duration, metadata)
      return duration
    }
  }
} 