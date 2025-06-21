// Goal Categories related React Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getGoalCategories,
  getGoalCategory,
  createGoalCategory,
  updateGoalCategory,
  deleteGoalCategory,
  restoreGoalCategory,
  getGoalCategoriesWithCounts,
  getGoalsByCategory,
  getCategoryStatistics,
  bulkUpdateGoalCategories,
  getCategoryByName,
  ensureDefaultCategories,
} from '@/services/goal-categories'

// Temporary types until Supabase types are properly generated
type TablesInsert = Record<string, unknown>
type TablesUpdate = Record<string, unknown>

// Query keys
export const goalCategoryKeys = {
  all: ['goal-categories'] as const,
  lists: () => [...goalCategoryKeys.all, 'list'] as const,
  list: (includeInactive?: boolean) => [...goalCategoryKeys.lists(), { includeInactive }] as const,
  withCounts: () => [...goalCategoryKeys.all, 'with-counts'] as const,
  details: () => [...goalCategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalCategoryKeys.details(), id] as const,
  goals: () => [...goalCategoryKeys.all, 'goals'] as const,
  goalsByCategory: (categoryId: string, filters?: Record<string, unknown>) => 
    [...goalCategoryKeys.goals(), categoryId, filters] as const,
  statistics: () => [...goalCategoryKeys.all, 'statistics'] as const,
  stats: (categoryId?: string) => [...goalCategoryKeys.statistics(), categoryId] as const,
}

// Get all goal categories
export function useGoalCategories(includeInactive = false) {
  return useQuery({
    queryKey: goalCategoryKeys.list(includeInactive),
    queryFn: () => getGoalCategories(includeInactive),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get goal categories with goal counts
export function useGoalCategoriesWithCounts() {
  return useQuery({
    queryKey: goalCategoryKeys.withCounts(),
    queryFn: getGoalCategoriesWithCounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get a specific goal category
export function useGoalCategory(id: string) {
  return useQuery({
    queryKey: goalCategoryKeys.detail(id),
    queryFn: () => getGoalCategory(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get goals by category
export function useGoalsByCategory(
  categoryId: string,
  filters?: {
    patientId?: string
    status?: string
    limit?: number
    offset?: number
  }
) {
  return useQuery({
    queryKey: goalCategoryKeys.goalsByCategory(categoryId, filters),
    queryFn: () => getGoalsByCategory(categoryId, filters),
    enabled: !!categoryId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

// Get category statistics
export function useCategoryStatistics(categoryId?: string) {
  return useQuery({
    queryKey: goalCategoryKeys.stats(categoryId),
    queryFn: () => getCategoryStatistics(categoryId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Create goal category mutation
export function useCreateGoalCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (category: TablesInsert) => 
      createGoalCategory(category),
    onSuccess: (data) => {
      // Add the new category to the cache
      queryClient.setQueryData(goalCategoryKeys.detail(data.id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: goalCategoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalCategoryKeys.withCounts() })
      queryClient.invalidateQueries({ queryKey: goalCategoryKeys.statistics() })
    },
  })
}

// Update goal category mutation
export function useUpdateGoalCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate }) =>
      updateGoalCategory(id, updates),
    onSuccess: (data) => {
      // Update the specific category in cache
      queryClient.setQueryData(goalCategoryKeys.detail(data.id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: goalCategoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalCategoryKeys.withCounts() })
      queryClient.invalidateQueries({ queryKey: goalCategoryKeys.statistics() })
    },
  })
}

// Delete goal category mutation
export function useDeleteGoalCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, hardDelete = false }: { id: string; hardDelete?: boolean }) =>
      deleteGoalCategory(id, hardDelete),
    onSuccess: (_, { id, hardDelete }) => {
      if (hardDelete) {
        // Remove from cache completely
        queryClient.removeQueries({ queryKey: goalCategoryKeys.detail(id) })
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: goalCategoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalCategoryKeys.withCounts() })
      queryClient.invalidateQueries({ queryKey: goalCategoryKeys.statistics() })
    },
  })
}

// Restore goal category mutation
export function useRestoreGoalCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: restoreGoalCategory,
    onSuccess: (data) => {
      // Update the specific category in cache
      queryClient.setQueryData(goalCategoryKeys.detail(data.id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: goalCategoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalCategoryKeys.withCounts() })
      queryClient.invalidateQueries({ queryKey: goalCategoryKeys.statistics() })
    },
  })
}

// Bulk update goal categories mutation
export function useBulkUpdateGoalCategories() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bulkUpdateGoalCategories,
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: goalCategoryKeys.all })
      queryClient.invalidateQueries({ queryKey: ['rehabilitation-goals'] })
    },
  })
}

// Ensure default categories mutation
export function useEnsureDefaultCategories() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ensureDefaultCategories,
    onSuccess: () => {
      // Invalidate all category queries
      queryClient.invalidateQueries({ queryKey: goalCategoryKeys.all })
    },
  })
}

// Get category by name query
export function useCategoryByName(name: string) {
  return useQuery({
    queryKey: [...goalCategoryKeys.all, 'by-name', name],
    queryFn: () => getCategoryByName(name),
    enabled: !!name,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Prefetch functions for performance optimization
export function usePrefetchGoalCategories() {
  const queryClient = useQueryClient()

  const prefetchCategories = (includeInactive = false) => {
    queryClient.prefetchQuery({
      queryKey: goalCategoryKeys.list(includeInactive),
      queryFn: () => getGoalCategories(includeInactive),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })
  }

  const prefetchCategoriesWithCounts = () => {
    queryClient.prefetchQuery({
      queryKey: goalCategoryKeys.withCounts(),
      queryFn: getGoalCategoriesWithCounts,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  const prefetchCategoryStatistics = (categoryId?: string) => {
    queryClient.prefetchQuery({
      queryKey: goalCategoryKeys.stats(categoryId),
      queryFn: () => getCategoryStatistics(categoryId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  return {
    prefetchCategories,
    prefetchCategoriesWithCounts,
    prefetchCategoryStatistics,
  }
}

// Utility hook for category management workflow
export function useCategoryManagement() {
  const categories = useGoalCategories()
  const categoriesWithCounts = useGoalCategoriesWithCounts()
  const createCategory = useCreateGoalCategory()
  const updateCategory = useUpdateGoalCategory()
  const deleteCategory = useDeleteGoalCategory()
  const restoreCategory = useRestoreGoalCategory()
  const bulkUpdate = useBulkUpdateGoalCategories()
  const ensureDefaults = useEnsureDefaultCategories()
  const statistics = useCategoryStatistics()

  return {
    // Data
    categories: categories.data,
    categoriesWithCounts: categoriesWithCounts.data,
    statistics: statistics.data,
    
    // Loading states
    isLoadingCategories: categories.isLoading,
    isLoadingCounts: categoriesWithCounts.isLoading,
    isLoadingStats: statistics.isLoading,
    isCreating: createCategory.isPending,
    isUpdating: updateCategory.isPending,
    isDeleting: deleteCategory.isPending,
    isRestoring: restoreCategory.isPending,
    isBulkUpdating: bulkUpdate.isPending,
    isEnsuringDefaults: ensureDefaults.isPending,
    
    // Error states
    categoriesError: categories.error,
    countsError: categoriesWithCounts.error,
    statsError: statistics.error,
    createError: createCategory.error,
    updateError: updateCategory.error,
    deleteError: deleteCategory.error,
    restoreError: restoreCategory.error,
    bulkUpdateError: bulkUpdate.error,
    ensureDefaultsError: ensureDefaults.error,
    
    // Actions
    createCategory: createCategory.mutate,
    updateCategory: updateCategory.mutate,
    deleteCategory: deleteCategory.mutate,
    restoreCategory: restoreCategory.mutate,
    bulkUpdateCategories: bulkUpdate.mutate,
    ensureDefaultCategories: ensureDefaults.mutate,
    
    // Refetch functions
    refetchCategories: categories.refetch,
    refetchCounts: categoriesWithCounts.refetch,
    refetchStatistics: statistics.refetch,
  }
}

// Hook for category selection and filtering
export function useCategoryFilters() {
  const categories = useGoalCategories()
  
  const getCategoryOptions = () => {
    return categories.data?.map(cat => ({
      value: cat.id,
      label: cat.name,
      color: cat.color,
      icon: cat.icon,
    })) || []
  }
  
  const getCategoryById = (id: string) => {
    return categories.data?.find(cat => cat.id === id)
  }
  
  const getCategoriesByIds = (ids: string[]) => {
    return categories.data?.filter(cat => ids.includes(cat.id)) || []
  }
  
  return {
    categories: categories.data,
    isLoading: categories.isLoading,
    error: categories.error,
    getCategoryOptions,
    getCategoryById,
    getCategoriesByIds,
    refetch: categories.refetch,
  }
} 