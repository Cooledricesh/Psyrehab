import React, { createContext, useContext, useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// TOAST TYPES AND INTERFACES
// =============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAllToasts: () => void
}

// =============================================================================
// TOAST CONTEXT
// =============================================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// =============================================================================
// TOAST PROVIDER
// =============================================================================

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = generateToastId()
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? getDefaultDuration(toast.type)
    }
    
    setToasts(prev => [...prev, newToast])

    // 자동 제거 타이머 설정
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAllToasts = () => {
    setToasts([])
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// =============================================================================
// TOAST CONTAINER
// =============================================================================

function ToastContainer() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

// =============================================================================
// TOAST ITEM COMPONENT
// =============================================================================

interface ToastItemProps {
  toast: Toast
}

function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast()
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // 등장 애니메이션
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(() => removeToast(toast.id), 150)
  }

  const getToastIcon = (type: ToastType) => {
    const iconClass = "h-5 w-5 flex-shrink-0"
    
    switch (type) {
      case 'success':
        return <CheckCircle className={cn(iconClass, "text-green-500")} />
      case 'error':
        return <XCircle className={cn(iconClass, "text-red-500")} />
      case 'warning':
        return <AlertCircle className={cn(iconClass, "text-yellow-500")} />
      case 'info':
        return <Info className={cn(iconClass, "text-blue-500")} />
    }
  }

  const getToastStyles = (type: ToastType) => {
    const baseStyles = "border-l-4"
    
    switch (type) {
      case 'success':
        return cn(baseStyles, "border-green-500 bg-green-50 text-green-900")
      case 'error':
        return cn(baseStyles, "border-red-500 bg-red-50 text-red-900")
      case 'warning':
        return cn(baseStyles, "border-yellow-500 bg-yellow-50 text-yellow-900")
      case 'info':
        return cn(baseStyles, "border-blue-500 bg-blue-50 text-blue-900")
    }
  }

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-md shadow-lg transition-all duration-200 ease-in-out",
        getToastStyles(toast.type),
        isVisible && !isLeaving ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        isLeaving && "translate-x-full opacity-0"
      )}
      role="alert"
      aria-live="polite"
    >
      {getToastIcon(toast.type)}
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm leading-5">
          {toast.title}
        </div>
        {toast.description && (
          <div className="mt-1 text-sm leading-5 opacity-90">
            {toast.description}
          </div>
        )}
        {toast.action && (
          <div className="mt-2">
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleRemove}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label="알림 닫기"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateToastId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function getDefaultDuration(type: ToastType): number {
  switch (type) {
    case 'success':
      return 4000
    case 'info':
      return 5000
    case 'warning':
      return 6000
    case 'error':
      return 8000 // 에러는 조금 더 오래 표시
    default:
      return 5000
  }
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

export function useToastHelpers() {
  const { addToast } = useToast()

  return {
    success: (title: string, description?: string, options?: Partial<Toast>) =>
      addToast({ type: 'success', title, description, ...options }),
    
    error: (title: string, description?: string, options?: Partial<Toast>) =>
      addToast({ type: 'error', title, description, ...options }),
    
    warning: (title: string, description?: string, options?: Partial<Toast>) =>
      addToast({ type: 'warning', title, description, ...options }),
    
    info: (title: string, description?: string, options?: Partial<Toast>) =>
      addToast({ type: 'info', title, description, ...options })
  }
} 