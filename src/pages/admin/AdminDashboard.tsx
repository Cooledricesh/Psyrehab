import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminStats } from '@/components/admin/AdminStats';
import { AdminRecentActivity } from '@/components/admin/AdminRecentActivity';
import { AdminSystemStatus } from '@/components/admin/AdminSystemStatus';
import { AdminQuickActions } from '@/components/admin/AdminQuickActions';
import { Permission } from '@/types/auth';
import { 
  Users, 
  Activity, 
  Settings, 
  BarChart3, 
  Shield, 
  Database,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPatients: number;
  activeSessions: number;
  systemHealth: 'good' | 'warning' | 'error';
  storageUsed: number;
  storageTotal: number;
}

export const AdminDashboard: React.FC = () => {
  const { user, checkPermission } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPatients: 0,
    activeSessions: 0,
    systemHealth: 'good',
    storageUsed: 0,
    storageTotal: 100,
  });
  const [isLoading, setIsLoading] = useState(true);

  // 대시보드 데이터 로드
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // TODO: 실제 API 호출로 대체
        // 현재는 모의 데이터 사용
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalUsers: 156,
          activeUsers: 89,
          totalPatients: 342,
          activeSessions: 23,
          systemHealth: 'good',
          storageUsed: 67.5,
          storageTotal: 100,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const dashboardCards = [
    {
      title: '총 사용자',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'blue',
      change: '+12%',
      changeType: 'positive' as const,
      permission: 'user:read' as Permission,
    },
    {
      title: '활성 사용자',
      value: stats.activeUsers.toLocaleString(),
      icon: Activity,
      color: 'green',
      change: '+5.3%',
      changeType: 'positive' as const,
      permission: 'user:read' as Permission,
    },
    {
      title: '등록 환자',
      value: stats.totalPatients.toLocaleString(),
      icon: FileText,
      color: 'purple',
      change: '+8.1%',
      changeType: 'positive' as const,
      permission: 'patient:read' as Permission,
    },
    {
      title: '진행 중 세션',
      value: stats.activeSessions.toLocaleString(),
      icon: Clock,
      color: 'orange',
      change: '-2.4%',
      changeType: 'negative' as const,
      permission: 'session:read' as Permission,
    },
  ];

  const systemStatusItems = [
    {
      name: '데이터베이스',
      status: stats.systemHealth,
      lastCheck: '2분 전',
      icon: Database,
    },
    {
      name: '보안 시스템',
      status: 'good' as const,
      lastCheck: '5분 전',
      icon: Shield,
    },
    {
      name: '백업 시스템',
      status: 'good' as const,
      lastCheck: '1시간 전',
      icon: Settings,
    },
  ];

  const quickActions = [
    {
      title: '새 사용자 추가',
      description: '시스템에 새로운 사용자 계정을 생성합니다.',
      icon: Users,
      action: '/admin/users/new',
      permission: 'user:create' as Permission,
      color: 'blue',
    },
    {
      title: '시스템 설정',
      description: '시스템 전체 설정을 관리합니다.',
      icon: Settings,
      action: '/admin/settings',
      permission: 'system:config:update' as Permission,
      color: 'gray',
    },
    {
      title: '시스템 로그',
      description: '시스템 로그를 확인하고 분석합니다.',
      icon: BarChart3,
      action: '/admin/logs',
      permission: 'system:logs:read' as Permission,
      color: 'green',
    },
    {
      title: '백업 관리',
      description: '시스템 백업을 생성하고 관리합니다.',
      icon: Database,
      action: '/admin/backup',
      permission: 'system:backup:create' as Permission,
      color: 'purple',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* 메인 콘텐츠 */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* 헤더 */}
        <AdminHeader
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={user}
        />
        
        {/* 대시보드 콘텐츠 */}
        <main className="p-6">
          {/* 환영 메시지 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              안녕하세요, {user?.name}님!
            </h1>
            <p className="text-gray-600">
              PsyRehab 관리 시스템에 오신 것을 환영합니다. 오늘의 시스템 현황을 확인해보세요.
            </p>
          </div>

          {/* 통계 카드 */}
          <AdminStats
            cards={dashboardCards}
            isLoading={isLoading}
          />

          {/* 메인 콘텐츠 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* 최근 활동 */}
            <div className="lg:col-span-2">
              <AdminRecentActivity />
            </div>
            
            {/* 시스템 상태 */}
            <div className="space-y-6">
              <AdminSystemStatus 
                items={systemStatusItems}
                storageUsed={stats.storageUsed}
                storageTotal={stats.storageTotal}
              />
            </div>
          </div>

          {/* 빠른 작업 */}
          <div className="mt-8">
            <AdminQuickActions 
              actions={quickActions.filter(action => 
                checkPermission(action.permission)
              )}
            />
          </div>

          {/* 시스템 정보 */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              시스템 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">버전:</span> v1.0.0
              </div>
              <div>
                <span className="font-medium">마지막 업데이트:</span> 2024-01-15
              </div>
              <div>
                <span className="font-medium">서버 시간:</span> {new Date().toLocaleString('ko-KR')}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard; 