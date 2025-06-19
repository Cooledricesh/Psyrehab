import React, { useState } from 'react'
import { Filter, X, RotateCcw, Calendar, TrendingUp, Users, Clock } from 'lucide-react'
import { GoalStatus, GoalPriority, GoalType } from '@/types/goals'
import { AdvancedGoalFilters } from '@/utils/goal-categorization'
import { useGoalCategories } from '@/hooks/goal-categories/useGoalCategories'
import { 
  ALL_GOAL_TAGS,
  getTagById,
  getCategoryIcon,
  GOAL_STATUS_COLORS,
  GOAL_PRIORITY_COLORS,
  GOAL_TYPE_COLORS
} from '@/constants/goal-categories'
import { cn } from '@/lib/utils'

interface GoalFiltersProps {
  filters: AdvancedGoalFilters
  onChange: (filters: AdvancedGoalFilters) => void
  onReset: () => void
  className?: string
  compact?: boolean
}

export function GoalFilters({
  filters,
  onChange,
  onReset,
  className,
  compact = false
}: GoalFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(!compact)
  const { data: categories = [] } = useGoalCategories()

  // 필터 변경 핸들러
  const handleFilterChange = (key: keyof AdvancedGoalFilters, value: unknown) => {
    onChange({
      ...filters,
      [key]: value
    })
  }

  // 배열 값 토글 (categories, tags, statusList 등)
  const toggleArrayValue = (key: keyof AdvancedGoalFilters, value: string) => {
    const currentArray = (filters[key] as string[]) || []
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    handleFilterChange(key, newArray.length > 0 ? newArray : undefined)
  }

  // 활성 필터 개수 계산
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object' && value !== null) return true
    return value !== undefined && value !== ''
  }).length

  // 컴팩트 모드에서는 요약 정보만 표시
  if (compact && !isExpanded) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            "flex items-center space-x-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors",
            activeFiltersCount > 0 ? "border-blue-500 bg-blue-50" : "border-gray-300"
          )}
        >
          <Filter className="h-4 w-4" />
          <span>필터</span>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
              {activeFiltersCount}
            </span>
          )}
        </button>
        
        {activeFiltersCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="h-3 w-3" />
            <span>초기화</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">목표 필터</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}개 활성
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {activeFiltersCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded"
            >
              <RotateCcw className="h-3 w-3" />
              <span>초기화</span>
            </button>
          )}
        </div>
      </div>

      {/* 검색 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">검색</label>
        <input
          type="text"
          value={filters.searchQuery || ''}
          onChange={(e) => handleFilterChange('searchQuery', e.target.value || undefined)}
          placeholder="제목, 설명 검색..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 카테고리 필터 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">카테고리</label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => toggleArrayValue('categories', category.id)}
              className={cn(
                "flex items-center space-x-2 p-2 border rounded-lg text-left text-sm transition-colors",
                filters.categories?.includes(category.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              )}
            >
              <span className="text-lg">{getCategoryIcon(category.icon)}</span>
              <span className="truncate">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 태그 필터 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">태그</label>
        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
          <div className="flex flex-wrap gap-1">
            {ALL_GOAL_TAGS.map((tag) => {
              const isSelected = filters.tags?.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleArrayValue('tags', tag.id)}
                  className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border transition-colors",
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 hover:border-gray-400"
                  )}
                  style={!isSelected ? {
                    backgroundColor: `${tag.color}10`,
                    borderColor: `${tag.color}30`,
                    color: tag.color
                  } : undefined}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 상태 필터 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">상태</label>
        <div className="grid grid-cols-2 gap-2">
          {(['pending', 'active', 'completed', 'on_hold', 'cancelled'] as GoalStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => toggleArrayValue('statusList', status)}
              className={cn(
                "flex items-center space-x-2 p-2 border rounded-lg text-left text-sm transition-colors",
                filters.statusList?.includes(status)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              )}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: GOAL_STATUS_COLORS[status] }}
              />
              <span>
                {status === 'pending' ? '대기' :
                 status === 'active' ? '진행중' :
                 status === 'completed' ? '완료' :
                 status === 'on_hold' ? '보류' : '취소'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 우선순위 필터 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">우선순위</label>
        <div className="grid grid-cols-3 gap-2">
          {(['high', 'medium', 'low'] as GoalPriority[]).map((priority) => (
            <button
              key={priority}
              onClick={() => toggleArrayValue('priorityList', priority)}
              className={cn(
                "flex items-center space-x-2 p-2 border rounded-lg text-left text-sm transition-colors",
                filters.priorityList?.includes(priority)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              )}
            >
              <TrendingUp 
                className="h-4 w-4"
                style={{ color: GOAL_PRIORITY_COLORS[priority] }}
              />
              <span>
                {priority === 'high' ? '높음' :
                 priority === 'medium' ? '보통' : '낮음'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 목표 유형 필터 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">목표 유형</label>
        <div className="grid grid-cols-3 gap-2">
          {(['six_month', 'monthly', 'weekly'] as GoalType[]).map((type) => (
            <button
              key={type}
              onClick={() => toggleArrayValue('typeList', type)}
              className={cn(
                "flex items-center space-x-2 p-2 border rounded-lg text-left text-sm transition-colors",
                filters.typeList?.includes(type)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              )}
            >
              <Clock 
                className="h-4 w-4"
                style={{ color: GOAL_TYPE_COLORS[type] }}
              />
              <span>
                {type === 'six_month' ? '6개월' :
                 type === 'monthly' ? '월간' : '주간'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 날짜 범위 필터 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">기간</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">시작일</label>
            <input
              type="date"
              value={filters.dateRange?.start || ''}
              onChange={(e) => handleFilterChange('dateRange', {
                ...filters.dateRange,
                start: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">종료일</label>
            <input
              type="date"
              value={filters.dateRange?.end || ''}
              onChange={(e) => handleFilterChange('dateRange', {
                ...filters.dateRange,
                end: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 진행률 범위 필터 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">진행률</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">최소 (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.progressRange?.min || ''}
              onChange={(e) => handleFilterChange('progressRange', {
                ...filters.progressRange,
                min: parseInt(e.target.value) || 0
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">최대 (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.progressRange?.max || ''}
              onChange={(e) => handleFilterChange('progressRange', {
                ...filters.progressRange,
                max: parseInt(e.target.value) || 100
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 정렬 옵션 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">정렬</label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filters.sortBy || 'created_at'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at">생성일</option>
            <option value="updated_at">수정일</option>
            <option value="priority">우선순위</option>
            <option value="progress">진행률</option>
            <option value="end_date">마감일</option>
          </select>
          
          <select
            value={filters.sortOrder || 'desc'}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>
        </div>
      </div>

      {/* 기타 옵션 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">기타</label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={filters.includeCompleted ?? true}
            onChange={(e) => handleFilterChange('includeCompleted', e.target.checked)}
            className="rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm">완료된 목표 포함</span>
        </label>
      </div>
    </div>
  )
} 