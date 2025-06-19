import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthForm } from '@/hooks/useAuthState'
import { isValidEmail } from '@/utils/auth'

interface PasswordResetFormProps {
  onSuccess?: () => void
  onBackToSignIn?: () => void
  className?: string
}

/**
 * Password reset request form
 */
export function PasswordResetForm({
  onSuccess,
  onBackToSignIn,
  className = ''
}: PasswordResetFormProps) {
  const { resetPassword } = useAuth()
  const {
    errors,
    setFieldError,
    clearFieldError,
    isSubmitting,
    setIsSubmitting,
    resetForm
  } = useAuthForm()

  const [email, setEmail] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleInputChange = (value: string) => {
    setEmail(value)
    
    // Clear error when user starts typing
    if (errors.email) {
      clearFieldError('email')
    }
  }

  const validateForm = (): boolean => {
    if (!email) {
      setFieldError('email', '이메일을 입력해주세요.')
      return false
    }
    
    if (!isValidEmail(email)) {
      setFieldError('email', '유효한 이메일 주소를 입력해주세요.')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      const result = await resetPassword(email)
      
      if (result.success) {
        setIsSuccess(true)
        resetForm()
        onSuccess?.()
      } else {
        setFieldError('submit', result.error || '비밀번호 재설정 요청에 실패했습니다.')
      }
    } catch (error: unknown) {
      setFieldError('submit', error.message || '비밀번호 재설정 요청 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email || !isValidEmail(email)) return

    setIsSubmitting(true)
    
    try {
      const result = await resetPassword(email)
      
      if (!result.success) {
        setFieldError('submit', result.error || '재전송에 실패했습니다.')
      }
    } catch (error: unknown) {
      setFieldError('submit', error.message || '재전송 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className={`max-w-md mx-auto ${className}`}>
        {/* Success Message */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">이메일을 확인하세요</h2>
          
          <p className="text-gray-600 mb-6">
            <span className="font-medium">{email}</span>로 비밀번호 재설정 링크를 보냈습니다.
            이메일을 확인하고 링크를 클릭하여 새 비밀번호를 설정하세요.
          </p>

          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              <p>이메일이 오지 않았나요?</p>
              <ul className="mt-2 space-y-1">
                <li>• 스팸 폴더를 확인해주세요</li>
                <li>• 이메일 주소가 정확한지 확인해주세요</li>
                <li>• 몇 분 정도 기다려주세요</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleResend}
                disabled={isSubmitting}
                className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? '재전송 중...' : '재전송'}
              </button>
              
              <button
                onClick={onBackToSignIn}
                className="w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                로그인으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">비밀번호 재설정</h2>
        <p className="mt-2 text-sm text-gray-600">
          가입했던 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            이메일 주소
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => handleInputChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="이메일을 입력하세요"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                전송 중...
              </div>
            ) : (
              '재설정 링크 보내기'
            )}
          </button>
        </div>
      </form>

      {/* Back to Sign In */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onBackToSignIn}
          className="font-medium text-blue-600 hover:text-blue-500"
          disabled={isSubmitting}
        >
          ← 로그인으로 돌아가기
        </button>
      </div>
    </div>
  )
}

/**
 * New password form (for password reset completion)
 */
interface NewPasswordFormProps {
  onSuccess?: () => void
  token?: string
  className?: string
}

export function NewPasswordForm({
  onSuccess,
  token,
  className = ''
}: NewPasswordFormProps) {
  const {
    errors,
    setFieldError,
    clearFieldError,
    isSubmitting,
    setIsSubmitting,
    resetForm
  } = useAuthForm()

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      clearFieldError(field)
    }
  }

  const validateForm = (): boolean => {
    let isValid = true

    // Password validation
    if (!formData.password) {
      setFieldError('password', '새 비밀번호를 입력해주세요.')
      isValid = false
    } else if (formData.password.length < 8) {
      setFieldError('password', '비밀번호는 최소 8자 이상이어야 합니다.')
      isValid = false
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      setFieldError('confirmPassword', '비밀번호 확인을 입력해주세요.')
      isValid = false
    } else if (formData.password !== formData.confirmPassword) {
      setFieldError('confirmPassword', '비밀번호가 일치하지 않습니다.')
      isValid = false
    }

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      // This would typically call a specific API for password reset completion
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      resetForm()
      onSuccess?.()
    } catch (error: unknown) {
      setFieldError('submit', error.message || '비밀번호 재설정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">새 비밀번호 설정</h2>
        <p className="mt-2 text-sm text-gray-600">
          새로운 비밀번호를 입력해주세요.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* New Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            새 비밀번호
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoFocus
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="새 비밀번호를 입력하세요"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={isSubmitting}
            >
              {showPassword ? (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            비밀번호 확인
          </label>
          <div className="mt-1 relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="비밀번호를 다시 입력하세요"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={isSubmitting}
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                변경 중...
              </div>
            ) : (
              '비밀번호 변경'
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 