'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase'
import { UserCheck, Clock } from 'lucide-react'

interface AuthUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  full_name?: string
  raw_user_meta_data?: {
    role?: string
    full_name?: string
  }
}

export function UserLoginHistory() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'user-login-history'],
    queryFn: async () => {
      // Edge Function 호출해서 로그인 이력 가져오기
      const { data, error } = await supabase.functions.invoke('get-login-history')

      if (error) throw error

      // Edge Function에서 이미 full_name을 포함해서 보내줌
      return data?.users?.map((user: any) => ({
        ...user,
        raw_user_meta_data: { role: user.role }
      })) as AuthUser[]
    },
    refetchInterval: 60000 // 1분마다 새로고침
  })

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'administrator':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'administrator':
        return '관리자'
      case 'manager':
        return '매니저'
      case 'staff':
        return '사원'
      case 'assistant_manager':
        return '주임'
      case 'section_chief':
        return '계장'
      case 'manager_level':
        return '과장'
      case 'department_head':
        return '부장'
      case 'vice_director':
        return '부원장'
      case 'director':
        return '원장'
      case 'attending_physician':
        return '주치의'
      default:
        return role || ''
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>사용자 로그인 이력</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>사용자 로그인 이력</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이메일</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>직급</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead>마지막 로그인</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!users || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    사용자 정보가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.raw_user_meta_data?.role)}>
                        {getRoleLabel(user.raw_user_meta_data?.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), 'yyyy.MM.dd', { locale: ko })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.last_sign_in_at ? (
                        <span className="font-medium">
                          {format(new Date(user.last_sign_in_at), 'MM/dd HH:mm', { locale: ko })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}