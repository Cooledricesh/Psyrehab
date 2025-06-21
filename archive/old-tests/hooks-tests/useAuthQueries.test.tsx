import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { 
  useCurrentUser, 
  useSession, 
  useSignInMutation,
  useSignUpMutation,
  useSignOutMutation,
  useUpdateProfileMutation 
} from '../useAuthQueries'
import { mockUser, mockSession, mockUserProfile, mockSupabaseClient, mockEnvVars } from '../../test/testUtils'

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    getSession: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
  },
}))

// Create test wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useAuthQueries', () => {
  beforeEach(() => {
    mockEnvVars()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('useCurrentUser', () => {
    it('returns current user data when available', async () => {
      const { authService } = await import('../../services/authService')
      const mockGetCurrentUser = authService.getCurrentUser as ReturnType<typeof vi.fn>
      
      mockGetCurrentUser.mockResolvedValue({
        user: mockUser,
        error: null,
      })

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockUser)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('handles error when fetching current user', async () => {
      const { authService } = await import('../../services/authService')
      const mockGetCurrentUser = authService.getCurrentUser as ReturnType<typeof vi.fn>
      
      const errorMessage = 'User not found'
      mockGetCurrentUser.mockResolvedValue({
        user: null,
        error: { message: errorMessage },
      })

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeTruthy()
    })
  })

  describe('useSession', () => {
    it('returns session data when available', async () => {
      const { authService } = await import('../../services/authService')
      const mockGetSession = authService.getSession as ReturnType<typeof vi.fn>
      
      mockGetSession.mockResolvedValue({
        session: mockSession,
        error: null,
      })

      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockSession)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('useSignInMutation', () => {
    it('successfully signs in user', async () => {
      const { authService } = await import('../../services/authService')
      const mockSignIn = authService.signIn as ReturnType<typeof vi.fn>
      
      mockSignIn.mockResolvedValue({
        user: mockUser,
        session: mockSession,
        error: null,
      })

      const { result } = renderHook(() => useSignInMutation(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(result.current.data).toEqual({
        user: mockUser,
        session: mockSession,
        error: null,
      })
    })

    it('handles sign in error', async () => {
      const { authService } = await import('../../services/authService')
      const mockSignIn = authService.signIn as ReturnType<typeof vi.fn>
      
      const errorMessage = 'Invalid credentials'
      mockSignIn.mockResolvedValue({
        user: null,
        session: null,
        error: { message: errorMessage },
      })

      const { result } = renderHook(() => useSignInMutation(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeTruthy()
    })
  })

  describe('useSignUpMutation', () => {
    it('successfully signs up user', async () => {
      const { authService } = await import('../../services/authService')
      const mockSignUp = authService.signUp as ReturnType<typeof vi.fn>
      
      mockSignUp.mockResolvedValue({
        user: mockUser,
        session: null, // Usually null for unconfirmed accounts
        error: null,
      })

      const { result } = renderHook(() => useSignUpMutation(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          email: 'test@example.com',
          password: 'password123',
          fullName: '테스트 사용자',
          department: 'IT',
          position: 'Developer',
        })
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        fullName: '테스트 사용자',
        department: 'IT',
        position: 'Developer',
      })
    })
  })

  describe('useSignOutMutation', () => {
    it('successfully signs out user', async () => {
      const { authService } = await import('../../services/authService')
      const mockSignOut = authService.signOut as ReturnType<typeof vi.fn>
      
      mockSignOut.mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useSignOutMutation(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('useUpdateProfileMutation', () => {
    it('successfully updates user profile', async () => {
      const { authService } = await import('../../services/authService')
      const mockUpdateProfile = authService.updateProfile as ReturnType<typeof vi.fn>
      
      const updatedProfile = {
        ...mockUserProfile,
        full_name: '업데이트된 사용자',
      }

      mockUpdateProfile.mockResolvedValue({
        profile: updatedProfile,
        error: null,
      })

      const { result } = renderHook(() => useUpdateProfileMutation(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          full_name: '업데이트된 사용자',
        })
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockUpdateProfile).toHaveBeenCalledWith({
        full_name: '업데이트된 사용자',
      })
      expect(result.current.data).toEqual({
        profile: updatedProfile,
        error: null,
      })
    })

    it('handles profile update error', async () => {
      const { authService } = await import('../../services/authService')
      const mockUpdateProfile = authService.updateProfile as ReturnType<typeof vi.fn>
      
      const errorMessage = 'Profile update failed'
      mockUpdateProfile.mockResolvedValue({
        profile: null,
        error: { message: errorMessage },
      })

      const { result } = renderHook(() => useUpdateProfileMutation(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          full_name: '업데이트된 사용자',
        })
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeTruthy()
    })
  })

  describe('mutation loading states', () => {
    it('shows loading state during sign in', async () => {
      const { authService } = await import('../../services/authService')
      const mockSignIn = authService.signIn as ReturnType<typeof vi.fn>
      
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

      const { result } = renderHook(() => useSignInMutation(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.mutate({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(result.current.isPending).toBe(true)
      expect(result.current.isIdle).toBe(false)
    })
  })

  describe('query invalidation', () => {
    it('invalidates user queries after successful sign in', async () => {
      const { authService } = await import('../../services/authService')
      const mockSignIn = authService.signIn as ReturnType<typeof vi.fn>
      const mockGetCurrentUser = authService.getCurrentUser as ReturnType<typeof vi.fn>
      
      mockSignIn.mockResolvedValue({
        user: mockUser,
        session: mockSession,
        error: null,
      })

      mockGetCurrentUser.mockResolvedValue({
        user: mockUser,
        error: null,
      })

      const wrapper = createWrapper()
      
      // First, render useCurrentUser
      const { result: userResult } = renderHook(() => useCurrentUser(), { wrapper })
      
      // Then render sign in mutation
      const { result: signInResult } = renderHook(() => useSignInMutation(), { wrapper })

      await act(async () => {
        signInResult.current.mutate({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      await waitFor(() => {
        expect(signInResult.current.isSuccess).toBe(true)
      })

      // Verify that user query is invalidated and refetched
      await waitFor(() => {
        expect(mockGetCurrentUser).toHaveBeenCalled()
      })
    })
  })
}) 