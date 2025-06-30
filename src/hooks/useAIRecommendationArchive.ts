import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AIRecommendationArchiveService } from '@/services/ai-recommendation-archive';
import type { ArchivedRecommendation } from '@/services/ai-recommendation-archive';

/**
 * 아카이빙된 AI 추천 목록 조회 훅
 */
export const useArchivedRecommendations = ({
  limit = 50,
  offset = 0,
  diagnosisCategory,
  ageRange,
  enabled = true
}: {
  limit?: number;
  offset?: number;
  diagnosisCategory?: string;
  ageRange?: string;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ['archived-recommendations', { limit, offset, diagnosisCategory, ageRange }],
    queryFn: () => AIRecommendationArchiveService.getArchivedRecommendations({
      limit,
      offset,
      diagnosisCategory,
      ageRange
    }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 아카이빙 통계 조회 훅
 */
export const useArchiveStatistics = (enabled = true) => {
  return useQuery({
    queryKey: ['archive-statistics'],
    queryFn: () => AIRecommendationArchiveService.getArchiveStatistics(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10분
    cacheTime: 30 * 60 * 1000, // 30분
  });
};

/**
 * 아카이빙 인사이트 훅 (통계 데이터 가공)
 */
export const useArchiveInsights = (enabled = true) => {
  const { data: stats, ...rest } = useArchiveStatistics(enabled);

  const insights = stats ? {
    // 가장 많이 아카이빙된 진단 카테고리
    topDiagnosis: Object.entries(stats.byDiagnosis)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null,
    
    // 가장 많이 아카이빙된 연령대
    topAgeRange: Object.entries(stats.byAgeRange)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null,
    
    // 최근 7일 평균 아카이빙 수
    recentAverage: stats.recentTrends.length > 0 
      ? Math.round(stats.recentTrends.reduce((sum, trend) => sum + trend.count, 0) / stats.recentTrends.length)
      : 0,
    
    // 진단 분포 (백분율)
    diagnosisDistribution: Object.entries(stats.byDiagnosis).map(([diagnosis, count]) => ({
      diagnosis,
      count,
      percentage: Math.round((count / stats.totalArchived) * 100)
    })).sort((a, b) => b.count - a.count),
    
    // 연령대 분포 (백분율)
    ageDistribution: Object.entries(stats.byAgeRange).map(([ageRange, count]) => ({
      ageRange,
      count,
      percentage: Math.round((count / stats.totalArchived) * 100)
    })).sort((a, b) => b.count - a.count)
  } : null;

  return {
    data: insights,
    rawStats: stats,
    ...rest
  };
};

/**
 * 아카이빙 데이터 새로고침 훅
 */
export const useRefreshArchiveData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // 관련된 모든 쿼리 무효화
      await queryClient.invalidateQueries({ queryKey: ['archived-recommendations'] });
      await queryClient.invalidateQueries({ queryKey: ['archive-statistics'] });
      return true;
    },
    onSuccess: () => {
      console.log('✅ 아카이빙 데이터 새로고침 완료');
    },
    onError: (error) => {
      console.error('❌ 아카이빙 데이터 새로고침 실패:', error);
    }
  });
};

/**
 * 아카이빙 데이터 내보내기 훅
 */
export const useExportArchiveData = () => {
  return useMutation({
    mutationFn: async ({
      diagnosisCategory,
      ageRange,
      format = 'csv'
    }: {
      diagnosisCategory?: string;
      ageRange?: string;
      format?: 'csv' | 'json';
    }) => {
      // 모든 데이터 조회 (페이지네이션 없이)
      const { data } = await AIRecommendationArchiveService.getArchivedRecommendations({
        limit: 10000, // 충분히 큰 값
        diagnosisCategory,
        ageRange
      });

      if (format === 'csv') {
        return convertToCSV(data);
      } else {
        return JSON.stringify(data, null, 2);
      }
    },
    onSuccess: (data, variables) => {
      // 파일 다운로드
      const blob = new Blob([data], { 
        type: variables.format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-recommendation-archive-${new Date().toISOString().split('T')[0]}.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ 아카이빙 데이터 내보내기 완료');
    },
    onError: (error) => {
      console.error('❌ 아카이빙 데이터 내보내기 실패:', error);
    }
  });
};

/**
 * CSV 변환 유틸리티
 */
function convertToCSV(data: ArchivedRecommendation[]): string {
  if (data.length === 0) return '';

  const headers = [
    'ID',
    '아카이빙 날짜',
    '진단 카테고리',
    '연령대',
    '성별',
    '아카이빙 사유',
    '목표 제목',
    '목표 목적',
    '6개월 목표'
  ];

  const rows = data.map(item => {
    const firstGoal = item.archived_goal_data[0];
    return [
      item.id,
      new Date(item.archived_at).toLocaleDateString('ko-KR'),
      item.diagnosis_category || '',
      item.patient_age_range || '',
      item.patient_gender || '',
      item.archived_reason === 'goal_not_selected' ? '목표 미선택' : '추천 거절',
      firstGoal?.title || '',
      firstGoal?.purpose || '',
      firstGoal?.sixMonthGoal || ''
    ];
  });

  return [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

/**
 * 아카이빙된 목표 삭제 훅
 */
export const useDeleteArchivedGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (archiveId: string) => {
      const result = await AIRecommendationArchiveService.deleteArchivedGoal(archiveId);
      if (!result.success) {
        throw new Error(result.error || '삭제에 실패했습니다.');
      }
      return result;
    },
    onSuccess: () => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['archived-recommendations'] });
      alert('아카이빙된 목표가 삭제되었습니다.');
    },
    onError: (error) => {
      console.error('삭제 실패:', error);
      alert(error instanceof Error ? error.message : '삭제에 실패했습니다.');
    }
  });
};

/**
 * 목표 완료 이력 조회 훅
 */
export const useGoalCompletionHistory = (archivedItem: ArchivedRecommendation | null) => {
  return useQuery({
    queryKey: ['goal-completion-history', archivedItem?.id],
    queryFn: () => {
      if (!archivedItem) throw new Error('No archived item');
      return AIRecommendationArchiveService.getGoalCompletionHistory(archivedItem);
    },
    enabled: !!archivedItem,
    staleTime: 5 * 60 * 1000, // 5분
  });
}; 