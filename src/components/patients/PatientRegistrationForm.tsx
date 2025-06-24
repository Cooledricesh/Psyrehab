import React, { useState } from 'react'
import { useCreatePatient } from '@/hooks/usePatients'
import { Button, Input, Label, Select, Textarea } from '@/components/ui'
import type { PatientCreateData } from '@/services/patients'

interface PatientRegistrationFormProps {
  onSuccess?: (patient: unknown) => void
  onCancel?: () => void
}

interface FormData {
  full_name: string
  patient_identifier: string
  date_of_birth: string
  gender: string
  doctor: string
  phone: string
  address: string
  emergency_contact_name: string
  emergency_contact_relationship: string
  emergency_contact_phone: string
  medical_history: string
  allergies: string
  medications: string
  special_needs: string
  notes: string
  admission_date: string
}

const initialFormData: FormData = {
  full_name: '',
  patient_identifier: '',
  date_of_birth: '',
  gender: '',
  doctor: '',
  phone: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_relationship: '',
  emergency_contact_phone: '',
  medical_history: '',
  allergies: '',
  medications: '',
  special_needs: '',
  notes: '',
  admission_date: new Date().toISOString().split('T')[0],
}

export function PatientRegistrationForm({ onSuccess, onCancel }: PatientRegistrationFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  
  const createPatientMutation = useCreatePatient()

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 에러가 있다면 입력 시 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    // 필수 필드 검증
    if (!formData.full_name.trim()) {
      newErrors.full_name = '환자 이름을 입력해주세요.'
    }

    if (!formData.patient_identifier.trim()) {
      newErrors.patient_identifier = '환자 식별번호를 입력해주세요.'
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = '생년월일을 입력해주세요.'
    }

    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요.'
    }

    if (!formData.admission_date) {
      newErrors.admission_date = '입원일을 입력해주세요.'
    }

    // 연락처 검증
    if (formData.phone && !/^[0-9-+\s()]+$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식을 입력해주세요.'
    }

    // 응급연락처 검증 (이름이 있으면 전화번호도 필수)
    if (formData.emergency_contact_name && !formData.emergency_contact_phone) {
      newErrors.emergency_contact_phone = '응급연락처 전화번호를 입력해주세요.'
    }

    if (formData.emergency_contact_phone && !/^[0-9-+\s()]+$/.test(formData.emergency_contact_phone)) {
      newErrors.emergency_contact_phone = '올바른 전화번호 형식을 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const patientData: PatientCreateData = {
        full_name: formData.full_name.trim(),
        patient_identifier: formData.patient_identifier.trim(),
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        doctor: formData.doctor || undefined,
        contact_info: {
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          emergency_contact: formData.emergency_contact_name ? {
            name: formData.emergency_contact_name,
            relationship: formData.emergency_contact_relationship,
            phone: formData.emergency_contact_phone,
          } : undefined,
        },
        additional_info: {
          medical_history: formData.medical_history || undefined,
          allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : undefined,
          medications: formData.medications ? formData.medications.split(',').map(s => s.trim()) : undefined,
          special_needs: formData.special_needs || undefined,
          notes: formData.notes || undefined,
        },
        admission_date: formData.admission_date || undefined,
        status: 'inactive', // 자동으로 inactive로 설정
      }

      const result = await createPatientMutation.mutateAsync(patientData)
      onSuccess?.(result)
    } catch {
      console.error("Error occurred")
    }
  }

  const handleReset = () => {
    setFormData(initialFormData)
    setErrors({})
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">환자 등록</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 섹션 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">기본 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">환자 이름 *</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="환자의 전체 이름을 입력하세요"
                className={errors.full_name ? 'border-red-500' : ''}
              />
              {errors.full_name && (
                <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="patient_identifier">환자 식별번호 *</Label>
              <Input
                id="patient_identifier"
                type="text"
                value={formData.patient_identifier}
                onChange={(e) => handleInputChange('patient_identifier', e.target.value)}
                placeholder="예: P2024001"
                className={errors.patient_identifier ? 'border-red-500' : ''}
              />
              {errors.patient_identifier && (
                <p className="text-red-500 text-sm mt-1">{errors.patient_identifier}</p>
              )}
            </div>

            <div>
              <Label htmlFor="date_of_birth">생년월일 *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                className={errors.date_of_birth ? 'border-red-500' : ''}
                min="1900-01-01"
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.date_of_birth && (
                <p className="text-red-500 text-sm mt-1">{errors.date_of_birth}</p>
              )}
            </div>

            <div>
              <Label htmlFor="gender">성별 *</Label>
              <Select
                id="gender"
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className={errors.gender ? 'border-red-500' : ''}
              >
                <option value="">성별을 선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </Select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
              )}
            </div>

            <div>
              <Label htmlFor="doctor">주치의</Label>
              <Input
                id="doctor"
                type="text"
                value={formData.doctor}
                onChange={(e) => handleInputChange('doctor', e.target.value)}
                placeholder="예: 김철수 교수, 이영희 원장 등"
              />
            </div>

            <div>
              <Label htmlFor="admission_date">입원일 *</Label>
              <Input
                id="admission_date"
                type="date"
                value={formData.admission_date}
                onChange={(e) => handleInputChange('admission_date', e.target.value)}
                className={errors.admission_date ? 'border-red-500' : ''}
              />
              {errors.admission_date && (
                <p className="text-red-500 text-sm mt-1">{errors.admission_date}</p>
              )}
            </div>
          </div>
        </div>

        {/* 연락처 정보 섹션 - 이메일 제거 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">연락처 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">전화번호</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="010-1234-5678"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="전체 주소를 입력하세요"
              />
            </div>
          </div>
        </div>

        {/* 응급연락처 섹션 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">응급연락처</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="emergency_contact_name">이름</Label>
              <Input
                id="emergency_contact_name"
                type="text"
                value={formData.emergency_contact_name}
                onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                placeholder="응급연락처 이름"
              />
            </div>

            <div>
              <Label htmlFor="emergency_contact_relationship">관계</Label>
              <Input
                id="emergency_contact_relationship"
                type="text"
                value={formData.emergency_contact_relationship}
                onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                placeholder="예: 부모, 배우자, 형제"
              />
            </div>

            <div>
              <Label htmlFor="emergency_contact_phone">전화번호</Label>
              <Input
                id="emergency_contact_phone"
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                placeholder="010-1234-5678"
                className={errors.emergency_contact_phone ? 'border-red-500' : ''}
              />
              {errors.emergency_contact_phone && (
                <p className="text-red-500 text-sm mt-1">{errors.emergency_contact_phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* 의료 정보 섹션 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">의료 정보</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="medical_history">병력</Label>
              <Textarea
                id="medical_history"
                value={formData.medical_history}
                onChange={(e) => handleInputChange('medical_history', e.target.value)}
                placeholder="기존 병력이나 의료 기록을 입력하세요"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="allergies">알레르기 (쉼표로 구분)</Label>
              <Input
                id="allergies"
                type="text"
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                placeholder="예: 페니실린, 견과류, 해산물"
              />
            </div>

            <div>
              <Label htmlFor="medications">복용 중인 약물 (쉼표로 구분)</Label>
              <Input
                id="medications"
                type="text"
                value={formData.medications}
                onChange={(e) => handleInputChange('medications', e.target.value)}
                placeholder="예: 혈압약, 당뇨약"
              />
            </div>

            <div>
              <Label htmlFor="special_needs">특별 요구사항</Label>
              <Textarea
                id="special_needs"
                value={formData.special_needs}
                onChange={(e) => handleInputChange('special_needs', e.target.value)}
                placeholder="특별한 돌봄이나 지원이 필요한 사항을 입력하세요"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="notes">추가 메모</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="기타 중요한 정보나 메모를 입력하세요"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* 버튼 섹션 */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={createPatientMutation.isPending}
          >
            초기화
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={createPatientMutation.isPending}
            >
              취소
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={createPatientMutation.isPending}
          >
            {createPatientMutation.isPending ? '등록 중...' : '환자 등록'}
          </Button>
        </div>

        {/* 에러 메시지 */}
        {createPatientMutation.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">
              {createPatientMutation.error.message || '환자 등록 중 오류가 발생했습니다.'}
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
