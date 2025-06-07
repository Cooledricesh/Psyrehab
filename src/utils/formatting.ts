// Formatting utilities for display

// Date formatting
export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDateShort = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  })
}

// Number formatting
export const formatProgress = (progress: number): string => {
  return `${Math.round(progress)}%`
}

export const formatDuration = (days: number): string => {
  if (days < 7) {
    return `${days}일`
  } else if (days < 30) {
    const weeks = Math.floor(days / 7)
    const remainingDays = days % 7
    if (remainingDays === 0) {
      return `${weeks}주`
    }
    return `${weeks}주 ${remainingDays}일`
  } else {
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    if (remainingDays === 0) {
      return `${months}개월`
    }
    return `${months}개월 ${remainingDays}일`
  }
}

// Text formatting
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const capitalizeFirst = (text: string): string => {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const formatName = (firstName: string, lastName: string): string => {
  return `${lastName}${firstName}`
}

// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')
  
  // Format as XXX-XXXX-XXXX
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
  
  return phone
}

// Status formatting
export const formatGoalStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: '진행중',
    completed: '완료',
    paused: '일시정지',
    cancelled: '취소',
  }
  return statusMap[status] || status
}

export const formatAssessmentStage = (stage: string): string => {
  const stageMap: Record<string, string> = {
    initial: '초기평가',
    ongoing: '진행평가',
    interim: '중간평가',
    discharge: '퇴원평가',
    follow_up: '추후평가',
  }
  return stageMap[stage] || stage
}

export const formatGoalType = (type: string): string => {
  const typeMap: Record<string, string> = {
    six_month: '6개월 목표',
    monthly: '월간 목표',
    weekly: '주간 목표',
  }
  return typeMap[type] || type
} 