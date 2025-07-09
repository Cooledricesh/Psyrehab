import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  Save, 
  X, 
  User, 
  Phone, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { useUpdatePatient } from '@/hooks/usePatients'
import { handleApiError } from '@/utils/error-handler'
import type { Patient } from '@/services/patient-management'

// 환자 정보 편집을 위한 스키마
const patientEditSchema = z.object({
  full_name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  patient_identifier: z.string().min(1, '환자 식별번호는 필수입니다'),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  doctor: z.string().optional(),
  
  // 연락처 정보 (contact_info JSONB)
  phone: z.string().optional(),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
})

type PatientEditFormData = z.infer<typeof patientEditSchema>

interface PatientEditFormProps {
  patient: Patient & {
    full_name?: string
    patient_identifier?: string
    date_of_birth?: string
    doctor?: string
    contact_info?: {
      phone?: string
      address?: string
      emergency_contact?: {
        name?: string
        phone?: string
        relationship?: string
      }
    }
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function PatientEditForm({ patient, onSuccess, onCancel }: PatientEditFormProps) {
  const updatePatientMutation = useUpdatePatient()

  const form = useForm<PatientEditFormData>({
    resolver: zodResolver(patientEditSchema),
    defaultValues: {
      full_name: patient.full_name || '',
      patient_identifier: patient.patient_identifier || '',
      date_of_birth: patient.date_of_birth || '',
      gender: patient.gender || '',
      doctor: patient.doctor || '',
      phone: patient.contact_info?.phone || '',
      address: patient.contact_info?.address || '',
      emergency_contact_name: patient.contact_info?.emergency_contact?.name || '',
      emergency_contact_phone: patient.contact_info?.emergency_contact?.phone || '',
      emergency_contact_relationship: patient.contact_info?.emergency_contact?.relationship || '',
    }
  })

  const onSubmit = async (data: PatientEditFormData) => {
    try {
      const updateData = {
        full_name: data.full_name,
        patient_identifier: data.patient_identifier,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
        doctor: data.doctor || null,
        contact_info: {
          phone: data.phone || null,
          address: data.address || null,
          emergency_contact: (data.emergency_contact_name || data.emergency_contact_phone) ? {
            name: data.emergency_contact_name || '',
            phone: data.emergency_contact_phone || '',
            relationship: data.emergency_contact_relationship || ''
          } : null
        }
      }

      await updatePatientMutation.mutateAsync({
        id: patient.id,
        data: updateData
      })

      onSuccess?.()
    } catch (error) {
      handleApiError(error, 'PatientEditForm.onSubmit')
    }
  }

  const relationshipOptions = [
    { value: 'spouse', label: '배우자' },
    { value: 'parent', label: '부모' },
    { value: 'child', label: '자녀' },
    { value: 'sibling', label: '형제자매' },
    { value: 'friend', label: '친구' },
    { value: 'guardian', label: '보호자' },
    { value: 'other', label: '기타' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          환자 정보 편집
        </CardTitle>
        <CardDescription>
          환자의 기본 정보와 연락처 정보를 수정할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 기본 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              기본 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">이름 *</Label>
                <Input
                  id="full_name"
                  {...form.register('full_name')}
                  placeholder="환자 이름"
                />
                {form.formState.errors.full_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="patient_identifier">환자 식별번호 *</Label>
                <Input
                  id="patient_identifier"
                  {...form.register('patient_identifier')}
                  placeholder="101860"
                />
                {form.formState.errors.patient_identifier && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.patient_identifier.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="date_of_birth">생년월일</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...form.register('date_of_birth')}
                />
              </div>

              <div>
                <Label htmlFor="gender">성별</Label>
                <Select
                  value={form.watch('gender') || ''}
                  onValueChange={(value) => form.setValue('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="성별 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">남성</SelectItem>
                    <SelectItem value="female">여성</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="doctor">주치의</Label>
                <Input
                  id="doctor"
                  {...form.register('doctor')}
                  placeholder="주치의 이름"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 연락처 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              연락처 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="010-1234-5678"
                />
              </div>

              <div>
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  {...form.register('address')}
                  placeholder="상세 주소를 입력하세요"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 응급연락처 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              응급연락처
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="emergency_contact_name">응급연락처 이름</Label>
                <Input
                  id="emergency_contact_name"
                  {...form.register('emergency_contact_name')}
                  placeholder="연락처 이름"
                />
              </div>

              <div>
                <Label htmlFor="emergency_contact_phone">응급연락처 전화번호</Label>
                <Input
                  id="emergency_contact_phone"
                  {...form.register('emergency_contact_phone')}
                  placeholder="010-1234-5678"
                />
              </div>

              <div>
                <Label htmlFor="emergency_contact_relationship">관계</Label>
                <Select
                  value={form.watch('emergency_contact_relationship') || ''}
                  onValueChange={(value) => form.setValue('emergency_contact_relationship', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="관계 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>



          {/* 에러 메시지 */}
          {updatePatientMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                환자 정보 수정에 실패했습니다: {updatePatientMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* 성공 메시지 */}
          {updatePatientMutation.isSuccess && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                환자 정보가 성공적으로 수정되었습니다.
              </AlertDescription>
            </Alert>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={updatePatientMutation.isPending}
              className="flex-1"
            >
              {updatePatientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              변경사항 저장
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={updatePatientMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 