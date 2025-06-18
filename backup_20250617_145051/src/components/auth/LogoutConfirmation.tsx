import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface LogoutConfirmationProps {
  isOpen: boolean
  onConfirm?: () => void
  onCancel?: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  className?: string
}

/**
 * Logout confirmation modal component
 */
export function LogoutConfirmation({
  isOpen,
  onConfirm,
  onCancel,
  title = '로그아웃',
  message = '정말 로그아웃하시겠습니까?',
  confirmText = '로그아웃',
  cancelText = '취소',
  className = ''
}: LogoutConfirmationProps) {
  const { signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      await signOut()
      onConfirm?.()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleCancel = () => {
    if (!isLoggingOut) {
      onCancel?.()
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className={`fixed inset-0 z-50 overflow-y-auto ${className}`}>
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            {/* Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>

            {/* Content */}
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {message}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 sm:ml-3 sm:w-auto"
              >
                {isLoggingOut ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    로그아웃 중...
                  </div>
                ) : (
                  confirmText
                )}
              </button>
              
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleCancel}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 sm:mt-0 sm:w-auto"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Simple logout button with confirmation
 */
interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  showConfirmation?: boolean
  onLogoutSuccess?: () => void
  className?: string
  children?: React.ReactNode
}

export function LogoutButton({
  variant = 'secondary',
  size = 'md',
  showConfirmation = true,
  onLogoutSuccess,
  className = '',
  children = '로그아웃'
}: LogoutButtonProps) {
  const { signOut } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost: 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500'
    }
    
    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`
  }

  const handleLogoutClick = () => {
    if (showConfirmation) {
      setShowModal(true)
    } else {
      handleDirectLogout()
    }
  }

  const handleDirectLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      await signOut()
      onLogoutSuccess?.()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleConfirmLogout = () => {
    setShowModal(false)
    onLogoutSuccess?.()
  }

  const handleCancelLogout = () => {
    setShowModal(false)
  }

  return (
    <>
      <button
        onClick={handleLogoutClick}
        disabled={isLoggingOut}
        className={getButtonClasses()}
      >
        {isLoggingOut ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            로그아웃 중...
          </div>
        ) : (
          children
        )}
      </button>

      {showConfirmation && (
        <LogoutConfirmation
          isOpen={showModal}
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      )}
    </>
  )
}

/**
 * Logout menu item component
 */
interface LogoutMenuItemProps {
  showConfirmation?: boolean
  onLogoutSuccess?: () => void
  className?: string
}

export function LogoutMenuItem({
  showConfirmation = true,
  onLogoutSuccess,
  className = ''
}: LogoutMenuItemProps) {
  const { signOut } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogoutClick = () => {
    if (showConfirmation) {
      setShowModal(true)
    } else {
      handleDirectLogout()
    }
  }

  const handleDirectLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      await signOut()
      onLogoutSuccess?.()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleConfirmLogout = () => {
    setShowModal(false)
    onLogoutSuccess?.()
  }

  const handleCancelLogout = () => {
    setShowModal(false)
  }

  return (
    <>
      <button
        onClick={handleLogoutClick}
        disabled={isLoggingOut}
        className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${className}`}
      >
        <svg className="mr-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
      </button>

      {showConfirmation && (
        <LogoutConfirmation
          isOpen={showModal}
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      )}
    </>
  )
} 