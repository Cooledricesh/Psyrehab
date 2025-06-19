import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

// Cache implementation
class DataCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  
  set(key: string, data: unknown, ttl: number = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
  
  delete(key: string) {
    this.cache.delete(key);
  }
}

const dataCache = new DataCache();

// Debounce hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook
export const useThrottle = <T>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

// Optimized dashboard stats hook
export const useOptimizedDashboardStats = (filters?: unknown) => {
  const { state, actions } = useDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Create cache key from filters
  const cacheKey = useMemo(() => {
    return `dashboard-stats-${JSON.stringify(filters || {})}`;
  }, [filters]);
  
  // Debounce filters to avoid excessive API calls
  const debouncedFilters = useDebounce(filters, 300);
  
  // Memoized stats with cache
  const cachedStats = useMemo(() => {
    const cached = dataCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    return state.stats;
  }, [cacheKey, state.stats]);
  
  // Fetch stats with caching
  const fetchStats = useCallback(async () => {
    const cached = dataCache.get(cacheKey);
    if (cached && !isRefreshing) {
      return cached;
    }
    
    setIsRefreshing(true);
    try {
      await actions.fetchStats(debouncedFilters);
      dataCache.set(cacheKey, state.stats);
    } finally {
      setIsRefreshing(false);
    }
  }, [cacheKey, debouncedFilters, actions, state.stats, isRefreshing]);
  
  // Auto-fetch on filter changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  
  return {
    stats: cachedStats,
    loading: state.loading.stats || isRefreshing,
    error: state.errors.stats,
    refresh: fetchStats,
    clearCache: () => dataCache.delete(cacheKey),
  };
};

// Optimized chart data hook
export const useOptimizedChartData = (filters?: unknown) => {
  const { state, actions } = useDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const cacheKey = useMemo(() => {
    return `chart-data-${JSON.stringify(filters || {})}`;
  }, [filters]);
  
  const debouncedFilters = useDebounce(filters, 500); // Longer debounce for charts
  
  const cachedChartData = useMemo(() => {
    const cached = dataCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    return state.chartData;
  }, [cacheKey, state.chartData]);
  
  const fetchChartData = useCallback(async () => {
    const cached = dataCache.get(cacheKey);
    if (cached && !isRefreshing) {
      return cached;
    }
    
    setIsRefreshing(true);
    try {
      await actions.fetchChartData(debouncedFilters);
      dataCache.set(cacheKey, state.chartData, 10 * 60 * 1000); // 10 minutes TTL for charts
    } finally {
      setIsRefreshing(false);
    }
  }, [cacheKey, debouncedFilters, actions, state.chartData, isRefreshing]);
  
  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);
  
  return {
    chartData: cachedChartData,
    loading: state.loading.charts || isRefreshing,
    error: state.errors.charts,
    refresh: fetchChartData,
    clearCache: () => dataCache.delete(cacheKey),
  };
};

// Optimized patients data hook with pagination
export const useOptimizedPatientsData = (params?: { 
  limit?: number; 
  offset?: number; 
  filters?: unknown;
  search?: string;
}) => {
  const { state, actions } = useDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const cacheKey = useMemo(() => {
    return `patients-${JSON.stringify(params || {})}`;
  }, [params]);
  
  const debouncedParams = useDebounce(params, 300);
  
  const cachedPatients = useMemo(() => {
    const cached = dataCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Apply client-side filtering if needed
    let filteredPatients = state.patients;
    
    if (debouncedParams?.search) {
      const searchTerm = debouncedParams.search.toLowerCase();
      filteredPatients = filteredPatients.filter(patient =>
        patient.name?.toLowerCase().includes(searchTerm) ||
        patient.status?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (debouncedParams?.filters) {
      // Apply additional filters
      Object.entries(debouncedParams.filters).forEach(([key, value]) => {
        if (value && Array.isArray(value) && value.length > 0) {
          filteredPatients = filteredPatients.filter(patient =>
            value.includes((patient as any)[key])
          );
        }
      });
    }
    
    // Apply pagination
    const limit = debouncedParams?.limit || 10;
    const offset = debouncedParams?.offset || 0;
    
    return {
      data: filteredPatients.slice(offset, offset + limit),
      total: filteredPatients.length,
      hasMore: offset + limit < filteredPatients.length,
    };
  }, [cacheKey, state.patients, debouncedParams]);
  
  const fetchPatients = useCallback(async () => {
    const cached = dataCache.get(cacheKey);
    if (cached && !isRefreshing) {
      return cached;
    }
    
    setIsRefreshing(true);
    try {
      await actions.fetchPatients(debouncedParams);
      // Cache will be updated in the memoized calculation
    } finally {
      setIsRefreshing(false);
    }
  }, [cacheKey, debouncedParams, actions, isRefreshing]);
  
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);
  
  return {
    patients: cachedPatients.data,
    total: cachedPatients.total,
    hasMore: cachedPatients.hasMore,
    loading: state.loading.patients || isRefreshing,
    error: state.errors.patients,
    refresh: fetchPatients,
    clearCache: () => dataCache.delete(cacheKey),
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef<number>(Date.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const renderTime = Date.now() - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} - Render #${renderCount.current} - ${renderTime}ms`);
    }
    
    startTime.current = Date.now();
  });
  
  return {
    renderCount: renderCount.current,
    logPerformance: (operation: string, duration: number) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} - ${operation}: ${duration}ms`);
      }
    },
  };
};

// Memory usage hook
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  
  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory);
      }
    };
    
    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return memoryInfo;
};

// Cache management
export const useCacheManager = () => {
  return {
    clearAll: () => dataCache.clear(),
    clearByPattern: (pattern: string) => {
      // Clear cache entries matching pattern
      const keys = Array.from((dataCache as any).cache.keys());
      keys.forEach(key => {
        if (key.includes(pattern)) {
          dataCache.delete(key);
        }
      });
    },
    getCacheSize: () => (dataCache as any).cache.size,
  };
};

export default {
  useOptimizedDashboardStats,
  useOptimizedChartData,
  useOptimizedPatientsData,
  useDebounce,
  useThrottle,
  usePerformanceMonitor,
  useMemoryMonitor,
  useCacheManager,
}; 