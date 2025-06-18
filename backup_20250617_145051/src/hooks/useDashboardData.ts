import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import { QueryParams, DashboardFilters } from '@/types/dashboard';

// Hook for managing dashboard stats
export const useDashboardStats = (filters?: DashboardFilters) => {
  const { state, actions } = useDashboard();
  const [refreshCount, setRefreshCount] = useState(0);

  const refresh = useCallback(() => {
    actions.fetchStats(filters);
    setRefreshCount(prev => prev + 1);
  }, [actions, filters]);

  useEffect(() => {
    if (refreshCount > 0 || !state.stats.totalPatients) {
      refresh();
    }
  }, [filters, refresh, refreshCount, state.stats.totalPatients]);

  return {
    stats: state.stats,
    loading: state.loading.stats,
    error: state.errors.stats,
    refresh,
  };
};

// Hook for managing patients data
export const usePatientsData = (params?: QueryParams) => {
  const { state, actions } = useDashboard();
  const [currentParams, setCurrentParams] = useState<QueryParams | undefined>(params);

  const fetchPatients = useCallback((newParams?: QueryParams) => {
    const finalParams = newParams || currentParams;
    actions.fetchPatients(finalParams);
    if (newParams) {
      setCurrentParams(newParams);
    }
  }, [actions, currentParams]);

  useEffect(() => {
    if (!state.patients.length) {
      fetchPatients();
    }
  }, []);

  const searchPatients = useCallback((searchTerm: string) => {
    fetchPatients({ ...currentParams, search: searchTerm });
  }, [fetchPatients, currentParams]);

  const sortPatients = useCallback((sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') => {
    fetchPatients({ ...currentParams, sortBy, sortOrder });
  }, [fetchPatients, currentParams]);

  return {
    patients: state.patients,
    loading: state.loading.patients,
    error: state.errors.patients,
    fetchPatients,
    searchPatients,
    sortPatients,
    currentParams,
  };
};

// Hook for managing goals data
export const useGoalsData = (params?: QueryParams) => {
  const { state, actions, selectors } = useDashboard();
  const [currentParams, setCurrentParams] = useState<QueryParams | undefined>(params);

  const fetchGoals = useCallback((newParams?: QueryParams) => {
    const finalParams = newParams || currentParams;
    actions.fetchGoals(finalParams);
    if (newParams) {
      setCurrentParams(newParams);
    }
  }, [actions, currentParams]);

  useEffect(() => {
    if (!state.goals.length) {
      fetchGoals();
    }
  }, []);

  const filterByCategory = useCallback((category: string) => {
    fetchGoals({ 
      ...currentParams, 
      filters: { ...currentParams?.filters, category } 
    });
  }, [fetchGoals, currentParams]);

  const filterByStatus = useCallback((status: string) => {
    fetchGoals({ 
      ...currentParams, 
      filters: { ...currentParams?.filters, status } 
    });
  }, [fetchGoals, currentParams]);

  return {
    goals: state.goals,
    activeGoals: selectors.getActiveGoals(),
    loading: state.loading.goals,
    error: state.errors.goals,
    fetchGoals,
    filterByCategory,
    filterByStatus,
    getGoalsByCategory: selectors.getGoalsByCategory,
    currentParams,
  };
};

// Hook for managing sessions data
export const useSessionsData = (params?: QueryParams) => {
  const { state, actions, selectors } = useDashboard();
  const [currentParams, setCurrentParams] = useState<QueryParams | undefined>(params);

  const fetchSessions = useCallback((newParams?: QueryParams) => {
    const finalParams = newParams || currentParams;
    actions.fetchSessions(finalParams);
    if (newParams) {
      setCurrentParams(newParams);
    }
  }, [actions, currentParams]);

  useEffect(() => {
    if (!state.sessions.length) {
      fetchSessions();
    }
  }, []);

  const filterByDateRange = useCallback((startDate: string, endDate: string) => {
    fetchSessions({
      ...currentParams,
      filters: { ...currentParams?.filters, startDate, endDate }
    });
  }, [fetchSessions, currentParams]);

  return {
    sessions: state.sessions,
    recentSessions: selectors.getRecentSessions(),
    loading: state.loading.sessions,
    error: state.errors.sessions,
    fetchSessions,
    filterByDateRange,
    currentParams,
  };
};

// Hook for managing chart data
export const useChartData = (filters?: DashboardFilters) => {
  const { state, actions } = useDashboard();
  const [refreshCount, setRefreshCount] = useState(0);

  const refresh = useCallback(() => {
    actions.fetchChartData(filters);
    setRefreshCount(prev => prev + 1);
  }, [actions, filters]);

  useEffect(() => {
    if (refreshCount > 0 || !state.chartData.progressTrend.labels.length) {
      refresh();
    }
  }, [filters, refresh, refreshCount, state.chartData.progressTrend.labels.length]);

  return {
    chartData: state.chartData,
    loading: state.loading.charts,
    error: state.errors.charts,
    refresh,
  };
};

// Hook for real-time data refresh
export const useRealTimeData = (intervalMs: number = 30000) => {
  const { actions, state } = useDashboard();
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false);

  useEffect(() => {
    if (!isAutoRefreshEnabled) return;

    const interval = setInterval(() => {
      actions.refreshData();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isAutoRefreshEnabled, intervalMs, actions]);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => !prev);
  }, []);

  const manualRefresh = useCallback(() => {
    actions.refreshData();
  }, [actions]);

  return {
    isAutoRefreshEnabled,
    toggleAutoRefresh,
    manualRefresh,
    lastUpdated: state.lastUpdated,
  };
};

// Hook for dashboard filters
export const useDashboardFilters = () => {
  const { state, actions } = useDashboard();
  
  const updateDateRange = useCallback((start: string, end: string) => {
    const newFilters = {
      ...state.filters,
      dateRange: { start, end }
    };
    actions.updateFilters(newFilters);
  }, [state.filters, actions]);

  const updatePatientStatus = useCallback((statuses: string[]) => {
    const newFilters = {
      ...state.filters,
      patientStatus: statuses
    };
    actions.updateFilters(newFilters);
  }, [state.filters, actions]);

  const updateGoalCategories = useCallback((categories: string[]) => {
    const newFilters = {
      ...state.filters,
      goalCategories: categories
    };
    actions.updateFilters(newFilters);
  }, [state.filters, actions]);

  const resetFilters = useCallback(() => {
    const resetFilters: DashboardFilters = {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    };
    actions.updateFilters(resetFilters);
  }, [actions]);

  return {
    filters: state.filters,
    updateDateRange,
    updatePatientStatus,
    updateGoalCategories,
    resetFilters,
  };
};

// Hook for loading states
export const useLoadingStates = () => {
  const { state } = useDashboard();
  
  return {
    loading: state.loading,
    isLoading: Object.values(state.loading).some(loading => loading),
    isStatsLoading: state.loading.stats,
    isPatientsLoading: state.loading.patients,
    isGoalsLoading: state.loading.goals,
    isSessionsLoading: state.loading.sessions,
    isChartsLoading: state.loading.charts,
  };
};

// Hook for error states
export const useErrorStates = () => {
  const { state } = useDashboard();
  
  return {
    errors: state.errors,
    hasErrors: Object.values(state.errors).some(error => error !== null),
    statsError: state.errors.stats,
    patientsError: state.errors.patients,
    goalsError: state.errors.goals,
    sessionsError: state.errors.sessions,
    chartsError: state.errors.charts,
  };
}; 