// Environment variables helper with validation
export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  N8N_WEBHOOK_URL: import.meta.env.VITE_N8N_WEBHOOK_URL,
} as const

// Validation function
export function validateEnvironment() {
  const missing: string[] = []
  
  if (!ENV.SUPABASE_URL) {
    missing.push('VITE_SUPABASE_URL')
  }
  
  if (!ENV.SUPABASE_ANON_KEY) {
    missing.push('VITE_SUPABASE_ANON_KEY')
  }
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing)
    console.log('\nPlease create a .env file in the project root with:')
    console.log('VITE_SUPABASE_URL=https://jsilzrsiieswiskzcriy.supabase.co')
    console.log('VITE_SUPABASE_ANON_KEY=your-supabase-anon-key')
    console.log('VITE_N8N_WEBHOOK_URL=your-n8n-webhook-url')
    
    return false
  }
  
  return true
}

// Development helper
export function logEnvironmentStatus() {
  console.log('Environment variables status:')
  console.log('- SUPABASE_URL:', ENV.SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('- SUPABASE_ANON_KEY:', ENV.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
  console.log('- N8N_WEBHOOK_URL:', ENV.N8N_WEBHOOK_URL ? '✅ Set' : '❌ Missing')
} 