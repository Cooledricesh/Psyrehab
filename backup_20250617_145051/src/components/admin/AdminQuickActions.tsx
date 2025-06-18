import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Permission } from '@/types/auth';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  action: string; // URL or action identifier
  permission: Permission;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
}

interface AdminQuickActionsProps {
  actions: QuickAction[];
}

export const AdminQuickActions: React.FC<AdminQuickActionsProps> = ({ actions }) => {
  const { checkPermission } = useAdminAuth();

  const getColorClasses = (color: QuickAction['color']) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50 hover:bg-blue-100',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          description: 'text-blue-700',
        };
      case 'green':
        return {
          bg: 'bg-green-50 hover:bg-green-100',
          border: 'border-green-200',
          icon: 'text-green-600',
          title: 'text-green-900',
          description: 'text-green-700',
        };
      case 'purple':
        return {
          bg: 'bg-purple-50 hover:bg-purple-100',
          border: 'border-purple-200',
          icon: 'text-purple-600',
          title: 'text-purple-900',
          description: 'text-purple-700',
        };
      case 'orange':
        return {
          bg: 'bg-orange-50 hover:bg-orange-100',
          border: 'border-orange-200',
          icon: 'text-orange-600',
          title: 'text-orange-900',
          description: 'text-orange-700',
        };
      case 'red':
        return {
          bg: 'bg-red-50 hover:bg-red-100',
          border: 'border-red-200',
          icon: 'text-red-600',
          title: 'text-red-900',
          description: 'text-red-700',
        };
      default:
        return {
          bg: 'bg-gray-50 hover:bg-gray-100',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          title: 'text-gray-900',
          description: 'text-gray-700',
        };
    }
  };

  // 권한이 있는 액션만 필터링
  const visibleActions = actions.filter(action => 
    checkPermission(action.permission)
  );

  if (visibleActions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">빠른 작업</h3>
        <div className="text-center py-6">
          <p className="text-gray-500">사용 가능한 빠른 작업이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">빠른 작업</h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleActions.map((action, index) => {
            const Icon = action.icon;
            const colorClasses = getColorClasses(action.color);

            return (
              <Link
                key={index}
                to={action.action}
                className={`
                  relative group block p-6 border rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-md
                  ${colorClasses.bg} ${colorClasses.border}
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${colorClasses.bg.replace('hover:', '')}`}>
                    <Icon className={`w-6 h-6 ${colorClasses.icon}`} />
                  </div>
                  <ArrowRight className={`w-4 h-4 ${colorClasses.icon} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
                </div>
                
                <div>
                  <h4 className={`text-sm font-semibold ${colorClasses.title} mb-2`}>
                    {action.title}
                  </h4>
                  <p className={`text-xs ${colorClasses.description} line-clamp-2`}>
                    {action.description}
                  </p>
                </div>

                {/* 호버 효과를 위한 오버레이 */}
                <div className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-200" />
              </Link>
            );
          })}
        </div>

        {/* 더 많은 작업 버튼 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/admin/users/new"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              새 사용자 추가
            </Link>
            <Link
              to="/admin/reports/generate"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              보고서 생성
            </Link>
            <Link
              to="/admin/system/maintenance"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              시스템 유지보수
            </Link>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            더 많은 관리 기능은 사이드바 메뉴에서 이용하실 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminQuickActions; 