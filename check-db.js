import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDatabase() {
  console.log('=== DATABASE STRUCTURE CHECK ===');
  
  try {
    // Check social_workers table
    console.log('\n1. Social Workers:');
    const { data: socialWorkers, error: swError } = await supabase
      .from('social_workers')
      .select('*');
    
    if (swError) {
      console.log('Social workers error:', swError.message);
    } else {
      console.log('Social workers count:', socialWorkers?.length || 0);
      socialWorkers?.forEach(sw => {
        console.log(`- ${sw.full_name} (${sw.user_id})`);
      });
    }

    // Check administrators table
    console.log('\n2. Administrators:');
    const { data: admins, error: adminError } = await supabase
      .from('administrators')
      .select('*');
    
    if (adminError) {
      console.log('Administrators error:', adminError.message);
    } else {
      console.log('Administrators count:', admins?.length || 0);
      admins?.forEach(admin => {
        console.log(`- ${admin.full_name} (${admin.user_id})`);
      });
    }

    // Check patients table
    console.log('\n3. Patients:');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name');
    
    if (patientsError) {
      console.log('Patients error:', patientsError.message);
    } else {
      console.log('Patients count:', patients?.length || 0);
    }

    // Check user_roles table
    console.log('\n4. User Roles:');
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');
    
    if (rolesError) {
      console.log('User roles error:', rolesError.message);
    } else {
      console.log('User roles count:', userRoles?.length || 0);
    }

  } catch (error) {
    console.error('Database check failed:', error);
  }
}

checkDatabase();