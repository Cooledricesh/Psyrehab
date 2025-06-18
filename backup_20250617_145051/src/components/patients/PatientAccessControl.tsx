import { ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Lock, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/database'

interface PatientAccessControlProps {
  children: ReactNode
  requiredRole?: UserRole | UserRole[]
  requiredPermissions?: string[]
  patientId?: string
  fallback?: ReactNode
  showMessage?: boolean
}

// 권한 계층 정의 (높은 숫자가 더 높은 권한)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'super_admin': 100,
  'admin': 80,
  'social_worker': 60,
  'therapist': 40,
  'nurse': 30,
  'volunteer': 10,
  'patient': 5
}

// 역할별 기본 권한
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  'super_admin': ['*'], // 모든 권한
  'admin': [
    'patients.create',
    'patients.read',
    'patients.update',
    'patients.delete',
    'patients.assign_social_worker',
    'patients.change_status',
    'social_workers.read',
    'social_workers.assign'
  ],
  'social_worker': [
    'patients.create',
    'patients.read',
    'patients.update',
    'patients.assign_social_worker',
    'patients.change_status',
    'social_workers.read'
  ],
  'therapist': [
    'patients.read',
    'patients.update_medical',
    'assessments.create',
    'assessments.read',
    'assessments.update'
  ],
  'nurse': [
    'patients.read',
    'patients.update_medical',
    'patients.update_status'
  ],
  'volunteer': [
    'patients.read_basic'
  ],
  'patient': [
    'patients.read_own'
  ]
}

export function PatientAccessControl({
  children,
  requiredRole,
  requiredPermissions = [],
  patientId,
  fallback,
  showMessage = true
}: PatientAccessControlProps) {
  const { user, userProfile } = useAuth()

  // 로그인하지 않은 경우
  if (!user || !userProfile) {
    return showMessage ? (
      <Alert variant="destructive">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          이 기능을 사용하려면 로그인이 필요합니다.
        </AlertDescription>
      </Alert>
    ) : (fallback || null)
  }

  const userRole = userProfile.role as UserRole
  const userPermissions = ROLE_PERMISSIONS[userRole] || []

  // 역할 기반 접근 제어
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const hasRequiredRole = roles.some(role => {
      const userRoleLevel = ROLE_HIERARCHY[userRole] || 0
      const requiredRoleLevel = ROLE_HIERARCHY[role] || 0
      return userRoleLevel >= requiredRoleLevel
    })

    if (!hasRequiredRole) {
      return showMessage ? (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            이 기능에 접근할 권한이 없습니다. 필요한 권한: {roles.join(', ')}
          </AlertDescription>
        </Alert>
      ) : (fallback || null)
    }
  }

  // 권한 기반 접근 제어
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => {
      // super_admin은 모든 권한을 가짐
      if (userPermissions.includes('*')) {
        return true
      }
      
      // 특정 권한 확인
      return userPermissions.includes(permission)
    })

    if (!hasAllPermissions) {
      return showMessage ? (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            이 작업을 수행할 권한이 없습니다.
          </AlertDescription>
        </Alert>
      ) : (fallback || null)
    }
  }

  // 환자별 접근 제어 (환자는 자신의 정보만 볼 수 있음)
  if (patientId && userRole === 'patient') {
    if (userProfile.patient_id !== patientId) {
      return showMessage ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            다른 환자의 정보에는 접근할 수 없습니다.
          </AlertDescription>
        </Alert>
      ) : (fallback || null)
    }
  }

  // 모든 검사를 통과한 경우 자식 컴포넌트 렌더링
  return <>{children}</>
}

// 권한 확인 훅
export function usePatientPermissions() {
  const { userProfile } = useAuth()

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!userProfile) return false
    
    const userRole = userProfile.role as UserRole
    const roles = Array.isArray(role) ? role : [role]
    
    return roles.some(r => {
      const userRoleLevel = ROLE_HIERARCHY[userRole] || 0
      const requiredRoleLevel = ROLE_HIERARCHY[r] || 0
      return userRoleLevel >= requiredRoleLevel
    })
  }

  const hasPermission = (permission: string): boolean => {
    if (!userProfile) return false
    
    const userRole = userProfile.role as UserRole
    const userPermissions = ROLE_PERMISSIONS[userRole] || []
    
    return userPermissions.includes('*') || userPermissions.includes(permission)
  }

  const hasPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  const canAccessPatient = (patientId: string): boolean => {
    if (!userProfile) return false
    
    const userRole = userProfile.role as UserRole
    
    // 환자는 자신의 정보만 접근 가능
    if (userRole === 'patient') {
      return userProfile.patient_id === patientId
    }
    
    // 다른 역할은 patients.read 권한이 있으면 접근 가능
    return hasPermission('patients.read')
  }

  const canEditPatient = (patientId?: string): boolean => {
    if (!userProfile) return false
    
    const userRole = userProfile.role as UserRole
    
    // 환자는 편집 불가
    if (userRole === 'patient') {
      return false
    }
    
    return hasPermission('patients.update')
  }

  const canDeletePatient = (): boolean => {
    return hasPermission('patients.delete')
  }

  const canAssignSocialWorker = (): boolean => {
    return hasPermission('patients.assign_social_worker')
  }

  const canChangePatientStatus = (): boolean => {
    return hasPermission('patients.change_status')
  }

  const canCreatePatient = (): boolean => {
    return hasPermission('patients.create')
  }

  return {
    hasRole,
    hasPermission,
    hasPermissions,
    canAccessPatient,
    canEditPatient,
    canDeletePatient,
    canAssignSocialWorker,
    canChangePatientStatus,
    canCreatePatient,
    userRole: userProfile?.role as UserRole,
    userPermissions: ROLE_PERMISSIONS[userProfile?.role as UserRole] || []
  }
}

// 권한별 컴포넌트 래퍼들
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PatientAccessControl requiredRole={['super_admin', 'admin']} fallback={fallback}>
      {children}
    </PatientAccessControl>
  )
}

export function SocialWorkerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PatientAccessControl requiredRole={['super_admin', 'admin', 'social_worker']} fallback={fallback}>
      {children}
    </PatientAccessControl>
  )
}

export function MedicalStaffOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PatientAccessControl requiredRole={['super_admin', 'admin', 'social_worker', 'therapist', 'nurse']} fallback={fallback}>
      {children}
    </PatientAccessControl>
  )
}

export function PatientReadOnly({ children, patientId, fallback }: { children: ReactNode; patientId?: string; fallback?: ReactNode }) {
  return (
    <PatientAccessControl requiredPermissions={['patients.read']} patientId={patientId} fallback={fallback}>
      {children}
    </PatientAccessControl>
  )
}

export function PatientEditOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PatientAccessControl requiredPermissions={['patients.update']} fallback={fallback}>
      {children}
    </PatientAccessControl>
  )
} 