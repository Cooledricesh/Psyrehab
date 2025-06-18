import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jsilzrsiieswiskzcriy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaWx6cnNpaWVzd2lza3pjcml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODcwNDA2MywiZXhwIjoyMDY0MjgwMDYzfQ.eOV7xEkonxltVxAlFTS6C_jxtgxjasckIYKQlXZBIPU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteTestAccounts() {
  try {
    console.log('테스트 계정 삭제 시작...');

    // test@psyrehab.com과 test@psyrehab.local의 user_id 찾기
    const testEmails = ['test@psyrehab.com', 'test@psyrehab.local'];
    
    // 먼저 auth.users에서 user_id 찾기
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const testUsers = users.filter(user => testEmails.includes(user.email || ''));
    console.log('찾은 테스트 계정:', testUsers.map(u => ({ id: u.id, email: u.email })));

    for (const user of testUsers) {
      const userId = user.id;
      
      // 1. 각 테이블에서 관련 데이터 삭제
      
      // administrators에서 삭제
      const { error: adminError } = await supabase
        .from('administrators')
        .delete()
        .eq('user_id', userId);
      if (adminError) console.log(`administrators 삭제 시도 (${user.email}):`, adminError?.message || 'Success');

      // social_workers에서 삭제
      const { error: swError } = await supabase
        .from('social_workers')
        .delete()
        .eq('user_id', userId);
      if (swError) console.log(`social_workers 삭제 시도 (${user.email}):`, swError?.message || 'Success');

      // user_roles에서 삭제
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      if (roleError) console.log(`user_roles 삭제 시도 (${user.email}):`, roleError?.message || 'Success');

      // signup_requests에서 삭제
      const { error: reqError } = await supabase
        .from('signup_requests')
        .delete()
        .eq('user_id', userId);
      if (reqError) console.log(`signup_requests 삭제 시도 (${user.email}):`, reqError?.message || 'Success');

      // 2. auth.users에서 삭제
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        console.error(`Auth user 삭제 실패 (${user.email}):`, authError);
      } else {
        console.log(`✅ ${user.email} 계정 삭제 완료!`);
      }
    }

    console.log('\n삭제 작업 완료! Supabase Dashboard를 새로고침하세요.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

deleteTestAccounts();
