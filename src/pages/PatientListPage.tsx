import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PatientList } from '@/components/patients/PatientList'
import { Button } from '@/components/ui'

export function PatientListPage() {
  const navigate = useNavigate()

  const handlePatientSelect = (patientId: string) => {
    navigate(`/patients/${patientId}`)
  }

  const handlePatientEdit = (patientId: string) => {
    navigate(`/patients/${patientId}/edit`)
  }

  const handlePatientDelete = (patientId: string) => {
    // TODO: 삭제 확인 모달 구현
    console.log('환자 삭제:', patientId)
  }

  const handleAddPatient = () => {
    navigate('/patients/new')
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">환자 관리</h1>
              <p className="text-gray-600 mt-1">등록된 환자들을 조회하고 관리할 수 있습니다.</p>
            </div>
            <Button onClick={handleAddPatient}>
              새 환자 등록
            </Button>
          </div>
        </div>

        {/* 환자 목록 */}
        <PatientList
          onPatientSelect={handlePatientSelect}
          onPatientEdit={handlePatientEdit}
          onPatientDelete={handlePatientDelete}
        />
      </div>
    </div>
  )
} 