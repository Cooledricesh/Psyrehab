import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, Target, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { getDashboardStats } from '@/services/dashboard-stats'
import { handleApiError } from '@/utils/error-handler'

interface RehabStats {
  totalPatients: number
  activeGoals: number
  avgPatientsPerWorker: number
  thisWeekSessions: number
  completionRate: number
  completedSixMonthGoals: number
  newPatientsThisMonth: number
  avgSessionsPerWeek: number
  patientChangeFromLastMonth: number
  totalWeeklyCheckPending: number
  fourWeeksAchievedCount: number
}

export function RehabStatsCards() {
  const [stats, setStats] = useState<RehabStats>({
    totalPatients: 0,
    activeGoals: 0,
    avgPatientsPerWorker: 0,
    thisWeekSessions: 0,
    completionRate: 0,
    completedSixMonthGoals: 0,
    newPatientsThisMonth: 0,
    avgSessionsPerWeek: 0,
    patientChangeFromLastMonth: 0,
    totalWeeklyCheckPending: 0,
    fourWeeksAchievedCount: 0
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
          avgSessionsPerWeek: Math.round(basicStats.thisWeekSessions / 4 * 10) / 10 // 목업: 단순 계산
        })
      } catch (error) {
        handleApiError(error, 'RehabStatsCards.fetchStats')
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
            <div className="text-sm font-medium text-muted-foreground">총 회원 수</div>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalPatients}</div>
          <Badge variant="outline" className="w-fit">
            <TrendingUp className="h-3 w-3 mr-1" />
            {stats.patientChangeFromLastMonth >= 0 ? '+' : ''}{stats.patientChangeFromLastMonth}명
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            지난달 대비 {stats.patientChangeFromLastMonth >= 0 ? '증가' : '감소'}
          </div>
        </CardContent>
      </Card>

      {/* 4주 연속 달성 */}
      <Card className="bg-gradient-to-t from-green-50 to-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">4주 연속 달성</div>
            <Target className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.fourWeeksAchievedCount}명</div>
          <Badge variant="outline" className="w-fit">
            <TrendingUp className="h-3 w-3 mr-1" />
            우수 회원
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            4주 연속 목표 달성 회원
          </div>
        </CardContent>
      </Card>

      {/* 담당 회원 평균 */}
      <Card className="bg-gradient-to-t from-purple-50 to-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">담당 회원 평균</div>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{stats.avgPatientsPerWorker}명</div>
          <Badge variant="outline" className="w-fit">
            담당자 1인당
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            담당자 1인당 평균 회원 수
          </div>
        </CardContent>
      </Card>

      
      {/* 신규 환자 */}
      <Card className="bg-gradient-to-t from-amber-50 to-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">월간 신규 회원 수</div>
            <Users className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.newPatientsThisMonth}</div>
          {stats.newPatientsThisMonth > 0 && (
            <Badge variant="outline" className="w-fit">
              <TrendingUp className="h-3 w-3 mr-1" />
              신규 등록
            </Badge>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            이번 달 새로 등록한 회원 수
          </div>
        </CardContent>
      </Card>

      {/* 달성한 6개월 목표 */}
      <Card className="bg-gradient-to-t from-cyan-50 to-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">달성한 6개월 목표</div>
            <Target className="h-4 w-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold text-cyan-600">{stats.completedSixMonthGoals}개</div>
          <Badge variant="outline" className="w-fit">
            전체 달성 누적
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            모든 누적 6개월 목표 달성 수
          </div>
        </CardContent>
      </Card>

      {/* 주간 체크 미완료 */}
      <Card className="bg-gradient-to-t from-rose-50 to-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">주간 체크 미완료</div>
            <Clock className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{stats.totalWeeklyCheckPending}명</div>
          <Badge variant="outline" className="w-fit">
            전체 담당자
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            이번 주 점검이 필요한 전체 회원 수
          </div>
        </CardContent>
      </Card>

    </div>
  )
}