import type { BackupItem, BackupSchedule, RestoreJob, BackupStats } from '@/types/backup'
import { BackupType, BackupStatus, BackupScheduleFrequency } from '@/types/backup'

// Mock 백업 항목들 생성
export const mockBackups: BackupItem[] = [
  {
    id: 'backup-001',
    name: '전체 시스템 백업 - 2025년 1월',
    type: BackupType.FULL,
    status: BackupStatus.COMPLETED,
    size: 2147483648, // 2GB
    createdAt: new Date('2025-01-06T02:00:00Z'),
    completedAt: new Date('2025-01-06T02:45:30Z'),
    duration: 2730, // 45분 30초
    location: '/backups/full/backup-001.tar.gz',
    isEncrypted: true,
    isCompressed: true,
    includedItems: ['사용자 데이터', '시스템 설정', '데이터베이스', '로그'],
    metadata: {
      version: '1.0.0',
      creator: 'admin@psyrehab.dev',
      description: '월간 정기 전체 백업',
      tags: ['정기', '전체', '월간']
    }
  },
  {
    id: 'backup-002',
    name: '사용자 데이터 백업',
    type: BackupType.USER_DATA,
    status: BackupStatus.COMPLETED,
    size: 524288000, // 500MB
    createdAt: new Date('2025-01-05T18:30:00Z'),
    completedAt: new Date('2025-01-05T18:37:15Z'),
    duration: 435, // 7분 15초
    location: '/backups/user_data/backup-002.tar.gz',
    isEncrypted: true,
    isCompressed: true,
    includedItems: ['사용자 프로필', '환자 기록', '세션 데이터'],
    metadata: {
      version: '1.0.0',
      creator: 'system',
      description: '일일 사용자 데이터 백업',
      tags: ['사용자', '일일', '자동']
    }
  },
  {
    id: 'backup-003',
    name: '설정 백업',
    type: BackupType.SETTINGS,
    status: BackupStatus.IN_PROGRESS,
    size: 0,
    createdAt: new Date(),
    location: '/backups/settings/backup-003.tar.gz',
    isEncrypted: false,
    isCompressed: true,
    includedItems: ['시스템 설정', '사용자 권한', '애플리케이션 구성'],
    metadata: {
      version: '1.0.0',
      creator: 'admin@psyrehab.dev',
      description: '설정 변경 후 백업',
      tags: ['설정', '수동']
    },
    progress: 65
  },
  {
    id: 'backup-004',
    name: '로그 백업 - 12월',
    type: BackupType.LOGS,
    status: BackupStatus.FAILED,
    size: 0,
    createdAt: new Date('2025-01-01T01:00:00Z'),
    location: '/backups/logs/backup-004.tar.gz',
    isEncrypted: false,
    isCompressed: true,
    includedItems: ['시스템 로그', '애플리케이션 로그', '액세스 로그'],
    metadata: {
      version: '1.0.0',
      creator: 'system',
      description: '월별 로그 아카이브',
      tags: ['로그', '월별', '아카이브']
    },
    error: '디스크 공간 부족으로 백업 실패'
  },
  {
    id: 'backup-005',
    name: '증분 백업 - 1월 5일',
    type: BackupType.INCREMENTAL,
    status: BackupStatus.COMPLETED,
    size: 104857600, // 100MB
    createdAt: new Date('2025-01-05T03:00:00Z'),
    completedAt: new Date('2025-01-05T03:05:20Z'),
    duration: 320, // 5분 20초
    location: '/backups/incremental/backup-005.tar.gz',
    isEncrypted: true,
    isCompressed: true,
    includedItems: ['변경된 사용자 데이터', '새로운 세션 기록'],
    excludedItems: ['임시 파일', '캐시'],
    metadata: {
      version: '1.0.0',
      creator: 'system',
      description: '일일 증분 백업',
      tags: ['증분', '일일', '자동']
    }
  }
]

// Mock 백업 스케줄들
export const mockSchedules: BackupSchedule[] = [
  {
    id: 'schedule-001',
    name: '일일 사용자 데이터 백업',
    type: BackupType.USER_DATA,
    frequency: BackupScheduleFrequency.DAILY,
    isActive: true,
    nextRun: new Date('2025-01-07T02:00:00Z'),
    lastRun: new Date('2025-01-06T02:00:00Z'),
    retentionCount: 7,
    retentionDays: 30,
    options: {
      compression: true,
      encryption: true,
      notifications: true,
      excludePatterns: ['*.tmp', '*.cache', '**/temp/**']
    },
    metadata: {
      creator: 'admin@psyrehab.dev',
      description: '중요한 사용자 데이터의 일일 백업',
      tags: ['사용자', '일일', '중요']
    }
  },
  {
    id: 'schedule-002',
    name: '주간 전체 시스템 백업',
    type: BackupType.FULL,
    frequency: BackupScheduleFrequency.WEEKLY,
    isActive: true,
    nextRun: new Date('2025-01-12T01:00:00Z'),
    lastRun: new Date('2025-01-05T01:00:00Z'),
    retentionCount: 4,
    retentionDays: 90,
    options: {
      compression: true,
      encryption: true,
      notifications: true
    },
    metadata: {
      creator: 'system',
      description: '전체 시스템의 주간 백업',
      tags: ['전체', '주간', '시스템']
    }
  },
  {
    id: 'schedule-003',
    name: '월간 아카이브 백업',
    type: BackupType.FULL,
    frequency: BackupScheduleFrequency.MONTHLY,
    isActive: false,
    nextRun: new Date('2025-02-01T00:00:00Z'),
    retentionCount: 12,
    retentionDays: 365,
    options: {
      compression: true,
      encryption: true,
      notifications: false
    },
    metadata: {
      creator: 'admin@psyrehab.dev',
      description: '장기 보관용 월간 아카이브',
      tags: ['아카이브', '월간', '장기보관']
    }
  }
]

// Mock 복원 작업들
export const mockRestoreJobs: RestoreJob[] = [
  {
    id: 'restore-001',
    backupId: 'backup-001',
    status: BackupStatus.COMPLETED,
    startedAt: new Date('2025-01-06T09:00:00Z'),
    completedAt: new Date('2025-01-06T09:30:00Z'),
    duration: 1800, // 30분
    progress: 100,
    options: {
      overwrite: false,
      selectiveRestore: true,
      restoreUsers: true,
      restoreSettings: false,
      restoreLogs: false,
      restoreData: true
    },
    restoredItems: ['사용자 프로필', '환자 기록', '세션 데이터'],
    metadata: {
      initiator: 'admin@psyrehab.dev',
      description: '사용자 데이터 복원'
    }
  },
  {
    id: 'restore-002',
    backupId: 'backup-002',
    status: BackupStatus.IN_PROGRESS,
    startedAt: new Date(),
    progress: 45,
    options: {
      overwrite: true,
      selectiveRestore: false,
      restoreUsers: true,
      restoreSettings: true,
      restoreLogs: true,
      restoreData: true
    },
    restoredItems: [],
    metadata: {
      initiator: 'admin@psyrehab.dev',
      description: '전체 시스템 복원'
    }
  }
]

// Mock 통계 데이터 생성
export const generateMockStats = (): BackupStats => {
  const totalBackups = mockBackups.length
  const successfulBackups = mockBackups.filter(b => b.status === BackupStatus.COMPLETED).length
  const failedBackups = mockBackups.filter(b => b.status === BackupStatus.FAILED).length
  
  return {
    totalBackups,
    successfulBackups,
    failedBackups,
    totalSize: mockBackups.reduce((total, backup) => total + backup.size, 0),
    averageDuration: mockBackups
      .filter(b => b.duration)
      .reduce((total, b) => total + (b.duration || 0), 0) / 
      mockBackups.filter(b => b.duration).length,
    successRate: Math.round((successfulBackups / totalBackups) * 100),
    storageUsed: 3221225472, // 3GB
    storageLimit: 10737418240, // 10GB
    recentActivity: mockBackups
      .slice(-10)
      .map(backup => ({
        date: backup.createdAt,
        type: backup.type,
        status: backup.status,
        size: backup.size
      }))
  }
}

// 추가 Mock 데이터 생성 함수들
export const generateMockBackupHistory = (days: number = 30): BackupItem[] => {
  const history: BackupItem[] = []
  const types = Object.values(BackupType)
  const statuses = Object.values(BackupStatus)
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    const type = types[Math.floor(Math.random() * types.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const size = Math.floor(Math.random() * 1000000000) // 0-1GB
    
    history.push({
      id: `history-${i}`,
      name: `${type} 백업 - ${date.toLocaleDateString()}`,
      type,
      status,
      size,
      createdAt: date,
      completedAt: status === BackupStatus.COMPLETED ? new Date(date.getTime() + 1800000) : undefined,
      duration: status === BackupStatus.COMPLETED ? Math.floor(Math.random() * 3600) : undefined,
      location: `/backups/${type}/history-${i}.tar.gz`,
      isEncrypted: Math.random() > 0.5,
      isCompressed: true,
      includedItems: ['데이터'],
      metadata: {
        version: '1.0.0',
        creator: 'system',
        description: `자동 생성된 ${type} 백업`
      }
    })
  }
  
  return history
} 