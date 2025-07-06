import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, CheckCircle } from 'lucide-react'
import { jobTitleRoles, getRoleBadge, getStatusBadge } from '@/utils/userManagement'
import type { User } from '@/services/userManagement'

interface UserTableProps {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onApprove: (user: User) => void
}

export function UserTable({ users, onEdit, onDelete, onApprove }: UserTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>역할</TableHead>
          <TableHead>직원번호</TableHead>
          <TableHead>부서</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>담당 환자</TableHead>
          <TableHead>가입일</TableHead>
          <TableHead className="text-right">작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.fullName}</TableCell>
            <TableCell>{getRoleBadge(user.role)}</TableCell>
            <TableCell>{user.employeeId || '-'}</TableCell>
            <TableCell>{user.department || '-'}</TableCell>
            <TableCell>{getStatusBadge(user.isActive)}</TableCell>
            <TableCell>
              {jobTitleRoles.includes(user.role as any) ? `${user.patientCount || 0}명` : '-'}
            </TableCell>
            <TableCell>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {user.needsApproval ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApprove(user)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {user.requestedRole === 'administrator' ? '관리자 승인' : '직원 승인'}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(user)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(user)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}