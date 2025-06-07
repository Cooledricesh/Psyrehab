// Application constants
export const APP_NAME = 'PsyRehab'
export const APP_VERSION = '1.0.0'

// Focus time options (from assessment table) - values only
export const FOCUS_TIME_VALUES = {
  FIVE_MIN: '5min',
  FIFTEEN_MIN: '15min',
  THIRTY_MIN: '30min',
  ONE_HOUR: '1hour',
} as const

// Social preference options - values only
export const SOCIAL_PREFERENCE_VALUES = {
  INDIVIDUAL: 'individual',
  SMALL_GROUP: 'small_group',
  LARGE_GROUP: 'large_group',
} as const

// Goal types
export const GOAL_TYPES = {
  SIX_MONTH: 'six_month',
  MONTHLY: 'monthly', 
  WEEKLY: 'weekly',
  OTHER: 'other',
} as const

// Goal status
export const GOAL_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled',
} as const

// Patient status
export const PATIENT_STATUS = {
  ACTIVE: 'active',
  DISCHARGED: 'discharged',
} as const

// Evaluation types
export const EVALUATION_TYPES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  SIX_MONTH: 'six_month',
} as const

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SOCIAL_WORKER: 'social_worker',
  SUPERVISOR: 'supervisor',
} as const

// Routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  PATIENT_DETAIL: '/patients/:id',
  GOALS: '/goals',
  ASSESSMENTS: '/assessments',
  REPORTS: '/reports',
  PROFILE: '/profile',
  LOGIN: '/login',
  REGISTER: '/register',
} as const

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'psyrehab_auth_token',
  USER_PREFERENCES: 'psyrehab_user_preferences',
} as const 