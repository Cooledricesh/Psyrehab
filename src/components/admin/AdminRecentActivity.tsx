import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  User, 
  UserPlus, 
  UserX, 
  Settings, 
  FileText, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'session_created' | 'system_config' | 'backup_created' | 'login_failed' | 'data_export';
  title: string;
  description: string;
  user: {
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export const AdminRecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 모의 활동 데이터 생성
  const generateMockActivities = (): Activity[] => {
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'user_created',
        title: '새 사용자 등록',
        description: '김철수님이 치료사로 등록되었습니다.',
        user: { name: '관리자' },
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        severity: 'low',
        metadata: { role: 'therapist' }
      },
      {
        id: '2',
        type: 'session_created',
        title: '새 세션 생성',
        description: '환자 이영희님의 재활 세션이 시작되었습니다.',
        user: { name: '박지영' },
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        severity: 'low',
        metadata: { patientName: '이영희' }
      },
      {
        id: '3',
        type: 'system_config',
        title: '시스템 설정 변경',
        description: '알림 설정이 업데이트되었습니다.',
        user: { name: '관리자' },
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        severity: 'medium',
      },
      {
        id: '4',
        type: 'backup_created',
        title: '자동 백업 완료',
        description: '일일 데이터 백업이 성공적으로 완료되었습니다.',
        user: { name: '시스템' },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        severity: 'low',
        metadata: { size: '1.2GB' }
      },
      {
        id: '5',
        type: 'login_failed',
        title: '로그인 실패',
        description: '계정에 5회 연속 로그인 실패가 감지되었습니다.',
        user: { name: '알 수 없음' },
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        severity: 'high',
        metadata: { ip: '192.168.1.100' }
      },
      {
        id: '6',
        type: 'data_export',
        title: '데이터 내보내기',
        description: '환자 보고서가 PDF로 내보내졌습니다.',
        user: { name: '김치료사' },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        severity: 'low',
        metadata: { format: 'PDF' }
      },
    ];

    return mockActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // 활동 타입에 따른 아이콘 반환
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'user_created':
        return UserPlus;
      case 'user_updated':
        return User;
      case 'user_deleted':
        return UserX;
      case 'session_created':
        return Calendar;
      case 'system_config':
        return Settings;
      case 'backup_created':
        return CheckCircle;
      case 'login_failed':
        return XCircle;
      case 'data_export':
        return FileText;
      default:
        return Clock;
    }
  };

  // 심각도에 따른 색상 반환
  const getSeverityColor = (severity: Activity['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  // 데이터 로드
  const loadActivities = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // 실제 환경에서는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = generateMockActivities();
      setActivities(mockData);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 새로고침
  const handleRefresh = () => {
    loadActivities(true);
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadActivities();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">최근 활동</h3>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">최근 활동</h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, activityIdx) => {
              const Icon = getActivityIcon(activity.type);
              const colorClasses = getSeverityColor(activity.severity);

              return (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== activities.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${colorClasses}`}>
                          <Icon className="w-4 h-4" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{activity.title}</span>
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {activity.description}
                          </p>
                          <div className="mt-2 flex items-center space-x-2 text-xs text-gray-400">
                            <span>작업자: {activity.user.name}</span>
                            {activity.metadata && (
                              <span>•</span>
                            )}
                            {activity.metadata && activity.metadata.role && (
                              <span>역할: {activity.metadata.role}</span>
                            )}
                            {activity.metadata && activity.metadata.size && (
                              <span>크기: {activity.metadata.size}</span>
                            )}
                            {activity.metadata && activity.metadata.ip && (
                              <span>IP: {activity.metadata.ip}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={activity.timestamp.toISOString()}>
                            {formatDistanceToNow(activity.timestamp, { 
                              addSuffix: true, 
                              locale: ko 
                            })}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {activities.length === 0 && (
          <div className="text-center py-6">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">활동 없음</h3>
            <p className="mt-1 text-sm text-gray-500">
              최근 시스템 활동이 없습니다.
            </p>
          </div>
        )}

        <div className="mt-6">
          <a
            href="/admin/logs"
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            전체 활동 로그 보기
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminRecentActivity; 