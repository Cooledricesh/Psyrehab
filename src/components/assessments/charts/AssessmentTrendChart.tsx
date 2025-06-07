import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { AssessmentData } from '@/types/assessment'

interface TrendData {
  date: string
  dateFormatted: string
  concentration: number
  motivation: number
  success: number
  constraints: number
  social: number
  overall: number
}

interface AssessmentTrendChartProps {
  assessments: AssessmentData[]
  height?: number
  className?: string
  showOverall?: boolean // 전체 평균 라인 표시 여부
  selectedDimensions?: string[] // 표시할 차원들
}

// 평가 데이터를 추세 데이터로 변환
function transformToTrendData(assessments: AssessmentData[]): TrendData[] {
  return assessments
    .map(assessment => {
      // 각 영역별 점수 계산 (AssessmentScoreChart와 동일한 로직)
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

      // 전체 평균 점수
      const overallScore = (concentrationScore + motivationScore + successScore + constraintsScore + socialScore) / 5

      return {
        date: assessment.created_at,
        dateFormatted: format(parseISO(assessment.created_at), 'MM/dd', { locale: ko }),
        concentration: Math.round(concentrationScore * 10) / 10,
        motivation: Math.round(motivationScore * 10) / 10,
        success: Math.round(successScore * 10) / 10,
        constraints: Math.round(constraintsScore * 10) / 10,
        social: Math.round(socialScore * 10) / 10,
        overall: Math.round(overallScore * 10) / 10
      }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// 차원별 색상 및 설정
const dimensionConfig = {
  concentration: { color: '#3B82F6', name: '집중력', strokeWidth: 2 },
  motivation: { color: '#10B981', name: '동기 수준', strokeWidth: 2 },
  success: { color: '#F59E0B', name: '성공 경험', strokeWidth: 2 },
  constraints: { color: '#EF4444', name: '제약 관리', strokeWidth: 2 },
  social: { color: '#8B5CF6', name: '사회적 적응', strokeWidth: 2 },
  overall: { color: '#374151', name: '전체 평균', strokeWidth: 3, strokeDasharray: '5 5' }
}

const AssessmentTrendChart: React.FC<AssessmentTrendChartProps> = ({
  assessments,
  height = 400,
  className = '',
  showOverall = true,
  selectedDimensions = ['concentration', 'motivation', 'success', 'constraints', 'social']
}) => {
  // 데이터 변환
  const trendData = useMemo(() => transformToTrendData(assessments), [assessments])

  // 최근 개선도 계산
  const improvementInfo = useMemo(() => {
    if (trendData.length < 2) return null
    
    const latest = trendData[trendData.length - 1]
    const previous = trendData[trendData.length - 2]
    
    const overallChange = latest.overall - previous.overall
    const isImproving = overallChange > 0
    
    return {
      change: Math.round(overallChange * 10) / 10,
      isImproving,
      percentChange: Math.round((overallChange / previous.overall) * 100)
    }
  }, [trendData])

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload as TrendData
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <h4 className="font-semibold text-gray-900 mb-3">
            {format(parseISO(data.date), 'yyyy년 MM월 dd일', { locale: ko })}
          </h4>
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
        </div>
      )
    }
    return null
  }

  if (trendData.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="text-center py-8 text-gray-500">
          추세를 표시할 평가 데이터가 충분하지 않습니다.
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            평가 점수 추세
          </h3>
          {improvementInfo && (
            <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
              improvementInfo.isImproving 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <span className={improvementInfo.isImproving ? '↗️' : '↘️'}>
                {improvementInfo.isImproving ? '↗️' : '↘️'}
              </span>
              <span className="font-medium">
                {improvementInfo.change > 0 ? '+' : ''}{improvementInfo.change}
              </span>
              <span className="text-xs">
                ({improvementInfo.percentChange > 0 ? '+' : ''}{improvementInfo.percentChange}%)
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600">
          시간에 따른 각 영역별 점수 변화를 확인할 수 있습니다.
        </p>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="dateFormatted" 
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#D1D5DB' }}
          />
          <YAxis 
            domain={[0, 5]}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#D1D5DB' }}
          />
          
          {/* 목표 기준선 */}
          <ReferenceLine y={3} stroke="#9CA3AF" strokeDasharray="2 2" />
          
          {/* 각 차원별 라인 */}
          {selectedDimensions.map(dimension => {
            const config = dimensionConfig[dimension as keyof typeof dimensionConfig]
            return (
              <Line
                key={dimension}
                type="monotone"
                dataKey={dimension}
                stroke={config.color}
                strokeWidth={config.strokeWidth}
                strokeDasharray={config.strokeDasharray}
                name={config.name}
                dot={{ r: 3, strokeWidth: 1 }}
                activeDot={{ r: 5, strokeWidth: 1 }}
              />
            )
          })}
          
          {/* 전체 평균 라인 */}
          {showOverall && (
            <Line
              type="monotone"
              dataKey="overall"
              stroke={dimensionConfig.overall.color}
              strokeWidth={dimensionConfig.overall.strokeWidth}
              strokeDasharray={dimensionConfig.overall.strokeDasharray}
              name={dimensionConfig.overall.name}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          )}
          
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 통계 정보 */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-blue-600 font-medium">평가 횟수</div>
          <div className="text-xl font-bold text-blue-900">{trendData.length}회</div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-green-600 font-medium">최고 점수</div>
          <div className="text-xl font-bold text-green-900">
            {Math.max(...trendData.map(d => d.overall)).toFixed(1)}
          </div>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-yellow-600 font-medium">평균 점수</div>
          <div className="text-xl font-bold text-yellow-900">
            {(trendData.reduce((sum, d) => sum + d.overall, 0) / trendData.length).toFixed(1)}
          </div>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-purple-600 font-medium">최근 점수</div>
          <div className="text-xl font-bold text-purple-900">
            {trendData[trendData.length - 1]?.overall.toFixed(1) || '0.0'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssessmentTrendChart 