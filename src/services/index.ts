// Service layer exports
// This file serves as the central export point for all service modules

// Progress tracking services
export * from './progress-tracking'

// Authentication services
export * from './auth'

// Assessment services
export * from './assessment'

// Service Records services
export * from './service-records'

// AI Recommendations services
export * from './ai-recommendations'

// Rehabilitation Goals services
export * from './rehabilitation-goals'

// Goal Categories services - removed

// Goal Evaluations services
export * from './goal-evaluations'

// Weekly Check-ins services
export * from './weekly-check-ins'

// Goal History services
export * from './goal-history'

// API service utilities
// export * from './api'

// AI recommendation services
// export * from './ai'

// Notification services
// export * from './notifications'

// Patient Services
export { PatientService } from './patients'
export type {
  Patient,
  PatientCreateData,
  PatientUpdateData,
  PatientListParams,
  PatientListResponse,
  PatientFilters
} from './patients'

// Social Worker Services
export { SocialWorkerService } from './social-workers'
export type {
  SocialWorkerListParams,
  SocialWorkerListResponse
} from './social-workers'

// Authentication Services
export { AuthService } from './auth'
export type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  UserProfile,
  UserRole
} from './auth'

// Goal Services
// export { RehabilitationGoalService } from './rehabilitation-goals'
// export { GoalCategoryService } from './goal-categories'
// export { GoalEvaluationService } from './goal-evaluations'
// export { GoalHistoryService } from './goal-history'

// Check-in Services
// export { WeeklyCheckInService } from './weekly-check-ins'

// AI Services
// export { AIRecommendationService } from './ai-recommendations'

// AI Recommendation Archive Service
export { AIRecommendationArchiveService } from './ai-recommendation-archive'
export type { ArchivedRecommendation, ArchivedGoalData, ArchiveRecommendationParams } from './ai-recommendation-archive'

// User Management Service
export { UserManagementService } from './userManagement'
export type { UpdateUserRoleParams } from './userManagement' 