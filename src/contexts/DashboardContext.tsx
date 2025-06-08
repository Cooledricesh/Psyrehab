import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  DashboardState,
  DashboardStats,
  Patient,
  Goal,
  Session,
  ChartData,
  DashboardFilters,
  LoadingState,
  ErrorState,
  QueryParams,
} from '@/types/dashboard';
import DashboardService from '@/services/dashboardService';
import { useDashboardRealtime } from '@/hooks/useRealtimeUpdates';

// Action types
type DashboardAction =
  | { type: 'SET_LOADING'; payload: Partial<LoadingState> }
  | { type: 'SET_ERROR'; payload: Partial<ErrorState> }
  | { type: 'SET_STATS'; payload: DashboardStats }
  | { type: 'SET_PATIENTS'; payload: Patient[] }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'SET_SESSIONS'; payload: Session[] }
  | { type: 'SET_CHART_DATA'; payload: ChartData }
  | { type: 'SET_FILTERS'; payload: DashboardFilters }
  | { type: 'UPDATE_PATIENT'; payload: Patient }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'ADD_PATIENT'; payload: Patient }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'DELETE_PATIENT'; payload: string }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'RESET_STATE' }
  | { type: 'REALTIME_UPDATE'; payload: any }
  | { type: 'SET_REALTIME_STATUS'; payload: { connectionStatus: string; lastUpdate: string } };

// Initial state
const initialState: DashboardState = {
  stats: {
    totalPatients: 0,
    activePatients: 0,
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    thisWeekSessions: 0,
    upcomingTasks: 0,
    goalCompletionRate: 0,
    averageSessionDuration: 0,
    monthlyActiveUsers: 0,
  },
  patients: [],
  goals: [],
  sessions: [],
  chartData: {
    progressTrend: {
      labels: [],
      goalAchievementRate: [],
      patientEngagementRate: [],
    },
    goalDistribution: {
      labels: [],
      data: [],
    },
    weeklyPerformance: {
      labels: [],
      completedGoals: [],
      newGoals: [],
    },
    monthlyTrends: {
      labels: [],
      patients: [],
      goals: [],
      sessions: [],
    },
  },
  filters: {
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
  },
  loading: {
    stats: false,
    patients: false,
    goals: false,
    sessions: false,
    charts: false,
  },
  errors: {
    stats: null,
    patients: null,
    goals: null,
    sessions: null,
    charts: null,
  },
  lastUpdated: new Date().toISOString(),
};

// Reducer
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, ...action.payload },
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, ...action.payload },
      };

    case 'SET_STATS':
      return {
        ...state,
        stats: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case 'SET_PATIENTS':
      return {
        ...state,
        patients: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case 'SET_GOALS':
      return {
        ...state,
        goals: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case 'SET_SESSIONS':
      return {
        ...state,
        sessions: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case 'SET_CHART_DATA':
      return {
        ...state,
        chartData: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload,
      };

    case 'UPDATE_PATIENT':
      return {
        ...state,
        patients: state.patients.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
        lastUpdated: new Date().toISOString(),
      };

    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g =>
          g.id === action.payload.id ? action.payload : g
        ),
        lastUpdated: new Date().toISOString(),
      };

    case 'ADD_PATIENT':
      return {
        ...state,
        patients: [...state.patients, action.payload],
        lastUpdated: new Date().toISOString(),
      };

    case 'ADD_GOAL':
      return {
        ...state,
        goals: [...state.goals, action.payload],
        lastUpdated: new Date().toISOString(),
      };

    case 'DELETE_PATIENT':
      return {
        ...state,
        patients: state.patients.filter(p => p.id !== action.payload),
        lastUpdated: new Date().toISOString(),
      };

    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(g => g.id !== action.payload),
        lastUpdated: new Date().toISOString(),
      };

    case 'RESET_STATE':
      return initialState;

    case 'REALTIME_UPDATE':
      // Handle different types of real-time updates
      const { eventType, table, record } = action.payload;
      switch (table) {
        case 'patients':
          if (eventType === 'INSERT') {
            return {
              ...state,
              patients: [...state.patients, record],
              lastUpdated: new Date().toISOString(),
            };
          } else if (eventType === 'UPDATE') {
            return {
              ...state,
              patients: state.patients.map(p => p.id === record.id ? record : p),
              lastUpdated: new Date().toISOString(),
            };
          } else if (eventType === 'DELETE') {
            return {
              ...state,
              patients: state.patients.filter(p => p.id !== record.id),
              lastUpdated: new Date().toISOString(),
            };
          }
          break;
        case 'goals':
          if (eventType === 'INSERT') {
            return {
              ...state,
              goals: [...state.goals, record],
              lastUpdated: new Date().toISOString(),
            };
          } else if (eventType === 'UPDATE') {
            return {
              ...state,
              goals: state.goals.map(g => g.id === record.id ? record : g),
              lastUpdated: new Date().toISOString(),
            };
          } else if (eventType === 'DELETE') {
            return {
              ...state,
              goals: state.goals.filter(g => g.id !== record.id),
              lastUpdated: new Date().toISOString(),
            };
          }
          break;
        case 'sessions':
          if (eventType === 'INSERT') {
            return {
              ...state,
              sessions: [...state.sessions, record],
              lastUpdated: new Date().toISOString(),
            };
          } else if (eventType === 'UPDATE') {
            return {
              ...state,
              sessions: state.sessions.map(s => s.id === record.id ? record : s),
              lastUpdated: new Date().toISOString(),
            };
          } else if (eventType === 'DELETE') {
            return {
              ...state,
              sessions: state.sessions.filter(s => s.id !== record.id),
              lastUpdated: new Date().toISOString(),
            };
          }
          break;
      }
      return {
        ...state,
        lastUpdated: new Date().toISOString(),
      };

    case 'SET_REALTIME_STATUS':
      return {
        ...state,
        realtimeStatus: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    default:
      return state;
  }
}

// Context types
interface DashboardContextType {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
  actions: {
    fetchStats: (filters?: DashboardFilters) => Promise<void>;
    fetchPatients: (params?: QueryParams) => Promise<void>;
    fetchGoals: (params?: QueryParams) => Promise<void>;
    fetchSessions: (params?: QueryParams) => Promise<void>;
    fetchChartData: (filters?: DashboardFilters) => Promise<void>;
    fetchAllData: (filters?: DashboardFilters) => Promise<void>;
    updateFilters: (filters: DashboardFilters) => void;
    refreshData: () => Promise<void>;
    resetState: () => void;
  };
  selectors: {
    getActivePatients: () => Patient[];
    getActiveGoals: () => Goal[];
    getRecentSessions: () => Session[];
    getPatientsByStatus: (status: string) => Patient[];
    getGoalsByCategory: (category: string) => Goal[];
    isLoading: () => boolean;
    hasErrors: () => boolean;
  };
}

// Create context
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Provider component
interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Real-time updates
  const handleRealtimeUpdate = (payload: any) => {
    console.log('Real-time update received:', payload);
    dispatch({
      type: 'REALTIME_UPDATE',
      payload: {
        eventType: payload.eventType,
        table: payload.table,
        record: payload.new || payload.old,
      },
    });
  };

  const realtimeStatus = useDashboardRealtime(handleRealtimeUpdate);

  // Actions
  const actions = {
    fetchStats: async (filters?: DashboardFilters) => {
      dispatch({ type: 'SET_LOADING', payload: { stats: true } });
      dispatch({ type: 'SET_ERROR', payload: { stats: null } });

      try {
        const response = await DashboardService.getDashboardStats(filters);
        if (response.success) {
          dispatch({ type: 'SET_STATS', payload: response.data });
        } else {
          dispatch({ type: 'SET_ERROR', payload: { stats: response.error || 'Failed to fetch stats' } });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: { stats: 'Failed to fetch stats' } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { stats: false } });
      }
    },

    fetchPatients: async (params?: QueryParams) => {
      dispatch({ type: 'SET_LOADING', payload: { patients: true } });
      dispatch({ type: 'SET_ERROR', payload: { patients: null } });

      try {
        const response = await DashboardService.getPatients(params);
        if (response.success) {
          dispatch({ type: 'SET_PATIENTS', payload: response.data.data });
        } else {
          dispatch({ type: 'SET_ERROR', payload: { patients: response.error || 'Failed to fetch patients' } });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: { patients: 'Failed to fetch patients' } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { patients: false } });
      }
    },

    fetchGoals: async (params?: QueryParams) => {
      dispatch({ type: 'SET_LOADING', payload: { goals: true } });
      dispatch({ type: 'SET_ERROR', payload: { goals: null } });

      try {
        const response = await DashboardService.getGoals(params);
        if (response.success) {
          dispatch({ type: 'SET_GOALS', payload: response.data.data });
        } else {
          dispatch({ type: 'SET_ERROR', payload: { goals: response.error || 'Failed to fetch goals' } });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: { goals: 'Failed to fetch goals' } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { goals: false } });
      }
    },

    fetchSessions: async (params?: QueryParams) => {
      dispatch({ type: 'SET_LOADING', payload: { sessions: true } });
      dispatch({ type: 'SET_ERROR', payload: { sessions: null } });

      try {
        const response = await DashboardService.getSessions(params);
        if (response.success) {
          dispatch({ type: 'SET_SESSIONS', payload: response.data.data });
        } else {
          dispatch({ type: 'SET_ERROR', payload: { sessions: response.error || 'Failed to fetch sessions' } });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: { sessions: 'Failed to fetch sessions' } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { sessions: false } });
      }
    },

    fetchChartData: async (filters?: DashboardFilters) => {
      dispatch({ type: 'SET_LOADING', payload: { charts: true } });
      dispatch({ type: 'SET_ERROR', payload: { charts: null } });

      try {
        const response = await DashboardService.getChartData(filters);
        if (response.success) {
          dispatch({ type: 'SET_CHART_DATA', payload: response.data });
        } else {
          dispatch({ type: 'SET_ERROR', payload: { charts: response.error || 'Failed to fetch chart data' } });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: { charts: 'Failed to fetch chart data' } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { charts: false } });
      }
    },

    fetchAllData: async (filters?: DashboardFilters) => {
      await Promise.all([
        actions.fetchStats(filters),
        actions.fetchPatients(),
        actions.fetchGoals(),
        actions.fetchSessions(),
        actions.fetchChartData(filters),
      ]);
    },

    updateFilters: (filters: DashboardFilters) => {
      dispatch({ type: 'SET_FILTERS', payload: filters });
    },

    refreshData: async () => {
      await actions.fetchAllData(state.filters);
    },

    resetState: () => {
      dispatch({ type: 'RESET_STATE' });
    },
  };

  // Selectors
  const selectors = {
    getActivePatients: () => state.patients.filter(p => p.status === 'active'),
    getActiveGoals: () => state.goals.filter(g => g.status === 'in_progress'),
    getRecentSessions: () => 
      state.sessions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10),
    getPatientsByStatus: (status: string) => state.patients.filter(p => p.status === status),
    getGoalsByCategory: (category: string) => state.goals.filter(g => g.category === category),
    isLoading: () => Object.values(state.loading).some(loading => loading),
    hasErrors: () => Object.values(state.errors).some(error => error !== null),
  };

  // Initialize data on mount
  useEffect(() => {
    actions.fetchAllData();
  }, []);

  const contextValue: DashboardContextType = {
    state,
    dispatch,
    actions,
    selectors,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

// Custom hook
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export default DashboardContext; 