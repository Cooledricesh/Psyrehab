
export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  fullName: string
  role: 'social_worker' | 'supervisor'
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    fullName: string
    role: string
  }
  session: {
    accessToken: string
    refreshToken: string
    expiresAt: number
  }
}

export interface CreatePatientData {
  patientId: string
  firstName: string
  lastName: string
  birthDate: string
  phoneNumber?: string
  emergencyContact?: string
  diagnosis?: string
}

export interface UpdatePatientData extends Partial<CreatePatientData> {
  id: string
}

export interface PatientSearchParams extends PaginationParams {
  query?: string
  assignedTo?: string
  hasActiveGoals?: boolean
}

export interface CreateGoalData {
  patientId: string
  parentGoalId?: string
  title: string
  description: string
  goalType: 'six_month' | 'monthly' | 'weekly'
  targetDate: string
}

export interface UpdateGoalData extends Partial<CreateGoalData> {
  id: string
  status?: 'active' | 'completed' | 'paused' | 'cancelled'
  progress?: number
}

export interface GoalSearchParams extends PaginationParams {
  patientId?: string
  goalType?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export interface CreateAssessmentData {
  patientId: string
  assessmentStage: 'initial' | 'ongoing' | 'interim' | 'discharge' | 'follow_up'
  assessmentDate: string
  notes: string
  recommendations?: string
  nextAssessmentDate?: string
}

export interface UpdateAssessmentData extends Partial<CreateAssessmentData> {
  id: string
}

export interface CreateAIRecommendationData {
  patientId: string
  recommendationType: string
  content: string
  confidenceScore: number
}

export interface UpdateAIRecommendationData {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'implemented'
  reviewNotes?: string
}

export interface RecordProgressData {
  goalId: string
  progressDate: string
  progressValue: number
  notes?: string
}

export interface DashboardStats {
  totalPatients: number
  activeGoals: number
  completedGoalsThisMonth: number
  pendingAssessments: number
  recentActivities: Array<{
    id: string
    type: 'goal_created' | 'goal_completed' | 'assessment_completed' | 'patient_added'
    description: string
    timestamp: string
    patientName?: string
  }>
} 