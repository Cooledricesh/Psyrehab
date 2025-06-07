import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PatientRegistrationForm } from '@/components/patients'

export function PatientRegistrationPage() {
  const navigate = useNavigate()

  const handleSuccess = (patient: any) => {
    console.log('환자 등록 성공:', patient)
    // 성공 시 환자 목록 페이지로 이동
    navigate('/patients')
  }

  const handleCancel = () => {
    // 취소 시 이전 페이지로 이동
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <PatientRegistrationForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
} 