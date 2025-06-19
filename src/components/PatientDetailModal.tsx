import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getPatientById } from '@/services/patient-management'
import type { Patient } from '@/services/patient-management'
import { canEditPatient } from '@/lib/auth-utils'

interface PatientDetailModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  onEdit: () => void
}

export default function PatientDetailModal({ 
  isOpen, 
  onClose, 
  patientId,
  onEdit 
}: PatientDetailModalProps) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientDetail()
      checkEditPermission()
    }
  }, [isOpen, patientId])

  const fetchPatientDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 환자 상세 정보 가져오기:', patientId)
      
      const patientData = await getPatientById(patientId)
      
      if (patientData) {
        console.log('✅ 환자 상세 정보 로드 성공:', patientData)
        setPatient(patientData)
      } else {
        setError('환자 정보를 찾을 수 없습니다.')
      }
    } catch (err: unknown) {
      console.error('❌ 환자 상세 정보 로드 실패:', err)
      setError(err.message || '환자 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const checkEditPermission = async () => {
    try {
      const hasPermission = await canEditPatient(patientId)
      setCanEdit(hasPermission)
    } catch {
      console.error("Error occurred")
      setCanEdit(false)
    }
  }

  if (!isOpen) return null

  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'male':
        return '남성'
      case 'female':
        return '여성'
      case 'other':
        return '기타'
      default:
        return gender || '정보 없음'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '활성'
      case 'inactive':
        return '비활성'
      case 'completed':
        return '완료'
      default:
        return '알 수 없음'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">환자 상세 정보</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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
        ) : error ? (
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <Button onClick={fetchPatientDetail} variant="outline">다시 시도</Button>
          </div>
        ) : patient ? (
          <div className="space-y-6">
            {/* 기본 정보 헤더 */}
            <div className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{patient.name}</h3>
                <p className="text-gray-600">
                  {patient.age ? `${patient.age}세` : '나이 정보 없음'} · {getGenderText(patient.gender || '')}
                </p>
              </div>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(patient.status)}`}>
                {getStatusText(patient.status)}
              </span>
            </div>

            {/* 상세 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 기본 정보 */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">환자 ID</label>
                    <p className="text-gray-900">{patient.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">생년월일</label>
                    <p className="text-gray-900">{patient.birth_date || '정보 없음'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">등록일</label>
                    <p className="text-gray-900">{patient.registration_date}</p>
                  </div>
                </div>
              </div>

              {/* 의료 정보 */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">의료 정보</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">진단명</label>
                    <p className="text-gray-900">{patient.diagnosis}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">현재 상태</label>
                    <p className="text-gray-900">{getStatusText(patient.status)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">담당 사회복지사</label>
                    <p className="text-gray-900">
                      {patient.social_worker?.full_name || '미배정'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 연락처 정보 */}
              <div className="bg-white border rounded-lg p-4 md:col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-4">연락처 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">환자 연락처</label>
                    <p className="text-gray-900">
                      {patient.contact_info && typeof patient.contact_info === 'object' && 'phone' in patient.contact_info 
                        ? (patient.contact_info as any).phone || '정보 없음'
                        : typeof patient.contact_info === 'string' 
                        ? patient.contact_info 
                        : '정보 없음'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">응급 연락처</label>
                    <p className="text-gray-900">{patient.emergency_contact || '정보 없음'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼들 */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                닫기
              </Button>
              {canEdit && (
                <Button onClick={onEdit}>
                  편집
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">환자 정보를 찾을 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
} 