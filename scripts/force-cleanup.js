import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jsilzrsiieswiskzcriy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaWx6cnNpaWVzd2lza3pjcml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODcwNDA2MywiZXhwIjoyMDY0MjgwMDYzfQ.eOV7xEkonxltVxAlFTS6C_jxtgxjasckIYKQlXZBIPU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function forceCleanup() {
  try {
    // 중복된 계정 (관리자인데 social_worker로도 등록된 경우)
    const duplicateUserIds = [
      '8b08cf58-13e9-4a45-9b97-4455fa466d62',  // 개발 관리자
      '0c8deaa8-64d5-47bb-9b00-60ea9c6d5421'   // 김사회/박승현
    ];

    console.log('강제 정리 시작...');

    // 1. 먼저 관련된 rehabilitation_goals의 created_by_social_worker_id를 NULL로 설정
    const { error: updateGoalsError } = await supabase
      .from('rehabilitation_goals')
      .update({ created_by_social_worker_id: null })
      .in('created_by_social_worker_id', duplicateUserIds);

    if (updateGoalsError) {
      console.error('Error updating rehabilitation_goals:', updateGoalsError);
    } else {
      console.log('rehabilitation_goals 업데이트 완료');
    }

    // 2. patients 테이블에서 primary_social_worker_id 업데이트
    const { error: updatePatientsError } = await supabase
      .from('patients')
      .update({ primary_social_worker_id: null })
      .in('primary_social_worker_id', duplicateUserIds);

    if (updatePatientsError) {
      console.error('Error updating patients:', updatePatientsError);
    } else {
      console.log('patients 업데이트 완료');
    }

    // 3. 이제 social_workers에서 삭제
    const { error: swDeleteError } = await supabase
      .from('social_workers')
      .delete()
      .in('user_id', duplicateUserIds);

    if (swDeleteError) {
      console.error('Error deleting from social_workers:', swDeleteError);
    } else {
      console.log('social_workers에서 중복 계정 삭제 완료');
    }

    // 4. 현재 상태 확인
    const { data: admins } = await supabase
      .from('administrators')
      .select('user_id, full_name');
    
    const { data: socialWorkers } = await supabase
      .from('social_workers')
      .select('user_id, full_name');

    console.log('\n최종 administrators:', admins);
    console.log('\n최종 social_workers:', socialWorkers);

    console.log('\n정리 완료! 관리자 패널을 새로고침하세요.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

forceCleanup();
