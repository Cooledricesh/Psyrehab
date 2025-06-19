import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/hooks/useAuthState'
import { EmojiIcon } from '@/components/ui/accessible-icon'

// User settings types
interface UserSettings {
  // Notification settings
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  weeklyReport: boolean
  goalReminders: boolean
  appointmentReminders: boolean
  
  // Display settings
  theme: 'light' | 'dark' | 'system'
  language: 'ko' | 'en'
  timezone: string
  dateFormat: 'ko' | 'us' | 'iso'
  
  // Privacy settings
  profileVisibility: 'public' | 'private' | 'contacts'
  showOnlineStatus: boolean
  allowDataCollection: boolean
  
  // Application settings
  autoSave: boolean
  confirmDeletion: boolean
  compactView: boolean
  showTutorials: boolean
}

const defaultSettings: UserSettings = {
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  weeklyReport: true,
  goalReminders: true,
  appointmentReminders: true,
  theme: 'system',
  language: 'ko',
  timezone: 'Asia/Seoul',
  dateFormat: 'ko',
  profileVisibility: 'private',
  showOnlineStatus: true,
  allowDataCollection: false,
  autoSave: true,
  confirmDeletion: true,
  compactView: false,
  showTutorials: true
}

interface UserSettingsProps {
  onSettingsChange?: (settings: UserSettings) => void
  className?: string
}

/**
 * User settings management component
 */
export function UserSettings({ onSettingsChange, className = '' }: UserSettingsProps) {
  const { profile } = useUserProfile()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'notifications' | 'display' | 'privacy' | 'app'>('notifications')

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem(`user_settings_${profile?.user_id}`)
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          setSettings({ ...defaultSettings, ...parsed })
        }
      } catch {
        console.error("Error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    if (profile?.user_id) {
      loadSettings()
    } else {
      setIsLoading(false)
    }
  }, [profile?.user_id])

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value }
      setHasChanges(true)
      return newSettings
    })
  }

  const saveSettings = async () => {
    if (!profile?.user_id) return

    setIsSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem(`user_settings_${profile.user_id}`, JSON.stringify(settings))
      
      // Apply theme immediately
      applyTheme(settings.theme)
      
      setHasChanges(false)
      onSettingsChange?.(settings)
    } catch {
      console.error("Error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
  }

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement
    
    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', systemPrefersDark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { 
      id: 'notifications' as const, 
      name: '알림', 
      emoji: '🔔',
      emojiLabel: '알림 설정'
    },
    { 
      id: 'display' as const, 
      name: '화면', 
      emoji: '🎨',
      emojiLabel: '화면 설정'
    },
    { 
      id: 'privacy' as const, 
      name: '개인정보', 
      emoji: '🔒',
      emojiLabel: '개인정보 설정'
    },
    { 
      id: 'app' as const, 
      name: '앱 설정', 
      emoji: '⚙️',
      emojiLabel: '앱 설정'
    }
  ]

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">설정</h3>
          
          {hasChanges && (
            <div className="flex space-x-2">
              <button
                onClick={resetSettings}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                초기화
              </button>
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <EmojiIcon 
                emoji={tab.emoji} 
                label={tab.emojiLabel}
                className="mr-2"
                decorative={false}
              />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {activeTab === 'notifications' && (
          <div id="notifications-panel" role="tabpanel" aria-labelledby="notifications-tab">
            <NotificationSettings
              settings={settings}
              onChange={handleSettingChange}
            />
          </div>
        )}
        
        {activeTab === 'display' && (
          <div id="display-panel" role="tabpanel" aria-labelledby="display-tab">
            <DisplaySettings
              settings={settings}
              onChange={handleSettingChange}
            />
          </div>
        )}
        
        {activeTab === 'privacy' && (
          <div id="privacy-panel" role="tabpanel" aria-labelledby="privacy-tab">
            <PrivacySettings
              settings={settings}
              onChange={handleSettingChange}
            />
          </div>
        )}
        
        {activeTab === 'app' && (
          <div id="app-panel" role="tabpanel" aria-labelledby="app-tab">
            <AppSettings
              settings={settings}
              onChange={handleSettingChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Notification settings section
 */
interface SettingsSectionProps {
  settings: UserSettings
  onChange: (key: keyof UserSettings, value: any) => void
}

function NotificationSettings({ settings, onChange }: SettingsSectionProps) {
  const notificationSettings = [
    {
      key: 'emailNotifications' as const,
      title: '이메일 알림',
      description: '중요한 알림을 이메일로 받습니다'
    },
    {
      key: 'pushNotifications' as const,
      title: '푸시 알림',
      description: '브라우저 푸시 알림을 받습니다'
    },
    {
      key: 'smsNotifications' as const,
      title: 'SMS 알림',
      description: '긴급한 알림을 SMS로 받습니다'
    },
    {
      key: 'weeklyReport' as const,
      title: '주간 리포트',
      description: '매주 진행 상황 리포트를 받습니다'
    },
    {
      key: 'goalReminders' as const,
      title: '목표 알림',
      description: '목표 달성 알림을 받습니다'
    },
    {
      key: 'appointmentReminders' as const,
      title: '약속 알림',
      description: '예정된 약속 알림을 받습니다'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">알림 설정</h4>
        <p className="text-sm text-gray-600 mb-6">
          받고 싶은 알림 유형을 선택하세요.
        </p>
      </div>

      <div className="space-y-4">
        {notificationSettings.map((setting) => (
          <div key={setting.key} className="flex items-center justify-between">
            <div className="flex-1">
              <h5 className="text-sm font-medium text-gray-900">{setting.title}</h5>
              <p className="text-sm text-gray-500">{setting.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings[setting.key] as boolean}
                onChange={(e) => onChange(setting.key, e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Display settings section
 */
function DisplaySettings({ settings, onChange }: SettingsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">화면 설정</h4>
        <p className="text-sm text-gray-600 mb-6">
          앱의 모양과 동작을 설정하세요.
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            테마
          </label>
          <select
            value={settings.theme}
            onChange={(e) => onChange('theme', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">밝은 테마</option>
            <option value="dark">어두운 테마</option>
            <option value="system">시스템 설정 따르기</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            언어
          </label>
          <select
            value={settings.language}
            onChange={(e) => onChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Date Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            날짜 형식
          </label>
          <select
            value={settings.dateFormat}
            onChange={(e) => onChange('dateFormat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ko">2024년 1월 1일</option>
            <option value="us">01/01/2024</option>
            <option value="iso">2024-01-01</option>
          </select>
        </div>

        {/* Compact View */}
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-medium text-gray-900">간편 보기</h5>
            <p className="text-sm text-gray-500">더 많은 정보를 한 화면에 표시합니다</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.compactView}
              onChange={(e) => onChange('compactView', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  )
}

/**
 * Privacy settings section
 */
function PrivacySettings({ settings, onChange }: SettingsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">개인정보 설정</h4>
        <p className="text-sm text-gray-600 mb-6">
          개인정보 보호와 관련된 설정을 관리하세요.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Visibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            프로필 공개 범위
          </label>
          <select
            value={settings.profileVisibility}
            onChange={(e) => onChange('profileVisibility', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="private">비공개</option>
            <option value="contacts">연락처만</option>
            <option value="public">공개</option>
          </select>
        </div>

        {/* Online Status */}
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-medium text-gray-900">온라인 상태 표시</h5>
            <p className="text-sm text-gray-500">다른 사용자에게 온라인 상태를 표시합니다</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.showOnlineStatus}
              onChange={(e) => onChange('showOnlineStatus', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Data Collection */}
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-medium text-gray-900">데이터 수집 허용</h5>
            <p className="text-sm text-gray-500">서비스 개선을 위한 익명 데이터 수집을 허용합니다</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.allowDataCollection}
              onChange={(e) => onChange('allowDataCollection', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  )
}

/**
 * Application settings section
 */
function AppSettings({ settings, onChange }: SettingsSectionProps) {
  const appSettings = [
    {
      key: 'autoSave' as const,
      title: '자동 저장',
      description: '변경사항을 자동으로 저장합니다'
    },
    {
      key: 'confirmDeletion' as const,
      title: '삭제 확인',
      description: '항목 삭제 시 확인 메시지를 표시합니다'
    },
    {
      key: 'showTutorials' as const,
      title: '튜토리얼 표시',
      description: '새로운 기능에 대한 튜토리얼을 표시합니다'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">앱 설정</h4>
        <p className="text-sm text-gray-600 mb-6">
          앱의 동작과 관련된 설정을 관리하세요.
        </p>
      </div>

      <div className="space-y-4">
        {appSettings.map((setting) => (
          <div key={setting.key} className="flex items-center justify-between">
            <div className="flex-1">
              <h5 className="text-sm font-medium text-gray-900">{setting.title}</h5>
              <p className="text-sm text-gray-500">{setting.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings[setting.key] as boolean}
                onChange={(e) => onChange(setting.key, e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          시간대
        </label>
        <select
          value={settings.timezone}
          onChange={(e) => onChange('timezone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Asia/Seoul">서울 (GMT+9)</option>
          <option value="UTC">UTC (GMT+0)</option>
          <option value="America/New_York">뉴욕 (GMT-5)</option>
          <option value="Europe/London">런던 (GMT+0)</option>
        </select>
      </div>
    </div>
  )
}

/**
 * Hook for using user settings
 */
export function useUserSettings() {
  const { profile } = useUserProfile()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)

  useEffect(() => {
    if (profile?.user_id) {
      const savedSettings = localStorage.getItem(`user_settings_${profile.user_id}`)
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          setSettings({ ...defaultSettings, ...parsed })
        } catch {
          console.error("Error occurred")
        }
      }
    }
  }, [profile?.user_id])

  const updateSetting = (key: keyof UserSettings, value: any) => {
    if (!profile?.user_id) return

    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    try {
      localStorage.setItem(`user_settings_${profile.user_id}`, JSON.stringify(newSettings))
    } catch {
      console.error("Error occurred")
    }
  }

  return {
    settings,
    updateSetting,
    resetSettings: () => {
      setSettings(defaultSettings)
      if (profile?.user_id) {
        localStorage.removeItem(`user_settings_${profile.user_id}`)
      }
    }
  }
} 