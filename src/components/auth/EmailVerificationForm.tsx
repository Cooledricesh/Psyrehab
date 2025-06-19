import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthForm } from '@/hooks/useAuthState'
import { AuthService } from '@/services/auth'

interface EmailVerificationFormProps {
  email?: string
  onSuccess?: () => void
  onResendSuccess?: () => void
  className?: string
}

/**
 * Email verification form component
 */
export function EmailVerificationForm({
  email,
  onResendSuccess,
  className = ''
}: EmailVerificationFormProps) {
  const { user, signOut } = useAuth()
  const {
    errors,
    setFieldError,
    clearFieldError,
    isSubmitting,
    setIsSubmitting
  } = useAuthForm()

  const [resendCount, setResendCount] = useState(0)
  const [lastResendTime, setLastResendTime] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(0)

  const userEmail = email || user?.email || ''

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResendVerification = async () => {
    if (!userEmail) {
      setFieldError('submit', '이메일 주소가 필요합니다.')
      return
    }

    setIsSubmitting(true)
    clearFieldError('submit')
    
    try {
      const result = await AuthService.resendEmailConfirmation(userEmail)
      
      if (result.success) {
        setResendCount(prev => prev + 1)
        setLastResendTime(new Date())
        setCountdown(60) // 1 minute cooldown
        onResendSuccess?.()
      } else {
        setFieldError('submit', result.error || '인증 이메일 재전송에 실패했습니다.')
      }
    } catch (error: any) {
      setFieldError('submit', error.message || '인증 이메일 재전송 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      console.error("Error occurred")
    }
  }

  const handleCheckVerification = async () => {
    setIsSubmitting(true)
    clearFieldError('submit')
    
    try {
      // Force refresh user session to check verification status
      window.location.reload()
    } catch (error: any) {
      setFieldError('submit', '확인 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900">이메일 인증</h2>
        <p className="mt-2 text-sm text-gray-600">
          계정을 활성화하려면 이메일 인증이 필요합니다.
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Submit Error */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}

        {/* Email Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">{userEmail}</span>로 인증 이메일을 보냈습니다.
                이메일을 확인하고 인증 링크를 클릭해주세요.
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600">
          <h3 className="font-medium text-gray-900 mb-2">이메일이 오지 않았나요?</h3>
          <ul className="space-y-1">
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>스팸 폴더를 확인해주세요</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>이메일 주소가 정확한지 확인해주세요</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>몇 분 정도 기다려주세요</span>
            </li>
          </ul>
        </div>

        {/* Resend Info */}
        {resendCount > 0 && lastResendTime && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  인증 이메일을 다시 보냈습니다. ({resendCount}회)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleCheckVerification}
            disabled={isSubmitting}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                확인 중...
              </div>
            ) : (
              '인증 완료 확인'
            )}
          </button>

          <button
            onClick={handleResendVerification}
            disabled={isSubmitting || countdown > 0}
            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {countdown > 0 ? (
              `재전송 (${countdown}초 후)`
            ) : isSubmitting ? (
              '재전송 중...'
            ) : (
              '인증 이메일 재전송'
            )}
          </button>

          <button
            onClick={handleSignOut}
            className="w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Simple email verification notice component
 */
interface EmailVerificationNoticeProps {
  email?: string
  onResend?: () => void
  className?: string
}

export function EmailVerificationNotice({
  email,
  onResend,
  className = ''
}: EmailVerificationNoticeProps) {
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            이메일 인증이 필요합니다
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              {email ? (
                <>
                  <span className="font-medium">{email}</span>로 보낸 인증 이메일을 확인해주세요.
                </>
              ) : (
                '이메일을 확인하여 계정을 인증해주세요.'
              )}
            </p>
          </div>
          {onResend && (
            <div className="mt-3">
              <button
                onClick={onResend}
                className="text-sm font-medium text-yellow-800 hover:text-yellow-600"
              >
                인증 이메일 재전송 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 