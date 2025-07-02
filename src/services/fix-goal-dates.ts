import { supabase } from '@/lib/supabase';
import { addWeeks, addMonths, startOfMonth, endOfMonth } from 'date-fns';

export async function checkGoalDates(patientId?: string) {
  try {
    console.log('🔍 목표 날짜 확인 시작...\n');
    
    // 6개월 목표 조회
    let sixMonthQuery = supabase
      .from('rehabilitation_goals')
      .select('*')
      .eq('goal_type', 'six_month')
      .eq('plan_status', 'active');

    if (patientId) {
      sixMonthQuery = sixMonthQuery.eq('patient_id', patientId);
    }

    const { data: sixMonthGoals } = await sixMonthQuery;

    for (const sixMonthGoal of sixMonthGoals || []) {
      console.log(`📌 6개월 목표: ${sixMonthGoal.title}`);
      console.log(`   기간: ${sixMonthGoal.start_date} ~ ${sixMonthGoal.end_date}\n`);

      // 월간 목표들 조회
      const { data: monthlyGoals } = await supabase
        .from('rehabilitation_goals')
        .select('*')
        .eq('parent_goal_id', sixMonthGoal.id)
        .eq('goal_type', 'monthly')
        .order('sequence_number');

      for (const monthlyGoal of monthlyGoals || []) {
        console.log(`  📅 ${monthlyGoal.sequence_number}개월차: ${monthlyGoal.title}`);
        console.log(`     기간: ${monthlyGoal.start_date} ~ ${monthlyGoal.end_date}`);

        // 주간 목표들 조회
        const { data: weeklyGoals } = await supabase
          .from('rehabilitation_goals')
          .select('*')
          .eq('parent_goal_id', monthlyGoal.id)
          .eq('goal_type', 'weekly')
          .order('sequence_number');

        if (weeklyGoals && weeklyGoals.length > 0) {
          weeklyGoals.forEach((weeklyGoal, index) => {
            console.log(`     - ${weeklyGoal.sequence_number}주차: ${weeklyGoal.start_date} ~ ${weeklyGoal.end_date}`);
          });
          
          // 날짜 검증
          const firstWeek = weeklyGoals[0];
          const lastWeek = weeklyGoals[weeklyGoals.length - 1];
          
          if (monthlyGoal.start_date !== firstWeek.start_date || 
              monthlyGoal.end_date !== lastWeek.end_date) {
            console.warn(`     ⚠️  월간 목표 날짜가 주간 목표와 일치하지 않음!`);
            console.warn(`        월간: ${monthlyGoal.start_date} ~ ${monthlyGoal.end_date}`);
            console.warn(`        주간: ${firstWeek.start_date} ~ ${lastWeek.end_date}`);
          }
        }
        console.log('');
      }
    }
  } catch (error) {
    console.error('날짜 확인 중 오류:', error);
  }
}

export async function fixGoalDates(patientId?: string) {
  try {
    console.log('🔧 목표 날짜 수정 시작...');

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

      for (const monthlyGoal of monthlyGoals || []) {
        const monthIndex = monthlyGoal.sequence_number - 1; // 0-based index
        const monthStartDate = startOfMonth(addMonths(sixMonthStartDate, monthIndex));
        const monthEndDate = endOfMonth(monthStartDate);

        // 월간 목표 날짜 수정
        const { error: updateMonthlyError } = await supabase
          .from('rehabilitation_goals')
          .update({
            start_date: monthStartDate.toISOString().split('T')[0],
            end_date: monthEndDate.toISOString().split('T')[0]
          })
          .eq('id', monthlyGoal.id);

        if (updateMonthlyError) {
          console.error('월간 목표 날짜 수정 오류:', updateMonthlyError);
          continue;
        }

        console.log(`✅ ${monthlyGoal.title} 날짜 수정 완료`);

        // 3. 해당 월간 목표의 주간 목표들 조회
        const { data: weeklyGoals, error: weeklyError } = await supabase
          .from('rehabilitation_goals')
          .select('*')
          .eq('parent_goal_id', monthlyGoal.id)
          .eq('goal_type', 'weekly')
          .order('sequence_number');

        if (weeklyError) {
          console.error('주간 목표 조회 오류:', weeklyError);
          continue;
        }

        // 주간 목표를 주차 순서대로 정렬
        const sortedWeeklyGoals = (weeklyGoals || []).sort((a, b) => {
          // sequence_number가 월별 주차인지 전체 주차인지 확인
          // 월별 주차라면 1-4 범위에 있을 것
          if (a.sequence_number <= 4 && b.sequence_number <= 4) {
            return a.sequence_number - b.sequence_number;
          }
          // 전체 주차라면 created_at으로 정렬
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        // 각 월의 주간 목표는 최대 4개
        sortedWeeklyGoals.slice(0, 4).forEach((weeklyGoal, index) => {
          const weekNumber = index; // 0-based index (0=1주차, 1=2주차, ...)
          const weekStartDate = addWeeks(monthStartDate, weekNumber);
          let weekEndDate = addWeeks(weekStartDate, 1);
          
          // 주의 끝이 다음 달로 넘어가면 이번 달 마지막 날로 조정
          if (weekEndDate > monthEndDate) {
            weekEndDate = monthEndDate;
          }
          
          // 날짜가 1일 전으로 설정되도록 조정
          const adjustedEndDate = new Date(weekEndDate);
          adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);

          // 주간 목표 날짜 수정
          const updateResult = supabase
            .from('rehabilitation_goals')
            .update({
              start_date: weekStartDate.toISOString().split('T')[0],
              end_date: adjustedEndDate.toISOString().split('T')[0],
              sequence_number: index + 1 // 1-4로 정규화
            })
            .eq('id', weeklyGoal.id);

          updateResult.then(({ error: updateWeeklyError }) => {
            if (updateWeeklyError) {
              console.error('주간 목표 날짜 수정 오류:', updateWeeklyError);
              return;
            }

            console.log(`✅ ${weeklyGoal.title} (${index + 1}주차) 날짜 수정 완료`);
            console.log(`   ${weekStartDate.toISOString().split('T')[0]} ~ ${adjustedEndDate.toISOString().split('T')[0]}`);
          });
        });
      }
    }

    console.log('🎉 모든 목표 날짜 수정 완료!');
  } catch (error) {
    console.error('날짜 수정 중 오류:', error);
  }
}