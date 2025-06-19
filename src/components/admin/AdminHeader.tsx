import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '@/types/auth';
import { 
  Menu, 
  Bell, 
  Search, 
  Settings, 
  User as UserIcon, 
  LogOut,
  ChevronDown,
  Maximize,
  Minimize
} from 'lucide-react';

interface AdminHeaderProps {
  onMenuClick: () => void;
  user: User | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'error' | 'success';
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, user }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 모의 알림 데이터
  const notifications: Notification[] = [
    {
      id: '1',
      title: '새로운 사용자 등록',
      message: '김철수님이 시스템에 등록되었습니다.',
      time: '5분 전',
      read: false,
      type: 'info',
    },
    {
      id: '2',
      title: '시스템 경고',
      message: '데이터베이스 연결이 불안정합니다.',
      time: '1시간 전',
      read: false,
      type: 'warning',
    },
    {
      id: '3',
      title: '백업 완료',
      message: '일일 백업이 성공적으로 완료되었습니다.',
      time: '2시간 전',
      read: true,
      type: 'success',
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'success':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* 좌측: 메뉴 버튼 + 검색 */}
        <div className="flex items-center space-x-4">
          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={onMenuClick}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* 검색 */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색..."
                className="block w-96 pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 우측: 액션 버튼들 + 사용자 메뉴 */}
        <div className="flex items-center space-x-3">
          {/* 전체화면 토글 */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            title={isFullscreen ? "전체화면 종료" : "전체화면"}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>

          {/* 설정 */}
          <Link
            to="/admin/settings"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            title="설정"
          >
            <Settings className="w-5 h-5" />
          </Link>

          {/* 알림 */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md relative"
              title="알림"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* 알림 드롭다운 */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">알림</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      새로운 알림이 없습니다.
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start">
                          <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${getNotificationColor(notification.type).split(' ')[1]}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-gray-200">
                  <Link
                    to="/admin/notifications"
                    className="text-sm text-blue-600 hover:text-blue-500"
                    onClick={() => setShowNotifications(false)}
                  >
                    모든 알림 보기
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 사용자 메뉴 */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            >
              {user?.avatar ? (
                <img
                  className="w-6 h-6 rounded-full"
                  src={user.avatar}
                  alt={user.name}
                />
              ) : (
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-gray-900">
                {user?.name}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* 사용자 드롭다운 */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-blue-600 mt-1 capitalize">{user?.role}</p>
                </div>
                
                <div className="py-2">
                  <Link
                    to="/admin/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserIcon className="w-4 h-4 mr-3" />
                    프로필 설정
                  </Link>
                  <Link
                    to="/admin/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    계정 설정
                  </Link>
                </div>
                
                <div className="border-t border-gray-100 py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // 로그아웃 로직은 부모에서 처리
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 닫기 오버레이 */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
};

export default AdminHeader; 