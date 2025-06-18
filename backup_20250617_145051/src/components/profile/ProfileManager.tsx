import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/hooks/useAuthState'
import { useAuthForm } from '@/hooks/useAuthState'
import { validateFullName, validatePhoneNumber, validateEmployeeId, validatePatientIdentifier, validateDateOfBirth } from '@/utils/auth'
import type { AnyUserProfile, SocialWorkerProfile, AdministratorProfile, PatientProfile } from '@/types/auth'

interface ProfileManagerProps {
  editable?: boolean
  showPasswordChange?: boolean
  onProfileUpdated?: (profile: AnyUserProfile) => void
  compact?: boolean
}

/**
 * Main profile management component
 */
export function ProfileManager({ 
  editable = true, 
  showPasswordChange = true,
  onProfileUpdated,
  compact = false 
}: ProfileManagerProps) {
  const { updateProfile } = useAuth()
  const { profile, displayName, roleDisplayName, isComplete, missingFields } = useUserProfile()
  const { 
    errors, 
    setFieldError, 
    clearFieldError, 
    isSubmitting, 
    setIsSubmitting,
    hasErrors,
    resetForm 
  } = useAuthForm()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<AnyUserProfile>>(profile || {})
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  if (!profile) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">프로필 정보 없음</h3>
          <p className="text-gray-600">사용자 프로필 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      clearFieldError(field)
    }
  }

  const validateForm = (): boolean => {
    let isValid = true

    // Validate full name
    if (formData.full_name) {
      const nameValidation = validateFullName(formData.full_name)
      if (!nameValidation.isValid) {
        setFieldError('full_name', nameValidation.error!)
        isValid = false
      }
    }

    // Role-specific validation
    switch (profile.role) {
      case 'social_worker':
        const swProfile = formData as Partial<SocialWorkerProfile>
        
        if (swProfile.employee_id) {
          const empIdValidation = validateEmployeeId(swProfile.employee_id)
          if (!empIdValidation.isValid) {
            setFieldError('employee_id', empIdValidation.error!)
            isValid = false
          }
        }

        if (swProfile.contact_number) {
          const phoneValidation = validatePhoneNumber(swProfile.contact_number)
          if (!phoneValidation.isValid) {
            setFieldError('contact_number', phoneValidation.error!)
            isValid = false
          }
        }
        break

      case 'patient':
        const patientProfile = formData as Partial<PatientProfile>
        
        if (patientProfile.patient_identifier) {
          const patientIdValidation = validatePatientIdentifier(patientProfile.patient_identifier)
          if (!patientIdValidation.isValid) {
            setFieldError('patient_identifier', patientIdValidation.error!)
            isValid = false
          }
        }

        if (patientProfile.date_of_birth) {
          const dobValidation = validateDateOfBirth(patientProfile.date_of_birth)
          if (!dobValidation.isValid) {
            setFieldError('date_of_birth', dobValidation.error!)
            isValid = false
          }
        }
        break
    }

    return isValid
  }

  const handleSaveProfile = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      const result = await updateProfile(formData)
      
      if (result.success) {
        setIsEditing(false)
        resetForm()
        onProfileUpdated?.(result.profile!)
      } else {
        setFieldError('submit', result.error || '프로필 업데이트에 실패했습니다.')
      }
    } catch (error: any) {
      setFieldError('submit', error.message || '프로필 업데이트 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormData(profile)
    resetForm()
  }

  const renderBasicInfo = () => (
    <div className="space-y-4">
      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이름 <span className="text-red-500">*</span>
        </label>
        {isEditing ? (
          <div>
            <input
              type="text"
              value={formData.full_name || ''}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.full_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="이름을 입력하세요"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
            )}
          </div>
        ) : (
          <p className="text-gray-900">{displayName}</p>
        )}
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
        <p className="text-gray-900">{roleDisplayName}</p>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          profile.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {profile.is_active ? '활성' : '비활성'}
        </span>
      </div>
    </div>
  )

  const renderRoleSpecificFields = () => {
    switch (profile.role) {
      case 'social_worker':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">사회복지사 정보</h4>
            
            {/* Employee ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">직원 번호</label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={(formData as SocialWorkerProfile).employee_id || ''}
                    onChange={(e) => handleInputChange('employee_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.employee_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="SW-2024-0001"
                  />
                  {errors.employee_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-900">{(profile as SocialWorkerProfile).employee_id || '-'}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
              {isEditing ? (
                <input
                  type="text"
                  value={(formData as SocialWorkerProfile).department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="부서명을 입력하세요"
                />
              ) : (
                <p className="text-gray-900">{(profile as SocialWorkerProfile).department || '-'}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
              {isEditing ? (
                <div>
                  <input
                    type="tel"
                    value={(formData as SocialWorkerProfile).contact_number || ''}
                    onChange={(e) => handleInputChange('contact_number', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.contact_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="010-1234-5678"
                  />
                  {errors.contact_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.contact_number}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-900">{(profile as SocialWorkerProfile).contact_number || '-'}</p>
              )}
            </div>
          </div>
        )

      case 'patient':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">환자 정보</h4>
            
            {/* Patient Identifier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">환자 식별번호</label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={(formData as PatientProfile).patient_identifier || ''}
                    onChange={(e) => handleInputChange('patient_identifier', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.patient_identifier ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="P-2024-0001"
                  />
                  {errors.patient_identifier && (
                    <p className="mt-1 text-sm text-red-600">{errors.patient_identifier}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-900">{(profile as PatientProfile).patient_identifier || '-'}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
              {isEditing ? (
                <div>
                  <input
                    type="date"
                    value={(formData as PatientProfile).date_of_birth || ''}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.date_of_birth && (
                    <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-900">
                  {(profile as PatientProfile).date_of_birth 
                    ? new Date((profile as PatientProfile).date_of_birth!).toLocaleDateString('ko-KR')
                    : '-'
                  }
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
              {isEditing ? (
                <select
                  value={(formData as PatientProfile).gender || ''}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택해주세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              ) : (
                <p className="text-gray-900">
                  {(profile as PatientProfile).gender === 'male' ? '남성' :
                   (profile as PatientProfile).gender === 'female' ? '여성' :
                   (profile as PatientProfile).gender === 'other' ? '기타' : '-'}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">환자 상태</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                (profile as PatientProfile).status === 'active' ? 'bg-green-100 text-green-800' :
                (profile as PatientProfile).status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                (profile as PatientProfile).status === 'discharged' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {(profile as PatientProfile).status === 'active' ? '활성' :
                 (profile as PatientProfile).status === 'inactive' ? '비활성' :
                 (profile as PatientProfile).status === 'discharged' ? '퇴원' : '기타'}
              </span>
            </div>
          </div>
        )

      case 'administrator':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">관리자 정보</h4>
            
            {/* Admin Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">관리자 레벨</label>
              <p className="text-gray-900">{(profile as AdministratorProfile).admin_level || 0}</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderMetadata = () => (
    <div className="pt-4 border-t border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium text-gray-700">가입일:</span>
          <span className="ml-2 text-gray-600">
            {new Date(profile.created_at).toLocaleDateString('ko-KR')}
          </span>
        </div>
        <div>
          <span className="font-medium text-gray-700">최종 수정:</span>
          <span className="ml-2 text-gray-600">
            {new Date(profile.updated_at).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">프로필 정보</h3>
            {!isComplete && (
              <p className="mt-1 text-sm text-amber-600">
                프로필이 완성되지 않았습니다. 누락된 정보: {missingFields.join(', ')}
              </p>
            )}
          </div>
          
          {editable && (
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSubmitting || hasErrors}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? '저장 중...' : '저장'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  수정
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {/* Submit Error */}
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          {renderBasicInfo()}
          
          {/* Role-specific Information */}
          {renderRoleSpecificFields()}
          
          {/* Metadata */}
          {!compact && renderMetadata()}
        </div>
      </div>

      {/* Actions */}
      {showPasswordChange && !isEditing && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            비밀번호 변경
          </button>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <PasswordChangeModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  )
}

/**
 * Password change modal component
 */
interface PasswordChangeModalProps {
  onClose: () => void
  onSuccess: () => void
}

function PasswordChangeModal({ onClose, onSuccess }: PasswordChangeModalProps) {
  const { updatePassword } = useAuth()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.')
      return
    }

    setIsSubmitting(true)
    
    try {
      const result = await updatePassword(formData.currentPassword, formData.newPassword)
      
      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || '비밀번호 변경에 실패했습니다.')
      }
    } catch (error: any) {
      setError(error.message || '비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">비밀번호 변경</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              현재 비밀번호
            </label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => handleChange('currentPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? '변경 중...' : '변경'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 