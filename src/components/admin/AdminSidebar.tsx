import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Permission } from '@/types/auth';
import {
  Home,
  Users,
  UserCog,
  Settings,
  FileText,
  BarChart3,
  Shield,
  Database,
  Bell,
  LogOut,
  Calendar,
  ClipboardList,
  Heart,
  Activity,
  X
} from 'lucide-react';

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  permission?: Permission;
  badge?: string;
  children?: NavItem[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ open, onClose }) => {
  const { user, logout, checkPermission } = useAdminAuth();
  const location = useLocation();

  const navigation: NavItem[] = [
    {
      name: '대시보드',
      href: '/admin',
      icon: Home,
    },
    {
      name: '사용자 관리',
      href: '/admin/users',
      icon: Users,
      permission: 'user:read',
      children: [
        {
          name: '사용자 목록',
          href: '/admin/users',
          icon: Users,
          permission: 'user:read',
        },
        {
          name: '역할 관리',
          href: '/admin/users/roles',
          icon: UserCog,
          permission: 'user:create',
        },
      ],
    },
    {
      name: '환자 관리',
      href: '/admin/patients',
      icon: Heart,
      permission: 'patient:read',
      children: [
        {
          name: '환자 목록',
          href: '/admin/patients',
          icon: Heart,
          permission: 'patient:read',
        },
        {
          name: '평가 관리',
          href: '/admin/assessments',
          icon: ClipboardList,
          permission: 'assessment:read',
        },
      ],
    },
    {
      name: '세션 관리',
      href: '/admin/sessions',
      icon: Calendar,
      permission: 'session:read',
    },
    {
      name: '보고서',
      href: '/admin/reports',
      icon: BarChart3,
      permission: 'report:read',
      children: [
        {
          name: '통계 보고서',
          href: '/admin/reports/stats',
          icon: BarChart3,
          permission: 'report:read',
        },
        {
          name: '활동 보고서',
          href: '/admin/reports/activity',
          icon: Activity,
          permission: 'report:read',
        },
      ],
    },
    {
      name: '시스템',
      href: '/admin/system',
      icon: Settings,
      permission: 'system:config:read',
      children: [
        {
          name: '시스템 설정',
          href: '/admin/system/settings',
          icon: Settings,
          permission: 'system:config:update',
        },
        {
          name: '시스템 로그',
          href: '/admin/system/logs',
          icon: FileText,
          permission: 'system:logs:read',
        },
        {
          name: '백업 관리',
          href: '/admin/system/backup',
          icon: Database,
          permission: 'system:backup:create',
        },
        {
          name: '보안 설정',
          href: '/admin/system/security',
          icon: Shield,
          permission: 'system:config:update',
        },
      ],
    },
    {
      name: '공지사항',
      href: '/admin/announcements',
      icon: Bell,
      permission: 'announcement:read',
      badge: '2',
    },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/admin') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const hasChildActive = (children?: NavItem[]) => {
    if (!children) return false;
    return children.some(child => isActiveLink(child.href));
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasPermission = !item.permission || checkPermission(item.permission);
    
    if (!hasPermission) return null;

    const isActive = isActiveLink(item.href);
    const hasActiveChild = hasChildActive(item.children);
    const Icon = item.icon;

    return (
      <div key={item.href} className="space-y-1">
        <Link
          to={item.href}
          className={`
            group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
            ${level > 0 ? 'ml-4 pl-8' : ''}
            ${isActive || hasActiveChild
              ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }
          `}
          onClick={() => {
            if (window.innerWidth < 1024) {
              onClose();
            }
          }}
        >
          <Icon 
            className={`
              mr-3 flex-shrink-0 h-5 w-5 transition-colors
              ${isActive || hasActiveChild ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
            `} 
          />
          <span className="truncate">{item.name}</span>
          {item.badge && (
            <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-red-100 text-red-600">
              {item.badge}
            </span>
          )}
        </Link>
        
        {/* 하위 메뉴 */}
        {item.children && (isActive || hasActiveChild) && (
          <div className="space-y-1">
            {item.children.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      console.error("Error occurred");
    }
  };

  return (
    <>
      {/* 모바일 오버레이 */}
      {open && (
        <div 
          className="fixed inset-0 flex z-40 lg:hidden"
          onClick={onClose}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* 사이드바 */}
      <div className={`
        fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:static lg:inset-0
      `}>
        {/* 헤더 */}
        <div className="flex items-center justify-between flex-shrink-0 px-4 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">
                PsyRehab
              </h1>
              <p className="text-xs text-gray-500">관리자 패널</p>
            </div>
          </div>
          {/* 모바일 닫기 버튼 */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 사용자 정보 */}
        <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {user?.avatar ? (
                <img
                  className="w-8 h-8 rounded-full"
                  src={user.avatar}
                  alt={user.name}
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigation.map(item => renderNavItem(item))}
        </nav>

        {/* 하단 액션 */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar; 