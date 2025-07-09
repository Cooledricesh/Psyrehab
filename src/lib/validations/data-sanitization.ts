// =============================================================================
// DATA SANITIZATION UTILITIES
// =============================================================================

/**
 * 데이터 정화 옵션 인터페이스
 */
export interface SanitizationOptions {
  allowedTags?: string[]
  allowedAttributes?: string[]
  removeEmpty?: boolean
  trimWhitespace?: boolean
  maxLength?: number
  preserveLineBreaks?: boolean
}

/**
 * 파일명 정화 옵션
 */
export interface FilenameSanitizationOptions {
  replacement?: string
  maxLength?: number
  preserveExtension?: boolean
}

// =============================================================================
// HTML/XSS SANITIZATION
// =============================================================================

/**
 * HTML 태그 및 XSS 공격 방지를 위한 문자열 정화
 */
export function sanitizeHtml(
  input: string,
  options: SanitizationOptions = {}
): string {
  if (typeof input !== 'string') return ''

  const {
    allowedTags = [],
    removeEmpty = true,
    trimWhitespace = true,
    maxLength,
    preserveLineBreaks = false
  } = options

  let sanitized = input

  // 1. 길이 제한
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  // 2. 위험한 HTML 태그 제거 (허용된 태그 제외)
  if (allowedTags.length === 0) {
    // 모든 HTML 태그 제거
    sanitized = sanitized.replace(/<[^>]*>/g, '')
  } else {
    // 허용되지 않은 태그만 제거
    const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g
    sanitized = sanitized.replace(tagPattern, (match, tagName) => {
      return allowedTags.includes(tagName.toLowerCase()) ? match : ''
    })
  }

  // 3. 특수 문자 이스케이프
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')

  // 4. 줄바꿈 처리
  if (!preserveLineBreaks) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ')
  }

  // 5. 공백 정리
  if (trimWhitespace) {
    sanitized = sanitized.trim().replace(/\s+/g, ' ')
  }

  // 6. 빈 문자열 처리
  if (removeEmpty && sanitized.trim() === '') {
    return ''
  }

  return sanitized
}

/**
 * 스크립트 태그 및 이벤트 핸들러 제거
 */
export function removeScripts(input: string): string {
  if (typeof input !== 'string') return ''

  return input
    // 스크립트 태그 제거
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    // 이벤트 핸들러 제거
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // 자바스크립트 URL 제거
    .replace(/javascript\s*:/gi, '')
    // 데이터 URL 스키마 제거 (위험한 경우)
    .replace(/data\s*:[^;]*;base64/gi, '')
}

// =============================================================================
// SQL INJECTION PREVENTION
// =============================================================================

/**
 * SQL 인젝션 공격 방지를 위한 문자열 정화
 */
export function sanitizeSql(input: string): string {
  if (typeof input !== 'string') return ''

  return input
    // SQL 특수 문자 이스케이프
    .replace(/'/g, "''")
    .replace(/"/g, '""')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    // SQL 키워드 패턴 제거 (기본적인 방어만)
    .replace(/(\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE|UNION|SELECT)\b)/gi, '')
    // 주석 패턴 제거
    .replace(/--.*$/gm, '')
    .replace(/\/\*.*?\*\//gs, '')
}

// =============================================================================
// FILENAME SANITIZATION
// =============================================================================

/**
 * 파일명 정화 (보안 및 호환성)
 */
export function sanitizeFilename(
  filename: string,
  options: FilenameSanitizationOptions = {}
): string {
  if (typeof filename !== 'string' || filename.trim() === '') {
    return 'unnamed_file'
  }

  const {
    replacement = '_',
    maxLength = 255,
    preserveExtension = true
  } = options

  const sanitized = filename.trim()

  // 확장자 분리
  let name = sanitized
  let extension = ''
  
  if (preserveExtension) {
    const lastDot = sanitized.lastIndexOf('.')
    if (lastDot > 0) {
      name = sanitized.substring(0, lastDot)
      extension = sanitized.substring(lastDot)
    }
  }

  // 위험한 문자 제거/대체
  name = name
    // 제어 문자 제거
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    // 파일시스템에서 금지된 문자 대체
    .replace(/[<>:"/\\|?*]/g, replacement)
    // 점으로 시작하는 파일명 방지
    .replace(/^\.+/, '')
    // 연속된 점 제거
    .replace(/\.{2,}/g, '.')
    // 공백을 언더스코어로 대체
    .replace(/\s+/g, replacement)
    // 연속된 대체 문자 정리
    .replace(new RegExp(`\\${replacement}+`, 'g'), replacement)
    // 시작/끝 대체 문자 제거
    .replace(new RegExp(`^\\${replacement}+|\\${replacement}+$`, 'g'), '')

  // 예약된 파일명 처리 (Windows)
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ]
  
  if (reservedNames.includes(name.toUpperCase())) {
    name = `${name}_file`
  }

  // 길이 제한
  const totalLength = name.length + extension.length
  if (totalLength > maxLength) {
    const availableLength = maxLength - extension.length
    name = name.substring(0, Math.max(1, availableLength))
  }

  // 빈 이름 방지
  if (name === '') {
    name = 'file'
  }

  return name + extension
}

// =============================================================================
// DATA TYPE SPECIFIC SANITIZATION
// =============================================================================

/**
 * 이메일 주소 정화
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return ''

  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w.@+-]/g, '') // 허용된 문자만 유지
    .replace(/\.{2,}/g, '.') // 연속된 점 제거
    .replace(/^\.+|\.+$/g, '') // 시작/끝 점 제거
}

/**
 * 전화번호 정화
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return ''

  return phone
    .replace(/[^\d-+() ]/g, '') // 숫자와 기본 기호만 유지
    .replace(/\s+/g, ' ') // 공백 정리
    .trim()
}

/**
 * URL 정화
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return ''

  // 기본 정화
  let sanitized = url.trim()

  // 위험한 프로토콜 차단
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
  const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/
  
  if (hasProtocol.test(sanitized)) {
    const protocol = sanitized.split(':')[0].toLowerCase() + ':'
    if (dangerousProtocols.includes(protocol)) {
      return ''
    }
  }

  // HTTP/HTTPS가 아닌 경우 기본 프로토콜 추가
  if (!sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
    sanitized = 'https://' + sanitized.replace(/^\/+/, '')
  }

  return sanitized
}

/**
 * 환자 식별번호 정화
 */
export function sanitizePatientId(patientId: string): string {
  if (typeof patientId !== 'string') return ''

  return patientId
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '') // 영문 대문자, 숫자, 하이픈만 허용
    .replace(/-{2,}/g, '-') // 연속된 하이픈 제거
    .replace(/^-+|-+$/g, '') // 시작/끝 하이픈 제거
}

// =============================================================================
// OBJECT SANITIZATION
// =============================================================================

/**
 * 객체의 모든 문자열 필드 정화
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fieldRules: Record<keyof T, (value: unknown) => unknown> = {}
): T {
  if (!obj || typeof obj !== 'object') return obj

  const sanitized = { ...obj }

  for (const [key, value] of Object.entries(sanitized)) {
    if (fieldRules[key]) {
      // 특정 필드 규칙 적용
      sanitized[key] = fieldRules[key](value)
    } else if (typeof value === 'string') {
      // 기본 문자열 정화
      sanitized[key] = sanitizeHtml(value, { removeEmpty: false })
    } else if (Array.isArray(value)) {
      // 배열 요소 정화
      sanitized[key] = value.map(item =>
        typeof item === 'string' 
          ? sanitizeHtml(item, { removeEmpty: false })
          : item
      )
    } else if (value && typeof value === 'object') {
      // 중첩 객체 재귀 정화
      sanitized[key] = sanitizeObject(value, {})
    }
  }

  return sanitized
}

// =============================================================================
// FORM DATA SANITIZATION
// =============================================================================

/**
 * 환자 데이터 정화
 */
export function sanitizePatientData(data: unknown) {
  return sanitizeObject(data, {
    name: (value: string) => sanitizeHtml(value, { trimWhitespace: true, maxLength: 100 }),
    email: sanitizeEmail,
    phone: sanitizePhone,
    patient_identifier: sanitizePatientId,
    address: (value: string) => sanitizeHtml(value, { 
      trimWhitespace: true, 
      maxLength: 500,
      preserveLineBreaks: true 
    }),
    medical_history: (value: string) => sanitizeHtml(value, { 
      trimWhitespace: true,
      preserveLineBreaks: true,
      maxLength: 5000
    }),
    notes: (value: string) => sanitizeHtml(value, { 
      preserveLineBreaks: true,
      maxLength: 2000
    })
  })
}

/**
 * 서비스 기록 데이터 정화
 */
export function sanitizeServiceData(data: unknown) {
  return sanitizeObject(data, {
    service_title: (value: string) => sanitizeHtml(value, { trimWhitespace: true, maxLength: 200 }),
    service_description: (value: string) => sanitizeHtml(value, { 
      preserveLineBreaks: true,
      maxLength: 2000
    }),
    service_notes: (value: string) => sanitizeHtml(value, { 
      preserveLineBreaks: true,
      maxLength: 5000
    }),
    service_location: (value: string) => sanitizeHtml(value, { trimWhitespace: true, maxLength: 200 })
  })
}

/**
 * 목표 데이터 정화
 */
export function sanitizeGoalData(data: unknown) {
  return sanitizeObject(data, {
    title: (value: string) => sanitizeHtml(value, { trimWhitespace: true, maxLength: 200 }),
    description: (value: string) => sanitizeHtml(value, { 
      preserveLineBreaks: true,
      maxLength: 1000
    }),
    success_criteria: (value: string) => sanitizeHtml(value, { 
      preserveLineBreaks: true,
      maxLength: 500
    }),
    notes: (value: string) => sanitizeHtml(value, { 
      preserveLineBreaks: true,
      maxLength: 2000
    })
  })
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * 정화된 데이터가 원본과 다른지 확인
 */
export function hasDataChanged(original: unknown, sanitized: unknown): boolean {
  return JSON.stringify(original) !== JSON.stringify(sanitized)
}

/**
 * 정화 결과 보고서 생성
 */
export function generateSanitizationReport(original: unknown, sanitized: unknown) {
  const changes: Array<{
    field: string
    original: unknown
    sanitized: unknown
    changed: boolean
  }> = []

  function compareObjects(orig: unknown, san: unknown, path: string = '') {
    if (typeof orig !== typeof san) {
      changes.push({
        field: path,
        original: orig,
        sanitized: san,
        changed: true
      })
      return
    }

    if (typeof orig === 'object' && orig !== null) {
      for (const key of new Set([...Object.keys(orig || {}), ...Object.keys(san || {})])) {
        compareObjects(orig?.[key], san?.[key], path ? `${path}.${key}` : key)
      }
    } else {
      const changed = orig !== san
      changes.push({
        field: path,
        original: orig,
        sanitized: san,
        changed
      })
    }
  }

  compareObjects(original, sanitized)

  return {
    totalFields: changes.length,
    changedFields: changes.filter(c => c.changed).length,
    changes: changes.filter(c => c.changed),
    hasChanges: changes.some(c => c.changed)
  }
} 