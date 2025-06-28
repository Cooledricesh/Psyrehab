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
  completion_rate?: number | null; // 완료된 목표의 달성률
  completion_date?: string | null; // 완료 날짜
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
   * 환자 프로필과 유사한 아카이빙된 목표 검색
   */
  static async searchArchivedGoalsByProfile({
    ageRange,
    diagnosisCategory,
    gender,
    limit = 10
  }: {
    ageRange?: string;
    diagnosisCategory?: string;
    gender?: string;
    limit?: number;
  }): Promise<ArchivedRecommendation[]> {
    console.log('🔍 아카이빙된 목표 검색:', { ageRange, diagnosisCategory, gender });

    let query = supabase
      .from('ai_recommendation_archive')
      .select('*')
      .in('archived_reason', ['goal_not_selected', 'successfully_completed']); // 선택되지 않은 목표와 성공적으로 완료된 목표 모두 포함

    // 필터 적용
    if (ageRange) {
      query = query.eq('patient_age_range', ageRange);
    }
    if (diagnosisCategory) {
      query = query.eq('diagnosis_category', diagnosisCategory);
    }
    if (gender) {
      query = query.eq('patient_gender', gender);
    }

    // 성공적으로 완료된 목표를 우선으로, 그 다음 최신 항목 순으로 정렬
    const { data, error } = await query
      .order('archived_reason', { ascending: false }) // successfully_completed가 먼저 오도록
      .order('completion_rate', { ascending: false, nullsFirst: false }) // 완료율 높은 순
      .order('archived_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ 아카이빙된 목표 검색 실패:', error);
      throw error;
    }

    console.log(`✅ ${data?.length || 0}개의 아카이빙된 목표 검색 완료`);
    return data || [];
  }

  /**
   * 완료된 목표를 아카이빙
   */
  static async archiveCompletedGoal(goalId: string): Promise<ArchivedRecommendation | null> {
    console.log('🎯 완료된 목표 아카이빙 시작:', goalId);

    try {
      // 1. 완료된 6개월 목표와 관련 데이터 조회
      const { data: sixMonthGoal, error: goalError } = await supabase
        .from('rehabilitation_goals')
        .select(`
          *,
          patient:patients!patient_id (
            birth_date,
            gender,
            diagnosis
          )
        `)
        .eq('id', goalId)
        .eq('goal_type', 'six_month')
        .eq('status', 'completed')
        .single();

      if (goalError || !sixMonthGoal) {
        console.error('❌ 목표 조회 실패:', goalError);
        return null;
      }

      // 2. 월간 목표들 조회
      const { data: monthlyGoals } = await supabase
        .from('rehabilitation_goals')
        .select('*')
        .eq('parent_goal_id', goalId)
        .eq('goal_type', 'monthly')
        .order('sequence_number');

      // 3. 주간 목표들 조회
      const monthlyGoalIds = monthlyGoals?.map(g => g.id) || [];
      const { data: weeklyGoals } = await supabase
        .from('rehabilitation_goals')
        .select('*')
        .in('parent_goal_id', monthlyGoalIds)
        .eq('goal_type', 'weekly')
        .order('sequence_number');

      // 4. 아카이빙 데이터 구조 생성
      const archivedGoalData: ArchivedGoalData = {
        plan_number: 1,
        title: sixMonthGoal.title,
        purpose: sixMonthGoal.description || '성공적으로 완료된 재활 목표',
        sixMonthGoal: sixMonthGoal.title,
        monthlyGoals: monthlyGoals?.map(mg => ({
          month: mg.sequence_number,
          goal: mg.title
        })) || [],
        weeklyPlans: weeklyGoals?.map(wg => {
          // 해당 주간 목표의 월간 목표 찾기
          const parentMonthly = monthlyGoals?.find(mg => mg.id === wg.parent_goal_id);
          return {
            week: wg.sequence_number,
            month: parentMonthly?.sequence_number || 1,
            plan: wg.title
          };
        }) || []
      };

      // 5. 환자 정보 처리
      const patient = sixMonthGoal.patient;
      const patientAge = patient?.birth_date 
        ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear()
        : undefined;

      // 6. 아카이빙 실행
      const archiveData: any = {
        original_recommendation_id: sixMonthGoal.source_recommendation_id,
        original_assessment_id: sixMonthGoal.source_recommendation_id || crypto.randomUUID(),
        archived_goal_data: [archivedGoalData],
        patient_age_range: this.getAgeRange(patientAge),
        patient_gender: patient?.gender || null,
        diagnosis_category: patient?.diagnosis ? this.simplifyDiagnosis(patient.diagnosis) : null,
        archived_reason: 'successfully_completed'
      };
      
      // 컬럼이 있을 때만 추가 (마이그레이션 실행 후)
      if (sixMonthGoal.actual_completion_rate !== undefined) {
        archiveData.completion_rate = sixMonthGoal.actual_completion_rate || 100;
      }
      if (sixMonthGoal.completion_date) {
        archiveData.completion_date = sixMonthGoal.completion_date;
      }

      const { data: archived, error: archiveError } = await supabase
        .from('ai_recommendation_archive')
        .insert(archiveData)
        .select()
        .single();

      if (archiveError) {
        console.error('❌ 아카이빙 실패:', archiveError);
        throw archiveError;
      }

      console.log('✅ 완료된 목표 아카이빙 성공:', archived.id);
      return archived;

    } catch (error) {
      console.error('❌ 완료된 목표 아카이빙 중 오류:', error);
      return null;
    }
  }

  /**
   * 진단명 간소화 (헬퍼 메서드)
   */
  private static simplifyDiagnosis(diagnosis: string): string {
    const lowerDiagnosis = diagnosis.toLowerCase();
    
    const categoryMap: Record<string, string[]> = {
      'cognitive_disorder': ['치매', '인지', '기억', '알츠하이머', 'dementia', 'cognitive'],
      'mood_disorder': ['우울', '조울', '기분', 'depression', 'bipolar', 'mood'],
      'anxiety_disorder': ['불안', '공황', 'anxiety', 'panic'],
      'psychotic_disorder': ['조현병', '정신분열', 'schizophrenia', 'psychotic'],
      'substance_disorder': ['중독', '알코올', '약물', 'addiction', 'substance'],
      'developmental_disorder': ['자폐', '발달', 'autism', 'developmental'],
      'neurological_disorder': ['뇌졸중', '파킨슨', '뇌손상', 'stroke', 'parkinson', 'neurological'],
      'personality_disorder': ['성격', '인격', 'personality'],
      'eating_disorder': ['섭식', '식이', 'eating'],
      'trauma_disorder': ['외상', '트라우마', 'trauma', 'ptsd']
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => lowerDiagnosis.includes(keyword))) {
        return category;
      }
    }

    return 'other_disorder';
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
        byDiagnosis: this.groupByField(diagnosisStats || [], 'diagnosis_category'),
        byAgeRange: this.groupByField(ageStats || [], 'patient_age_range'),
        recentTrends: this.calculateDailyTrends(recentData || [])
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
      if (age >= Number(min) && age <= Number(max)) {
        return range as string;
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