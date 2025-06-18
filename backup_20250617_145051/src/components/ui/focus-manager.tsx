import React, { useEffect, useRef, useCallback } from 'react'
import { useFocusTrap } from '@/hooks/useKeyboardNavigation'

interface FocusManagerProps {
  children: React.ReactNode
  /** Whether focus management is active */
  isActive: boolean
  /** Element to focus when activated */
  initialFocus?: string | HTMLElement
  /** Element to return focus to when deactivated */
  returnFocus?: string | HTMLElement
  /** Whether to restore focus when deactivated */
  restoreFocus?: boolean
  /** Callback when focus is trapped */
  onFocusTrapped?: () => void
  /** Callback when focus is released */
  onFocusReleased?: () => void
}

/**
 * FocusManager component for managing focus in modals, dialogs, and other overlay components
 */
export const FocusManager: React.FC<FocusManagerProps> = ({
  children,
  isActive,
  initialFocus,
  returnFocus,
  restoreFocus = true,
  onFocusTrapped,
  onFocusReleased
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Store the previously focused element when activated
  useEffect(() => {
    if (isActive) {
      previousActiveElement.current = document.activeElement as HTMLElement
      onFocusTrapped?.()
    } else {
      onFocusReleased?.()
    }
  }, [isActive, onFocusTrapped, onFocusReleased])

  // Handle initial focus
  useEffect(() => {
    if (isActive && containerRef.current) {
      let elementToFocus: HTMLElement | null = null

      if (initialFocus) {
        if (typeof initialFocus === 'string') {
          elementToFocus = containerRef.current.querySelector(initialFocus)
        } else {
          elementToFocus = initialFocus
        }
      }

      // If no specific element is provided, focus the first focusable element
      if (!elementToFocus) {
        const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        elementToFocus = containerRef.current.querySelector(focusableSelector)
      }

      if (elementToFocus) {
        // Small delay to ensure the element is rendered
        setTimeout(() => {
          elementToFocus?.focus()
        }, 0)
      }
    }
  }, [isActive, initialFocus])

  // Handle return focus
  useEffect(() => {
    return () => {
      if (!isActive && restoreFocus) {
        let elementToFocus: HTMLElement | null = null

        if (returnFocus) {
          if (typeof returnFocus === 'string') {
            elementToFocus = document.querySelector(returnFocus)
          } else {
            elementToFocus = returnFocus
          }
        } else {
          elementToFocus = previousActiveElement.current
        }

        if (elementToFocus && document.contains(elementToFocus)) {
          elementToFocus.focus()
        }
      }
    }
  }, [isActive, returnFocus, restoreFocus])

  // Use the focus trap hook
  useFocusTrap(isActive, containerRef)

  return (
    <div ref={containerRef} className="focus-manager">
      {children}
    </div>
  )
}

/**
 * Hook for managing focus announcements to screen readers
 */
export const useFocusAnnouncement = () => {
  const announcementRef = useRef<HTMLDivElement | null>(null)

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementRef.current) {
      // Create announcement element if it doesn't exist
      const element = document.createElement('div')
      element.setAttribute('aria-live', priority)
      element.setAttribute('aria-atomic', 'true')
      element.className = 'sr-only'
      element.id = 'focus-announcement'
      document.body.appendChild(element)
      announcementRef.current = element
    }

    // Update the aria-live attribute if priority changed
    announcementRef.current.setAttribute('aria-live', priority)
    
    // Clear and set the message
    announcementRef.current.textContent = ''
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = message
      }
    }, 100)
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (announcementRef.current && document.body.contains(announcementRef.current)) {
        document.body.removeChild(announcementRef.current)
      }
    }
  }, [])

  return { announce }
}

/**
 * Hook for managing focus within a specific container
 */
export const useContainerFocus = (containerRef: React.RefObject<HTMLElement>) => {
  const focusFirst = useCallback(() => {
    if (!containerRef.current) return

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const firstFocusable = containerRef.current.querySelector(focusableSelector) as HTMLElement
    firstFocusable?.focus()
  }, [containerRef])

  const focusLast = useCallback(() => {
    if (!containerRef.current) return

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const focusableElements = containerRef.current.querySelectorAll(focusableSelector)
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement
    lastFocusable?.focus()
  }, [containerRef])

  const focusNext = useCallback(() => {
    if (!containerRef.current) return

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const focusableElements = Array.from(containerRef.current.querySelectorAll(focusableSelector)) as HTMLElement[]
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement)
    
    if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus()
    } else {
      focusFirst()
    }
  }, [containerRef, focusFirst])

  const focusPrevious = useCallback(() => {
    if (!containerRef.current) return

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const focusableElements = Array.from(containerRef.current.querySelectorAll(focusableSelector)) as HTMLElement[]
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement)
    
    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus()
    } else {
      focusLast()
    }
  }, [containerRef, focusLast])

  return {
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious
  }
} 