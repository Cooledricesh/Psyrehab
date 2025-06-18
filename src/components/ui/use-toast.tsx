import { useState, useEffect } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastState {
  toasts: Toast[]
}

const listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = { toasts: [] }

function dispatch(action: { type: 'ADD_TOAST' | 'UPDATE_TOAST' | 'DISMISS_TOAST' | 'REMOVE_TOAST'; toast?: Toast; toastId?: string }) {
  switch (action.type) {
    case 'ADD_TOAST':
      memoryState = {
        toasts: [action.toast!, ...memoryState.toasts].slice(0, 3),
      }
      break
    case 'UPDATE_TOAST':
      memoryState = {
        toasts: memoryState.toasts.map((t) =>
          t.id === action.toast!.id ? { ...t, ...action.toast } : t
        ),
      }
      break
    case 'DISMISS_TOAST':
      memoryState = {
        toasts: memoryState.toasts.map((t) =>
          t.id === action.toastId ? { ...t, open: false } : t
        ),
      }
      break
    case 'REMOVE_TOAST':
      memoryState = {
        toasts: memoryState.toasts.filter((t) => t.id !== action.toastId),
      }
      break
  }
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

interface UseToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

function toast(options: UseToastOptions) {
  const id = Math.random().toString(36).substr(2, 9)
  const newToast: Toast = {
    id,
    ...options,
  }

  dispatch({ type: 'ADD_TOAST', toast: newToast })
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    dispatch({ type: 'REMOVE_TOAST', toastId: id })
  }, 5000)

  return {
    id,
    dismiss: () => dispatch({ type: 'REMOVE_TOAST', toastId: id }),
  }
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    ...state,
    toast,
  }
}
