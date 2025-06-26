import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PatientDetail } from '@/components/patients/PatientDetail'
import { useDeletePatient } from '@/hooks/usePatients'
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

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const deletePatient = useDeletePatient()

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

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    try {
      await deletePatient.mutateAsync(id)
      navigate('/patient-management')
    } catch (error) {
      console.error('환자 삭제 중 오류 발생:', error)
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>환자 정보 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 환자의 정보를 삭제하시겠습니까? 
              이 작업은 되돌릴 수 없으며, 환자의 모든 관련 데이터가 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 