import { supabase } from '@/lib/supabase';

// 간단한 환자 수 가져오기 함수
export const getPatientCount = async (): Promise<number> => {
  try {
    const { data, error } = await supabase.from('patients').select('id');
    if (error) throw error;
    return data?.length || 0;
  } catch {
    console.error("Error occurred");
    return 0;
  }
};

// 간단한 활성 목표 수 가져오기 함수  
export const getActiveGoalsCount = async (): Promise<number> => {
  try {
    const { data, error } = await supabase.from('goals').select('id').eq('status', 'in_progress');
    if (error) throw error;
    return data?.length || 0;
  } catch {
    console.error("Error occurred");
    return 0;
  }
};

// 기존 복잡한 클래스는 주석처리하고 나중에 사용
/*
// Dashboard API Service
export class DashboardService {
  // Stats endpoints
  static async getDashboardStats(filters?: DashboardFilters): Promise<ApiResponse<DashboardStats>> {
    try {
      const endDate = filters?.dateRange.end || new Date().toISOString();
      const startDate = filters?.dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Try to get real data from Supabase
      const [patientsResult, goalsResult, sessionsResult] = await Promise.allSettled([
        supabase.from('patients').select('*'),
        supabase.from('goals').select('*'),
        supabase.from('sessions').select('*').gte('date', startDate).lte('date', endDate),
      ]);

      let stats: DashboardStats;

      if (patientsResult.status === 'fulfilled' && !patientsResult.value.error) {
        // Calculate real stats
        const patients = patientsResult.value.data || [];
        const goals = goalsResult.status === 'fulfilled' ? goalsResult.value.data || [] : [];
        const sessions = sessionsResult.status === 'fulfilled' ? sessionsResult.value.data || [] : [];

        const activePatients = patients.filter(p => p.status === 'active');
        const activeGoals = goals.filter(g => g.status === 'in_progress');
        const completedGoals = goals.filter(g => g.status === 'completed');
        const thisWeekSessions = sessions.filter(s => {
          const sessionDate = new Date(s.date);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return sessionDate >= weekAgo;
        });

        stats = {
          totalPatients: patients.length,
          activePatients: activePatients.length,
          totalGoals: goals.length,
          activeGoals: activeGoals.length,
          completedGoals: completedGoals.length,
          thisWeekSessions: thisWeekSessions.length,
          upcomingTasks: Math.floor(Math.random() * 8) + 2,
          goalCompletionRate: goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0,
          averageSessionDuration: sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.duration || 45), 0) / sessions.length) : 45,
          monthlyActiveUsers: activePatients.length,
        };
      } else {
        // Fallback to mock data
        stats = this.getMockStats();
      }

      return {
        data: stats,
        success: true,
      };
    } catch {
      console.error("Error occurred");
      return {
        data: this.getMockStats(),
        success: false,
        error: 'Failed to fetch dashboard statistics',
      };
    }
  }

  // Patients endpoints
  static async getPatients(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<Patient>>> {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const offset = (page - 1) * limit;

      let query = supabase.from('patients').select('*', { count: 'exact' });

      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`);
      }

      if (params?.sortBy) {
        query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' });
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        data: {
          data: data || [],
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > offset + limit,
        },
        success: true,
      };
    } catch {
      console.error("Error occurred");
      // Return mock data on error
      return {
        data: {
          data: this.getMockPatients(),
          total: 25,
          page: 1,
          limit: 10,
          hasMore: true,
        },
        success: false,
        error: 'Failed to fetch patients',
      };
    }
  }

  // Goals endpoints
  static async getGoals(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<Goal>>> {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const offset = (page - 1) * limit;

      let query = supabase.from('goals').select('*', { count: 'exact' });

      if (params?.filters?.category) {
        query = query.eq('category', params.filters.category);
      }

      if (params?.filters?.status) {
        query = query.eq('status', params.filters.status);
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        data: {
          data: data || [],
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > offset + limit,
        },
        success: true,
      };
    } catch {
      console.error("Error occurred");
      return {
        data: {
          data: this.getMockGoals(),
          total: 50,
          page: 1,
          limit: 20,
          hasMore: true,
        },
        success: false,
        error: 'Failed to fetch goals',
      };
    }
  }

  // Sessions endpoints
  static async getSessions(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<Session>>> {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const offset = (page - 1) * limit;

      let query = supabase.from('sessions').select('*', { count: 'exact' });

      if (params?.filters?.startDate && params?.filters?.endDate) {
        query = query.gte('date', params.filters.startDate).lte('date', params.filters.endDate);
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        data: {
          data: data || [],
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > offset + limit,
        },
        success: true,
      };
    } catch {
      console.error("Error occurred");
      return {
        data: {
          data: this.getMockSessions(),
          total: 30,
          page: 1,
          limit: 20,
          hasMore: true,
        },
        success: false,
        error: 'Failed to fetch sessions',
      };
    }
  }

  // Chart data endpoints
  static async getChartData(filters?: DashboardFilters): Promise<ApiResponse<ChartData>> {
    try {
      // This would typically fetch and process data for charts
      // For now, we'll generate mock data that could be based on real data
      const chartData = this.getMockChartData();

      return {
        data: chartData,
        success: true,
      };
    } catch {
      console.error("Error occurred");
      return {
        data: this.getMockChartData(),
        success: false,
        error: 'Failed to fetch chart data',
      };
    }
  }

  // Progress data endpoints
  static async getProgressData(patientId: string, goalId?: string): Promise<ApiResponse<ProgressData[]>> {
    try {
      let query = supabase.from('progress_data').select('*').eq('patient_id', patientId);

      if (goalId) {
        query = query.eq('goal_id', goalId);
      }

      const { data, error } = await query.order('date', { ascending: true });

      if (error) throw error;

      return {
        data: data || [],
        success: true,
      };
    } catch {
      console.error("Error occurred");
      return {
        data: this.getMockProgressData(patientId, goalId),
        success: false,
        error: 'Failed to fetch progress data',
      };
    }
  }

  // Mock data generators
  private static getMockStats(): DashboardStats {
    return {
      totalPatients: 24,
      activePatients: 18,
      totalGoals: 72,
      activeGoals: 45,
      completedGoals: 27,
      thisWeekSessions: 12,
      upcomingTasks: 5,
      goalCompletionRate: 85,
      averageSessionDuration: 45,
      monthlyActiveUsers: 18,
    };
  }

  private static getMockPatients(): Patient[] {
    return [
      {
        id: '1',
        name: '김○○',
        status: 'active',
        lastSession: '2024-01-15',
        age: 28,
        gender: 'female',
        joinDate: '2024-01-01',
      },
      {
        id: '2',
        name: '이○○',
        status: 'active',
        lastSession: '2024-01-14',
        age: 35,
        gender: 'male',
        joinDate: '2023-12-15',
      },
      {
        id: '3',
        name: '박○○',
        status: 'completed',
        lastSession: '2024-01-13',
        age: 42,
        gender: 'female',
        joinDate: '2023-11-20',
      },
    ];
  }

  private static getMockGoals(): Goal[] {
    return [
      {
        id: '1',
        patientId: '1',
        title: '인지 능력 향상',
        description: '기억력과 집중력 개선을 위한 훈련',
        category: 'cognitive',
        status: 'in_progress',
        priority: 'high',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
        progress: 75,
      },
      {
        id: '2',
        patientId: '2',
        title: '사회적 기술 개발',
        description: '대인관계 능력 향상',
        category: 'social',
        status: 'in_progress',
        priority: 'medium',
        createdAt: '2024-01-02',
        updatedAt: '2024-01-14',
        progress: 60,
      },
    ];
  }

  private static getMockSessions(): Session[] {
    return [
      {
        id: '1',
        patientId: '1',
        socialWorkerId: 'sw1',
        date: '2024-01-15',
        duration: 60,
        type: 'individual',
        status: 'completed',
        notes: '좋은 진전을 보임',
      },
      {
        id: '2',
        patientId: '2',
        socialWorkerId: 'sw1',
        date: '2024-01-14',
        duration: 45,
        type: 'group',
        status: 'completed',
        notes: '그룹 활동에 적극 참여',
      },
    ];
  }

  private static getMockChartData(): ChartData {
    return {
      progressTrend: {
        labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
        goalAchievementRate: [65, 70, 80, 75, 85, 90],
        patientEngagementRate: [78, 82, 77, 85, 88, 92],
      },
      goalDistribution: {
        labels: ['인지 훈련', '사회 기술', '일상 생활', '직업 훈련', '기타'],
        data: [35, 25, 20, 15, 5],
      },
      weeklyPerformance: {
        labels: ['월', '화', '수', '목', '금', '토', '일'],
        completedGoals: [12, 19, 15, 25, 22, 18, 8],
        newGoals: [8, 12, 10, 15, 18, 12, 5],
      },
      monthlyTrends: {
        labels: ['7월', '8월', '9월', '10월', '11월', '12월'],
        patients: [20, 22, 25, 23, 24, 24],
        goals: [45, 52, 58, 55, 60, 72],
        sessions: [80, 95, 88, 102, 98, 110],
      },
    };
  }

  private static getMockProgressData(patientId: string, goalId?: string): ProgressData[] {
    return [
      {
        id: '1',
        patientId,
        goalId: goalId || '1',
        date: '2024-01-01',
        value: 60,
        metric: 'progress_percentage',
      },
      {
        id: '2',
        patientId,
        goalId: goalId || '1',
        date: '2024-01-08',
        value: 70,
        metric: 'progress_percentage',
      },
      {
        id: '3',
        patientId,
        goalId: goalId || '1',
        date: '2024-01-15',
        value: 75,
        metric: 'progress_percentage',
      },
    ];
  }
}

export default DashboardService;
*/

// 간단한 Supabase 연결 테스트 함수
export const testSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('patients').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}; 