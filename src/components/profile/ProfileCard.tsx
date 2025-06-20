import React from 'react'
import { useUserProfile } from '@/hooks/useAuthState'
import { usePermissions } from '@/hooks/usePermissions'
import type { AnyUserProfile, SocialWorkerProfile, PatientProfile, AdministratorProfile } from '@/types/auth'

interface ProfileCardProps {
  profile?: AnyUserProfile
  size?: 'sm' | 'md' | 'lg'
  showRole?: boolean
  showStatus?: boolean
  showActions?: boolean
  onEdit?: () => void
  onView?: () => void
  className?: string
}

/**
 * Compact profile card component
 */
export function ProfileCard({
  profile: externalProfile,
  size = 'md',
  showRole = true,
  showStatus = true,
  showActions = false,
  onEdit,
  onView,
  className = ''
}: ProfileCardProps) {
  const { profile: userProfile, displayName, initials, roleDisplayName } = useUserProfile()
  const { hasPermission } = usePermissions()

  const profile = externalProfile || userProfile

  if (!profile) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
          <p className="text-sm">프로필 없음</p>
        </div>
      </div>
    )
  }

  const sizeClasses = {
    sm: {
      card: 'p-3',
      avatar: 'w-8 h-8 text-sm',
      title: 'text-sm',
      subtitle: 'text-xs',
      spacing: 'space-y-1'
    },
    md: {
      card: 'p-4',
      avatar: 'w-12 h-12 text-base',
      title: 'text-base',
      subtitle: 'text-sm',
      spacing: 'space-y-2'
    },
    lg: {
      card: 'p-6',
      avatar: 'w-16 h-16 text-lg',
      title: 'text-lg',
      subtitle: 'text-base',
      spacing: 'space-y-3'
    }
  }

  const classes = sizeClasses[size]

  const canEdit = hasPermission('update_own_profile') && (!externalProfile || profile.user_id === userProfile?.user_id)

  return (
    <div className={`bg-white rounded-lg shadow border ${classes.card} ${className}`}>
      <div className={`flex items-start ${classes.spacing}`}>
        {/* Avatar */}
        <div className={`${classes.avatar} bg-blue-500 text-white rounded-full flex items-center justify-center font-medium flex-shrink-0`}>
          {externalProfile ? 
            (externalProfile.full_name || 'U').charAt(0).toUpperCase() : 
            initials
          }
        </div>

        {/* Profile Info */}
        <div className="flex-1 ml-3 min-w-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className={`font-medium text-gray-900 truncate ${classes.title}`}>
                {externalProfile ? (externalProfile.full_name || '이름 없음') : displayName}
              </h3>
              
              {showRole && (
                <p className={`text-gray-600 truncate ${classes.subtitle}`}>
                  {externalProfile ? getRoleDisplayName(externalProfile.role) : roleDisplayName}
                </p>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex space-x-1 ml-2">
                {onView && (
                  <button
                    onClick={onView}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                )}
                
                {canEdit && onEdit && (
                  <button
                    onClick={onEdit}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Status */}
          {showStatus && (
            <div className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                profile.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {profile.is_active ? '활성' : '비활성'}
              </span>
            </div>
          )}

          {/* Role-specific info */}
          {size === 'lg' && renderRoleSpecificInfo(profile)}
        </div>
      </div>
    </div>
  )
}

/**
 * Profile avatar component
 */
interface ProfileAvatarProps {
  profile?: AnyUserProfile
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showOnlineStatus?: boolean
  className?: string
  onClick?: () => void
}

export function ProfileAvatar({
  profile: externalProfile,
  size = 'md',
  showOnlineStatus = false,
  className = '',
  onClick
}: ProfileAvatarProps) {
  const { profile: userProfile, initials } = useUserProfile()
  
  const profile = externalProfile || userProfile

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  }

  const displayInitials = profile 
    ? (profile.full_name || 'U').charAt(0).toUpperCase()
    : initials

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          bg-blue-500 text-white rounded-full 
          flex items-center justify-center font-medium
          ${onClick ? 'cursor-pointer hover:bg-blue-600' : ''}
        `}
        onClick={onClick}
      >
        {displayInitials}
      </div>
      
      {showOnlineStatus && (
        <div className="absolute -bottom-0 -right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
      )}
    </div>
  )
}

/**
 * Profile summary component
 */
interface ProfileSummaryProps {
  profile?: AnyUserProfile
  showDetails?: boolean
  className?: string
}

export function ProfileSummary({
  profile: externalProfile,
  showDetails = true,
  className = ''
}: ProfileSummaryProps) {
  const { profile: userProfile, displayName, roleDisplayName } = useUserProfile()
  
  const profile = externalProfile || userProfile

  if (!profile) {
    return (
      <div className={`text-center text-gray-500 ${className}`}>
        <p>프로필 정보 없음</p>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="text-center">
        <ProfileAvatar profile={profile} size="xl" className="mx-auto mb-4" />
        
        <h2 className="text-xl font-semibold text-gray-900">
          {externalProfile ? (externalProfile.full_name || '이름 없음') : displayName}
        </h2>
        
        <p className="text-gray-600 mt-1">
          {externalProfile ? getRoleDisplayName(externalProfile.role) : roleDisplayName}
        </p>

        {showDetails && (
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-center">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                profile.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {profile.is_active ? '활성' : '비활성'}
              </span>
            </div>
            
            <p>가입일: {new Date(profile.created_at).toLocaleDateString('ko-KR')}</p>
            
            {renderRoleSpecificSummary(profile)}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Profile list item component
 */
interface ProfileListItemProps {
  profile: AnyUserProfile
  onSelect?: (profile: AnyUserProfile) => void
  onEdit?: (profile: AnyUserProfile) => void
  onView?: (profile: AnyUserProfile) => void
  selected?: boolean
  className?: string
}

export function ProfileListItem({
  profile,
  onSelect,
  onEdit,
  onView,
  selected = false,
  className = ''
}: ProfileListItemProps) {
  const { hasPermission } = usePermissions()

  const canEdit = hasPermission('manage_users') || hasPermission('update_own_profile')

  return (
    <div 
      className={`
        flex items-center p-4 border-b border-gray-200 hover:bg-gray-50
        ${selected ? 'bg-blue-50 border-blue-200' : ''}
        ${onSelect ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={() => onSelect?.(profile)}
    >
      <ProfileAvatar profile={profile} size="md" />
      
      <div className="ml-4 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile.full_name || '이름 없음'}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {getRoleDisplayName(profile.role)}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              profile.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {profile.is_active ? '활성' : '비활성'}
            </span>
            
            <div className="flex space-x-1">
              {onView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onView(profile)
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              
              {canEdit && onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(profile)
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'administrator':
      return '관리자'
    case 'social_worker':
      return '사회복지사'
    case 'patient':
      return '환자'
    default:
      return '알 수 없는 역할'
  }
}

function renderRoleSpecificInfo(profile: AnyUserProfile): React.ReactNode {
  switch (profile.role) {
    case 'social_worker': {
      const swProfile = profile as SocialWorkerProfile
      return (
        <div className="mt-2 text-xs text-gray-600">
          {swProfile.employee_id && <p>직원번호: {swProfile.employee_id}</p>}
          {swProfile.department && <p>부서: {swProfile.department}</p>}
        </div>
      )
    }

    case 'patient': {
      const patientProfile = profile as PatientProfile
      return (
        <div className="mt-2 text-xs text-gray-600">
          {patientProfile.patient_identifier && (
            <p>환자번호: {patientProfile.patient_identifier}</p>
          )}
          {patientProfile.status && (
            <p>상태: {
              patientProfile.status === 'active' ? '활성' :
              patientProfile.status === 'inactive' ? '비활성' :
              patientProfile.status === 'discharged' ? '퇴원' : '기타'
            }</p>
          )}
        </div>
      )
    }

    case 'administrator': {
      const adminProfile = profile as AdministratorProfile
      return (
        <div className="mt-2 text-xs text-gray-600">
          <p>관리자 레벨: {adminProfile.admin_level || 0}</p>
        </div>
      )
    }

    default:
      return null
  }
}

function renderRoleSpecificSummary(profile: AnyUserProfile): React.ReactNode {
  switch (profile.role) {
    case 'social_worker': {
      const swProfile = profile as SocialWorkerProfile
      return (
        <div className="space-y-1">
          {swProfile.employee_id && <p>직원번호: {swProfile.employee_id}</p>}
          {swProfile.department && <p>부서: {swProfile.department}</p>}
          {swProfile.contact_number && <p>연락처: {swProfile.contact_number}</p>}
        </div>
      )
    }

    case 'patient': {
      const patientProfile = profile as PatientProfile
      return (
        <div className="space-y-1">
          {patientProfile.patient_identifier && (
            <p>환자번호: {patientProfile.patient_identifier}</p>
          )}
          {patientProfile.date_of_birth && (
            <p>생년월일: {new Date(patientProfile.date_of_birth).toLocaleDateString('ko-KR')}</p>
          )}
        </div>
      )
    }

    case 'administrator': {
      const adminProfile = profile as AdministratorProfile
      return (
        <div className="space-y-1">
          <p>관리자 레벨: {adminProfile.admin_level || 0}</p>
        </div>
      )
    }

    default:
      return null
  }
} 