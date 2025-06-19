import React from 'react'
import {
  BarChart,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'
import { formatChangeIndicator, classifyImprovement } from '../utils/comparisonUtils'

interface ComparisonData {
  id: string
  name: string
  type: 'time' | 'patient' | 'group'
  period?: { start: Date; end: Date; label: string }
  scores: {
    concentration: number
    motivation: number
    success: number
    constraints: number
    social: number
    overall: number
  }
  previousScores?: {
    concentration: number
    motivation: number
    success: number
    constraints: number
    social: number
    overall: number
  }
  metadata?: {
    assessmentCount: number
    participantCount?: number
    averageScore?: number
    rank?: number
  }
}

interface ComparisonSummaryProps {
  data: ComparisonData[]
  title?: string
  comparisonType: 'time' | 'patient' | 'group'
  showStatistics?: boolean
  showRecommendations?: boolean
  showInsights?: boolean
}

export const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({
  data,
  title = '비교 분석 요약',
  comparisonType,
  showStatistics = true,
  showRecommendations = true,
  showInsights = true
}) => {
  // 영역명 정의
  const dimensionNames = {
    concentration: '집중력',
    motivation: '동기수준',
    success: '성공경험',
    constraints: '제약관리',
    social: '사회적응',
    overall: '전체'
  }

  // 변화 분석
  const calculateChanges = () => {
    return data.map(item => {
      if (!item.previousScores) return { ...item, changes: null }

      const changes = Object.keys(item.scores).reduce((acc, key) => {
        const current = (item.scores as unknown)[key]
        const previous = (item.previousScores as unknown)[key]
        const changeRate = ((current - previous) / previous) * 100
        
        acc[key] = {
          current,
          previous,
          difference: current - previous,
          changeRate,
          classification: classifyImprovement(changeRate)
        }
        return acc
      }, {} as unknown)

      return { ...item, changes }
    })
  }

  const dataWithChanges = calculateChanges()

  // 전체 통계
  const overallStats = {
    totalItems: data.length,
    averageOverall: data.reduce((sum, item) => sum + item.scores.overall, 0) / data.length,
    bestPerformer: data.reduce((max, item) => item.scores.overall > max.scores.overall ? item : max, data[0]),
    worstPerformer: data.reduce((min, item) => item.scores.overall < min.scores.overall ? item : min, data[0]),
    improvementCount: dataWithChanges.filter(item => 
      item.changes && item.changes.overall.changeRate > 0
    ).length,
    declineCount: dataWithChanges.filter(item => 
      item.changes && item.changes.overall.changeRate < 0
    ).length
  }

  // 영역별 평균 계산
  const dimensionAverages = Object.keys(dimensionNames).reduce((acc, key) => {
    acc[key] = data.reduce((sum, item) => sum + (item.scores as unknown)[key], 0) / data.length
    return acc
  }, {} as { [key: string]: number })

  // 주요 인사이트 생성
  const generateInsights = () => {
    const insights = []

    // 성과 분석
    const excellentCount = data.filter(item => item.scores.overall >= 4.0).length
    const poorCount = data.filter(item => item.scores.overall < 2.0).length
    
    if (excellentCount > 0) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: '우수한 성과',
        message: `${excellentCount}개 항목이 우수 등급(4.0 이상)을 달성했습니다.`
      })
    }

    if (poorCount > 0) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: '개선 필요',
        message: `${poorCount}개 항목이 개선이 필요한 수준(2.0 미만)입니다.`
      })
    }

    // 개선 트렌드 분석
    if (overallStats.improvementCount > overallStats.declineCount) {
      insights.push({
        type: 'info',
        icon: TrendingUp,
        title: '긍정적 트렌드',
        message: `전체적으로 ${overallStats.improvementCount}개 항목이 개선되고 있습니다.`
      })
    } else if (overallStats.declineCount > overallStats.improvementCount) {
      insights.push({
        type: 'warning',
        icon: TrendingDown,
        title: '주의 필요',
        message: `${overallStats.declineCount}개 항목에서 성과 저하가 관찰됩니다.`
      })
    }

    // 강점/약점 영역 분석
    const strongestDimension = Object.entries(dimensionAverages)
      .reduce((max, [key, value]) => value > max.value ? { key, value } : max, { key: '', value: 0 })
    const weakestDimension = Object.entries(dimensionAverages)
      .reduce((min, [key, value]) => value < min.value ? { key, value } : min, { key: '', value: 5 })

    insights.push({
      type: 'info',
      icon: Award,
      title: '강점 영역',
      message: `${(dimensionNames as unknown)[strongestDimension.key]} 영역이 가장 뛰어난 성과를 보입니다 (평균 ${strongestDimension.value.toFixed(2)}).`
    })

    if (weakestDimension.value < 3.0) {
      insights.push({
        type: 'warning',
        icon: Target,
        title: '집중 개선 영역',
        message: `${(dimensionNames as unknown)[weakestDimension.key]} 영역의 집중적인 개선이 필요합니다 (평균 ${weakestDimension.value.toFixed(2)}).`
      })
    }

    return insights
  }

  const insights = generateInsights()

  // 권장사항 생성
  const generateRecommendations = () => {
    const recommendations = []

    // 성과 기반 권장사항
    if (overallStats.worstPerformer.scores.overall < 2.5) {
      recommendations.push({
        priority: 'high',
        title: '긴급 개입 필요',
        description: `${overallStats.worstPerformer.name}에 대한 즉시적인 개선 프로그램이 필요합니다.`,
        actions: ['개별 상담 계획 수립', '맞춤형 재활 프로그램 적용', '주간 모니터링 강화']
      })
    }

    // 개선 트렌드 기반 권장사항
    const decliningItems = dataWithChanges.filter(item => 
      item.changes && item.changes.overall.changeRate < -10
    )
    
    if (decliningItems.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: '성과 저하 대응',
        description: `${decliningItems.length}개 항목에서 유의미한 성과 저하가 관찰됩니다.`,
        actions: ['원인 분석 실시', '프로그램 재검토', '추가 지원 방안 모색']
      })
    }

    // 영역별 권장사항
    const weakDimensions = Object.entries(dimensionAverages)
      .filter(([key, value]) => value < 2.5)
      .map(([key, value]) => ({ key, value, name: (dimensionNames as unknown)[key] }))

    if (weakDimensions.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: '영역별 집중 개선',
        description: `${weakDimensions.map(d => d.name).join(', ')} 영역의 전반적인 개선이 필요합니다.`,
        actions: [
          '해당 영역 전문가 상담',
          '맞춤형 훈련 프로그램 도입',
          '정기적인 진도 평가'
        ]
      })
    }

    // 성공 사례 활용 권장사항
    if (overallStats.bestPerformer.scores.overall >= 4.0) {
      recommendations.push({
        priority: 'low',
        title: '성공 사례 활용',
        description: `${overallStats.bestPerformer.name}의 우수 사례를 다른 케이스에 적용해보세요.`,
        actions: ['베스트 프랙티스 분석', '성공 요인 정리', '적용 가능성 검토']
      })
    }

    return recommendations
  }

  const recommendations = generateRecommendations()

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              {comparisonType === 'time' && <Calendar className="h-4 w-4" />}
              {comparisonType === 'patient' && <Users className="h-4 w-4" />}
              {comparisonType === 'group' && <BarChart className="h-4 w-4" />}
              <span>
                {comparisonType === 'time' && '시간 비교'}
                {comparisonType === 'patient' && '환자 비교'}
                {comparisonType === 'group' && '그룹 비교'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="h-4 w-4" />
              <span>{data.length}개 항목</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 주요 통계 */}
        {showStatistics && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">주요 통계</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">전체 평균</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {overallStats.averageOverall.toFixed(2)}
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">최고 성과</span>
                </div>
                <div className="text-lg font-bold text-green-600">
                  {overallStats.bestPerformer.scores.overall.toFixed(2)}
                </div>
                <div className="text-xs text-green-700 truncate">
                  {overallStats.bestPerformer.name}
                </div>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">개선 항목</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {overallStats.improvementCount}
                </div>
                <div className="text-xs text-purple-700">
                  전체 {data.length}개 중
                </div>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">저하 항목</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {overallStats.declineCount}
                </div>
                <div className="text-xs text-orange-700">
                  주의 필요
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 상세 비교 결과 */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">상세 비교 결과</h4>
          <div className="space-y-3">
            {dataWithChanges.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900">{item.name}</h5>
                    {item.period && (
                      <div className="text-sm text-gray-600">
                        {format(item.period.start, 'yyyy.MM.dd', { locale: ko })} - {format(item.period.end, 'yyyy.MM.dd', { locale: ko })}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {item.scores.overall.toFixed(2)}
                    </div>
                    {item.changes && (
                      <div className={`text-sm ${formatChangeIndicator(item.changes.overall.changeRate).color}`}>
                        {formatChangeIndicator(item.changes.overall.changeRate).icon} {item.changes.overall.changeRate.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(dimensionNames).slice(0, 5).map(([key, name]) => {
                    const score = (item.scores as unknown)[key]
                    const change = item.changes ? item.changes[key] : null
                    
                    return (
                      <div key={key} className="text-center">
                        <div className="text-xs text-gray-600 mb-1">{name}</div>
                        <div className="font-medium text-gray-900">{score.toFixed(1)}</div>
                        {change && (
                          <div className={`text-xs ${formatChangeIndicator(change.changeRate).color}`}>
                            {change.changeRate > 0 ? '+' : ''}{change.changeRate.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {item.metadata && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                    평가 횟수: {item.metadata.assessmentCount}
                    {item.metadata.participantCount && ` | 참여자: ${item.metadata.participantCount}명`}
                    {item.metadata.rank && ` | 순위: ${item.metadata.rank}위`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 인사이트 */}
        {showInsights && insights.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">주요 인사이트</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, index) => {
                const Icon = insight.icon
                const colorClasses = {
                  success: 'bg-green-50 border-green-200 text-green-800',
                  warning: 'bg-orange-50 border-orange-200 text-orange-800',
                  info: 'bg-blue-50 border-blue-200 text-blue-800'
                }
                
                return (
                  <div key={index} className={`p-3 rounded-lg border ${colorClasses[insight.type]}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{insight.title}</span>
                    </div>
                    <p className="text-sm">{insight.message}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 권장사항 */}
        {showRecommendations && recommendations.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">권장사항</h4>
            <div className="space-y-4">
              {recommendations.map((rec, index) => {
                const priorityColors = {
                  high: 'border-red-200 bg-red-50',
                  medium: 'border-orange-200 bg-orange-50',
                  low: 'border-blue-200 bg-blue-50'
                }
                const priorityLabels = {
                  high: '높음',
                  medium: '보통',
                  low: '낮음'
                }
                
                return (
                  <div key={index} className={`p-4 rounded-lg border ${priorityColors[rec.priority]}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-900">{rec.title}</h5>
                      <span className={`text-xs px-2 py-1 rounded-full ${{
                        high: 'bg-red-100 text-red-800',
                        medium: 'bg-orange-100 text-orange-800',
                        low: 'bg-blue-100 text-blue-800'
                      }[rec.priority]}`}>
                        우선순위: {priorityLabels[rec.priority]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-600">실행 방안:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {rec.actions.map((action, actionIndex) => (
                          <li key={actionIndex} className="flex items-center space-x-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 