import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthForm } from '@/hooks/useAuthState'
import { 
  isValidEmail, 
  validatePassword, 
  validatePasswordConfirmation,
  validateFullName,
  validateEmployeeId,
  validatePatientIdentifier,
  validatePhoneNumber,
  validateDateOfBirth
} from '@/utils/auth'
import type { UserRole, SignUpForm as SignUpFormData } from '@/types/auth'

interface SignUpFormProps {
  onSuccess?: (requiresEmailConfirmation?: boolean) => void
  onSignInRedirect?: () => void
  initialRole?: UserRole
  allowRoleSelection?: boolean
  className?: string
}

/**
 * Sign up form component
 */
export function SignUpForm({
  onSuccess,
  onSignInRedirect,
  initialRole = 'patient',
  allowRoleSelection = true,
  className = ''
}: SignUpFormProps) {
  const { signUp } = useAuth()
  const {
    errors,
    setFieldError,
    clearFieldError,
    isSubmitting,
    setIsSubmitting,
    hasErrors,
    resetForm
  } = useAuthForm()

  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: initialRole,
    // Role-specific fields
    employee_id: '',
    department: '',
    contact_number: '',
    admin_level: 1,
    patient_identifier: '',
    date_of_birth: '',
    gender: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [step, setStep] = useState(1) // Multi-step form

  const handleInputChange = (field: keyof SignUpFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      clearFieldError(field)
    }
  }

  const validateStep1 = (): boolean => {
    let isValid = true

    // Email validation
    if (!formData.email) {
      setFieldError('email', '이메일을 입력해주세요.')
      isValid = false
    } else if (!isValidEmail(formData.email)) {
      setFieldError('email', '유효한 이메일 주소를 입력해주세요.')
      isValid = false
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      setFieldError('password', passwordValidation.errors.join(' '))
      isValid = false
    }

    // Confirm password validation
    const confirmValidation = validatePasswordConfirmation(formData.password, formData.confirmPassword)
    if (!confirmValidation.isValid) {
      setFieldError('confirmPassword', confirmValidation.error!)
      isValid = false
    }

    // Full name validation
    const nameValidation = validateFullName(formData.full_name)
    if (!nameValidation.isValid) {
      setFieldError('full_name', nameValidation.error!)
      isValid = false
    }

    return isValid
  }

  const validateStep2 = (): boolean => {
    let isValid = true

    // Role-specific validation
    switch (formData.role) {
      case 'social_worker':
        if (formData.employee_id) {
          const empIdValidation = validateEmployeeId(formData.employee_id)
          if (!empIdValidation.isValid) {
            setFieldError('employee_id', empIdValidation.error!)
            isValid = false
          }
        }
        
        if (formData.contact_number) {
          const phoneValidation = validatePhoneNumber(formData.contact_number)
          if (!phoneValidation.isValid) {
            setFieldError('contact_number', phoneValidation.error!)
            isValid = false
          }
        }
        break

      case 'patient':
        if (formData.patient_identifier) {
          const patientIdValidation = validatePatientIdentifier(formData.patient_identifier)
          if (!patientIdValidation.isValid) {
            setFieldError('patient_identifier', patientIdValidation.error!)
            isValid = false
          }
        }
        
        if (formData.date_of_birth) {
          const dobValidation = validateDateOfBirth(formData.date_of_birth)
          if (!dobValidation.isValid) {
            setFieldError('date_of_birth', dobValidation.error!)
            isValid = false
          }
        }
        break
    }

    return isValid
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep2()) return

    setIsSubmitting(true)
    
    try {
      const result = await signUp(formData.email, formData.password, formData)
      
      if (result.success) {
        resetForm()
        onSuccess?.(result.requiresEmailConfirmation)
      } else {
        setFieldError('submit', result.error || '회원가입에 실패했습니다.')
      }
    } catch (error: unknown) {
      setFieldError('submit', error.message || '회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrevStep = () => {
    setStep(1)
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          이메일 주소 <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="이메일을 입력하세요"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          이름 <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            value={formData.full_name}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.full_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="이름을 입력하세요"
            disabled={isSubmitting}
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
          )}
        </div>
      </div>

      {/* Role Selection */}
      {allowRoleSelection && (
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            역할 <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="patient">환자</option>
              <option value="social_worker">사회복지사</option>
              <option value="administrator">관리자</option>
            </select>
          </div>
        </div>
      )}

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          비밀번호 <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="비밀번호를 입력하세요"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            disabled={isSubmitting}
          >
            {showPassword ? (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          비밀번호 확인 <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="비밀번호를 다시 입력하세요"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            disabled={isSubmitting}
          >
            {showConfirmPassword ? (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* Next Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          다음 단계
        </button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Role-specific fields */}
      {formData.role === 'social_worker' && (
        <>
          {/* Employee ID */}
          <div>
            <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
              직원 번호
            </label>
            <div className="mt-1">
              <input
                id="employee_id"
                name="employee_id"
                type="text"
                value={formData.employee_id || ''}
                onChange={(e) => handleInputChange('employee_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.employee_id ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="SW-2024-0001"
                disabled={isSubmitting}
              />
              {errors.employee_id && (
                <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>
              )}
            </div>
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              부서
            </label>
            <div className="mt-1">
              <input
                id="department"
                name="department"
                type="text"
                value={formData.department || ''}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="정신건강복지과"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Contact Number */}
          <div>
            <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">
              연락처
            </label>
            <div className="mt-1">
              <input
                id="contact_number"
                name="contact_number"
                type="tel"
                value={formData.contact_number || ''}
                onChange={(e) => handleInputChange('contact_number', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contact_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="010-1234-5678"
                disabled={isSubmitting}
              />
              {errors.contact_number && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_number}</p>
              )}
            </div>
          </div>
        </>
      )}

      {formData.role === 'patient' && (
        <>
          {/* Patient Identifier */}
          <div>
            <label htmlFor="patient_identifier" className="block text-sm font-medium text-gray-700">
              환자 식별번호
            </label>
            <div className="mt-1">
              <input
                id="patient_identifier"
                name="patient_identifier"
                type="text"
                value={formData.patient_identifier || ''}
                onChange={(e) => handleInputChange('patient_identifier', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.patient_identifier ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="P-2024-0001"
                disabled={isSubmitting}
              />
              {errors.patient_identifier && (
                <p className="mt-1 text-sm text-red-600">{errors.patient_identifier}</p>
              )}
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
              생년월일
            </label>
            <div className="mt-1">
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.date_of_birth && (
                <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
              )}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              성별
            </label>
            <div className="mt-1">
              <select
                id="gender"
                name="gender"
                value={formData.gender || ''}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="">선택해주세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </div>
          </div>
        </>
      )}

      {formData.role === 'administrator' && (
        <div>
          <label htmlFor="admin_level" className="block text-sm font-medium text-gray-700">
            관리자 레벨
          </label>
          <div className="mt-1">
            <select
              id="admin_level"
              name="admin_level"
              value={formData.admin_level || 1}
              onChange={(e) => handleInputChange('admin_level', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value={1}>레벨 1 (일반 관리자)</option>
              <option value={2}>레벨 2 (고급 관리자)</option>
              <option value={3}>레벨 3 (시스템 관리자)</option>
            </select>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={isSubmitting}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          이전
        </button>
        <button
          type="submit"
          disabled={isSubmitting || hasErrors}
          className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              가입 중...
            </div>
          ) : (
            '회원가입 완료'
          )}
        </button>
      </div>
    </div>
  )

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">회원가입</h2>
        <p className="mt-2 text-sm text-gray-600">
          새 계정을 만들어 서비스를 이용하세요
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">기본 정보</span>
          </div>
          
          <div className={`flex-1 mx-4 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">추가 정보</span>
          </div>
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={step === 1 ? handleStep1Submit : handleFinalSubmit}>
        {step === 1 ? renderStep1() : renderStep2()}
      </form>

      {/* Sign In Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <button
            type="button"
            onClick={onSignInRedirect}
            className="font-medium text-blue-600 hover:text-blue-500"
            disabled={isSubmitting}
          >
            로그인
          </button>
        </p>
      </div>
    </div>
  )
}

/**
 * Simple sign up form for quick registration
 */
interface SimpleSignUpFormProps {
  onSuccess?: (requiresEmailConfirmation?: boolean) => void
  role?: UserRole
  className?: string
}

export function SimpleSignUpForm({
  onSuccess,
  role = 'patient',
  className = ''
}: SimpleSignUpFormProps) {
  return (
    <SignUpForm
      onSuccess={onSuccess}
      initialRole={role}
      allowRoleSelection={false}
      className={className}
    />
  )
}

/**
 * Role-specific sign up forms
 */
export function PatientSignUpForm(props: Omit<SimpleSignUpFormProps, 'role'>) {
  return <SimpleSignUpForm {...props} role="patient" />
}

export function SocialWorkerSignUpForm(props: Omit<SimpleSignUpFormProps, 'role'>) {
  return <SimpleSignUpForm {...props} role="social_worker" />
}

export function AdminSignUpForm(props: Omit<SimpleSignUpFormProps, 'role'>) {
  return <SimpleSignUpForm {...props} role="administrator" />
} 