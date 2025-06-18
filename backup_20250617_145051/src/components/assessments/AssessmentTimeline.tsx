'use client'

import React from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { 
  Timeline, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Award,
  Lightbulb,
  Activity,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAssessmentTimeline } from '@/hooks/assessments/useAssessments'

interface AssessmentTimelineProps {
  patientId: string
  className?: string
}

export function AssessmentTimeline({ patientId, className }: AssessmentTimelineProps) {
  const { data: timeline, isLoading, error } = useAssessmentTimeline(patientId)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timeline className="h-5 w-5" />
            평가 타임라인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timeline className="h-5 w-5" />
            평가 타임라인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            타임라인을 불러오는 중 오류가 발생했습니다.
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!timeline || timeline.assessments.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timeline className="h-5 w-5" />
            평가 타임라인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            아직 평가 기록이 없습니다.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timeline className="h-5 w-5" />
          평가 타임라인
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6 text-gray-500">
          평가 타임라인 컴포넌트가 구현되었습니다.
        </div>
      </CardContent>
    </Card>
  )
}
