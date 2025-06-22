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
      debug: import.meta.env.DEV,
      // Flow type for authentication
      flowType: 'pkce'
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
      console.error("Error occurred")
      return false
    }
    
    console.log('✅ Supabase connection successful')
    return true
  } catch {
    console.error("Error occurred")
    return false
  }
}

// Authentication helper functions
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error("Error occurred")
      return null
    }
    return user
  } catch {
    console.error("Error occurred")
    return null
  }
}

export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error("Error occurred")
      return null
    }
    return session
  } catch {
    console.error("Error occurred")
    return null
  }
}

// Helper function to create user role and profile for approved signup requests
async function createUserRoleAndProfile(userId: string, signupRequest: any) {
  try {
    const roleMap = {
      'social_worker': '6a5037f6-5553-47f9-824f-bf1e767bda95',
      'administrator': 'd7fcf425-85bc-42b4-8806-917ef6939a40'
    }

    // 1. user_roles에 역할 할당
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleMap[signupRequest.requested_role as keyof typeof roleMap]
      })

    if (roleError && !roleError.message.includes('duplicate')) {
      console.error('역할 할당 실패:', roleError)
      return false
    }

    // 2. 프로필 생성
    const table = signupRequest.requested_role === 'social_worker' ? 'social_workers' : 'administrators'
    const { error: profileError } = await supabase
      .from(table)
      .insert({
        user_id: userId,
        full_name: signupRequest.full_name,
        employee_id: signupRequest.employee_id || null,
        department: signupRequest.department || null,
        contact_number: signupRequest.contact_number || null,
        is_active: true
      })

    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('프로필 생성 실패:', profileError)
      return false
    }

    // 3. signup_requests 업데이트
    const { error: updateError } = await supabase
      .from('signup_requests')
      .update({
        user_id: userId,
        status: 'completed'
      })
      .eq('id', signupRequest.id)

    if (updateError) {
      console.error('신청서 업데이트 실패:', updateError)
    }

    return true
  } catch (error) {
    console.error('사용자 역할 및 프로필 생성 중 오류:', error)
    return false
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
      console.error("Error occurred")
      return null
    }

    return data?.roles?.role_name || null
  } catch {
    console.error("Error occurred")
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
  } catch {
    console.error("Error occurred")
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
  } catch {
    console.error("Error occurred")
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
        // Clear any cached data
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
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