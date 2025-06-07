import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  CalendarIcon, 
  ClockIcon, 
  FlagIcon, 
  CheckCircleIcon,
  CircleIcon,
  PauseCircleIcon,
  XCircleIcon,
  AlertCircleIcon
} from 'lucide-react'
import { BaseGoal, GoalLevel, GoalStatus, GoalCategory, GoalPriority } from '@/types/goals'
import { cn } from '@/lib/utils'

interface GoalCardProps {
  goal: BaseGoal
  onEdit?: (goal: BaseGoal) => void
  onDelete?: (goalId: string) => void
  onStatusChange?: (goalId: string, status: GoalStatus) => void
  onProgressUpdate?: (goalId: string, progress: number) => void
  showChildren?: boolean
  depth?: number
  isExpanded?: boolean
  onToggleExpand?: () => void
  hasChildren?: boolean
}

// 목표 레벨별 스타일
const levelStyles: Record<GoalLevel, string> = {
  long_term: 'border-l-4 border-l-purple-500 bg-purple-50/50',
  monthly: 'border-l-4 border-l-blue-500 bg-blue-50/50',
  weekly: 'border-l-4 border-l-green-500 bg-green-50/50'
}

// 우선순위별 색상
const priorityColors: Record<GoalPriority, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800', 
  low: 'bg-green-100 text-green-800'
}

// 카테고리별 색상
const categoryColors: Record<GoalCategory, string> = {
  physical_therapy: 'bg-orange-100 text-orange-800',
  cognitive_training: 'bg-purple-100 text-purple-800',
  social_skills: 'bg-pink-100 text-pink-800',
  emotional_regulation: 'bg-indigo-100 text-indigo-800',
  daily_living: 'bg-emerald-100 text-emerald-800',
  communication: 'bg-cyan-100 text-cyan-800',
  vocational: 'bg-amber-100 text-amber-800',
  educational: 'bg-violet-100 text-violet-800',
  behavioral: 'bg-rose-100 text-rose-800',
  other: 'bg-gray-100 text-gray-800'
}

// 상태별 아이콘
const StatusIcon: React.FC<{ status: GoalStatus, className?: string }> = ({ status, className }) => {
  const iconProps = { size: 16, className }
  
  switch (status) {
    case 'completed':
      return <CheckCircleIcon {...iconProps} className={cn(iconProps.className, 'text-green-600')} />
    case 'in_progress':
    case 'active':
      return <CircleIcon {...iconProps} className={cn(iconProps.className, 'text-blue-600')} />
    case 'on_hold':
      return <PauseCircleIcon {...iconProps} className={cn(iconProps.className, 'text-yellow-600')} />
    case 'cancelled':
      return <XCircleIcon {...iconProps} className={cn(iconProps.className, 'text-red-600')} />
    case 'deferred':
      return <AlertCircleIcon {...iconProps} className={cn(iconProps.className, 'text-orange-600')} />
    default:
      return <CircleIcon {...iconProps} className={cn(iconProps.className, 'text-gray-400')} />
  }
}

// 카테고리 한글 변환
const categoryLabels: Record<GoalCategory, string> = {
  physical_therapy: '물리치료',
  cognitive_training: '인지훈련',
  social_skills: '사회성 훈련',
  emotional_regulation: '감정조절',
  daily_living: '일상생활',
  communication: '의사소통',
  vocational: '직업훈련',
  educational: '교육',
  behavioral: '행동수정',
  other: '기타'
}

// 우선순위 한글 변환
const priorityLabels: Record<GoalPriority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음'
}

// 상태 한글 변환
const statusLabels: Record<GoalStatus, string> = {
  pending: '대기',
  active: '활성',
  in_progress: '진행중',
  completed: '완료',
  on_hold: '보류',
  cancelled: '취소',
  deferred: '연기'
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onStatusChange,
  onProgressUpdate,
  depth = 0,
  isExpanded = true,
  onToggleExpand,
  hasChildren = false
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = () => {
    const today = new Date()
    const targetDate = new Date(goal.target_date)
    return targetDate < today && goal.status !== 'completed'
  }

  const getDaysUntilTarget = () => {
    const today = new Date()
    const targetDate = new Date(goal.target_date)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilTarget = getDaysUntilTarget()

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      levelStyles[goal.level],
      depth > 0 && 'ml-6 mt-2',
      isOverdue() && 'ring-2 ring-red-200'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon status={goal.status} />
              <h3 className="font-semibold text-lg leading-tight">{goal.title}</h3>
              {hasChildren && onToggleExpand && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleExpand}
                  className="p-1 h-6 w-6"
                >
                  {isExpanded ? '−' : '+'}
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className={categoryColors[goal.category]}>
                {categoryLabels[goal.category]}
              </Badge>
              <Badge variant="outline" className={priorityColors[goal.priority]}>
                <FlagIcon size={12} className="mr-1" />
                {priorityLabels[goal.priority]}
              </Badge>
              <Badge variant="outline">
                {statusLabels[goal.status]}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(goal)}
                className="h-8 w-8 p-0"
              >
                ✏️
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(goal.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                🗑️
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          {goal.description}
        </p>

        {/* 진척도 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">진척도</span>
            <span className="text-sm text-gray-600">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>

        {/* 날짜 정보 */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <CalendarIcon size={14} />
            <span>시작: {formatDate(goal.start_date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarIcon size={14} />
            <span className={isOverdue() ? 'text-red-600 font-medium' : ''}>
              목표: {formatDate(goal.target_date)}
            </span>
          </div>
          {goal.completion_date && (
            <div className="flex items-center gap-1">
              <CheckCircleIcon size={14} className="text-green-600" />
              <span>완료: {formatDate(goal.completion_date)}</span>
            </div>
          )}
        </div>

        {/* 남은 기간 표시 */}
        {goal.status !== 'completed' && (
          <div className="flex items-center gap-1 text-sm mb-4">
            <ClockIcon size={14} />
            <span className={daysUntilTarget <= 7 ? 'text-red-600 font-medium' : 'text-gray-600'}>
              {daysUntilTarget > 0 
                ? `${daysUntilTarget}일 남음`
                : daysUntilTarget === 0
                ? '오늘까지'
                : `${Math.abs(daysUntilTarget)}일 지연`
              }
            </span>
          </div>
        )}

        {/* 태그 */}
        {goal.tags && goal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {goal.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* 성공 지표 */}
        {goal.success_metrics && goal.success_metrics.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">성공 지표:</h4>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              {goal.success_metrics.map((metric, index) => (
                <li key={index}>{metric}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 방법 */}
        {goal.methods && goal.methods.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">실행 방법:</h4>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              {goal.methods.map((method, index) => (
                <li key={index}>{method}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 노트 */}
        {goal.notes && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">노트:</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {goal.notes}
            </p>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {onStatusChange && goal.status !== 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(goal.id, 'completed')}
              className="text-green-600 hover:text-green-700"
            >
              완료 표시
            </Button>
          )}
          
          {onStatusChange && goal.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(goal.id, 'in_progress')}
              className="text-blue-600 hover:text-blue-700"
            >
              시작하기
            </Button>
          )}

          {onProgressUpdate && goal.status !== 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newProgress = Math.min(goal.progress + 25, 100)
                onProgressUpdate(goal.id, newProgress)
              }}
              className="text-purple-600 hover:text-purple-700"
            >
              진척도 +25%
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 