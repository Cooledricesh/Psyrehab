import React, { useState, useMemo } from 'react'
import { Check, ChevronDown, Search, Grid3X3, List, Sparkles } from 'lucide-react'
import { BaseGoal /*, GoalCategory*/ } from '@/types/goals'
import { useGoalCategories } from '@/hooks/goal-categories/useGoalCategories'
import { SmartCategorizationSystem } from '@/utils/goal-categorization'
import { getCategoryIcon } from '@/constants/goal-categories'
import { cn } from '@/lib/utils'

interface GoalCategorySelectorProps {
  value?: string
  onChange: (categoryId: string) => void
  goal?: Partial<BaseGoal>
  showRecommendations?: boolean
  variant?: 'dropdown' | 'grid' | 'list'
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function GoalCategorySelector({
  value,
  onChange,
  goal,
  showRecommendations = true,
  variant = 'dropdown',
  placeholder = '카테고리를 선택하세요',
  disabled = false,
  className
}: GoalCategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: categories = [], isLoading } = useGoalCategories()

  // 카테고리 필터링
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories
    
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categories, searchQuery])

  // AI 추천 카테고리
  const recommendedCategories = useMemo(() => {
    if (!goal || !showRecommendations) return []
    
    return SmartCategorizationSystem.recommendCategory(goal, categories)
  }, [goal, categories, showRecommendations])

  // 선택된 카테고리 정보
  const selectedCategory = categories.find(cat => cat.id === value)

  const handleCategorySelect = (categoryId: string) => {
    onChange(categoryId)
    setIsOpen(false)
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    )
  }

  // 드롭다운 모드
  if (variant === 'dropdown') {
    return (
      <div className={cn("relative", className)}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "disabled:bg-gray-50 disabled:cursor-not-allowed",
            isOpen && "ring-2 ring-blue-500 border-blue-500"
          )}
        >
          <span className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              {selectedCategory ? (
                <>
                  <span className="text-lg">
                    {getCategoryIcon(selectedCategory.icon)}
                  </span>
                  <span className="text-sm font-medium">
                    {selectedCategory.name}
                  </span>
                </>
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </span>
            <ChevronDown className={cn(
              "h-4 w-4 text-gray-400 transition-transform",
              isOpen && "transform rotate-180"
            )} />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {/* 검색 바 */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="카테고리 검색..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* AI 추천 섹션 */}
            {recommendedCategories.length > 0 && (
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex items-center space-x-1 mb-2">
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs font-medium text-gray-600">AI 추천</span>
                </div>
                <div className="space-y-1">
                  {recommendedCategories.map((category) => (
                    <button
                      key={`recommended-${category.id}`}
                      onClick={() => handleCategorySelect(category.id)}
                      className="w-full flex items-center space-x-2 px-2 py-1 text-left text-sm rounded hover:bg-yellow-50 group"
                    >
                      <span className="text-base">{getCategoryIcon(category.icon)}</span>
                      <span className="font-medium text-yellow-700">{category.name}</span>
                      <Sparkles className="h-3 w-3 text-yellow-500 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 카테고리 목록 */}
            <div className="max-h-64 overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  검색 결과가 없습니다.
                </div>
              ) : (
                <div className="py-1">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50",
                        value === category.id && "bg-blue-50"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getCategoryIcon(category.icon)}</span>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {category.description}
                          </div>
                        </div>
                      </div>
                      {value === category.id && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 그리드 모드
  if (variant === 'grid') {
    return (
      <div className={cn("space-y-4", className)}>
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">카테고리 선택</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1 rounded",
                viewMode === 'grid' ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1 rounded",
                viewMode === 'list' ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="카테고리 검색..."
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* AI 추천 */}
        {recommendedCategories.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-1">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">AI 추천 카테고리</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {recommendedCategories.map((category) => (
                <button
                  key={`grid-recommended-${category.id}`}
                  onClick={() => handleCategorySelect(category.id)}
                  className={cn(
                    "p-3 border-2 border-dashed border-yellow-300 rounded-lg text-left hover:bg-yellow-50 transition-colors",
                    value === category.id && "border-yellow-500 bg-yellow-50"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getCategoryIcon(category.icon)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium text-yellow-700">{category.name}</span>
                        <Sparkles className="h-3 w-3 text-yellow-500" />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 카테고리 그리드/리스트 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">전체 카테고리</h4>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  disabled={disabled}
                  className={cn(
                    "p-4 border-2 rounded-lg text-left hover:bg-gray-50 transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    value === category.id 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {getCategoryIcon(category.icon)}
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {category.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  disabled={disabled}
                  className={cn(
                    "w-full p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    value === category.id 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {getCategoryIcon(category.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {category.description}
                      </div>
                    </div>
                    {value === category.id && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    )
  }

  // 리스트 모드 (기본)
  return (
    <div className={cn("space-y-3", className)}>
      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="카테고리 검색..."
          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* AI 추천 */}
      {recommendedCategories.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">추천 카테고리</span>
          </div>
          {recommendedCategories.map((category) => (
            <button
              key={`list-recommended-${category.id}`}
              onClick={() => handleCategorySelect(category.id)}
              className="w-full p-3 border-2 border-dashed border-yellow-300 rounded-lg text-left hover:bg-yellow-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{getCategoryIcon(category.icon)}</span>
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-yellow-700">{category.name}</span>
                    <Sparkles className="h-3 w-3 text-yellow-500" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 전체 카테고리 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">전체 카테고리</h4>
        {filteredCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            disabled={disabled}
            className={cn(
              "w-full p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              value === category.id 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{getCategoryIcon(category.icon)}</span>
                <div>
                  <div className="font-medium">{category.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{category.description}</div>
                </div>
              </div>
              {value === category.id && (
                <Check className="h-5 w-5 text-blue-600" />
              )}
            </div>
          </button>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <Search className="h-6 w-6 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  )
} 