import { supabase, getUserProfile, getUserRole, hasPermission } from '@/lib/supabase'
import type { 
  SignInForm, 
  SignUpForm, 
  UserRole, 
  AnyUserProfile,
  Permission 
} from '@/types/auth'
import type { User, Session } from '@supabase/supabase-js'
import { 
  isValidEmail, 
  validatePassword, 
  validatePasswordConfirmation,
  validateFullName,
  validateEmployeeId,
  validatePatientIdentifier,
  validatePhoneNumber,
  validateDateOfBirth,
  checkRateLimit,
  recordAttempt,
  getAuthErrorMessage
} from '@/utils/auth'
import { AUTH_ERROR_CODES, AUTH_FLOW_CONFIG } from '@/constants/auth'

// Enhanced Authentication service class
export class AuthService {
  // Sign in with email and password
  static async signIn(credentials: SignInForm): Promise<{ 
    success: boolean
    user?: User
    session?: Session
    profile?: AnyUserProfile
    error?: string 
  }> {
    try {
      // Validate email format
      if (!isValidEmail(credentials.email)) {
        return {
          success: false,
          error: '유효한 이메일 주소를 입력해주세요.'
        }
      }

      // Check rate limiting
      const rateLimitCheck = checkRateLimit('signin', credentials.email)
      if (!rateLimitCheck.allowed) {
        const remainingTime = rateLimitCheck.resetTime ? 
          Math.ceil((rateLimitCheck.resetTime - Date.now()) / 60000) : 0
        return {
          success: false,
          error: `로그인 시도 횟수를 초과했습니다. ${remainingTime}분 후 다시 시도해주세요.`
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      // Record attempt
      recordAttempt('signin', credentials.email, !error)

      if (error) {
        return {
          success: false,
          error: getAuthErrorMessage(error)
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: '사용자 정보를 가져올 수 없습니다.'
        }
      }

      // Check if email is confirmed
      if (!data.user.email_confirmed_at) {
        return {
          success: false,
          error: '이메일 인증이 필요합니다. 이메일을 확인해주세요.'
        }
      }

      // Get user profile
      const profile = await getUserProfile(data.user.id)

      // Check if profile exists and is active
      if (!profile) {
        return {
          success: false,
          error: '사용자 프로필을 찾을 수 없습니다. 관리자에게 문의하세요.'
        }
      }

      if (!profile.is_active) {
        return {
          success: false,
          error: '계정이 비활성화되었습니다. 관리자에게 문의하세요.'
        }
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        profile: profile || undefined
      }
    } catch (error: any) {
      recordAttempt('signin', credentials.email, false)
      return {
        success: false,
        error: getAuthErrorMessage(error)
      }
    }
  }

  // Enhanced sign up with comprehensive validation
  static async signUp(formData: SignUpForm): Promise<{
    success: boolean
    user?: User
    error?: string
    requiresEmailConfirmation?: boolean
  }> {
    try {
      // Comprehensive form validation
      const validation = this.validateSignUpForm(formData)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(' ')
        }
      }

      // Check rate limiting
      const rateLimitCheck = checkRateLimit('signup', formData.email)
      if (!rateLimitCheck.allowed) {
        const remainingTime = rateLimitCheck.resetTime ? 
          Math.ceil((rateLimitCheck.resetTime - Date.now()) / 60000) : 0
        return {
          success: false,
          error: `회원가입 시도 횟수를 초과했습니다. ${remainingTime}분 후 다시 시도해주세요.`
        }
      }

      // Create the auth user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role
          },
          emailRedirectTo: `${window.location.origin}${AUTH_FLOW_CONFIG.EMAIL_CONFIRMATION_REDIRECT_URL}`
        }
      })

      // Record attempt
      recordAttempt('signup', formData.email, !error)

      if (error) {
        return {
          success: false,
          error: getAuthErrorMessage(error)
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: '사용자 생성에 실패했습니다.'
        }
      }

      // If email confirmation is required, return early
      if (!data.session) {
        return {
          success: true,
          user: data.user,
          requiresEmailConfirmation: true
        }
      }

      // Create role assignment and profile
      const setupResult = await this.setupUserAccount(data.user.id, formData)
      if (!setupResult.success) {
        // Clean up auth user if setup fails
        await this.cleanupFailedSignup(data.user.id)
        return {
          success: false,
          error: setupResult.error
        }
      }

      return {
        success: true,
        user: data.user,
        requiresEmailConfirmation: false
      }
    } catch (error: any) {
      recordAttempt('signup', formData.email, false)
      return {
        success: false,
        error: getAuthErrorMessage(error)
      }
    }
  }

  // Enhanced sign out with cleanup
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear any local storage data
      localStorage.removeItem('auth_state')
      localStorage.removeItem('user_preferences')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return {
          success: false,
          error: getAuthErrorMessage(error)
        }
      }

      // Redirect to sign out page
      if (typeof window !== 'undefined') {
        window.location.href = AUTH_FLOW_CONFIG.SIGNOUT_REDIRECT_URL
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: getAuthErrorMessage(error)
      }
    }
  }

  // Enhanced password reset with rate limiting
  static async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate email
      if (!isValidEmail(email)) {
        return {
          success: false,
          error: '유효한 이메일 주소를 입력해주세요.'
        }
      }

      // Check rate limiting
      const rateLimitCheck = checkRateLimit('reset', email)
      if (!rateLimitCheck.allowed) {
        const remainingTime = rateLimitCheck.resetTime ? 
          Math.ceil((rateLimitCheck.resetTime - Date.now()) / 60000) : 0
        return {
          success: false,
          error: `비밀번호 재설정 시도 횟수를 초과했습니다. ${remainingTime}분 후 다시 시도해주세요.`
        }
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${AUTH_FLOW_CONFIG.PASSWORD_RESET_REDIRECT_URL}`
      })

      // Record attempt
      recordAttempt('reset', email, !error)

      if (error) {
        return {
          success: false,
          error: getAuthErrorMessage(error)
        }
      }

      return { success: true }
    } catch (error: any) {
      recordAttempt('reset', email, false)
      return {
        success: false,
        error: getAuthErrorMessage(error)
      }
    }
  }

  // Enhanced password update with validation
  static async updatePassword(currentPassword: string, newPassword: string): Promise<{ 
    success: boolean 
    error?: string 
  }> {
    try {
      // Validate new password
      const passwordValidation = validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join(' ')
        }
      }

      // Verify current password by attempting a sign in
      const user = await this.getCurrentUser()
      if (!user?.email) {
        return {
          success: false,
          error: '현재 사용자 정보를 확인할 수 없습니다.'
        }
      }

      // Test current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (verifyError) {
        return {
          success: false,
          error: '현재 비밀번호가 올바르지 않습니다.'
        }
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return {
          success: false,
          error: getAuthErrorMessage(error)
        }
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: getAuthErrorMessage(error)
      }
    }
  }

  // OAuth sign in
  static async signInWithOAuth(provider: 'google' | 'github' | 'azure' | 'facebook'): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${AUTH_FLOW_CONFIG.SIGNIN_REDIRECT_URL}`
        }
      })

      if (error) {
        return {
          success: false,
          error: getAuthErrorMessage(error)
        }
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: getAuthErrorMessage(error)
      }
    }
  }

  // Resend email confirmation
  static async resendEmailConfirmation(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isValidEmail(email)) {
        return {
          success: false,
          error: '유효한 이메일 주소를 입력해주세요.'
        }
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${AUTH_FLOW_CONFIG.EMAIL_CONFIRMATION_REDIRECT_URL}`
        }
      })

      if (error) {
        return {
          success: false,
          error: getAuthErrorMessage(error)
        }
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: getAuthErrorMessage(error)
      }
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Error fetching current user:', error.message)
        return null
      }

      return user
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  // Get current session
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error fetching current session:', error.message)
        return null
      }

      return session
    } catch (error) {
      console.error('Failed to get current session:', error)
      return null
    }
  }

  // Enhanced profile update with validation
  static async updateProfile(userId: string, updates: Partial<AnyUserProfile>): Promise<{
    success: boolean
    profile?: AnyUserProfile
    error?: string
  }> {
    try {
      // Validate updates
      if (updates.full_name) {
        const nameValidation = validateFullName(updates.full_name)
        if (!nameValidation.isValid) {
          return {
            success: false,
            error: nameValidation.error
          }
        }
      }

      const role = await getUserRole(userId)
      
      if (!role) {
        return {
          success: false,
          error: '사용자 역할을 찾을 수 없습니다.'
        }
      }

      let result
      const { role: _, ...profileUpdates } = updates

      switch (role) {
        case 'social_worker':
          // Validate social worker specific fields
          if (updates.employee_id) {
            const empIdValidation = validateEmployeeId(updates.employee_id)
            if (!empIdValidation.isValid) {
              return {
                success: false,
                error: empIdValidation.error
              }
            }
          }

          if (updates.contact_number) {
            const phoneValidation = validatePhoneNumber(updates.contact_number)
            if (!phoneValidation.isValid) {
              return {
                success: false,
                error: phoneValidation.error
              }
            }
          }

          const { data: swData, error: swError } = await supabase
            .from('social_workers')
            .update({
              ...profileUpdates,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single()

          if (swError) {
            return {
              success: false,
              error: getAuthErrorMessage(swError)
            }
          }

          result = { ...swData, role: 'social_worker' as UserRole }
          break

        case 'administrator':
          const { data: adminData, error: adminError } = await supabase
            .from('administrators')
            .update({
              ...profileUpdates,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single()

          if (adminError) {
            return {
              success: false,
              error: getAuthErrorMessage(adminError)
            }
          }

          result = { ...adminData, role: 'administrator' as UserRole }
          break

        case 'patient':
          // Validate patient specific fields
          if (updates.date_of_birth) {
            const dobValidation = validateDateOfBirth(updates.date_of_birth)
            if (!dobValidation.isValid) {
              return {
                success: false,
                error: dobValidation.error
              }
            }
          }

          const { data: patientData, error: patientError } = await supabase
            .from('patients')
            .update({
              ...profileUpdates,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single()

          if (patientError) {
            return {
              success: false,
              error: getAuthErrorMessage(patientError)
            }
          }

          result = { ...patientData, role: 'patient' as UserRole }
          break

        default:
          return {
            success: false,
            error: '지원되지 않는 사용자 역할입니다.'
          }
      }

      return {
        success: true,
        profile: result as AnyUserProfile
      }
    } catch (error: any) {
      return {
        success: false,
        error: getAuthErrorMessage(error)
      }
    }
  }

  // Validate sign up form
  private static validateSignUpForm(formData: SignUpForm): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Email validation
    if (!isValidEmail(formData.email)) {
      errors.push('유효한 이메일 주소를 입력해주세요.')
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors)
    }

    // Password confirmation
    const confirmValidation = validatePasswordConfirmation(formData.password, formData.confirmPassword)
    if (!confirmValidation.isValid) {
      errors.push(confirmValidation.error!)
    }

    // Full name validation
    const nameValidation = validateFullName(formData.full_name)
    if (!nameValidation.isValid) {
      errors.push(nameValidation.error!)
    }

    // Role-specific validation
    switch (formData.role) {
      case 'social_worker':
        if (formData.employee_id) {
          const empIdValidation = validateEmployeeId(formData.employee_id)
          if (!empIdValidation.isValid) {
            errors.push(empIdValidation.error!)
          }
        }
        
        if (formData.contact_number) {
          const phoneValidation = validatePhoneNumber(formData.contact_number)
          if (!phoneValidation.isValid) {
            errors.push(phoneValidation.error!)
          }
        }
        break

      case 'patient':
        if (formData.patient_identifier) {
          const patientIdValidation = validatePatientIdentifier(formData.patient_identifier)
          if (!patientIdValidation.isValid) {
            errors.push(patientIdValidation.error!)
          }
        }
        
        if (formData.date_of_birth) {
          const dobValidation = validateDateOfBirth(formData.date_of_birth)
          if (!dobValidation.isValid) {
            errors.push(dobValidation.error!)
          }
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Setup user account (role and profile)
  private static async setupUserAccount(userId: string, formData: SignUpForm): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Create role assignment
      const roleId = await this.getRoleId(formData.role)
      if (!roleId) {
        return {
          success: false,
          error: AUTH_ERROR_CODES.INVALID_ROLE
        }
      }

      // Insert user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId
        })

      if (roleError) {
        return {
          success: false,
          error: AUTH_ERROR_CODES.ROLE_ASSIGNMENT_FAILED
        }
      }

      // Create profile based on role
      const profileResult = await this.createUserProfile(userId, formData)
      if (!profileResult.success) {
        return profileResult
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: getAuthErrorMessage(error)
      }
    }
  }

  // Helper: Get role ID by role name
  private static async getRoleId(roleName: UserRole): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id')
        .eq('role_name', roleName)
        .single()

      if (error || !data) {
        console.error('Error fetching role ID:', error?.message)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Failed to get role ID:', error)
      return null
    }
  }

  // Helper: Create user profile based on role
  private static async createUserProfile(userId: string, formData: SignUpForm): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      switch (formData.role) {
        case 'social_worker':
          const { error: swError } = await supabase
            .from('social_workers')
            .insert({
              user_id: userId,
              full_name: formData.full_name,
              employee_id: formData.employee_id,
              department: formData.department,
              contact_number: formData.contact_number,
              is_active: true
            })

          if (swError) {
            return {
              success: false,
              error: `사회복지사 프로필 생성 실패: ${getAuthErrorMessage(swError)}`
            }
          }
          break

        case 'administrator':
          const { error: adminError } = await supabase
            .from('administrators')
            .insert({
              user_id: userId,
              full_name: formData.full_name,
              admin_level: formData.admin_level || 0,
              is_active: true
            })

          if (adminError) {
            return {
              success: false,
              error: `관리자 프로필 생성 실패: ${getAuthErrorMessage(adminError)}`
            }
          }
          break

        case 'patient':
          const { error: patientError } = await supabase
            .from('patients')
            .insert({
              user_id: userId,
              full_name: formData.full_name,
              patient_identifier: formData.patient_identifier || `P-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
              date_of_birth: formData.date_of_birth,
              gender: formData.gender,
              status: 'active'
            })

          if (patientError) {
            return {
              success: false,
              error: `환자 프로필 생성 실패: ${getAuthErrorMessage(patientError)}`
            }
          }
          break

        default:
          return {
            success: false,
            error: AUTH_ERROR_CODES.INVALID_ROLE
          }
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: getAuthErrorMessage(error)
      }
    }
  }

  // Cleanup failed signup
  private static async cleanupFailedSignup(userId: string): Promise<void> {
    try {
      // Remove any created records
      await Promise.allSettled([
        supabase.from('user_roles').delete().eq('user_id', userId),
        supabase.from('social_workers').delete().eq('user_id', userId),
        supabase.from('administrators').delete().eq('user_id', userId),
        supabase.from('patients').delete().eq('user_id', userId)
      ])

      // Note: We can't delete the auth user from client side
      // This would need to be handled by a server function or admin action
    } catch (error) {
      console.error('Failed to cleanup after failed signup:', error)
    }
  }
}

// Export individual functions for convenience
export const signIn = AuthService.signIn
export const signUp = AuthService.signUp
export const signOut = AuthService.signOut
export const resetPassword = AuthService.resetPassword
export const updatePassword = AuthService.updatePassword
export const getCurrentUser = AuthService.getCurrentUser
export const getCurrentSession = AuthService.getCurrentSession
export const updateProfile = AuthService.updateProfile
export const signInWithOAuth = AuthService.signInWithOAuth
export const resendEmailConfirmation = AuthService.resendEmailConfirmation

// Permission checking functions
export async function checkUserPermission(userId: string, permission: Permission): Promise<boolean> {
  return await hasPermission(userId, permission)
}

export async function checkUserRole(userId: string, role: UserRole): Promise<boolean> {
  const userRole = await getUserRole(userId)
  return userRole === role
}

// Session management
export function onAuthStateChange(callback: (event: any, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

// Profile fetching
export { getUserProfile, getUserRole } from '@/lib/supabase' 