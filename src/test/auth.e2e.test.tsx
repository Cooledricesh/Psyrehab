import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithAuth, mockUser, mockSession, mockUserProfile, mockUserRole, mockEnvVars, mockLocalStorage, mockTimers } from './testUtils'
import { AuthRouter } from '../components/auth/AuthRouter'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

vi.mock('../services/authService', () => ({
  authService: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    updatePassword: vi.fn(),
    resendVerification: vi.fn(),
    getCurrentUser: vi.fn(),
    getSession: vi.fn(),
    getUserProfile: vi.fn(),
    getUserRole: vi.fn(),
    getUserPermissions: vi.fn(),
    getUserSettings: vi.fn(),
    updateSettings: vi.fn(),
    refreshSession: vi.fn(),
  },
}))

const ProtectedComponent = () => (
  <div>
    <h1>보호된 콘텐츠</h1>
    <p>인증된 사용자만 볼 수 있습니다.</p>
  </div>
)

const AdminComponent = () => (
  <div>
    <h1>관리자 전용</h1>
    <p>관리자 권한이 필요합니다.</p>
  </div>
)

describe('Authentication E2E Tests', () => {
  const user = userEvent.setup()
  let localStorage: ReturnType<typeof mockLocalStorage>
  let timers: ReturnType<typeof mockTimers>

  beforeAll(() => {
    mockEnvVars()
  })

  beforeEach(() => {
    localStorage = mockLocalStorage()
    timers = mockTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    timers.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  describe('Complete Authentication Flow', () => {
    it('handles complete sign in to protected content flow', async () => {
      const { authService } = await import('../services/authService')
      const mockSignIn = authService.signIn as ReturnType<typeof vi.fn>
      const mockGetCurrentUser = authService.getCurrentUser as ReturnType<typeof vi.fn>
      const mockGetSession = authService.getSession as ReturnType<typeof vi.fn>

      mockGetCurrentUser.mockResolvedValue({ user: null, error: null })
      mockGetSession.mockResolvedValue({ session: null, error: null })

      const { rerender } = renderWithAuth(
        <ProtectedRoute>
          <ProtectedComponent />
        </ProtectedRoute>,
        {
          initialAuth: {
            user: null,
            session: null,
            isLoading: false,
          },
        }
      )

      expect(screen.getByText('로그인')).toBeInTheDocument()
      expect(screen.queryByText('보호된 콘텐츠')).not.toBeInTheDocument()

      mockSignIn.mockResolvedValue({
        user: mockUser,
        session: mockSession,
        error: null,
      })

      const emailInput = screen.getByLabelText('이메일')
      const passwordInput = screen.getByLabelText('비밀번호')
      const submitButton = screen.getByRole('button', { name: '로그인' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      })

      rerender(
        <ProtectedRoute>
          <ProtectedComponent />
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.getByText('보호된 콘텐츠')).toBeInTheDocument()
      })
    })

    it('handles complete sign up flow with email verification', async () => {
      const { authService } = await import('../services/authService')
      const mockSignUp = authService.signUp as ReturnType<typeof vi.fn>

      mockSignUp.mockResolvedValue({
        user: { ...mockUser, email_confirmed_at: null },
        session: null, // No session until email is verified
        error: null,
      })

      renderWithAuth(
        <AuthRouter />
      )

      const signUpTab = screen.getByText('회원가입')
      await user.click(signUpTab)

      const emailInput = screen.getByLabelText('이메일')
      const passwordInput = screen.getByLabelText('비밀번호')
      const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
      const fullNameInput = screen.getByLabelText('이름')
      const departmentInput = screen.getByLabelText('부서')
      const positionInput = screen.getByLabelText('직책')
      const agreeCheckbox = screen.getByLabelText(/이용약관 및 개인정보처리방침에 동의/)
      const submitButton = screen.getByRole('button', { name: '회원가입' })

      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'newpassword123')
      await user.type(confirmPasswordInput, 'newpassword123')
      await user.type(fullNameInput, '새로운 사용자')
      await user.type(departmentInput, 'IT')
      await user.type(positionInput, 'Developer')
      await user.click(agreeCheckbox)
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'newpassword123',
          fullName: '새로운 사용자',
          department: 'IT',
          position: 'Developer',
        })
      })

      expect(screen.getByText(/이메일 인증이 필요합니다/)).toBeInTheDocument()
    })

    it('handles role-based access control flow', async () => {
      renderWithAuth(
        <ProtectedRoute requiredRole="admin">
          <AdminComponent />
        </ProtectedRoute>,
        {
          initialAuth: {
            user: mockUser,
            session: mockSession,
            isLoading: false,
            role: { ...mockUserRole, role: 'user' },
          },
        }
      )

      expect(screen.getByText('접근 권한이 없습니다')).toBeInTheDocument()
      expect(screen.queryByText('관리자 전용')).not.toBeInTheDocument()

      const { rerender } = renderWithAuth(
        <ProtectedRoute requiredRole="admin">
          <AdminComponent />
        </ProtectedRoute>,
        {
          initialAuth: {
            user: mockUser,
            session: mockSession,
            isLoading: false,
            role: { ...mockUserRole, role: 'admin' },
          },
        }
      )

      expect(screen.getByText('관리자 전용')).toBeInTheDocument()
    })

    it('handles session timeout and re-authentication', async () => {
      const { authService } = await import('../services/authService')
      const mockSignOut = authService.signOut as ReturnType<typeof vi.fn>
      const mockRefreshSession = authService.refreshSession as ReturnType<typeof vi.fn>

      mockSignOut.mockResolvedValue({ error: null })
      mockRefreshSession.mockResolvedValue({
        session: null,
        error: { message: 'Session expired' },
      })

      const { rerender } = renderWithAuth(
        <ProtectedRoute>
          <ProtectedComponent />
        </ProtectedRoute>,
        {
          initialAuth: {
            user: mockUser,
            session: mockSession,
            isLoading: false,
          },
        }
      )

      expect(screen.getByText('보호된 콘텐츠')).toBeInTheDocument()

      rerender(
        <ProtectedRoute>
          <ProtectedComponent />
        </ProtectedRoute>
      )

      timers.advanceTimersByTime(300000) // 5 minutes

      await waitFor(() => {
        expect(screen.getByText('로그인')).toBeInTheDocument()
      })
    })

    it('handles password reset flow', async () => {
      const { authService } = await import('../services/authService')
      const mockResetPassword = authService.resetPassword as ReturnType<typeof vi.fn>

      mockResetPassword.mockResolvedValue({ error: null })

      renderWithAuth(
        <AuthRouter />
      )

      const forgotPasswordLink = screen.getByText('비밀번호를 잊으셨나요?')
      await user.click(forgotPasswordLink)

      expect(screen.getByText('비밀번호 재설정')).toBeInTheDocument()

      const emailInput = screen.getByLabelText('이메일')
      const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('test@example.com')
        expect(screen.getByText(/비밀번호 재설정 링크를 이메일로 전송했습니다/)).toBeInTheDocument()
      })
    })

    it('handles profile update flow', async () => {
      const { authService } = await import('../services/authService')
      const mockUpdateProfile = authService.updateProfile as ReturnType<typeof vi.fn>

      const updatedProfile = {
        ...mockUserProfile,
        full_name: '업데이트된 사용자',
        department: '마케팅',
      }

      mockUpdateProfile.mockResolvedValue({
        profile: updatedProfile,
        error: null,
      })

      const ProfileEditComponent = () => {
        const handleSubmit = async () => {
          await authService.updateProfile({
            full_name: '업데이트된 사용자',
            department: '마케팅',
          })
        }

        return (
          <div>
            <h1>프로필 수정</h1>
            <button onClick={handleSubmit}>프로필 업데이트</button>
          </div>
        )
      }

      renderWithAuth(
        <ProtectedRoute>
          <ProfileEditComponent />
        </ProtectedRoute>,
        {
          initialAuth: {
            user: mockUser,
            session: mockSession,
            isLoading: false,
            profile: mockUserProfile,
          },
        }
      )

      const updateButton = screen.getByRole('button', { name: '프로필 업데이트' })
      await user.click(updateButton)

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          full_name: '업데이트된 사용자',
          department: '마케팅',
        })
      })
    })

    it('handles sign out flow', async () => {
      const { authService } = await import('../services/authService')
      const mockSignOut = authService.signOut as ReturnType<typeof vi.fn>

      mockSignOut.mockResolvedValue({ error: null })

      const ComponentWithLogout = () => {
        const handleLogout = async () => {
          await authService.signOut()
        }

        return (
          <div>
            <h1>메인 페이지</h1>
            <button onClick={handleLogout}>로그아웃</button>
          </div>
        )
      }

      const { rerender } = renderWithAuth(
        <ProtectedRoute>
          <ComponentWithLogout />
        </ProtectedRoute>,
        {
          initialAuth: {
            user: mockUser,
            session: mockSession,
            isLoading: false,
          },
        }
      )

      const logoutButton = screen.getByRole('button', { name: '로그아웃' })
      await user.click(logoutButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
      })

      rerender(
        <ProtectedRoute>
          <ComponentWithLogout />
        </ProtectedRoute>
      )

      expect(screen.getByText('로그인')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      const { authService } = await import('../services/authService')
      const mockSignIn = authService.signIn as ReturnType<typeof vi.fn>

      mockSignIn.mockRejectedValue(new Error('Network error'))

      renderWithAuth(
        <AuthRouter />
      )

      const emailInput = screen.getByLabelText('이메일')
      const passwordInput = screen.getByLabelText('비밀번호')
      const submitButton = screen.getByRole('button', { name: '로그인' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/네트워크 오류가 발생했습니다/)).toBeInTheDocument()
      })
    })

    it('handles validation errors in forms', async () => {
      renderWithAuth(
        <AuthRouter />
      )

      const submitButton = screen.getByRole('button', { name: '로그인' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('이메일을 입력해 주세요.')).toBeInTheDocument()
        expect(screen.getByText('비밀번호를 입력해 주세요.')).toBeInTheDocument()
      })
    })

    it('handles authentication errors', async () => {
      const { authService } = await import('../services/authService')
      const mockSignIn = authService.signIn as ReturnType<typeof vi.fn>

      mockSignIn.mockResolvedValue({
        user: null,
        session: null,
        error: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      })

      renderWithAuth(
        <AuthRouter />
      )

      const emailInput = screen.getByLabelText('이메일')
      const passwordInput = screen.getByLabelText('비밀번호')
      const submitButton = screen.getByRole('button', { name: '로그인' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('supports keyboard navigation', async () => {
      renderWithAuth(
        <AuthRouter />
      )

      const emailInput = screen.getByLabelText('이메일')
      
      await user.tab()
      expect(emailInput).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('비밀번호')).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: '비밀번호 표시' })).toHaveFocus()
    })

    it('provides proper ARIA labels and roles', () => {
      renderWithAuth(
        <AuthRouter />
      )

      expect(screen.getByRole('form')).toBeInTheDocument()
      expect(screen.getByLabelText('이메일')).toHaveAttribute('type', 'email')
      expect(screen.getByLabelText('비밀번호')).toHaveAttribute('type', 'password')
      expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
    })
  })
}) 