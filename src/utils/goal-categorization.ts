import { 
  BaseGoal, 
  GoalCategory, 
  GoalType, 
  GoalStatus, 
  GoalPriority 
} from '@/types/goals'
import { 
  getTagById,
  GOAL_STATUS_COLORS,
  GOAL_PRIORITY_COLORS,
  GOAL_TYPE_COLORS
} from '@/constants/goal-categories'

// 태그 인터페이스
export interface GoalTag {
  id: string
  label: string
  color: string
  category: string
  description?: string
}

// 고급 필터 인터페이스
export interface AdvancedGoalFilters {
  categories?: string[]
  tags?: string[]
  statusList?: GoalStatus[]
  priorityList?: GoalPriority[]
  typeList?: GoalType[]
  dateRange?: {
    start: string
    end: string
  }
  progressRange?: {
    min: number
    max: number
  }
  searchQuery?: string
  sortBy?: 'created_at' | 'updated_at' | 'priority' | 'progress' | 'end_date'
  sortOrder?: 'asc' | 'desc'
  includeCompleted?: boolean
}

// 분류 통계 인터페이스
export interface CategorizationStatistics {
  totalGoals: number
  categoryCounts: Record<string, number>
  tagCounts: Record<string, number>
  statusDistribution: Record<GoalStatus, number>
  priorityDistribution: Record<GoalPriority, number>
  typeDistribution: Record<GoalType, number>
  averageProgress: number
  completionRate: number
  popularTags: Array<{ tag: string; count: number }>
  popularCategories: Array<{ category: string; count: number }>
}

// 태그 추천 시스템
export class GoalTagRecommendationSystem {
  // 목표 내용을 기반으로 태그 추천
  static recommendTags(goal: Partial<BaseGoal>): GoalTag[] {
    const recommendations: GoalTag[] = []
    const { title, description, goal_type } = goal

    const content = `${title || ''} ${description || ''}`.toLowerCase()

    // 난이도 기반 추천
    if (content.includes('쉬운') || content.includes('간단한')) {
      const easyTag = getTagById('easy')
      if (easyTag) recommendations.push(easyTag)
    } else if (content.includes('어려운') || content.includes('복잡한') || content.includes('도전적')) {
      const hardTag = getTagById('hard')
      if (hardTag) recommendations.push(hardTag)
    } else if (content.includes('보통') || content.includes('적당한')) {
      const mediumTag = getTagById('medium')
      if (mediumTag) recommendations.push(mediumTag)
    }

    // 기간 기반 추천
    if (goal_type === 'weekly') {
      const shortTermTag = getTagById('short-term')
      if (shortTermTag) recommendations.push(shortTermTag)
    } else if (goal_type === 'monthly') {
      const mediumTermTag = getTagById('medium-term')
      if (mediumTermTag) recommendations.push(mediumTermTag)
    } else if (goal_type === 'six_month') {
      const longTermTag = getTagById('long-term')
      if (longTermTag) recommendations.push(longTermTag)
    }

    // 지원 수준 기반 추천
    if (content.includes('독립적') || content.includes('혼자')) {
      const independentTag = getTagById('independent')
      if (independentTag) recommendations.push(independentTag)
    } else if (content.includes('도움') || content.includes('지원')) {
      if (content.includes('많은') || content.includes('집중적')) {
        const intensiveTag = getTagById('intensive-support')
        if (intensiveTag) recommendations.push(intensiveTag)
      } else {
        const moderateTag = getTagById('moderate-support')
        if (moderateTag) recommendations.push(moderateTag)
      }
    }

    // 방법론 기반 추천
    if (content.includes('그룹') || content.includes('팀')) {
      const groupTag = getTagById('group')
      if (groupTag) recommendations.push(groupTag)
    } else if (content.includes('가족')) {
      const familyTag = getTagById('family')
      if (familyTag) recommendations.push(familyTag)
    } else if (content.includes('전문가') || content.includes('상담')) {
      const professionalTag = getTagById('professional')
      if (professionalTag) recommendations.push(professionalTag)
    } else if (content.includes('앱') || content.includes('기술') || content.includes('디지털')) {
      const technologyTag = getTagById('technology')
      if (technologyTag) recommendations.push(technologyTag)
    }

    return recommendations
  }

  // 유사한 목표들로부터 태그 추천
  static recommendFromSimilarGoals(goals: BaseGoal[], currentGoal: Partial<BaseGoal>): GoalTag[] {
    const similarGoals = goals.filter(goal => 
      goal.category_id === currentGoal.category_id && 
      goal.goal_type === currentGoal.goal_type
    )

    const tagFrequency: Record<string, number> = {}
    
    similarGoals.forEach(goal => {
      goal.tags?.forEach(tagId => {
        tagFrequency[tagId] = (tagFrequency[tagId] || 0) + 1
      })
    })

    // 가장 자주 사용되는 태그들 반환
    const popularTagIds = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tagId]) => tagId)

    return popularTagIds
      .map(tagId => getTagById(tagId))
      .filter((tag): tag is GoalTag => tag !== undefined)
  }
}

// 분류 유틸리티 클래스
export class GoalCategorizationUtils {
  // 목표 배열을 카테고리별로 그룹화
  static groupByCategory(goals: BaseGoal[]): Record<string, BaseGoal[]> {
    return goals.reduce((groups, goal) => {
      const categoryId = goal.category_id || 'uncategorized'
      if (!groups[categoryId]) {
        groups[categoryId] = []
      }
      groups[categoryId].push(goal)
      return groups
    }, {} as Record<string, BaseGoal[]>)
  }

  // 태그별로 그룹화
  static groupByTag(goals: BaseGoal[]): Record<string, BaseGoal[]> {
    const groups: Record<string, BaseGoal[]> = {}
    
    goals.forEach(goal => {
      goal.tags?.forEach(tagId => {
        if (!groups[tagId]) {
          groups[tagId] = []
        }
        groups[tagId].push(goal)
      })
    })

    return groups
  }

  // 고급 필터 적용
  static applyAdvancedFilters(goals: BaseGoal[], filters: AdvancedGoalFilters): BaseGoal[] {
    let filteredGoals = [...goals]

    // 카테고리 필터
    if (filters.categories && filters.categories.length > 0) {
      filteredGoals = filteredGoals.filter(goal => 
        filters.categories!.includes(goal.category_id)
      )
    }

    // 태그 필터
    if (filters.tags && filters.tags.length > 0) {
      filteredGoals = filteredGoals.filter(goal =>
        goal.tags?.some(tag => filters.tags!.includes(tag))
      )
    }

    // 상태 필터
    if (filters.statusList && filters.statusList.length > 0) {
      filteredGoals = filteredGoals.filter(goal =>
        filters.statusList!.includes(goal.status)
      )
    }

    // 우선순위 필터
    if (filters.priorityList && filters.priorityList.length > 0) {
      filteredGoals = filteredGoals.filter(goal =>
        filters.priorityList!.includes(goal.priority)
      )
    }

    // 유형 필터
    if (filters.typeList && filters.typeList.length > 0) {
      filteredGoals = filteredGoals.filter(goal =>
        filters.typeList!.includes(goal.goal_type)
      )
    }

    // 날짜 범위 필터
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      filteredGoals = filteredGoals.filter(goal => {
        const goalDate = new Date(goal.created_at)
        return goalDate >= new Date(start) && goalDate <= new Date(end)
      })
    }

    // 진행률 범위 필터
    if (filters.progressRange) {
      const { min, max } = filters.progressRange
      filteredGoals = filteredGoals.filter(goal =>
        goal.progress >= min && goal.progress <= max
      )
    }

    // 검색어 필터
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filteredGoals = filteredGoals.filter(goal =>
        goal.title.toLowerCase().includes(query) ||
        goal.description.toLowerCase().includes(query) ||
        goal.notes?.toLowerCase().includes(query)
      )
    }

    // 완료된 목표 포함 여부
    if (!filters.includeCompleted) {
      filteredGoals = filteredGoals.filter(goal => goal.status !== 'completed')
    }

    // 정렬
    if (filters.sortBy) {
      filteredGoals.sort((a, b) => {
        let aValue: number | string, bValue: number | string

        switch (filters.sortBy) {
          case 'created_at':
          case 'updated_at':
          case 'end_date':
            aValue = new Date(a[filters.sortBy!]).getTime()
            bValue = new Date(b[filters.sortBy!]).getTime()
            break
          case 'priority': {
            const priorityOrder = { high: 3, medium: 2, low: 1 }
            aValue = priorityOrder[a.priority]
            bValue = priorityOrder[b.priority]
            break
          }
          case 'progress':
            aValue = a.progress
            bValue = b.progress
            break
          default:
            aValue = a[filters.sortBy!]
            bValue = b[filters.sortBy!]
        }

        if (filters.sortOrder === 'desc') {
          return bValue - aValue
        }
        return aValue - bValue
      })
    }

    return filteredGoals
  }

  // 분류 통계 계산
  static calculateStatistics(goals: BaseGoal[], categories: GoalCategory[]): CategorizationStatistics {
    const totalGoals = goals.length
    
    // 카테고리별 개수
    const categoryCounts: Record<string, number> = {}
    categories.forEach(cat => {
      categoryCounts[cat.id] = goals.filter(goal => goal.category_id === cat.id).length
    })

    // 태그별 개수
    const tagCounts: Record<string, number> = {}
    goals.forEach(goal => {
      goal.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    // 상태별 분포
    const statusDistribution: Record<GoalStatus, number> = {
      pending: 0,
      active: 0,
      completed: 0,
      on_hold: 0,
      cancelled: 0
    }
    goals.forEach(goal => {
      statusDistribution[goal.status]++
    })

    // 우선순위별 분포
    const priorityDistribution: Record<GoalPriority, number> = {
      high: 0,
      medium: 0,
      low: 0
    }
    goals.forEach(goal => {
      priorityDistribution[goal.priority]++
    })

    // 유형별 분포
    const typeDistribution: Record<GoalType, number> = {
      six_month: 0,
      monthly: 0,
      weekly: 0
    }
    goals.forEach(goal => {
      typeDistribution[goal.goal_type]++
    })

    // 평균 진행률
    const averageProgress = totalGoals > 0 
      ? goals.reduce((sum, goal) => sum + goal.progress, 0) / totalGoals 
      : 0

    // 완료율
    const completionRate = totalGoals > 0 
      ? (statusDistribution.completed / totalGoals) * 100 
      : 0

    // 인기 태그 (상위 10개)
    const popularTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))

    // 인기 카테고리 (상위 5개)
    const popularCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))

    return {
      totalGoals,
      categoryCounts,
      tagCounts,
      statusDistribution,
      priorityDistribution,
      typeDistribution,
      averageProgress,
      completionRate,
      popularTags,
      popularCategories
    }
  }

  // 색상 매핑 유틸리티
  static getStatusColor(status: GoalStatus): string {
    return GOAL_STATUS_COLORS[status] || '#6B7280'
  }

  static getPriorityColor(priority: GoalPriority): string {
    return GOAL_PRIORITY_COLORS[priority] || '#6B7280'
  }

  static getTypeColor(type: GoalType): string {
    return GOAL_TYPE_COLORS[type] || '#6B7280'
  }

  // 태그 표시용 색상 생성
  static generateTagColor(tagId: string): string {
    const tag = getTagById(tagId)
    return tag?.color || '#6B7280'
  }
}

// 스마트 분류 시스템 (AI 기반 추천)
export class SmartCategorizationSystem {
  // 목표 내용을 분석하여 적절한 카테고리 추천
  static recommendCategory(goal: Partial<BaseGoal>, categories: GoalCategory[]): GoalCategory[] {
    const content = `${goal.title || ''} ${goal.description || ''}`.toLowerCase()
    const recommendations: Array<{ category: GoalCategory; score: number }> = []

    categories.forEach(category => {
      let score = 0
      const categoryKeywords = this.getCategoryKeywords(category.name)
      
      categoryKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          score += 1
        }
      })

      if (score > 0) {
        recommendations.push({ category, score })
      }
    })

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(rec => rec.category)
  }

  // 카테고리별 키워드 정의
  private static getCategoryKeywords(categoryName: string): string[] {
    const keywordMap: Record<string, string[]> = {
      '정신건강 관리': ['스트레스', '감정', '우울', '불안', '마음', '정신', '심리', '안정'],
      '사회적 관계': ['친구', '가족', '관계', '소통', '대화', '사회', '커뮤니티', '네트워크'],
      '일상생활 기능': ['일상', '생활', '관리', '정리', '청소', '요리', '자립', '독립'],
      '직업재활': ['취업', '직업', '일자리', '기술', '훈련', '경력', '면접', '이력서'],
      '교육 및 학습': ['공부', '학습', '교육', '지식', '기술', '과정', '수업', '강의'],
      '신체건강': ['운동', '건강', '체력', '신체', '활동', '헬스', '요가', '걷기'],
      '여가활동': ['취미', '여가', '문화', '예술', '오락', '게임', '영화', '음악'],
      '주거 안정': ['주택', '집', '거주', '임대', '매매', '이사', '환경', '안전']
    }

    return keywordMap[categoryName] || []
  }

  // 목표 우선순위 자동 추천
  static recommendPriority(goal: Partial<BaseGoal>): GoalPriority {
    const content = `${goal.title || ''} ${goal.description || ''}`.toLowerCase()
    
    const highPriorityKeywords = ['긴급', '즉시', '필수', '중요', '핵심', '반드시']
    const lowPriorityKeywords = ['여유', '선택', '부수적', '나중에', '시간날때']

    const hasHighKeywords = highPriorityKeywords.some(keyword => content.includes(keyword))
    const hasLowKeywords = lowPriorityKeywords.some(keyword => content.includes(keyword))

    if (hasHighKeywords) return 'high'
    if (hasLowKeywords) return 'low'
    return 'medium'
  }
} 