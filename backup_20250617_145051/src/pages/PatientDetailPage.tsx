import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PatientDetail } from '@/components/patients/PatientDetail'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-red-500 text-lg">잘못된 환자 ID입니다.</p>
            <button 
              onClick={() => navigate('/patients')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              환자 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleEdit = () => {
    navigate(`/patients/${id}/edit`)
  }

  const handleDelete = () => {
    // TODO: 삭제 확인 모달 구현
    console.log('환자 삭제:', id)
  }

  const handleBack = () => {
    navigate('/patients')
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <PatientDetail
          patientId={id}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBack={handleBack}
        />
      </div>
    </div>
  )
} 