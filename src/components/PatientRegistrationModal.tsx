import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createPatient } from '@/services/patient-management'
import type { CreatePatientData } from '@/services/patient-management'

interface PatientRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PatientRegistrationModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: PatientRegistrationModalProps) {
  const [formData, setFormData] = useState<CreatePatientData>({
    full_name: '',
    patient_identifier: '', // 빈 문자열로 초기화
    date_of_birth: '',
    gender: '',
    primary_diagnosis: '',
    doctor: '',
    contact_info: {},
    additional_info: {},
    status: 'inactive'  // 기본값을 inactive로 고정
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleInputChange = (field: keyof CreatePatientData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null) // 에러 있을 때 입력 시 제거
  }

  const handleContactInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 기본 유효성 검사
    if (!formData.full_name?.trim()) {
      setError('환자 이름을 입력해주세요.')
      return
    }

    if (!formData.date_of_birth) {
      setError('생년월일을 입력해주세요.')
      return
    }

    if (!formData.gender) {
      setError('성별을 선택해주세요.')
      return
    }

    if (!formData.patient_identifier?.trim()) {
      setError('환자 식별번호(병록번호)를 입력해주세요.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const submitData: CreatePatientData = {
        ...formData
      }

      console.log('📝 환자 등록 시도:', submitData)
      console.log('📝 식별번호 상태:', {
        원본값: formData.patient_identifier,
        처리후: submitData.patient_identifier,
        속성존재: 'patient_identifier' in submitData
      })
      
      const result = await createPatient(submitData)
      
      if (result) {
        console.log('✅ 환자 등록 성공:', result)
        onSuccess() // 목록 새로고침
        onClose() // 모달 닫기
        
        // 폼 초기화
        setFormData({
          full_name: '',
          patient_identifier: '',
          date_of_birth: '',
          gender: '',
          primary_diagnosis: '',
          doctor: '',
          contact_info: {},
          additional_info: {},
          status: 'pending'  // 기본값을 pending으로 변경
        })
      }
    } catch (err: unknown) {
      console.error('❌ 환자 등록 실패:', err)
      const errorMessage = err instanceof Error ? err.message : '환자 등록 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">새 환자 등록</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                환자 이름 *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="환자 이름을 입력하세요"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                환자 식별번호 (병록번호) *
              </label>
              <input
                type="text"
                value={formData.patient_identifier}
                onChange={(e) => handleInputChange('patient_identifier', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="병록번호를 입력하세요"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                생년월일 *
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                min="1900-01-01"
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                성별 *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                required
              >
                <option value="">성별을 선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </div>
          </div>

          {/* 의료 정보 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              주요 진단명
            </label>
            <input
              type="text"
              value={formData.primary_diagnosis}
              onChange={(e) => handleInputChange('primary_diagnosis', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 우울증, 조현병, 불안장애 등"
              disabled={isSubmitting}
            />
          </div>

          {/* 주치의 정보 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              주치의
            </label>
            <input
              type="text"
              value={formData.doctor || ''}
              onChange={(e) => handleInputChange('doctor', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 김철수 교수, 이영희 원장 등"
              disabled={isSubmitting}
            />
          </div>

          {/* 연락처 정보 - 이메일 제거 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전화번호
            </label>
            <input
              type="tel"
              value={(formData.contact_info as unknown)?.phone || ''}
              onChange={(e) => handleContactInfoChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="010-1234-5678"
              disabled={isSubmitting}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? '등록 중...' : '환자 등록'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 