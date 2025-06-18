import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement, ReactNode } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { AuthQueryProvider } from '../contexts/AuthQueryContext'
import { vi } from 'vitest'

// Mock Supabase
export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
    resend: vi.fn(),
    verifyOtp: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        maybeSingle: vi.fn(),
      })),
      in: vi.fn(() => ({
        data: [],
        error: null,
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
  rpc: vi.fn(),
}

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  email_confirmed_at: '2023-01-01T00:00:00.000Z',
  phone: '',
  confirmed_at: '2023-01-01T00:00:00.000Z',
  last_sign_in_at: '2023-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {
    full_name: '테스트 사용자',
  },
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
}

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: mockUser,
}

export const mockUserProfile = {
  id: mockUser.id,
  full_name: '테스트 사용자',
  department: 'IT',
  position: 'developer',
  phone: '010-1234-5678',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
}

export const mockUserRole = {
  id: 'role-1',
  user_id: mockUser.id,
  role: 'admin' as const,
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
}

// Create test query client
export function createTestQueryClient() {
  return new QueryClient({
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
}

// Test wrapper with auth context
interface AuthTestWrapperProps {
  children: ReactNode
  initialAuth?: {
    user?: typeof mockUser | null
    session?: typeof mockSession | null
    isLoading?: boolean
    profile?: typeof mockUserProfile | null
    role?: typeof mockUserRole | null
  }
}

export function AuthTestWrapper({ 
  children, 
  initialAuth = {} 
}: AuthTestWrapperProps) {
  const queryClient = createTestQueryClient()
  
  const {
    user = null,
    session = null,
    isLoading = false,
    profile = null,
    role = null,
  } = initialAuth

  // Mock AuthContext value
  const mockAuthContextValue = {
    user,
    session,
    isLoading,
    profile,
    role,
    permissions: role?.role === 'admin' ? ['read', 'write', 'delete'] : ['read'],
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    updatePassword: vi.fn(),
    resendVerification: vi.fn(),
    refreshSession: vi.fn(),
    updateSettings: vi.fn(),
    userSettings: null,
    hasPermission: vi.fn((permission: string) => {
      if (role?.role === 'admin') return true
      return permission === 'read'
    }),
    hasRole: vi.fn((requiredRole: string) => {
      if (!role) return false
      return role.role === requiredRole
    }),
    hasAnyRole: vi.fn((roles: string[]) => {
      if (!role) return false
      return roles.includes(role.role)
    }),
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider value={mockAuthContextValue}>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}

// Enhanced test wrapper with Query integration
export function AuthQueryTestWrapper({ 
  children, 
  initialAuth = {} 
}: AuthTestWrapperProps) {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthQueryProvider>
        {children}
      </AuthQueryProvider>
    </QueryClientProvider>
  )
}

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialAuth?: AuthTestWrapperProps['initialAuth']
  useAuthQuery?: boolean
}

export function renderWithAuth(
  ui: ReactElement,
  { initialAuth, useAuthQuery = false, ...renderOptions }: CustomRenderOptions = {}
) {
  const Wrapper = useAuthQuery ? AuthQueryTestWrapper : AuthTestWrapper
  
  return render(ui, {
    wrapper: ({ children }) => (
      <Wrapper initialAuth={initialAuth}>
        {children}
      </Wrapper>
    ),
    ...renderOptions,
  })
}

// Mock environment variables
export function mockEnvVars() {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
}

// Mock localStorage
export function mockLocalStorage() {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })
  
  return localStorageMock
}

// Mock sessionStorage
export function mockSessionStorage() {
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  })
  
  return sessionStorageMock
}

// Mock timer functions
export function mockTimers() {
  vi.useFakeTimers()
  return {
    advanceTimersByTime: vi.advanceTimersByTime,
    runAllTimers: vi.runAllTimers,
    clearAllTimers: vi.clearAllTimers,
    restoreAllMocks: vi.useRealTimers,
  }
} 