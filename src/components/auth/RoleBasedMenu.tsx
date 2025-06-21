import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useUserCapabilities } from '@/hooks/usePermissions'
import type { UserRole, Permission } from '@/types/auth'

interface MenuItem {
  id: string
  title: string
  href?: string
  icon?: React.ReactNode
  badge?: string | number
  roles?: UserRole[]
  permissions?: Permission[]
  requireAll?: boolean
  children?: MenuItem[]
  action?: () => void
  disabled?: boolean
  hidden?: boolean
}

interface RoleBasedMenuProps {
  items: MenuItem[]
  onItemClick?: (item: MenuItem) => void
  className?: string
  vertical?: boolean
  showBadges?: boolean
}

/**
 * Role-based menu component that filters items based on user permissions
 */
export function RoleBasedMenu({
  items,
  onItemClick,
  className = '',
  vertical = false,
  showBadges = true
}: RoleBasedMenuProps) {
  const { hasAnyPermission, hasAllPermissions, isAnyRole } = usePermissions()

  // Filter menu items based on user permissions
  const filterMenuItems = (menuItems: MenuItem[]): MenuItem[] => {
    return menuItems.filter(item => {
      // Skip hidden items
      if (item.hidden) return false

      // Check role permissions
      if (item.roles && item.roles.length > 0) {
        if (!isAnyRole(item.roles)) return false
      }

      // Check specific permissions
      if (item.permissions && item.permissions.length > 0) {
        const hasRequiredPermissions = item.requireAll
          ? hasAllPermissions(item.permissions)
          : hasAnyPermission(item.permissions)
        
        if (!hasRequiredPermissions) return false
      }

      // Recursively filter children
      if (item.children) {
        item.children = filterMenuItems(item.children)
      }

      return true
    })
  }

  const filteredItems = filterMenuItems(items)

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return

    if (item.action) {
      item.action()
    } else if (item.href) {
      window.location.href = item.href
    }

    onItemClick?.(item)
  }

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const indent = level * 20

    return (
      <div key={item.id} className="menu-item-container">
        <div
          className={`
            menu-item flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
            ${item.disabled 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }
            ${vertical ? 'mb-1' : 'mr-2'}
          `}
          style={{ paddingLeft: `${12 + indent}px` }}
          onClick={() => handleItemClick(item)}
        >
          <div className="flex items-center space-x-3">
            {item.icon && (
              <span className="flex-shrink-0 w-5 h-5">
                {item.icon}
              </span>
            )}
            <span className="font-medium">{item.title}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {showBadges && item.badge && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
            
            {hasChildren && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        </div>

        {hasChildren && (
          <div className="ml-4">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (filteredItems.length === 0) {
    return null
  }

  return (
    <nav className={`role-based-menu ${className}`}>
      <div className={`${vertical ? 'space-y-1' : 'flex flex-wrap'}`}>
        {filteredItems.map(item => renderMenuItem(item))}
      </div>
    </nav>
  )
}

/**
 * Predefined menu items for different sections
 */
export const adminMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: '대시보드',
    href: '/admin/dashboard',
    permissions: ['view_analytics'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2H3z" />
      </svg>
    )
  },
  {
    id: 'users',
    title: '사용자 관리',
    permissions: ['manage_users'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    children: [
      {
        id: 'social-workers',
        title: '사회복지사',
        href: '/admin/social-workers',
        permissions: ['manage_social_workers']
      },
      {
        id: 'patients',
        title: '환자',
        href: '/admin/patients',
        permissions: ['manage_patients']
      },
      {
        id: 'administrators',
        title: '관리자',
        href: '/admin/administrators',
        permissions: ['manage_users']
      }
    ]
  },
  {
    id: 'system',
    title: '시스템 설정',
    href: '/admin/settings',
    permissions: ['manage_system_settings'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
]

export const socialWorkerMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: '대시보드',
    href: '/social-worker/dashboard',
    permissions: ['view_own_analytics'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2H3z" />
      </svg>
    )
  },
  {
    id: 'patients',
    title: '담당 환자',
    href: '/social-worker/patients',
    permissions: ['manage_assigned_patients'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    id: 'goals',
    title: '목표 관리',
    permissions: ['create_goals', 'update_goals'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    children: [
      {
        id: 'create-goal',
        title: '목표 생성',
        href: '/social-worker/goals/create',
        permissions: ['create_goals']
      },
      {
        id: 'manage-goals',
        title: '목표 관리',
        href: '/social-worker/goals/manage',
        permissions: ['update_goals']
      }
    ]
  },
  {
    id: 'assessments',
    title: '평가',
    href: '/social-worker/assessments',
    permissions: ['create_assessments'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  }
]

export const patientMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: '내 대시보드',
    href: '/patient/dashboard',
    permissions: ['view_own_data'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2H3z" />
      </svg>
    )
  },
  {
    id: 'goals',
    title: '내 목표',
    href: '/patient/goals',
    permissions: ['view_own_goals'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    id: 'checkins',
    title: '체크인',
    href: '/patient/checkins',
    permissions: ['submit_check_ins'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    )
  },
  {
    id: 'profile',
    title: '내 정보',
    href: '/patient/profile',
    permissions: ['update_own_profile'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
]

/**
 * Dynamic menu that shows role-appropriate items
 */
export function DynamicRoleMenu(props: Omit<RoleBasedMenuProps, 'items'>) {
  const capabilities = useUserCapabilities()

  const getMenuItems = (): MenuItem[] => {
    if (capabilities.isAdmin) {
      return adminMenuItems
    } else if (capabilities.isStaff && !capabilities.isAdmin) {
      return socialWorkerMenuItems
    } else if (capabilities.isClient) {
      return patientMenuItems
    }
    return []
  }

  return <RoleBasedMenu {...props} items={getMenuItems()} />
}

/**
 * Quick action menu for common tasks
 */
export function QuickActionMenu() {
  const capabilities = useUserCapabilities()

  const getQuickActions = (): MenuItem[] => {
    const actions: MenuItem[] = []

    if (capabilities.canCreateGoals) {
      actions.push({
        id: 'quick-create-goal',
        title: '새 목표',
        href: '/goals/create',
        permissions: ['create_goals'],
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )
      })
    }

    if (capabilities.canCreateAssessments) {
      actions.push({
        id: 'quick-create-assessment',
        title: '새 평가',
        href: '/assessments/create',
        permissions: ['create_assessments'],
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )
      })
    }

    if (capabilities.canSubmitCheckIns) {
      actions.push({
        id: 'quick-checkin',
        title: '체크인',
        href: '/checkins/new',
        permissions: ['submit_check_ins'],
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
          </svg>
        )
      })
    }

    return actions
  }

  const quickActions = getQuickActions()

  if (quickActions.length === 0) {
    return null
  }

  return (
    <div className="quick-action-menu">
      <h3 className="text-sm font-medium text-gray-900 mb-2">빠른 작업</h3>
      <RoleBasedMenu 
        items={quickActions} 
        vertical 
        showBadges={false}
        className="space-y-1"
      />
    </div>
  )
} 