import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  XCircle,
  Pause
} from 'lucide-react'
import { BaseGoal, GoalType, GoalStatus, GoalPriority, GoalCategory } from '@/types/goals'
import { cn } from '@/lib/utils'

// Props 인터페이스 (새로운 타입 스펙 적용)
interface GoalCardProps {
  goal: BaseGoal
  category?: GoalCategory // 카테고리 정보 추가
  onEdit?: (goal: BaseGoal) => void
  onDelete?: (goalId: string) => void
  onStatusChange?: (goalId: string, status: GoalStatus) => void
  onExpand?: (goalId: string) => void
  showHierarchy?: boolean
  children?: React.ReactNode
  className?: string
}

// 목표 레벨별 스타일 정의 (문서 스펙에 맞춤)
const getGoalTypeStyles = (goalType: GoalType) => {
  switch (goalType) {
    case 'six_month':
      return {
        border: 'border-purple-200',
        bg: 'bg-purple-50',
        accent: 'text-purple-700',
        badge: 'bg-purple-100 text-purple-800',
        progress: 'bg-purple-500'
      }
    case 'monthly':
      return {
        border: 'border-blue-200',
        bg: 'bg-blue-50',
        accent: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-800',
        progress: 'bg-blue-500'
      }
    case 'weekly':
      return {
        border: 'border-green-200',
        bg: 'bg-green-50',
        accent: 'text-green-700',
        badge: 'bg-green-100 text-green-800',
        progress: 'bg-green-500'
      }
    default:
      return {
        border: 'border-gray-200',
        bg: 'bg-gray-50',
        accent: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-800',
        progress: 'bg-gray-500'
      }
  }
}

// 상태별 아이콘 및 색상
const getStatusDisplay = (status: GoalStatus) => {
  switch (status) {
    case 'pending':
      return { 
        icon: Clock, 
        color: 'text-yellow-500', 
        bg: 'bg-yellow-50', 
        text: '대기중',
        border: 'border-yellow-200' 
      }
    case 'active':
      return { 
        icon: PlayCircle, 
        color: 'text-blue-500', 
        bg: 'bg-blue-50', 
        text: '진행중',
        border: 'border-blue-200' 
      }
    case 'completed':
      return { 
        icon: CheckCircle2, 
        color: 'text-green-500', 
        bg: 'bg-green-50', 
        text: '완료',
        border: 'border-green-200' 
      }
    case 'on_hold':
      return { 
        icon: PauseCircle, 
        color: 'text-orange-500', 
        bg: 'bg-orange-50', 
        text: '보류',
        border: 'border-orange-200' 
      }
    case 'cancelled':
      return { 
        icon: XCircle, 
        color: 'text-red-500', 
        bg: 'bg-red-50', 
        text: '취소',
        border: 'border-red-200' 
      }
    default:
      return { 
        icon: Clock, 
        color: 'text-gray-500', 
        bg: 'bg-gray-50', 
        text: '알 수 없음',
        border: 'border-gray-200' 
      }
  }
}

// 우선순위별 표시
const getPriorityDisplay = (priority: GoalPriority) => {
  switch (priority) {
    case 'high':
      return { color: 'bg-red-100 text-red-800', text: '높음' }
    case 'medium':
      return { color: 'bg-yellow-100 text-yellow-800', text: '보통' }
    case 'low':
      return { color: 'bg-gray-100 text-gray-800', text: '낮음' }
    default:
      return { color: 'bg-gray-100 text-gray-800', text: '보통' }
  }
}

// 목표 유형별 한글 레이블
const getGoalTypeLabel = (goalType: GoalType) => {
  switch (goalType) {
    case 'six_month':
      return '6개월 목표'
    case 'monthly':
      return '월간 목표'
    case 'weekly':
      return '주간 목표'
    default:
      return '목표'
  }
}

// 지연 여부 확인 함수
const isGoalDelayed = (goal: BaseGoal): boolean => {
  const today = new Date()
  const endDate = new Date(goal.end_date)
  return endDate < today && goal.status !== 'completed'
}

// 마감일 접근 여부 확인 (3일 이내)
const isGoalApproaching = (goal: BaseGoal): boolean => {
  const today = new Date()
  const endDate = new Date(goal.end_date)
  const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 3 && diffDays > 0 && goal.status !== 'completed'
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  category,
  onEdit,
  onDelete,
  onStatusChange,
  onExpand,
  showHierarchy = false,
  children,
  className
}) => {
  const typeStyles = getGoalTypeStyles(goal.goal_type)
  const statusDisplay = getStatusDisplay(goal.status)
  const priorityDisplay = getPriorityDisplay(goal.priority)
  const isDelayed = isGoalDelayed(goal)
  const isApproaching = isGoalApproaching(goal)

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // 달성률 표시 (실제 vs 목표)
  const renderCompletionRates = () => {
    if (goal.actual_completion_rate !== undefined && goal.target_completion_rate !== undefined) {
      const isOnTrack = goal.actual_completion_rate >= goal.target_completion_rate * 0.8
      
      return (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">목표 달성률</span>
            <span className={cn(
              "font-medium",
              isOnTrack ? "text-green-600" : "text-red-600"
            )}>
              {goal.actual_completion_rate}% / {goal.target_completion_rate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn("h-2 rounded-full transition-all duration-300", typeStyles.progress)}
              style={{ width: `${Math.min(goal.actual_completion_rate, 100)}%` }}
            />
            {goal.target_completion_rate < 100 && (
              <div 
                className="h-2 bg-gray-400 rounded-full absolute opacity-30"
                style={{ width: `${goal.target_completion_rate}%` }}
              />
            )}
          </div>
        </div>
      )
    }
    
    // 기본 진행률 표시
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">진행률</span>
          <span className="text-sm font-medium">{goal.progress}%</span>
        </div>
        <Progress value={goal.progress} className="h-2" />
      </div>
    )
  }

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      typeStyles.border,
      typeStyles.bg,
      isDelayed && "ring-2 ring-red-300",
      isApproaching && "ring-2 ring-yellow-300",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {/* 목표 유형 및 상태 */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={typeStyles.badge}>
                {getGoalTypeLabel(goal.goal_type)}
              </Badge>
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                statusDisplay.bg,
                statusDisplay.border,
                "border"
              )}>
                <statusDisplay.icon size={12} className={statusDisplay.color} />
                <span className={statusDisplay.color}>{statusDisplay.text}</span>
              </div>
              <Badge className={priorityDisplay.color}>
                {priorityDisplay.text}
              </Badge>
              {goal.is_ai_suggested && (
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  AI 추천
                </Badge>
              )}
            </div>

            {/* 목표 제목 */}
            <h3 className={cn("font-semibold text-lg leading-tight", typeStyles.accent)}>
              {goal.title}
            </h3>

            {/* 카테고리 표시 */}
            {category && (
              <div className="flex items-center gap-2">
                <span className="text-lg">{category.icon}</span>
                <span className="text-sm text-gray-600">{category.name}</span>
              </div>
            )}
          </div>

          {/* 경고 표시 */}
          {(isDelayed || isApproaching) && (
            <div className="flex items-center">
              <AlertCircle 
                size={20} 
                className={isDelayed ? "text-red-500" : "text-yellow-500"} 
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 목표 설명 */}
        <p className="text-gray-700 text-sm leading-relaxed">
          {goal.description}
        </p>

        {/* 달성률 표시 */}
        {renderCompletionRates()}

        {/* 날짜 정보 */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>시작: {formatDate(goal.start_date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Target size={14} />
            <span className={cn(
              isDelayed ? "text-red-600 font-medium" : 
              isApproaching ? "text-yellow-600 font-medium" : ""
            )}>
              목표: {formatDate(goal.end_date)}
            </span>
          </div>
        </div>

        {/* 성과 지표 */}
        {goal.success_metrics && goal.success_metrics.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-800">성과 지표</h4>
            <div className="flex flex-wrap gap-1">
              {goal.success_metrics.map((metric, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {metric}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 메모 */}
        {goal.notes && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{goal.notes}</p>
          </div>
        )}

        {/* 태그 */}
        {goal.tags && goal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {goal.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {onStatusChange && goal.status !== 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(goal.id, 'completed')}
              className="flex items-center gap-1"
            >
              <CheckCircle2 size={14} />
              완료
            </Button>
          )}
          
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(goal)}
            >
              수정
            </Button>
          )}

          {onExpand && showHierarchy && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExpand(goal.id)}
              className="flex items-center gap-1"
            >
              <TrendingUp size={14} />
              세부목표
            </Button>
          )}

          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(goal.id)}
              className="text-red-600 hover:text-red-700"
            >
              삭제
            </Button>
          )}
        </div>

        {/* 하위 컴포넌트 (계층 구조) */}
        {children && (
          <div className="pt-3 border-t">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 