import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jsilzrsiieswiskzcriy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaWx6cnNpaWVzd2lza3pjcml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODcwNDA2MywiZXhwIjoyMDY0MjgwMDYzfQ.eOV7xEkonxltVxAlFTS6C_jxtgxjasckIYKQlXZBIPU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteTestAdmins() {
  try {
    // 1. 테스트 관리자 찾기
    const { data: testAdmins, error: findError } = await supabase
      .from('administrators')
      .select('user_id, full_name')
      .eq('full_name', '테스트 관리자');

    if (findError) {
      console.error('Error finding test admins:', findError);
      return;
    }

    console.log('Found test admins:', testAdmins);

    if (!testAdmins || testAdmins.length === 0) {
      console.log('No test admins found');
      return;
    }

    const userIds = testAdmins.map(admin => admin.user_id);
    console.log('User IDs to delete:', userIds);

    // 2. administrators에서 삭제
    const { error: adminDeleteError } = await supabase
      .from('administrators')
      .delete()
      .in('user_id', userIds);

    if (adminDeleteError) {
      console.error('Error deleting from administrators:', adminDeleteError);
    } else {
      console.log('Deleted from administrators');
    }

    // 3. user_roles에서 삭제
    const { error: roleDeleteError } = await supabase
      .from('user_roles')
      .delete()
      .in('user_id', userIds);

    if (roleDeleteError) {
      console.error('Error deleting from user_roles:', roleDeleteError);
    } else {
      console.log('Deleted from user_roles');
    }

    // 4. signup_requests에서 삭제
    const { error: requestDeleteError } = await supabase
      .from('signup_requests')
      .delete()
      .in('user_id', userIds);

    if (requestDeleteError) {
      console.error('Error deleting from signup_requests:', requestDeleteError);
    } else {
      console.log('Deleted from signup_requests');
    }

    // 5. auth.users에서 삭제 (service role 필요)
    for (const userId of userIds) {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        console.error(`Error deleting auth user ${userId}:`, authDeleteError);
      } else {
        console.log(`Deleted auth user ${userId}`);
      }
    }

    console.log('Deletion process completed');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

deleteTestAdmins();
