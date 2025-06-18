import React from 'react'

interface AuthLoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Authentication loading spinner component
 */
export function AuthLoadingSpinner({
  message = '로딩 중...',
  size = 'md',
  className = ''
}: AuthLoadingSpinnerProps) {
  const getSpinnerSize = () => {
    switch (size) {
      case 'sm':
        return 'h-5 w-5'
      case 'lg':
        return 'h-8 w-8'
      default:
        return 'h-6 w-6'
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 p-8 ${className}`}>
      <svg
        className={`animate-spin ${getSpinnerSize()} text-blue-600`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <p className="text-gray-700 font-medium">
        {message}
      </p>
    </div>
  )
}

/**
 * Simple spinner without text
 */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

export function Spinner({
  size = 'md',
  color = 'text-blue-600',
  className = ''
}: SpinnerProps) {
  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4'
      case 'lg':
        return 'h-8 w-8'
      default:
        return 'h-6 w-6'
    }
  }

  return (
    <svg
      className={`animate-spin ${getSize()} ${color} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * Authentication page loading component
 */
interface AuthPageLoadingProps {
  title?: string
  description?: string
  className?: string
}

export function AuthPageLoading({
  title = '인증 확인 중',
  description = '잠시만 기다려주세요...',
  className = ''
}: AuthPageLoadingProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
      <div className="max-w-md w-full mx-auto">
        <div className="text-center">
          {/* Logo area */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {title}
          </h2>
          
          <p className="text-gray-600 mb-8">
            {description}
          </p>
          
          <AuthLoadingSpinner size="lg" message="" />
        </div>
      </div>
    </div>
  )
}

/**
 * Button loading state component
 */
interface ButtonLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ButtonLoading({
  size = 'md',
  className = ''
}: ButtonLoadingProps) {
  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4'
      case 'lg':
        return 'h-6 w-6'
      default:
        return 'h-5 w-5'
    }
  }

  return (
    <svg
      className={`animate-spin ${getSize()} text-white ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
} 