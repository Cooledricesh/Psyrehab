// 브라우저 콘솔에서 실행할 수 있는 스크립트
// 사용법: 
// 1. PsyRehab 웹사이트에 로그인
// 2. 브라우저 개발자 도구 콘솔 열기 (F12)
// 3. 이 스크립트 전체를 복사해서 붙여넣고 실행

async function archiveAllCompletedGoals() {
  console.log('🚀 기존 완료된 목표 아카이빙 시작...');
  
  // supabase 클라이언트 가져오기
  const { supabase } = window;
  if (!supabase) {
    console.error('❌ Supabase 클라이언트를 찾을 수 없습니다. PsyRehab 웹사이트에서 실행하세요.');
    return;
  }

  try {
    // 1. 완료된 6개월 목표들 조회
    const { data: completedGoals, error } = await supabase
      .from('rehabilitation_goals')
      .select(`
        id, 
        title, 
        completion_date, 
        actual_completion_rate,
        patient_id,
        source_recommendation_id
      `)
      .eq('goal_type', 'six_month')
      .eq('status', 'completed')
      .order('completion_date', { ascending: false });

    if (error) {
      console.error('❌ 완료된 목표 조회 실패:', error);
      return;
    }

    if (!completedGoals || completedGoals.length === 0) {
      console.log('ℹ️ 아카이빙할 완료된 목표가 없습니다.');
      return;
    }

    console.log(`📊 총 ${completedGoals.length}개의 완료된 목표 발견`);

    // 2. 이미 아카이빙된 목표 확인
    const { data: archivedGoals } = await supabase
      .from('ai_recommendation_archive')
      .select('original_recommendation_id')
      .eq('archived_reason', 'successfully_completed');

    const archivedIds = archivedGoals?.map(g => g.original_recommendation_id) || [];
    
    // 3. 아직 아카이빙되지 않은 목표만 필터링
    const goalsToArchive = completedGoals.filter(g => 
      !archivedIds.includes(g.source_recommendation_id)
    );

    console.log(`📦 아카이빙이 필요한 목표: ${goalsToArchive.length}개`);

    if (goalsToArchive.length === 0) {
      console.log('✅ 모든 완료된 목표가 이미 아카이빙되어 있습니다.');
      return;
    }

    // 4. 아카이빙 실행 확인
    const confirm = window.confirm(`${goalsToArchive.length}개의 완료된 목표를 아카이빙하시겠습니까?`);
    if (!confirm) {
      console.log('❌ 아카이빙 취소됨');
      return;
    }

    // 5. AIRecommendationArchiveService import
    const module = await import('/src/services/ai-recommendation-archive.ts');
    const { AIRecommendationArchiveService } = module;

    let successCount = 0;
    let failCount = 0;

    for (const goal of goalsToArchive) {
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
        console.error(`❌ 오류 발생 (${goal.title}):`, error);
      }
      
      // 요청 간 간격 두기 (rate limiting 방지)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 아카이빙 완료!');
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`📦 총계: ${successCount + failCount}개`);

  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error);
  }
}

// 함수 실행
archiveAllCompletedGoals();