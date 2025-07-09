import { supabase } from '@/lib/supabase';
import { handleApiError } from '@/utils/error-handler';

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
  // 추천 매칭 정보
  matchInfo?: {
    matchType: 'exact' | 'similar' | 'age_only' | 'popular';
    matchedFields?: string[];
    focusTime?: string;
    motivationLevel?: number;
    socialPreference?: string;
  };
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
        
        console.log('📦 아카이빙할 데이터:', {
          ...archiveData,
          archived_goal_data: archiveData.archived_goal_data
        });
        
        // archived_goal_data가 올바른 형식인지 확인
        console.log('📦 archived_goal_data 타입:', typeof archiveData.archived_goal_data);
        console.log('📦 archived_goal_data 내용:', JSON.stringify(archiveData.archived_goal_data));

        const { data, error } = await supabase
          .from('ai_recommendation_archive')
          .insert(archiveData)
          .select()
          .single();

        if (error) {
          handleApiError(error, 'AIRecommendationArchiveService.archiveUnselectedGoals')
          throw error;
        }

        console.log('✅ 목표 아카이빙 성공:', data.id);
        archivedItems.push(data);

      } catch (error) {
        handleApiError(error, 'AIRecommendationArchiveService.archiveUnselectedGoals.individual')
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
    ageRange,
    sortField,
    sortDirection
  }: {
    limit?: number;
    offset?: number;
    diagnosisCategory?: string;
    ageRange?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
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

    // 정렬 설정
    if (sortField && sortDirection) {
      // completion_rate 정렬 시 NULL 값을 항상 뒤로
      if (sortField === 'completion_rate') {
        query = query.order(sortField, { 
          ascending: sortDirection === 'asc',
          nullsFirst: false  // NULL 값을 항상 마지막에 표시
        });
      } else {
        query = query.order(sortField, { ascending: sortDirection === 'asc' });
      }
    } else {
      // 기본 정렬: 아카이빙 날짜 내림차순
      query = query.order('archived_at', { ascending: false });
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      handleApiError(error, 'AIRecommendationArchiveService.getArchivedRecommendations')
      throw error;
    }

    // 데이터베이스에 저장된 통계를 그대로 사용
    return {
      data: data || [],
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


      // 선택되지 않은 목표는 사용 통계가 없음
      if (archivedItem.archived_reason === 'goal_not_selected') {
        return { usage_count: 0, completion_count: 0 };
      }

      // successfully_completed된 목표의 경우, rehabilitation_goals 테이블에서 
      // 제목이 동일한 모든 목표들을 찾아서 통계 계산
      if (archivedItem.archived_reason === 'successfully_completed' && sixMonthGoal) {
        const { data: allGoals, error } = await supabase
          .from('rehabilitation_goals')
          .select('patient_id, status, actual_completion_rate')
          .eq('goal_type', 'six_month')
          .eq('title', sixMonthGoal);
        
        if (error) {
          handleApiError(error, 'AIRecommendationArchiveService.getGoalUsageStats.successfullyCompleted')
          return { usage_count: 0, completion_count: 0 };
        }

        if (!allGoals || allGoals.length === 0) {
          return { usage_count: 0, completion_count: 0 };
        }

        // 고유한 환자 수 계산
        const uniquePatients = new Set(allGoals.map(g => g.patient_id));
        const completedGoals = allGoals.filter(g => g.status === 'completed');
        const completedPatients = new Set(completedGoals.map(g => g.patient_id));


        // 평균 달성률 계산
        let averageCompletionRate = undefined;
        if (completedGoals.length > 0) {
          const validRates = completedGoals
            .filter(g => g.actual_completion_rate !== null && g.actual_completion_rate !== undefined)
            .map(g => g.actual_completion_rate);
          
          if (validRates.length > 0) {
            const totalRate = validRates.reduce((sum, rate) => sum + rate, 0);
            averageCompletionRate = Math.round(totalRate / validRates.length);
          }
        }

        return {
          usage_count: uniquePatients.size,
          completion_count: completedPatients.size,
          average_completion_rate: averageCompletionRate
        };
      }

      // 그 외의 경우 기존 로직 사용
      if (!goalTitle && !sixMonthGoal && !archivedItem.original_recommendation_id) {
        return { usage_count: 0, completion_count: 0 };
      }

      // 목표 조회
      const goals = [];
      
      // 1. source_recommendation_id가 있으면 우선 사용
      if (archivedItem.original_recommendation_id) {
        const { data, error } = await supabase
          .from('rehabilitation_goals')
          .select('patient_id, status, actual_completion_rate')
          .eq('goal_type', 'six_month')
          .eq('source_recommendation_id', archivedItem.original_recommendation_id);
        
        if (!error && data) {
          goals.push(...data);
        }
      }
      
      // 2. source_recommendation_id가 없고 6개월 목표 제목이 있으면 제목으로 조회
      if (goals.length === 0 && sixMonthGoal) {
        const { data, error } = await supabase
          .from('rehabilitation_goals')
          .select('patient_id, status, actual_completion_rate')
          .eq('goal_type', 'six_month')
          .eq('title', sixMonthGoal);
        
        if (!error && data) {
          console.log('📋 제목으로 조회:', data.length, '개');
          goals.push(...data);
        }
      }
      
      // 중복 제거
      const goalsMap = new Map();
      goals.forEach(goal => {
        const key = `${goal.patient_id}-${goal.status}`;
        if (!goalsMap.has(key)) {
          goalsMap.set(key, goal);
        }
      });
      
      const uniqueGoals = Array.from(goalsMap.values());

      // 모든 환자 포함 (삭제된 환자도 포함)
      const uniquePatients = new Set(uniqueGoals.map(g => g.patient_id));
      const completedGoals = uniqueGoals.filter(g => g.status === 'completed');
      const completedPatients = new Set(completedGoals.map(g => g.patient_id));


      // 완료된 목표들의 실제 달성률 계산
      let averageCompletionRate = undefined;
      if (completedGoals.length > 0) {
        const validRates = completedGoals
          .filter(g => g.actual_completion_rate !== null && g.actual_completion_rate !== undefined)
          .map(g => g.actual_completion_rate);
        
        if (validRates.length > 0) {
          const totalRate = validRates.reduce((sum, rate) => sum + rate, 0);
          averageCompletionRate = Math.round(totalRate / validRates.length);
        }
      }

      return {
        usage_count: uniquePatients.size,
        completion_count: completedPatients.size,
        average_completion_rate: averageCompletionRate
      };
    } catch (error) {
      handleApiError(error, 'AIRecommendationArchiveService.getGoalUsageStats')
      return { usage_count: 0, completion_count: 0 };
    }
  }

  /**
   * 평가 항목 기반 아카이빙된 목표 검색 (새로운 추천 로직)
   */
  static async searchArchivedGoalsByAssessment({
    ageRange,
    focusTime,
    motivationLevel,
    pastSuccesses,
    constraints,
    socialPreference,
    limit = 10
  }: {
    ageRange?: string;
    focusTime?: string;
    motivationLevel?: number;
    pastSuccesses?: string[];
    constraints?: string[];
    socialPreference?: string;
    limit?: number;
  }): Promise<ArchivedRecommendation[]> {

    try {
      // 1차: 정확히 일치하는 평가 항목 검색
      let results = await this.searchExactMatch({
        ageRange, focusTime, motivationLevel, 
        pastSuccesses, constraints, socialPreference, 
        limit
      });

      // 2차: 결과가 부족하면 유사한 평가 항목 검색
      if (results.length < 3) {
        const similarResults = await this.searchSimilarMatch({
          ageRange, focusTime, motivationLevel,
          pastSuccesses, constraints, socialPreference,
          limit: limit - results.length,
          excludeIds: results.map(r => r.id),
          userFocusTime: focusTime,
          userMotivationLevel: motivationLevel,
          userSocialPreference: socialPreference
        });
        results = [...results, ...similarResults];
      }

      // 3차: 여전히 부족하면 연령대만 고려
      if (results.length < 3 && ageRange) {
        const ageResults = await this.searchByAgeRange({
          ageRange,
          limit: limit - results.length,
          excludeIds: results.map(r => r.id)
        });
        results = [...results, ...ageResults];
      }

      // 4차: 그래도 부족하면 인기 있는 successfully_completed 목표
      if (results.length < 3) {
        const popularResults = await this.searchPopularGoals({
          limit: limit - results.length,
          excludeIds: results.map(r => r.id)
        });
        results = [...results, ...popularResults];
      }

      return results;
    } catch (error) {
      handleApiError(error, 'AIRecommendationArchiveService.searchArchivedGoalsByAssessment')
      throw error;
    }
  }

  /**
   * 정확히 일치하는 평가 항목으로 검색
   */
  private static async searchExactMatch(params: {
    ageRange?: string;
    focusTime?: string;
    motivationLevel?: number;
    pastSuccesses?: string[];
    constraints?: string[];
    socialPreference?: string;
    limit: number;
  }): Promise<ArchivedRecommendation[]> {
    try {
      // 먼저 매칭되는 평가를 찾기
      const { data: matchingAssessments, error: assessmentError } = await supabase
        .from('assessments')
        .select('id')
        .eq('focus_time', params.focusTime)
        .eq('motivation_level', params.motivationLevel)
        .eq('social_preference', params.socialPreference);

      if (assessmentError || !matchingAssessments || matchingAssessments.length === 0) {
        return [];
      }

      const assessmentIds = matchingAssessments.map(a => a.id);

      // 해당 평가 ID들과 연결된 아카이빙 목표 찾기
      let query = supabase
        .from('ai_recommendation_archive')
        .select('*')
        .in('archived_reason', ['successfully_completed', 'goal_not_selected'])
        .in('original_assessment_id', assessmentIds);
      
      // ageRange가 있을 때만 필터 적용
      if (params.ageRange) {
        query = query.eq('patient_age_range', params.ageRange);
      }
      
      const { data, error } = await query
        .order('archived_reason', { ascending: false })
        .order('completion_rate', { ascending: false, nullsFirst: false })
        .order('archived_at', { ascending: false })
        .limit(params.limit);

      if (error) {
        handleApiError(error, 'AIRecommendationArchiveService.searchExactMatch')
        return [];
      }

      // 매칭 정보 추가
      const resultsWithMatchInfo = (data || []).map(item => ({
        ...item,
        matchInfo: {
          matchType: 'exact' as const,
          matchedFields: ['연령대', '집중 가능 시간', '변화 동기', '사회성'],
          focusTime: params.focusTime,
          motivationLevel: params.motivationLevel,
          socialPreference: params.socialPreference
        }
      }));

      return resultsWithMatchInfo;
    } catch (error) {
      handleApiError(error, 'AIRecommendationArchiveService.searchExactMatch.exception')
      return [];
    }
  }

  /**
   * 유사한 평가 항목으로 검색
   */
  private static async searchSimilarMatch(params: {
    ageRange?: string;
    focusTime?: string;
    motivationLevel?: number;
    pastSuccesses?: string[];
    constraints?: string[];
    socialPreference?: string;
    limit: number;
    excludeIds?: string[];
    userFocusTime?: string;
    userMotivationLevel?: number;
    userSocialPreference?: string;
  }): Promise<ArchivedRecommendation[]> {
    try {
      // motivation_level ±1 범위로 검색
      const motivationRange = params.motivationLevel 
        ? [params.motivationLevel - 1, params.motivationLevel, params.motivationLevel + 1]
        : [];

      // 유사한 평가 찾기 - 더 많은 정보 조회
      const { data: similarAssessments, error: assessmentError } = await supabase
        .from('assessments')
        .select('id, focus_time, motivation_level, social_preference')
        .in('motivation_level', motivationRange);

      if (assessmentError || !similarAssessments || similarAssessments.length === 0) {
        console.log('유사한 평가가 없습니다');
        return [];
      }

      const assessmentIds = similarAssessments.map(a => a.id);

      // 해당 평가 ID들과 연결된 아카이빙 목표 찾기
      let query = supabase
        .from('ai_recommendation_archive')
        .select('*')
        .in('archived_reason', ['successfully_completed', 'goal_not_selected'])
        .in('original_assessment_id', assessmentIds);
      
      // ageRange가 있을 때만 필터 적용
      if (params.ageRange) {
        query = query.eq('patient_age_range', params.ageRange);
      }

      // excludeIds가 있을 때만 not 조건 추가
      if (params.excludeIds && params.excludeIds.length > 0) {
        query = query.not('id', 'in', `(${params.excludeIds.join(',')})`);
      }

      const { data, error } = await query
        .order('archived_reason', { ascending: false })
        .order('completion_rate', { ascending: false, nullsFirst: false })
        .order('archived_at', { ascending: false })
        .limit(params.limit);

      if (error) {
        handleApiError(error, 'AIRecommendationArchiveService.searchSimilarMatch')
        return [];
      }

      // matchInfo 추가
      return (data || []).map(archive => {
        // 해당 아카이브의 평가 정보 찾기
        const assessment = similarAssessments.find(a => a.id === archive.original_assessment_id);
        const matchedFields = [];
        
        if (assessment) {
          if (params.userFocusTime && assessment.focus_time === params.userFocusTime) {
            matchedFields.push('집중 가능 시간');
          }
          if (params.userMotivationLevel !== undefined && assessment.motivation_level === params.userMotivationLevel) {
            matchedFields.push('변화 동기');
          } else if (motivationRange.includes(assessment.motivation_level)) {
            matchedFields.push('변화 동기(유사)');
          }
          if (params.userSocialPreference && assessment.social_preference === params.userSocialPreference) {
            matchedFields.push('사회성');
          }
        }
        
        if (params.ageRange && archive.patient_age_range === params.ageRange) {
          matchedFields.push('연령대');
        }
        
        return {
          ...archive,
          matchInfo: {
            matchType: 'similar' as const,
            matchedFields,
            focusTime: assessment?.focus_time,
            motivationLevel: assessment?.motivation_level,
            socialPreference: assessment?.social_preference
          }
        };
      });
    } catch (error) {
      handleApiError(error, 'AIRecommendationArchiveService.searchSimilarMatch.exception')
      return [];
    }
  }

  /**
   * 연령대만으로 검색
   */
  private static async searchByAgeRange(params: {
    ageRange?: string;
    limit: number;
    excludeIds?: string[];
  }): Promise<ArchivedRecommendation[]> {
    let query = supabase
      .from('ai_recommendation_archive')
      .select('*')
      .in('archived_reason', ['successfully_completed', 'goal_not_selected']);
    
    // ageRange가 있을 때만 필터 적용
    if (params.ageRange) {
      query = query.eq('patient_age_range', params.ageRange);
    }

    // excludeIds가 있을 때만 not 조건 추가
    if (params.excludeIds && params.excludeIds.length > 0) {
      query = query.not('id', 'in', `(${params.excludeIds.map((id: string) => `'${id}'`).join(',')})`);
    }

    const { data, error } = await query
      .order('archived_reason', { ascending: false })
      .order('completion_rate', { ascending: false, nullsFirst: false })
      .order('archived_at', { ascending: false })
      .limit(params.limit);

    if (error) {
      handleApiError(error, 'AIRecommendationArchiveService.searchByAgeRange')
      return [];
    }

    // matchInfo 추가
    return (data || []).map(archive => ({
      ...archive,
      matchInfo: {
        matchType: 'age_only' as const,
        matchedFields: ['연령대']
      }
    }));
  }

  /**
   * 인기 있는 목표 검색
   */
  private static async searchPopularGoals(params: {
    limit: number;
    excludeIds?: string[];
  }): Promise<ArchivedRecommendation[]> {
    let query = supabase
      .from('ai_recommendation_archive')
      .select('*')
      .eq('archived_reason', 'successfully_completed')
      .not('completion_rate', 'is', null)  // completion_rate가 NULL이 아닌 것만
      .gt('usage_count', 0);  // usage_count가 0보다 큰 것만

    // excludeIds가 있을 때만 not 조건 추가
    if (params.excludeIds && params.excludeIds.length > 0) {
      query = query.not('id', 'in', `(${params.excludeIds.map((id: string) => `'${id}'`).join(',')})`);
    }

    const { data, error } = await query
      .order('usage_count', { ascending: false })  // 사용 횟수로 먼저 정렬
      .order('completion_rate', { ascending: false, nullsFirst: false })  // 그 다음 달성률로 정렬
      .order('archived_at', { ascending: false })
      .limit(params.limit);

    if (error) {
      handleApiError(error, 'AIRecommendationArchiveService.searchPopularGoals')
      return [];
    }

    // 실제로 통계가 있는 목표만 반환
    const validGoals = (data || []).filter(archive => 
      archive.usage_count > 0 && archive.completion_rate !== null
    );

    // matchInfo 추가
    return validGoals.map(archive => ({
      ...archive,
      matchInfo: {
        matchType: 'popular' as const,
        matchedFields: ['인기목표']
      }
    }));
  }

  /**
   * 환자 프로필과 유사한 아카이빙된 목표 검색 (기존 메서드 - 하위 호환성 유지)
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
      handleApiError(error, 'AIRecommendationArchiveService.searchArchivedGoalsByProfile')
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
        handleApiError(goalError, 'AIRecommendationArchiveService.archiveCompletedGoal.goalQuery')
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
      const archiveData: {
        original_recommendation_id: string | null;
        original_assessment_id: string;
        archived_goal_data: ArchivedGoalData[];
        patient_age_range: string | null;
        patient_gender: string | null;
        diagnosis_category: string | null;
        archived_reason: string;
        completion_rate?: number;
        completion_date?: string;
      } = {
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
        handleApiError(archiveError, 'AIRecommendationArchiveService.archiveCompletedGoal.insert')
        throw archiveError;
      }

      console.log('✅ 완료된 목표 아카이빙 성공:', archived.id);
      return archived;

    } catch (error) {
      handleApiError(error, 'AIRecommendationArchiveService.archiveCompletedGoal')
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
      handleApiError(error, 'AIRecommendationArchiveService.getArchiveStatistics')
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
        handleApiError(error, 'AIRecommendationArchiveService.deleteArchivedGoal')
        return { success: false, error: error.message };
      }
      
      console.log('✅ 아카이빙 삭제 성공');
      return { success: true };
      
    } catch (error) {
      handleApiError(error, 'AIRecommendationArchiveService.deleteArchivedGoal.exception')
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
      
      // successfully_completed 목표의 경우 제목으로만 조회
      if (archivedItem.archived_reason === 'successfully_completed' && sixMonthGoal) {
        const { data: completedGoals, error } = await supabase
          .from('rehabilitation_goals')
          .select('*')
          .eq('goal_type', 'six_month')
          .eq('status', 'completed')
          .eq('title', sixMonthGoal);
        
        console.log('📋 제목으로 완료된 목표 조회:', { 
          title: sixMonthGoal,
          count: completedGoals?.length, 
          error 
        });
        
        if (!error && completedGoals) {
          // 각 목표에 대해 개별적으로 환자와 사회복지사 정보 조회
          for (const goal of completedGoals) {
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
      // 기존 로직 (source_recommendation_id 기반 조회)
      else if (archivedItem.original_recommendation_id && sixMonthGoal) {
        const { data: goals, error } = await supabase
          .from('rehabilitation_goals')
          .select('*')
          .eq('goal_type', 'six_month')
          .eq('status', 'completed')
          .eq('source_recommendation_id', archivedItem.original_recommendation_id)
          .eq('title', sixMonthGoal); // 제목도 함께 확인하여 정확한 목표만 조회
        
        console.log('📋 source_recommendation_id + title 조회 결과:', { 
          count: goals?.length, 
          error,
          recommendation_id: archivedItem.original_recommendation_id,
          title: sixMonthGoal
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
      // source_recommendation_id가 없는 경우에만 제목으로 조회
      else if (!archivedItem.original_recommendation_id && sixMonthGoal) {
        const { data: completedGoals, error } = await supabase
          .from('rehabilitation_goals')
          .select('*')
          .eq('goal_type', 'six_month')
          .eq('status', 'completed')
          .eq('title', sixMonthGoal);
          
        console.log('📋 제목으로만 조회:', { 
          title: sixMonthGoal,
          count: completedGoals?.length, 
          error 
        });
        
        if (!error && completedGoals) {
          // 각 목표에 대해 개별적으로 환자와 사회복지사 정보 조회
          for (const goal of completedGoals) {
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

      // 모든 완료 기록을 보존 (중복 제거하지 않음)
      const patients = results.map((goal: {
        patient_id: string;
        patients?: { full_name?: string };
        completed_at?: string;
        completion_date?: string;
        actual_completion_rate?: number;
        social_workers?: { full_name?: string };
        status: string;
      }) => ({
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
      handleApiError(error, 'AIRecommendationArchiveService.getGoalCompletionHistory')
      return { patients: [] };
    }
  }

  /**
   * 모든 아카이빙된 목표의 통계 업데이트
   */
  static async updateAllArchiveStats(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📊 전체 아카이빙 통계 업데이트 시작...');
      
      const { data, error } = await supabase
        .rpc('update_archive_stats');
      
      if (error) {
        handleApiError(error, 'AIRecommendationArchiveService.updateAllArchiveStats')
        return { success: false, error: error.message };
      }
      
      console.log('✅ 전체 아카이빙 통계 업데이트 완료');
      return { success: true };
    } catch (error) {
      handleApiError(error, 'AIRecommendationArchiveService.updateAllArchiveStats.exception')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      };
    }
  }

  /**
   * 특정 아카이빙된 목표의 통계 업데이트
   */
  static async updateSingleArchiveStats(archiveId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📊 개별 아카이빙 통계 업데이트:', archiveId);
      
      const { data, error } = await supabase
        .rpc('update_single_archive_stats', { archive_id: archiveId });
      
      if (error) {
        handleApiError(error, 'AIRecommendationArchiveService.updateSingleArchiveStats')
        return { success: false, error: error.message };
      }
      
      console.log('✅ 개별 아카이빙 통계 업데이트 완료');
      return { success: true };
    } catch (error) {
      handleApiError(error, 'AIRecommendationArchiveService.updateSingleArchiveStats.exception')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      };
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
  private static groupByField(data: Array<Record<string, unknown>>, field: string): Record<string, number> {
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
  private static calculateDailyTrends(data: Array<{ archived_at: string }>): Array<{ date: string; count: number }> {
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