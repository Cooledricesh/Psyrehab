export enum AnnouncementType {
  GENERAL = 'general',
  EMERGENCY = 'emergency',
  EVENT = 'event',
  SYSTEM = 'system',
  TRAINING = 'training'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType | string;
  priority: Priority | string;
  status: Status | string;
  start_date: string;
  end_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  views_count: number;
  createdByName?: string; // From join with administrators
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  type: AnnouncementType;
  priority: Priority;
  status?: Status;
  start_date?: string;
  end_date?: string;
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  type?: AnnouncementType;
  priority?: Priority;
  status?: Status;
  start_date?: string;
  end_date?: string;
}

export interface AnnouncementFilters {
  type?: AnnouncementType;
  priority?: Priority;
  status?: Status;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export interface AnnouncementStats {
  total: number;
  active: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  type: AnnouncementType;
  priority: Priority;
  status: Status;
  start_date: string;
  end_date: string;
}

export const getTypeEmoji = (type: AnnouncementType | string): string => {
  switch (type) {
    case AnnouncementType.GENERAL:
    case 'general':
      return '📢';
    case AnnouncementType.EMERGENCY:
    case 'emergency':
      return '🚨';
    case AnnouncementType.EVENT:
    case 'event':
      return '📅';
    case AnnouncementType.SYSTEM:
    case 'system':
      return '⚙️';
    case AnnouncementType.TRAINING:
    case 'training':
      return '📚';
    default:
      return '📢';
  }
};

export const getPriorityColor = (priority: Priority | string): string => {
  switch (priority) {
    case Priority.LOW:
    case 'low':
      return 'green';
    case Priority.MEDIUM:
    case 'medium':
      return 'yellow';
    case Priority.HIGH:
    case 'high':
      return 'orange';
    case Priority.CRITICAL:
    case 'critical':
      return 'red';
    default:
      return 'gray';
  }
};

export const getStatusColor = (status: Status): string => {
  switch (status) {
    case Status.ACTIVE:
      return 'text-green-600 bg-green-100';
    case Status.INACTIVE:
      return 'text-gray-600 bg-gray-100';
    case Status.ARCHIVED:
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getTypeLabel = (type: AnnouncementType): string => {
  switch (type) {
    case AnnouncementType.GENERAL:
      return '일반';
    case AnnouncementType.EMERGENCY:
      return '긴급';
    case AnnouncementType.EVENT:
      return '이벤트';
    case AnnouncementType.SYSTEM:
      return '시스템';
    case AnnouncementType.TRAINING:
      return '교육';
    default:
      return '일반';
  }
};

export const getPriorityLabel = (priority: Priority): string => {
  switch (priority) {
    case Priority.LOW:
      return '낮음';
    case Priority.MEDIUM:
      return '보통';
    case Priority.HIGH:
      return '높음';
    case Priority.CRITICAL:
      return '긴급';
    default:
      return '보통';
  }
};

export const getStatusLabel = (status: Status): string => {
  switch (status) {
    case Status.ACTIVE:
      return '활성';
    case Status.INACTIVE:
      return '비활성';
    case Status.ARCHIVED:
      return '보관됨';
    default:
      return '활성';
  }
};

// 공지사항 우선순위
export enum AnnouncementPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 공지사항 상태
export enum AnnouncementStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

// 사용자 그룹 타입
export enum UserGroupType {
  ALL = 'all',
  ADMIN = 'admin',
  THERAPIST = 'therapist',
  PATIENT = 'patient',
  SPECIFIC_ROLE = 'specific_role',
  CUSTOM = 'custom'
}

// 반복 빈도
export enum RepeatFrequency {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

// 공지사항 타겟팅 설정
export interface AnnouncementTargeting {
  userGroups: UserGroupType[];
  specificRoles?: string[];
  includedUserIds?: string[];
  excludedUserIds?: string[];
}

// 공지사항 스케줄링 설정
export interface AnnouncementSchedule {
  publishAt?: Date;
  expireAt?: Date;
  repeatFrequency: RepeatFrequency;
  repeatCount?: number;
  isImmediate: boolean;
}

// 공지사항 표시 설정
export interface AnnouncementDisplaySettings {
  isPinned: boolean;
  showAsPopup: boolean;
  allowClose: boolean;
  requireConfirmation: boolean;
  autoCloseSeconds?: number;
}

// 공지사항 메타데이터
export interface AnnouncementMetadata {
  tags: string[];
  category?: string;
  readCount: number;
  confirmationCount: number;
  dismissCount: number;
}

// 공지사항 통계
export interface AnnouncementStats {
  totalAnnouncements: number;
  activeAnnouncements: number;
  totalViews: number;
  totalConfirmations: number;
  confirmationRate: number;
  averageReadTime: number;
  recentActivity: {
    date: string;
    count: number;
    views: number;
  }[];
  typeDistribution: {
    type: AnnouncementType;
    count: number;
    percentage: number;
  }[];
  priorityDistribution: {
    priority: Priority;
    count: number;
    percentage: number;
  }[];
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    pendingCount: number;
    expiredCount: number;
    errorCount: number;
  };
}

// 공지사항 필터
export interface AnnouncementFilter {
  type?: AnnouncementType;
  priority?: Priority;
  status?: Status;
  createdDateRange?: {
    start: Date;
    end: Date;
  };
  publishDateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
  tags?: string[];
  createdBy?: string;
  targetGroup?: UserGroupType;
}

// 공지사항 정렬 옵션
export interface AnnouncementSort {
  field: 'title' | 'createdAt' | 'publishAt' | 'priority' | 'status' | 'readCount';
  direction: 'asc' | 'desc';
}

// 공지사항 페이지네이션
export interface AnnouncementPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 공지사항 템플릿
export interface AnnouncementTemplate {
  id: string;
  name: string;
  description: string;
  titleTemplate: string;
  contentTemplate: string;
  type: AnnouncementType;
  priority: Priority;
  defaultTargeting: AnnouncementTargeting;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 유형별 색상 및 아이콘 매핑
export const ANNOUNCEMENT_TYPE_CONFIG = {
  [AnnouncementType.SYSTEM]: {
    color: 'blue',
    icon: '⚙️',
    label: '시스템'
  },
  [AnnouncementType.GENERAL]: {
    color: 'gray',
    icon: '📢',
    label: '일반'
  },
  [AnnouncementType.EMERGENCY]: {
    color: 'red',
    icon: '🚨',
    label: '긴급'
  },
  [AnnouncementType.EVENT]: {
    color: 'purple',
    icon: '📅',
    label: '이벤트'
  },
  [AnnouncementType.TRAINING]: {
    color: 'green',
    icon: '📚',
    label: '교육'
  }
} as const;

// 우선순위별 색상 및 아이콘 매핑
export const ANNOUNCEMENT_PRIORITY_CONFIG = {
  [Priority.LOW]: {
    color: 'gray',
    icon: '⬇️',
    label: '낮음'
  },
  [Priority.MEDIUM]: {
    color: 'blue',
    icon: '➡️',
    label: '보통'
  },
  [Priority.HIGH]: {
    color: 'orange',
    icon: '⬆️',
    label: '높음'
  },
  [Priority.CRITICAL]: {
    color: 'red',
    icon: '🔥',
    label: '매우 높음'
  }
} as const;

// 상태별 색상 및 아이콘 매핑
export const ANNOUNCEMENT_STATUS_CONFIG = {
  [Status.ACTIVE]: {
    color: 'green',
    icon: '✅',
    label: '활성'
  },
  [Status.INACTIVE]: {
    color: 'gray',
    icon: '❌',
    label: '비활성'
  },
  [Status.ARCHIVED]: {
    color: 'blue',
    icon: '📁',
    label: '보관됨'
  }
} as const;

// 사용자 그룹별 색상 및 아이콘 매핑
export const USER_GROUP_CONFIG = {
  [UserGroupType.ALL]: {
    color: 'blue',
    icon: '👥',
    label: '전체 사용자'
  },
  [UserGroupType.ADMIN]: {
    color: 'purple',
    icon: '👑',
    label: '관리자'
  },
  [UserGroupType.THERAPIST]: {
    color: 'green',
    icon: '👨‍⚕️',
    label: '치료사'
  },
  [UserGroupType.PATIENT]: {
    color: 'blue',
    label: '환자',
    icon: '🏥'
  },
  [UserGroupType.SPECIFIC_ROLE]: {
    color: 'orange',
    icon: '🎯',
    label: '특정 역할'
  },
  [UserGroupType.CUSTOM]: {
    color: 'gray',
    icon: '⚙️',
    label: '커스텀'
  }
} as const;

// 유틸리티 함수들
export const formatAnnouncementDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const getAnnouncementTypeLabel = (type: AnnouncementType): string => {
  return ANNOUNCEMENT_TYPE_CONFIG[type].label;
};

export const getAnnouncementPriorityLabel = (priority: Priority): string => {
  return ANNOUNCEMENT_PRIORITY_CONFIG[priority].label;
};

export const getAnnouncementStatusLabel = (status: Status): string => {
  return ANNOUNCEMENT_STATUS_CONFIG[status].label;
};

export const getUserGroupLabel = (group: UserGroupType): string => {
  return USER_GROUP_CONFIG[group].label;
};

export const isAnnouncementActive = (announcement: Announcement): boolean => {
  if (announcement.status !== Status.ACTIVE) return false;
  const now = new Date();
  if (announcement.end_date && now > new Date(announcement.end_date)) return false;
  return true;
};

export const getAnnouncementConfirmationRate = (announcement: Announcement & { metadata: AnnouncementMetadata }): number => {
  if (announcement.metadata.readCount === 0) return 0;
  return (announcement.metadata.confirmationCount / announcement.metadata.readCount) * 100;
}; 