import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { AuthQueryProvider, useEnhancedAuth } from '../AuthQueryContext'
import { mockUser, mockSession, mockUserProfile, mockUserRole, mockEnvVars } from '../../test/testUtils'

vi.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    getSession: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    resetPassword: vi.fn(),
    resendVerification: vi.fn(),
    updatePassword: vi.fn(),
    getUserProfile: vi.fn(),
    getUserRole: vi.fn(),
    getUserPermissions: vi.fn(),
    getUserSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
  },
}))

function createWrapper() {
  return ({ children }: { children: ReactNode }) => (
    <AuthQueryProvider>
      {children}
    </AuthQueryProvider>
  )
}

describe('AuthQueryContext', () => {
  beforeEach(() => {
    mockEnvVars()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('useEnhancedAuth', () => {
    it('provides enhanced authentication context with query states', async () => {
      const { authService } = await import('../../services/authService')

      mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null })
      mockGetSession.mockResolvedValue({ session: mockSession, error: null })
      mockGetUserProfile.mockResolvedValue({ profile: mockUserProfile, error: null })
      mockGetUserRole.mockResolvedValue({ role: mockUserRole, error: null })

      const { result } = renderHook(() => useEnhancedAuth(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.userQuery).toBeDefined()
      expect(result.current.sessionQuery).toBeDefined()
      expect(result.current.profileQuery).toBeDefined()
      expect(result.current.roleQuery).toBeDefined()

      expect(result.current.signInMutation).toBeDefined()
      expect(result.current.signUpMutation).toBeDefined()
      expect(result.current.signOutMutation).toBeDefined()
      expect(result.current.updateProfileMutation).toBeDefined()
    })

    it('handles sign in through enhanced context', async () => {
      const { authService } = await import('../../services/authService')

      mockSignIn.mockResolvedValue({
        user: mockUser,
        session: mockSession,
        error: null,
      })

      mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null })

      const { result } = renderHook(() => useEnhancedAuth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123')
      })

      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    it('handles sign up through enhanced context', async () => {
      const { authService } = await import('../../services/authService')

      mockSignUp.mockResolvedValue({
        user: mockUser,
        session: null, // Usually null for unconfirmed accounts
        error: null,
      })

      const { result } = renderHook(() => useEnhancedAuth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

        email: 'test@example.com',
        password: 'password123',
        fullName: '테스트 사용자',
        department: 'IT',
        position: 'Developer',
      }

      await act(async () => {
        await result.current.signUp(signUpData)
      })

      expect(mockSignUp).toHaveBeenCalledWith(signUpData)
    })

    it('handles sign out through enhanced context', async () => {
      const { authService } = await import('../../services/authService')

      mockSignOut.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useEnhancedAuth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSignOut).toHaveBeenCalled()
    })

    it('handles profile updates through enhanced context', async () => {
      const { authService } = await import('../../services/authService')

        ...mockUserProfile,
        full_name: '업데이트된 사용자',
      }

      mockUpdateProfile.mockResolvedValue({
        profile: updatedProfile,
        error: null,
      })

      const { result } = renderHook(() => useEnhancedAuth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.updateProfile({ full_name: '업데이트된 사용자' })
      })

      expect(mockUpdateProfile).toHaveBeenCalledWith({ full_name: '업데이트된 사용자' })
    })

    it('provides backward compatibility with original AuthContext', async () => {
      const { authService } = await import('../../services/authService')

      mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null })
      mockGetSession.mockResolvedValue({ session: mockSession, error: null })
      mockGetUserProfile.mockResolvedValue({ profile: mockUserProfile, error: null })
      mockGetUserRole.mockResolvedValue({ role: mockUserRole, error: null })

      const { result } = renderHook(() => useEnhancedAuth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.signIn).toBeDefined()
      expect(result.current.signUp).toBeDefined()
      expect(result.current.signOut).toBeDefined()
      expect(result.current.resetPassword).toBeDefined()
      expect(result.current.updateProfile).toBeDefined()
      expect(result.current.updatePassword).toBeDefined()
      expect(result.current.resendVerification).toBeDefined()
      expect(result.current.refreshSession).toBeDefined()
      expect(result.current.updateSettings).toBeDefined()
      expect(result.current.hasPermission).toBeDefined()
      expect(result.current.hasRole).toBeDefined()
      expect(result.current.hasAnyRole).toBeDefined()
    })

    it('handles permission checking correctly', async () => {
      const { authService } = await import('../../services/authService')


      mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null })
      mockGetUserRole.mockResolvedValue({ role: adminRole, error: null })
      mockGetUserPermissions.mockResolvedValue({ permissions: adminPermissions, error: null })

      const { result } = renderHook(() => useEnhancedAuth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasPermission('read')).toBe(true)
      expect(result.current.hasPermission('write')).toBe(true)
      expect(result.current.hasPermission('delete')).toBe(true)
      expect(result.current.hasPermission('invalid')).toBe(false)

      expect(result.current.hasRole('admin')).toBe(true)
      expect(result.current.hasRole('user')).toBe(false)

      expect(result.current.hasAnyRole(['admin', 'moderator'])).toBe(true)
      expect(result.current.hasAnyRole(['user', 'moderator'])).toBe(false)
    })

    it('handles error states properly', async () => {
      const { authService } = await import('../../services/authService')

      mockGetCurrentUser.mockResolvedValue({
        user: null,
        error: { message: 'User not found' },
      })

      const { result } = renderHook(() => useEnhancedAuth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.userQuery?.isError).toBe(true)
      })

      expect(result.current.userQuery?.error).toBeTruthy()
    })

    it('handles mutation loading states', async () => {
      const { authService } = await import('../../services/authService')

      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

      const { result } = renderHook(() => useEnhancedAuth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.signInMutation.mutate({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(result.current.signInMutation.isPending).toBe(true)
    })
  })
}) 