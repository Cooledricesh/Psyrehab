import { supabase } from '@/lib/supabase';
import type { ArchivedGoalData } from '@/services/ai-recommendation-archive';

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
    
    goalsToInsert.push({
      id: sixMonthGoalId,
      patient_id: patientId,
      parent_goal_id: null,
      title: sixMonthGoal.goal || sixMonthGoal.title || '6개월 목표',
      description: sixMonthGoal.details || sixMonthGoal.description || '',
      goal_type: 'six_month',
      sequence_number: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
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
      
      goalsToInsert.push({
        id: monthlyGoalId,
        patient_id: patientId,
        parent_goal_id: sixMonthGoalId,
        title: monthlyPlan.goal || monthlyPlan.title || `${monthIndex + 1}개월차 목표`,
        description: monthlyPlan.activities?.join(', ') || monthlyPlan.description || '',
        goal_type: 'monthly',
        sequence_number: monthIndex + 1,
        start_date: new Date(new Date().setMonth(new Date().getMonth() + monthIndex)).toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + monthIndex + 1)).toISOString().split('T')[0],
        status: monthIndex === 0 ? 'active' : 'pending',
        plan_status: 'active',
        is_ai_suggested: true,
        source_recommendation_id: aiRecommendationId,
        is_from_ai_recommendation: true,
        created_by_social_worker_id: userId
      });

      // 주간 목표들
      detailedGoals.weeklyGoals
        ?.filter(weeklyPlan => {
          // weeklyPlan.month 필드를 직접 사용
          return (weeklyPlan.month - 1) === monthIndex;
        })
        ?.forEach((weeklyPlan, weekIndex) => {
          goalsToInsert.push({
            id: crypto.randomUUID(),
            patient_id: patientId,
            parent_goal_id: monthlyGoalId,
            title: weeklyPlan.plan || weeklyPlan.title || `${weeklyPlan.week}주차 목표`,
            description: weeklyPlan.description || '',
            goal_type: 'weekly',
            sequence_number: parseInt(weeklyPlan.week || `${weekIndex + 1}`),
            start_date: new Date(new Date().setMonth(new Date().getMonth() + monthIndex)).toISOString().split('T')[0],
            end_date: new Date(new Date().setMonth(new Date().getMonth() + monthIndex)).toISOString().split('T')[0],
            status: monthIndex === 0 && weekIndex === 0 ? 'active' : 'pending',
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
   * 입원 환자의 목표 상태를 on_hold로 변경
   */
  static async holdPatientGoals(patientId: string): Promise<void> {
    const { error } = await supabase
      .from('rehabilitation_goals')
      .update({ status: 'on_hold' })
      .eq('patient_id', patientId)
      .eq('status', 'active');
    
    if (error) {
      console.error("Error occurred");
      throw error;
    }
  }

  /**
   * 아카이빙된 목표를 DetailedGoals 형식으로 변환
   */
  static convertArchivedToDetailedGoals(archivedGoal: ArchivedGoalData): DetailedGoals {
    return {
      selectedIndex: 0,
      sixMonthGoal: {
        goal: archivedGoal.sixMonthGoal,
        title: archivedGoal.title,
        details: archivedGoal.purpose
      },
      monthlyGoals: archivedGoal.monthlyGoals.map(mg => ({
        goal: mg.goal,
        title: `${mg.month}개월차 목표`,
        activities: [],
        month: mg.month
      })),
      weeklyGoals: archivedGoal.weeklyPlans.map(wp => ({
        plan: wp.plan,
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

    // 3. 계층적 목표 데이터 생성 (source_recommendation_id에 archive ID 저장)
    const goalsToInsert = this.createHierarchicalGoals(
      detailedGoals,
      patientId,
      originalArchiveId, // 아카이브 ID를 source로 사용
      userId
    );

    // 4. 목표 저장
    await this.saveGoals(goalsToInsert);

    // 5. 환자 상태 활성화
    await this.activatePatient(patientId);

    console.log('✅ 아카이빙된 목표에서 활성 목표 생성 완료');
  }
}
