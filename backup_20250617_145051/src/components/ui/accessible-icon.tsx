import React from 'react'
import { cn } from '@/lib/utils'

interface AccessibleIconProps {
  icon: React.ComponentType<any>
  label: string
  description?: string
  size?: number | string
  className?: string
  decorative?: boolean
  role?: 'img' | 'button' | 'presentation'
  [key: string]: any // For additional props to pass to the icon
}

/**
 * AccessibleIcon - A wrapper component for icons that ensures proper accessibility
 * 
 * @param icon - The icon component (usually from lucide-react)
 * @param label - Accessible label for the icon (required)
 * @param description - Optional longer description for complex icons
 * @param decorative - If true, icon is marked as decorative (aria-hidden="true")
 * @param role - ARIA role for the icon
 * @param size - Icon size
 * @param className - Additional CSS classes
 */
export const AccessibleIcon: React.FC<AccessibleIconProps> = ({
  icon: Icon,
  label,
  description,
  size = 16,
  className,
  decorative = false,
  role = 'img',
  ...props
}) => {
  if (decorative) {
    return (
      <Icon
        size={size}
        className={className}
        aria-hidden="true"
        {...props}
      />
    )
  }

  return (
    <Icon
      size={size}
      className={className}
      role={role}
      aria-label={label}
      aria-describedby={description ? `${label}-desc` : undefined}
      {...props}
    >
      {description && (
        <desc id={`${label}-desc`} className="sr-only">
          {description}
        </desc>
      )}
    </Icon>
  )
}

interface EmojiIconProps {
  emoji: string
  label: string
  description?: string
  className?: string
  decorative?: boolean
}

/**
 * EmojiIcon - Accessible wrapper for emoji characters
 */
export const EmojiIcon: React.FC<EmojiIconProps> = ({
  emoji,
  label,
  description,
  className,
  decorative = false,
}) => {
  return (
    <span
      className={cn('inline-block', className)}
      role={decorative ? 'presentation' : 'img'}
      aria-label={decorative ? undefined : label}
      aria-describedby={description ? `${label}-desc` : undefined}
      aria-hidden={decorative}
    >
      {emoji}
      {description && !decorative && (
        <span id={`${label}-desc`} className="sr-only">
          {description}
        </span>
      )}
    </span>
  )
}

interface IconButtonProps {
  icon: React.ComponentType<any>
  label: string
  onClick?: () => void
  disabled?: boolean
  size?: number | string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  [key: string]: any
}

/**
 * IconButton - Accessible button with icon and proper labeling
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  size = 16,
  className,
  variant = 'default',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(baseClasses, variants[variant], 'h-8 w-8', className)}
      aria-label={label}
      type="button"
      {...props}
    >
      <Icon size={size} aria-hidden="true" />
    </button>
  )
}

/**
 * Common icon labels for the application
 */
export const IconLabels = {
  // Navigation
  menu: '메뉴',
  close: '닫기',
  back: '뒤로가기',
  next: '다음',
  previous: '이전',
  
  // Actions
  save: '저장',
  send: '전송',
  submit: '제출',
  delete: '삭제',
  edit: '편집',
  add: '추가',
  remove: '제거',
  cancel: '취소',
  confirm: '확인',
  
  // Status
  success: '성공',
  error: '오류',
  warning: '경고',
  info: '정보',
  loading: '로딩 중',
  
  // Data
  search: '검색',
  filter: '필터',
  sort: '정렬',
  refresh: '새로고침',
  download: '다운로드',
  upload: '업로드',
  
  // Goals and Assessments
  goal: '목표',
  assessment: '평가',
  progress: '진행상황',
  completed: '완료됨',
  pending: '대기 중',
  inProgress: '진행 중',
  
  // Users and Patients
  user: '사용자',
  patient: '환자',
  socialWorker: '사회복지사',
  
  // Time
  calendar: '달력',
  clock: '시간',
  date: '날짜',
  
  // Categories
  category: '카테고리',
  tag: '태그',
  
  // Visibility
  show: '보기',
  hide: '숨기기',
  expand: '펼치기',
  collapse: '접기',
  
  // Settings
  settings: '설정',
  preferences: '환경설정',
  
  // Communication
  notification: '알림',
  message: '메시지',
  
  // Security
  lock: '잠금',
  unlock: '잠금해제',
  secure: '보안',
} as const

export default AccessibleIcon 