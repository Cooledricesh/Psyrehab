// 기존 완료된 목표들을 일괄 아카이빙하는 스크립트
import { supabase } from '../lib/supabase';
import { AIRecommendationArchiveService } from '../services/ai-recommendation-archive';
import { handleApiError } from '../utils/error-handler';

async function archiveAllCompletedGoals() {
  console.log('🚀 기존 완료된 목표 아카이빙 시작...');
  
  try {
    // 1. 완료된 6개월 목표들 조회
    const { data: completedGoals, error } = await supabase
      .from('rehabilitation_goals')
      .select('id, title, completion_date, actual_completion_rate')
      .eq('goal_type', 'six_month')
      .eq('status', 'completed')
      .order('completion_date', { ascending: false });

    if (error) {
      handleApiError(error, 'archiveCompletedGoals.queryCompletedGoals');
      return;
    }

    if (!completedGoals || completedGoals.length === 0) {
      console.log('ℹ️ 아카이빙할 완료된 목표가 없습니다.');
      return;
    }

    console.log(`📊 총 ${completedGoals.length}개의 완료된 목표 발견`);

    // 2. 각 목표를 아카이빙
    let successCount = 0;
    let failCount = 0;

    for (const goal of completedGoals) {
      try {
        console.log(`📦 아카이빙 중: ${goal.title}`);
        const result = await AIRecommendationArchiveService.archiveCompletedGoal(goal.id);
        
        if (result) {
          successCount++;
          console.log(`✅ 성공: ${goal.title}`);
        } else {
          failCount++;
          console.log(`⚠️ 실패: ${goal.title}`);
        }
      } catch (error) {
        failCount++;
        handleApiError(error, `archiveCompletedGoals.archiveGoal.${goal.id}`);
      }
    }

    console.log('\n📊 아카이빙 완료!');
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`📦 총계: ${successCount + failCount}개`);

  } catch (error) {
    handleApiError(error, 'archiveCompletedGoals.script');
  }
}

// 브라우저 콘솔에서 실행할 수 있도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  (window as any).archiveAllCompletedGoals = archiveAllCompletedGoals;
  console.log('💡 archiveAllCompletedGoals() 함수를 실행하여 기존 완료된 목표들을 아카이빙할 수 있습니다.');
}

export { archiveAllCompletedGoals };