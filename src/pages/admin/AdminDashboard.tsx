'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { supabase } from '@/lib/supabase'
import type { Permission } from '@/types/auth'
import { Users, Activity, Database, Shield, BarChart3, Calendar, AlertCircle, CheckCircle, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SystemStats {
  totalUsers: number
  totalPatients: number  
  totalSocialWorkers: number
  totalAdmins: number
  activeGoals: number
  completedGoals: number
  todayCheckIns: number
  totalAssessments: number
}

interface QuickAction {
  title: string
  description: string
  icon: any
  color: string
  href: string
  permission: Permission
}

export default function AdminDashboard() {
  const auth = useUnifiedAuth()
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalPatients: 0,
    totalSocialWorkers: 0,
    totalAdmins: 0,
    activeGoals: 0,
    completedGoals: 0,
    todayCheckIns: 0,
    totalAssessments: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (auth.initialized && auth.isAuthenticated && auth.isAdmin) {
      loadSystemStats()
    }
  }, [auth.initialized, auth.isAuthenticated, auth.isAdmin])

  const loadSystemStats = useCallback(async () => {
    if (!auth.isAdmin) {
      setError('관리자 권한이 필요합니다.')
      setLoading(false)
      return
    }

    if (!auth.hasPermission('view_all_data')) {
      setError('시스템 통계를 볼 권한이 없습니다.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 사용자 통계 - 중복 제거를 위해 user_id 조회
      const { data: socialWorkers, error: swError } = await supabase
        .from('social_workers')
        .select('user_id')

      if (swError) throw swError

      const { data: admins, error: adminError } = await supabase
        .from('administrators')
        .select('user_id')

      if (adminError) throw adminError

      // 고유한 사용자 ID 세트 만들기 (중복 제거)
      const uniqueUserIds = new Set([
        ...(socialWorkers?.map(sw => sw.user_id) || []),
        ...(admins?.map(admin => admin.user_id) || [])
      ])

      const { data: patients, error: patientError } = await supabase
        .from('patients')
        .select('id', { count: 'exact' })

      if (patientError) throw patientError

      // 목표 통계
      const { data: activeGoals, error: activeError } = await supabase
        .from('rehabilitation_goals')
        .select('id', { count: 'exact' })
        .eq('status', 'active')

      if (activeError) throw activeError

      const { data: completedGoals, error: completedError } = await supabase
        .from('rehabilitation_goals')
        .select('id', { count: 'exact' })
        .eq('status', 'completed')

      if (completedError) throw completedError

      // 오늘 체크인 통계
      const today = new Date().toISOString().split('T')[0]
      const { data: todayCheckIns, error: checkInError } = await supabase
        .from('weekly_check_ins')
        .select('id', { count: 'exact' })
        .eq('check_in_date', today)

      if (checkInError) throw checkInError

      // 평가 통계
      const { data: assessments, error: assessmentError } = await supabase
        .from('assessments')
        .select('id', { count: 'exact' })

      if (assessmentError) throw assessmentError

      setStats({
        totalUsers: uniqueUserIds.size,  // 중복 제거된 사용자 수
        totalPatients: patients?.length || 0,
        totalSocialWorkers: socialWorkers?.length || 0,
        totalAdmins: admins?.length || 0,
        activeGoals: activeGoals?.length || 0,
        completedGoals: completedGoals?.length || 0,
        todayCheckIns: todayCheckIns?.length || 0,
        totalAssessments: assessments?.length || 0
      })

    } catch (err: any) {
      console.error('Error loading system stats:', err)
      setError(err.message || '통계를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [auth.isAdmin, auth.hasPermission])

  const quickActions: QuickAction[] = [
    {
      title: '사용자 관리',
      description: '시스템 사용자 관리 및 권한 설정',
      icon: Users,
      color: 'bg-blue-500',
      href: '/admin/users',
      permission: 'manage_users' as const
    },
    {
      title: '환자 배정 관리',
      description: '환자별 담당 사회복지사 배정',
      icon: UserCheck,
      color: 'bg-indigo-500',
      href: '/admin/patient-assignment',
      permission: 'manage_patients' as const
    },
    {
      title: '시스템 로그',
      description: '시스템 활동 및 오류 로그 확인',
      icon: Activity,
      color: 'bg-green-500',
      href: '/admin/logs',
      permission: 'system:logs:read' as const
    },
    {
      title: '백업 관리',
      description: '데이터베이스 백업 및 복원',
      icon: Database,
      color: 'bg-purple-500',
      href: '/admin/backup-restore',
      permission: 'system:backup:create' as const
    },
    {
      title: '권한 설정',
      description: '역할 및 권한 관리',
      icon: Shield,
      color: 'bg-orange-500',
      href: '/admin/permissions',
      permission: 'manage_system_settings' as const
    }
  ]

  const statCards = [
    {
      title: '전체 사용자',
      value: stats.totalUsers,
      description: `${stats.totalUsers}명의 사용자가 등록되어 있습니다`,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: '등록 환자',
      value: stats.totalPatients,
      description: '시스템에 등록된 전체 환자 수',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: '활성 목표',
      value: stats.activeGoals,
      description: '현재 진행 중인 재활 목표',
      icon: BarChart3,
      color: 'text-purple-600'
    },
    {
      title: '완료된 목표',
      value: stats.completedGoals,
      description: '성공적으로 완료된 목표',
      icon: CheckCircle,
      color: 'text-emerald-600'
    },
    {
      title: '오늘 체크인',
      value: stats.todayCheckIns,
      description: '오늘 진행된 주간 체크인',
      icon: Calendar,
      color: 'text-orange-600'
    },
    {
      title: '총 평가 수',
      value: stats.totalAssessments,
      description: '시행된 전체 평가 횟수',
      icon: Activity,
      color: 'text-indigo-600'
    }
  ]

  // 인증 로딩 상태 처리
  if (auth.loading || !auth.initialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">인증 정보를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // 관리자 권한 체크
  if (!auth.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">관리자 권한이 필요합니다.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  // 데이터 로딩 상태 처리
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">통계를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={loadSystemStats} className="mt-4">
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-600 mt-2">
          시스템 현황 및 통계를 한눈에 확인하세요
          {auth.profile && (
            <span className="ml-2 text-sm text-blue-600">
              환영합니다, {auth.profile.full_name}님
            </span>
          )}
        </p>
      </div>

      {/* 시스템 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 빠른 실행 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">빠른 실행</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions
            .filter(action => auth.hasPermission(action.permission))
            .map((action, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(action.href)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            ))
          }
          {quickActions.filter(action => auth.hasPermission(action.permission)).length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-8">
              <p>사용 가능한 관리 기능이 없습니다.</p>
              <p className="text-sm mt-1">권한을 확인해 주세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* 최근 활동 */}
      <Card>
        <CardHeader>
          <CardTitle>시스템 상태</CardTitle>
          <CardDescription>현재 시스템 운영 상태</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">데이터베이스</span>
              </div>
              <span className="text-green-600 text-sm">정상 작동 중</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">인증 서비스</span>
              </div>
              <span className="text-green-600 text-sm">정상 작동 중</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">AI 서비스</span>
              </div>
              <span className="text-green-600 text-sm">정상 작동 중</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
