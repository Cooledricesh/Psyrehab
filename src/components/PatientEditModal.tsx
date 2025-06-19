import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getPatientById, updatePatient } from '@/services/patient-management'
import type { Patient, CreatePatientData } from '@/services/patient-management'

interface PatientEditModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  onSuccess: () => void
}



export default function PatientEditModal({ 
  isOpen, 
  onClose, 
  patientId,
  onSuccess 
}: PatientEditModalProps) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [formData, setFormData] = useState<CreatePatientData>({
    full_name: '',
    patient_identifier: '',
    date_of_birth: '',
    gender: '',
    primary_diagnosis: '',
    contact_info: {},
    additional_info: {}
    // status와 admission_date는 편집에서 제외
  })
  
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientDetail()
    }
  }, [isOpen, patientId])

  const fetchPatientDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 편집할 환자 정보 가져오기:', patientId)
      
      const patientData = await getPatientById(patientId)
      
      if (patientData) {
        console.log('✅ 환자 정보 로드 성공:', patientData)
        setPatient(patientData)
        
        // 폼 데이터 초기화 (status, admission_date 제외)
        setFormData({
          full_name: patientData.name || '',
          patient_identifier: patientData.id || '',
          date_of_birth: patientData.birth_date || '',
          gender: patientData.gender || '',
          primary_diagnosis: patientData.diagnosis || '',
          contact_info: patientData.contact_info || {},
          additional_info: {}
          // status와 admission_date는 편집에서 제외
        })
      } else {
        setError('환자 정보를 찾을 수 없습니다.')
      }
    } catch (err: unknown) {
      console.error('❌ 환자 정보 로드 실패:', err)
      setError(err.message || '환자 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreatePatientData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
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

    try {
      setIsSubmitting(true)
      setError(null)

      console.log('📝 환자 정보 수정 시도:', formData)
      
      // 실제 환자 업데이트 API 호출
      const result = await updatePatient(patientId, formData)
      
      if (result) {
        console.log('✅ 환자 정보 수정 성공:', result)
        onSuccess() // 목록 새로고침
        onClose() // 모달 닫기
      } else {
        setError('환자 정보 수정에 실패했습니다.')
      }
      
    } catch (err: unknown) {
      console.error('❌ 환자 정보 수정 실패:', err)
      setError(err.message || '환자 정보 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">환자 정보 편집</h2>
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

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">환자 정보를 불러오는 중...</div>
          </div>
        ) : patient ? (
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
                  환자 식별번호
                </label>
                <input
                  type="text"
                  value={formData.patient_identifier}
                  onChange={(e) => handleInputChange('patient_identifier', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                  placeholder="환자 식별번호"
                  disabled={true} // 식별번호는 편집하지 않도록
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  생년월일
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  성별
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="">성별을 선택하세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태 <span className="text-sm text-gray-500">(읽기 전용)</span>
                </label>
                <input
                  type="text"
                  value={patient?.status === 'active' ? '활성' : patient?.status === 'inactive' ? '비활성' : '완료'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  disabled={true}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">환자 상태 변경은 별도 기능을 이용해주세요</p>
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

            {/* 연락처 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  value={(formData.contact_info as unknown)?.email || ''}
                  onChange={(e) => handleContactInfoChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="patient@example.com"
                  disabled={isSubmitting}
                />
              </div>
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
                {isSubmitting ? '수정 중...' : '정보 수정'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">환자 정보를 찾을 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
} 