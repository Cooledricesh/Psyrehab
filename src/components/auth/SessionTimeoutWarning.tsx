import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSession } from '@/hooks/useAuthState'

interface SessionTimeoutWarningProps {
  warningTime?: number // Time in seconds before session expires to show warning
  onExtendSession?: () => void
  onLogout?: () => void
  className?: string
}

/**
 * Session timeout warning component
 */
export function SessionTimeoutWarning({
  warningTime = 300, // 5 minutes
  onExtendSession,
  onLogout,
  className = ''
}: SessionTimeoutWarningProps) {
  const { user, signOut, refreshSession } = useAuth()
  const { sessionExpiresAt, isSessionValid, refreshSessionToken } = useSession()
  
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isExtending, setIsExtending] = useState(false)

  useEffect(() => {
    if (!user || !sessionExpiresAt || !isSessionValid) {
      setShowWarning(false)
      return
    }

    const checkSessionTimeout = () => {
      const now = Date.now()
      const expiresAt = new Date(sessionExpiresAt).getTime()
      const secondsLeft = Math.floor((expiresAt - now) / 1000)

      if (secondsLeft <= warningTime && secondsLeft > 0) {
        setShowWarning(true)
        setTimeLeft(secondsLeft)
      } else if (secondsLeft <= 0) {
        setShowWarning(false)
        handleSessionExpired()
      } else {
        setShowWarning(false)
      }
    }

    checkSessionTimeout()
    const interval = setInterval(checkSessionTimeout, 1000)

    return () => clearInterval(interval)
  }, [user, sessionExpiresAt, isSessionValid, warningTime])

  const handleSessionExpired = async () => {
    try {
      await signOut()
      onLogout?.()
    } catch {
      console.error("Error occurred")
    }
  }

  const handleExtendSession = async () => {
    setIsExtending(true)
    
    try {
      const result = await refreshSessionToken()
      
      if (result.success) {
        setShowWarning(false)
        onExtendSession?.()
      } else {
        console.error("Error occurred")
        handleSessionExpired()
      }
    } catch {
      console.error("Error occurred")
      handleSessionExpired()
    } finally {
      setIsExtending(false)
    }
  }

  const handleLogoutNow = async () => {
    try {
      await signOut()
      onLogout?.()
    } catch {
      console.error("Error occurred")
    }
  }

  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}분 ${remainingSeconds}초`
    }
    return `${remainingSeconds}초`
  }

  if (!showWarning || !user) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />
      
      {/* Modal */}
      <div className={`fixed inset-0 z-50 overflow-y-auto ${className}`}>
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
            {/* Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            {/* Content */}
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                세션이 곧 만료됩니다
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  로그인 세션이 <span className="font-medium text-red-600">{formatTimeLeft(timeLeft)}</span> 후에 만료됩니다.
                  계속 사용하시려면 세션을 연장해주세요.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 sm:mt-6 space-y-3">
              <button
                type="button"
                disabled={isExtending}
                onClick={handleExtendSession}
                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
              >
                {isExtending ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    연장 중...
                  </div>
                ) : (
                  '세션 연장'
                )}
              </button>

              <button
                type="button"
                onClick={handleLogoutNow}
                className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                지금 로그아웃
              </button>
            </div>

            {/* Auto logout countdown */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                {timeLeft}초 후 자동으로 로그아웃됩니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Session timeout notice bar (less intrusive)
 */
interface SessionTimeoutNoticeProps {
  warningTime?: number
  onExtendSession?: () => void
  onDismiss?: () => void
  className?: string
}

export function SessionTimeoutNotice({
  warningTime = 600, // 10 minutes
  onExtendSession,
  onDismiss,
  className = ''
}: SessionTimeoutNoticeProps) {
  const { user, refreshSession } = useAuth()
  const { sessionExpiresAt, isSessionValid } = useSession()
  
  const [showNotice, setShowNotice] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isExtending, setIsExtending] = useState(false)

  useEffect(() => {
    if (!user || !sessionExpiresAt || !isSessionValid || isDismissed) {
      setShowNotice(false)
      return
    }

    const checkSessionTimeout = () => {
      const now = Date.now()
      const expiresAt = new Date(sessionExpiresAt).getTime()
      const secondsLeft = Math.floor((expiresAt - now) / 1000)

      if (secondsLeft <= warningTime && secondsLeft > 0) {
        setShowNotice(true)
        setTimeLeft(secondsLeft)
      } else {
        setShowNotice(false)
      }
    }

    checkSessionTimeout()
    const interval = setInterval(checkSessionTimeout, 1000)

    return () => clearInterval(interval)
  }, [user, sessionExpiresAt, isSessionValid, warningTime, isDismissed])

  const handleExtendSession = async () => {
    setIsExtending(true)
    
    try {
      await refreshSession()
      setShowNotice(false)
      setIsDismissed(true)
      onExtendSession?.()
    } catch {
      console.error("Error occurred")
    } finally {
      setIsExtending(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    setShowNotice(false)
    onDismiss?.()
  }

  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    return minutes > 0 ? `${minutes}분` : `${seconds}초`
  }

  if (!showNotice || !user) {
    return null
  }

  return (
    <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            로그인 세션이 <span className="font-medium">{formatTimeLeft(timeLeft)}</span> 후에 만료됩니다.
          </p>
        </div>
        <div className="ml-auto pl-3 flex space-x-2">
          <button
            type="button"
            disabled={isExtending}
            onClick={handleExtendSession}
            className="text-sm font-medium text-yellow-800 hover:text-yellow-600 disabled:opacity-50"
          >
            {isExtending ? '연장 중...' : '연장'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-sm font-medium text-yellow-800 hover:text-yellow-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
} 