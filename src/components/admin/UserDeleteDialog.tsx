import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import type { User } from '@/services/userManagement'

interface UserDeleteDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => Promise<void>
}

export function UserDeleteDialog({ user, open, onOpenChange, onDelete }: UserDeleteDialogProps) {
  const handleDelete = async () => {
    await onDelete()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">  
        <DialogHeader>
          <DialogTitle>사용자 삭제</DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-start gap-3 mt-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p>정말로 <strong>{user?.fullName}</strong>을(를) 삭제하시겠습니까?</p>
                <p className="mt-2 text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}