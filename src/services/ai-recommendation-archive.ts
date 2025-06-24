import { supabase } from '@/lib/supabase';

// 타입 정의
export interface ArchivedGoalData {
  plan_number: number;
  title: string;
  purpose: string;
  sixMonthGoal: string;
  monthlyGoals: Array<{
    month: number;
    goal: string;
  }>;
  weeklyPlans: Array<{
    week: number;
    month: number;
    plan: string;
  }>;
}

export interface ArchiveRecommendationParams {
  originalRecommendationId: string;
  originalAssessmentId: string;
  unselectedGoals: ArchivedGoalData[];
  patientAge?: number;
  patientGender?: string;
  diagnosisCategory?: string;
  archivedReason?: string;
}

export interface ArchivedRecommendation {
  id: string;
  original_recommendation_id: string | null;
  original_assessment_id: string;
  archived_goal_data: ArchivedGoalData[];
  patient_age_range: string | null;
  patient_gender: string | null;
  diagnosis_category: string | null;
  archived_at: string;
  archived_reason: string;
  created_at: string;
  updated_at: string;
}

/**
 * AI 추천 아카이빙 서비스
 */
export class AIRecommendationArchiveService {
  /**
   * 선택되지 않은 AI 추천 목표들을 아카이빙합니다.
   */
  static async archiveUnselectedGoals({
    originalRecommendationId,
    originalAssessmentId,
    unselectedGoals,
    patientAge,
    patientGender,
    diagnosisCategory,
    archivedReason = 'goal_not_selected'
  }: ArchiveRecommendationParams): Promise<ArchivedRecommendation[]> {
    console.log('🗄️ AI 추천 아카이빙 시작:', {
      originalRecommendationId,
      unselectedGoalsCount: unselectedGoals.length
    });

    const archivedItems: ArchivedRecommendation[] = [];

    // 각 선택되지 않은 목표를 개별적으로 아카이빙
    for (const goal of unselectedGoals) {
      try {
        const archiveData = {
          original_recommendation_id: originalRecommendationId,
          original_assessment_id: originalAssessmentId,
          archived_goal_data: [goal], // 단일 목표로 아카이빙
          patient_age_range: this.getAgeRange(patientAge),
          patient_gender: patientGender || null,
          diagnosis_category: diagnosisCategory || null,
          archived_reason: archivedReason
        };

        const { data, error } = await supabase
          .from('ai_recommendation_archive')
          .insert(archiveData)
          .select()
          .single();

        if (error) {
          console.error('❌ 목표 아카이빙 실패:', error);
          throw error;
        }

        console.log('✅ 목표 아카이빙 성공:', data.id);
        archivedItems.push(data);

      } catch (error) {
        console.error('❌ 개별 목표 아카이빙 실패:', error);
        // 개별 실패는 전체 프로세스를 중단하지 않음
      }
    }

    console.log(`✅ 총 ${archivedItems.length}개 목표 아카이빙 완료`);
    return archivedItems;
  }

  /**
   * 전체 AI 추천을 거절했을 때 아카이빙
   */
  static async archiveRejectedRecommendation({
    originalRecommendationId,
    originalAssessmentId,
    allGoals,
    patientAge,
    patientGender,
    diagnosisCategory
  }: Omit<ArchiveRecommendationParams, 'unselectedGoals' | 'archivedReason'> & {
    allGoals: ArchivedGoalData[];
  }): Promise<ArchivedRecommendation[]> {
    return this.archiveUnselectedGoals({
      originalRecommendationId,
      originalAssessmentId,
      unselectedGoals: allGoals,
      patientAge,
      patientGender,
      diagnosisCategory,
      archivedReason: 'recommendation_rejected'
    });
  }

  /**
   * 아카이빙된 추천 목록 조회 (통계 분석용)
   */
  static async getArchivedRecommendations({
    limit = 100,
    offset = 0,
    diagnosisCategory,
    ageRange
  }: {
    limit?: number;
    offset?: number;
    diagnosisCategory?: string;
    ageRange?: string;
  } = {}): Promise<{
    data: ArchivedRecommendation[];
    count: number;
  }> {
    let query = supabase
      .from('ai_recommendation_archive')
      .select('*', { count: 'exact' });

    // 필터 적용
    if (diagnosisCategory) {
      query = query.eq('diagnosis_category', diagnosisCategory);
    }
    if (ageRange) {
      query = query.eq('patient_age_range', ageRange);
    }

    const { data, error, count } = await query
      .order('archived_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ 아카이빙된 추천 조회 실패:', error);
      throw error;
    }

    return {
      data: data || [],
      count: count || 0
    };
  }

  /**
   * 아카이빙 통계 조회
   */
  static async getArchiveStatistics(): Promise<{
    totalArchived: number;
    byDiagnosis: Record<string, number>;
    byAgeRange: Record<string, number>;
    recentTrends: Array<{
      date: string;
      count: number;
    }>;
  }> {
    try {
      // 전체 아카이빙 수
      const { count: totalArchived } = await supabase
        .from('ai_recommendation_archive')
        .select('*', { count: 'exact', head: true });

      // 진단별 통계
      const { data: diagnosisStats } = await supabase
        .from('ai_recommendation_archive')
        .select('diagnosis_category')
        .not('diagnosis_category', 'is', null);

      // 연령대별 통계
      const { data: ageStats } = await supabase
        .from('ai_recommendation_archive')
        .select('patient_age_range')
        .not('patient_age_range', 'is', null);

      // 최근 7일 트렌드
      const { data: recentData } = await supabase
        .from('ai_recommendation_archive')
        .select('archived_at')
        .gte('archived_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      return {
        totalArchived: totalArchived || 0,
        byDiagnosis: this.groupByField(diagnosisStats, 'diagnosis_category'),
        byAgeRange: this.groupByField(ageStats, 'patient_age_range'),
        recentTrends: this.calculateDailyTrends(recentData)
      };

    } catch (error) {
      console.error('❌ 아카이빙 통계 조회 실패:', error);
      throw error;
    }
  }

  // 유틸리티 메서드들

  /**
   * 나이를 연령대로 변환
   */
  private static getAgeRange(age?: number): string | null {
    if (!age) return null;
    
    const ranges = [
      [0, 19, '0-19'],
      [20, 29, '20-29'],
      [30, 39, '30-39'],
      [40, 49, '40-49'],
      [50, 59, '50-59'],
      [60, 69, '60-69'],
      [70, 100, '70+']
    ];

    for (const [min, max, range] of ranges) {
      if (age >= min && age <= max) {
        return range;
      }
    }
    
    return '기타';
  }


  /**
   * 필드별 그룹화
   */
  private static groupByField(data: any[], field: string): Record<string, number> {
    const result: Record<string, number> = {};
    
    data?.forEach(item => {
      const value = item[field];
      if (value) {
        result[value] = (result[value] || 0) + 1;
      }
    });

    return result;
  }

  /**
   * 일별 트렌드 계산
   */
  private static calculateDailyTrends(data: any[]): Array<{ date: string; count: number }> {
    const dailyCounts: Record<string, number> = {};
    
    data?.forEach(item => {
      const date = new Date(item.archived_at).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

// 타입 재내보내기 (모듈 캐시 문제 해결용)
export type { ArchivedRecommendation, ArchivedGoalData, ArchiveRecommendationParams }; 