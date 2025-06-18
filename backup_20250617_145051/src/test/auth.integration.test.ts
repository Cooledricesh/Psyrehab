import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { AuthService } from '../services/auth'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          neq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
    })),
  },
  getUserProfile: vi.fn(),
  getUserRole: vi.fn(),
  hasPermission: vi.fn(),
}))

// Mock auth utilities
vi.mock('../utils/auth', () => ({
  isValidEmail: vi.fn(() => true),
  validatePassword: vi.fn(() => ({ isValid: true, errors: [] })),
  validatePasswordConfirmation: vi.fn(() => ({ isValid: true, errors: [] })),
  validateFullName: vi.fn(() => ({ isValid: true, errors: [] })),
  validateEmployeeId: vi.fn(() => ({ isValid: true, errors: [] })),
  validatePatientIdentifier: vi.fn(() => ({ isValid: true, errors: [] })),
  validatePhoneNumber: vi.fn(() => ({ isValid: true, errors: [] })),
  validateDateOfBirth: vi.fn(() => ({ isValid: true, errors: [] })),
  checkRateLimit: vi.fn(() => ({ allowed: true })),
  recordAttempt: vi.fn(),
  getAuthErrorMessage: vi.fn((error) => error?.message || '인증 오류가 발생했습니다.'),
}))

// Mock auth constants
vi.mock('../constants/auth', () => ({
  AUTH_ERROR_CODES: {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    EMAIL_NOT_CONFIRMED: 'EMAIL_NOT_CONFIRMED',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    WEAK_PASSWORD: 'WEAK_PASSWORD',
    EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  },
  AUTH_FLOW_CONFIG: {
    EMAIL_CONFIRMATION_REDIRECT_URL: '/auth/callback',
    SESSION_TIMEOUT_WARNING: 5 * 60 * 1000, // 5 minutes
    SESSION_TIMEOUT_LOGOUT: 15 * 60 * 1000, // 15 minutes
    MAX_SIGNIN_ATTEMPTS: 5,
    MAX_SIGNUP_ATTEMPTS: 3,
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  },
}))

describe('AuthService Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('signIn', () => {
    it('successfully signs in with valid credentials', async () => {
      const { supabase, getUserProfile } = await import('../lib/supabase')
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: { full_name: '테스트 사용자' },
        aud: 'authenticated',
        role: 'authenticated'
      }

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockUser
      }

      const mockProfile = {
        id: 'user-123',
        full_name: '테스트 사용자',
        email: 'test@example.com',
        department: 'IT',
        position: 'Developer',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Mock successful auth
      const mockSignInWithPassword = supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>
      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      // Mock successful profile fetch
      const mockGetUserProfile = getUserProfile as ReturnType<typeof vi.fn>
      mockGetUserProfile.mockResolvedValue(mockProfile)

      const result = await AuthService.signIn({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
      expect(result.session).toEqual(mockSession)
      expect(result.profile).toEqual(mockProfile)
      expect(result.error).toBeUndefined()

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(mockGetUserProfile).toHaveBeenCalledWith('user-123')
    })

    it('handles invalid email format', async () => {
      const { isValidEmail } = await import('../utils/auth')
      const mockIsValidEmail = isValidEmail as ReturnType<typeof vi.fn>
      mockIsValidEmail.mockReturnValue(false)

      const result = await AuthService.signIn({
        email: 'invalid-email',
        password: 'password123'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('유효한 이메일 주소를 입력해주세요.')
      expect(result.user).toBeUndefined()
      expect(result.session).toBeUndefined()
    })

    it('handles authentication errors', async () => {
      const { supabase } = await import('../lib/supabase')
      const { getAuthErrorMessage } = await import('../utils/auth')

      const mockSignInWithPassword = supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>
      const mockGetAuthErrorMessage = getAuthErrorMessage as ReturnType<typeof vi.fn>

      const authError = { message: 'Invalid login credentials' }
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })

      mockGetAuthErrorMessage.mockReturnValue('이메일 또는 비밀번호가 올바르지 않습니다.')

      const result = await AuthService.signIn({
        email: 'test@example.com',
        password: 'wrongpassword'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('이메일 또는 비밀번호가 올바르지 않습니다.')
      expect(mockGetAuthErrorMessage).toHaveBeenCalledWith(authError)
    })
  })

  describe('signOut', () => {
    it('successfully signs out', async () => {
      const { supabase } = await import('../lib/supabase')

      const mockSignOut = supabase.auth.signOut as ReturnType<typeof vi.fn>
      mockSignOut.mockResolvedValue({ error: null })

      const result = await AuthService.signOut()

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('getCurrentUser', () => {
    it('returns current user when authenticated', async () => {
      const { supabase } = await import('../lib/supabase')

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: { full_name: '테스트 사용자' },
        aud: 'authenticated',
        role: 'authenticated'
      }

      const mockGetUser = supabase.auth.getUser as ReturnType<typeof vi.fn>
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await AuthService.getCurrentUser()

      expect(result).toEqual(mockUser)
      expect(mockGetUser).toHaveBeenCalled()
    })

    it('returns null when not authenticated', async () => {
      const { supabase } = await import('../lib/supabase')

      const mockGetUser = supabase.auth.getUser as ReturnType<typeof vi.fn>
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await AuthService.getCurrentUser()

      expect(result).toBeNull()
    })
  })
}) 