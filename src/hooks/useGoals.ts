import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as goalService from '@/services/rehabilitation-goals';
import * as categoryService from '@/services/goal-categories';
import { 
  BaseGoal, 
  GoalCategory,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalFilters
} from '@/types/goals';

// 쿼리 키 상수
export const GOAL_QUERY_KEYS = {
  all: ['goals'] as const,
  lists: () => [...GOAL_QUERY_KEYS.all, 'list'] as const,
  list: (patientId: string, filters?: GoalFilters) => 
    [...GOAL_QUERY_KEYS.lists(), patientId, filters] as const,
  details: () => [...GOAL_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...GOAL_QUERY_KEYS.details(), id] as const,
  hierarchy: (patientId: string) => [...GOAL_QUERY_KEYS.all, 'hierarchy', patientId] as const,
  statistics: (patientId: string) => [...GOAL_QUERY_KEYS.all, 'statistics', patientId] as const,
  categories: ['goal-categories'] as const,
} as const;

/**
 * 특정 환자의 목표 목록 조회
 */
export const useGoals = (patientId: string, filters?: GoalFilters) => {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.list(patientId, filters),
    queryFn: () => goalService.getGoalsByPatient(patientId, filters),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

/**
 * 특정 목표 상세 조회
 */
export const useGoal = (goalId: string) => {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.detail(goalId),
    queryFn: () => goalService.getGoalById(goalId),
    enabled: !!goalId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 목표 계층 구조 조회
 */
export const useGoalHierarchy = (patientId: string) => {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.hierarchy(patientId),
    queryFn: () => goalService.getGoalHierarchy(patientId),
    enabled: !!patientId,
    staleTime: 3 * 60 * 1000, // 3분
  });
};

/**
 * 목표 통계 조회
 */
export const useGoalStatistics = (patientId: string) => {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.statistics(patientId),
    queryFn: () => goalService.getGoalStatistics(patientId),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000, // 2분
  });
};

/**
 * 목표 생성
 */
export const useCreateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalData: CreateGoalRequest) => goalService.createGoal(goalData),
    onSuccess: (newGoal, variables) => {
      const patientId = variables.patient_id;
      
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.hierarchy(patientId) });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.statistics(patientId) });

      // 새 목표를 상세 쿼리 캐시에 추가
      queryClient.setQueryData(GOAL_QUERY_KEYS.detail(newGoal.id), newGoal);

      toast.success('목표가 성공적으로 생성되었습니다');
    },
    onError: (error: Error) => {
      toast.error(`목표 생성 실패: ${error.message}`);
    },
  });
};

/**
 * 목표 수정
 */
export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...goalData }: UpdateGoalRequest & { id: string }) => 
      goalService.updateGoal(id, goalData),
    onSuccess: (updatedGoal, variables) => {
      const goalId = variables.id;
      
      // 상세 쿼리 캐시 업데이트
      queryClient.setQueryData(GOAL_QUERY_KEYS.detail(goalId), updatedGoal);
      
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ 
        queryKey: GOAL_QUERY_KEYS.hierarchy(updatedGoal.patient_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: GOAL_QUERY_KEYS.statistics(updatedGoal.patient_id) 
      });

      toast.success('목표가 성공적으로 수정되었습니다');
    },
    onError: (error: Error) => {
      toast.error(`목표 수정 실패: ${error.message}`);
    },
  });
};

/**
 * 목표 삭제
 */
export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: string) => goalService.deleteGoal(goalId),
    onSuccess: (_, goalId) => {
      // 상세 쿼리 캐시에서 제거
      queryClient.removeQueries({ queryKey: GOAL_QUERY_KEYS.detail(goalId) });
      
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });

      toast.success('목표가 성공적으로 삭제되었습니다');
    },
    onError: (error: Error) => {
      toast.error(`목표 삭제 실패: ${error.message}`);
    },
  });
};

/**
 * 목표 상태 변경
 */
export const useUpdateGoalStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, status }: { goalId: string; status: string }) => 
      goalService.updateGoalStatus(goalId, status),
    onSuccess: (updatedGoal, variables) => {
      const goalId = variables.goalId;
      
      // 상세 쿼리 캐시 업데이트
      queryClient.setQueryData(GOAL_QUERY_KEYS.detail(goalId), updatedGoal);
      
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ 
        queryKey: GOAL_QUERY_KEYS.hierarchy(updatedGoal.patient_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: GOAL_QUERY_KEYS.statistics(updatedGoal.patient_id) 
      });

      toast.success('목표 상태가 변경되었습니다');
    },
    onError: (error: Error) => {
      toast.error(`상태 변경 실패: ${error.message}`);
    },
  });
};

/**
 * 목표 카테고리 목록 조회
 */
export const useGoalCategories = () => {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.categories,
    queryFn: () => categoryService.getGoalCategories(),
    staleTime: 30 * 60 * 1000, // 30분 (카테고리는 자주 변경되지 않음)
  });
};

/**
 * 카테고리 생성
 */
export const useCreateGoalCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryData: Omit<GoalCategory, 'id' | 'created_at' | 'updated_at'>) => 
      categoryService.createGoalCategory(categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.categories });
      toast.success('카테고리가 생성되었습니다');
    },
    onError: (error: Error) => {
      toast.error(`카테고리 생성 실패: ${error.message}`);
    },
  });
}; 