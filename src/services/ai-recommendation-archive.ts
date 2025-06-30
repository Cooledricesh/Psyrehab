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
  completion_rate?: number | null; // 개별 완료된 목표의 달성률
  completion_date?: string | null; // 완료 날짜
  usage_count?: number; // 사용한 사람 수
  completion_count?: number; // 완료한 사람 수
  average_completion_rate?: number; // 여러 명이 사용한 경우 평균 달성률
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
        // 목표 제목에서 불필요한 말머리 제거
        const cleanedGoal = {
          ...goal,
          title: goal.title?.replace(/^목표\s*\d+[:\.]?\s*/i, '').trim() || goal.title
        };
        
        const archiveData = {
          original_recommendation_id: originalRecommendationId,
          original_assessment_id: originalAssessmentId,
          archived_goal_data: [cleanedGoal], // 단일 목표로 아카이빙
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

    // 각 아카이빙된 목표의 사용/완료 횟수 계산
    const enrichedData = await Promise.all((data || []).map(async (item) => {
      const usageStats = await this.getGoalUsageStats(item);
      return {
        ...item,
        usage_count: usageStats.usage_count,
        completion_count: usageStats.completion_count,
        // 여러 명이 사용한 경우 평균 달성률로 표시
        average_completion_rate: usageStats.average_completion_rate
      };
    }));

    return {
      data: enrichedData,
      count: count || 0
    };
  }

  /**
   * 특정 아카이빙된 목표의 사용 통계 조회
   */
  static async getGoalUsageStats(archivedItem: ArchivedRecommendation): Promise<{
    usage_count: number;
    completion_count: number;
    average_completion_rate?: number;
  }> {
    try {
      // 첫 번째 목표의 제목과 6개월 목표 추출
      const firstGoal = archivedItem.archived_goal_data?.[0];
      const goalTitle = firstGoal?.title;
      const sixMonthGoal = firstGoal?.sixMonthGoal;

      console.log('📊 getGoalUsageStats 디버깅:', {
        goalTitle,
        sixMonthGoal,
        recommendation_id: archivedItem.original_recommendation_id,
        archived_at: archivedItem.archived_at,
        archived_reason: archivedItem.archived_reason
      });

      // 선택되지 않은 목표는 사용 통계가 없음
      if (archivedItem.archived_reason === 'goal_not_selected') {
        return { usage_count: 0, completion_count: 0 };
      }

      if (!goalTitle && !sixMonthGoal && !archivedItem.original_recommendation_id) {
        return { usage_count: 0, completion_count: 0 };
      }

      // rehabilitation_goals 테이블에서 관련 목표 조회
      // 쿼리 빌더를 사용하여 안전하게 처리
      const query = supabase
        .from('rehabilitation_goals')
        .select('patient_id, status')
        .eq('goal_type', 'six_month');

      // OR 조건을 수동으로 구성
      const orConditions = [];
      
      if (archivedItem.original_recommendation_id) {
        orConditions.push({ source_recommendation_id: archivedItem.original_recommendation_id });
      }
      
      // 제목으로 매칭하는 별도 쿼리들
      const titleQueries = [];
      
      // 6개월 목표 제목으로 검색 (우선순위)
      if (sixMonthGoal) {
        titleQueries.push(
          supabase
            .from('rehabilitation_goals')
            .select('patient_id, status')
            .eq('goal_type', 'six_month')
            .eq('title', sixMonthGoal)
        );
      }
      
      
      // 주간 목표로도 검색하여 해당 목표의 6개월 부모 목표 찾기
      if (goalTitle) {
        titleQueries.push(
          supabase
            .from('rehabilitation_goals')
            .select('patient_id, status, parent_goal_id, goal_type')
            .eq('goal_type', 'weekly')
            .eq('title', goalTitle)
        );
      }

      // 모든 쿼리 실행
      const results = [];
      
      // source_recommendation_id로 조회
      if (archivedItem.original_recommendation_id) {
        const { data, error } = await query.eq('source_recommendation_id', archivedItem.original_recommendation_id);
        if (!error && data) results.push(...data);
      }
      
      // 제목으로 조회
      for (const titleQuery of titleQueries) {
        const { data, error } = await titleQuery;
        if (!error && data) {
          results.push(...data);
        }
      }
      
      // 주간 목표가 검색된 경우, 해당하는 6개월 목표도 찾기
      const weeklyGoals = results.filter(g => g.goal_type === 'weekly');
      if (weeklyGoals.length > 0) {
        for (const weeklyGoal of weeklyGoals) {
          if (weeklyGoal.parent_goal_id) {
            // 월간 목표 찾기
            const { data: monthlyGoal } = await supabase
              .from('rehabilitation_goals')
              .select('parent_goal_id')
              .eq('id', weeklyGoal.parent_goal_id)
              .single();
            
            if (monthlyGoal?.parent_goal_id) {
              // 6개월 목표 찾기
              const { data: sixMonthGoal } = await supabase
                .from('rehabilitation_goals')
                .select('patient_id, status')
                .eq('id', monthlyGoal.parent_goal_id)
                .single();
              
              if (sixMonthGoal) {
                results.push(sixMonthGoal);
              }
            }
          }
        }
      }

      // 6개월 목표만 필터링하고 중복 제거
      const sixMonthGoals = results.filter(g => !g.goal_type || g.goal_type === 'six_month');
      
      const goalsMap = new Map();
      sixMonthGoals.forEach(goal => {
        const key = `${goal.patient_id}-${goal.status}`;
        if (!goalsMap.has(key)) {
          goalsMap.set(key, goal);
        }
      });
      
      const goals = Array.from(goalsMap.values());


      // 환자 상태 확인을 위해 환자 정보 조회
      const patientIds = [...new Set(goals?.map(g => g.patient_id) || [])];
      let activePatientIds = [];
      
      if (patientIds.length > 0) {
        const { data: patients } = await supabase
          .from('patients')
          .select('id')
          .in('id', patientIds);
        
        activePatientIds = patients?.map(p => p.id) || [];
      }
      
      // 실제로 존재하는 환자만 카운트
      const validGoals = goals?.filter(g => activePatientIds.includes(g.patient_id)) || [];
      const uniquePatients = new Set(validGoals.map(g => g.patient_id));
      const completedPatients = new Set(
        validGoals.filter(g => g.status === 'completed').map(g => g.patient_id)
      );

      console.log('📊 목표 사용 통계:', {
        totalGoals: goals.length,
        uniquePatientsCount: uniquePatients.size,
        completedPatientsCount: completedPatients.size,
        goalStatuses: goals.map(g => ({ patient_id: g.patient_id, status: g.status }))
      });

      // 완료된 목표들의 실제 달성률 계산
      let averageCompletionRate = undefined;
      if (completedPatients.size > 0) {
        // 완료된 환자들의 목표 달성률 조회
        const completionRates = [];
        
        // 각 환자별로 해당 목표의 달성률을 개별 조회
        for (const patientId of completedPatients) {
          const goalQuery = supabase
            .from('rehabilitation_goals')
            .select('actual_completion_rate')
            .eq('patient_id', patientId)
            .eq('goal_type', 'six_month')
            .eq('status', 'completed')
            .not('actual_completion_rate', 'is', null);
          
          // source_recommendation_id가 있으면 우선 사용
          if (archivedItem.original_recommendation_id) {
            goalQuery.eq('source_recommendation_id', archivedItem.original_recommendation_id);
          } else if (sixMonthGoal) {
            // 그렇지 않으면 제목으로 매칭
            goalQuery.eq('title', sixMonthGoal);
          }
          
          const { data } = await goalQuery.maybeSingle();
          if (data?.actual_completion_rate !== null && data?.actual_completion_rate !== undefined) {
            completionRates.push(data.actual_completion_rate);
          }
        }
        
        // 평균 계산
        if (completionRates.length > 0) {
          const totalRate = completionRates.reduce((sum, rate) => sum + rate, 0);
          averageCompletionRate = Math.round(totalRate / completionRates.length);
        }
      }

      return {
        usage_count: uniquePatients.size,
        completion_count: completedPatients.size,
        average_completion_rate: averageCompletionRate
      };
    } catch (error) {
      console.error('❌ 목표 사용 통계 계산 중 오류:', error);
      return { usage_count: 0, completion_count: 0 };
    }
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
            date_of_birth,
            gender,
            additional_info
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
      const patientAge = patient?.date_of_birth 
        ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
        : undefined;

      // 6. 아카이빙 실행
      const archiveData: any = {
        original_recommendation_id: sixMonthGoal.source_recommendation_id,
        original_assessment_id: sixMonthGoal.source_recommendation_id || crypto.randomUUID(),
        archived_goal_data: [archivedGoalData],
        patient_age_range: this.getAgeRange(patientAge),
        patient_gender: patient?.gender || null,
        diagnosis_category: patient?.additional_info?.primary_diagnosis ? this.simplifyDiagnosis(patient.additional_info.primary_diagnosis) : null,
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
   * 아카이빙된 목표 삭제
   */
  static async deleteArchivedGoal(archiveId: string): Promise<{ success: boolean; error?: string }> {
    console.log('🗑️ 아카이빙된 목표 삭제:', archiveId);
    
    try {
      const { error } = await supabase
        .from('ai_recommendation_archive')
        .delete()
        .eq('id', archiveId);
        
      if (error) {
        console.error('❌ 아카이빙 삭제 실패:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ 아카이빙 삭제 성공');
      return { success: true };
      
    } catch (error) {
      console.error('❌ 아카이빙 삭제 중 오류:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      };
    }
  }

  /**
   * 특정 목표의 완료 이력 상세 조회
   */
  static async getGoalCompletionHistory(archivedItem: ArchivedRecommendation): Promise<{
    patients: Array<{
      patient_id: string;
      patient_name: string;
      completed_date: string;
      achievement_rate: number;
      social_worker_name?: string;
    }>;
  }> {
    try {
      const firstGoal = archivedItem.archived_goal_data?.[0];
      const goalTitle = firstGoal?.title;
      const sixMonthGoal = firstGoal?.sixMonthGoal;

      console.log('🔍 완료 이력 조회 시작:', {
        goalTitle,
        sixMonthGoal,
        original_recommendation_id: archivedItem.original_recommendation_id,
        archived_reason: archivedItem.archived_reason,
        archived_goal_data: archivedItem.archived_goal_data
      });

      // 선택되지 않은 목표는 완료 이력이 없음
      if (archivedItem.archived_reason === 'goal_not_selected') {
        console.log('ℹ️ 선택되지 않은 목표로 완료 이력이 없습니다');
        return { patients: [] };
      }

      if (!goalTitle && !sixMonthGoal && !archivedItem.original_recommendation_id) {
        console.log('❌ 조회할 정보가 없습니다');
        return { patients: [] };
      }

      // 완료된 6개월 목표들 조회
      const results = [];
      
      // 1. source_recommendation_id로 조회 - 단순 조회로 변경
      if (archivedItem.original_recommendation_id) {
        const { data: goals, error } = await supabase
          .from('rehabilitation_goals')
          .select('*')
          .eq('goal_type', 'six_month')
          .eq('status', 'completed')
          .eq('source_recommendation_id', archivedItem.original_recommendation_id);
        
        console.log('📋 source_recommendation_id 조회 결과:', { 
          count: goals?.length, 
          error,
          recommendation_id: archivedItem.original_recommendation_id 
        });
        
        if (!error && goals) {
          // 각 목표에 대해 개별적으로 환자와 사회복지사 정보 조회
          for (const goal of goals) {
            const { data: patient } = await supabase
              .from('patients')
              .select('full_name, status')
              .eq('id', goal.patient_id)
              .single();
              
            const { data: socialWorker } = await supabase
              .from('social_workers')
              .select('full_name')
              .eq('user_id', goal.created_by_social_worker_id)
              .single();
            
            results.push({
              ...goal,
              patients: patient || { full_name: '(삭제된 환자)' },
              social_workers: socialWorker
            });
          }
        }
      }
      
      // 2. 6개월 목표 제목으로 조회 - 단순 쿼리
      if (sixMonthGoal) {
        // 먼저 간단한 쿼리로 목표들만 가져오기
        const { data: allGoals, error: allError } = await supabase
          .from('rehabilitation_goals')
          .select('*')
          .eq('goal_type', 'six_month')
          .eq('status', 'completed');
          
        console.log('📋 모든 완료된 6개월 목표 조회:', { count: allGoals?.length, error: allError });
        
        if (!allError && allGoals) {
          // 클라이언트에서 제목 필터링 - 정확한 매칭만 사용
          const filtered = allGoals.filter(goal => 
            goal.title && (
              goal.title === sixMonthGoal ||
              goal.title.replace(/\.$/, '').trim() === sixMonthGoal.replace(/\.$/, '').trim()
            )
          );
          
          console.log('📋 제목 필터링 결과:', { sixMonthGoal, filtered: filtered.length });
          
          // 필터링된 목표들의 추가 정보 조회
          for (const goal of filtered) {
            // 환자 정보 조회 (삭제된 환자도 포함)
            const { data: patient } = await supabase
              .from('patients')
              .select('full_name, status')
              .eq('id', goal.patient_id)
              .single();
              
            // 사회복지사 정보 조회
            const { data: socialWorker } = await supabase
              .from('social_workers')
              .select('full_name')
              .eq('user_id', goal.created_by_social_worker_id)
              .single();
            
            // 환자 정보가 있을 때만 결과에 추가
            if (patient) {
              results.push({
                ...goal,
                patients: patient,
                social_workers: socialWorker
              });
            } else {
              // 환자 정보가 없어도 기본 정보로 추가
              results.push({
                ...goal,
                patients: { full_name: '(삭제된 환자)' },
                social_workers: socialWorker
              });
            }
          }
        }
      }
      
      // 3. 주간 목표 제목이 6개월 목표로 저장되었을 가능성 체크
      if (goalTitle && goalTitle !== sixMonthGoal) {
        // 이미 2번에서 조회한 데이터가 있으면 재사용
        if (!sixMonthGoal) {
          const { data: allGoals, error: allError } = await supabase
            .from('rehabilitation_goals')
            .select('*')
            .eq('goal_type', 'six_month')
            .eq('status', 'completed');
          
          if (!allError && allGoals) {
            // 클라이언트에서 제목 필터링
            const filtered = allGoals.filter(goal => 
              goal.title && (
                goal.title === goalTitle ||
                goal.title.includes(goalTitle) ||
                goalTitle.includes(goal.title) ||
                goal.title.replace(/\.$/, '').trim() === goalTitle.replace(/\.$/, '').trim()
              )
            );
            
            console.log('📋 주간 목표 제목으로 6개월 목표 조회 결과:', { goalTitle, filtered: filtered.length });
            
            // 필터링된 목표들의 추가 정보 조회
            for (const goal of filtered) {
              // 환자 정보 조회 (삭제된 환자도 포함)
              const { data: patient } = await supabase
                .from('patients')
                .select('full_name, status')
                .eq('id', goal.patient_id)
                .single();
                
              // 사회복지사 정보 조회
              const { data: socialWorker } = await supabase
                .from('social_workers')
                .select('full_name')
                .eq('user_id', goal.created_by_social_worker_id)
                .single();
              
              // 환자 정보가 있을 때만 결과에 추가
              if (patient) {
                results.push({
                  ...goal,
                  patients: patient,
                  social_workers: socialWorker
                });
              } else {
                // 환자 정보가 없어도 기본 정보로 추가
                results.push({
                  ...goal,
                  patients: { full_name: '(삭제된 환자)' },
                  social_workers: socialWorker
                });
              }
            }
          }
        }
      }

      // 모든 완료 기록을 보존 (중복 제거하지 않음)
      const patients = results.map((goal: any) => ({
        patient_id: goal.patient_id,
        patient_name: goal.patients?.full_name || '알 수 없음',
        completed_date: goal.completed_at || goal.completion_date,
        achievement_rate: goal.actual_completion_rate || 100,
        social_worker_name: goal.social_workers?.full_name
      }))
        .filter(p => p.completed_date) // 완료 날짜가 있는 것만
        .sort((a, b) => {
          const dateA = new Date(a.completed_date).getTime();
          const dateB = new Date(b.completed_date).getTime();
          return dateB - dateA;
        });

      console.log('✅ 완료 이력 조회 완료:', { 
        totalResults: results.length, 
        patients: patients.length,
        patientsData: patients,
        rawResults: results.map(r => ({
          patient_id: r.patient_id,
          patient_name: r.patients?.full_name,
          completed_at: r.completed_at,
          status: r.status
        }))
      });

      return { patients };
    } catch (error) {
      console.error('❌ 목표 완료 이력 조회 중 오류:', error);
      return { patients: [] };
    }
  }

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