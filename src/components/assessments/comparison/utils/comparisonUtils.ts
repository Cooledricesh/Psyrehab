import { AssessmentData } from '@/types/assessment'
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'

// 비교 기간 타입
export type ComparisonPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom'

// 비교 기준 타입
export type ComparisonCriteria = 'time' | 'patient' | 'group' | 'benchmark'

// 시간 기간 정의
export interface TimeRange {
  start: Date
  end: Date
  label: string
}

// 비교 필터 옵션
export interface ComparisonFilters {
  dateRange?: TimeRange
  patientIds?: string[]
  minAssessments?: number
  dimensions?: ('concentration' | 'motivation' | 'success' | 'constraints' | 'social')[]
  excludeOutliers?: boolean
}

// 정렬 옵션
export interface SortOptions {
  field: 'overall' | 'concentration' | 'motivation' | 'success' | 'constraints' | 'social' | 'date' | 'improvement'
  direction: 'asc' | 'desc'
}

// 그룹화 옵션
export interface GroupOptions {
  by: 'patient' | 'month' | 'week' | 'score_range' | 'custom'
  customGroups?: { [key: string]: string[] } // patientId -> groupName
}

// 시간 기간 생성 헬퍼
export const createTimeRanges = (period: ComparisonPeriod, referenceDate: Date = new Date()): { current: TimeRange, previous: TimeRange } => {
  let current: TimeRange
  let previous: TimeRange

  switch (period) {
    case 'week':
      current = {
        start: startOfWeek(referenceDate, { weekStartsOn: 1 }),
        end: endOfWeek(referenceDate, { weekStartsOn: 1 }),
        label: '이번 주'
      }
      previous = {
        start: startOfWeek(subDays(referenceDate, 7), { weekStartsOn: 1 }),
        end: endOfWeek(subDays(referenceDate, 7), { weekStartsOn: 1 }),
        label: '지난 주'
      }
      break

    case 'month':
      current = {
        start: startOfMonth(referenceDate),
        end: endOfMonth(referenceDate),
        label: '이번 달'
      }
      previous = {
        start: startOfMonth(subMonths(referenceDate, 1)),
        end: endOfMonth(subMonths(referenceDate, 1)),
        label: '지난 달'
      }
      break

    case 'quarter':
      const quarterStart = new Date(referenceDate.getFullYear(), Math.floor(referenceDate.getMonth() / 3) * 3, 1)
      const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0)
      
      current = {
        start: quarterStart,
        end: quarterEnd,
        label: '이번 분기'
      }
      
      const prevQuarterStart = new Date(quarterStart.getFullYear(), quarterStart.getMonth() - 3, 1)
      const prevQuarterEnd = new Date(prevQuarterStart.getFullYear(), prevQuarterStart.getMonth() + 3, 0)
      
      previous = {
        start: prevQuarterStart,
        end: prevQuarterEnd,
        label: '지난 분기'
      }
      break

    case 'year':
      current = {
        start: new Date(referenceDate.getFullYear(), 0, 1),
        end: new Date(referenceDate.getFullYear(), 11, 31),
        label: '올해'
      }
      previous = {
        start: new Date(referenceDate.getFullYear() - 1, 0, 1),
        end: new Date(referenceDate.getFullYear() - 1, 11, 31),
        label: '작년'
      }
      break

    default:
      throw new Error('Custom period requires explicit time ranges')
  }

  return { current, previous }
}

// 시간 범위별 평가 데이터 필터링
export const filterAssessmentsByTimeRange = (assessments: AssessmentData[], timeRange: TimeRange): AssessmentData[] => {
  return assessments.filter(assessment => {
    const assessmentDate = new Date(assessment.created_at)
    return assessmentDate >= timeRange.start && assessmentDate <= timeRange.end
  })
}

// 비교 필터 적용
export const applyComparisonFilters = (assessments: AssessmentData[], filters: ComparisonFilters): AssessmentData[] => {
  let filtered = [...assessments]

  if (filters.dateRange) {
    filtered = filterAssessmentsByTimeRange(filtered, filters.dateRange)
  }

  if (filters.patientIds && filters.patientIds.length > 0) {
    filtered = filtered.filter(assessment => filters.patientIds!.includes(assessment.patient_id))
  }

  return filtered
}

// 환자별 최소 평가 횟수 필터링
export const filterPatientsByMinAssessments = (
  patientAssessments: { patientId: string, assessments: AssessmentData[] }[],
  minAssessments: number
): { patientId: string, assessments: AssessmentData[] }[] => {
  return patientAssessments.filter(patient => patient.assessments.length >= minAssessments)
}

// 전체 점수 계산 헬퍼
const calculateOverallScore = (assessment: AssessmentData): number => {
  const concentrationScore = Math.min(5, Math.max(1, assessment.concentration_time.duration / 60))
  const motivationScore = (
    (assessment.motivation_level.goal_clarity || 0) +
    (assessment.motivation_level.effort_willingness || 0) +
    (assessment.motivation_level.confidence_level || 0) +
    (assessment.motivation_level.external_support || 0)
  ) / 4
  const successScore = Math.min(5, Math.max(1, 
    (assessment.past_successes.achievement_areas?.length || 0) * 0.5 +
    (assessment.past_successes.most_significant_achievement ? 2 : 0) +
    (assessment.past_successes.learning_from_success ? 1 : 0) +
    (assessment.past_successes.transferable_strategies ? 1 : 0)
  ))
  const constraintsScore = 6 - (assessment.constraints.severity_rating || 3)
  const socialScore = (
    (assessment.social_preference.comfort_with_strangers || 0) +
    (assessment.social_preference.collaboration_willingness || 0)
  ) / 2

  return (concentrationScore + motivationScore + successScore + constraintsScore + socialScore) / 5
}

// 데이터 그룹화
export const groupAssessments = (
  assessments: AssessmentData[],
  options: GroupOptions
): { [groupName: string]: AssessmentData[] } => {
  const groups: { [groupName: string]: AssessmentData[] } = {}

  assessments.forEach(assessment => {
    let groupName: string

    switch (options.by) {
      case 'patient':
        groupName = assessment.patient_id
        break

      case 'month':
        groupName = format(new Date(assessment.created_at), 'yyyy-MM', { locale: ko })
        break

      case 'week':
        const weekStart = startOfWeek(new Date(assessment.created_at), { weekStartsOn: 1 })
        groupName = format(weekStart, 'yyyy-MM-dd', { locale: ko }) + ' 주'
        break

      case 'score_range':
        const score = calculateOverallScore(assessment)
        if (score >= 4.0) groupName = '우수 (4.0-5.0)'
        else if (score >= 3.0) groupName = '좋음 (3.0-3.9)'
        else if (score >= 2.0) groupName = '보통 (2.0-2.9)'
        else groupName = '개선필요 (1.0-1.9)'
        break

      case 'custom':
        if (!options.customGroups) {
          throw new Error('Custom grouping requires customGroups option')
        }
        groupName = options.customGroups[assessment.patient_id] || '기타'
        break

      default:
        groupName = '전체'
    }

    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(assessment)
  })

  return groups
}

// 변화율 계산
export const calculateChangeRate = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return Math.round(((newValue - oldValue) / oldValue) * 100 * 10) / 10
}

// 개선 강도 분류
export const classifyImprovement = (changeRate: number): 'significant_improvement' | 'moderate_improvement' | 'slight_improvement' | 'stable' | 'slight_decline' | 'moderate_decline' | 'significant_decline' => {
  if (changeRate >= 20) return 'significant_improvement'
  else if (changeRate >= 10) return 'moderate_improvement'
  else if (changeRate >= 5) return 'slight_improvement'
  else if (changeRate >= -5) return 'stable'
  else if (changeRate >= -10) return 'slight_decline'
  else if (changeRate >= -20) return 'moderate_decline'
  else return 'significant_decline'
}

// 포맷팅 헬퍼들
export const formatComparisonLabel = (criteria: ComparisonCriteria, identifier: string): string => {
  switch (criteria) {
    case 'time':
      return identifier
    case 'patient':
      return `환자 ${identifier}`
    case 'group':
      return `그룹 ${identifier}`
    case 'benchmark':
      return `기준 ${identifier}`
    default:
      return identifier
  }
}

export const formatScoreRange = (score: number): string => {
  if (score >= 4.0) return '우수'
  else if (score >= 3.0) return '좋음'
  else if (score >= 2.0) return '보통'
  else return '개선필요'
}

export const formatChangeIndicator = (changeRate: number): { text: string, color: string, icon: string } => {
  const improvement = classifyImprovement(changeRate)
  
  switch (improvement) {
    case 'significant_improvement':
      return { text: '크게 개선', color: 'text-green-600', icon: '⬆⬆' }
    case 'moderate_improvement':
      return { text: '개선', color: 'text-green-500', icon: '⬆' }
    case 'slight_improvement':
      return { text: '약간 개선', color: 'text-green-400', icon: '↗' }
    case 'stable':
      return { text: '안정', color: 'text-gray-500', icon: '→' }
    case 'slight_decline':
      return { text: '약간 저하', color: 'text-yellow-500', icon: '↘' }
    case 'moderate_decline':
      return { text: '저하', color: 'text-orange-500', icon: '⬇' }
    case 'significant_decline':
      return { text: '크게 저하', color: 'text-red-600', icon: '⬇⬇' }
    default:
      return { text: '변화없음', color: 'text-gray-400', icon: '-' }
  }
} 