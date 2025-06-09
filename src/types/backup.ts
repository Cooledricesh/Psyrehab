// 백업 타입 정의
export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental', 
  DIFFERENTIAL = 'differential',
  USER_DATA = 'user_data',
  SETTINGS = 'settings',
  LOGS = 'logs'
}

// 백업 상태
export enum BackupStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

// 백업 스케줄 빈도
export enum BackupScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

// 백업 항목 인터페이스
export interface BackupItem {
  id: string
  name: string
  type: BackupType
  status: BackupStatus
  size: number // bytes
  createdAt: Date
  completedAt?: Date
  duration?: number // seconds
  location: string
  isEncrypted: boolean
  isCompressed: boolean
  includedItems: string[]
  excludedItems?: string[]
  metadata: {
    version: string
    creator: string
    description?: string
    tags?: string[]
  }
  error?: string
  progress?: number // 0-100
}

// 백업 스케줄 인터페이스
export interface BackupSchedule {
  id: string
  name: string
  type: BackupType
  frequency: BackupScheduleFrequency
  isActive: boolean
  nextRun: Date
  lastRun?: Date
  retentionCount: number // 보관할 백업 개수
  retentionDays: number // 보관 기간 (일)
  options: {
    compression: boolean
    encryption: boolean
    notifications: boolean
    excludePatterns?: string[]
  }
  customSchedule?: string // cron expression for custom frequency
  metadata: {
    creator: string
    description?: string
    tags?: string[]
  }
}

// 복원 작업 인터페이스
export interface RestoreJob {
  id: string
  backupId: string
  status: BackupStatus
  startedAt: Date
  completedAt?: Date
  duration?: number
  progress: number // 0-100
  options: {
    overwrite: boolean
    selectiveRestore: boolean
    restoreUsers: boolean
    restoreSettings: boolean
    restoreLogs: boolean
    restoreData: boolean
    targetLocation?: string
  }
  error?: string
  warnings?: string[]
  restoredItems: string[]
  metadata: {
    initiator: string
    description?: string
  }
}

// 백업 통계 인터페이스
export interface BackupStats {
  totalBackups: number
  successfulBackups: number
  failedBackups: number
  totalSize: number
  averageDuration: number
  successRate: number
  storageUsed: number
  storageLimit: number
  recentActivity: Array<{
    date: Date
    type: BackupType
    status: BackupStatus
    size: number
  }>
}

// 백업 필터 인터페이스
export interface BackupFilter {
  type?: BackupType
  status?: BackupStatus
  dateRange?: {
    start: Date
    end: Date
  }
  sizeRange?: {
    min: number
    max: number
  }
  searchQuery?: string
}

// 백업 타입별 색상 매핑
export const BACKUP_TYPE_COLORS: Record<BackupType, string> = {
  [BackupType.FULL]: 'blue',
  [BackupType.INCREMENTAL]: 'green',
  [BackupType.DIFFERENTIAL]: 'yellow',
  [BackupType.USER_DATA]: 'purple',
  [BackupType.SETTINGS]: 'indigo',
  [BackupType.LOGS]: 'gray'
}

// 백업 상태별 색상 매핑
export const BACKUP_STATUS_COLORS: Record<BackupStatus, string> = {
  [BackupStatus.PENDING]: 'gray',
  [BackupStatus.IN_PROGRESS]: 'blue',
  [BackupStatus.COMPLETED]: 'green',
  [BackupStatus.FAILED]: 'red',
  [BackupStatus.CANCELLED]: 'orange',
  [BackupStatus.EXPIRED]: 'yellow'
}

// 백업 타입 라벨
export const BACKUP_TYPE_LABELS: Record<BackupType, string> = {
  [BackupType.FULL]: '전체 백업',
  [BackupType.INCREMENTAL]: '증분 백업',
  [BackupType.DIFFERENTIAL]: '차등 백업',
  [BackupType.USER_DATA]: '사용자 데이터',
  [BackupType.SETTINGS]: '설정',
  [BackupType.LOGS]: '로그'
}

// 백업 상태 라벨
export const BACKUP_STATUS_LABELS: Record<BackupStatus, string> = {
  [BackupStatus.PENDING]: '대기 중',
  [BackupStatus.IN_PROGRESS]: '진행 중',
  [BackupStatus.COMPLETED]: '완료',
  [BackupStatus.FAILED]: '실패',
  [BackupStatus.CANCELLED]: '취소됨',
  [BackupStatus.EXPIRED]: '만료됨'
}

// 유틸리티 함수들
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${secs}초`
  } else if (minutes > 0) {
    return `${minutes}분 ${secs}초`
  } else {
    return `${secs}초`
  }
}

export const calculateSuccessRate = (successful: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((successful / total) * 100)
} 