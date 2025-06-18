import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ChevronDown, 
  ChevronRight, 
  Target, 
  TrendingUp, 
  BarChart3,
  Filter,
  ExpandIcon,
  CollapseIcon
} from 'lucide-react'
import { GoalCard } from './GoalCard'
import { 
  BaseGoal, 
  GoalHierarchy, 
  GoalTreeNode, 
  GoalType,
  GoalStatus,
  GoalCategory,
  buildGoalTree, 
  calculateGoalProgress 
} from '@/types/goals'
import { cn } from '@/lib/utils'

// Props 인터페이스
interface GoalHierarchyTreeProps {
  hierarchy: GoalHierarchy
  categories: GoalCategory[]
  onGoalEdit?: (goal: BaseGoal) => void
  onGoalDelete?: (goalId: string) => void
  onGoalStatusChange?: (goalId: string, status: GoalStatus) => void
  onGoalExpand?: (goalId: string) => void
  className?: string
}

// 컨트롤 패널 Props
interface ControlPanelProps {
  onExpandAll: () => void
  onCollapseAll: () => void
  onFilterChange: (filters: TreeFilters) => void
  filters: TreeFilters
}

// 필터 인터페이스
interface TreeFilters {
  showCompleted: boolean
  goalTypeFilter: GoalType | 'all'
  statusFilter: GoalStatus | 'all'
}

// 통계 표시 인터페이스
interface StatsDisplayProps {
  hierarchy: GoalHierarchy
  categories: GoalCategory[]
}

// 트리 노드 Props
interface TreeNodeProps {
  node: GoalTreeNode
  category?: GoalCategory
  isExpanded: boolean
  onToggle: (nodeId: string) => void
  onGoalEdit?: (goal: BaseGoal) => void
  onGoalDelete?: (goalId: string) => void
  onGoalStatusChange?: (goalId: string, status: GoalStatus) => void
  onGoalExpand?: (goalId: string) => void
}

// 목표 레벨별 스타일
const getGoalTypeStyle = (goalType: GoalType) => {
  switch (goalType) {
    case 'six_month':
      return 'pl-0'
    case 'monthly':
      return 'pl-6'
    case 'weekly':
      return 'pl-12'
    default:
      return 'pl-0'
  }
}

// 목표 레벨별 연결선 스타일
const getConnectorStyle = (goalType: GoalType) => {
  switch (goalType) {
    case 'monthly':
      return 'border-l-2 border-purple-200 ml-3'
    case 'weekly':
      return 'border-l-2 border-blue-200 ml-3'
    default:
      return ''
  }
}

// 통계 표시 컴포넌트
const StatsDisplay: React.FC<StatsDisplayProps> = ({ hierarchy, categories }) => {
  const stats = useMemo(() => {
    const allGoals = [
      hierarchy.sixMonthGoal,
      ...hierarchy.monthlyGoals,
      ...hierarchy.weeklyGoals
    ].filter(Boolean)

    const totalGoals = allGoals.length
    const completedGoals = allGoals.filter(g => g.status === 'completed').length
    const activeGoals = allGoals.filter(g => g.status === 'active').length
    const pendingGoals = allGoals.filter(g => g.status === 'pending').length

    const goalsByType = {
      six_month: allGoals.filter(g => g.goal_type === 'six_month').length,
      monthly: allGoals.filter(g => g.goal_type === 'monthly').length,
      weekly: allGoals.filter(g => g.goal_type === 'weekly').length
    }

    const averageProgress = totalGoals > 0 
      ? Math.round(allGoals.reduce((sum, goal) => sum + goal.progress, 0) / totalGoals)
      : 0

    return {
      totalGoals,
      completedGoals,
      activeGoals,
      pendingGoals,
      goalsByType,
      averageProgress,
      completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
    }
  }, [hierarchy])

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 size={20} />
          목표 현황 통계
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalGoals}</div>
            <div className="text-sm text-gray-600">전체 목표</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedGoals}</div>
            <div className="text-sm text-gray-600">완료된 목표</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.activeGoals}</div>
            <div className="text-sm text-gray-600">진행 중</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.pendingGoals}</div>
            <div className="text-sm text-gray-600">대기 중</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>전체 완료율</span>
              <span className="font-medium">{stats.completionRate}%</span>
            </div>
            <Progress value={stats.completionRate} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>평균 진행률</span>
              <span className="font-medium">{stats.averageProgress}%</span>
            </div>
            <Progress value={stats.averageProgress} className="h-2" />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Badge className="bg-purple-100 text-purple-800">
              6개월: {stats.goalsByType.six_month}개
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              월간: {stats.goalsByType.monthly}개
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              주간: {stats.goalsByType.weekly}개
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 컨트롤 패널 컴포넌트
const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onExpandAll, 
  onCollapseAll, 
  onFilterChange, 
  filters 
}) => {
  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* 확장/축소 버튼 */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExpandAll}
              className="flex items-center gap-1"
            >
              <ExpandIcon size={14} />
              모두 펼치기
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCollapseAll}
              className="flex items-center gap-1"
            >
              <CollapseIcon size={14} />
              모두 접기
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          {/* 필터 옵션 */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-500" />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.showCompleted}
                onChange={(e) => onFilterChange({ 
                  ...filters, 
                  showCompleted: e.target.checked 
                })}
                className="rounded"
              />
              완료된 목표 표시
            </label>
          </div>

          {/* 목표 유형 필터 */}
          <select
            value={filters.goalTypeFilter}
            onChange={(e) => onFilterChange({
              ...filters,
              goalTypeFilter: e.target.value as GoalType | 'all'
            })}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="all">모든 유형</option>
            <option value="six_month">6개월 목표</option>
            <option value="monthly">월간 목표</option>
            <option value="weekly">주간 목표</option>
          </select>

          {/* 상태 필터 */}
          <select
            value={filters.statusFilter}
            onChange={(e) => onFilterChange({
              ...filters,
              statusFilter: e.target.value as GoalStatus | 'all'
            })}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="all">모든 상태</option>
            <option value="pending">대기</option>
            <option value="active">진행중</option>
            <option value="completed">완료</option>
            <option value="on_hold">보류</option>
            <option value="cancelled">취소</option>
          </select>
        </div>
      </CardContent>
    </Card>
  )
}

// 트리 노드 컴포넌트
const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  category,
  isExpanded,
  onToggle,
  onGoalEdit,
  onGoalDelete,
  onGoalStatusChange,
  onGoalExpand
}) => {
  const hasChildren = node.children.length > 0
  const connectorStyle = getConnectorStyle(node.goal.goal_type)

  return (
    <div className={cn("relative", getGoalTypeStyle(node.goal.goal_type))}>
      {/* 연결선 */}
      {node.goal.goal_type !== 'six_month' && (
        <div className={cn("absolute left-0 top-0 bottom-0", connectorStyle)} />
      )}

      {/* 목표 카드 */}
      <div className={cn("relative", node.depth > 0 && "ml-6")}>
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(node.goal.id)}
            className="absolute -left-8 top-4 z-10 h-6 w-6 p-0"
          >
            {isExpanded ? 
              <ChevronDown size={14} /> : 
              <ChevronRight size={14} />
            }
          </Button>
        )}

        <GoalCard
          goal={node.goal}
          category={category}
          onEdit={onGoalEdit}
          onDelete={onGoalDelete}
          onStatusChange={onGoalStatusChange}
          onExpand={onGoalExpand}
          showHierarchy={true}
          className="mb-3"
        />

        {/* 하위 노드들 */}
        {hasChildren && isExpanded && (
          <div className="ml-4 space-y-2">
            {node.children.map((childNode) => (
              <TreeNode
                key={childNode.goal.id}
                node={childNode}
                category={category}
                isExpanded={isExpanded}
                onToggle={onToggle}
                onGoalEdit={onGoalEdit}
                onGoalDelete={onGoalDelete}
                onGoalStatusChange={onGoalStatusChange}
                onGoalExpand={onGoalExpand}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 메인 컴포넌트
export const GoalHierarchyTree: React.FC<GoalHierarchyTreeProps> = ({
  hierarchy,
  categories,
  onGoalEdit,
  onGoalDelete,
  onGoalStatusChange,
  onGoalExpand,
  className
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<TreeFilters>({
    showCompleted: true,
    goalTypeFilter: 'all',
    statusFilter: 'all'
  })

  // 목표 트리 구조 생성
  const goalTree = useMemo(() => {
    const allGoals = [
      hierarchy.sixMonthGoal,
      ...hierarchy.monthlyGoals,
      ...hierarchy.weeklyGoals
    ].filter(Boolean).map(goal => ({
      ...goal,
      children: []
    }))

    return buildGoalTree(allGoals)
  }, [hierarchy])

  // 필터링된 트리
  const filteredTree = useMemo(() => {
    return goalTree.filter(node => {
      // 완료된 목표 필터
      if (!filters.showCompleted && node.goal.status === 'completed') {
        return false
      }

      // 목표 유형 필터
      if (filters.goalTypeFilter !== 'all' && node.goal.goal_type !== filters.goalTypeFilter) {
        return false
      }

      // 상태 필터
      if (filters.statusFilter !== 'all' && node.goal.status !== filters.statusFilter) {
        return false
      }

      return true
    })
  }, [goalTree, filters])

  // 카테고리 맵 생성
  const categoryMap = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = category
      return acc
    }, {} as Record<string, GoalCategory>)
  }, [categories])

  // 노드 토글
  const handleNodeToggle = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  // 모두 펼치기
  const handleExpandAll = () => {
    const allNodeIds = new Set<string>()
    const addNodeIds = (nodes: GoalTreeNode[]) => {
      nodes.forEach(node => {
        allNodeIds.add(node.goal.id)
        addNodeIds(node.children)
      })
    }
    addNodeIds(goalTree)
    setExpandedNodes(allNodeIds)
  }

  // 모두 접기
  const handleCollapseAll = () => {
    setExpandedNodes(new Set())
  }

  // 빈 상태 처리
  if (!hierarchy.sixMonthGoal && hierarchy.monthlyGoals.length === 0 && hierarchy.weeklyGoals.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Target size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">목표가 없습니다</h3>
        <p className="text-gray-600">새로운 목표를 추가해보세요.</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 통계 표시 */}
      <StatsDisplay hierarchy={hierarchy} categories={categories} />

      {/* 컨트롤 패널 */}
      <ControlPanel
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onFilterChange={setFilters}
        filters={filters}
      />

      {/* 목표 트리 */}
      <div className="space-y-4">
        {filteredTree.map((node) => (
          <TreeNode
            key={node.goal.id}
            node={node}
            category={categoryMap[node.goal.category_id]}
            isExpanded={expandedNodes.has(node.goal.id)}
            onToggle={handleNodeToggle}
            onGoalEdit={onGoalEdit}
            onGoalDelete={onGoalDelete}
            onGoalStatusChange={onGoalStatusChange}
            onGoalExpand={onGoalExpand}
          />
        ))}
      </div>

      {/* 필터링 결과 메시지 */}
      {filteredTree.length === 0 && goalTree.length > 0 && (
        <div className="text-center py-8">
          <Filter size={32} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">현재 필터 조건에 맞는 목표가 없습니다.</p>
        </div>
      )}
    </div>
  )
} 