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
} from 'lucide-react'

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
  const sidebarRef = useRef<HTMLElement>(null)

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
            <h1 className="text-xl font-bold text-blue-600">
              PsyRehab
            </h1>
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
              <SidebarLink
                to="/patient-management"
                icon={<Users size={18} />}
                label="환자 관리"
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
              <SidebarLink
                to="/reports"
                icon={<FileText size={18} />}
                label="보고서"
                isActive={location.pathname === '/reports'}
              />
              <li className="my-2 h-px bg-gray-200 mx-4"></li>
              <SidebarLink
                to="/settings"
                icon={<Settings size={18} />}
                label="설정"
                isActive={location.pathname === '/settings'}
              />
            </ul>
          </nav>

          <footer className="p-4 border-t border-gray-200">
            <div className="text-center">
              <p className="font-medium text-sm">전문가님</p>
              <p className="text-xs text-gray-600">정신건강 전문가</p>
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