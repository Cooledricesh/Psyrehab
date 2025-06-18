import { useState, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Users,
  Target,
  TrendingUp,
  FileText,
  Settings,
  Menu,
  X,
  Shield,
  ChevronDown,
  Activity,
  Database,
  UserCog,
  UserCheck,
} from 'lucide-react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'

interface SidebarLinkProps {
  to: string
  icon: React.ReactNode
  label: string
  isActive: boolean
}

const SidebarLink = ({ to, icon, label, isActive }: SidebarLinkProps) => {
  return (
    <li>
      <Link
        to={to}
        className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isActive 
            ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600 font-medium' 
            : ''
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className="mr-3 flex items-center">
          {icon}
        </span>
        <span>{label}</span>
      </Link>
    </li>
  )
}

export const Sidebar = () => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const auth = useUnifiedAuth()

  // Extract user info from unified auth
  const userInfo = {
    name: auth.profile?.full_name || '사용자',
    role: auth.role === 'admin' ? '관리자' : auth.role === 'social_worker' ? '사회복지사' : ''
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const handleOverlayClick = () => {
    if (isOpen) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}

      <aside 
        ref={sidebarRef}
        className={`fixed lg:relative inset-y-0 left-0 bg-white shadow-lg w-64 transform lg:translate-x-0 transition-transform z-30 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        role="navigation"
        aria-label="주요 내비게이션"
      >
        <div className="h-full flex flex-col">
          <header className="p-4 border-b border-gray-200">
            <Link to="/">
              <h1 className="text-xl font-bold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors">
                PsyRehab
              </h1>
            </Link>
            <p className="text-sm text-gray-600">정신건강 전문가 포털</p>
          </header>

          <nav className="overflow-y-auto flex-1 py-4">
            <ul className="space-y-1">
              <SidebarLink
                to="/dashboard"
                icon={<Home size={18} />}
                label="대시보드"
                isActive={location.pathname === '/dashboard'}
              />
              
              {/* Patient Management - visible to social workers and admins */}
              {auth.hasAnyPermission(['patient:read', 'patient:manage']) && (
                <SidebarLink
                  to="/patient-management"
                  icon={<Users size={18} />}
                  label="마루 회원 관리"
                  isActive={location.pathname === '/patient-management'}
                />
              )}
              
              {/* Goal Setting - visible to social workers and admins */}
              {auth.hasAnyPermission(['goal:create', 'goal:manage']) && (
                <SidebarLink
                  to="/goal-setting"
                  icon={<Target size={18} />}
                  label="목표 설정"
                  isActive={location.pathname === '/goal-setting'}
                />
              )}
              
              {/* Progress Tracking - visible to social workers and admins */}
              {auth.hasAnyPermission(['progress:read', 'progress:manage']) && (
                <SidebarLink
                  to="/progress-tracking"
                  icon={<TrendingUp size={18} />}
                  label="진행 추적"
                  isActive={location.pathname === '/progress-tracking'}
                />
              )}
              
              {/* Reports - visible to social workers and admins */}
              {auth.hasAnyPermission(['report:read', 'report:generate']) && (
                <SidebarLink
                  to="/reports"
                  icon={<FileText size={18} />}
                  label="보고서(미구현)"
                  isActive={location.pathname === '/reports'}
                />
              )}
              
              <li className="my-2 h-px bg-gray-200 mx-4"></li>
              <SidebarLink
                to="/settings"
                icon={<Settings size={18} />}
                label="설정"
                isActive={location.pathname === '/settings'}
              />
              
              {/* 관리자 메뉴 */}
              {auth.isAdmin && (
                <>
                  <li className="my-2 h-px bg-gray-200 mx-4"></li>
                  <li>
                    <button
                      onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                      className="w-full flex items-center justify-between px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <Shield size={18} className="mr-3" />
                        <span>관리자 메뉴</span>
                      </div>
                      <ChevronDown 
                        size={16} 
                        className={`transform transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </li>
                  {adminMenuOpen && (
                    <ul className="bg-gray-50 py-1">
                      {/* Admin Dashboard - all admins */}
                      {auth.hasPermission('admin:dashboard') && (
                        <SidebarLink
                          to="/admin/dashboard"
                          icon={<Activity size={16} />}
                          label="관리자 대시보드"
                          isActive={location.pathname === '/admin/dashboard'}
                        />
                      )}
                      
                      {/* User Management - requires user management permissions */}
                      {auth.hasPermission('admin:user_management') && (
                        <SidebarLink
                          to="/admin/users"
                          icon={<UserCog size={16} />}
                          label="사용자 관리"
                          isActive={location.pathname === '/admin/users'}
                        />
                      )}
                      
                      {/* Patient Assignment - requires patient management permissions */}
                      {auth.hasPermission('admin:patient_assignment') && (
                        <SidebarLink
                          to="/admin/patient-assignment"
                          icon={<UserCheck size={16} />}
                          label="환자 배정 관리"
                          isActive={location.pathname === '/admin/patient-assignment'}
                        />
                      )}
                      
                      {/* System Logs - requires system monitoring permissions */}
                      {auth.hasPermission('admin:system_logs') && (
                        <SidebarLink
                          to="/admin/logs"
                          icon={<FileText size={16} />}
                          label="시스템 로그"
                          isActive={location.pathname === '/admin/logs'}
                        />
                      )}
                      
                      {/* Backup/Restore - requires system management permissions */}
                      {auth.hasPermission('admin:system_management') && (
                        <SidebarLink
                          to="/admin/backup-restore"
                          icon={<Database size={16} />}
                          label="백업/복원"
                          isActive={location.pathname === '/admin/backup-restore'}
                        />
                      )}
                    </ul>
                  )}
                </>
              )}
            </ul>
          </nav>

          <footer className="p-4 border-t border-gray-200">
            <div className="text-center">
              <p className="font-medium text-sm">{userInfo.name}님</p>
              <p className="text-xs text-gray-600">{userInfo.role}</p>
            </div>
          </footer>
        </div>
      </aside>

      {/* Mobile menu toggle button */}
      <button
        className="fixed bottom-4 right-4 lg:hidden z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        onClick={toggleSidebar}
        aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </>
  )
} 