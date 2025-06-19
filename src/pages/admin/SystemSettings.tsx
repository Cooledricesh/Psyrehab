import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { SettingsForm } from '../../components/admin/SettingsForm';
import { SettingsHistory } from '../../components/admin/SettingsHistory';
import { 
  SystemSettings as SystemSettingsType, 
  defaultSystemSettings, 
  SettingsChange 
} from '../../types/settings';
import {
  Save,
  RotateCcw,
  Settings,
  Shield,
  Mail,
  Bell,
  Database,
  FileText,
  Zap,
  Code,
  Palette,
  BarChart3,
  Heart,
  History,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

type SettingsTab = 'system' | 'security' | 'email' | 'notifications' | 'backup' | 'logging' | 'performance' | 'api' | 'appearance' | 'analytics' | 'rehabilitation' | 'history';

interface SettingsTabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  permission?: string;
}

const settingsTabs: SettingsTabConfig[] = [
  {
    id: 'system',
    label: '시스템',
    icon: Settings,
    description: '기본 시스템 설정 및 사이트 정보',
    permission: 'system:manage'
  },
  {
    id: 'security',
    label: '보안',
    icon: Shield,
    description: '비밀번호 정책, 로그인 제한 및 보안 설정',
    permission: 'system:manage'
  },
  {
    id: 'email',
    label: '이메일',
    icon: Mail,
    description: 'SMTP 설정 및 이메일 발송 구성',
    permission: 'system:manage'
  },
  {
    id: 'notifications',
    label: '알림',
    icon: Bell,
    description: '푸시 알림, 이메일 알림 및 알림 스케줄',
    permission: 'system:manage'
  },
  {
    id: 'backup',
    label: '백업',
    icon: Database,
    description: '자동 백업 스케줄 및 복원 설정',
    permission: 'backup:manage'
  },
  {
    id: 'logging',
    label: '로그',
    icon: FileText,
    description: '로그 레벨, 보관 기간 및 에러 리포팅',
    permission: 'logs:view'
  },
  {
    id: 'performance',
    label: '성능',
    icon: Zap,
    description: '캐싱, 압축 및 성능 최적화 설정',
    permission: 'system:manage'
  },
  {
    id: 'api',
    label: 'API',
    icon: Code,
    description: 'API 접근 권한 및 CORS 설정',
    permission: 'system:manage'
  },
  {
    id: 'appearance',
    label: '외관',
    icon: Palette,
    description: '테마, 색상 및 UI 커스터마이징',
    permission: 'system:manage'
  },
  {
    id: 'analytics',
    label: '분석',
    icon: BarChart3,
    description: '웹 분석 도구 및 사용자 추적 설정',
    permission: 'system:manage'
  },
  {
    id: 'rehabilitation',
    label: '재활치료',
    icon: Heart,
    description: '재활치료 세션 및 환자 관리 설정',
    permission: 'system:manage'
  },
  {
    id: 'history',
    label: '변경 이력',
    icon: History,
    description: '설정 변경 기록 및 감사 로그',
    permission: 'logs:view'
  }
];

export default function SystemSettings() {
  const { user, checkPermission } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('system');
  const [settings, setSettings] = useState<SystemSettingsType>(defaultSystemSettings);
  const [originalSettings, setOriginalSettings] = useState<SystemSettingsType>(defaultSystemSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [settingsHistory, setSettingsHistory] = useState<SettingsChange[]>([]);

  // 설정 로드
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // 실제 환경에서는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 모의 데이터 (실제로는 서버에서 가져옴)
      const loadedSettings = { ...defaultSystemSettings };
      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
      
      // 설정 변경 이력 로드
      const mockHistory: SettingsChange[] = [
        {
          section: 'system',
          field: 'siteName',
          oldValue: 'PsyRehab',
          newValue: 'PsyRehab Pro',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          userId: '1',
          userEmail: 'admin@psyrehab.com'
        },
        {
          section: 'security',
          field: 'passwordMinLength',
          oldValue: 6,
          newValue: 8,
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          userId: '1',
          userEmail: 'admin@psyrehab.com'
        }
      ];
      setSettingsHistory(mockHistory);
      
    } catch {
      console.error("Error occurred");
      setSaveStatus('error');
      setSaveMessage('설정을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 설정 저장
  const saveSettings = async () => {
    if (!hasChanges) return;

    try {
      setSaving(true);
      setSaveStatus('idle');

      // 실제 환경에서는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 변경 사항 기록
      const changes: SettingsChange[] = [];
      Object.keys(settings).forEach(sectionKey => {
        const section = sectionKey as keyof SystemSettingsType;
        const currentSection = settings[section];
        const originalSection = originalSettings[section];

        Object.keys(currentSection).forEach(fieldKey => {
          const currentValue = (currentSection as any)[fieldKey];
          const originalValue = (originalSection as any)[fieldKey];

          if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
            changes.push({
              section,
              field: fieldKey,
              oldValue: originalValue,
              newValue: currentValue,
              timestamp: new Date().toISOString(),
              userId: user?.id || '',
              userEmail: user?.email || ''
            });
          }
        });
      });

      // 이력에 변경사항 추가
      setSettingsHistory(prev => [...changes, ...prev]);
      
      // 원본 설정 업데이트
      setOriginalSettings(settings);
      setHasChanges(false);
      setSaveStatus('success');
      setSaveMessage('설정이 성공적으로 저장되었습니다.');
      
      // 성공 메시지 자동 숨김
      setTimeout(() => setSaveStatus('idle'), 3000);
      
    } catch {
      console.error("Error occurred");
      setSaveStatus('error');
      setSaveMessage('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 설정 리셋
  const resetSettings = () => {
    if (window.confirm('모든 변경사항을 취소하고 원래 설정으로 되돌리시겠습니까?')) {
      setSettings(originalSettings);
      setHasChanges(false);
      setSaveStatus('idle');
    }
  };

  // 설정 변경 핸들러
  const handleSettingsChange = (section: keyof SystemSettingsType, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    setHasChanges(true);
    setSaveStatus('idle');
  };

  // 초기 로드
  useEffect(() => {
    loadSettings();
  }, []);

  // 권한이 있는 탭만 필터링
  const availableTabs = settingsTabs.filter(tab => 
    !tab.permission || checkPermission(tab.permission)
  );

  // 현재 탭의 설정 데이터
  const currentTabData = activeTab === 'history' ? null : settings[activeTab];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
          <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} user={user} />
          <main className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">설정을 불러오는 중...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} user={user} />
        
        <main className="p-6">
          {/* 페이지 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">시스템 설정</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                시스템 전반의 설정을 관리하고 구성하세요.
              </p>
            </div>
            
            {/* 저장 상태 및 액션 버튼 */}
            <div className="flex items-center gap-3">
              {saveStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">{saveMessage}</span>
                </div>
              )}
              
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{saveMessage}</span>
                </div>
              )}
              
              {hasChanges && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                  <Info className="h-4 w-4" />
                  <span className="text-sm">저장하지 않은 변경사항이 있습니다</span>
                </div>
              )}
              
              {hasChanges && (
                <button
                  onClick={resetSettings}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  취소
                </button>
              )}
              
              <button
                onClick={saveSettings}
                disabled={!hasChanges || isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    저장
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 overflow-x-auto">
                {availableTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                        isActive
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            
            {/* 활성 탭 설명 */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {availableTabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>
          </div>

          {/* 설정 폼 또는 히스토리 */}
          {activeTab === 'history' ? (
            <SettingsHistory history={settingsHistory} />
          ) : (
            <SettingsForm
              section={activeTab}
              data={currentTabData}
              onChange={(field, value) => handleSettingsChange(activeTab, field, value)}
            />
          )}
        </main>
      </div>
    </div>
  );
} 