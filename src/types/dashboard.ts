export interface Patient {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'completed' | 'on-hold';
  lastSession?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  joinDate: string;
  goals?: Goal[];
  sessions?: Session[];
  progressData?: ProgressData[];
}

export interface Goal {
  id: string;
  patientId: string;
  title: string;
  description: string;
  category: 'cognitive' | 'social' | 'daily_living' | 'vocational' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'paused';
  priority: 'low' | 'medium' | 'high';
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
  progress: number; // 0-100
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  dueDate?: string;
}

export interface Session {
  id: string;
  patientId: string;
  socialWorkerId: string;
  date: string;
  duration: number; // minutes
  type: 'individual' | 'group' | 'family' | 'assessment';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  goals?: string[]; // goal IDs
  outcomes?: SessionOutcome[];
}

export interface SessionOutcome {
  goalId: string;
  progress: number;
  notes: string;
}

export interface ProgressData {
  id: string;
  patientId: string;
  goalId?: string;
  date: string;
  value: number;
  metric: string;
  notes?: string;
}

export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  thisWeekSessions: number;
  upcomingTasks: number;
  goalCompletionRate: number;
  averageSessionDuration: number;
  monthlyActiveUsers: number;
}

export interface ChartData {
  progressTrend: {
    labels: string[];
    goalAchievementRate: number[];
    patientEngagementRate: number[];
  };
  goalDistribution: {
    labels: string[];
    data: number[];
  };
  weeklyPerformance: {
    labels: string[];
    completedGoals: number[];
    newGoals: number[];
  };
  monthlyTrends: {
    labels: string[];
    patients: number[];
    goals: number[];
    sessions: number[];
  };
}

export interface DashboardFilters {
  dateRange: {
    start: string;
    end: string;
  };
  patientStatus?: string[];
  goalCategories?: string[];
  priority?: string[];
  socialWorker?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface LoadingState {
  stats: boolean;
  patients: boolean;
  goals: boolean;
  sessions: boolean;
  charts: boolean;
}

export interface ErrorState {
  stats: string | null;
  patients: string | null;
  goals: string | null;
  sessions: string | null;
  charts: string | null;
}

export interface DashboardState {
  stats: DashboardStats;
  patients: Patient[];
  goals: Goal[];
  sessions: Session[];
  chartData: ChartData;
  filters: DashboardFilters;
  loading: LoadingState;
  errors: ErrorState;
  lastUpdated: string;
}

// API endpoint types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, string | number | boolean | string[]>;
} 