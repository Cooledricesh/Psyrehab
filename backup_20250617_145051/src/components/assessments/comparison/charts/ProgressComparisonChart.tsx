import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ProgressData {
  date: string
  patientId: string
  patientName: string
  concentration: number
  motivation: number
  success: number
  constraints: number
  social: number
  overall: number
}

interface ProgressComparisonChartProps {
  data: ProgressData[]
  patients: Array<{ id: string; name: string; color: string }>
  title?: string
  size?: 'small' | 'medium' | 'large'
  dimension?: 'overall' | 'concentration' | 'motivation' | 'success' | 'constraints' | 'social'
  showTarget?: boolean
  targetValue?: number
}

export const ProgressComparisonChart: React.FC<ProgressComparisonChartProps> = ({
  data,
  patients,
  title = '진전도 비교',
  size = 'medium',
  dimension = 'overall',
  showTarget = true,
  targetValue = 3.0
}) => {
  const dimensions = {
    small: { width: 400, height: 250 },
    medium: { width: 600, height: 350 },
    large: { width: 800, height: 450 }
  }

  const { width, height } = dimensions[size]

  // 데이터 정렬 및 그룹화
  const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // 날짜별로 그룹화하여 차트 데이터 생성
  const chartData = sortedData.reduce((acc, item) => {
    const existingDate = acc.find(d => d.date === item.date)
    if (existingDate) {
      existingDate[`${item.patientId}_${dimension}`] = item[dimension]
    } else {
      const newEntry: any = { date: item.date }
      newEntry[`${item.patientId}_${dimension}`] = item[dimension]
      acc.push(newEntry)
    }
    return acc
  }, [] as any[])

  // 각 환자별 최신 진전도 계산
  const getLatestProgress = () => {
    return patients.map(patient => {
      const patientData = sortedData.filter(d => d.patientId === patient.id)
      if (patientData.length < 2) return { ...patient, trend: 'stable', change: 0 }

      const latest = patientData[patientData.length - 1][dimension]
      const previous = patientData[patientData.length - 2][dimension]
      const change = ((latest - previous) / previous) * 100

      let trend: 'improving' | 'declining' | 'stable' = 'stable'
      if (change > 5) trend = 'improving'
      else if (change < -5) trend = 'declining'

      return { ...patient, trend, change, latest, previous }
    })
  }

  const progressSummary = getLatestProgress()

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">
            {format(new Date(label), 'yyyy년 MM월 dd일', { locale: ko })}
          </p>
          <div className="space-y-1 text-sm">
            {payload.map((entry: any, index: number) => {
              const patientId = entry.dataKey.split('_')[0]
              const patient = patients.find(p => p.id === patientId)
              if (!patient) return null

              return (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: patient.color }}
                    ></div>
                    <span className="text-gray-700">{patient.name}:</span>
                  </div>
                  <span className="font-medium">{entry.value?.toFixed(2)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    return null
  }

  // 영역명 한국어 변환
  const dimensionNames = {
    overall: '전체',
    concentration: '집중력',
    motivation: '동기수준',
    success: '성공경험',
    constraints: '제약관리',
    social: '사회적응'
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {title} - {dimensionNames[dimension]}
        </h3>
        <div className="flex items-center space-x-4 text-sm">
          {showTarget && (
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600">목표: {targetValue}</span>
            </div>
          )}
        </div>
      </div>

      {/* 차트 */}
      <div style={{ width, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => format(new Date(value), 'MM/dd', { locale: ko })}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={[0, 5]}
              tickFormatter={(value) => value.toFixed(1)}
            />
            
            {/* 목표 기준선 */}
            {showTarget && (
              <ReferenceLine 
                y={targetValue} 
                stroke="#3b82f6" 
                strokeDasharray="5 5"
                strokeOpacity={0.8}
                label={{ value: '목표', position: 'topRight' }}
              />
            )}
            
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* 각 환자별 라인 */}
            {patients.map((patient) => (
              <Line
                key={patient.id}
                type="monotone"
                dataKey={`${patient.id}_${dimension}`}
                stroke={patient.color}
                strokeWidth={2}
                dot={{ r: 4, fill: patient.color }}
                activeDot={{ r: 6, fill: patient.color }}
                name={patient.name}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 진전도 요약 */}
      <div className="mt-4 space-y-3">
        <h4 className="font-medium text-gray-900">최근 진전도 요약</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {progressSummary.map((patient) => {
            const trendIcon = patient.trend === 'improving' ? TrendingUp : 
                            patient.trend === 'declining' ? TrendingDown : Minus
            const trendColor = patient.trend === 'improving' ? 'text-green-600' : 
                             patient.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
            const bgColor = patient.trend === 'improving' ? 'bg-green-50' : 
                           patient.trend === 'declining' ? 'bg-red-50' : 'bg-gray-50'

            const Icon = trendIcon

            return (
              <div key={patient.id} className={`p-3 rounded-lg ${bgColor}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: patient.color }}
                    ></div>
                    <span className="font-medium text-gray-900">{patient.name}</span>
                  </div>
                  <Icon className={`h-4 w-4 ${trendColor}`} />
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">현재 점수:</span>
                    <span className="font-medium">{patient.latest?.toFixed(2) || 'N/A'}</span>
                  </div>
                  {patient.change !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">변화율:</span>
                      <span className={`font-medium ${trendColor}`}>
                        {patient.change > 0 ? '+' : ''}{patient.change.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 개선 권장사항 */}
      {progressSummary.some(p => p.trend === 'declining') && (
        <div className="mt-4 bg-orange-50 p-3 rounded-lg">
          <h4 className="font-medium text-orange-900 mb-2">개선 권장사항</h4>
          <div className="text-sm text-orange-700 space-y-1">
            {progressSummary
              .filter(p => p.trend === 'declining')
              .map(patient => (
                <div key={patient.id}>
                  • <strong>{patient.name}</strong>: {dimensionNames[dimension]} 영역에서 
                  {Math.abs(patient.change).toFixed(1)}% 저하가 관찰되었습니다. 
                  개별 상담 및 맞춤형 개선 프로그램을 고려해보세요.
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* 성과 인정 */}
      {progressSummary.some(p => p.trend === 'improving' && p.change > 10) && (
        <div className="mt-4 bg-green-50 p-3 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">우수한 진전</h4>
          <div className="text-sm text-green-700 space-y-1">
            {progressSummary
              .filter(p => p.trend === 'improving' && p.change > 10)
              .map(patient => (
                <div key={patient.id}>
                  🎉 <strong>{patient.name}</strong>: {dimensionNames[dimension]} 영역에서 
                  {patient.change.toFixed(1)}% 개선을 보였습니다. 훌륭한 성과입니다!
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
} 