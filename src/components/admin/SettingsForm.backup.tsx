import React from 'react';
import { 
  Globe, 
  Clock, 
  Shield, 
  Key, 
  AlertTriangle, 
  Mail, 
  Server, 
  Bell, 
  BellOff, 
  Database, 
  HardDrive, 
  Zap, 
  Code2, 
  Palette, 
  BarChart, 
  Heart,
  HelpCircle
} from 'lucide-react';

interface SettingsFormProps {
  section: string;
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

interface FieldConfig {
  label: string;
  description?: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'password' | 'time' | 'color' | 'multiselect';
  options?: { label: string; value: string | number | boolean }[];
  min?: number;
  max?: number;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  category?: string;
  required?: boolean;
  help?: string;
}

// 각 섹션별 필드 설정
const sectionConfigs: Record<string, Record<string, FieldConfig>> = {
  system: {
    siteName: {
      label: '사이트 이름',
      description: '시스템에 표시될 사이트의 이름',
      type: 'text',
      icon: Globe,
      required: true,
      placeholder: 'PsyRehab'
    },
    siteDescription: {
      label: '사이트 설명',
      description: '사이트에 대한 간단한 설명',
      type: 'textarea',
      placeholder: '심리재활 및 치료 관리 시스템'
    },
    defaultLanguage: {
      label: '기본 언어',
      type: 'select',
      options: [
        { label: '한국어', value: 'ko' },
        { label: 'English', value: 'en' },
        { label: '日本語', value: 'ja' },
        { label: '中文', value: 'zh' }
      ],
      icon: Globe
    },
    timezone: {
      label: '시간대',
      type: 'select',
      options: [
        { label: 'Asia/Seoul', value: 'Asia/Seoul' },
        { label: 'UTC', value: 'UTC' },
        { label: 'America/New_York', value: 'America/New_York' },
        { label: 'Europe/London', value: 'Europe/London' }
      ],
      icon: Clock
    },
    dateFormat: {
      label: '날짜 형식',
      type: 'select',
      options: [
        { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
        { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
        { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' }
      ]
    },
    timeFormat: {
      label: '시간 형식',
      type: 'select',
      options: [
        { label: '24시간', value: '24h' },
        { label: '12시간 (AM/PM)', value: '12h' }
      ]
    },
    maintenance: {
      label: '점검 모드',
      description: '활성화 시 일반 사용자 접근이 제한됩니다',
      type: 'boolean',
      icon: AlertTriangle
    },
    maintenanceMessage: {
      label: '점검 메시지',
      description: '점검 모드 시 사용자에게 표시될 메시지',
      type: 'textarea',
      placeholder: '시스템 점검 중입니다. 잠시 후 다시 시도해주세요.'
    },
    allowRegistration: {
      label: '회원가입 허용',
      description: '새로운 사용자의 회원가입을 허용합니다',
      type: 'boolean'
    },
    defaultUserRole: {
      label: '기본 사용자 역할',
      description: '새로 가입한 사용자에게 할당될 기본 역할',
      type: 'select',
      options: [
        { label: '사용자', value: 'user' },
        { label: '게스트', value: 'guest' }
      ]
    }
  },
  security: {
    passwordMinLength: {
      label: '최소 비밀번호 길이',
      type: 'number',
      min: 4,
      max: 32,
      icon: Key
    },
    passwordRequireUppercase: {
      label: '대문자 필수',
      description: '비밀번호에 대문자가 포함되어야 합니다',
      type: 'boolean'
    },
    passwordRequireLowercase: {
      label: '소문자 필수',
      description: '비밀번호에 소문자가 포함되어야 합니다',
      type: 'boolean'
    },
    passwordRequireNumbers: {
      label: '숫자 필수',
      description: '비밀번호에 숫자가 포함되어야 합니다',
      type: 'boolean'
    },
    passwordRequireSymbols: {
      label: '특수문자 필수',
      description: '비밀번호에 특수문자가 포함되어야 합니다',
      type: 'boolean'
    },
    sessionTimeout: {
      label: '세션 만료 시간 (분)',
      type: 'number',
      min: 5,
      max: 1440,
      icon: Clock
    },
    maxLoginAttempts: {
      label: '최대 로그인 시도 횟수',
      type: 'number',
      min: 3,
      max: 10,
      icon: Shield
    },
    lockoutDuration: {
      label: '계정 잠금 시간 (분)',
      type: 'number',
      min: 1,
      max: 60
    },
    twoFactorRequired: {
      label: '2단계 인증 필수',
      description: '모든 사용자에게 2단계 인증을 요구합니다',
      type: 'boolean'
    },
    maxFileSize: {
      label: '최대 파일 크기 (MB)',
      type: 'number',
      min: 1,
      max: 100,
      icon: HardDrive
    }
  },
  email: {
    enabled: {
      label: '이메일 기능 활성화',
      type: 'boolean',
      icon: Mail
    },
    provider: {
      label: '이메일 제공업체',
      type: 'select',
      options: [
        { label: 'SMTP', value: 'smtp' },
        { label: 'SendGrid', value: 'sendgrid' },
        { label: 'Amazon SES', value: 'ses' }
      ]
    },
    smtpHost: {
      label: 'SMTP 호스트',
      type: 'text',
      placeholder: 'smtp.gmail.com',
      icon: Server
    },
    smtpPort: {
      label: 'SMTP 포트',
      type: 'number',
      min: 1,
      max: 65535,
      placeholder: '587'
    },
    smtpUsername: {
      label: 'SMTP 사용자명',
      type: 'text',
      placeholder: 'your-email@gmail.com'
    },
    smtpPassword: {
      label: 'SMTP 비밀번호',
      type: 'password',
      placeholder: '••••••••'
    },
    smtpSecure: {
      label: 'SMTP 보안 연결',
      description: 'TLS/SSL을 사용하여 안전한 연결을 설정합니다',
      type: 'boolean'
    },
    fromName: {
      label: '발신자 이름',
      type: 'text',
      placeholder: 'PsyRehab'
    },
    fromEmail: {
      label: '발신자 이메일',
      type: 'text',
      placeholder: 'noreply@psyrehab.com'
    },
    replyToEmail: {
      label: '답장 이메일',
      type: 'text',
      placeholder: 'support@psyrehab.com'
    },
    enableWelcomeEmail: {
      label: '환영 이메일 발송',
      type: 'boolean'
    },
    enablePasswordResetEmail: {
      label: '비밀번호 재설정 이메일',
      type: 'boolean'
    },
    enableNotificationEmails: {
      label: '알림 이메일 발송',
      type: 'boolean'
    }
  },
  notifications: {
    enablePushNotifications: {
      label: '푸시 알림',
      type: 'boolean',
      icon: Bell
    },
    enableEmailNotifications: {
      label: '이메일 알림',
      type: 'boolean',
      icon: Mail
    },
    enableSmsNotifications: {
      label: 'SMS 알림',
      type: 'boolean'
    },
    notificationFrequency: {
      label: '알림 빈도',
      type: 'select',
      options: [
        { label: '즉시', value: 'immediate' },
        { label: '매시간', value: 'hourly' },
        { label: '매일', value: 'daily' }
      ]
    },
    enableQuietHours: {
      label: '방해 금지 시간 활성화',
      type: 'boolean',
      icon: BellOff
    },
    quietHoursStart: {
      label: '방해 금지 시작 시간',
      type: 'time'
    },
    quietHoursEnd: {
      label: '방해 금지 종료 시간',
      type: 'time'
    }
  },
  backup: {
    enabled: {
      label: '백업 활성화',
      type: 'boolean',
      icon: Database
    },
    frequency: {
      label: '백업 주기',
      type: 'select',
      options: [
        { label: '매일', value: 'daily' },
        { label: '매주', value: 'weekly' },
        { label: '매월', value: 'monthly' }
      ]
    },
    time: {
      label: '백업 시간',
      type: 'time'
    },
    retentionDays: {
      label: '백업 보관 기간 (일)',
      type: 'number',
      min: 1,
      max: 365
    },
    includeFiles: {
      label: '파일 포함',
      type: 'boolean'
    },
    includeDatabase: {
      label: '데이터베이스 포함',
      type: 'boolean'
    },
    compressionEnabled: {
      label: '압축 활성화',
      type: 'boolean'
    },
    encryptionEnabled: {
      label: '암호화 활성화',
      type: 'boolean'
    },
    storageProvider: {
      label: '저장소 제공업체',
      type: 'select',
      options: [
        { label: '로컬', value: 'local' },
        { label: 'Amazon S3', value: 's3' },
        { label: 'Google Cloud Storage', value: 'gcs' }
      ]
    }
  },
  logging: {
    logLevel: {
      label: '로그 레벨',
      type: 'select',
      options: [
        { label: 'Error', value: 'error' },
        { label: 'Warning', value: 'warn' },
        { label: 'Info', value: 'info' },
        { label: 'Debug', value: 'debug' }
      ]
    },
    logToFile: {
      label: '파일 로그',
      type: 'boolean'
    },
    logToDatabase: {
      label: '데이터베이스 로그',
      type: 'boolean'
    },
    maxLogFileSize: {
      label: '최대 로그 파일 크기 (MB)',
      type: 'number',
      min: 1,
      max: 1000
    },
    logRetentionDays: {
      label: '로그 보관 기간 (일)',
      type: 'number',
      min: 1,
      max: 365
    },
    enableAuditLog: {
      label: '감사 로그',
      type: 'boolean'
    },
    enableErrorReporting: {
      label: '에러 리포팅',
      type: 'boolean'
    },
    errorReportingService: {
      label: '에러 리포팅 서비스',
      type: 'select',
      options: [
        { label: '없음', value: 'none' },
        { label: 'Sentry', value: 'sentry' },
        { label: 'Rollbar', value: 'rollbar' },
        { label: 'Bugsnag', value: 'bugsnag' }
      ]
    }
  },
  performance: {
    enableCaching: {
      label: '캐싱 활성화',
      type: 'boolean',
      icon: Zap
    },
    cacheDriver: {
      label: '캐시 드라이버',
      type: 'select',
      options: [
        { label: '메모리', value: 'memory' },
        { label: 'Redis', value: 'redis' },
        { label: '파일', value: 'file' }
      ]
    },
    cacheTtl: {
      label: '캐시 TTL (초)',
      type: 'number',
      min: 60,
      max: 86400
    },
    enableCompression: {
      label: '압축 활성화',
      type: 'boolean'
    },
    enableMinification: {
      label: '최소화 활성화',
      type: 'boolean'
    },
    maxConcurrentUsers: {
      label: '최대 동시 사용자',
      type: 'number',
      min: 1,
      max: 10000
    },
    apiRateLimit: {
      label: 'API 요청 제한 (분당)',
      type: 'number',
      min: 1,
      max: 1000
    },
    enableCdn: {
      label: 'CDN 활성화',
      type: 'boolean'
    },
    cdnUrl: {
      label: 'CDN URL',
      type: 'text',
      placeholder: 'https://cdn.example.com'
    }
  },
  api: {
    enableApiAccess: {
      label: 'API 접근 허용',
      type: 'boolean',
      icon: Code2
    },
    enableApiDocumentation: {
      label: 'API 문서 활성화',
      type: 'boolean'
    },
    apiVersion: {
      label: 'API 버전',
      type: 'text',
      placeholder: 'v1'
    },
    enableCors: {
      label: 'CORS 활성화',
      type: 'boolean'
    },
    enableApiKey: {
      label: 'API 키 필수',
      type: 'boolean'
    },
    enableOAuth: {
      label: 'OAuth 활성화',
      type: 'boolean'
    }
  },
  appearance: {
    defaultTheme: {
      label: '기본 테마',
      type: 'select',
      options: [
        { label: '라이트', value: 'light' },
        { label: '다크', value: 'dark' },
        { label: '자동', value: 'auto' }
      ],
      icon: Palette
    },
    allowThemeSwitching: {
      label: '테마 전환 허용',
      type: 'boolean'
    },
    primaryColor: {
      label: '주 색상',
      type: 'color'
    },
    secondaryColor: {
      label: '보조 색상',
      type: 'color'
    },
    logoUrl: {
      label: '로고 URL',
      type: 'text',
      placeholder: '/logo.png'
    },
    faviconUrl: {
      label: '파비콘 URL',
      type: 'text',
      placeholder: '/favicon.ico'
    },
    customCss: {
      label: '사용자 정의 CSS',
      type: 'textarea',
      placeholder: '/* 사용자 정의 스타일 */'
    },
    hideFooter: {
      label: '푸터 숨기기',
      type: 'boolean'
    },
    enableAnimations: {
      label: '애니메이션 활성화',
      type: 'boolean'
    }
  },
  analytics: {
    enableAnalytics: {
      label: '분석 활성화',
      type: 'boolean',
      icon: BarChart
    },
    provider: {
      label: '분석 제공업체',
      type: 'select',
      options: [
        { label: '없음', value: 'none' },
        { label: 'Google Analytics', value: 'google' },
        { label: 'Matomo', value: 'matomo' },
        { label: 'Mixpanel', value: 'mixpanel' }
      ]
    },
    trackingId: {
      label: '추적 ID',
      type: 'text',
      placeholder: 'GA_MEASUREMENT_ID'
    },
    enableUserTracking: {
      label: '사용자 추적',
      type: 'boolean'
    },
    enableEventTracking: {
      label: '이벤트 추적',
      type: 'boolean'
    },
    enableHeatmaps: {
      label: '히트맵 활성화',
      type: 'boolean'
    },
    cookieConsent: {
      label: '쿠키 동의',
      type: 'boolean'
    },
    dataRetentionDays: {
      label: '데이터 보관 기간 (일)',
      type: 'number',
      min: 1,
      max: 1095
    }
  },
  rehabilitation: {
    defaultSessionDuration: {
      label: '기본 세션 시간 (분)',
      type: 'number',
      min: 15,
      max: 180,
      icon: Heart
    },
    reminderEmailDays: {
      label: '알림 이메일 발송일',
      type: 'number',
      min: 1,
      max: 14
    },
    enableProgressReports: {
      label: '진행 보고서 활성화',
      type: 'boolean'
    },
    reportFrequency: {
      label: '보고서 빈도',
      type: 'select',
      options: [
        { label: '매주', value: 'weekly' },
        { label: '매월', value: 'monthly' },
        { label: '분기별', value: 'quarterly' }
      ]
    },
    enableGoalTracking: {
      label: '목표 추적',
      type: 'boolean'
    },
    enablePatientPortal: {
      label: '환자 포털',
      type: 'boolean'
    },
    enableTherapistNotes: {
      label: '치료사 노트',
      type: 'boolean'
    },
    enableVideoSessions: {
      label: '화상 세션',
      type: 'boolean'
    },
    maxVideoParticipants: {
      label: '최대 화상 참가자',
      type: 'number',
      min: 2,
      max: 10
    }
  }
};

export default function SettingsForm({ section, data, onChange }: SettingsFormProps) {
  const config = sectionConfigs[section];
  
  if (!config || !data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-500 dark:text-gray-400">설정을 불러올 수 없습니다.</p>
      </div>
    );
  }

  const renderField = (key: string, fieldConfig: FieldConfig) => {
    const value = data[key];
    const Icon = fieldConfig.icon;

    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {fieldConfig.label}
            {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {fieldConfig.help && (
            <HelpCircle className="h-4 w-4 text-gray-400" title={fieldConfig.help} />
          )}
        </div>
        
        {fieldConfig.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {fieldConfig.description}
          </p>
        )}

        {fieldConfig.type === 'text' && (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={fieldConfig.placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        )}

        {fieldConfig.type === 'number' && (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(key, parseInt(e.target.value) || 0)}
            min={fieldConfig.min}
            max={fieldConfig.max}
            placeholder={fieldConfig.placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        )}

        {fieldConfig.type === 'boolean' && (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(key, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm text-gray-900 dark:text-white">
              {value ? '활성화' : '비활성화'}
            </span>
          </label>
        )}

        {fieldConfig.type === 'select' && (
          <select
            value={value || ''}
            onChange={(e) => onChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {fieldConfig.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {fieldConfig.type === 'textarea' && (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={fieldConfig.placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        )}

        {fieldConfig.type === 'password' && (
          <input
            type="password"
            value={value || ''}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={fieldConfig.placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        )}

        {fieldConfig.type === 'time' && (
          <input
            type="time"
            value={value || ''}
            onChange={(e) => onChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        )}

        {fieldConfig.type === 'color' && (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(key, e.target.value)}
              className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder="#000000"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(config).map(([key, fieldConfig]) => 
            renderField(key, fieldConfig)
          )}
        </div>
      </div>
    </div>
  );
} 