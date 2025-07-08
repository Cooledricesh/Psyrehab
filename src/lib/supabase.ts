import { createClient } from '@supabase/supabase-js'
import { ENV, validateEnvironment } from './env'
import { handleApiError } from '@/utils/error-handler'

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
      debug: false,
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

// Admin client with service role key (only for admin operations)
export const supabaseAdmin = ENV.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      ENV.SUPABASE_URL || '',
      ENV.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

// Import the generated database types
import type { Database } from '@/types/supabase'

// Export the Database type for use in other files
export type { Database }

// Helper function to test Supabase connection
export async function testSupabaseConnection() {
  try {
    // First check if environment variables are available
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
      handleApiError(new Error('Supabase environment variables not found'), 'supabase.testSupabaseConnection')
      return false
    }

    // Use the simplest possible connection test
    const { data, error } = await supabase.auth.getSession()
    
    // Even if there's no session, a successful response means connection is working
    if (error && error.message.includes('Failed to fetch')) {
      handleApiError(error, 'supabase.testSupabaseConnection.getSession')
      return false
    }
    
    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    handleApiError(error, 'supabase.testSupabaseConnection')
    return false
  }
}

// Authentication helper functions
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      handleApiError(error, 'supabase.getCurrentUser')
      return null
    }
    return user
  } catch (error) {
    handleApiError(error, 'supabase.getCurrentUser')
    return null
  }
}

export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      handleApiError(error, 'supabase.getCurrentSession')
      return null
    }
    return session
  } catch (error) {
    handleApiError(error, 'supabase.getCurrentSession')
    return null
  }
}

// Helper function to create user role and profile for approved signup requests
async function createUserRoleAndProfile(userId: string, signupRequest: any) {
  try {
    // 데이터베이스에서 직접 역할 ID 조회
    const { data: roleData, error: roleQueryError } = await supabase
      .from('roles')
      .select('id')
      .eq('role_name', signupRequest.requested_role)
      .single()

    if (roleQueryError || !roleData) {
      handleApiError(roleQueryError, 'supabase.createUserRoleAndProfile.roleQuery')
      return false
    }

    // 1. user_roles에 역할 할당
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleData.id
      })

    if (roleError && !roleError.message.includes('duplicate')) {
      handleApiError(roleError, 'supabase.createUserRoleAndProfile.roleAssign')
      return false
    }

    // 2. 프로필 생성 - 직급별로 social_workers 테이블에 생성
    const jobTitleRoles = ['staff', 'assistant_manager', 'section_chief', 'manager_level', 'department_head', 'vice_director', 'director']
    
    if (jobTitleRoles.includes(signupRequest.requested_role)) {
      const { error: profileError } = await supabase
        .from('social_workers')
        .insert({
          user_id: userId,
          full_name: signupRequest.full_name,
          employee_id: signupRequest.employee_id || null,
          department: signupRequest.department || null,
          contact_number: signupRequest.contact_number || null,
          is_active: true
        })

      if (profileError && !profileError.message.includes('duplicate')) {
        handleApiError(profileError, 'supabase.createUserRoleAndProfile.socialWorkerProfile')
        return false
      }
    } else if (signupRequest.requested_role === 'administrator') {
      const { error: profileError } = await supabase
        .from('administrators')
        .insert({
          user_id: userId,
          full_name: signupRequest.full_name,
          employee_id: signupRequest.employee_id || null,
          department: signupRequest.department || null,
          contact_number: signupRequest.contact_number || null,
          is_active: true
        })

      if (profileError && !profileError.message.includes('duplicate')) {
        handleApiError(profileError, 'supabase.createUserRoleAndProfile.administratorProfile')
        return false
      }
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
      handleApiError(updateError, 'supabase.createUserRoleAndProfile.updateSignupRequest')
    }

    return true
  } catch (error) {
    handleApiError(error, 'supabase.createUserRoleAndProfile')
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
      handleApiError(error, 'supabase.getUserRole')
      return null
    }

    return data?.roles?.role_name || null
  } catch (error) {
    handleApiError(error, 'supabase.getUserRole')
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
    
    // 직급별 역할들
    const jobTitleRoles = ['staff', 'assistant_manager', 'section_chief', 'manager_level', 'department_head', 'vice_director', 'director', 'attending_physician']
    
    // Fetch profile based on role
    if (jobTitleRoles.includes(role)) {
      const { data: socialWorker, error: swError } = await supabase
        .from('social_workers')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (swError) {
        handleApiError(swError, 'supabase.getUserProfile.socialWorker')
        return null
      }
      
      profile = { ...socialWorker, role }
    } else if (role === 'administrator') {
      const { data: admin, error: adminError } = await supabase
        .from('administrators')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (adminError) {
        handleApiError(adminError, 'supabase.getUserProfile.administrator')
        return null
      }
      
      profile = { ...admin, role: 'administrator' }
    } else if (role === 'patient') {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (patientError) {
        handleApiError(patientError, 'supabase.getUserProfile.patient')
        return null
      }
      
      profile = { ...patient, role: 'patient' }
    } else {
      console.warn(`Unknown role: ${role}`)
      return null
    }

    return profile
  } catch (error) {
    handleApiError(error, 'supabase.getUserProfile')
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
      // 직급별 권한 (사회복지사 권한)
      staff: [
        'manage_assigned_patients',
        'create_goals',
        'update_goals',
        'view_patient_data',
        'create_assessments',
        'manage_services',
        'view_own_analytics'
      ],
      assistant_manager: [
        'manage_assigned_patients',
        'create_goals',
        'update_goals',
        'view_patient_data',
        'create_assessments',
        'manage_services',
        'view_own_analytics'
      ],
      section_chief: [
        'manage_assigned_patients',
        'create_goals',
        'update_goals',
        'view_patient_data',
        'create_assessments',
        'manage_services',
        'view_own_analytics'
      ],
      manager_level: [
        'manage_assigned_patients',
        'create_goals',
        'update_goals',
        'view_patient_data',
        'create_assessments',
        'manage_services',
        'view_own_analytics'
      ],
      department_head: [
        'manage_assigned_patients',
        'create_goals',
        'update_goals',
        'view_patient_data',
        'create_assessments',
        'manage_services',
        'view_own_analytics',
        'manage_social_workers'
      ],
      vice_director: [
        'manage_users',
        'manage_social_workers',
        'manage_patients',
        'view_all_data',
        'view_analytics',
        'manage_goals',
        'manage_assessments',
        'manage_services'
      ],
      director: [
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
      attending_physician: [
        'view_patient_data',
        'create_assessments',
        'view_analytics',
        'manage_goals'
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
    handleApiError(error, 'supabase.hasPermission')
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