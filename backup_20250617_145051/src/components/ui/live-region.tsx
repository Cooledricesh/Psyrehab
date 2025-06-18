import React, { useEffect, useRef } from 'react'

interface LiveRegionProps {
  /** The message to announce */
  message: string
  /** Priority of the announcement */
  priority?: 'polite' | 'assertive'
  /** Whether to clear the message after announcing */
  clearAfterAnnounce?: boolean
  /** Delay before clearing the message (in ms) */
  clearDelay?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * LiveRegion component for announcing dynamic content changes to screen readers
 */
export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = 'polite',
  clearAfterAnnounce = true,
  clearDelay = 1000,
  className = ''
}) => {
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (regionRef.current && message) {
      // Set the message
      regionRef.current.textContent = message

      // Clear the message after delay if requested
      if (clearAfterAnnounce) {
        const timer = setTimeout(() => {
          if (regionRef.current) {
            regionRef.current.textContent = ''
          }
        }, clearDelay)

        return () => clearTimeout(timer)
      }
    }
  }, [message, clearAfterAnnounce, clearDelay])

  return (
    <div
      ref={regionRef}
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
      role="status"
    />
  )
}

/**
 * Hook for managing live announcements
 */
export const useLiveAnnouncement = () => {
  const regionRef = useRef<HTMLDivElement | null>(null)

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create or get the live region
    if (!regionRef.current) {
      const existingRegion = document.getElementById('global-live-region')
      if (existingRegion) {
        regionRef.current = existingRegion as HTMLDivElement
      } else {
        const region = document.createElement('div')
        region.id = 'global-live-region'
        region.setAttribute('aria-live', priority)
        region.setAttribute('aria-atomic', 'true')
        region.setAttribute('role', 'status')
        region.className = 'sr-only'
        document.body.appendChild(region)
        regionRef.current = region
      }
    }

    // Update priority if needed
    regionRef.current.setAttribute('aria-live', priority)

    // Clear and set the message
    regionRef.current.textContent = ''
    setTimeout(() => {
      if (regionRef.current) {
        regionRef.current.textContent = message
      }
    }, 100)

    // Clear the message after a delay
    setTimeout(() => {
      if (regionRef.current) {
        regionRef.current.textContent = ''
      }
    }, 3000)
  }

  return { announce }
}

/**
 * Component for managing focus when content changes dynamically
 */
interface FocusOnChangeProps {
  /** Whether to focus when content changes */
  shouldFocus: boolean
  /** Selector for the element to focus */
  focusTarget?: string
  /** Message to announce when focusing */
  announceMessage?: string
  /** Children to render */
  children: React.ReactNode
}

export const FocusOnChange: React.FC<FocusOnChangeProps> = ({
  shouldFocus,
  focusTarget = '[data-focus-target]',
  announceMessage,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { announce } = useLiveAnnouncement()

  useEffect(() => {
    if (shouldFocus && containerRef.current) {
      const targetElement = containerRef.current.querySelector(focusTarget) as HTMLElement
      
      if (targetElement) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          targetElement.focus()
          
          if (announceMessage) {
            announce(announceMessage, 'polite')
          }
        }, 100)
      }
    }
  }, [shouldFocus, focusTarget, announceMessage, announce])

  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}

/**
 * Hook for managing focus restoration after route changes
 */
export const useFocusRestoration = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
      previousFocusRef.current.focus()
    } else {
      // Fallback: focus the main content area
      const mainContent = document.querySelector('main, [role="main"]') as HTMLElement
      if (mainContent) {
        mainContent.focus()
      }
    }
  }

  const focusMainContent = () => {
    const mainContent = document.querySelector('main, [role="main"]') as HTMLElement
    if (mainContent) {
      // Make main content focusable if it isn't already
      if (!mainContent.hasAttribute('tabindex')) {
        mainContent.setAttribute('tabindex', '-1')
      }
      mainContent.focus()
    }
  }

  return {
    saveFocus,
    restoreFocus,
    focusMainContent
  }
} 