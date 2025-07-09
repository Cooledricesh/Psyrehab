import React from 'react'
import { cn } from '@/lib/utils'

interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

const SkipLink = ({ href, children, className }: SkipLinkProps) => {
  return (
    <a
      href={href}
      className={cn(
        // Visually hidden by default but visible when focused
        'absolute left-0 top-0 z-[9999] transform -translate-y-full',
        'bg-blue-600 text-white px-4 py-2 text-sm font-medium',
        'focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2',
        'transition-transform duration-150 ease-in-out',
        // Ensure it appears above everything when focused
        'focus:block',
        className
      )}
      onFocus={() => {
        // Announce to screen readers
        const announcement = `건너뛰기 링크: ${children}`
        const ariaLive = document.createElement('div')
        ariaLive.setAttribute('aria-live', 'polite')
        ariaLive.setAttribute('aria-atomic', 'true')
        ariaLive.className = 'sr-only'
        ariaLive.textContent = announcement
        document.body.appendChild(ariaLive)
        setTimeout(() => {
          document.body.removeChild(ariaLive)
        }, 1000)
      }}
    >
      {children}
    </a>
  )
}

interface SkipLinksProps {
  links?: Array<{
    href: string
    label: string
  }>
  className?: string
}

const defaultLinks = [
  { href: '#main-content', label: '메인 콘텐츠로 건너뛰기' },
  { href: '#navigation', label: '네비게이션으로 건너뛰기' },
  { href: '#search', label: '검색으로 건너뛰기' },
]

export const SkipLinks = ({ links = defaultLinks, className }: SkipLinksProps) => {
  return (
    <nav 
      aria-label="건너뛰기 링크" 
      className={cn('skip-links', className)}
      role="navigation"
    >
      {links.map((link, index) => (
        <SkipLink key={index} href={link.href}>
          {link.label}
        </SkipLink>
      ))}
    </nav>
  )
}

export default SkipLinks 