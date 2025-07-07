import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Users, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSocialWorkerDashboardStats } from '@/services/socialWorkerDashboard'
import { Badge } from '@/components/ui/badge'

interface SocialWorkerStats {
  name: string
  role: string
  totalPatients: number
  incompleteChecks: number
  completedChecks: number
}

export function SocialWorkerStatsChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['socialWorkerStats'],
    queryFn: async () => {
      // 사원, 주임, 계장 역할의 사용자 목록 조회
      const { data: userRoles, error: swError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          roles!inner(
            role_name
          )
        `)
        .in('roles.role_name', ['staff', 'assistant_manager', 'section_chief'])

      if (swError) throw swError

      // 각 사용자의 정보 조회
      const stats: SocialWorkerStats[] = await Promise.all(
        (userRoles || []).map(async (ur) => {
          const userId = ur.user_id
          const roleMap: Record<string, string> = {
            'staff': '사원',
            'assistant_manager': '주임',
            'section_chief': '계장'
          }
          const roleName = roleMap[(ur.roles as any)?.role_name] || '알 수 없음'

          // 사용자 정보 조회 - social_workers 테이블에서
          const { data: userData } = await supabase
            .from('social_workers')
            .select('full_name')
            .eq('user_id', userId)
            .single()
          
          const userName = userData?.full_name || '이름 없음'

          // 담당 환자 수 조회 (퇴원 환자 제외)
          const { count: totalPatients } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('primary_social_worker_id', userId)
            .neq('status', 'discharged')

          // 사회복지사 대시보드 통계 사용하여 주간 체크 미완료 수 계산
          const dashboardStats = await getSocialWorkerDashboardStats(userId)
          const incompleteChecks = dashboardStats.weeklyCheckPending.length

          return {
            name: `${userName} (${roleName})`,
            role: roleName,
            totalPatients: totalPatients || 0,
            incompleteChecks: incompleteChecks,
            completedChecks: (totalPatients || 0) - incompleteChecks, // 완료된 체크 수
          }
        })
      )

      // 이름순으로 정렬 (환자가 없어도 모두 표시)
      return stats.sort((a, b) => a.name.localeCompare(b.name))
    },
    refetchInterval: 30000, // 30초마다 새로고침
  })

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex h-[500px] items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-gray-600">통계를 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex h-[500px] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-800 mb-2">데이터 로딩 오류</p>
            <p className="text-sm text-gray-600">
              데이터를 불러오는 중 오류가 발생했습니다
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalPatientCount = data?.reduce((sum, sw) => sum + sw.totalPatients, 0) || 0
  const totalIncompleteCount = data?.reduce((sum, sw) => sum + sw.incompleteChecks, 0) || 0

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            담당자별 회원 관리 현황
          </CardTitle>
          <CardDescription>
            각 담당자의 회원 수와 주간 체크 미완료 현황
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Badge variant="default">
            총 회원 {totalPatientCount}명
          </Badge>
          <Badge variant="destructive">
            미완료 {totalIncompleteCount}명
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="aspect-auto h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 80,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#666' }}
                tickFormatter={(value) => `${value}명`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-800 mb-2">{label}</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-400 rounded" />
                            <span className="text-sm">총 환자: {Number(payload[0]?.value || 0) + Number(payload[1]?.value || 0)}명</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded" />
                            <span className="text-sm">체크 미완료: {payload[0]?.value || 0}명</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded" />
                            <span className="text-sm">체크 완료: {payload[1]?.value || 0}명</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="incompleteChecks"
                stackId="a"
                fill="#ef4444"
                radius={[0, 0, 0, 0]}
                barSize={50}
              />
              <Bar
                dataKey="completedChecks"
                stackId="a"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={50}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* 차트 하단 범례 및 통계 */}
        <div className="mt-6 grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-2">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium">담당 환자 수</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalPatientCount}명</div>
            <div className="text-xs text-gray-500">전체 담당 환자</div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium">주간 체크 미완료</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{totalIncompleteCount}명</div>
            <div className="text-xs text-gray-500">점검이 필요한 환자</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}