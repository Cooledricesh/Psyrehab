import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

export type UserRole = 'administrator' | 'social_worker' | 'patient' | 'super_admin' | 'admin' | 'therapist' | 'manager' | 'user' | 'guest' | 'staff' | 'assistant_manager' | 'section_chief' | 'manager_level' | 'department_head' | 'vice_director' | 'director' | 'attending_physician'

export interface UserProfile {
  user_id: string
  role: UserRole
  full_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SocialWorkerProfile extends UserProfile {
  role: 'social_worker'
  employee_id?: string
  department?: string
  contact_number?: string
}

export interface AdministratorProfile extends UserProfile {
  role: 'administrator'
  admin_level?: number
}

export interface PatientProfile extends UserProfile {
  role: 'patient'
  id: string
  patient_identifier: string
  date_of_birth?: string
  gender?: string
  contact_info?: unknown
  admission_date?: string
  primary_social_worker_id?: string
  status: string
  additional_info?: unknown
}

export type AnyUserProfile = SocialWorkerProfile | AdministratorProfile | PatientProfile

export interface AuthState {
  user: SupabaseUser | null
  session: Session | null
  profile: AnyUserProfile | null
  loading: boolean
  initialized: boolean
  isAuthenticated: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, userData: unknown) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<AnyUserProfile>) => Promise<{ success: boolean; error?: string; profile?: AnyUserProfile }>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  hasPermission: (permission: string) => boolean
  isRole: (role: UserRole) => boolean
  refresh: () => Promise<void>
}

export type Permission = 
  | 'manage_users'
  | 'manage_social_workers'
  | 'manage_patients'
  | 'view_all_data'
  | 'manage_system_settings'
  | 'view_analytics'
  | 'manage_goals'
  | 'manage_assessments'
  | 'manage_services'
  | 'manage_assigned_patients'
  | 'create_goals'
  | 'update_goals'
  | 'view_patient_data'
  | 'create_assessments'
  | 'view_own_analytics'
  | 'view_own_data'
  | 'update_own_profile'
  | 'view_own_goals'
  | 'submit_check_ins'
  | 'user:create'
  | 'user:read'
  | 'user:update'
  | 'user:delete'
  | 'patient:create'
  | 'patient:read'
  | 'patient:update'
  | 'patient:delete'
  | 'session:create'
  | 'session:read'
  | 'session:update'
  | 'session:delete'
  | 'system:config:read'
  | 'system:config:update'
  | 'system:logs:read'
  | 'system:backup:create'
  | 'system:backup:restore'
  | 'announcement:create'
  | 'announcement:read'
  | 'announcement:update'
  | 'announcement:delete'
  | 'assessment:create'
  | 'assessment:read'
  | 'assessment:update'
  | 'assessment:delete'
  | 'report:read'
  | 'report:export'

const ALL_PERMISSIONS: Permission[] = [
  'manage_users',
  'manage_social_workers',
  'manage_patients',
  'view_all_data',
  'manage_system_settings',
  'view_analytics',
  'manage_goals',
  'manage_assessments',
  'manage_services',
  'manage_assigned_patients',
  'create_goals',
  'update_goals',
  'view_patient_data',
  'create_assessments',
  'view_own_analytics',
  'view_own_data',
  'update_own_profile',
  'view_own_goals',
  'submit_check_ins',
  'user:create',
  'user:read',
  'user:update',
  'user:delete',
  'patient:create',
  'patient:read',
  'patient:update',
  'patient:delete',
  'session:create',
  'session:read',
  'session:update',
  'session:delete',
  'system:config:read',
  'system:config:update',
  'system:logs:read',
  'system:backup:create',
  'system:backup:restore',
  'announcement:create',
  'announcement:read',
  'announcement:update',
  'announcement:delete',
  'assessment:create',
  'assessment:read',
  'assessment:update',
  'assessment:delete',
  'report:read',
  'report:export'
]

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  admin: [
    'user:create',
    'user:read',
    'user:update',
    'patient:create',
    'patient:read',
    'patient:update',
    'patient:delete',
    'session:create',
    'session:read',
    'session:update',
    'session:delete',
    'system:config:read',
    'system:logs:read',
    'announcement:create',
    'announcement:read',
    'announcement:update',
    'announcement:delete',
    'assessment:create',
    'assessment:read',
    'assessment:update',
    'assessment:delete',
    'report:read',
    'report:export',
  ],
  therapist: [
    'patient:read',
    'patient:update',
    'session:create',
    'session:read',
    'session:update',
    'assessment:create',
    'assessment:read',
    'assessment:update',
    'announcement:read',
    'report:read',
  ],
  manager: [
    'user:read',
    'patient:read',
    'session:read',
    'announcement:read',
    'report:read',
    'report:export',
  ],
  user: [
    'patient:read',
    'session:read',
    'announcement:read',
  ],
  guest: [
    'announcement:read',
  ],
  administrator: [
    'manage_users',
    'manage_social_workers',
    'manage_patients',
    'view_all_data',
    'manage_system_settings',
    'view_analytics',
    'manage_goals',
    'manage_assessments',
    'manage_services'
  ],
  social_worker: [
    'manage_assigned_patients',
    'create_goals',
    'update_goals',
    'view_patient_data',
    'create_assessments',
    'manage_services',
    'view_own_analytics'
  ],
  patient: [
    'view_own_data',
    'update_own_profile',
    'view_own_goals',
    'submit_check_ins'
  ],
  staff: [
    'view_patient_data',
    'patient:read',
    'session:read',
    'announcement:read',
    'assessment:read'
  ],
  assistant_manager: [
    'manage_assigned_patients',
    'create_goals',
    'update_goals',
    'view_patient_data',
    'create_assessments',
    'patient:read',
    'patient:update',
    'session:create',
    'session:read',
    'session:update',
    'assessment:create',
    'assessment:read',
    'assessment:update',
    'announcement:read'
  ],
  section_chief: [
    'manage_assigned_patients',
    'create_goals',
    'update_goals',
    'view_patient_data',
    'create_assessments',
    'manage_services',
    'view_own_analytics',
    'patient:read',
    'patient:update',
    'session:create',
    'session:read',
    'session:update',
    'assessment:create',
    'assessment:read',
    'assessment:update',
    'announcement:read',
    'report:read'
  ],
  manager_level: [
    'manage_assigned_patients',
    'create_goals',
    'update_goals',
    'view_patient_data',
    'create_assessments',
    'manage_services',
    'view_own_analytics',
    'manage_patients',
    'view_all_data',
    'view_analytics',
    'user:read',
    'patient:read',
    'patient:update',
    'session:create',
    'session:read',
    'session:update',
    'assessment:create',
    'assessment:read',
    'assessment:update',
    'announcement:read',
    'report:read',
    'report:export'
  ],
  department_head: [
    'manage_assigned_patients',
    'create_goals',
    'update_goals',
    'view_patient_data',
    'create_assessments',
    'manage_services',
    'view_own_analytics',
    'manage_patients',
    'view_all_data',
    'view_analytics',
    'user:read',
    'user:update',
    'patient:create',
    'patient:read',
    'patient:update',
    'patient:delete',
    'session:create',
    'session:read',
    'session:update',
    'session:delete',
    'assessment:create',
    'assessment:read',
    'assessment:update',
    'assessment:delete',
    'announcement:create',
    'announcement:read',
    'announcement:update',
    'report:read',
    'report:export'
  ],
  vice_director: [
    'manage_assigned_patients',
    'create_goals',
    'update_goals',
    'view_patient_data',
    'create_assessments',
    'manage_services',
    'view_own_analytics',
    'manage_patients',
    'view_all_data',
    'view_analytics',
    'user:create',
    'user:read',
    'user:update',
    'patient:create',
    'patient:read',
    'patient:update',
    'patient:delete',
    'session:create',
    'session:read',
    'session:update',
    'session:delete',
    'system:config:read',
    'announcement:create',
    'announcement:read',
    'announcement:update',
    'announcement:delete',
    'assessment:create',
    'assessment:read',
    'assessment:update',
    'assessment:delete',
    'report:read',
    'report:export'
  ],
  director: ALL_PERMISSIONS,
  attending_physician: [
    'view_patient_data',
    'patient:read',
    'session:read',
    'assessment:read',
    'announcement:read'
  ]
}

export interface SignInForm {
  email: string
  password: string
}

export interface SignUpForm {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  role: UserRole
  employee_id?: string
  department?: string
  contact_number?: string
  admin_level?: number
  patient_identifier?: string
  date_of_birth?: string
  gender?: string
}

export interface ResetPasswordForm {
  email: string
}

export interface UpdatePasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface AuthError {
  message: string
  status?: number
  details?: unknown
}

export type AuthEvent = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'

export interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole | UserRole[]
  requiredPermission?: Permission | Permission[]
  fallback?: React.ReactNode
  redirectTo?: string
}

export interface UseAuthReturn extends AuthContextType {}

export interface UsePermissionsReturn {
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  isRole: (role: UserRole) => boolean
  isAnyRole: (roles: UserRole[]) => boolean
}

export type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: SupabaseUser | null }
  | { type: 'SET_SESSION'; payload: Session | null }
  | { type: 'SET_PROFILE'; payload: AnyUserProfile | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'RESET' }

export const isAdministrator = (profile: AnyUserProfile | null): profile is AdministratorProfile => {
  return profile?.role === 'administrator'
}

export const isSocialWorker = (profile: AnyUserProfile | null): profile is SocialWorkerProfile => {
  return profile?.role === 'social_worker'
}

export const isPatient = (profile: AnyUserProfile | null): profile is PatientProfile => {
  return profile?.role === 'patient'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  emailVerified: boolean;
  phone?: string;
  department?: string;
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  department?: string;
  phone?: string;
}

export interface PasswordResetData {
  email: string;
  token: string;
  password: string;
}

// 역할 한글명 매핑
export const ROLE_NAMES: Record<UserRole, string> = {
  super_admin: '최고 관리자',
  admin: '관리자',
  administrator: '관리자',
  social_worker: '사회복지사',
  patient: '환자',
  therapist: '치료사',
  manager: '매니저',
  user: '일반 사용자',
  guest: '게스트',
  staff: '사원',
  assistant_manager: '주임',
  section_chief: '계장',
  manager_level: '과장',
  department_head: '부장',
  vice_director: '부원장',
  director: '원장',
  attending_physician: '주치의'
};

// 관리자 역할 체크
export const isAdminRole = (role: UserRole): boolean => {
  return ['super_admin', 'admin', 'administrator', 'director', 'vice_director'].includes(role);
};

// 권한 체크 함수
export const hasPermission = (userPermissions: Permission[], requiredPermission: Permission): boolean => {
  return userPermissions.includes(requiredPermission);
};

// 다중 권한 체크 함수
export const hasAnyPermission = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

// 모든 권한 체크 함수
export const hasAllPermissions = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};

 