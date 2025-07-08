import { useState, useRef, useEffect } from 'react'
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
  Megaphone,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ROLE_NAMES } from '@/types/auth'
import type { UserRole } from '@/types/auth'
import { handleApiError } from '@/utils/error-handler'

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
  const [isAdmin, setIsAdmin] = useState(false)
  const [canViewManagement, setCanViewManagement] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<{ name: string; role: string }>({ name: '사용자', role: '' })
  const [userRole, setUserRole] = useState<string | null>(null)
  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log('Current user:', user.email)

      // 사용자 역할 확인
      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (
            role_name
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle()

      if (userRoleData) {
        const roleName = (userRoleData as any).roles?.role_name
        console.log('User role:', roleName)
        
        // 역할 저장
        setUserRole(roleName)
        
        // 관리자인지 확인
        setIsAdmin(roleName === 'administrator')
        
        // 계장 이상 직급인지 확인 (관리 메뉴 접근 권한)
        const managementRoles = ['section_chief', 'manager_level', 'department_head', 'vice_director', 'director', 'administrator']
        setCanViewManagement(managementRoles.includes(roleName))
      }

      // 프로필 정보 가져오기
      if (userRoleData) {
        const roleName = (userRoleData as any).roles?.role_name
        
        // 관리자 테이블에서 정보 찾기
        const { data: adminInfo } = await supabase
          .from('administrators')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (adminInfo) {
          const displayRole = ROLE_NAMES[roleName as UserRole] || roleName || '관리자'
          setUserInfo({ name: adminInfo.full_name, role: displayRole })
        } else {
          // 직급별 역할들은 administrators 테이블에서 찾기
          const jobTitleRoles = ['staff', 'assistant_manager', 'section_chief', 'manager_level', 'department_head', 'vice_director', 'director', 'attending_physician']
          
          if (jobTitleRoles.includes(roleName)) {
            // 직급 역할도 administrators 테이블 사용
            const { data: staffInfo } = await supabase
              .from('administrators')
              .select('full_name')
              .eq('user_id', user.id)
              .maybeSingle()
            
            if (staffInfo) {
              const displayRole = ROLE_NAMES[roleName as UserRole] || roleName || '직원'
              setUserInfo({ name: staffInfo.full_name, role: displayRole })
            }
          }
        }
      }
    } catch (error) {
      handleApiError(error, 'Sidebar.checkUserRole')
    }
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
        className={`fixed inset-y-0 left-0 bg-white shadow-lg w-64 transform lg:translate-x-0 transition-transform z-30 flex flex-col h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        role="navigation"
        aria-label="주요 내비게이션"
      >
        <div className="h-full flex flex-col overflow-hidden">
          <header className="p-4 border-b border-gray-200 flex-shrink-0">
            <Link to="/">
              <h1 className="text-xl font-bold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors">
                PsyRehab
              </h1>
            </Link>
            <p className="text-sm text-gray-600">정신건강 전문가 포털</p>
          </header>

          <nav className="overflow-y-auto flex-1 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <ul className="space-y-1">
              {/* 관리자 대시보드 - 관리자만 표시 */}
              {isAdmin && (
                <>
                  <SidebarLink
                    to="/admin/dashboard"
                    icon={<Activity size={18} />}
                    label="관리자 대시보드"
                    isActive={location.pathname === '/admin/dashboard'}
                  />
                  <li className="my-2 h-px bg-gray-200 mx-4"></li>
                </>
              )}
              
              {/* 일반 대시보드 - 모든 사용자에게 표시 */}
              <SidebarLink
                to="/dashboard"
                icon={<Home size={18} />}
                label="대시보드"
                isActive={location.pathname === '/dashboard'}
              />
              
              <SidebarLink
                to="/patient-management"
                icon={<Users size={18} />}
                label="마루 회원 관리"
                isActive={location.pathname === '/patient-management'}
              />
              <SidebarLink
                to="/goal-setting"
                icon={<Target size={18} />}
                label="목표 설정"
                isActive={location.pathname === '/goal-setting'}
              />
              <SidebarLink
                to="/progress-tracking"
                icon={<TrendingUp size={18} />}
                label="진행 추적"
                isActive={location.pathname === '/progress-tracking'}
              />
              
              {/* 계장 이상 직급 관리 메뉴 */}
              {canViewManagement && (
                <>
                  <li className="my-2 h-px bg-gray-200 mx-4"></li>
                  <SidebarLink
                    to="/admin/patient-assignment"
                    icon={<UserCheck size={18} />}
                    label="환자 배정 관리"
                    isActive={location.pathname === '/admin/patient-assignment'}
                  />
                  <SidebarLink
                    to="/admin/announcements"
                    icon={<Megaphone size={18} />}
                    label="공지사항 관리"
                    isActive={location.pathname === '/admin/announcements'}
                  />
                </>
              )}
              
              {/* 관리자 전용 메뉴 */}
              {isAdmin && (
                <>
                  <li className="my-2 h-px bg-gray-200 mx-4"></li>
                  <li>
                    <button
                      onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                      className="w-full flex items-center justify-between px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <Shield size={18} className="mr-3" />
                        <span>시스템 관리</span>
                      </div>
                      <ChevronDown 
                        size={16} 
                        className={`transform transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </li>
                  {adminMenuOpen && (
                    <ul className="bg-gray-50 py-1">
                      <SidebarLink
                        to="/admin/users"
                        icon={<UserCog size={16} />}
                        label="사용자 관리"
                        isActive={location.pathname === '/admin/users'}
                      />
                      <SidebarLink
                        to="/admin/logs"
                        icon={<FileText size={16} />}
                        label="시스템 로그"
                        isActive={location.pathname === '/admin/logs'}
                      />
                      <SidebarLink
                        to="/admin/backup-restore"
                        icon={<Database size={16} />}
                        label="백업/복원"
                        isActive={location.pathname === '/admin/backup-restore'}
                      />
                      <SidebarLink
                        to="/admin/ai-archive"
                        icon={<Database size={16} />}
                        label="AI 추천 아카이빙"
                        isActive={location.pathname === '/admin/ai-archive'}
                      />
                      <SidebarLink
                        to="/admin/permissions"
                        icon={<Shield size={16} />}
                        label="권한 설정"
                        isActive={location.pathname === '/admin/permissions'}
                      />
                      <SidebarLink
                        to="/reports"
                        icon={<FileText size={16} />}
                        label="보고서(미구현)"
                        isActive={location.pathname === '/reports'}
                      />
                      <SidebarLink
                        to="/settings"
                        icon={<Settings size={16} />}
                        label="설정(미구현)"
                        isActive={location.pathname === '/settings'}
                      />
                    </ul>
                  )}
                </>
              )}
            </ul>
          </nav>

          <footer className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="text-center">
              <p className="font-medium text-sm">{userInfo.name}</p>
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