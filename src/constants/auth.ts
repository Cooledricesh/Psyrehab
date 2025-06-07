// Authentication error codes
export const AUTH_ERROR_CODES = {
  // Generic errors
  UNKNOWN_ERROR: 'unknown_error',
  NETWORK_ERROR: 'network_error',
  
  // Authentication errors
  INVALID_CREDENTIALS: 'invalid_credentials',
  USER_NOT_FOUND: 'user_not_found',
  WEAK_PASSWORD: 'weak_password',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  TOO_MANY_REQUESTS: 'too_many_requests',
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS: 'insufficient_permissions',
  ACCOUNT_DISABLED: 'account_disabled',
  
  // Profile errors
  PROFILE_NOT_FOUND: 'profile_not_found',
  INVALID_ROLE: 'invalid_role',
  ROLE_ASSIGNMENT_FAILED: 'role_assignment_failed',
  PROFILE_CREATION_FAILED: 'profile_creation_failed',
  
  // Password errors
  PASSWORD_MISMATCH: 'password_mismatch',
  OLD_PASSWORD_INCORRECT: 'old_password_incorrect',
  
  // Email errors
  INVALID_EMAIL: 'invalid_email',
  EMAIL_ALREADY_EXISTS: 'email_already_exists',
  EMAIL_NOT_VERIFIED: 'email_not_verified'
} as const

// Authentication error messages (Korean)
export const AUTH_ERROR_MESSAGES = {
  [AUTH_ERROR_CODES.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',
  [AUTH_ERROR_CODES.NETWORK_ERROR]: '네트워크 오류가 발생했습니다.',
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: '이메일 또는 비밀번호가 올바르지 않습니다.',
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: '사용자를 찾을 수 없습니다.',
  [AUTH_ERROR_CODES.WEAK_PASSWORD]: '비밀번호가 너무 약합니다. 8자 이상, 숫자와 특수문자를 포함해주세요.',
  [AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED]: '이메일 인증이 필요합니다. 이메일을 확인해주세요.',
  [AUTH_ERROR_CODES.TOO_MANY_REQUESTS]: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  [AUTH_ERROR_CODES.INSUFFICIENT_PERMISSIONS]: '이 작업을 수행할 권한이 없습니다.',
  [AUTH_ERROR_CODES.ACCOUNT_DISABLED]: '계정이 비활성화되었습니다. 관리자에게 문의하세요.',
  [AUTH_ERROR_CODES.PROFILE_NOT_FOUND]: '사용자 프로필을 찾을 수 없습니다.',
  [AUTH_ERROR_CODES.INVALID_ROLE]: '유효하지 않은 사용자 역할입니다.',
  [AUTH_ERROR_CODES.ROLE_ASSIGNMENT_FAILED]: '역할 할당에 실패했습니다.',
  [AUTH_ERROR_CODES.PROFILE_CREATION_FAILED]: '프로필 생성에 실패했습니다.',
  [AUTH_ERROR_CODES.PASSWORD_MISMATCH]: '비밀번호가 일치하지 않습니다.',
  [AUTH_ERROR_CODES.OLD_PASSWORD_INCORRECT]: '현재 비밀번호가 올바르지 않습니다.',
  [AUTH_ERROR_CODES.INVALID_EMAIL]: '유효하지 않은 이메일 주소입니다.',
  [AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS]: '이미 가입된 이메일 주소입니다.',
  [AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED]: '이메일 인증이 완료되지 않았습니다.'
} as const

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,
  FORBIDDEN_PATTERNS: [
    'password',
    '123456',
    'qwerty',
    'admin',
    'user'
  ]
} as const

// Session configuration
export const SESSION_CONFIG = {
  REFRESH_THRESHOLD: 300, // 5 minutes before expiry
  MAX_IDLE_TIME: 3600000, // 1 hour in milliseconds
  TOKEN_STORAGE_KEY: 'supabase.auth.token',
  USER_STORAGE_KEY: 'supabase.auth.user'
} as const

// Authentication flow configuration
export const AUTH_FLOW_CONFIG = {
  SIGNUP_REDIRECT_URL: '/auth/verify-email',
  SIGNIN_REDIRECT_URL: '/dashboard',
  SIGNOUT_REDIRECT_URL: '/auth/signin',
  PASSWORD_RESET_REDIRECT_URL: '/auth/reset-password',
  EMAIL_CONFIRMATION_REDIRECT_URL: '/auth/email-confirmed'
} as const

// Rate limiting
export const RATE_LIMITS = {
  SIGNIN_ATTEMPTS: 5,
  SIGNUP_ATTEMPTS: 3,
  PASSWORD_RESET_ATTEMPTS: 3,
  LOCKOUT_DURATION: 900000 // 15 minutes in milliseconds
} as const

// User role configuration
export const USER_ROLE_CONFIG = {
  DEFAULT_ROLE: 'patient' as const,
  ADMIN_ROLES: ['administrator'] as const,
  STAFF_ROLES: ['administrator', 'social_worker'] as const,
  CLIENT_ROLES: ['patient'] as const
} as const

// OAuth providers
export const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  GITHUB: 'github',
  AZURE: 'azure',
  FACEBOOK: 'facebook'
} as const

// Authentication events
export const AUTH_EVENTS = {
  SIGNED_IN: 'SIGNED_IN',
  SIGNED_OUT: 'SIGNED_OUT',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  USER_UPDATED: 'USER_UPDATED',
  PASSWORD_RECOVERY: 'PASSWORD_RECOVERY',
  USER_DELETED: 'USER_DELETED'
} as const

export type AuthErrorCode = keyof typeof AUTH_ERROR_CODES
export type AuthEvent = keyof typeof AUTH_EVENTS
export type OAuthProvider = keyof typeof OAUTH_PROVIDERS 