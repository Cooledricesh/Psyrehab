import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Search, 
  Filter, 
  Clock, 
  User, 
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
  RefreshCw,
  ChevronDown,
  X
} from 'lucide-react';
import { SettingsChange } from '../../types/settings';

interface SettingsHistoryProps {
  history: SettingsChange[];
}

const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  system: Settings,
  security: Shield,
  email: Mail,
  notifications: Bell,
  backup: Database,
  logging: FileText,
  performance: Zap,
  api: Code,
  appearance: Palette,
  analytics: BarChart3,
  rehabilitation: Heart,
};

const sectionLabels: Record<string, string> = {
  system: '시스템',
  security: '보안',
  email: '이메일',
  notifications: '알림',
  backup: '백업',
  logging: '로그',
  performance: '성능',
  api: 'API',
  appearance: '외관',
  analytics: '분석',
  rehabilitation: '재활치료',
};

export default function SettingsHistory({ history }: SettingsHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // 필터링된 히스토리
  const filteredHistory = useMemo(() => {
    return history.filter(change => {
      // 검색어 필터
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          change.field.toLowerCase().includes(searchLower) ||
          change.userEmail.toLowerCase().includes(searchLower) ||
          sectionLabels[change.section]?.toLowerCase().includes(searchLower) ||
          String(change.newValue).toLowerCase().includes(searchLower) ||
          String(change.oldValue).toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // 섹션 필터
      if (selectedSection && change.section !== selectedSection) {
        return false;
      }

      // 사용자 필터
      if (selectedUser && change.userEmail !== selectedUser) {
        return false;
      }

      // 날짜 범위 필터
      if (dateRange.start || dateRange.end) {
        const changeDate = new Date(change.timestamp);
        if (dateRange.start && changeDate < new Date(dateRange.start)) {
          return false;
        }
        if (dateRange.end && changeDate > new Date(dateRange.end + 'T23:59:59')) {
          return false;
        }
      }

      return true;
    });
  }, [history, searchTerm, selectedSection, selectedUser, dateRange]);

  // 고유 사용자 목록
  const uniqueUsers = useMemo(() => {
    return [...new Set(history.map(change => change.userEmail))].sort();
  }, [history]);

  // 고유 섹션 목록
  const uniqueSections = useMemo(() => {
    return [...new Set(history.map(change => change.section))].sort();
  }, [history]);

  // 필터 초기화
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSection('');
    setSelectedUser('');
    setDateRange({ start: '', end: '' });
  };

  // 값 표시 포맷팅
  const formatValue = (value: unknown): string => {
    if (typeof value === 'boolean') {
      return value ? '활성화' : '비활성화';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (value === null || value === undefined) {
      return '(없음)';
    }
    return String(value);
  };

  // 필드명 한글화
  const getFieldLabel = (field: string): string => {
    const fieldLabels: Record<string, string> = {
      siteName: '사이트 이름',
      siteDescription: '사이트 설명',
      defaultLanguage: '기본 언어',
      timezone: '시간대',
      passwordMinLength: '최소 비밀번호 길이',
      sessionTimeout: '세션 만료 시간',
      maxLoginAttempts: '최대 로그인 시도',
      enabled: '활성화',
      provider: '제공업체',
      fromEmail: '발신자 이메일',
      frequency: '주기',
      logLevel: '로그 레벨',
      enableCaching: '캐싱 활성화',
      defaultTheme: '기본 테마',
      primaryColor: '주 색상',
    };
    
    return fieldLabels[field] || field;
  };

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="설정명, 사용자, 값 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* 필터 토글 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="h-4 w-4" />
            필터
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* 새로고침 */}
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
        </div>

        {/* 상세 필터 */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 섹션 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  섹션
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">모든 섹션</option>
                  {uniqueSections.map(section => (
                    <option key={section} value={section}>
                      {sectionLabels[section] || section}
                    </option>
                  ))}
                </select>
              </div>

              {/* 사용자 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  사용자
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">모든 사용자</option>
                  {uniqueUsers.map(user => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </div>

              {/* 시작 날짜 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  시작 날짜
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* 종료 날짜 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  종료 날짜
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* 필터 초기화 */}
            {(searchTerm || selectedSection || selectedUser || dateRange.start || dateRange.end) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                  필터 초기화
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 결과 개수 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          총 {filteredHistory.length}개의 변경 이력
        </p>
      </div>

      {/* 히스토리 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              변경 이력이 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || selectedSection || selectedUser || dateRange.start || dateRange.end
                ? '검색 조건에 맞는 변경 이력이 없습니다.'
                : '아직 설정 변경 이력이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredHistory.map((change, index) => {
              const SectionIcon = sectionIcons[change.section] || Settings;
              
              return (
                <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* 아이콘 */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <SectionIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {sectionLabels[change.section] || change.section}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {getFieldLabel(change.field)}
                        </span>
                      </div>

                      {/* 변경 내용 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">이전:</span>
                          <code className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-xs">
                            {formatValue(change.oldValue)}
                          </code>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">이후:</span>
                          <code className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs">
                            {formatValue(change.newValue)}
                          </code>
                        </div>
                      </div>

                      {/* 메타 정보 */}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {change.userEmail}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(change.timestamp), 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 