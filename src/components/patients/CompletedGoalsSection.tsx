import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPatientCompletedGoals, getGoalStatusColor } from '@/services/rehabilitation-goals'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, CheckCircle2, Trophy } from 'lucide-react'

interface CompletedGoalsSectionProps {
  patientId: string
}

export function CompletedGoalsSection({ patientId }: CompletedGoalsSectionProps) {
  const { data: completedGoals, isLoading, error } = useQuery({
    queryKey: ['patient-completed-goals', patientId],
    queryFn: () => getPatientCompletedGoals(patientId),
    enabled: !!patientId
  })
  

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '날짜 미지정'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 7) return `${diffDays}일`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월`
    return `${Math.floor(diffDays / 365)}년`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            완료된 목표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            완료된 목표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            완료된 목표를 불러오는 중 오류가 발생했습니다.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-green-600" />
          완료된 재활 목표
          {completedGoals && completedGoals.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {completedGoals.length}개
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!completedGoals || completedGoals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            아직 완료된 목표가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg">{goal.title}</h4>
                    {goal.description && (
                      <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <Badge 
                      className="bg-green-600 text-white"
                    >
                      달성 완료
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    <span>완료일: {formatDate(goal.completion_date)}</span>
                  </div>
                  
                  {goal.start_date && goal.completion_date && (
                    <div className="text-green-600 font-medium">
                      {calculateDuration(goal.start_date, goal.completion_date)} 만에 달성
                    </div>
                  )}
                </div>
                
                {goal.achievement_notes && (
                  <div className="mt-3 p-3 bg-green-50 rounded-md">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">달성 기록:</span> {goal.achievement_notes}
                    </p>
                  </div>
                )}
                
                {goal.actual_completion_rate !== undefined && goal.actual_completion_rate !== null && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium">최종 달성률</span>
                      <span className="font-bold text-green-600 text-lg">
                        {goal.actual_completion_rate || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${goal.actual_completion_rate || 0}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {goal.created_by && (
                  <div className="mt-3 text-xs text-gray-500">
                    담당: {goal.created_by.full_name} ({goal.created_by.employee_id})
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}