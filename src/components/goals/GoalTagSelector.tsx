import React, { useState, useMemo } from 'react'
import { X, Plus, Search, Hash, Filter } from 'lucide-react'
import { BaseGoal } from '@/types/goals'
// import { GoalTagRecommendationSystem } from '@/utils/goal-categorization' // Removed - deprecated category system
import { 
  ALL_GOAL_TAGS,
  GOAL_TAG_CATEGORIES,
  getTagById,
  // getTagsByCategory
} from '@/constants/goal-categories'
import { cn } from '@/lib/utils'

interface GoalTagSelectorProps {
  value?: string[]
  onChange: (tags: string[]) => void
  goal?: Partial<BaseGoal>
  maxTags?: number
  showRecommendations?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function GoalTagSelector({
  value = [],
  onChange,
  goal,
  maxTags = 10,
  showRecommendations = true,
  placeholder = '태그를 선택하세요',
  disabled = false,
  className
}: GoalTagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // 태그 필터링
  const filteredTags = useMemo(() => {
    let tags = ALL_GOAL_TAGS
    
    // 카테고리 필터
    if (selectedCategory !== 'all') {
      tags = tags.filter(tag => tag.category === selectedCategory)
    }
    
    // 검색 필터
    if (searchQuery) {
      tags = tags.filter(tag =>
        tag.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // 이미 선택된 태그 제외
    tags = tags.filter(tag => !value.includes(tag.id))
    
    return tags
  }, [selectedCategory, searchQuery, value])

  // AI 추천 태그 (deprecated - category system removed)
  // const recommendedTags = useMemo(() => {
  //   return [] // AI recommendation system has been deprecated
  // }, [goal, value, showRecommendations])

  const handleTagAdd = (tagId: string) => {
    if (value.length >= maxTags) return
    
    const newTags = [...value, tagId]
    onChange(newTags)
    setSearchQuery('')
  }

  const handleTagRemove = (tagId: string) => {
    const newTags = value.filter(id => id !== tagId)
    onChange(newTags)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const categoryOptions = [
    { value: 'all', label: '전체' },
    { value: GOAL_TAG_CATEGORIES.DIFFICULTY, label: '난이도' },
    { value: GOAL_TAG_CATEGORIES.DURATION, label: '기간' },
    { value: GOAL_TAG_CATEGORIES.SUPPORT, label: '지원 수준' },
    { value: GOAL_TAG_CATEGORIES.METHOD, label: '방법론' },
    { value: GOAL_TAG_CATEGORIES.RESOURCE, label: '리소스' },
  ]

  return (
    <div className={cn("space-y-3", className)}>
      {/* 선택된 태그들 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tagId) => {
            const tag = getTagById(tagId)
            if (!tag) return null
            
            return (
              <span
                key={tagId}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: `${tag.color}15`,
                  borderColor: `${tag.color}30`,
                  color: tag.color
                }}
              >
                <Hash className="h-3 w-3 mr-1" />
                {tag.label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleTagRemove(tagId)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            )
          })}
        </div>
      )}

      {/* 태그 추가 인터페이스 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || value.length >= maxTags}
          className={cn(
            "w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "disabled:bg-gray-50 disabled:cursor-not-allowed",
            isOpen && "ring-2 ring-blue-500 border-blue-500"
          )}
        >
          <span className="flex items-center justify-between">
            <span className="flex items-center space-x-2 text-gray-500">
              <Plus className="h-4 w-4" />
              <span className="text-sm">
                {value.length >= maxTags 
                  ? `최대 ${maxTags}개 태그 선택됨`
                  : placeholder
                }
              </span>
            </span>
            <span className="text-xs text-gray-400">
              {value.length}/{maxTags}
            </span>
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {/* 헤더 및 필터 */}
            <div className="p-3 border-b border-gray-200 space-y-3">
              {/* 검색 바 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="태그 검색..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {/* 카테고리 필터 */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI 추천 태그 - deprecated (category system removed) */}

            {/* 태그 목록 */}
            <div className="max-h-64 overflow-y-auto">
              {filteredTags.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  {searchQuery ? '검색 결과가 없습니다' : '선택 가능한 태그가 없습니다'}
                </div>
              ) : (
                <div className="p-3">
                  {Object.entries(
                    filteredTags.reduce((groups, tag) => {
                      const category = tag.category
                      if (!groups[category]) groups[category] = []
                      groups[category].push(tag)
                      return groups
                    }, {} as Record<string, typeof filteredTags>)
                  ).map(([category, categoryTags]) => (
                    <div key={category} className="mb-4 last:mb-0">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                        {categoryOptions.find(opt => opt.value === category)?.label || category}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {categoryTags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => handleTagAdd(tag.id)}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border hover:bg-gray-50 transition-colors"
                            style={{
                              backgroundColor: `${tag.color}10`,
                              borderColor: `${tag.color}30`,
                              color: tag.color
                            }}
                          >
                            <Hash className="h-2 w-2 mr-1" />
                            {tag.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-500 text-center">
              최대 {maxTags}개 태그를 선택할 수 있습니다
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 