import { supabase } from '@/lib/supabase';
import { addWeeks, addMonths, startOfMonth, format } from 'date-fns';

export async function fixGoalDatesFinal(patientId?: string) {
  try {
    console.log('🔧 목표 날짜 수정 시작 (최종 버전)...\n');

    // 1. 6개월 목표들 조회
    let sixMonthQuery = supabase
      .from('rehabilitation_goals')
      .select('*')
      .eq('goal_type', 'six_month')
      .eq('plan_status', 'active');

    if (patientId) {
      sixMonthQuery = sixMonthQuery.eq('patient_id', patientId);
    }

    const { data: sixMonthGoals, error: sixMonthError } = await sixMonthQuery;

    if (sixMonthError) {
      console.error('6개월 목표 조회 오류:', sixMonthError);
      return;
    }

    for (const sixMonthGoal of sixMonthGoals || []) {
      const sixMonthStartDate = new Date(sixMonthGoal.start_date);
      console.log(`\n📌 6개월 목표: ${sixMonthGoal.title}`);
      console.log(`   시작일: ${format(sixMonthStartDate, 'yyyy-MM-dd')}`);
      
      // 2. 해당 6개월 목표의 월간 목표들 조회
      const { data: monthlyGoals, error: monthlyError } = await supabase
        .from('rehabilitation_goals')
        .select('*')
        .eq('parent_goal_id', sixMonthGoal.id)
        .eq('goal_type', 'monthly')
        .order('sequence_number');

      if (monthlyError) {
        console.error('월간 목표 조회 오류:', monthlyError);
        continue;
      }

      // 전체 주간 목표를 미리 조회하여 월별로 분류
      const { data: allWeeklyGoals } = await supabase
        .from('rehabilitation_goals')
        .select('*')
        .in('parent_goal_id', monthlyGoals?.map(m => m.id) || [])
        .eq('goal_type', 'weekly')
        .order('created_at');

      // 주간 목표를 월간 목표별로 그룹화
      const weeklyGoalsByMonth = new Map();
      monthlyGoals?.forEach(monthly => {
        weeklyGoalsByMonth.set(monthly.id, []);
      });

      allWeeklyGoals?.forEach(weekly => {
        const monthGoals = weeklyGoalsByMonth.get(weekly.parent_goal_id);
        if (monthGoals) {
          monthGoals.push(weekly);
        }
      });

      // 각 월간 목표 처리
      for (const monthlyGoal of monthlyGoals || []) {
        const monthIndex = monthlyGoal.sequence_number - 1; // 0-based index
        const monthStartDate = startOfMonth(addMonths(sixMonthStartDate, monthIndex));
        
        console.log(`\n  📅 ${monthlyGoal.sequence_number}개월차: ${monthlyGoal.title}`);
        console.log(`     월 시작일: ${format(monthStartDate, 'yyyy-MM-dd')}`);

        // 해당 월의 주간 목표들
        const weeklyGoals = weeklyGoalsByMonth.get(monthlyGoal.id) || [];
        
        if (weeklyGoals.length > 0) {
          // 주간 목표 날짜 재계산 및 업데이트
          let firstWeekStart: Date | null = null;
          let lastWeekEnd: Date | null = null;

          // 최대 4개의 주간 목표만 처리
          const weeklyGoalsToProcess = weeklyGoals.slice(0, 4);
          
          for (let i = 0; i < weeklyGoalsToProcess.length; i++) {
            const weeklyGoal = weeklyGoalsToProcess[i];
            const weekNumber = i + 1; // 1-based (1주차, 2주차, ...)
            
            // 해당 월의 시작일부터 주차별로 계산
            const weekStartDate = addWeeks(monthStartDate, i);
            const weekEndDate = new Date(addWeeks(weekStartDate, 1));
            weekEndDate.setDate(weekEndDate.getDate() - 1); // 주의 끝은 다음 주 시작 전날

            // 첫 주차와 마지막 주차 날짜 저장
            if (i === 0) firstWeekStart = weekStartDate;
            if (i === weeklyGoalsToProcess.length - 1) lastWeekEnd = weekEndDate;

            // 주간 목표 업데이트
            const { error: updateWeeklyError } = await supabase
              .from('rehabilitation_goals')
              .update({
                start_date: weekStartDate.toISOString().split('T')[0],
                end_date: weekEndDate.toISOString().split('T')[0],
                sequence_number: weekNumber // 1-4로 정규화
              })
              .eq('id', weeklyGoal.id);

            if (updateWeeklyError) {
              console.error(`주간 목표 날짜 수정 오류:`, updateWeeklyError);
            } else {
              console.log(`     ✅ ${weekNumber}주차: ${format(weekStartDate, 'yyyy-MM-dd')} ~ ${format(weekEndDate, 'yyyy-MM-dd')}`);
            }
          }

          // 월간 목표 날짜를 주간 목표에 맞춰 업데이트
          if (firstWeekStart && lastWeekEnd) {
            const { error: updateMonthlyError } = await supabase
              .from('rehabilitation_goals')
              .update({
                start_date: firstWeekStart.toISOString().split('T')[0],
                end_date: lastWeekEnd.toISOString().split('T')[0]
              })
              .eq('id', monthlyGoal.id);

            if (updateMonthlyError) {
              console.error('월간 목표 날짜 수정 오류:', updateMonthlyError);
            } else {
              console.log(`     ✅ 월간 목표: ${format(firstWeekStart, 'yyyy-MM-dd')} ~ ${format(lastWeekEnd, 'yyyy-MM-dd')}`);
            }
          }
        } else {
          // 주간 목표가 없는 경우 - 월간 목표를 해당 월의 1일부터 28일까지로 설정
          const monthEndDate = new Date(monthStartDate);
          monthEndDate.setDate(28); // 4주 = 28일

          const { error: updateMonthlyError } = await supabase
            .from('rehabilitation_goals')
            .update({
              start_date: monthStartDate.toISOString().split('T')[0],
              end_date: monthEndDate.toISOString().split('T')[0]
            })
            .eq('id', monthlyGoal.id);

          if (!updateMonthlyError) {
            console.log(`     ✅ 월간 목표 (주간 없음): ${format(monthStartDate, 'yyyy-MM-dd')} ~ ${format(monthEndDate, 'yyyy-MM-dd')}`);
          }
        }
      }
    }

    console.log('\n🎉 모든 목표 날짜 수정 완료!');
  } catch (error) {
    console.error('날짜 수정 중 오류:', error);
  }
}