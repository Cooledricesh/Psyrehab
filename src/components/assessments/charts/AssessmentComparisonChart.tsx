import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts'
import { AssessmentData } from '@/types/assessment'

interface ComparisonData {
  name: string
  concentration: number
  motivation: number
  success: number
  constraints: number
  social: number
  overall: number
  patientCount?: number
}

interface AssessmentComparisonItem {
  name: string // 환자명 또는 그룹명
  assessments: AssessmentData[]
  color?: string
}

interface AssessmentComparisonChartProps {
  comparisonItems: AssessmentComparisonItem[]
  height?: number
  className?: string
  chartType?: 'grouped' | 'stacked' // 차트 유형
  showAverage?: boolean // 평균선 표시
}

// 평가 데이터를 점수로 변환하는 함수 (재사용)
function calculateAssessmentScores(assessment: AssessmentData) {
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

  return {
    concentration: concentrationScore,
    motivation: motivationScore,
    success: successScore,
    constraints: constraintsScore,
    social: socialScore
  }
}

// 비교 데이터로 변환
function transformToComparisonData(comparisonItems: AssessmentComparisonItem[]): ComparisonData[] {
  return comparisonItems.map(item => {
    if (item.assessments.length === 0) {
      return {
        name: item.name,
        concentration: 0,
        motivation: 0,
        success: 0,
        constraints: 0,
        social: 0,
        overall: 0,
        patientCount: 0
      }
    }

    // 모든 평가의 평균 점수 계산
    const allScores = item.assessments.map(calculateAssessmentScores)
    const avgScores = allScores.reduce(
      (acc, scores) => ({
        concentration: acc.concentration + scores.concentration,
        motivation: acc.motivation + scores.motivation,
        success: acc.success + scores.success,
        constraints: acc.constraints + scores.constraints,
        social: acc.social + scores.social
      }),
      { concentration: 0, motivation: 0, success: 0, constraints: 0, social: 0 }
    )

    const count = allScores.length
    const finalScores = {
      concentration: Math.round((avgScores.concentration / count) * 10) / 10,
      motivation: Math.round((avgScores.motivation / count) * 10) / 10,
      success: Math.round((avgScores.success / count) * 10) / 10,
      constraints: Math.round((avgScores.constraints / count) * 10) / 10,
      social: Math.round((avgScores.social / count) * 10) / 10
    }

    const overall = Math.round(
      ((finalScores.concentration + finalScores.motivation + finalScores.success + 
        finalScores.constraints + finalScores.social) / 5) * 10
    ) / 10

    return {
      name: item.name,
      ...finalScores,
      overall,
      patientCount: count
    }
  })
}

// 차원별 색상
const dimensionColors = {
  concentration: '#3B82F6',
  motivation: '#10B981', 
  success: '#F59E0B',
  constraints: '#EF4444',
  social: '#8B5CF6'
}

const AssessmentComparisonChart: React.FC<AssessmentComparisonChartProps> = ({
  comparisonItems,
  height = 400,
  className = '',
  chartType = 'grouped',
  showAverage = true
}) => {
  // 데이터 변환
  const comparisonData = useMemo(() => transformToComparisonData(comparisonItems), [comparisonItems])
  
  // 전체 평균 계산
  const overallAverage = useMemo(() => {
    if (comparisonData.length === 0) return 0
    const totalOverall = comparisonData.reduce((sum, data) => sum + data.overall, 0)
    return Math.round((totalOverall / comparisonData.length) * 10) / 10
  }, [comparisonData])

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload as ComparisonData
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <h4 className="font-semibold text-gray-900 mb-2">{label}</h4>
          <div className="text-xs text-gray-600 mb-3">
            평가 데이터: {data.patientCount}개
          </div>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-600">{entry.name}:</span>
                </div>
                <span className="font-medium text-gray-900">
                  {entry.value.toFixed(1)}/5.0
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">전체 평균:</span>
              <span className="font-bold text-gray-900">
                {data.overall.toFixed(1)}/5.0
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (comparisonData.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="text-center py-8 text-gray-500">
          비교할 데이터가 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          평가 점수 비교
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {comparisonItems.length}개 그룹의 평가 점수를 비교합니다.
          </p>
          {showAverage && (
            <div className="text-sm">
              <span className="text-gray-600">전체 평균: </span>
              <span className="font-semibold text-gray-900">
                {overallAverage.toFixed(1)}/5.0
              </span>
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#D1D5DB' }}
          />
          <YAxis 
            domain={[0, 5]}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#D1D5DB' }}
          />
          
          {/* 평균 기준선 */}
          {showAverage && (
            <ReferenceLine 
              y={overallAverage} 
              stroke="#6B7280" 
              strokeDasharray="4 4"
              label={{ value: `평균 ${overallAverage.toFixed(1)}`, position: 'insideTopRight' }}
            />
          )}
          
          {/* 목표 기준선 */}
          <ReferenceLine y={3} stroke="#10B981" strokeDasharray="2 2" />
          
          {/* 각 차원별 바 */}
          <Bar dataKey="concentration" name="집중력" fill={dimensionColors.concentration} />
          <Bar dataKey="motivation" name="동기 수준" fill={dimensionColors.motivation} />
          <Bar dataKey="success" name="성공 경험" fill={dimensionColors.success} />
          <Bar dataKey="constraints" name="제약 관리" fill={dimensionColors.constraints} />
          <Bar dataKey="social" name="사회적 적응" fill={dimensionColors.social} />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* 순위표 */}
      <div className="mt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">종합 점수 순위</h4>
        <div className="space-y-2">
          {[...comparisonData]
            .sort((a, b) => b.overall - a.overall)
            .map((data, index) => (
              <div key={data.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-orange-500' : 
                    'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{data.name}</span>
                  <span className="text-sm text-gray-600">
                    ({data.patientCount}개 평가)
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    {data.overall.toFixed(1)}/5.0
                  </div>
                  <div className={`text-xs ${
                    data.overall >= overallAverage ? 'text-green-600' : 'text-red-600'
                  }`}>
                    평균 {data.overall >= overallAverage ? '+' : ''}{(data.overall - overallAverage).toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default AssessmentComparisonChart 