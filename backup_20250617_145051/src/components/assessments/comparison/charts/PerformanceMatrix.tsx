import React from 'react'
import { User, Target, TrendingUp, TrendingDown, Award } from 'lucide-react'

interface PerformanceData {
  patientId: string
  patientName: string
  concentration: number
  motivation: number
  success: number
  constraints: number
  social: number
  overall: number
  rank?: number
  improvement?: number
}

interface PerformanceMatrixProps {
  data: PerformanceData[]
  title?: string
  size?: 'small' | 'medium' | 'large'
  showRanks?: boolean
  showImprovement?: boolean
  colorScheme?: 'default' | 'heatmap' | 'performance'
}

export const PerformanceMatrix: React.FC<PerformanceMatrixProps> = ({
  data,
  title = '성과 매트릭스',
  size = 'medium',
  showRanks = true,
  showImprovement = true,
  colorScheme = 'heatmap'
}) => {
  const dimensions = {
    small: { cellSize: 60, fontSize: 'text-xs' },
    medium: { cellSize: 80, fontSize: 'text-sm' },
    large: { cellSize: 100, fontSize: 'text-base' }
  }

  const { cellSize, fontSize } = dimensions[size]

  // 영역명 정의
  const dimensionNames = [
    { key: 'concentration', name: '집중력', icon: '🧠' },
    { key: 'motivation', name: '동기수준', icon: '💪' },
    { key: 'success', name: '성공경험', icon: '🏆' },
    { key: 'constraints', name: '제약관리', icon: '🎯' },
    { key: 'social', name: '사회적응', icon: '👥' },
    { key: 'overall', name: '전체', icon: '📊' }
  ]

  // 점수에 따른 색상 및 스타일 결정
  const getScoreStyle = (score: number) => {
    if (colorScheme === 'heatmap') {
      // 히트맵 스타일 (빨간색 -> 노란색 -> 녹색)
      if (score >= 4.0) return { bg: 'bg-green-500', text: 'text-white', intensity: 'high' }
      else if (score >= 3.5) return { bg: 'bg-green-400', text: 'text-white', intensity: 'high' }
      else if (score >= 3.0) return { bg: 'bg-yellow-400', text: 'text-gray-900', intensity: 'medium' }
      else if (score >= 2.5) return { bg: 'bg-orange-400', text: 'text-white', intensity: 'medium' }
      else if (score >= 2.0) return { bg: 'bg-red-400', text: 'text-white', intensity: 'low' }
      else return { bg: 'bg-red-600', text: 'text-white', intensity: 'low' }
    } else if (colorScheme === 'performance') {
      // 성과 기반 스타일
      if (score >= 4.0) return { bg: 'bg-emerald-500', text: 'text-white', intensity: 'excellent' }
      else if (score >= 3.0) return { bg: 'bg-blue-500', text: 'text-white', intensity: 'good' }
      else if (score >= 2.0) return { bg: 'bg-amber-500', text: 'text-white', intensity: 'fair' }
      else return { bg: 'bg-gray-500', text: 'text-white', intensity: 'poor' }
    } else {
      // 기본 스타일
      if (score >= 4.0) return { bg: 'bg-blue-500', text: 'text-white', intensity: 'high' }
      else if (score >= 3.0) return { bg: 'bg-blue-400', text: 'text-white', intensity: 'medium' }
      else if (score >= 2.0) return { bg: 'bg-blue-300', text: 'text-gray-900', intensity: 'low' }
      else return { bg: 'bg-gray-300', text: 'text-gray-900', intensity: 'very-low' }
    }
  }

  // 개선 지표 스타일
  const getImprovementStyle = (improvement: number) => {
    if (improvement > 10) return { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' }
    else if (improvement > 0) return { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' }
    else if (improvement > -10) return { icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-50' }
    else return { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' }
  }

  // 순위 아이콘
  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    else if (rank === 2) return '🥈'
    else if (rank === 3) return '🥉'
    else return `#${rank}`
  }

  // 통계 계산
  const stats = {
    totalPatients: data.length,
    averageOverall: data.reduce((sum, p) => sum + p.overall, 0) / data.length,
    topPerformer: data.reduce((max, p) => p.overall > max.overall ? p : max, data[0]),
    dimensionAverages: dimensionNames.slice(0, 5).reduce((acc, dim) => {
      acc[dim.key] = data.reduce((sum, p) => sum + (p as any)[dim.key], 0) / data.length
      return acc
    }, {} as { [key: string]: number })
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-gray-600">{stats.totalPatients}명</span>
          </div>
          <div className="flex items-center space-x-1">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-gray-600">평균: {stats.averageOverall.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-700">점수 범위:</span>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>우수 (4.0+)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span>좋음 (3.0+)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-orange-400 rounded"></div>
                <span>보통 (2.0+)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>개선필요 (&lt;2.0)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 매트릭스 헤더 */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* 헤더 행 */}
          <div className="flex">
            <div 
              className="flex items-center justify-center font-medium text-gray-900 border-r border-gray-200 bg-gray-50"
              style={{ width: cellSize * 1.5, height: cellSize * 0.8 }}
            >
              환자명
            </div>
            {dimensionNames.map((dim) => (
              <div 
                key={dim.key}
                className="flex flex-col items-center justify-center border-r border-gray-200 bg-gray-50 p-1"
                style={{ width: cellSize, height: cellSize * 0.8 }}
              >
                <div className={`text-lg mb-1`}>{dim.icon}</div>
                <div className={`${fontSize} font-medium text-center text-gray-900`}>
                  {dim.name}
                </div>
              </div>
            ))}
            {showRanks && (
              <div 
                className="flex items-center justify-center font-medium text-gray-900 border-r border-gray-200 bg-gray-50"
                style={{ width: cellSize * 0.8, height: cellSize * 0.8 }}
              >
                순위
              </div>
            )}
            {showImprovement && (
              <div 
                className="flex items-center justify-center font-medium text-gray-900 bg-gray-50"
                style={{ width: cellSize * 0.8, height: cellSize * 0.8 }}
              >
                개선
              </div>
            )}
          </div>

          {/* 데이터 행들 */}
          {data.map((patient, index) => (
            <div key={patient.patientId} className="flex border-t border-gray-200">
              {/* 환자명 */}
              <div 
                className="flex items-center px-3 font-medium text-gray-900 border-r border-gray-200 bg-gray-50"
                style={{ width: cellSize * 1.5, height: cellSize }}
              >
                <div className="truncate">{patient.patientName}</div>
              </div>

              {/* 각 영역별 점수 */}
              {dimensionNames.map((dim) => {
                const score = (patient as any)[dim.key]
                const style = getScoreStyle(score)
                
                return (
                  <div 
                    key={dim.key}
                    className={`flex flex-col items-center justify-center border-r border-gray-200 ${style.bg} ${style.text} transition-all hover:scale-105`}
                    style={{ width: cellSize, height: cellSize }}
                    title={`${dim.name}: ${score.toFixed(2)}`}
                  >
                    <div className={`${fontSize} font-bold`}>
                      {score.toFixed(1)}
                    </div>
                    <div className="text-xs opacity-80">
                      {score >= 4.0 ? '우수' : score >= 3.0 ? '좋음' : score >= 2.0 ? '보통' : '개선'}
                    </div>
                  </div>
                )
              })}

              {/* 순위 */}
              {showRanks && patient.rank && (
                <div 
                  className="flex items-center justify-center border-r border-gray-200 bg-white"
                  style={{ width: cellSize * 0.8, height: cellSize }}
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">{getRankIcon(patient.rank)}</div>
                    <div className={`${fontSize} text-gray-600`}>
                      {patient.rank}위
                    </div>
                  </div>
                </div>
              )}

              {/* 개선 지표 */}
              {showImprovement && patient.improvement !== undefined && (
                <div 
                  className="flex items-center justify-center bg-white"
                  style={{ width: cellSize * 0.8, height: cellSize }}
                >
                  {(() => {
                    const improvementStyle = getImprovementStyle(patient.improvement)
                    const Icon = improvementStyle.icon
                    return (
                      <div className={`text-center p-2 rounded ${improvementStyle.bg}`}>
                        <Icon className={`h-4 w-4 mx-auto mb-1 ${improvementStyle.color}`} />
                        <div className={`${fontSize} ${improvementStyle.color} font-medium`}>
                          {patient.improvement > 0 ? '+' : ''}{patient.improvement.toFixed(1)}%
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 전체 평균 */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">전체 평균</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.averageOverall.toFixed(2)}
          </div>
        </div>

        {/* 최고 성과자 */}
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-900">최고 성과</span>
          </div>
          <div className="text-sm text-green-700">
            {stats.topPerformer.patientName}
          </div>
          <div className="text-xl font-bold text-green-600">
            {stats.topPerformer.overall.toFixed(2)}
          </div>
        </div>

        {/* 강점 영역 */}
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-purple-900">강점 영역</span>
          </div>
          {(() => {
            const bestDimension = Object.entries(stats.dimensionAverages)
              .reduce((max, [key, value]) => value > max.value ? { key, value } : max, 
                      { key: '', value: 0 })
            const dimensionName = dimensionNames.find(d => d.key === bestDimension.key)
            
            return (
              <div>
                <div className="text-sm text-purple-700">
                  {dimensionName?.name}
                </div>
                <div className="text-xl font-bold text-purple-600">
                  {bestDimension.value.toFixed(2)}
                </div>
              </div>
            )
          })()}
        </div>

        {/* 개선 필요 영역 */}
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-orange-900">개선 필요</span>
          </div>
          {(() => {
            const worstDimension = Object.entries(stats.dimensionAverages)
              .reduce((min, [key, value]) => value < min.value ? { key, value } : min, 
                      { key: '', value: 5 })
            const dimensionName = dimensionNames.find(d => d.key === worstDimension.key)
            
            return (
              <div>
                <div className="text-sm text-orange-700">
                  {dimensionName?.name}
                </div>
                <div className="text-xl font-bold text-orange-600">
                  {worstDimension.value.toFixed(2)}
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* 인사이트 */}
      <div className="mt-4 bg-gray-50 p-3 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">주요 인사이트</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div>
            • 전체 {stats.totalPatients}명 중 {data.filter(p => p.overall >= 4.0).length}명이 우수 등급(4.0 이상)을 달성했습니다.
          </div>
          <div>
            • 가장 강한 영역은 {Object.entries(stats.dimensionAverages)
              .reduce((max, [key, value]) => value > max.value ? { key, value } : max, { key: '', value: 0 })
              .key}이며, 평균 점수는 {Object.values(stats.dimensionAverages)
              .reduce((max, value) => value > max ? value : max, 0).toFixed(2)}입니다.
          </div>
          {showImprovement && data.some(p => p.improvement && p.improvement > 0) && (
            <div>
              • {data.filter(p => p.improvement && p.improvement > 0).length}명의 환자가 긍정적인 개선을 보이고 있습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 