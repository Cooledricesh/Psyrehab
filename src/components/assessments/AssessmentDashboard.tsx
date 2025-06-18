import React, { useState, useMemo } from 'react'
import { AssessmentData } from '@/types/assessment'
import { 
  AssessmentScoreChart, 
  AssessmentTrendChart, 
  AssessmentComparisonChart 
} from './charts'
import type { AssessmentComparisonItem } from './charts/AssessmentComparisonChart'

interface AssessmentDashboardProps {
  patientId?: string
  assessments: AssessmentData[]
  comparisonData?: AssessmentComparisonItem[]
  className?: string
}

type ViewMode = 'overview' | 'trends' | 'comparison' | 'detailed'
type ChartSize = 'small' | 'medium' | 'large'

const AssessmentDashboard: React.FC<AssessmentDashboardProps> = ({
  patientId,
  assessments,
  comparisonData = [],
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [chartSize, setChartSize] = useState<ChartSize>('medium')
  // Assessment selection reserved for detailed view implementation
  // const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null)

  // 차트 높이 설정
  const chartHeight = useMemo(() => {
    switch (chartSize) {
      case 'small': return 300
      case 'medium': return 400
      case 'large': return 500
      default: return 400
    }
  }, [chartSize])

  // 최신 평가와 이전 평가 데이터
  const { latestAssessment, previousAssessment, hasMultipleAssessments } = useMemo(() => {
    const sortedAssessments = [...assessments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    return {
      latestAssessment: sortedAssessments[0] || null,
      previousAssessment: sortedAssessments[1] || null,
      hasMultipleAssessments: sortedAssessments.length > 1
    }
  }, [assessments])

  // 통계 정보
  const stats = useMemo(() => {
    if (assessments.length === 0) return null

    const totalAssessments = assessments.length
    const firstAssessment = assessments.reduce((earliest, current) => 
      new Date(current.created_at) < new Date(earliest.created_at) ? current : earliest
    )
    const daysSinceFirst = Math.floor(
      (new Date().getTime() - new Date(firstAssessment.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      totalAssessments,
      daysSinceFirst,
      frequency: totalAssessments > 1 ? Math.round(daysSinceFirst / (totalAssessments - 1)) : 0
    }
  }, [assessments])

  // 뷰 모드별 렌더링
  const renderContent = () => {
    if (!latestAssessment) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">평가 데이터가 없습니다</h3>
          <p className="text-gray-600">
            환자의 첫 번째 평가를 완료하면 시각화 데이터를 확인할 수 있습니다.
          </p>
        </div>
      )
    }

    switch (viewMode) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* 최신 평가 점수 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <AssessmentScoreChart
                assessment={latestAssessment}
                showComparison={previousAssessment}
                height={chartHeight}
                className="bg-white rounded-lg border border-gray-200 p-6"
              />
              
              {/* 요약 정보 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">평가 요약</h3>
                
                <div className="space-y-4">
                  {/* 기본 정보 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-blue-600 text-sm font-medium">총 평가 수</div>
                      <div className="text-2xl font-bold text-blue-900">{stats?.totalAssessments}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-green-600 text-sm font-medium">평가 기간</div>
                      <div className="text-2xl font-bold text-green-900">{stats?.daysSinceFirst}일</div>
                    </div>
                  </div>

                  {/* 최신 평가 정보 */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">최근 평가 상세</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">평가 일시:</span>
                        <span className="font-medium">
                          {new Date(latestAssessment.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">집중 시간:</span>
                        <span className="font-medium">{latestAssessment.concentration_time.duration}분</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">동기 수준:</span>
                        <span className="font-medium">
                          {latestAssessment.motivation_level.goal_clarity || 0}/5
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">제약 심각도:</span>
                        <span className="font-medium">
                          {latestAssessment.constraints.severity_rating || 0}/5
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 개선 권장사항 */}
                  {hasMultipleAssessments && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">개선 권장사항</h4>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          📈 지속적인 평가를 통해 개인의 발전 과정을 추적하고 있습니다.
                          추세 보기에서 더 자세한 변화를 확인해보세요.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 'trends':
        return (
          <div className="space-y-6">
            {hasMultipleAssessments ? (
              <AssessmentTrendChart
                assessments={assessments}
                height={chartHeight}
                className="bg-white rounded-lg border border-gray-200 p-6"
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center py-12">
                <div className="text-gray-400 text-lg mb-2">📈</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">추세 분석 불가</h3>
                <p className="text-gray-600">
                  추세를 확인하려면 최소 2개 이상의 평가 데이터가 필요합니다.
                </p>
              </div>
            )}
          </div>
        )

      case 'comparison':
        return (
          <div className="space-y-6">
            {comparisonData.length > 0 ? (
              <AssessmentComparisonChart
                comparisonItems={comparisonData}
                height={chartHeight}
                className="bg-white rounded-lg border border-gray-200 p-6"
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center py-12">
                <div className="text-gray-400 text-lg mb-2">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">비교 데이터 없음</h3>
                <p className="text-gray-600">
                  다른 환자나 그룹과 비교할 데이터가 제공되지 않았습니다.
                </p>
              </div>
            )}
          </div>
        )

      case 'detailed':
        return (
          <div className="grid grid-cols-1 gap-8">
            <AssessmentScoreChart
              assessment={latestAssessment}
              showComparison={previousAssessment}
              height={chartHeight + 100}
              className="bg-white rounded-lg border border-gray-200 p-6"
            />
            
            {hasMultipleAssessments && (
              <AssessmentTrendChart
                assessments={assessments}
                height={chartHeight}
                className="bg-white rounded-lg border border-gray-200 p-6"
              />
            )}
            
            {comparisonData.length > 0 && (
              <AssessmentComparisonChart
                comparisonItems={comparisonData}
                height={chartHeight}
                className="bg-white rounded-lg border border-gray-200 p-6"
              />
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {/* 헤더 및 컨트롤 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">평가 대시보드</h2>
            {patientId && (
              <p className="text-sm text-gray-600 mt-1">
                환자 ID: {patientId} • {assessments.length}개 평가
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* 차트 크기 선택 */}
            <select
              value={chartSize}
              onChange={(e) => setChartSize(e.target.value as ChartSize)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">작은 차트</option>
              <option value="medium">보통 차트</option>
              <option value="large">큰 차트</option>
            </select>

            {/* 뷰 모드 선택 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'overview', label: '개요', icon: '📊' },
                { key: 'trends', label: '추세', icon: '📈' },
                { key: 'comparison', label: '비교', icon: '👥' },
                { key: 'detailed', label: '상세', icon: '🔍' }
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key as ViewMode)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-6">
        {renderContent()}
      </div>
    </div>
  )
}

export default AssessmentDashboard 