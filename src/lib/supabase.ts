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
      detectSessionInUrl: false, // 변경: 무한 루프 방지
      // Storage configuration for better session handling
      storage: {
        getItem: (key: string) => {
          if (typeof window !== 'undefined') {
            return window.localStorage.getItem(key)
          }
          return null
        },
        setItem: (key: string, value: string) => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value)
          }
        },
        removeItem: (key: string) => {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key)
          }
        }
      },
      // Debug mode for development
      debug: false, // 변경: 디버그 로그 줄이기
      // Flow type for authentication
      // flowType: 'pkce' // 주석 처리: 기본값 사용
    },
    // Global options
    global: {
      headers: {
        'X-Client-Info': 'psyrehab-web'
      }
    },
    // Real-time configuration
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)

// Import the generated database types
import type { Database } from '@/types/supabase'

// Export the Database type for use in other files
export type { Database }

// Helper function to test Supabase connection
export async function testSupabaseConnection() {
  try {
    // First check if environment variables are available
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables not found')
      return false
    }

    // Use the simplest possible connection test
    const { data, error } = await supabase.auth.getSession()
    
    // Even if there's no session, a successful response means connection is working
    if (error && error.message.includes('Failed to fetch')) {
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

// Authentication helper functions
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error fetching user:', error.message)
      return null
    }
    return user
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error fetching session:', error.message)
      return null
    }
    return session
  } catch (error) {
    console.error('Failed to get current session:', error)
    return null
  }
}

// User role helper functions
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles (
          role_name
        )
      `)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user role:', error.message)
      return null
    }

    return data?.roles?.role_name || null
  } catch (error) {
    console.error('Failed to get user role:', error)
    return null
  }
}

export async function getUserProfile(userId: string) {
  try {
    // First get the user role
    const role = await getUserRole(userId)
    
    if (!role) {
      return null
    }

    let profile = null
    
    // Fetch profile based on role
    switch (role) {
      case 'social_worker':
        const { data: socialWorker, error: swError } = await supabase
          .from('social_workers')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        if (swError) {
          console.error('Error fetching social worker profile:', swError.message)
          return null
        }
        
        profile = { ...socialWorker, role: 'social_worker' }
        break

      case 'administrator':
        const { data: admin, error: adminError } = await supabase
          .from('administrators')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        if (adminError) {
          console.error('Error fetching administrator profile:', adminError.message)
          return null
        }
        
        profile = { ...admin, role: 'administrator' }
        break

      case 'patient':
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        if (patientError) {
          console.error('Error fetching patient profile:', patientError.message)
          return null
        }
        
        profile = { ...patient, role: 'patient' }
        break

      default:
        console.warn(`Unknown role: ${role}`)
        return null
    }

    return profile
  } catch (error) {
    console.error('Failed to get user profile:', error)
    return null
  }
}

// Check if user has specific permission
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    const role = await getUserRole(userId)
    
    if (!role) {
      return false
    }

    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      administrator: [
        'manage_users',
        'manage_social_workers',
        'manage_patients',
        'view_all_data',
        'manage_system_settings',
        'view_analytics',
        'manage_goals',
        'manage_assessments',
        'manage_services'
      ],
      social_worker: [
        'manage_assigned_patients',
        'create_goals',
        'update_goals',
        'view_patient_data',
        'create_assessments',
        'manage_services',
        'view_own_analytics'
      ],
      patient: [
        'view_own_data',
        'update_own_profile',
        'view_own_goals',
        'submit_check_ins'
      ]
    }

    return rolePermissions[role]?.includes(permission) || false
  } catch (error) {
    console.error('Failed to check permission:', error)
    return false
  }
}

// Authentication event listener setup
export function setupAuthListeners() {
  supabase.auth.onAuthStateChange((event, session) => {
    if (import.meta.env.DEV) {
      console.log('Auth state changed:', event, session?.user?.email)
    }

    switch (event) {
      case 'SIGNED_IN':
        console.log('User signed in')
        break
      case 'SIGNED_OUT':
        console.log('User signed out')
        // Clear any cached data - reload 제거
        break
      case 'TOKEN_REFRESHED':
        console.log('Token refreshed')
        break
      case 'USER_UPDATED':
        console.log('User updated')
        break
      case 'PASSWORD_RECOVERY':
        console.log('Password recovery initiated')
        break
    }
  })
}

// Environment configuration helper
export function getEnvironmentConfig() {
  return {
    supabaseUrl: ENV.SUPABASE_URL,
    hasSupabaseKey: !!ENV.SUPABASE_ANON_KEY,
    hasN8nWebhook: !!ENV.N8N_WEBHOOK_URL,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD
  }
} 