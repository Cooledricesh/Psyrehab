import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithAuth, mockSupabaseClient, mockEnvVars } from '../../../test/testUtils'
import { SignInForm } from '../SignInForm'

// Mock the auth service
vi.mock('../../../services/authService', () => ({
  authService: {
    signIn: vi.fn(),
  },
}))

describe('SignInForm', () => {
  const user = userEvent.setup()
  const mockOnSuccess = vi.fn()
  const mockOnForgotPassword = vi.fn()

  beforeEach(() => {
    mockEnvVars()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders the sign in form correctly', () => {
    renderWithAuth(
      <SignInForm 
        onSuccess={mockOnSuccess}
        onForgotPassword={mockOnForgotPassword}
      />
    )

    expect(screen.getByText('로그인')).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 잊으셨나요?')).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    renderWithAuth(
      <SignInForm 
        onSuccess={mockOnSuccess}
        onForgotPassword={mockOnForgotPassword}
      />
    )

    const submitButton = screen.getByRole('button', { name: '로그인' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('이메일을 입력해 주세요.')).toBeInTheDocument()
      expect(screen.getByText('비밀번호를 입력해 주세요.')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email format', async () => {
    renderWithAuth(
      <SignInForm 
        onSuccess={mockOnSuccess}
        onForgotPassword={mockOnForgotPassword}
      />
    )

    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '로그인' })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('올바른 이메일 형식을 입력해 주세요.')).toBeInTheDocument()
    })
  })

  it('submits form with valid credentials', async () => {
    const { authService } = await import('../../../services/authService')
    const mockSignIn = authService.signIn as ReturnType<typeof vi.fn>
    
    mockSignIn.mockResolvedValue({
      user: { id: 'test-user', email: 'test@example.com' },
      session: { access_token: 'token' },
      error: null,
    })

    renderWithAuth(
      <SignInForm 
        onSuccess={mockOnSuccess}
        onForgotPassword={mockOnForgotPassword}
      />
    )

    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const submitButton = screen.getByRole('button', { name: '로그인' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('shows error message on failed sign in', async () => {
    const { authService } = await import('../../../services/authService')
    const mockSignIn = authService.signIn as ReturnType<typeof vi.fn>
    
    mockSignIn.mockResolvedValue({
      user: null,
      session: null,
      error: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
    })

    renderWithAuth(
      <SignInForm 
        onSuccess={mockOnSuccess}
        onForgotPassword={mockOnForgotPassword}
      />
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

  it('handles forgot password click', async () => {
    renderWithAuth(
      <SignInForm 
        onSuccess={mockOnSuccess}
        onForgotPassword={mockOnForgotPassword}
      />
    )

    const forgotPasswordLink = screen.getByText('비밀번호를 잊으셨나요?')
    await user.click(forgotPasswordLink)

    expect(mockOnForgotPassword).toHaveBeenCalled()
  })

  it('shows loading state during submission', async () => {
    const { authService } = await import('../../../services/authService')
    const mockSignIn = authService.signIn as ReturnType<typeof vi.fn>
    
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    renderWithAuth(
      <SignInForm 
        onSuccess={mockOnSuccess}
        onForgotPassword={mockOnForgotPassword}
      />
    )

    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const submitButton = screen.getByRole('button', { name: '로그인' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(screen.getByText('로그인 중...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('toggles password visibility', async () => {
    renderWithAuth(
      <SignInForm 
        onSuccess={mockOnSuccess}
        onForgotPassword={mockOnForgotPassword}
      />
    )

    const passwordInput = screen.getByLabelText('비밀번호') as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: '비밀번호 표시' })

    expect(passwordInput.type).toBe('password')

    await user.click(toggleButton)
    expect(passwordInput.type).toBe('text')

    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('handles remember me checkbox', async () => {
    renderWithAuth(
      <SignInForm 
        onSuccess={mockOnSuccess}
        onForgotPassword={mockOnForgotPassword}
      />
    )

    const rememberMeCheckbox = screen.getByLabelText('로그인 상태 유지')
    
    expect(rememberMeCheckbox).not.toBeChecked()
    
    await user.click(rememberMeCheckbox)
    expect(rememberMeCheckbox).toBeChecked()
  })
}) 