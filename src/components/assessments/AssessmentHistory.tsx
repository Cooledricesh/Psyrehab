'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { 
  Clock, 
  User, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useAssessmentHistory, useAssessmentVersionInfo } from '@/hooks/assessments/useAssessments'
import type { AssessmentHistory, AssessmentHistoryParams } from '@/types/assessment'

interface AssessmentHistoryProps {
  assessmentId?: string
  patientId?: string
  limit?: number
  className?: string
}

export function AssessmentHistory({ 
  assessmentId, 
  patientId, 
  limit = 50,
  className 
}: AssessmentHistoryProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())

  const historyParams: AssessmentHistoryParams = {
    assessment_id: assessmentId,
    patient_id: patientId,
    limit
  }

  const { data: history, isLoading, error } = useAssessmentHistory(historyParams)
  const { data: versionInfo } = useAssessmentVersionInfo(assessmentId || '')

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries)
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId)
    } else {
      newExpanded.add(entryId)
    }
    setExpandedEntries(newExpanded)
  }

  const getChangeTypeIcon = (changeType: AssessmentHistory['change_type']) => {
    switch (changeType) {
      case 'created':
        return <FileText className="h-4 w-4 text-green-500" />
      case 'updated':
        return <Activity className="h-4 w-4 text-blue-500" />
      case 'status_changed':
        return <TrendingUp className="h-4 w-4 text-orange-500" />
      case 'completed':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'reviewed':
        return <Eye className="h-4 w-4 text-purple-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getChangeTypeLabel = (changeType: AssessmentHistory['change_type']) => {
    switch (changeType) {
      case 'created':
        return '생성됨'
      case 'updated':
        return '업데이트됨'
      case 'status_changed':
        return '상태 변경'
      case 'completed':
        return '완료됨'
      case 'reviewed':
        return '검토됨'
      default:
        return '알 수 없음'
    }
  }

  const getChangeTypeColor = (changeType: AssessmentHistory['change_type']) => {
    switch (changeType) {
      case 'created':
        return 'bg-green-100 text-green-800'
      case 'updated':
        return 'bg-blue-100 text-blue-800'
      case 'status_changed':
        return 'bg-orange-100 text-orange-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'reviewed':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCompletionChange = (changes: unknown) => {
    if (changes.completion_change) {
      const { from, to } = changes.completion_change
      const difference = to - from
      if (difference > 0) {
        return (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>완료도: {from}% → {to}% (+{difference}%)</span>
          </div>
        )
      } else if (difference < 0) {
        return (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <TrendingDown className="h-3 w-3" />
            <span>완료도: {from}% → {to}% ({difference}%)</span>
          </div>
        )
      }
    }
    return null
  }

  const formatStatusChange = (changes: unknown) => {
    if (changes.status_change) {
      const { from, to } = changes.status_change
      const statusLabels = {
        draft: '초안',
        completed: '완료',
        reviewed: '검토됨'
      }
      return (
        <div className="flex items-center gap-1 text-sm">
          <span>상태: </span>
          <Badge variant="outline" className="text-xs">
            {statusLabels[from as keyof typeof statusLabels] || from}
          </Badge>
          <span>→</span>
          <Badge variant="outline" className="text-xs">
            {statusLabels[to as keyof typeof statusLabels] || to}
          </Badge>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            평가 이력
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
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
            <Clock className="h-5 w-5" />
            평가 이력
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            이력을 불러오는 중 오류가 발생했습니다.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          평가 이력
          {versionInfo && (
            <Badge variant="outline" className="ml-auto">
              버전 {versionInfo.current_version} / {versionInfo.total_versions}개 수정
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!history || history.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            기록된 이력이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div key={entry.id} className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200" />
                
                <Collapsible>
                  <div className="flex items-start gap-3">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white border-2 border-gray-200 rounded-full">
                      {getChangeTypeIcon(entry.change_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getChangeTypeColor(entry.change_type)}>
                          {getChangeTypeLabel(entry.change_type)}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          버전 {entry.version}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(entry.changed_at), 'M월 d일 HH:mm', { locale: ko })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {(entry as any).changed_by_info?.full_name || '알 수 없음'}
                        </span>
                      </div>

                      {/* Quick change summary */}
                      <div className="space-y-1 mb-2">
                        {formatStatusChange(entry.changes)}
                        {formatCompletionChange(entry.changes)}
                      </div>

                      {/* Notes */}
                      {entry.notes && (
                        <div className="text-sm text-gray-600 mb-2">
                          "{entry.notes}"
                        </div>
                      )}

                      {/* Expandable details */}
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => toggleExpanded(entry.id)}
                        >
                          {expandedEntries.has(entry.id) ? (
                            <ChevronDown className="h-3 w-3 mr-1" />
                          ) : (
                            <ChevronRight className="h-3 w-3 mr-1" />
                          )}
                          상세 내용
                        </Button>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-sm mb-2">변경 세부사항</h4>
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(entry.changes, null, 2)}
                          </pre>
                          
                          {entry.snapshot && (
                            <>
                              <h4 className="font-medium text-sm mb-2 mt-4">스냅샷</h4>
                              <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
                                {JSON.stringify(entry.snapshot, null, 2)}
                              </pre>
                            </>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </div>
                </Collapsible>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 