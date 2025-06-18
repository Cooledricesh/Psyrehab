// 시스템 로그 레벨 정의
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info', 
  DEBUG = 'debug',
  TRACE = 'trace'
}

// 로그 카테고리 정의
export enum LogCategory {
  SYSTEM = 'system',
  AUTH = 'auth',
  DATABASE = 'database',
  API = 'api',
  USER = 'user',
  ADMIN = 'admin',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  BACKUP = 'backup',
  NOTIFICATION = 'notification',
  ASSESSMENT = 'assessment',
  SESSION = 'session'
}

// 로그 엔트리 인터페이스
export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  source?: string
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  correlationId?: string
  duration?: number
  metadata?: Record<string, unknown>
  errorDetails?: {
    stack?: string
    code?: string
    details?: string
  }
}

// 로그 필터 인터페이스
export interface LogFilter {
  levels: LogLevel[]
  categories: LogCategory[]
  startDate?: string
  endDate?: string
  userId?: string
  source?: string
  ipAddress?: string
  correlationId?: string
  errorOnly: boolean
  minDuration?: number
  maxDuration?: number
}

// 로그 통계 인터페이스
export interface LogStats {
  totalLogs: number
  todayLogs: number
  errorCount: number
  warningCount: number
  avgResponseTime: number
  systemStatus: 'healthy' | 'warning' | 'critical'
  warningRate: number
  storageUsed: number
  storageTotal: number
  topErrors: Array<{
    message: string
    count: number
    lastOccurrence: string
  }>
}

// 페이지네이션 인터페이스
export interface LogPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// 로그 레벨별 색상 매핑
export const LOG_LEVEL_COLORS = {
  [LogLevel.ERROR]: 'bg-red-100 text-red-800 border-red-200',
  [LogLevel.WARN]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [LogLevel.INFO]: 'bg-blue-100 text-blue-800 border-blue-200',
  [LogLevel.DEBUG]: 'bg-purple-100 text-purple-800 border-purple-200',
  [LogLevel.TRACE]: 'bg-gray-100 text-gray-800 border-gray-200'
}

// 로그 레벨별 아이콘 매핑
export const LOG_LEVEL_ICONS = {
  [LogLevel.ERROR]: '🔴',
  [LogLevel.WARN]: '🟡',
  [LogLevel.INFO]: '🔵',
  [LogLevel.DEBUG]: '🟣',
  [LogLevel.TRACE]: '⚪'
}

// 로그 카테고리별 라벨 매핑
export const LOG_CATEGORY_LABELS = {
  [LogCategory.SYSTEM]: '시스템',
  [LogCategory.AUTH]: '인증',
  [LogCategory.DATABASE]: '데이터베이스',
  [LogCategory.API]: 'API',
  [LogCategory.USER]: '사용자',
  [LogCategory.ADMIN]: '관리자',
  [LogCategory.SECURITY]: '보안',
  [LogCategory.PERFORMANCE]: '성능',
  [LogCategory.BACKUP]: '백업',
  [LogCategory.NOTIFICATION]: '알림',
  [LogCategory.ASSESSMENT]: '평가',
  [LogCategory.SESSION]: '세션'
}

// 기본 필터 설정
export const DEFAULT_LOG_FILTER: LogFilter = {
  levels: [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO],
  categories: Object.values(LogCategory),
  errorOnly: false
}

// 페이지네이션 기본값
export const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: 50,
  total: 0,
  totalPages: 0
}

// 페이지 크기 옵션
export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] 