import React from 'react'
import { useAuthState, useUserProfile } from '@/hooks/useAuthState'
import { useAuth } from '@/contexts/AuthContext'

interface AccessDeniedProps {
  title?: string
  message?: string
  showActions?: boolean
  onGoBack?: () => void
  onGoHome?: () => void
  showContactInfo?: boolean
}

/**
 * Generic access denied component
 */
export function AccessDenied({
  title = '접근 권한이 없습니다',
  message = '이 페이지에 접근할 권한이 없습니다. 관리자에게 문의하세요.',
  showActions = true,
  onGoBack,
  onGoHome,
  showContactInfo = false
}: AccessDeniedProps) {
  const { signOut } = useAuth()
  const { userRole, displayName } = useUserProfile()

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack()
    } else {
      window.history.back()
    }
  }

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome()
    } else {
      // Redirect based on user role
      switch (userRole) {
        case 'administrator':
          window.location.href = '/admin/dashboard'
          break
        case 'social_worker':
          window.location.href = '/social-worker/dashboard'
          break
        case 'patient':
          window.location.href = '/patient/dashboard'
          break
        default:
          window.location.href = '/dashboard'
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto h-24 w-24 text-red-500 mb-4">
            <svg 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {title}
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-600 mb-6">
            {message}
          </p>

          {/* User info */}
          {displayName && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-medium">현재 사용자:</span> {displayName}
              </p>
              {userRole && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">역할:</span> {
                    userRole === 'administrator' ? '관리자' :
                    userRole === 'social_worker' ? '사회복지사' :
                    userRole === 'patient' ? '환자' : userRole
                  }
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="space-y-3">
              <div className="flex space-x-3">
                <button
                  onClick={handleGoBack}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  이전 페이지로
                </button>
                <button
                  onClick={handleGoHome}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  홈으로 이동
                </button>
              </div>
              
              <button
                onClick={signOut}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}

          {/* Contact info */}
          {showContactInfo && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                문제가 지속되면 시스템 관리자에게 문의하세요.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                오류 코드: ACCESS_DENIED
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Role-specific access denied components
 */
export function AdminAccessDenied() {
  return (
    <AccessDenied
      title="관리자 권한 필요"
      message="이 기능은 관리자만 사용할 수 있습니다."
      showContactInfo
    />
  )
}

export function StaffAccessDenied() {
  return (
    <AccessDenied
      title="직원 권한 필요"
      message="이 기능은 관리자 또는 사회복지사만 사용할 수 있습니다."
      showContactInfo
    />
  )
}

export function PatientAccessDenied() {
  return (
    <AccessDenied
      title="환자 권한 필요"
      message="이 기능은 환자만 사용할 수 있습니다."
    />
  )
}

/**
 * Minimal access denied component for inline use
 */
interface InlineAccessDeniedProps {
  message?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function InlineAccessDenied({
  message = '접근 권한이 없습니다',
  showIcon = true,
  size = 'md'
}: InlineAccessDeniedProps) {
  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg ${sizeClasses[size]}`}>
      <div className="flex items-center space-x-2 text-red-700">
        {showIcon && (
          <svg 
            className={`${iconSizes[size]} flex-shrink-0`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        )}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  )
}

/**
 * Loading state component for permission checks
 */
export function PermissionLoading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">권한 확인 중...</span>
    </div>
  )
}

/**
 * Component for when user is not authenticated
 */
export function NotAuthenticated() {
  const { signOut } = useAuth()

  const handleSignIn = () => {
    window.location.href = '/auth/signin'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto h-24 w-24 text-blue-500 mb-4">
            <svg 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            로그인이 필요합니다
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-600 mb-6">
            이 페이지에 접근하려면 먼저 로그인해주세요.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSignIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              로그인하기
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              이전 페이지로
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Component for email verification required
 */
export function EmailVerificationRequired() {
  const { signOut } = useAuth()
  const { userEmail } = useAuthState()

  const handleResendEmail = async () => {
    // This would trigger email resend functionality
    // Implementation depends on your auth service
    console.log('Resending verification email...')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto h-24 w-24 text-yellow-500 mb-4">
            <svg 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            이메일 인증이 필요합니다
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-600 mb-2">
            계정을 활성화하려면 이메일 인증을 완료해주세요.
          </p>

          {userEmail && (
            <p className="text-sm text-gray-500 mb-6">
              인증 이메일이 <strong>{userEmail}</strong>로 발송되었습니다.
            </p>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleResendEmail}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              인증 이메일 재발송
            </button>
            
            <button
              onClick={signOut}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              로그아웃
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>이메일을 받지 못하셨나요? 스팸 폴더를 확인해보세요.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 