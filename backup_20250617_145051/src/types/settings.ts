export interface SystemSettings {
  // 시스템 기본 설정
  system: {
    siteName: string;
    siteDescription: string;
    defaultLanguage: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    maintenance: boolean;
    maintenanceMessage: string;
    allowRegistration: boolean;
    defaultUserRole: string;
  };

  // 보안 설정
  security: {
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
    sessionTimeout: number; // minutes
    maxLoginAttempts: number;
    lockoutDuration: number; // minutes
    twoFactorRequired: boolean;
    allowedFileTypes: string[];
    maxFileSize: number; // MB
  };

  // 이메일 설정
  email: {
    enabled: boolean;
    provider: 'smtp' | 'sendgrid' | 'ses';
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    smtpSecure?: boolean;
    fromName: string;
    fromEmail: string;
    replyToEmail: string;
    enableWelcomeEmail: boolean;
    enablePasswordResetEmail: boolean;
    enableNotificationEmails: boolean;
  };

  // 알림 설정
  notifications: {
    enablePushNotifications: boolean;
    enableEmailNotifications: boolean;
    enableSmsNotifications: boolean;
    notificationFrequency: 'immediate' | 'hourly' | 'daily';
    quietHoursStart: string; // HH:mm format
    quietHoursEnd: string; // HH:mm format
    enableQuietHours: boolean;
  };

  // 백업 설정
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:mm format
    retentionDays: number;
    includeFiles: boolean;
    includeDatabase: boolean;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
    storageProvider: 'local' | 's3' | 'gcs';
    s3Bucket?: string;
    s3Region?: string;
    gcsBucket?: string;
  };

  // 로깅 설정
  logging: {
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    logToFile: boolean;
    logToDatabase: boolean;
    maxLogFileSize: number; // MB
    logRetentionDays: number;
    enableAuditLog: boolean;
    enableErrorReporting: boolean;
    errorReportingService: 'sentry' | 'rollbar' | 'bugsnag' | 'none';
  };

  // 성능 설정
  performance: {
    enableCaching: boolean;
    cacheDriver: 'memory' | 'redis' | 'file';
    cacheTtl: number; // seconds
    enableCompression: boolean;
    enableMinification: boolean;
    maxConcurrentUsers: number;
    apiRateLimit: number; // requests per minute
    enableCdn: boolean;
    cdnUrl?: string;
  };

  // API 설정
  api: {
    enableApiAccess: boolean;
    enableApiDocumentation: boolean;
    apiVersion: string;
    enableCors: boolean;
    allowedOrigins: string[];
    enableApiKey: boolean;
    enableOAuth: boolean;
    oauthProviders: string[];
  };

  // 테마 및 UI 설정
  appearance: {
    defaultTheme: 'light' | 'dark' | 'auto';
    allowThemeSwitching: boolean;
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    customCss: string;
    hideFooter: boolean;
    enableAnimations: boolean;
  };

  // 분석 설정
  analytics: {
    enableAnalytics: boolean;
    provider: 'google' | 'matomo' | 'mixpanel' | 'none';
    trackingId?: string;
    enableUserTracking: boolean;
    enableEventTracking: boolean;
    enableHeatmaps: boolean;
    cookieConsent: boolean;
    dataRetentionDays: number;
  };

  // 재활치료 관련 설정
  rehabilitation: {
    defaultSessionDuration: number; // minutes
    reminderEmailDays: number;
    enableProgressReports: boolean;
    reportFrequency: 'weekly' | 'monthly' | 'quarterly';
    enableGoalTracking: boolean;
    enablePatientPortal: boolean;
    enableTherapistNotes: boolean;
    enableVideoSessions: boolean;
    maxVideoParticipants: number;
  };
}

export interface SettingSection {
  id: keyof SystemSettings;
  title: string;
  description: string;
  icon: string;
  fields: SettingField[];
}

export interface SettingField {
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'password' | 'time' | 'color' | 'url' | 'email';
  value: any;
  options?: { label: string; value: string | number | boolean }[];
  required?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  validation?: string; // regex pattern
  category?: string;
}

export interface SettingsChange {
  section: keyof SystemSettings;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
  userId: string;
  userEmail: string;
}

export interface SettingsValidationError {
  field: string;
  message: string;
}

export interface SettingsValidationResult {
  isValid: boolean;
  errors: SettingsValidationError[];
}

// 기본 시스템 설정 값
export const defaultSystemSettings: SystemSettings = {
  system: {
    siteName: 'PsyRehab',
    siteDescription: '심리재활 및 치료 관리 시스템',
    defaultLanguage: 'ko',
    timezone: 'Asia/Seoul',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    maintenance: false,
    maintenanceMessage: '시스템 점검 중입니다. 잠시 후 다시 시도해주세요.',
    allowRegistration: true,
    defaultUserRole: 'user',
  },
  security: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    lockoutDuration: 5,
    twoFactorRequired: false,
    allowedFileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'],
    maxFileSize: 10,
  },
  email: {
    enabled: true,
    provider: 'smtp',
    fromName: 'PsyRehab',
    fromEmail: 'noreply@psyrehab.com',
    replyToEmail: 'support@psyrehab.com',
    enableWelcomeEmail: true,
    enablePasswordResetEmail: true,
    enableNotificationEmails: true,
  },
  notifications: {
    enablePushNotifications: true,
    enableEmailNotifications: true,
    enableSmsNotifications: false,
    notificationFrequency: 'immediate',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    enableQuietHours: true,
  },
  backup: {
    enabled: true,
    frequency: 'daily',
    time: '02:00',
    retentionDays: 30,
    includeFiles: true,
    includeDatabase: true,
    compressionEnabled: true,
    encryptionEnabled: true,
    storageProvider: 'local',
  },
  logging: {
    logLevel: 'info',
    logToFile: true,
    logToDatabase: true,
    maxLogFileSize: 100,
    logRetentionDays: 90,
    enableAuditLog: true,
    enableErrorReporting: true,
    errorReportingService: 'none',
  },
  performance: {
    enableCaching: true,
    cacheDriver: 'memory',
    cacheTtl: 3600,
    enableCompression: true,
    enableMinification: true,
    maxConcurrentUsers: 1000,
    apiRateLimit: 60,
    enableCdn: false,
  },
  api: {
    enableApiAccess: true,
    enableApiDocumentation: true,
    apiVersion: 'v1',
    enableCors: true,
    allowedOrigins: ['*'],
    enableApiKey: true,
    enableOAuth: false,
    oauthProviders: [],
  },
  appearance: {
    defaultTheme: 'light',
    allowThemeSwitching: true,
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    logoUrl: '/logo.png',
    faviconUrl: '/favicon.ico',
    customCss: '',
    hideFooter: false,
    enableAnimations: true,
  },
  analytics: {
    enableAnalytics: false,
    provider: 'none',
    enableUserTracking: false,
    enableEventTracking: false,
    enableHeatmaps: false,
    cookieConsent: true,
    dataRetentionDays: 365,
  },
  rehabilitation: {
    defaultSessionDuration: 60,
    reminderEmailDays: 3,
    enableProgressReports: true,
    reportFrequency: 'weekly',
    enableGoalTracking: true,
    enablePatientPortal: true,
    enableTherapistNotes: true,
    enableVideoSessions: true,
    maxVideoParticipants: 4,
  },
}; 