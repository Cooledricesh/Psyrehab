import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithAuth, mockUser, mockSession, mockUserRole, mockEnvVars } from '../../../test/testUtils'
import { ProtectedRoute } from '../ProtectedRoute'

const TestComponent = () => <div>Protected Content</div>

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockEnvVars()
    vi.clearAllMocks()
  })

  it('renders children when user is authenticated', () => {
    renderWithAuth(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      {
        initialAuth: {
          user: mockUser,
          session: mockSession,
          isLoading: false,
        },
      }
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('shows loading state when authentication is loading', () => {
    renderWithAuth(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      {
        initialAuth: {
          user: null,
          session: null,
          isLoading: true,
        },
      }
    )

    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('shows sign in form when user is not authenticated', () => {
    renderWithAuth(
      <ProtectedRoute>
        <TestComponent />
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
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows access denied when user lacks required role', () => {
    renderWithAuth(
      <ProtectedRoute requiredRole="admin">
        <TestComponent />
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
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when user has required role', () => {
    renderWithAuth(
      <ProtectedRoute requiredRole="admin">
        <TestComponent />
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

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('shows access denied when user lacks required permission', () => {
    const mockHasPermission = vi.fn().mockReturnValue(false)
    
    renderWithAuth(
      <ProtectedRoute requiredPermission="write">
        <TestComponent />
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
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when user has required permission', () => {
    renderWithAuth(
      <ProtectedRoute requiredPermission="read">
        <TestComponent />
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

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('shows access denied when user lacks any of required roles', () => {
    renderWithAuth(
      <ProtectedRoute requiredRoles={['admin', 'moderator']}>
        <TestComponent />
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
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when user has one of required roles', () => {
    renderWithAuth(
      <ProtectedRoute requiredRoles={['admin', 'moderator']}>
        <TestComponent />
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

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('handles email verification requirement', () => {
    const unverifiedUser = {
      ...mockUser,
      email_confirmed_at: null,
    }

    renderWithAuth(
      <ProtectedRoute requireEmailVerification>
        <TestComponent />
      </ProtectedRoute>,
      {
        initialAuth: {
          user: unverifiedUser,
          session: { ...mockSession, user: unverifiedUser },
          isLoading: false,
        },
      }
    )

    expect(screen.getByText('이메일 인증이 필요합니다')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when email is verified', () => {
    renderWithAuth(
      <ProtectedRoute requireEmailVerification>
        <TestComponent />
      </ProtectedRoute>,
      {
        initialAuth: {
          user: mockUser,
          session: mockSession,
          isLoading: false,
        },
      }
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('renders custom fallback component', () => {
    const CustomFallback = () => <div>Custom Access Denied</div>

    renderWithAuth(
      <ProtectedRoute 
        requiredRole="admin"
        fallback={<CustomFallback />}
      >
        <TestComponent />
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

    expect(screen.getByText('Custom Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows custom loading component', () => {
    const CustomLoading = () => <div>Custom Loading...</div>

    renderWithAuth(
      <ProtectedRoute 
        loadingComponent={<CustomLoading />}
      >
        <TestComponent />
      </ProtectedRoute>,
      {
        initialAuth: {
          user: null,
          session: null,
          isLoading: true,
        },
      }
    )

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument()
  })
}) 