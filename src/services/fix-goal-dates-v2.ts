import { supabase } from '@/lib/supabase';
import { addWeeks, addMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export async function fixGoalDatesV2(patientId?: string) {
  try {
    console.log('🔧 목표 날짜 수정 시작 (개선된 버전)...');

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

        console.log(`\n📅 ${monthlyGoal.sequence_number}개월차 처리 중...`);
        console.log(`   월 시작: ${format(monthStartDate, 'yyyy-MM-dd')}`);
        console.log(`   월 종료: ${format(monthEndDate, 'yyyy-MM-dd')}`);

        // 3. 해당 월간 목표의 주간 목표들 조회
        const { data: weeklyGoals, error: weeklyError } = await supabase
          .from('rehabilitation_goals')
          .select('*')
          .eq('parent_goal_id', monthlyGoal.id)
          .eq('goal_type', 'weekly')
          .order('created_at'); // 생성 순서대로 정렬

        if (weeklyError) {
          console.error('주간 목표 조회 오류:', weeklyError);
          continue;
        }

        // 주간 목표가 있는 경우에만 처리
        if (weeklyGoals && weeklyGoals.length > 0) {
          // 실제 주간 목표 날짜를 저장할 변수
          let actualFirstWeekStart: Date | null = null;
          let actualLastWeekEnd: Date | null = null;

          // 주간 목표들을 처리 (최대 4개)
          for (let i = 0; i < Math.min(weeklyGoals.length, 4); i++) {
            const weeklyGoal = weeklyGoals[i];
            const weekNumber = i + 1; // 1-based (1주차, 2주차, ...)
            
            // 주차별 날짜 계산 - 월의 시작일 기준으로 7일씩 추가
            const weekStartDate = addWeeks(monthStartDate, i);
            let weekEndDate = addWeeks(weekStartDate, 1);
            
            // 주의 끝은 다음 주 시작 전날
            weekEndDate = new Date(weekEndDate);
            weekEndDate.setDate(weekEndDate.getDate() - 1);

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
              console.error('주간 목표 날짜 수정 오류:', updateWeeklyError);
            } else {
              console.log(`   ✅ ${weekNumber}주차: ${format(weekStartDate, 'yyyy-MM-dd')} ~ ${format(weekEndDate, 'yyyy-MM-dd')}`);
            }

            // 첫 주차의 시작일 저장
            if (i === 0) {
              actualFirstWeekStart = weekStartDate;
            }
            
            // 마지막 주차의 종료일 저장
            if (i === Math.min(weeklyGoals.length, 4) - 1) {
              actualLastWeekEnd = weekEndDate;
            }
          }

          // 월간 목표 날짜를 실제 주간 목표의 첫 주 시작일 ~ 마지막 주 종료일로 수정
          if (actualFirstWeekStart && actualLastWeekEnd) {
            const { error: updateMonthlyError } = await supabase
              .from('rehabilitation_goals')
              .update({
                start_date: actualFirstWeekStart.toISOString().split('T')[0],
                end_date: actualLastWeekEnd.toISOString().split('T')[0]
              })
              .eq('id', monthlyGoal.id);

            if (updateMonthlyError) {
              console.error('월간 목표 날짜 수정 오류:', updateMonthlyError);
            } else {
              console.log(`   ✅ 월간 목표 날짜: ${format(actualFirstWeekStart, 'yyyy-MM-dd')} ~ ${format(actualLastWeekEnd, 'yyyy-MM-dd')}`);
            }
          }
        } else {
          // 주간 목표가 없는 경우 월간 목표만 수정
          const { error: updateMonthlyError } = await supabase
            .from('rehabilitation_goals')
            .update({
              start_date: monthStartDate.toISOString().split('T')[0],
              end_date: monthEndDate.toISOString().split('T')[0]
            })
            .eq('id', monthlyGoal.id);

          if (!updateMonthlyError) {
            console.log(`   ✅ 월간 목표 날짜: ${format(monthStartDate, 'yyyy-MM-dd')} ~ ${format(monthEndDate, 'yyyy-MM-dd')}`);
          }
        }
      }
    }

    console.log('\n🎉 모든 목표 날짜 수정 완료!');
  } catch (error) {
    console.error('날짜 수정 중 오류:', error);
  }
}