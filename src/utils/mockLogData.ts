import type { LogEntry, LogStats } from '@/types/logs'
import { LogLevel, LogCategory } from '@/types/logs'

// 다양한 로그 메시지 템플릿
const LOG_MESSAGES = {
  [LogLevel.ERROR]: [
    '데이터베이스 연결 실패',
    '사용자 인증 오류 발생',
    'API 요청 처리 중 예외 발생',
    '세션 만료로 인한 접근 거부',
    '파일 업로드 처리 실패',
    '시스템 리소스 부족',
    '권한 없는 리소스 접근 시도',
    '결제 처리 중 오류 발생'
  ],
  [LogLevel.WARN]: [
    '메모리 사용량이 임계치에 근접',
    '응답 시간이 평균보다 느림',
    '사용자 비밀번호 재설정 요청',
    '비정상적인 로그인 시도 감지',
    '임시 파일 정리 필요',
    '백업 작업 지연',
    '외부 API 응답 지연',
    '사용자 세션이 곧 만료됨'
  ],
  [LogLevel.INFO]: [
    '사용자가 성공적으로 로그인했습니다',
    '새로운 환자 데이터가 등록되었습니다',
    '평가 보고서가 생성되었습니다',
    '목표 설정이 완료되었습니다',
    '시스템 백업이 완료되었습니다',
    '사용자 프로필이 업데이트되었습니다',
    '알림 메시지가 전송되었습니다',
    '데이터 동기화가 완료되었습니다'
  ],
  [LogLevel.DEBUG]: [
    'SQL 쿼리 실행: SELECT * FROM patients',
    'API 엔드포인트 호출: /api/patients',
    '캐시 업데이트 수행',
    '세션 정보 갱신',
    '폼 데이터 유효성 검사 통과',
    '라우팅 처리 완료',
    '컴포넌트 렌더링 시작',
    '상태 변경 감지됨'
  ],
  [LogLevel.TRACE]: [
    '함수 진입: fetchPatients()',
    '변수 값: userId=12345',
    '조건문 분기: isAuthenticated=true',
    '반복문 시작: patients.length=5',
    '객체 생성: new Date()',
    '이벤트 리스너 등록',
    '타이머 설정: 30초',
    '메모리 할당: 2MB'
  ]
}

// IP 주소 범위
const IP_RANGES = [
  '192.168.1.',
  '10.0.0.',
  '172.16.1.',
  '203.252.123.',
  '121.78.45.'
]

// User Agent 샘플
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
  'Mozilla/5.0 (Android 11; Mobile; rv:92.0) Gecko/92.0'
]

// 시스템 소스
const SOURCES = [
  'auth-service',
  'patient-api',
  'assessment-module',
  'notification-service',
  'file-upload',
  'backup-service',
  'cache-manager',
  'session-handler',
  'database-pool',
  'security-scanner'
]

// 사용자 ID 샘플
const USER_IDS = [
  'usr_12345', 'usr_67890', 'usr_54321', 'usr_98765', 'usr_11111',
  'usr_22222', 'usr_33333', 'usr_44444', 'usr_55555', 'usr_66666'
]

// 랜덤 요소 선택 함수
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// 랜덤 숫자 생성
function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 랜덤 날짜 생성 (최근 30일)
function getRandomDate(): string {
  const now = new Date()
  const daysAgo = getRandomNumber(0, 30)
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return date.toISOString()
}

// 단일 로그 엔트리 생성
export function generateLogEntry(overrides?: Partial<LogEntry>): LogEntry {
  const level = getRandomElement(Object.values(LogLevel))
  const category = getRandomElement(Object.values(LogCategory))
  const timestamp = getRandomDate()
  
  const baseEntry: LogEntry = {
    id: `log_${Math.random().toString(36).substr(2, 9)}`,
    timestamp,
    level,
    category,
    message: getRandomElement(LOG_MESSAGES[level]),
    source: getRandomElement(SOURCES),
    userId: Math.random() > 0.3 ? getRandomElement(USER_IDS) : undefined,
    sessionId: `sess_${Math.random().toString(36).substr(2, 8)}`,
    ipAddress: getRandomElement(IP_RANGES) + getRandomNumber(1, 254),
    userAgent: getRandomElement(USER_AGENTS),
    correlationId: `corr_${Math.random().toString(36).substr(2, 10)}`,
    duration: getRandomNumber(10, 5000),
    metadata: {
      requestId: `req_${Math.random().toString(36).substr(2, 8)}`,
      version: '1.0.0',
      environment: 'development'
    }
  }

  // 에러 레벨인 경우 추가 정보
  if (level === LogLevel.ERROR) {
    baseEntry.errorDetails = {
      stack: `Error: ${baseEntry.message}\n    at Function.handler (/app/src/api/patients.js:42:15)\n    at Router.route (/app/node_modules/express/lib/router/route.js:112:3)`,
      code: `ERR_${getRandomNumber(1000, 9999)}`,
      details: '상세한 오류 정보가 여기에 표시됩니다.'
    }
  }

  return { ...baseEntry, ...overrides }
}

// 여러 로그 엔트리 생성
export function generateLogEntries(count: number): LogEntry[] {
  return Array.from({ length: count }, () => generateLogEntry())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// 로그 통계 생성
export function generateLogStats(logs: LogEntry[]): LogStats {
  const today = new Date().toDateString()
  const todayLogs = logs.filter(log => 
    new Date(log.timestamp).toDateString() === today
  )
  
  const errorLogs = logs.filter(log => log.level === LogLevel.ERROR)
  const warningLogs = logs.filter(log => log.level === LogLevel.WARN)
  
  const avgResponseTime = logs.reduce((sum, log) => sum + (log.duration || 0), 0) / logs.length
  
  // 시스템 상태 결정
  const errorRate = errorLogs.length / logs.length
  const systemStatus = errorRate > 0.05 ? 'critical' : errorRate > 0.02 ? 'warning' : 'healthy'
  
  // 상위 에러 계산
  const errorGroups = errorLogs.reduce((groups, log) => {
    const key = log.message
    if (!groups[key]) {
      groups[key] = { count: 0, lastOccurrence: log.timestamp }
    }
    groups[key].count++
    if (new Date(log.timestamp) > new Date(groups[key].lastOccurrence)) {
      groups[key].lastOccurrence = log.timestamp
    }
    return groups
  }, {} as Record<string, { count: number; lastOccurrence: string }>)
  
  const topErrors = Object.entries(errorGroups)
    .map(([message, data]) => ({ message, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalLogs: logs.length,
    todayLogs: todayLogs.length,
    errorCount: errorLogs.length,
    warningCount: warningLogs.length,
    avgResponseTime: Math.round(avgResponseTime),
    systemStatus,
    warningRate: Math.round((warningLogs.length / logs.length) * 100),
    storageUsed: getRandomNumber(2048, 8192), // MB
    storageTotal: 10240, // MB
    topErrors
  }
}

// 기본 Mock 데이터 (1000개 로그 엔트리)
export const mockLogs = generateLogEntries(1000)
export const mockStats = generateLogStats(mockLogs) 