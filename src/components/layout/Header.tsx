import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, /* User, */ ChevronDown } from 'lucide-react'
import { supabase, getCurrentUser } from '@/lib/supabase'

export const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUser, setCurrentUser] = useState<unknown>(null)
  const navigate = useNavigate()
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          // 관리자 정보 확인
          const { data: adminInfo } = await supabase
            .from('administrators')
            .select('full_name')
            .eq('user_id', user.id)
            .maybeSingle()

          // 사회복지사 정보 확인
          const { data: swInfo } = await supabase
            .from('social_workers')
            .select('full_name')
            .eq('user_id', user.id)
            .maybeSingle()

          let displayName = '사용자'
          let role = '사용자'
          let initial = 'U'

          if (adminInfo) {
            displayName = adminInfo.full_name
            role = '관리자'
            initial = adminInfo.full_name.charAt(0)
          } else if (swInfo) {
            displayName = swInfo.full_name
            role = '사회복지사'
            initial = swInfo.full_name.charAt(0)
          } else {
            displayName = user.email?.split('@')[0] || '사용자'
            initial = user.email?.charAt(0).toUpperCase() || 'U'
          }

          setCurrentUser({
            id: user.id,
            email: user.email,
            name: displayName,
            role: role,
            initial: initial
          })
        }
      } catch {
        console.error("Error occurred")
      }
    }

    loadUserInfo()
  }, [])

  // 외부 클릭 및 Escape 키 감지하여 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false)
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isProfileOpen])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Error occurred")
      } else {
        navigate('/auth/login')
      }
    } catch {
      console.error("Error occurred")
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search 
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="환자 또는 ID 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm outline-none transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="알림"
        >
          <Bell size={20} />
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={(e) => {
              e.stopPropagation()
              setIsProfileOpen(!isProfileOpen)
            }}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {(currentUser as any)?.initial || 'U'}
            </div>
            <span className="text-gray-700 font-medium text-sm hidden md:block">
              {(currentUser as any)?.name || '로딩...'}님
            </span>
            <ChevronDown
              size={16}
              className={`text-gray-500 transition-transform duration-200 ${
                isProfileOpen ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>

          {isProfileOpen && (
            <div 
              className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-40 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                <a
                  href="#"
                  className="block px-4 py-2 text-gray-700 text-sm hover:bg-gray-100 transition-colors duration-200"
                  onClick={(e) => {
                    e.preventDefault()
                    setIsProfileOpen(false)
                  }}
                >
                  프로필
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-gray-700 text-sm hover:bg-gray-100 transition-colors duration-200"
                  onClick={(e) => {
                    e.preventDefault()
                    setIsProfileOpen(false)
                  }}
                >
                  설정
                </a>
                <div className="h-px bg-gray-200 my-1"></div>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setIsProfileOpen(false)
                    handleLogout()
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 text-sm hover:bg-gray-100 transition-colors duration-200"
                >
                  로그아웃
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 