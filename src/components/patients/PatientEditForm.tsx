import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  Save, 
  X, 
  User, 
  Phone, 
  Heart,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { useUpdatePatient } from '@/hooks/usePatients'
import type { Patient } from '@/types/database'

// 환자 정보 편집을 위한 스키마
const patientEditSchema = z.object({
  full_name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  patient_identifier: z.string().min(1, '환자 식별번호는 필수입니다'),
  phone: z.string().optional(),
  email: z.string().email('올바른 이메일 형식이 아닙니다').optional().or(z.literal('')),
  address: z.string().optional(),
  
  // 응급연락처
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  
  // 의료 정보
  medical_history: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  special_requirements: z.string().optional(),
  notes: z.string().optional(),
})

type PatientEditFormData = z.infer<typeof patientEditSchema>

interface PatientEditFormProps {
  patient: Patient
  onSuccess?: () => void
  onCancel?: () => void
}

export function PatientEditForm({ patient, onSuccess, onCancel }: PatientEditFormProps) {
  const [allergiesInput, setAllergiesInput] = useState('')
  const [medicationsInput, setMedicationsInput] = useState('')

  const updatePatientMutation = useUpdatePatient()

  const form = useForm<PatientEditFormData>({
    resolver: zodResolver(patientEditSchema),
    defaultValues: {
      full_name: patient.full_name || '',
      patient_identifier: patient.patient_identifier || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_phone: patient.emergency_contact_phone || '',
      emergency_contact_relationship: patient.emergency_contact_relationship || '',
      medical_history: patient.medical_history || '',
      allergies: patient.allergies || [],
      medications: patient.medications || [],
      special_requirements: patient.special_requirements || '',
      notes: patient.notes || '',
    }
  })

  // 알레르기와 약물 목록을 문자열로 초기화
  useEffect(() => {
    if (patient.allergies) {
      setAllergiesInput(patient.allergies.join(', '))
    }
    if (patient.medications) {
      setMedicationsInput(patient.medications.join(', '))
    }
  }, [patient])

  const onSubmit = async (data: PatientEditFormData) => {
    try {
      // 알레르기와 약물 목록을 배열로 변환
      const allergiesArray = allergiesInput
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)

      const medicationsArray = medicationsInput
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)

      const updateData = {
        ...data,
        allergies: allergiesArray,
        medications: medicationsArray,
        email: data.email || null, // 빈 문자열을 null로 변환
        updated_at: new Date().toISOString()
      }

      await updatePatientMutation.mutateAsync({
        id: patient.id,
        data: updateData
      })

      onSuccess?.()
    } catch {
      console.error("Error occurred")
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
          환자의 기본 정보와 의료 정보를 수정할 수 있습니다.
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
                  placeholder="P2024001"
                />
                {form.formState.errors.patient_identifier && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.patient_identifier.message}
                  </p>
                )}
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
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="example@email.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
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

          <Separator />

          {/* 의료 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5" />
              의료 정보
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="medical_history">병력</Label>
                <Textarea
                  id="medical_history"
                  {...form.register('medical_history')}
                  placeholder="기존 병력이나 질환을 입력하세요"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="allergies">알레르기 (쉼표로 구분)</Label>
                  <Input
                    id="allergies"
                    value={allergiesInput}
                    onChange={(e) => setAllergiesInput(e.target.value)}
                    placeholder="예: 페니실린, 견과류, 새우"
                  />
                </div>

                <div>
                  <Label htmlFor="medications">복용 약물 (쉼표로 구분)</Label>
                  <Input
                    id="medications"
                    value={medicationsInput}
                    onChange={(e) => setMedicationsInput(e.target.value)}
                    placeholder="예: 아스피린, 혈압약, 당뇨약"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="special_requirements">특별 요구사항</Label>
                <Textarea
                  id="special_requirements"
                  {...form.register('special_requirements')}
                  placeholder="특별한 요구사항이나 주의사항을 입력하세요"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="notes">기타 메모</Label>
                <Textarea
                  id="notes"
                  {...form.register('notes')}
                  placeholder="추가적인 메모나 특이사항을 입력하세요"
                  rows={3}
                />
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