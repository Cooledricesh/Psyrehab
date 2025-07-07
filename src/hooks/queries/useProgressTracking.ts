import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Active 환자 목록 조회 (목표가 진행 중인 환자만)
export const useActivePatients = () => {
  return useQuery({
    queryKey: ['activePatients'],
    queryFn: async () => {
      // 먼저 active 6개월 목표를 가진 환자 ID 목록을 조회
      const { data: activeGoals, error: goalsError } = await supabase
        .from('rehabilitation_goals')
        .select('patient_id')
        .eq('goal_type', 'six_month')
        .eq('status', 'active');

      if (goalsError) throw goalsError;

      // 중복 제거
      const patientIds = [...new Set(activeGoals?.map(g => g.patient_id) || [])];
      
      if (patientIds.length === 0) {
        return [];
      }

      // 해당 환자들의 정보 조회
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          social_workers!primary_social_worker_id(
            full_name
          )
        `)
        .in('id', patientIds)
        .in('status', ['active', 'pending'])  // discharged 제외
        .order('full_name', { ascending: true });  // 이름순으로 정렬

      if (error) throw error;
      return data;
    },
    // refetchInterval 제거 - 필요시에만 수동으로 새로고침
  });
};

// 환자별 active 목표 조회 (계층 구조)
export const usePatientGoals = (patientId: string | null) => {
  return useQuery({
    queryKey: ['patientGoals', patientId],
    queryFn: async () => {
      if (!patientId) return null;

      // 1. 6개월 목표 조회
      const { data: sixMonthGoals, error: sixMonthError } = await supabase
        .from('rehabilitation_goals')
        .select('*')
        .eq('patient_id', patientId)
        .eq('goal_type', 'six_month')
        .eq('status', 'active')
        .single();

      if (sixMonthError && sixMonthError.code !== 'PGRST116') throw sixMonthError;
      if (!sixMonthGoals) return null;

      // 2. 월간 목표 조회
      const { data: monthlyGoals, error: monthlyError } = await supabase
        .from('rehabilitation_goals')
        .select('*')
        .eq('parent_goal_id', sixMonthGoals.id)
        .eq('goal_type', 'monthly')
        .order('sequence_number');

      if (monthlyError) throw monthlyError;

      // 3. 각 월간 목표에 대한 주간 목표 조회
      const monthlyGoalsWithWeekly = await Promise.all(
        (monthlyGoals || []).map(async (monthlyGoal) => {
          const { data: weeklyGoals, error: weeklyError } = await supabase
            .from('rehabilitation_goals')
            .select('*')
            .eq('parent_goal_id', monthlyGoal.id)
            .eq('goal_type', 'weekly')
            .order('sequence_number');

          if (weeklyError) throw weeklyError;

          return {
            ...monthlyGoal,
            weeklyGoals,
          };
        })
      );

      return {
        sixMonthGoal: sixMonthGoals,
        monthlyGoals: monthlyGoalsWithWeekly,
      };
    },
    enabled: !!patientId,
  });
};

// 진행률 통계 조회
export const useProgressStats = () => {
  return useQuery({
    queryKey: ['progressStats'],
    queryFn: async () => {
      // 1. active와 pending 환자 조회 (discharged 제외)
      const { data: activeAndPendingPatients, error: patientsError } = await supabase
        .from('patients')
        .select('id, status, additional_info')
        .in('status', ['active', 'pending']);

      if (patientsError) throw patientsError;

      // 활동 가능한 환자 수 (active + pending, 입원 환자는 제외하지 않음)
      const eligiblePatientCount = activeAndPendingPatients?.length || 0;

      // 2. 현재 목표가 진행 중인 환자 수 조회 (6개월 목표 기준)
      const { data: patientsWithActiveGoals, error: goalsError } = await supabase
        .from('rehabilitation_goals')
        .select('patient_id')
        .eq('status', 'active')
        .eq('goal_type', 'six_month');

      if (goalsError) throw goalsError;

      // 중복 제거한 목표 진행 중인 환자 수
      const uniquePatientsWithGoals = new Set(patientsWithActiveGoals?.map(g => g.patient_id) || []).size;

      // 3. Active 목표들의 진행률 계산
      const { data: activeGoals, error } = await supabase
        .from('rehabilitation_goals')
        .select('progress, status, goal_type')
        .in('status', ['active', 'completed']);

      if (error) throw error;

      const stats = {
        averageProgress: 0,
        achievementRate: 0,
        participationRate: 0,
        trend: 'stable' as 'up' | 'down' | 'stable',
      };

      if (activeGoals && activeGoals.length > 0) {
        // 평균 진행률
        const totalProgress = activeGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0);
        stats.averageProgress = totalProgress / activeGoals.length;

        // 달성률 (완료된 목표 비율)
        const completedGoals = activeGoals.filter(goal => goal.status === 'completed').length;
        stats.achievementRate = (completedGoals / activeGoals.length) * 100;
      }

      // 참여율 계산: (목표 진행중인 환자 수) / (목표 진행 중 + 목표 설정 대기 중인 환자 수) * 100
      // 즉, active/pending 상태인 모든 환자 대비 목표 진행중인 환자의 비율
      if (eligiblePatientCount > 0) {
        stats.participationRate = (uniquePatientsWithGoals / eligiblePatientCount) * 100;
        console.log('참여율 계산:', {
          목표진행중인환자수: uniquePatientsWithGoals,
          전체활동가능환자수: eligiblePatientCount,
          참여율: stats.participationRate
        });
      } else {
        stats.participationRate = 0;
      }

      return stats;
    },
    refetchInterval: 5000, // 5초마다 자동 새로고침
  });
};

