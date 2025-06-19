import React, { useState, useMemo } from 'react'
import { GoalCard } from './GoalCard'
import { BaseGoal, GoalTreeNode, GoalLevel } from '@/types/goals'
import { cn } from '@/lib/utils'

interface GoalHierarchyTreeProps {
  goals: BaseGoal[]
  onEdit?: (goal: BaseGoal) => void
  onDelete?: (goalId: string) => void
  onStatusChange?: (goalId: string, status: unknown) => void
  onProgressUpdate?: (goalId: string, progress: number) => void
  className?: string
  expandedByDefault?: boolean
}

export const GoalHierarchyTree: React.FC<GoalHierarchyTreeProps> = ({
  goals,
  onEdit,
  onDelete,
  onStatusChange,
  onProgressUpdate,
  className,
  expandedByDefault = true
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // 목표들을 계층적 트리 구조로 변환
  const goalTree = useMemo(() => {
    if (!goals || goals.length === 0) return []

    // 목표를 ID로 매핑
    const goalMap = new Map<string, BaseGoal>()
    goals.forEach(goal => goalMap.set(goal.id, goal))

    // 트리 노드 생성 함수
    const buildTreeNode = (goal: BaseGoal, depth: number): GoalTreeNode => {
      const children = goals
        .filter(g => g.parent_goal_id === goal.id)
        .sort((a, b) => {
          // 정렬 순서: 레벨별 -> 우선순위 -> 생성일
          const levelOrder: Record<GoalLevel, number> = {
            long_term: 1,
            monthly: 2,
            weekly: 3
          }
          
          if (a.level !== b.level) {
            return levelOrder[a.level] - levelOrder[b.level]
          }
          
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          if (a.priority !== b.priority) {
            return priorityOrder[b.priority] - priorityOrder[a.priority]
          }
          
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
        .map(child => buildTreeNode(child, depth + 1))

      return {
        goal,
        children,
        depth,
        isExpanded: expandedByDefault || expandedNodes.has(goal.id)
      }
    }

    // 루트 노드들 (parent_goal_id가 null인 목표들) 찾기
    const rootGoals = goals
      .filter(goal => !goal.parent_goal_id)
      .sort((a, b) => {
        // 루트 레벨 정렬
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        if (a.priority !== b.priority) {
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })

    return rootGoals.map(goal => buildTreeNode(goal, 0))
  }, [goals, expandedNodes, expandedByDefault])

  // 노드 확장/축소 토글
  const toggleNodeExpansion = (goalId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(goalId)) {
        newSet.delete(goalId)
      } else {
        newSet.add(goalId)
      }
      return newSet
    })
  }

  // 모든 노드 확장
  const expandAll = () => {
    const allIds = new Set(goals.map(g => g.id))
    setExpandedNodes(allIds)
  }

  // 모든 노드 축소
  const collapseAll = () => {
    setExpandedNodes(new Set())
  }

  // 특정 레벨만 확장
  const expandLevel = (level: GoalLevel) => {
    const levelIds = new Set(goals.filter(g => g.level === level).map(g => g.id))
    setExpandedNodes(levelIds)
  }

  // 트리 노드 렌더링
  const renderTreeNode = (node: GoalTreeNode) => {
    const hasChildren = node.children.length > 0
    const isExpanded = expandedByDefault || expandedNodes.has(node.goal.id)

    return (
      <div key={node.goal.id} className="mb-2">
        <GoalCard
          goal={node.goal}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onProgressUpdate={onProgressUpdate}
          depth={node.depth}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onToggleExpand={() => toggleNodeExpansion(node.goal.id)}
        />
        
        {/* 자식 노드들 렌더링 */}
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-2 border-l-2 border-gray-200 pl-4">
            {node.children.map(renderTreeNode)}
          </div>
        )}
      </div>
    )
  }

  // 트리 통계 계산
  const treeStats = useMemo(() => {
    const stats = {
      totalGoals: goals.length,
      byLevel: {
        long_term: goals.filter(g => g.level === 'long_term').length,
        monthly: goals.filter(g => g.level === 'monthly').length,
        weekly: goals.filter(g => g.level === 'weekly').length
      },
      byStatus: {
        pending: goals.filter(g => g.status === 'pending').length,
        in_progress: goals.filter(g => g.status === 'in_progress').length,
        completed: goals.filter(g => g.status === 'completed').length,
        on_hold: goals.filter(g => g.status === 'on_hold').length,
        cancelled: goals.filter(g => g.status === 'cancelled').length,
        deferred: goals.filter(g => g.status === 'deferred').length
      },
      averageProgress: goals.length > 0 
        ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
        : 0
    }
    return stats
  }, [goals])

  if (!goals || goals.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-gray-500 mb-2">목표가 없습니다</div>
        <div className="text-sm text-gray-400">
          새로운 목표를 추가하여 시작해보세요
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 컨트롤 패널 */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>총 {treeStats.totalGoals}개 목표</span>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
              장기: {treeStats.byLevel.long_term}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              월별: {treeStats.byLevel.monthly}
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
              주별: {treeStats.byLevel.weekly}
            </span>
          </div>
          <span>평균 진척도: {treeStats.averageProgress}%</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            모두 열기
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            모두 닫기
          </button>
          <button
            onClick={() => expandLevel('long_term')}
            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
          >
            장기목표만
          </button>
        </div>
      </div>

      {/* 진척도 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 p-4 bg-white border rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-500">대기</div>
          <div className="text-lg font-semibold text-gray-600">
            {treeStats.byStatus.pending}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">진행중</div>
          <div className="text-lg font-semibold text-blue-600">
            {treeStats.byStatus.in_progress}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">완료</div>
          <div className="text-lg font-semibold text-green-600">
            {treeStats.byStatus.completed}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">보류</div>
          <div className="text-lg font-semibold text-yellow-600">
            {treeStats.byStatus.on_hold}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">취소</div>
          <div className="text-lg font-semibold text-red-600">
            {treeStats.byStatus.cancelled}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">연기</div>
          <div className="text-lg font-semibold text-orange-600">
            {treeStats.byStatus.deferred}
          </div>
        </div>
      </div>

      {/* 목표 트리 */}
      <div className="space-y-2">
        {goalTree.map(renderTreeNode)}
      </div>

      {/* 빈 상태 메시지 (루트 목표가 없는 경우) */}
      {goalTree.length === 0 && goals.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="mb-2">루트 목표를 찾을 수 없습니다</div>
          <div className="text-sm">
            모든 목표가 다른 목표의 하위 목표로 설정되어 있습니다
          </div>
        </div>
      )}
    </div>
  )
} 