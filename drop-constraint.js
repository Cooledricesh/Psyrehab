import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function dropConstraint() {
  console.log('=== DROPPING FOREIGN KEY CONSTRAINT ===');
  
  try {
    // Execute the SQL query
    const { data, error } = await supabase.rpc('query', {
      query: 'ALTER TABLE signup_requests DROP CONSTRAINT IF EXISTS signup_requests_user_id_fkey CASCADE;'
    });
    
    if (error) {
      console.error('Error dropping constraint:', error);
      
      // Try alternative approach using direct SQL
      console.log('\nTrying alternative approach...');
      const { data: altData, error: altError } = await supabase
        .from('signup_requests')
        .select('*')
        .limit(0); // Just to test connection
        
      if (altError) {
        console.error('Connection test failed:', altError);
      } else {
        console.log('Connection successful, but RPC might not be available.');
        console.log('\nPlease execute this SQL directly in Supabase SQL Editor:');
        console.log('ALTER TABLE signup_requests DROP CONSTRAINT IF EXISTS signup_requests_user_id_fkey CASCADE;');
      }
    } else {
      console.log('✅ Constraint dropped successfully!');
      console.log('Result:', data);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

dropConstraint();