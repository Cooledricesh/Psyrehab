import type { UserRole, Permission } from '@/types/auth'

export interface RouteConfig {
  path: string
  title: string
  component?: React.ComponentType<unknown>
  
  requireAuth?: boolean
  requireEmailVerification?: boolean
  allowedRoles?: UserRole[]
  deniedRoles?: UserRole[]
  requiredPermissions?: Permission[]
  requireAllPermissions?: boolean
  
  showInMenu?: boolean
  menuOrder?: number
  menuIcon?: React.ReactNode
  parentPath?: string
  
  description?: string
  keywords?: string[]
  isPublic?: boolean
  isDevelopmentOnly?: boolean
  
  redirectTo?: string
  redirectOnAuth?: string
  redirectOnDenied?: string
  
  layout?: 'default' | 'auth' | 'minimal' | 'fullscreen'
  hideHeader?: boolean
  hideFooter?: boolean
  hideSidebar?: boolean
}

export const ROUTE_PATHS = {
  HOME: '/',
  
  AUTH: {
    SIGNIN: '/auth/signin',
    SIGNUP: '/auth/signup',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    EMAIL_CONFIRMED: '/auth/email-confirmed',
  },
  
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    SOCIAL_WORKERS: '/admin/social-workers',
    PATIENTS: '/admin/patients',
    ADMINISTRATORS: '/admin/administrators',
    SETTINGS: '/admin/settings',
    ANALYTICS: '/admin/analytics',
    SYSTEM: '/admin/system',
  },
  
  SOCIAL_WORKER: {
    DASHBOARD: '/social-worker/dashboard',
    PATIENTS: '/social-worker/patients',
    PATIENT_DETAIL: '/social-worker/patients/:id',
    GOALS: '/social-worker/goals',
    GOAL_CREATE: '/social-worker/goals/create',
    GOAL_EDIT: '/social-worker/goals/:id/edit',
    ASSESSMENTS: '/social-worker/assessments',
    ASSESSMENT_CREATE: '/social-worker/assessments/create',
    ASSESSMENT_DETAIL: '/social-worker/assessments/:id',
    SERVICES: '/social-worker/services',
    ANALYTICS: '/social-worker/analytics',
    PROFILE: '/social-worker/profile',
  },
  
  PATIENT: {
    DASHBOARD: '/patient/dashboard',
    GOALS: '/patient/goals',
    GOAL_DETAIL: '/patient/goals/:id',
    CHECKINS: '/patient/checkins',
    CHECKIN_NEW: '/patient/checkins/new',
    CHECKIN_HISTORY: '/patient/checkins/history',
    PROFILE: '/patient/profile',
    PROGRESS: '/patient/progress',
  },
  
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  HELP: '/help',
  ABOUT: '/about',
  CONTACT: '/contact',
  
  NOT_FOUND: '/404',
  FORBIDDEN: '/403',
  SERVER_ERROR: '/500',
  MAINTENANCE: '/maintenance',
} as const

export const ROLE_ROUTES = {
  administrator: [
    ROUTE_PATHS.ADMIN.DASHBOARD,
    ROUTE_PATHS.ADMIN.USERS,
    ROUTE_PATHS.ADMIN.SOCIAL_WORKERS,
    ROUTE_PATHS.ADMIN.PATIENTS,
    ROUTE_PATHS.ADMIN.ADMINISTRATORS,
    ROUTE_PATHS.ADMIN.SETTINGS,
    ROUTE_PATHS.ADMIN.ANALYTICS,
    ROUTE_PATHS.ADMIN.SYSTEM,
  ],
  patient: [
    ROUTE_PATHS.PATIENT.DASHBOARD,
    ROUTE_PATHS.PATIENT.GOALS,
    ROUTE_PATHS.PATIENT.GOAL_DETAIL,
    ROUTE_PATHS.PATIENT.CHECKINS,
    ROUTE_PATHS.PATIENT.CHECKIN_NEW,
    ROUTE_PATHS.PATIENT.CHECKIN_HISTORY,
    ROUTE_PATHS.PATIENT.PROFILE,
    ROUTE_PATHS.PATIENT.PROGRESS,
  ],
} as const

export const PUBLIC_ROUTES = [
  ROUTE_PATHS.HOME,
  ROUTE_PATHS.AUTH.SIGNIN,
  ROUTE_PATHS.AUTH.SIGNUP,
  ROUTE_PATHS.AUTH.FORGOT_PASSWORD,
  ROUTE_PATHS.AUTH.RESET_PASSWORD,
  ROUTE_PATHS.AUTH.VERIFY_EMAIL,
  ROUTE_PATHS.AUTH.EMAIL_CONFIRMED,
  ROUTE_PATHS.ABOUT,
  ROUTE_PATHS.CONTACT,
  ROUTE_PATHS.HELP,
  ROUTE_PATHS.NOT_FOUND,
  ROUTE_PATHS.FORBIDDEN,
  ROUTE_PATHS.SERVER_ERROR,
  ROUTE_PATHS.MAINTENANCE,
] as const

export const AUTH_ONLY_ROUTES = [
  ROUTE_PATHS.AUTH.SIGNIN,
  ROUTE_PATHS.AUTH.SIGNUP,
  ROUTE_PATHS.AUTH.FORGOT_PASSWORD,
] as const

export class RouteUtils {
  /**
   * Check if a route requires authentication
   */
  static requiresAuth(path: string): boolean {
    return !PUBLIC_ROUTES.includes(path as unknown)
  }

  /**
   * Check if a route is accessible by a specific role
   */
  static isAccessibleByRole(path: string, role: UserRole): boolean {
    return ROLE_ROUTES[role]?.some(routePath => 
      this.matchPath(path, routePath)
    ) || false
  }

  /**
   * Get the appropriate dashboard for a role
   */
  static getDashboardForRole(role: UserRole): string {
    switch (role) {
      case 'administrator':
      case 'director':
      case 'vice_director':
      case 'department_head':
      case 'manager_level':
      case 'section_chief':
        return ROUTE_PATHS.ADMIN.DASHBOARD
      case 'staff':
      case 'assistant_manager':
        return ROUTE_PATHS.SOCIAL_WORKER.DASHBOARD
      case 'patient':
        return ROUTE_PATHS.PATIENT.DASHBOARD
      case 'attending_physician':
        return ROUTE_PATHS.DASHBOARD
      default:
        return ROUTE_PATHS.DASHBOARD
    }
  }

  /**
   * Get the profile page for a role
   */
  static getProfileForRole(role: UserRole): string {
    switch (role) {
      case 'staff':
      case 'assistant_manager':
      case 'section_chief':
      case 'manager_level':
      case 'department_head':
        return ROUTE_PATHS.SOCIAL_WORKER.PROFILE
      case 'patient':
        return ROUTE_PATHS.PATIENT.PROFILE
      default:
        return ROUTE_PATHS.PROFILE
    }
  }

  /**
   * Match a current path against a route pattern
   */
  static matchPath(currentPath: string, routePattern: string): boolean {
    const pattern = routePattern
      .replace(/:[^/]+/g, '[^/]+') // Replace :param with regex
      .replace(/\*/g, '.*') // Replace * with regex
    
    const regex = new RegExp(`^${pattern}$`)
    return regex.test(currentPath)
  }

  /**
   * Extract parameters from a path using a route pattern
   */
  static extractParams(currentPath: string, routePattern: string): Record<string, string> {
    const params: Record<string, string> = {}
    
    const patternParts = routePattern.split('/')
    const pathParts = currentPath.split('/')
    
    if (patternParts.length !== pathParts.length) {
      return params
    }
    
    patternParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1)
        params[paramName] = pathParts[index]
      }
    })
    
    return params
  }

  /**
   * Build a path with parameters
   */
  static buildPath(routePattern: string, params: Record<string, string>): string {
    let path = routePattern
    
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value)
    })
    
    return path
  }

  /**
   * Check if current path is an auth route
   */
  static isAuthRoute(path: string): boolean {
    return Object.values(ROUTE_PATHS.AUTH).includes(path as unknown)
  }

  /**
   * Check if current path is a public route
   */
  static isPublicRoute(path: string): boolean {
    return PUBLIC_ROUTES.includes(path as unknown)
  }

  /**
   * Get breadcrumb items for a path
   */
  static getBreadcrumbs(path: string): Array<{ title: string; path: string }> {
    const parts = path.split('/').filter(Boolean)
    const breadcrumbs: Array<{ title: string; path: string }> = []
    
    let currentPath = ''
    
    parts.forEach(part => {
      currentPath += `/${part}`
      
      const title = this.getPathTitle(currentPath, part)
      
      breadcrumbs.push({
        title,
        path: currentPath
      })
    })
    
    return breadcrumbs
  }

  /**
   * Get a human-readable title for a path
   */
  static getPathTitle(fullPath: string, pathPart: string): string {
    const routeTitles: Record<string, string> = {
      'admin': '관리자',
      'social-worker': '사회복지사',
      'patient': '환자',
      'dashboard': '대시보드',
      'users': '사용자',
      'patients': '환자 관리',
      'social-workers': '사회복지사 관리',
      'administrators': '관리자 관리',
      'goals': '목표',
      'assessments': '평가',
      'checkins': '체크인',
      'profile': '프로필',
      'settings': '설정',
      'analytics': '분석',
      'services': '서비스',
      'progress': '진행상황',
      'history': '기록',
      'create': '생성',
      'edit': '수정',
      'new': '새로 만들기'
    }
    
    return routeTitles[pathPart] || pathPart
  }

  /**
   * Check if a path requires specific permissions
   */
  static getRequiredPermissions(path: string): Permission[] {
    const permissionMap: Record<string, Permission[]> = {
      [ROUTE_PATHS.ADMIN.DASHBOARD]: ['view_analytics'],
      [ROUTE_PATHS.ADMIN.USERS]: ['manage_users'],
      [ROUTE_PATHS.ADMIN.SOCIAL_WORKERS]: ['manage_social_workers'],
      [ROUTE_PATHS.ADMIN.PATIENTS]: ['manage_patients'],
      [ROUTE_PATHS.ADMIN.SETTINGS]: ['manage_system_settings'],
      [ROUTE_PATHS.SOCIAL_WORKER.PATIENTS]: ['manage_assigned_patients'],
      [ROUTE_PATHS.SOCIAL_WORKER.GOALS]: ['create_goals', 'update_goals'],
      [ROUTE_PATHS.SOCIAL_WORKER.ASSESSMENTS]: ['create_assessments'],
      [ROUTE_PATHS.PATIENT.GOALS]: ['view_own_goals'],
      [ROUTE_PATHS.PATIENT.CHECKINS]: ['submit_check_ins'],
      [ROUTE_PATHS.PATIENT.PROFILE]: ['update_own_profile'],
    }
    
    return permissionMap[path] || []
  }

  /**
   * Get navigation items for a specific role
   */
  static getNavigationForRole(role: UserRole): Array<{
    title: string
    path: string
    icon?: string
    children?: Array<{ title: string; path: string }>
  }> {
    switch (role) {
      case 'administrator':
        return [
          { title: '대시보드', path: ROUTE_PATHS.ADMIN.DASHBOARD, icon: 'dashboard' },
          {
            title: '사용자 관리',
            path: ROUTE_PATHS.ADMIN.USERS,
            icon: 'users',
            children: [
              { title: '사회복지사', path: ROUTE_PATHS.ADMIN.SOCIAL_WORKERS },
              { title: '환자', path: ROUTE_PATHS.ADMIN.PATIENTS },
              { title: '관리자', path: ROUTE_PATHS.ADMIN.ADMINISTRATORS },
            ]
          },
          { title: '시스템 설정', path: ROUTE_PATHS.ADMIN.SETTINGS, icon: 'settings' },
          { title: '분석', path: ROUTE_PATHS.ADMIN.ANALYTICS, icon: 'analytics' },
        ]

      case 'staff':
      case 'assistant_manager':
        return [
          { title: '대시보드', path: ROUTE_PATHS.SOCIAL_WORKER.DASHBOARD, icon: 'dashboard' },
          { title: '담당 환자', path: ROUTE_PATHS.SOCIAL_WORKER.PATIENTS, icon: 'patients' },
          { title: '목표 관리', path: ROUTE_PATHS.SOCIAL_WORKER.GOALS, icon: 'goals' },
          { title: '평가', path: ROUTE_PATHS.SOCIAL_WORKER.ASSESSMENTS, icon: 'assessments' },
          { title: '서비스', path: ROUTE_PATHS.SOCIAL_WORKER.SERVICES, icon: 'services' },
          { title: '분석', path: ROUTE_PATHS.SOCIAL_WORKER.ANALYTICS, icon: 'analytics' },
        ]

      case 'section_chief':
      case 'manager_level':
      case 'department_head':
      case 'vice_director':
      case 'director':
        return [
          { title: '대시보드', path: ROUTE_PATHS.ADMIN.DASHBOARD, icon: 'dashboard' },
          { title: '담당 환자', path: ROUTE_PATHS.SOCIAL_WORKER.PATIENTS, icon: 'patients' },
          { title: '목표 관리', path: ROUTE_PATHS.SOCIAL_WORKER.GOALS, icon: 'goals' },
          { title: '평가', path: ROUTE_PATHS.SOCIAL_WORKER.ASSESSMENTS, icon: 'assessments' },
          { title: '서비스', path: ROUTE_PATHS.SOCIAL_WORKER.SERVICES, icon: 'services' },
          {
            title: '사용자 관리',
            path: ROUTE_PATHS.ADMIN.USERS,
            icon: 'users',
            children: [
              { title: '직원', path: ROUTE_PATHS.ADMIN.SOCIAL_WORKERS },
              { title: '환자', path: ROUTE_PATHS.ADMIN.PATIENTS },
            ]
          },
          { title: '분석', path: ROUTE_PATHS.ADMIN.ANALYTICS, icon: 'analytics' },
        ]

      case 'patient':
        return [
          { title: '내 대시보드', path: ROUTE_PATHS.PATIENT.DASHBOARD, icon: 'dashboard' },
          { title: '내 목표', path: ROUTE_PATHS.PATIENT.GOALS, icon: 'goals' },
          { title: '체크인', path: ROUTE_PATHS.PATIENT.CHECKINS, icon: 'checkins' },
          { title: '진행상황', path: ROUTE_PATHS.PATIENT.PROGRESS, icon: 'progress' },
          { title: '내 정보', path: ROUTE_PATHS.PATIENT.PROFILE, icon: 'profile' },
        ]

      case 'attending_physician':
        return [
          { title: '대시보드', path: ROUTE_PATHS.DASHBOARD, icon: 'dashboard' },
          { title: '담당 환자', path: ROUTE_PATHS.SOCIAL_WORKER.PATIENTS, icon: 'patients' },
        ]

      default:
        return []
    }
  }
}

export const {
  requiresAuth,
  isAccessibleByRole,
  getDashboardForRole,
  getProfileForRole,
  matchPath,
  extractParams,
  buildPath,
  isAuthRoute,
  isPublicRoute,
  getBreadcrumbs,
  getPathTitle,
  getRequiredPermissions,
  getNavigationForRole
} = RouteUtils 