import { supabase } from '@/lib/supabase';
import { addDays, format } from 'date-fns';

export async function fixGoalDatesContinuous(patientId?: string) {
  try {
    console.log('🔧 목표 날짜 수정 시작 (연속 날짜 버전)...\n');

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

      // 전체 주간 목표를 미리 조회
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

      // 날짜를 연속적으로 계산하기 위한 변수
      let currentDate = new Date(sixMonthStartDate);

      // 각 월간 목표 처리
      for (let monthIdx = 0; monthIdx < (monthlyGoals?.length || 0); monthIdx++) {
        const monthlyGoal = monthlyGoals![monthIdx];
        
        console.log(`\n  📅 ${monthlyGoal.sequence_number}개월차: ${monthlyGoal.title}`);

        // 해당 월의 주간 목표들
        const weeklyGoals = weeklyGoalsByMonth.get(monthlyGoal.id) || [];
        const weeklyGoalsToProcess = weeklyGoals.slice(0, 4); // 최대 4개
        
        // 월간 목표의 시작일
        const monthStartDate = new Date(currentDate);
        let monthEndDate = new Date(currentDate);

        if (weeklyGoalsToProcess.length > 0) {
          // 주간 목표들 처리
          for (let weekIdx = 0; weekIdx < weeklyGoalsToProcess.length; weekIdx++) {
            const weeklyGoal = weeklyGoalsToProcess[weekIdx];
            const weekNumber = weekIdx + 1;
            
            // 주간 목표의 시작일
            const weekStartDate = new Date(currentDate);
            // 주간 목표의 종료일 (7일 후 - 1)
            const weekEndDate = addDays(currentDate, 6);
            
            // 주간 목표 업데이트
            const { error: updateWeeklyError } = await supabase
              .from('rehabilitation_goals')
              .update({
                start_date: weekStartDate.toISOString().split('T')[0],
                end_date: weekEndDate.toISOString().split('T')[0],
                sequence_number: weekNumber
              })
              .eq('id', weeklyGoal.id);

            if (updateWeeklyError) {
              console.error(`주간 목표 날짜 수정 오류:`, updateWeeklyError);
            } else {
              console.log(`     ✅ ${weekNumber}주차: ${format(weekStartDate, 'yyyy-MM-dd')} ~ ${format(weekEndDate, 'yyyy-MM-dd')}`);
            }

            // 다음 주를 위해 날짜 이동
            currentDate = addDays(weekEndDate, 1);
            
            // 마지막 주간 목표의 종료일을 월간 목표 종료일로 저장
            if (weekIdx === weeklyGoalsToProcess.length - 1) {
              monthEndDate = weekEndDate;
            }
          }
        } else {
          // 주간 목표가 없는 경우 - 4주(28일) 할당
          monthEndDate = addDays(monthStartDate, 27);
          currentDate = addDays(monthEndDate, 1);
        }

        // 월간 목표 업데이트
        const { error: updateMonthlyError } = await supabase
          .from('rehabilitation_goals')
          .update({
            start_date: monthStartDate.toISOString().split('T')[0],
            end_date: monthEndDate.toISOString().split('T')[0]
          })
          .eq('id', monthlyGoal.id);

        if (updateMonthlyError) {
          console.error('월간 목표 날짜 수정 오류:', updateMonthlyError);
        } else {
          console.log(`     ✅ 월간 목표: ${format(monthStartDate, 'yyyy-MM-dd')} ~ ${format(monthEndDate, 'yyyy-MM-dd')}`);
        }
      }

      // 6개월 목표의 종료일 업데이트 (마지막 월간 목표의 종료일로)
      if (monthlyGoals && monthlyGoals.length > 0) {
        const lastDate = addDays(currentDate, -1); // currentDate는 다음 날이므로 하루 빼기
        
        const { error: updateSixMonthError } = await supabase
          .from('rehabilitation_goals')
          .update({
            end_date: lastDate.toISOString().split('T')[0]
          })
          .eq('id', sixMonthGoal.id);

        if (!updateSixMonthError) {
          console.log(`\n✅ 6개월 목표 종료일 업데이트: ${format(lastDate, 'yyyy-MM-dd')}`);
        }
      }
    }

    console.log('\n🎉 모든 목표 날짜 수정 완료!');
  } catch (error) {
    console.error('날짜 수정 중 오류:', error);
  }
}