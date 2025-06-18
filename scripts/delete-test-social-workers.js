import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jsilzrsiieswiskzcriy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaWx6cnNpaWVzd2lza3pjcml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODcwNDA2MywiZXhwIjoyMDY0MjgwMDYzfQ.eOV7xEkonxltVxAlFTS6C_jxtgxjasckIYKQlXZBIPU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function findAndDeleteTestUsers() {
  try {
    // 1. social_workers 테이블에서 테스트 관리자 찾기
    const { data: testSocialWorkers, error: swError } = await supabase
      .from('social_workers')
      .select('user_id, full_name, created_at')
      .eq('full_name', '테스트 관리자');

    console.log('Social workers named 테스트 관리자:', testSocialWorkers);

    if (testSocialWorkers && testSocialWorkers.length > 0) {
      const userIds = testSocialWorkers.map(sw => sw.user_id);
      
      // social_workers에서 삭제
      const { error: deleteSwError } = await supabase
        .from('social_workers')
        .delete()
        .in('user_id', userIds);

      if (deleteSwError) {
        console.error('Error deleting from social_workers:', deleteSwError);
      } else {
        console.log('Deleted from social_workers');
      }

      // user_roles에서 삭제
      const { error: deleteRoleError } = await supabase
        .from('user_roles')
        .delete()
        .in('user_id', userIds);

      if (deleteRoleError) {
        console.error('Error deleting from user_roles:', deleteRoleError);
      } else {
        console.log('Deleted from user_roles');
      }

      // auth.users에서 삭제
      for (const userId of userIds) {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
        if (authDeleteError) {
          console.error(`Error deleting auth user ${userId}:`, authDeleteError);
        } else {
          console.log(`Deleted auth user ${userId}`);
        }
      }
    }

    // 2. 모든 social_workers 확인
    const { data: allSocialWorkers } = await supabase
      .from('social_workers')
      .select('user_id, full_name, created_at')
      .order('created_at', { ascending: false });

    console.log('\n현재 모든 social_workers:');
    console.log(JSON.stringify(allSocialWorkers, null, 2));

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

findAndDeleteTestUsers();
