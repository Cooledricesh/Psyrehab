import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// 로그 디렉토리 생성
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 보안 로그 디렉토리 생성
const securityLogDir = path.join(logDir, 'security');
if (!fs.existsSync(securityLogDir)) {
  fs.mkdirSync(securityLogDir, { recursive: true });
}

// 커스텀 로그 포맷
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// 보안 이벤트 전용 로거
export const securityLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'psyrehab-security' },
  transports: [
    // 일반 보안 로그 (info 이상)
    new DailyRotateFile({
      filename: path.join(securityLogDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'info'
    }),
    
    // 중요한 보안 이벤트 (warn 이상)
    new DailyRotateFile({
      filename: path.join(securityLogDir, 'security-alerts-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '90d',
      level: 'warn'
    }),
    
    // 콘솔 출력 (개발 환경)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
    })
  ]
});

// 애플리케이션 로거
export const appLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'psyrehab-app' },
  transports: [
    // 애플리케이션 로그
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    
    // 에러 로그
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    }),
    
    // 콘솔 출력
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    })
  ]
});

// 보안 이벤트 타입 정의
export const SecurityEventTypes = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  RATE_LIMIT: 'rate_limit',
  IP_BLOCKING: 'ip_blocking',
  SESSION: 'session',
  DATA_ACCESS: 'data_access',
  CSRF: 'csrf',
  XSS: 'xss',
  SQL_INJECTION: 'sql_injection',
  FILE_UPLOAD: 'file_upload',
  CONFIGURATION: 'configuration',
  VULNERABILITY: 'vulnerability',
  INCIDENT: 'incident'
};

// 보안 이벤트 심각도
export const SecuritySeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// 보안 이벤트 로깅 함수
export function logSecurityEvent(eventType, severity, message, metadata = {}) {
  const securityEvent = {
    eventType,
    severity,
    message,
    timestamp: new Date().toISOString(),
    ip: metadata.ip || 'unknown',
    userAgent: metadata.userAgent || 'unknown',
    userId: metadata.userId || null,
    sessionId: metadata.sessionId || null,
    endpoint: metadata.endpoint || null,
    method: metadata.method || null,
    statusCode: metadata.statusCode || null,
    ...metadata
  };

  // 심각도에 따른 로그 레벨 결정
  let logLevel;
  switch (severity) {
    case SecuritySeverity.CRITICAL:
      logLevel = 'error';
      break;
    case SecuritySeverity.HIGH:
      logLevel = 'warn';
      break;
    case SecuritySeverity.MEDIUM:
      logLevel = 'info';
      break;
    case SecuritySeverity.LOW:
    default:
      logLevel = 'info'; // Changed from 'debug' to 'info' so LOW severity events are logged to files
      break;
  }

  securityLogger.log(logLevel, message, securityEvent);
  
  // 중요한 이벤트는 애플리케이션 로거에도 기록
  if (severity === SecuritySeverity.CRITICAL || severity === SecuritySeverity.HIGH) {
    appLogger.warn(`SECURITY ALERT: ${message}`, securityEvent);
  }
}

// 인증 관련 로깅
export function logAuthEvent(action, success, metadata = {}) {
  const severity = success ? SecuritySeverity.LOW : SecuritySeverity.MEDIUM;
  const message = `Authentication ${action}: ${success ? 'SUCCESS' : 'FAILED'}`;
  
  logSecurityEvent(SecurityEventTypes.AUTHENTICATION, severity, message, {
    action,
    success,
    ...metadata
  });
}

// 권한 관련 로깅
export function logAuthzEvent(action, allowed, metadata = {}) {
  const severity = allowed ? SecuritySeverity.LOW : SecuritySeverity.HIGH;
  const message = `Authorization ${action}: ${allowed ? 'ALLOWED' : 'DENIED'}`;
  
  logSecurityEvent(SecurityEventTypes.AUTHORIZATION, severity, message, {
    action,
    allowed,
    ...metadata
  });
}

// Rate Limiting 로깅
export function logRateLimitEvent(exceeded, metadata = {}) {
  const severity = exceeded ? SecuritySeverity.MEDIUM : SecuritySeverity.LOW;
  const message = `Rate limit ${exceeded ? 'EXCEEDED' : 'checked'}`;
  
  logSecurityEvent(SecurityEventTypes.RATE_LIMIT, severity, message, {
    exceeded,
    ...metadata
  });
}

// IP 차단 로깅
export function logIPBlockingEvent(action, ip, metadata = {}) {
  const severity = action === 'blocked' ? SecuritySeverity.HIGH : SecuritySeverity.MEDIUM;
  const message = `IP ${ip} ${action.toUpperCase()}`;
  
  logSecurityEvent(SecurityEventTypes.IP_BLOCKING, severity, message, {
    action,
    targetIP: ip,
    ...metadata
  });
}

// 세션 관련 로깅
export function logSessionEvent(action, metadata = {}) {
  const severity = action.includes('hijack') || action.includes('fixation') 
    ? SecuritySeverity.HIGH 
    : SecuritySeverity.LOW;
  const message = `Session ${action}`;
  
  logSecurityEvent(SecurityEventTypes.SESSION, severity, message, {
    action,
    ...metadata
  });
}

// 데이터 접근 로깅
export function logDataAccessEvent(resource, action, authorized, metadata = {}) {
  const severity = authorized ? SecuritySeverity.LOW : SecuritySeverity.HIGH;
  const message = `Data access to ${resource}: ${action} - ${authorized ? 'AUTHORIZED' : 'UNAUTHORIZED'}`;
  
  logSecurityEvent(SecurityEventTypes.DATA_ACCESS, severity, message, {
    resource,
    action,
    authorized,
    ...metadata
  });
}

// 보안 인시던트 로깅
export function logSecurityIncident(incidentType, description, metadata = {}) {
  const severity = SecuritySeverity.CRITICAL;
  const message = `SECURITY INCIDENT: ${incidentType} - ${description}`;
  
  logSecurityEvent(SecurityEventTypes.INCIDENT, severity, message, {
    incidentType,
    description,
    ...metadata
  });
}

// 취약점 발견 로깅
export function logVulnerabilityEvent(vulnerabilityType, description, metadata = {}) {
  const severity = SecuritySeverity.HIGH;
  const message = `VULNERABILITY DETECTED: ${vulnerabilityType} - ${description}`;
  
  logSecurityEvent(SecurityEventTypes.VULNERABILITY, severity, message, {
    vulnerabilityType,
    description,
    ...metadata
  });
}

// 로그 분석을 위한 쿼리 함수들
export function getSecurityLogs(options = {}) {
  const {
    startDate,
    endDate,
    eventType,
    severity,
    ip,
    limit = 100
  } = options;

  // 실제 구현에서는 로그 파일을 파싱하거나 로그 데이터베이스를 쿼리
  // 여기서는 기본 구조만 제공
  return {
    query: options,
    message: 'Log query functionality would be implemented here'
  };
}

// 보안 메트릭 생성
export function generateSecurityMetrics(timeRange = '24h') {
  // 실제 구현에서는 로그를 분석하여 메트릭 생성
  return {
    timeRange,
    totalEvents: 0,
    eventsByType: {},
    eventsBySeverity: {},
    topIPs: [],
    suspiciousActivity: []
  };
}

// Express 미들웨어 - 요청 로깅
export function requestLoggingMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // 응답 완료 시 로깅
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const metadata = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.path,
      statusCode: res.statusCode,
      duration,
      sessionId: req.session?.id,
      userId: req.session?.userId
    };

    // 보안 관련 엔드포인트나 에러 상태 코드는 보안 로그에 기록
    if (req.path.includes('/auth') || 
        req.path.includes('/admin') || 
        res.statusCode >= 400) {
      
      const severity = res.statusCode >= 500 ? SecuritySeverity.HIGH :
                      res.statusCode >= 400 ? SecuritySeverity.MEDIUM :
                      SecuritySeverity.LOW;
      
      logSecurityEvent('request', severity, 
        `${req.method} ${req.path} - ${res.statusCode}`, metadata);
    }

    // 모든 요청은 애플리케이션 로그에 기록
    appLogger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, metadata);
  });

  next();
}

// 에러 로깅 미들웨어
export function errorLoggingMiddleware(err, req, res, next) {
  const metadata = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    endpoint: req.path,
    sessionId: req.session?.id,
    userId: req.session?.userId,
    stack: err.stack
  };

  // 보안 관련 에러인지 확인
  const isSecurityError = err.message.includes('CSRF') ||
                         err.message.includes('unauthorized') ||
                         err.message.includes('forbidden') ||
                         err.status === 401 ||
                         err.status === 403;

  if (isSecurityError) {
    logSecurityEvent('error', SecuritySeverity.HIGH, err.message, metadata);
  }

  // 모든 에러는 애플리케이션 로그에 기록
  appLogger.error(err.message, metadata);

  next(err);
} 