import { createClient } from '@supabase/supabase-js'
import { ENV, validateEnvironment } from './env'

// Validate environment variables on import
validateEnvironment()

export const supabase = createClient(
  ENV.SUPABASE_URL || '',
  ENV.SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

// Database types will be generated later
export type Database = any

// Helper function to test Supabase connection
export async function testSupabaseConnection() {
  try {
    const { error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.error('Supabase connection error:', error.message)
      return false
    }
    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection failed:', error)
    return false
  }
} 