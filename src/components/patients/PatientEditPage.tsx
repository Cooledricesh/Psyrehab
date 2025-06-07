import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { usePatient } from '@/hooks/usePatients'
import { PatientEditForm } from './PatientEditForm'

export function PatientEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: patient, isLoading, error } = usePatient(id!)

  const handleSuccess = () => {
    // 성공 시 환자 상세 페이지로 이동
    navigate(`/patients/${id}`)
  }

  const handleCancel = () => {
    // 취소 시 환자 상세 페이지로 돌아가기
    navigate(`/patients/${id}`)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>환자 정보를 불러오는 중...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/patients')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            환자 목록으로 돌아가기
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || '환자 정보를 찾을 수 없습니다.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/patients/${id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            환자 상세로 돌아가기
          </Button>
          <div>
            <h1 className="text-2xl font-bold">환자 정보 편집</h1>
            <p className="text-gray-600">
              {patient.full_name} ({patient.patient_identifier})
            </p>
          </div>
        </div>
      </div>

      {/* 환자 편집 폼 */}
      <PatientEditForm
        patient={patient}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
} 