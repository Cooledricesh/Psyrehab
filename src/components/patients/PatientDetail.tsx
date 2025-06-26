import React from 'react'
import { usePatient } from '@/hooks/usePatients'
import { Button } from '@/components/ui'
import { CompletedGoalsSection } from './CompletedGoalsSection'

interface PatientDetailProps {
  patientId: string
  onEdit?: () => void
  onDelete?: () => void
  onBack?: () => void
}

export function PatientDetail({ patientId, onEdit, onDelete, onBack }: PatientDetailProps) {
  const { data: patient, isLoading, error, refetch } = usePatient(patientId)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: '활성', className: 'bg-green-100 text-green-800' },
      inactive: { label: '비활성', className: 'bg-gray-100 text-gray-800' },
      discharged: { label: '퇴원', className: 'bg-blue-100 text-blue-800' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, className: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'male': return '남성'
      case 'female': return '여성'
      case 'other': return '기타'
      default: return '미지정'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">환자 정보를 불러오는 중...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex justify-between items-center">
          <p className="text-red-800">환자 정보를 불러오는 중 오류가 발생했습니다.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">환자 정보를 찾을 수 없습니다.</p>
        {onBack && (
          <Button onClick={onBack} variant="outline" className="mt-4">
            목록으로 돌아가기
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.full_name}</h1>
              <p className="text-gray-600">환자 ID: {patient.patient_identifier}</p>
            </div>
            {getStatusBadge(patient.status)}
          </div>
          
          <div className="flex space-x-2">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                목록으로
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                편집
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" onClick={onDelete} className="text-red-600 hover:text-red-800">
                삭제
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* 기본 정보 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">생년월일</label>
              <p className="text-gray-900">
                {patient.date_of_birth ? formatDate(patient.date_of_birth) : '미지정'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">성별</label>
              <p className="text-gray-900">{getGenderText(patient.gender)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">입원일</label>
              <p className="text-gray-900">
                {patient.admission_date ? formatDate(patient.admission_date) : '미지정'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">등록일</label>
              <p className="text-gray-900">{formatDateTime(patient.created_at)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">최종 수정일</label>
              <p className="text-gray-900">{formatDateTime(patient.updated_at)}</p>
            </div>
          </div>
        </section>

        {/* 연락처 정보 */}
        {patient.contact_info && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">연락처 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">전화번호</label>
                <p className="text-gray-900">
                  {patient.contact_info.phone || '미지정'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">이메일</label>
                <p className="text-gray-900">
                  {patient.contact_info.email || '미지정'}
                </p>
              </div>
              
              {patient.contact_info.address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">주소</label>
                  <p className="text-gray-900">{patient.contact_info.address}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 응급연락처 */}
        {patient.contact_info?.emergency_contact && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">응급연락처</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">이름</label>
                <p className="text-gray-900">{patient.contact_info.emergency_contact.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">관계</label>
                <p className="text-gray-900">{patient.contact_info.emergency_contact.relationship}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">전화번호</label>
                <p className="text-gray-900">{patient.contact_info.emergency_contact.phone}</p>
              </div>
            </div>
          </section>
        )}

        {/* 담당 사회복지사 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">담당 사회복지사</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            {patient.primary_social_worker ? (
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium text-gray-900">{patient.primary_social_worker.full_name}</p>
                  <p className="text-sm text-gray-600">{patient.primary_social_worker.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">담당 사회복지사가 배정되지 않았습니다.</p>
            )}
          </div>
        </section>

        {/* 의료 정보 */}
        {patient.additional_info && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">의료 정보</h2>
            <div className="space-y-6">
              {patient.additional_info.medical_history && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">병력</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {patient.additional_info.medical_history}
                    </p>
                  </div>
                </div>
              )}
              
              {patient.additional_info.allergies && patient.additional_info.allergies.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">알레르기</label>
                  <div className="flex flex-wrap gap-2">
                    {patient.additional_info.allergies.map((allergy, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {patient.additional_info.medications && patient.additional_info.medications.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">복용 중인 약물</label>
                  <div className="flex flex-wrap gap-2">
                    {patient.additional_info.medications.map((medication, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {medication}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {patient.additional_info.special_needs && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">특별 요구사항</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {patient.additional_info.special_needs}
                    </p>
                  </div>
                </div>
              )}
              
              {patient.additional_info.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">추가 메모</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {patient.additional_info.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 완료된 목표 섹션 */}
        <CompletedGoalsSection patientId={patientId} />
      </div>
    </div>
  )
} 