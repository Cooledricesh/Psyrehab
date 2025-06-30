import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPatientActiveGoals, getGoalStatusColor } from '@/services/rehabilitation-goals'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Target, Calendar, TrendingUp, Activity } from 'lucide-react'

interface ActiveGoalsSectionProps {
  patientId: string
}

export function ActiveGoalsSection({ patientId }: ActiveGoalsSectionProps) {
  const { data: activeGoals, isLoading, error } = useQuery({
    queryKey: ['patient-active-goals', patientId],
    queryFn: () => getPatientActiveGoals(patientId),
    enabled: !!patientId,
    staleTime: 1 * 60 * 1000, // 1분간 캐시 유지 (진행중인 목표는 자주 업데이트됨)
    cacheTime: 10 * 60 * 1000, // 10분간 캐시 보관
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '날짜 미지정'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            진행 중인 목표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            목표를 불러오는 중...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            진행 중인 목표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            목표를 불러오는 중 오류가 발생했습니다.
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activeGoals || activeGoals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            진행 중인 목표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            현재 진행 중인 목표가 없습니다.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          진행 중인 목표
          <Badge variant="secondary" className="ml-auto">
            {activeGoals.length}개
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeGoals.map((goal) => {
            const daysRemaining = calculateDaysRemaining(goal.end_date)
            const isOverdue = daysRemaining < 0
            
            return (
              <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{goal.title}</h4>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <Badge 
                    variant={goal.status === 'active' ? 'default' : 'secondary'}
                    style={{ 
                      backgroundColor: getGoalStatusColor(goal.status),
                      color: 'white'
                    }}
                  >
                    {goal.status === 'active' ? '진행중' : '작업중'}
                  </Badge>
                </div>

                {/* 진행률 표시 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      진행률
                    </span>
                    <span className="font-medium">{goal.progress || 0}%</span>
                  </div>
                  <Progress value={goal.progress || 0} className="h-2" />
                  {goal.stats && (
                    <p className="text-xs text-muted-foreground">
                      주간 목표 {goal.stats.completedWeekly}/{goal.stats.totalWeekly}개 완료
                    </p>
                  )}
                </div>

                {/* 날짜 정보 */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(goal.start_date)} - {formatDate(goal.end_date)}
                  </span>
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    {isOverdue 
                      ? `${Math.abs(daysRemaining)}일 지연`
                      : `${daysRemaining}일 남음`
                    }
                  </span>
                </div>

                {/* 담당자 정보 */}
                {goal.created_by && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-3 w-3" />
                    <span>담당: {goal.created_by.full_name}</span>
                  </div>
                )}

                {/* AI 추천 여부 */}
                {goal.is_ai_suggested && (
                  <Badge variant="outline" className="text-xs">
                    AI 추천 목표
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}