import { useEffect, useCallback } from 'react'

export interface KeyboardNavigationOptions {
  /** Enable arrow key navigation */
  enableArrowKeys?: boolean
  /** Enable Enter key activation */
  enableEnterKey?: boolean
  /** Enable Escape key handling */
  enableEscapeKey?: boolean
  /** Callback for when Enter is pressed */
  onEnter?: () => void
  /** Callback for when Escape is pressed */
  onEscape?: () => void
  /** Callback for arrow key navigation */
  onArrowKey?: (direction: 'up' | 'down' | 'left' | 'right') => void
  /** Selector for focusable elements within the container */
  focusableSelector?: string
}

/**
 * Custom hook for handling keyboard navigation
 */
export const useKeyboardNavigation = (
  elementRef: React.RefObject<HTMLElement>,
  options: KeyboardNavigationOptions = {}
) => {
  const {
    enableArrowKeys = true,
    enableEnterKey = true,
    enableEscapeKey = true,
    onEnter,
    onEscape,
    onArrowKey,
    focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  } = options

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key } = event

    // Handle Enter key
    if (enableEnterKey && key === 'Enter' && onEnter) {
      event.preventDefault()
      onEnter()
      return
    }

    // Handle Escape key
    if (enableEscapeKey && key === 'Escape' && onEscape) {
      event.preventDefault()
      onEscape()
      return
    }

    // Handle Arrow keys
    if (enableArrowKeys && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      event.preventDefault()
      
      const direction = key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right'
      
      if (onArrowKey) {
        onArrowKey(direction)
      } else {
        // Default arrow key behavior: navigate between focusable elements
        handleDefaultArrowNavigation(direction)
      }
    }
  }, [enableArrowKeys, enableEnterKey, enableEscapeKey, onEnter, onEscape, onArrowKey])

  const handleDefaultArrowNavigation = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!elementRef.current) return

    const focusableElements = elementRef.current.querySelectorAll(focusableSelector)
    const focusableArray = Array.from(focusableElements) as HTMLElement[]
    const currentIndex = focusableArray.findIndex(el => el === document.activeElement)

    let nextIndex: number

    switch (direction) {
      case 'up':
      case 'left':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableArray.length - 1
        break
      case 'down':
      case 'right':
        nextIndex = currentIndex < focusableArray.length - 1 ? currentIndex + 1 : 0
        break
      default:
        return
    }

    focusableArray[nextIndex]?.focus()
  }, [elementRef, focusableSelector])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('keydown', handleKeyDown)

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // Helper functions
  const focusFirst = useCallback(() => {
    if (!elementRef.current) return
    const firstFocusable = elementRef.current.querySelector(focusableSelector) as HTMLElement
    firstFocusable?.focus()
  }, [elementRef, focusableSelector])

  const focusLast = useCallback(() => {
    if (!elementRef.current) return
    const focusableElements = elementRef.current.querySelectorAll(focusableSelector)
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement
    lastFocusable?.focus()
  }, [elementRef, focusableSelector])

  return {
    focusFirst,
    focusLast
  }
}

/**
 * Hook for managing focus trapping in modals and dialogs
 */
export const useFocusTrap = (
  isActive: boolean,
  containerRef: React.RefObject<HTMLElement>
) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const focusableElements = container.querySelectorAll(focusableSelector) as NodeListOf<HTMLElement>
    
    if (focusableElements.length === 0) return

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    // Focus the first element
    firstFocusable.focus()

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          event.preventDefault()
          lastFocusable.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          event.preventDefault()
          firstFocusable.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [isActive, containerRef])
} 