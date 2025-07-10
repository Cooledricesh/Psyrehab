// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface SanitizationOptions {
  allowedTags?: string[]
  removeEmpty?: boolean
  trimWhitespace?: boolean
  maxLength?: number
  preserveLineBreaks?: boolean
}

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

  // 2. 모든 위험한 패턴 제거 (반복 실행으로 중첩된 패턴도 제거)
  let previousValue = ''
  let iterations = 0
  const maxIterations = 10 // 무한 루프 방지
  
  while (previousValue !== sanitized && iterations < maxIterations) {
    previousValue = sanitized
    iterations++
    
    // 스크립트 관련 패턴 제거
    sanitized = sanitized
      // 스크립트 태그 (대소문자 무시, 줄바꿈 포함)
      .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
      .replace(/<\s*script[^>]*>/gi, '')
      // 스타일 태그 (CSS 인젝션 방지)
      .replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '')
      // 이벤트 핸들러 속성
      .replace(/\s+on[a-z]+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*[^\s>]*/gi, '')
      // 위험한 프로토콜
      .replace(/javascript\s*:/gi, '')
      .replace(/vbscript\s*:/gi, '')
      .replace(/data\s*:\s*[^,]*,/gi, '')
      // 이스케이프된 스크립트 패턴
      .replace(/\\x3cscript/gi, '')
      .replace(/\\u003cscript/gi, '')
      .replace(/%3cscript/gi, '')
      .replace(/&lt;script/gi, '')
  }

  // 3. HTML 인코딩 처리
  if (allowedTags.length === 0) {
    // 모든 HTML을 인코딩
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  } else {
    // 허용된 태그만 보존
    const placeholder = `__SAFE_TAG_${Date.now()}_`
    const safeTags: Array<{ placeholder: string; original: string }> = []
    
    // 허용된 태그를 플레이스홀더로 교체
    allowedTags.forEach((tag) => {
      // 여는 태그
      const openTagRegex = new RegExp(`<(${tag})(\\s+[^>]*)?\\s*>`, 'gi')
      sanitized = sanitized.replace(openTagRegex, (match, tagName, attributes) => {
        // 속성에서 위험한 패턴 제거
        const safeAttributes = attributes ? 
          attributes.replace(/\s+on[a-z]+\s*=\s*["'][^"']*["']/gi, '')
                   .replace(/javascript\s*:/gi, '') : ''
        const safeTag = `<${tagName}${safeAttributes}>`
        const id = safeTags.length
        safeTags.push({ 
          placeholder: `${placeholder}${id}__`, 
          original: safeTag 
        })
        return `${placeholder}${id}__`
      })
      
      // 닫는 태그
      const closeTagRegex = new RegExp(`<\\s*\\/\\s*${tag}\\s*>`, 'gi')
      sanitized = sanitized.replace(closeTagRegex, (match) => {
        const id = safeTags.length
        safeTags.push({ 
          placeholder: `${placeholder}${id}__`, 
          original: match 
        })
        return `${placeholder}${id}__`
      })
    })
    
    // 나머지 모든 HTML 인코딩
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
    
    // 안전한 태그 복원
    safeTags.forEach(({ placeholder, original }) => {
      sanitized = sanitized.replace(placeholder, original)
    })
  }

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

  let sanitized = input
  let previousValue = ''
  let iterations = 0
  const maxIterations = 10 // 무한 루프 방지
  
  // 반복적으로 위험한 패턴 제거
  while (previousValue !== sanitized && iterations < maxIterations) {
    previousValue = sanitized
    iterations++
    
    // 스크립트 태그 제거 (다양한 변형 포함)
    sanitized = sanitized
      .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
      .replace(/<\s*script[^>]*>/gi, '')
      // 이벤트 핸들러 제거
      .replace(/\s+on[a-z]+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*[^\s>]*/gi, '')
      // 자바스크립트 URL 제거
      .replace(/javascript\s*:/gi, '')
      .replace(/vbscript\s*:/gi, '')
      // 데이터 URL 스키마 제거
      .replace(/data\s*:\s*[^,;]*[,;]/gi, '')
  }
  
  return sanitized
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
// PATH TRAVERSAL PREVENTION
// =============================================================================

/**
 * 파일 경로 정화 (Path Traversal 공격 방지)
 */
export function sanitizePath(input: string): string {
  if (typeof input !== 'string') return ''

  return input
    // 상위 디렉토리 접근 방지
    .replace(/\.\./g, '')
    // 절대 경로 방지
    .replace(/^\//, '')
    .replace(/^[a-zA-Z]:/, '')
    // 특수 문자 제거
    .replace(/[<>"|?*]/g, '')
    // 연속된 슬래시 정리
    .replace(/\/+/g, '/')
    // 공백 제거
    .trim()
}

// =============================================================================
// FILENAME SANITIZATION
// =============================================================================

/**
 * 파일명 정화
 */
export function sanitizeFilename(
  input: string,
  options: FilenameSanitizationOptions = {}
): string {
  if (typeof input !== 'string') return ''

  const {
    replacement = '_',
    maxLength = 255,
    preserveExtension = true
  } = options

  let filename = input
  let extension = ''

  // 확장자 분리
  if (preserveExtension) {
    const lastDot = filename.lastIndexOf('.')
    if (lastDot > 0) {
      extension = filename.substring(lastDot)
      filename = filename.substring(0, lastDot)
    }
  }

  // 위험한 문자 제거
  filename = filename
    // Windows 예약어 제거
    .replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, replacement)
    // 특수 문자 제거
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, replacement)
    // 시작/끝 점 제거
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    // 공백 정리
    .trim()

  // 빈 파일명 처리
  if (!filename) {
    filename = 'unnamed'
  }

  // 길이 제한
  const extensionLength = extension.length
  if (filename.length + extensionLength > maxLength) {
    filename = filename.substring(0, maxLength - extensionLength)
  }

  return filename + extension
}

// =============================================================================
// KOREAN TEXT VALIDATION AND SANITIZATION
// =============================================================================

/**
 * 한글 텍스트 검증 및 정화
 */
export function sanitizeKoreanText(input: string): string {
  if (typeof input !== 'string') return ''

  return input
    // 완성된 한글만 허용 (자음/모음 단독 제거)
    .replace(/[ㄱ-ㅎㅏ-ㅣ]/g, '')
    // 특수 공백 문자를 일반 공백으로
    .replace(/[\u00A0\u2002-\u200B\u3000]/g, ' ')
    // 연속된 공백 정리
    .replace(/\s+/g, ' ')
    .trim()
}

// =============================================================================
// NUMBER SANITIZATION
// =============================================================================

/**
 * 숫자 문자열 정화
 */
export function sanitizeNumber(input: string): string {
  if (typeof input !== 'string') return ''

  // 숫자와 소수점, 음수 기호만 허용
  return input.replace(/[^0-9.-]/g, '')
}

/**
 * 전화번호 정화
 */
export function sanitizePhoneNumber(input: string): string {
  if (typeof input !== 'string') return ''

  // 숫자와 일부 구분자만 허용
  return input.replace(/[^0-9+\-().\s]/g, '')
}

// =============================================================================
// GENERAL PURPOSE SANITIZATION
// =============================================================================

/**
 * 범용 문자열 정화 (기본적인 XSS 방어)
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return ''

  return sanitizeHtml(input, { allowedTags: [] })
}

/**
 * 객체의 모든 문자열 속성 정화
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: SanitizationOptions = {}
): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  const sanitized: Record<keyof T, (value: unknown) => unknown> = {} as any

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]

      if (typeof value === 'string') {
        (sanitized as any)[key] = sanitizeHtml(value, options)
      } else if (typeof value === 'object' && value !== null) {
        (sanitized as any)[key] = sanitizeObject(value as Record<string, unknown>, options)
      } else {
        (sanitized as any)[key] = value
      }
    }
  }

  return sanitized as T
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * 안전한 HTML 태그인지 검증
 */
export function isSafeHtmlTag(tag: string): boolean {
  const safeTags = [
    'p', 'div', 'span', 'strong', 'em', 'b', 'i', 'u',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'br', 'hr',
    'a', 'img', 'blockquote', 'code', 'pre'
  ]
  return safeTags.includes(tag.toLowerCase())
}

/**
 * URL이 안전한지 검증
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const safeProtocols = ['http:', 'https:', 'mailto:']
    return safeProtocols.includes(parsed.protocol)
  } catch {
    return false
  }
}

// =============================================================================
// EXPORT ALL
// =============================================================================

export {
  sanitizeHtml as default,
  sanitizeHtml as sanitize
}