import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PatientDetail } from '@/components/patients/PatientDetail'
import { useDeletePatient } from '@/hooks/usePatients'
import { PatientService } from '@/services/patients'
import { AlertTriangle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { handleApiError } from '@/utils/error-handler'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [relatedData, setRelatedData] = useState<any[]>([])
  const [forceDelete, setForceDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deletePatient = useDeletePatient()
  const { toast } = useToast()

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-red-500 text-lg">잘못된 환자 ID입니다.</p>
            <button 
              onClick={() => navigate('/patient-management')}
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

  const handleDelete = async () => {
    try {
      // 연관 데이터 확인
      const related = await PatientService.checkPatientRelatedData(id)
      setRelatedData(related)
      setForceDelete(false)
      setShowDeleteDialog(true)
    } catch (err) {
      handleApiError(err, 'PatientDetailPage.checkRelatedData')
      toast({
        title: '오류',
        description: '연관 데이터 확인 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const confirmDelete = async () => {
    try {
      setIsDeleting(true)
      await deletePatient.mutateAsync({ id, forceDelete })
      
      toast({
        title: '삭제 완료',
        description: '환자 정보가 성공적으로 삭제되었습니다.',
      })
      
      navigate('/patient-management')
    } catch (error: any) {
      handleApiError(error, 'PatientDetailPage.confirmDelete')
      
      // 연관 데이터 때문에 실패한 경우
      if (error.message?.includes('연결된 데이터가 있어')) {
        // 강제 삭제 옵션 활성화
        setForceDelete(false)
      } else {
        setShowDeleteDialog(false)
      }
      
      toast({
        title: '삭제 실패',
        description: error.message || '환자 삭제 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBack = () => {
    navigate('/patient-management')
  }

  return (
    <>
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <AlertDialogTitle>환자 정보 삭제</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>정말로 이 환자의 정보를 삭제하시겠습니까?</p>
                
                {relatedData.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800 font-medium mb-2">
                      ⚠️ 다음 연관 데이터가 발견되었습니다:
                    </p>
                    <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                      {relatedData.map((item, index) => (
                        <li key={index}>{item.count}개의 {item.name}</li>
                      ))}
                    </ul>
                    
                    <div className="mt-3 flex items-center space-x-2">
                      <Checkbox
                        id="forceDelete"
                        checked={forceDelete}
                        onCheckedChange={(checked) => setForceDelete(checked as boolean)}
                      />
                      <label htmlFor="forceDelete" className="text-sm text-yellow-800">
                        연관 데이터와 함께 삭제 (완료된 목표는 보존됨)
                      </label>
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-red-600">
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting || (relatedData.length > 0 && !forceDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? '삭제 중...' : 
               relatedData.length > 0 && !forceDelete ? '체크박스를 선택해주세요' : 
               '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 