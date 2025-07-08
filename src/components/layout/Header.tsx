import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, /* User, */ ChevronDown, X, Clock, AlertCircle } from 'lucide-react'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { announcementService } from '@/services/announcements'
import type { Announcement } from '@/types/announcement'
import { getPriorityColor, getTypeEmoji } from '@/types/announcement'

export const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUser, setCurrentUser] = useState<unknown>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false)
  const [expandedAnnouncementId, setExpandedAnnouncementId] = useState<string | null>(null)
  const navigate = useNavigate()
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const notificationDropdownRef = useRef<HTMLDivElement>(null)

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
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    try {
      const activeAnnouncements = await announcementService.getActiveAnnouncements()
      setAnnouncements(activeAnnouncements)
      
      // 모든 공지사항도 로드 (showAllAnnouncements가 true일 때 사용)
      const allAnnouncementsData = await announcementService.getAnnouncements()
      setAllAnnouncements(allAnnouncementsData)
      
      // 읽지 않은 공지 개수 계산 (로컬스토리지 활용)
      const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]')
      const unread = activeAnnouncements.filter(a => !readAnnouncements.includes(a.id)).length
      setUnreadCount(unread)
    } catch (error) {
      console.error('공지사항 로드 오류:', error)
    }
  }

  const markAsRead = (announcementId: string) => {
    const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]')
    if (!readAnnouncements.includes(announcementId)) {
      readAnnouncements.push(announcementId)
      localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncements))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  // 외부 클릭 및 Escape 키 감지하여 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false)
        setShowAllAnnouncements(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false)
        setIsNotificationOpen(false)
        setShowAllAnnouncements(false)
      }
    }

    if (isProfileOpen || isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isProfileOpen, isNotificationOpen])

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
        <div className="relative" ref={notificationDropdownRef}>
          <button
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="알림"
            onClick={(e) => {
              e.stopPropagation()
              setIsNotificationOpen(!isNotificationOpen)
              if (!isNotificationOpen && announcements.length > 0) {
                // 모든 공지를 읽음으로 표시
                const announcementIds = announcements.map(a => a.id)
                localStorage.setItem('readAnnouncements', JSON.stringify(announcementIds))
                setUnreadCount(0)
              }
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className={`absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-96 z-20 overflow-hidden transition-all duration-300 ${showAllAnnouncements ? 'max-h-[700px]' : 'max-h-[500px]'}`}>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {showAllAnnouncements ? '모든 공지사항' : '활성 공지사항'}
                </h3>
                <div className="flex items-center gap-2">
                  {showAllAnnouncements && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAllAnnouncements(false)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      활성 공지만 보기
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsNotificationOpen(false)
                      setShowAllAnnouncements(false)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className={`overflow-y-auto ${showAllAnnouncements ? 'max-h-[600px]' : 'max-h-[400px]'}`}>
                {(showAllAnnouncements ? allAnnouncements : announcements).length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>{showAllAnnouncements ? '등록된 공지사항이 없습니다.' : '현재 활성 공지사항이 없습니다.'}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {(showAllAnnouncements ? allAnnouncements : announcements).map((announcement) => {
                      const priorityColor = getPriorityColor(announcement.priority)
                      const isInactive = announcement.status !== 'active'
                      return (
                        <div
                          key={announcement.id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${isInactive ? 'opacity-60' : ''}`}
                          onClick={() => {
                            markAsRead(announcement.id)
                            setExpandedAnnouncementId(
                              expandedAnnouncementId === announcement.id ? null : announcement.id
                            )
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">
                              {getTypeEmoji(announcement.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {announcement.title}
                                </h4>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-${priorityColor}-100 text-${priorityColor}-700`}>
                                  {announcement.priority === 'high' || announcement.priority === 'critical' ? '중요' : announcement.priority === 'medium' ? '보통' : '낮음'}
                                </span>
                                {isInactive && (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                    {announcement.status === 'inactive' ? '비활성' : '보관됨'}
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm text-gray-600 ${
                                expandedAnnouncementId === announcement.id 
                                  ? 'whitespace-pre-wrap' 
                                  : 'line-clamp-2'
                              }`}>
                                {announcement.content}
                              </p>
                              {announcement.content.split('\n').length > 2 || announcement.content.length > 100 ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setExpandedAnnouncementId(
                                      expandedAnnouncementId === announcement.id ? null : announcement.id
                                    )
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                >
                                  {expandedAnnouncementId === announcement.id ? '접기' : '더보기'}
                                </button>
                              ) : null}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                                </span>
                                {announcement.createdByName && <span>작성자: {announcement.createdByName}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              {!showAllAnnouncements && (announcements.length > 0 || allAnnouncements.length > announcements.length) && (
                <div className="p-3 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllAnnouncements(true)
                    }}
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    모든 공지사항 보기 ({allAnnouncements.length}개)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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