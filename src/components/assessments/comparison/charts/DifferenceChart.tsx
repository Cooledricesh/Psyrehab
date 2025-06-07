import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatChangeIndicator } from '../utils/comparisonUtils'

interface DifferenceData {
  dimension: string
  current: number
  previous: number
  difference: number
  changeRate: number
}

interface DifferenceChartProps {
  data: DifferenceData[]
  title?: string
  size?: 'small' | 'medium' | 'large'
  showChangeRate?: boolean
  showSignificanceThreshold?: boolean
  significanceThreshold?: number
}

export const DifferenceChart: React.FC<DifferenceChartProps> = ({
  data,
  title = '차이점 분석',
  size = 'medium',
  showChangeRate = true,
  showSignificanceThreshold = true,
  significanceThreshold = 0.5
}) => {
  const dimensions = {
    small: { width: 300, height: 200 },
    medium: { width: 400, height: 250 },
    large: { width: 500, height: 300 }
  }

  const { width, height } = dimensions[size]

  // 차이값 기준으로 색상 결정
  const getBarColor = (difference: number): string => {
    if (Math.abs(difference) < (significanceThreshold || 0.3)) return '#94a3b8' // 중립 (회색)
    return difference > 0 ? '#10b981' : '#ef4444' // 개선 (녹색) / 저하 (빨간색)
  }

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const changeIndicator = formatChangeIndicator(data.changeRate)

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">현재:</span>
              <span className="font-medium">{data.current.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">이전:</span>
              <span className="font-medium">{data.previous.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">차이:</span>
              <span className={`font-medium ${data.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.difference > 0 ? '+' : ''}{data.difference.toFixed(2)}
              </span>
            </div>
            {showChangeRate && (
              <div className="flex justify-between">
                <span className="text-gray-600">변화율:</span>
                <span className={`font-medium ${changeIndicator.color}`}>
                  {changeIndicator.icon} {data.changeRate.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // 통계 요약
  const significantChanges = data.filter(d => Math.abs(d.difference) >= (significanceThreshold || 0.3))
  const improvements = data.filter(d => d.difference > 0)
  const declines = data.filter(d => d.difference < 0)

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-gray-600">개선 {improvements.length}개</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-gray-600">저하 {declines.length}개</span>
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div style={{ width, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="dimension" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const translations: { [key: string]: string } = {
                  concentration: '집중력',
                  motivation: '동기수준',
                  success: '성공경험',
                  constraints: '제약관리',
                  social: '사회적응'
                }
                return translations[value] || value
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
            />
            
            {showSignificanceThreshold && (
              <>
                <ReferenceLine 
                  y={significanceThreshold} 
                  stroke="#10b981" 
                  strokeDasharray="5 5"
                  strokeOpacity={0.6}
                />
                <ReferenceLine 
                  y={-significanceThreshold} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  strokeOpacity={0.6}
                />
                <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1} />
              </>
            )}
            
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="difference" radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.difference)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 및 해석 */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>개선</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>저하</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span>미미한 변화</span>
            </div>
          </div>
          
          {showSignificanceThreshold && (
            <div className="text-gray-500">
              유의 임계값: ±{significanceThreshold}
            </div>
          )}
        </div>

        {significantChanges.length > 0 && (
          <div className="bg-gray-50 p-3 rounded text-sm">
            <h4 className="font-medium text-gray-900 mb-2">주요 변화 ({significantChanges.length}개 영역)</h4>
            <div className="space-y-1">
              {significantChanges.map((change) => {
                const indicator = formatChangeIndicator(change.changeRate)
                const dimensionName = {
                  concentration: '집중력',
                  motivation: '동기수준',
                  success: '성공경험',
                  constraints: '제약관리',
                  social: '사회적응'
                }[change.dimension] || change.dimension

                return (
                  <div key={change.dimension} className="flex justify-between items-center">
                    <span className="text-gray-700">{dimensionName}:</span>
                    <span className={`font-medium ${indicator.color}`}>
                      {indicator.icon} {change.changeRate.toFixed(1)}% ({change.difference > 0 ? '+' : ''}{change.difference.toFixed(2)})
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {declines.length > 0 && (
          <div className="bg-orange-50 p-3 rounded text-sm">
            <h4 className="font-medium text-orange-900 mb-1">개선 권장 영역</h4>
            <p className="text-orange-700">
              {declines.map(d => {
                const name = {
                  concentration: '집중력',
                  motivation: '동기수준', 
                  success: '성공경험',
                  constraints: '제약관리',
                  social: '사회적응'
                }[d.dimension] || d.dimension
                return name
              }).join(', ')} 영역에서 점수가 하락했습니다. 집중적인 개선이 필요합니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 