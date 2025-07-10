'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SocialWorkerStatsChart } from '@/components/dashboard/SocialWorkerStatsChart'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Clock, UserCheck, Activity } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface UserLoginData {
  id: string
  user_id: string
  email?: string
  last_sign_in_at?: string
  created_at?: string
  full_name?: string
  role_name?: string
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')
  
  // 사용자 로그인 기록 조회
  const { data: loginHistory, isLoading: isLoadingLogin } = useQuery({
    queryKey: ['userLoginHistory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_login_history')
      
      if (error) {
        console.error('Login history error:', error)
        throw error
      }
      return data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // 로그인 통계 조회
  const { data: loginStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['loginStats', period],
    queryFn: async () => {
      const now = new Date()
      const startDate = new Date()
      
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          break
      }

      const { data: loginData, error } = await supabase
        .rpc('get_user_login_history')
      
      if (error) {
        console.error('Login stats error:', error)
        throw error
      }
      
      const allUsers = loginData || []
      const activeUsers = allUsers.filter((user: UserLoginData) => 
        user.last_sign_in_at && new Date(user.last_sign_in_at) >= startDate
      )

      return {
        activeUsers: activeUsers.length,
        totalUsers: allUsers.length,
        period,
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  if (isLoadingLogin || isLoadingStats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* 헤더 */}
      <div className="px-4 lg:px-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-gray-600 mt-2">사용자 로그인 현황 및 관리 기능</p>
          </div>
          <Select value={period} onValueChange={(value: 'week' | 'month' | 'quarter') => setPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="기간 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">최근 7일</SelectItem>
              <SelectItem value="month">최근 30일</SelectItem>
              <SelectItem value="quarter">최근 90일</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* 로그인 통계 카드 */}
          <div className="px-4 lg:px-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loginStats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">등록된 사용자 수</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loginStats?.activeUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {period === 'week' ? '최근 7일' : period === 'month' ? '최근 30일' : '최근 90일'} 내 로그인
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">활성율</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loginStats?.totalUsers ? 
                      `${Math.round((loginStats.activeUsers / loginStats.totalUsers) * 100)}%` : 
                      '0%'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">전체 대비 활성 사용자</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">오늘 로그인</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loginHistory?.filter((user: UserLoginData) => {
                      if (!user.last_sign_in_at) return false
                      // UTC 시간을 한국 시간으로 변환
                      const lastLogin = new Date(user.last_sign_in_at)
                      const today = new Date()
                      
                      // 날짜만 비교 (시간 제거)
                      const loginDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate())
                      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                      
                      return loginDate.getTime() === todayDate.getTime()
                    }).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">오늘 로그인한 사용자</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* 탭 섹션 */}
          <div className="px-4 lg:px-6">
            <Tabs defaultValue="login-history" className="space-y-4">
              <TabsList>
                <TabsTrigger value="login-history">로그인 기록</TabsTrigger>
                <TabsTrigger value="social-worker-stats">사회복지사 현황</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login-history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>최근 로그인 기록</CardTitle>
                    <CardDescription>사용자별 마지막 로그인 시간</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {loginHistory?.slice(0, 10).map((user: UserLoginData) => (
                        <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{user.role_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.last_sign_in_at ? 
                                format(new Date(user.last_sign_in_at), 'PPp', { locale: ko }) : 
                                '로그인 기록 없음'
                              }
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="social-worker-stats" className="space-y-4">
                <SocialWorkerStatsChart />
              </TabsContent>
            </Tabs>
          </div>
          
        </div>
      </div>
    </div>
  )
}