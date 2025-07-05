import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, Target, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getDashboardStats } from '@/services/dashboard-stats'

interface RehabStats {
  totalPatients: number
  activeGoals: number
  avgPatientsPerWorker: number
  thisWeekSessions: number
  completionRate: number
  improvementRate: number
  newPatientsThisMonth: number
  avgSessionsPerWeek: number
}

export function RehabStatsCards() {
  const [stats, setStats] = useState<RehabStats>({
    totalPatients: 0,
    activeGoals: 0,
    avgPatientsPerWorker: 0,
    thisWeekSessions: 0,
    completionRate: 0,
    improvementRate: 0,
    newPatientsThisMonth: 0,
    avgSessionsPerWeek: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const basicStats = await getDashboardStats()
        
        // 고급 통계 데이터 확장
        setStats({
          ...basicStats,
          // 아래는 목업 데이터입니다 (실제 데이터로 교체 필요)
          improvementRate: 15.3, // 목업: 고정값
          newPatientsThisMonth: Math.round(basicStats.totalPatients * 0.1), // 목업: 전체 환자의 10%
          avgSessionsPerWeek: Math.round(basicStats.thisWeekSessions / 4 * 10) / 10 // 목업: 단순 계산
        })
      } catch (error) {
        console.error('통계 데이터 로드 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
      {/* 총 환자 수 */}
      <Card className="bg-gradient-to-t from-blue-50 to-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">총 환자 수</div>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalPatients}</div>
          <Badge variant="outline" className="w-fit">
            <TrendingUp className="h-3 w-3 mr-1" />
            +{stats.newPatientsThisMonth} 신규
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            이번 달 신규 환자 {stats.newPatientsThisMonth}명 증가
          </div>
        </CardContent>
      </Card>

      {/* 활성 목표 */}
      <Card className="bg-gradient-to-t from-green-50 to-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">활성 목표</div>
            <Target className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.activeGoals}</div>
          <Badge variant="outline" className="w-fit">
            <TrendingUp className="h-3 w-3 mr-1" />
            {stats.completionRate}% 완료율
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            진행 중인 재활 목표
          </div>
        </CardContent>
      </Card>

      {/* 담당 환자 평균 */}
      <Card className="bg-gradient-to-t from-purple-50 to-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">담당 환자 평균</div>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{stats.avgPatientsPerWorker}명</div>
          <Badge variant="outline" className="w-fit">
            사회복지사 1인당
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            주임/사원 1인당 평균 담당 환자 수
          </div>
        </CardContent>
      </Card>

      {/* 이번 주 세션 */}
      <Card className="bg-gradient-to-t from-orange-50 to-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">이번 주 세션</div>
            <Calendar className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.thisWeekSessions}</div>
          <Badge variant="outline" className="w-fit">
            평균 {stats.avgSessionsPerWeek}/주
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            월요일부터 현재까지 진행된 세션
          </div>
        </CardContent>
      </Card>

      {/* 목표 완료율 */}
      <Card className="bg-gradient-to-t from-emerald-50 to-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">목표 완료율</div>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.completionRate}%</div>
          <Badge variant="outline" className="w-fit">
            전체 목표 대비
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            성과 지표가 목표를 초과달성
          </div>
        </CardContent>
      </Card>

      {/* 개선율 */}
      <Card className="bg-gradient-to-t from-cyan-50 to-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">환자 개선율 (목업)</div>
            <TrendingUp className="h-4 w-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold text-cyan-600">{stats.improvementRate}%</div>
          <Badge variant="outline" className="w-fit">
            <TrendingUp className="h-3 w-3 mr-1" />
            지속적 상승
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            재활 프로그램 효과성 지표
          </div>
        </CardContent>
      </Card>

      {/* 평균 세션 수 */}
      <Card className="bg-gradient-to-t from-rose-50 to-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">주간 평균 세션 (목업)</div>
            <Calendar className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{stats.avgSessionsPerWeek}</div>
          <Badge variant="outline" className="w-fit">
            안정적 유지
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            환자당 주간 평균 참여도
          </div>
        </CardContent>
      </Card>

      {/* 신규 환자 */}
      <Card className="bg-gradient-to-t from-amber-50 to-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">월간 신규 환자 (목업)</div>
            <Users className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.newPatientsThisMonth}</div>
          <Badge variant="outline" className="w-fit">
            <TrendingUp className="h-3 w-3 mr-1" />
            증가 추세
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            이번 달 새로 등록된 환자
          </div>
        </CardContent>
      </Card>
    </div>
  )
}