import { supabase } from '@/lib/supabase';
import type { ArchivedGoalData } from '@/services/ai-recommendation-archive';
import { addWeeks, addMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface GoalData {
  id: string;
  patient_id: string;
  parent_goal_id: string | null;
  title: string;
  description: string;
  goal_type: 'six_month' | 'monthly' | 'weekly';
  sequence_number: number;
  start_date: string;
  end_date: string;
  status: string;
  plan_status: string;
  is_ai_suggested: boolean;
  source_recommendation_id: string | null;
  is_from_ai_recommendation: boolean;
  created_by_social_worker_id: string;
}

export interface DetailedGoals {
  selectedIndex: number;
  sixMonthGoal: unknown;
  monthlyGoals: unknown[];
  weeklyGoals: unknown[];
}

export class GoalService {
  /**
   * 기존 active 계획을 inactive로 변경
   */
  static async deactivateExistingGoals(patientId: string): Promise<void> {
    const { error } = await supabase
      .from('rehabilitation_goals')
      .update({ plan_status: 'inactive' })
      .eq('patient_id', patientId)
      .eq('plan_status', 'active');

    if (error) {
      console.error("Error occurred");
      throw error;
    }
  }

  /**
   * 계층적 목표 데이터 생성
   */
  static createHierarchicalGoals(
    detailedGoals: DetailedGoals,
    patientId: string,
    aiRecommendationId: string | null,
    userId: string
  ): GoalData[] {
    const goalsToInsert: GoalData[] = [];
    
    // 6개월 목표
    const sixMonthGoalId = crypto.randomUUID();
    const sixMonthGoal = detailedGoals.sixMonthGoal;
    
    console.log('💾 저장할 6개월 목표:', sixMonthGoal);
    
    // 모든 날짜 계산의 기준이 되는 시작일
    const baseStartDate = new Date();
    baseStartDate.setHours(12, 0, 0, 0); // UTC 변환시 날짜가 바뀌지 않도록 정오로 설정
    
    // 6개월 목표
    const sixMonthEndDate = new Date(baseStartDate);
    sixMonthEndDate.setMonth(sixMonthEndDate.getMonth() + 6);
    
    goalsToInsert.push({
      id: sixMonthGoalId,
      patient_id: patientId,
      parent_goal_id: null,
      title: sixMonthGoal.goal || sixMonthGoal.title || '6개월 목표',
      description: sixMonthGoal.details || sixMonthGoal.description || '',
      goal_type: 'six_month',
      sequence_number: 1,
      start_date: baseStartDate.toISOString().split('T')[0],
      end_date: sixMonthEndDate.toISOString().split('T')[0],
      status: 'active',
      plan_status: 'active',
      is_ai_suggested: true,
      source_recommendation_id: aiRecommendationId,
      is_from_ai_recommendation: true,
      created_by_social_worker_id: userId
    });

    // 월간 목표들
    console.log('💾 저장할 월간 목표들:', detailedGoals.monthlyGoals);
    
    detailedGoals.monthlyGoals?.forEach((monthlyPlan, monthIndex) => {
      const monthlyGoalId = crypto.randomUUID();
      
      // 월간 목표의 시작일과 종료일 계산 (각 월은 정확히 4주 = 28일)
      const monthStartDate = new Date(baseStartDate);
      monthStartDate.setDate(monthStartDate.getDate() + (monthIndex * 28)); // 28일씩 추가
      
      const monthEndDate = new Date(monthStartDate);
      monthEndDate.setDate(monthEndDate.getDate() + 27); // 28일째 (시작일 포함)
      
      goalsToInsert.push({
        id: monthlyGoalId,
        patient_id: patientId,
        parent_goal_id: sixMonthGoalId,
        title: monthlyPlan.goal || monthlyPlan.title || `${monthIndex + 1}개월차 목표`,
        description: monthlyPlan.activities?.join(', ') || monthlyPlan.description || '',
        goal_type: 'monthly',
        sequence_number: monthIndex + 1,
        start_date: monthStartDate.toISOString().split('T')[0],
        end_date: monthEndDate.toISOString().split('T')[0],
        status: monthIndex === 0 ? 'active' : 'pending',
        plan_status: 'active',
        is_ai_suggested: true,
        source_recommendation_id: aiRecommendationId,
        is_from_ai_recommendation: true,
        created_by_social_worker_id: userId
      });

      // 주간 목표들 - 해당 월에 속하는 주간 목표만 필터링
      const monthlyWeekGoals = detailedGoals.weeklyGoals?.filter(weeklyPlan => {
        return (weeklyPlan.month - 1) === monthIndex;
      }) || [];

      // 주간 목표를 week 번호 순으로 정렬
      monthlyWeekGoals.sort((a, b) => (a.week || 0) - (b.week || 0));

      monthlyWeekGoals.forEach((weeklyPlan, weekIndex) => {
        // 전체 주차 번호 (1부터 시작)
        const overallWeekNumber = (monthIndex * 4) + weekIndex + 1;
        
        // 주간 목표의 시작일 계산 (기준일로부터 7일씩 추가)
        const weekStartDate = new Date(baseStartDate);
        weekStartDate.setDate(weekStartDate.getDate() + ((overallWeekNumber - 1) * 7));
        
        // 주간 목표의 종료일 계산 (시작일 + 6일)
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        
        goalsToInsert.push({
          id: crypto.randomUUID(),
          patient_id: patientId,
          parent_goal_id: monthlyGoalId,
          title: weeklyPlan.plan || weeklyPlan.title || `${overallWeekNumber}주차 목표`,
          description: weeklyPlan.description || '',
          goal_type: 'weekly',
          sequence_number: overallWeekNumber,
          start_date: weekStartDate.toISOString().split('T')[0],
          end_date: weekEndDate.toISOString().split('T')[0],
          status: overallWeekNumber === 1 ? 'active' : 'pending',
          plan_status: 'active',
          is_ai_suggested: true,
          source_recommendation_id: aiRecommendationId,
          is_from_ai_recommendation: true,
          created_by_social_worker_id: userId
        });
      });
    });

    return goalsToInsert;
  }

  /**
   * 목표들을 DB에 저장
   */
  static async saveGoals(goals: GoalData[]): Promise<void> {
    console.log('💾 저장할 목표 개수:', goals.length);
    console.log('💾 저장할 목표 데이터:', goals);
    
    const { error } = await supabase
      .from('rehabilitation_goals')
      .insert(goals);

    if (error) {
      console.error("Error occurred");
      throw error;
    }
  }

  /**
   * 환자 상태를 active로 변경
   */
  static async activatePatient(patientId: string): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .update({ status: 'active' })
      .eq('id', patientId);

    if (error) {
      console.error("Error occurred");
      throw error;
    }
  }


  /**
   * 아카이빙된 목표를 DetailedGoals 형식으로 변환
   */
  static convertArchivedToDetailedGoals(archivedGoal: ArchivedGoalData): DetailedGoals {
    // 필수 데이터 검증
    if (!archivedGoal || !archivedGoal.sixMonthGoal || !archivedGoal.title) {
      throw new Error('아카이빙된 목표에 필요한 데이터가 없습니다.');
    }

    // monthlyGoals와 weeklyPlans가 배열인지 확인
    const monthlyGoals = Array.isArray(archivedGoal.monthlyGoals) ? archivedGoal.monthlyGoals : [];
    const weeklyPlans = Array.isArray(archivedGoal.weeklyPlans) ? archivedGoal.weeklyPlans : [];

    return {
      selectedIndex: 0,
      sixMonthGoal: {
        goal: archivedGoal.sixMonthGoal,
        title: archivedGoal.title,
        details: archivedGoal.purpose || ''
      },
      monthlyGoals: monthlyGoals.map(mg => ({
        goal: mg.goal || '',
        title: `${mg.month}개월차 목표`,
        activities: [],
        month: mg.month
      })),
      weeklyGoals: weeklyPlans.map(wp => ({
        plan: wp.plan || '',
        title: `${wp.week}주차 계획`,
        week: wp.week,
        month: wp.month
      }))
    };
  }

  /**
   * 아카이빙된 목표를 활성 목표로 생성
   */
  static async createGoalsFromArchived(
    archivedGoal: ArchivedGoalData,
    patientId: string,
    userId: string,
    originalArchiveId: string
  ): Promise<void> {
    console.log('🔄 아카이빙된 목표를 활성 목표로 변환:', archivedGoal.title);

    // 1. 기존 활성 목표 비활성화
    await this.deactivateExistingGoals(patientId);

    // 2. 아카이빙된 목표를 DetailedGoals 형식으로 변환
    const detailedGoals = this.convertArchivedToDetailedGoals(archivedGoal);

    // 3. 계층적 목표 데이터 생성 (source_recommendation_id는 null로 설정)
    const goalsToInsert = this.createHierarchicalGoals(
      detailedGoals,
      patientId,
      null, // 아카이빙된 목표는 source_recommendation_id를 null로 설정
      userId
    );

    // 아카이빙된 목표는 is_from_ai_recommendation을 false로 설정
    goalsToInsert.forEach(goal => {
      goal.is_from_ai_recommendation = false; // 아카이빙된 목표는 AI 추천이 아님
    });

    // 4. 목표 저장
    await this.saveGoals(goalsToInsert);

    // 5. 환자 상태 활성화
    await this.activatePatient(patientId);

    console.log('✅ 아카이빙된 목표에서 활성 목표 생성 완료');
  }
}
