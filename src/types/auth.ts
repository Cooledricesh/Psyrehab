import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import type { Database } from './supabase'


// User roles
export type UserRole = 'administrator' | 'social_worker' | 'patient' | 'super_admin' | 'admin' | 'therapist' | 'manager' | 'user' | 'guest'

// User profile based on role
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

// Union type for all profiles
export type AnyUserProfile = SocialWorkerProfile | AdministratorProfile | PatientProfile

// Authentication state
export interface AuthState {
  user: SupabaseUser | null
  session: Session | null
  profile: AnyUserProfile | null
  loading: boolean
  initialized: boolean
  isAuthenticated: boolean
  error: string | null
}

// Authentication context
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

// Permission types
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

// All permissions array
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

// Role permissions mapping
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
  ]
}

// Authentication form types
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
  // Additional fields based on role
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

// Authentication error types
export interface AuthError {
  message: string
  status?: number
  details?: unknown
}

// Authentication events
export type AuthEvent = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'

// Protected route props
export interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole | UserRole[]
  requiredPermission?: Permission | Permission[]
  fallback?: React.ReactNode
  redirectTo?: string
}

// Hook return types
export interface UseAuthReturn extends AuthContextType {}

export interface UsePermissionsReturn {
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  isRole: (role: UserRole) => boolean
  isAnyRole: (roles: UserRole[]) => boolean
}

// Auth action types for reducers
export type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: SupabaseUser | null }
  | { type: 'SET_SESSION'; payload: Session | null }
  | { type: 'SET_PROFILE'; payload: AnyUserProfile | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'RESET' }

// Export utility type guards
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

// 관리자 역할 체크
export const isAdminRole = (role: UserRole): boolean => {
  return ['super_admin', 'admin'].includes(role);
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

 