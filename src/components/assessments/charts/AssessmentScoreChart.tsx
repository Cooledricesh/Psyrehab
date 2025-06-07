import React from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'
import { AssessmentData } from '@/types/assessment'

interface AssessmentScoreChartProps {
  assessment: AssessmentData
  showComparison?: AssessmentData // 비교 평가 데이터
  height?: number
  className?: string
}

interface ScoreData {
  dimension: string
  score: number
  comparison?: number
  maxScore: number
}

// 평가 데이터를 차트용 점수로 변환
function transformAssessmentToScores(assessment: AssessmentData): ScoreData[] {
  // 집중 시간 점수 (1-5 스케일로 정규화)
  const concentrationScore = Math.min(5, Math.max(1, assessment.concentration_time.duration / 60)) // 60분 기준으로 정규화

  // 동기 수준 점수 (평균)
  const motivationScore = (
    (assessment.motivation_level.goal_clarity || 0) +
    (assessment.motivation_level.effort_willingness || 0) +
    (assessment.motivation_level.confidence_level || 0) +
    (assessment.motivation_level.external_support || 0)
  ) / 4

  // 과거 성공 경험 점수 (성취 분야 개수와 기타 요소 기반)
  const successScore = Math.min(5, Math.max(1, 
    (assessment.past_successes.achievement_areas?.length || 0) * 0.5 +
    (assessment.past_successes.most_significant_achievement ? 2 : 0) +
    (assessment.past_successes.learning_from_success ? 1 : 0) +
    (assessment.past_successes.transferable_strategies ? 1 : 0)
  ))

  // 제약 조건 점수 (5 - 심각도로 변환, 낮은 제약이 높은 점수)
  const constraintsScore = 6 - (assessment.constraints.severity_rating || 3)

  // 사회적 선호도 점수 (평균)
  const socialScore = (
    (assessment.social_preference.comfort_with_strangers || 0) +
    (assessment.social_preference.collaboration_willingness || 0)
  ) / 2

  return [
    {
      dimension: '집중력',
      score: Math.round(concentrationScore * 10) / 10,
      maxScore: 5
    },
    {
      dimension: '동기 수준',
      score: Math.round(motivationScore * 10) / 10,
      maxScore: 5
    },
    {
      dimension: '성공 경험',
      score: Math.round(successScore * 10) / 10,
      maxScore: 5
    },
    {
      dimension: '제약 관리',
      score: Math.round(constraintsScore * 10) / 10,
      maxScore: 5
    },
    {
      dimension: '사회적 적응',
      score: Math.round(socialScore * 10) / 10,
      maxScore: 5
    }
  ]
}

// 비교 데이터 추가
function addComparisonData(
  currentScores: ScoreData[], 
  comparisonAssessment: AssessmentData
): ScoreData[] {
  const comparisonScores = transformAssessmentToScores(comparisonAssessment)
  
  return currentScores.map((score, index) => ({
    ...score,
    comparison: comparisonScores[index]?.score
  }))
}

const AssessmentScoreChart: React.FC<AssessmentScoreChartProps> = ({
  assessment,
  showComparison,
  height = 400,
  className = ''
}) => {
  // 데이터 변환
  let chartData = transformAssessmentToScores(assessment)
  
  if (showComparison) {
    chartData = addComparisonData(chartData, showComparison)
  }

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <h4 className="font-semibold text-gray-900 mb-2">{label}</h4>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">
                {entry.dataKey === 'score' ? '현재' : '이전'}: 
              </span>
              <span className="font-medium text-gray-900">
                {entry.value.toFixed(1)}/5.0
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          평가 영역별 점수
        </h3>
        <p className="text-sm text-gray-600">
          각 영역별 점수를 시각적으로 확인할 수 있습니다. (5점 만점)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={chartData}>
          <PolarGrid gridType="polygon" />
          <PolarAngleAxis 
            dataKey="dimension" 
            tick={{ fontSize: 12, fill: '#374151' }}
            className="text-sm"
          />
          <PolarRadiusAxis 
            angle={0} 
            domain={[0, 5]} 
            tick={{ fontSize: 10, fill: '#6B7280' }}
            tickCount={6}
          />
          
          {/* 현재 점수 */}
          <Radar
            name="현재 점수"
            dataKey="score"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.1}
            strokeWidth={2}
            dot={{ fill: '#3B82F6', strokeWidth: 1, r: 4 }}
          />
          
          {/* 비교 점수 (있는 경우) */}
          {showComparison && (
            <Radar
              name="이전 점수"
              dataKey="comparison"
              stroke="#EF4444"
              fill="#EF4444"
              fillOpacity={0.05}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#EF4444', strokeWidth: 1, r: 3 }}
            />
          )}
          
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* 점수 범례 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="font-medium text-gray-700">우수:</span>
            <span className="text-green-600 ml-1">4.0 - 5.0</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">양호:</span>
            <span className="text-blue-600 ml-1">3.0 - 3.9</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">보통:</span>
            <span className="text-yellow-600 ml-1">2.0 - 2.9</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">개선필요:</span>
            <span className="text-orange-600 ml-1">1.0 - 1.9</span>
          </div>
          <div className="md:col-span-2">
            <span className="font-medium text-gray-700">주의:</span>
            <span className="text-red-600 ml-1">1.0 미만</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssessmentScoreChart 