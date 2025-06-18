import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Calendar,
  FileText
} from 'lucide-react'
import { useUpdatePatient } from '@/hooks/usePatients'
import type { Patient } from '@/types/database'

interface PatientStatusManagerProps {
  patient: Patient
  onStatusChange?: () => void
}

type PatientStatus = 'active' | 'inactive' | 'discharged' | 'on_hold' | 'transferred'

const statusOptions: { value: PatientStatus; label: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'active',
    label: '활성',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  {
    value: 'inactive',
    label: '비활성',
    icon: <XCircle className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  {
    value: 'discharged',
    label: '퇴원',
    icon: <Calendar className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    value: 'on_hold',
    label: '보류',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  {
    value: 'transferred',
    label: '전원',
    icon: <Activity className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  }
]

export function PatientStatusManager({ patient, onStatusChange }: PatientStatusManagerProps) {
  const [selectedStatus, setSelectedStatus] = useState<PatientStatus>(patient.status as PatientStatus)
  const [statusNote, setStatusNote] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)

  const updatePatientMutation = useUpdatePatient()

  const currentStatusOption = statusOptions.find(option => option.value === patient.status)
  const selectedStatusOption = statusOptions.find(option => option.value === selectedStatus)

  const hasStatusChanged = selectedStatus !== patient.status
  const requiresNote = ['discharged', 'transferred', 'on_hold'].includes(selectedStatus)

  const handleStatusChange = async () => {
    if (requiresNote && !statusNote.trim()) {
      alert('이 상태 변경에는 사유가 필요합니다.')
      return
    }

    try {
      const updateData = {
        status: selectedStatus,
        ...(statusNote.trim() && { status_notes: statusNote.trim() }),
        ...(selectedStatus === 'discharged' && { discharge_date: new Date().toISOString() })
      }

      await updatePatientMutation.mutateAsync({
        id: patient.id,
        data: updateData
      })

      setStatusNote('')
      setShowConfirmation(false)
      onStatusChange?.()
    } catch (error) {
      console.error('Failed to update patient status:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusHistory = () => {
    // 실제 구현에서는 상태 변경 이력을 가져올 수 있습니다
    const history = [
      {
        status: 'active',
        date: patient.admission_date || patient.created_at,
        note: '입원',
        changedBy: '시스템'
      }
    ]

    if (patient.discharge_date) {
      history.push({
        status: patient.status,
        date: patient.discharge_date,
        note: patient.status_notes || '퇴원',
        changedBy: '관리자'
      })
    }

    return history.reverse()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          환자 상태 관리
        </CardTitle>
        <CardDescription>
          환자의 현재 상태를 확인하고 변경할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 현재 상태 */}
        <div>
          <Label className="text-sm font-medium">현재 상태</Label>
          <div className="mt-2 flex items-center gap-3">
            {currentStatusOption && (
              <Badge className={`${currentStatusOption.color} flex items-center gap-1`}>
                {currentStatusOption.icon}
                {currentStatusOption.label}
              </Badge>
            )}
            <div className="text-sm text-gray-500">
              <div>입원일: {patient.admission_date ? formatDate(patient.admission_date) : '정보 없음'}</div>
              {patient.discharge_date && (
                <div>퇴원일: {formatDate(patient.discharge_date)}</div>
              )}
            </div>
          </div>
          {patient.status_notes && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">상태 메모</p>
                  <p className="text-sm text-gray-600">{patient.status_notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 상태 변경 */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">상태 변경</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statusOptions.map((option) => (
              <div
                key={option.value}
                className={`
                  p-3 border-2 rounded-lg cursor-pointer transition-all
                  ${selectedStatus === option.value
                    ? `${option.color} shadow-sm`
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => setSelectedStatus(option.value)}
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {option.value === 'active' && '정상적으로 치료를 받고 있는 상태'}
                  {option.value === 'inactive' && '일시적으로 치료가 중단된 상태'}
                  {option.value === 'discharged' && '치료를 완료하여 퇴원한 상태'}
                  {option.value === 'on_hold' && '특별한 사유로 치료가 보류된 상태'}
                  {option.value === 'transferred' && '다른 기관으로 전원된 상태'}
                </div>
              </div>
            ))}
          </div>

          {/* 상태 변경 사유 */}
          {requiresNote && (
            <div className="space-y-2">
              <Label htmlFor="status-note" className="text-sm font-medium">
                상태 변경 사유 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="status-note"
                placeholder="상태 변경 사유를 입력하세요..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* 확인 메시지 */}
          {hasStatusChanged && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                환자 상태를 <strong>{currentStatusOption?.label}</strong>에서{' '}
                <strong>{selectedStatusOption?.label}</strong>로 변경하시겠습니까?
                {selectedStatus === 'discharged' && ' 퇴원 처리됩니다.'}
              </AlertDescription>
            </Alert>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            <Button
              onClick={handleStatusChange}
              disabled={!hasStatusChanged || updatePatientMutation.isPending || (requiresNote && !statusNote.trim())}
              className="flex-1"
            >
              {updatePatientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              상태 변경
            </Button>
            {hasStatusChanged && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStatus(patient.status as PatientStatus)
                  setStatusNote('')
                }}
              >
                취소
              </Button>
            )}
          </div>
        </div>

        {/* 상태 변경 이력 */}
        <div>
          <Label className="text-sm font-medium">상태 변경 이력</Label>
          <div className="mt-2 space-y-3">
            {getStatusHistory().map((history, index) => {
              const historyOption = statusOptions.find(option => option.value === history.status)
              return (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    {historyOption?.icon}
                    <Badge className={historyOption?.color}>
                      {historyOption?.label}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{history.note}</div>
                    <div className="text-xs text-gray-500">
                      {formatDate(history.date)} • {history.changedBy}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 에러 메시지 */}
        {updatePatientMutation.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              상태 변경에 실패했습니다: {updatePatientMutation.error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* 성공 메시지 */}
        {updatePatientMutation.isSuccess && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              환자 상태가 성공적으로 변경되었습니다.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 