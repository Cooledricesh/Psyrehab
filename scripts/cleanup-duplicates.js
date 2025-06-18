import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jsilzrsiieswiskzcriy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaWx6cnNpaWVzd2lza3pjcml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODcwNDA2MywiZXhwIjoyMDY0MjgwMDYzfQ.eOV7xEkonxltVxAlFTS6C_jxtgxjasckIYKQlXZBIPU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanupDuplicates() {
  try {
    // 중복된 user_id 찾기 (administrators와 social_workers 모두에 있는 경우)
    const duplicateUserIds = [
      '8b08cf58-13e9-4a45-9b97-4455fa466d62',  // 개발 관리자
      '0c8deaa8-64d5-47bb-9b00-60ea9c6d5421'   // 김사회/박승현
    ];

    console.log('중복된 계정 정리 시작...');

    // social_workers 테이블에서 중복 삭제 (관리자는 administrators에만 있어야 함)
    const { error: swDeleteError } = await supabase
      .from('social_workers')
      .delete()
      .in('user_id', duplicateUserIds);

    if (swDeleteError) {
      console.error('Error deleting from social_workers:', swDeleteError);
    } else {
      console.log('social_workers 테이블에서 중복 계정 삭제 완료');
    }

    // 현재 상태 확인
    const { data: admins } = await supabase
      .from('administrators')
      .select('user_id, full_name');
    
    const { data: socialWorkers } = await supabase
      .from('social_workers')
      .select('user_id, full_name');

    console.log('\n정리 후 administrators:', admins);
    console.log('\n정리 후 social_workers:', socialWorkers);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

cleanupDuplicates();
