import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jsilzrsiieswiskzcriy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaWx6cnNpaWVzd2lza3pjcml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODcwNDA2MywiZXhwIjoyMDY0MjgwMDYzfQ.eOV7xEkonxltVxAlFTS6C_jxtgxjasckIYKQlXZBIPU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteTestAccountsByUID() {
  try {
    console.log('테스트 계정 삭제 시작...');

    // 스크린샷에서 보이는 test@psyrehab.com과 test@psyrehab.local의 user_id
    const testUserIds = [
      '706cb795-1766-403d-ab8c-d69e8920a823',  // test@psyrehab.com
      '11111111-1111-1111-1111-111111111111'    // test@psyrehab.local (8자리-4자리-4자리-4자리-12자리)
    ];

    for (const userId of testUserIds) {
      console.log(`\n처리 중: ${userId}`);
      
      // 1. 각 테이블에서 삭제 시도
      const tables = ['administrators', 'social_workers', 'user_roles', 'signup_requests', 'patients'];
      
      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', userId);
          
        if (error) {
          console.log(`  ${table}: ${error.message}`);
        } else {
          console.log(`  ${table}: 삭제됨 또는 없음`);
        }
      }
    }

    console.log('\n완료! 이제 Supabase Dashboard에서 직접 auth.users에서 삭제해주세요:');
    console.log('1. Authentication > Users 탭');
    console.log('2. test@psyrehab.com과 test@psyrehab.local 찾기');
    console.log('3. 각 행 끝의 점 3개(⋮) 클릭 → Delete user');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

deleteTestAccountsByUID();
