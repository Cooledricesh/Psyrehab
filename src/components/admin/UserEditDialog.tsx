import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserManagementService } from '@/services'
import type { UserRole } from '@/types/auth'

interface User {
  id: string
  email: string
  fullName: string
  role: UserRole | 'pending'
  roleId: string
  isActive: boolean
  createdAt: string
  employeeId?: string
  department?: string
  contactNumber?: string
  patientCount?: number
  needsApproval?: boolean
  requestedRole?: UserRole
}

interface UserEditDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (user: User, formData: EditFormData) => Promise<void>
}

export interface EditFormData {
  fullName: string
  department: string
  contactNumber: string
  isActive: boolean
  role: UserRole | ''
}

export function UserEditDialog({ user, open, onOpenChange, onSave }: UserEditDialogProps) {
  const [editFormData, setEditFormData] = useState<EditFormData>({
    fullName: '',
    department: '',
    contactNumber: '',
    isActive: true,
    role: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setEditFormData({
        fullName: user.fullName,
        department: user.department || '',
        contactNumber: user.contactNumber || '',
        isActive: user.isActive,
        role: user.role === 'pending' ? '' : user.role
      })
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      await onSave(user, editFormData)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>사용자 정보 수정</DialogTitle>
          <DialogDescription>
            사용자의 기본 정보를 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fullName" className="text-right">
              이름
            </Label>
            <Input
              id="fullName"
              value={editFormData.fullName}
              onChange={(e) => setEditFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">
              부서
            </Label>
            <Input
              id="department"
              value={editFormData.department}
              onChange={(e) => setEditFormData(prev => ({ ...prev, department: e.target.value }))}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contactNumber" className="text-right">
              연락처
            </Label>
            <Input
              id="contactNumber"
              value={editFormData.contactNumber}
              onChange={(e) => setEditFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              역할
            </Label>
            <Select
              value={editFormData.role}
              onValueChange={(value) => setEditFormData(prev => ({ ...prev, role: value as UserRole }))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="역할을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {UserManagementService.getAvailableRoles().map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isActive" className="text-right">
              활성 상태
            </Label>
            <Select
              value={editFormData.isActive ? 'active' : 'inactive'}
              onValueChange={(value) => setEditFormData(prev => ({ ...prev, isActive: value === 'active' }))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}