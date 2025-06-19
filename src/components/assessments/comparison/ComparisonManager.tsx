import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Users,
  BarChart3,
  Settings,
  Download,
  Filter,
  RefreshCw,
  Compare,
  TrendingUp
} from 'lucide-react'
import { AssessmentData } from '@/types/assessment'
import { DifferenceChart } from './charts/DifferenceChart'
import { PerformanceMatrix } from './charts/PerformanceMatrix'
import { ComparisonSummary } from './charts/ComparisonSummary'
import { ComparisonSettings } from './ComparisonSettings'
import { ComparisonFilters } from './ComparisonFilters'
import { ComparisonExport } from './ComparisonExport'
import {
  compareTimeRanges,
  comparePatients,
  analyzeProgress,
  type TimeComparison,
  type PatientComparison,
  type ProgressAnalysis
} from './utils/comparisonAlgorithms'
import {
  createTimeRanges,
  applyComparisonFilters,
  groupAssessments,
  type ComparisonPeriod,
  type ComparisonFilters as FiltersType,
  type GroupOptions
} from './utils/comparisonUtils'

export type ComparisonMode = 'time' | 'patient' | 'group' | 'progress'
export type ViewMode = 'overview' | 'detailed' | 'charts' | 'summary'

interface ComparisonManagerProps {
  assessments: AssessmentData[]
  patients?: Array<{ id: string; name: string }>
  onDataChange?: (data: unknown) => void
  defaultMode?: ComparisonMode
  className?: string
}

export const ComparisonManager: React.FC<ComparisonManagerProps> = ({
  assessments,
  patients = [],
  onDataChange,
  defaultMode = 'time',
  className = ''
}) => {
  // 상태 관리
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>(defaultMode)
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [showSettings, setShowSettings] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 비교 설정
  const [settings, setSettings] = useState({
    period: 'month' as ComparisonPeriod,
    selectedPatients: [] as string[],
    selectedDimensions: ['concentration', 'motivation', 'success', 'constraints', 'social'],
    timeRange: createTimeRanges('month'),
    showStatistics: true,
    showTrends: true,
    confidenceLevel: 0.95
  })

  // 필터 설정
  const [filters, setFilters] = useState<FiltersType>({
    dateRange: undefined,
    patientIds: [],
    minAssessments: 1,
    excludeOutliers: false
  })

  // 비교 결과 데이터
  const [comparisonResults, setComparisonResults] = useState<{
    timeComparison?: TimeComparison
    patientComparison?: PatientComparison[]
    progressAnalysis?: ProgressAnalysis[]
    summaryData?: unknown[]
  }>({})

  // 데이터 처리 및 비교 실행
  const executeComparison = async () => {
    setIsLoading(true)
    
    try {
      // 필터 적용
      const filteredAssessments = applyComparisonFilters(assessments, filters)
      
      switch (comparisonMode) {
        case 'time': {
          // 시간 기간별 비교
          const { current, previous } = settings.timeRange
          const currentData = filteredAssessments.filter(a => {
            const date = new Date(a.created_at)
            return date >= current.start && date <= current.end
          })
          const previousData = filteredAssessments.filter(a => {
            const date = new Date(a.created_at)
            return date >= previous.start && date <= previous.end
          })

          if (currentData.length > 0 && previousData.length > 0) {
            const timeComparison = compareTimeRanges(currentData, previousData)
            setComparisonResults({ timeComparison })
          }
          break
        }

        case 'patient': {
          // 환자간 비교
          const patientGroups = patients
            .filter(p => settings.selectedPatients.length === 0 || settings.selectedPatients.includes(p.id))
            .map(patient => ({
              patientId: patient.id,
              patientName: patient.name,
              assessments: filteredAssessments.filter(a => a.patient_id === patient.id)
            }))
            .filter(group => group.assessments.length >= (filters.minAssessments || 1))

          if (patientGroups.length > 1) {
            const patientComparison = comparePatients(patientGroups)
            setComparisonResults({ patientComparison })
          }
          break
        }

        case 'progress': {
          // 진전도 분석
          const progressAnalysis = patients
            .filter(p => settings.selectedPatients.length === 0 || settings.selectedPatients.includes(p.id))
            .map(patient => {
              const patientAssessments = filteredAssessments.filter(a => a.patient_id === patient.id)
              if (patientAssessments.length < 2) return null

              return analyzeProgress(patientAssessments, patient.id)
            })
            .filter(Boolean) as ProgressAnalysis[]

          setComparisonResults({ progressAnalysis })
          break
        }

        case 'group': {
          // 그룹별 비교 (추가 구현 필요)
          // 여기서는 기본적인 환자 그룹화를 수행
          const groupOptions: GroupOptions = { by: 'score_range' }
          const groups = groupAssessments(filteredAssessments, groupOptions)
          
          const summaryData = Object.entries(groups).map(([groupName, groupAssessments]) => ({
            id: groupName,
            name: groupName,
            type: 'group' as const,
            scores: calculateGroupAverageScores(groupAssessments),
            metadata: {
              assessmentCount: groupAssessments.length,
              participantCount: new Set(groupAssessments.map(a => a.patient_id)).size
            }
          }))
          
          setComparisonResults({ summaryData })
          break
        }
      }

      // 결과를 상위 컴포넌트에 전달
      if (onDataChange) {
        onDataChange(comparisonResults)
      }

    } catch {
      console.error("Error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // 그룹 평균 점수 계산
  const calculateGroupAverageScores = (groupAssessments: AssessmentData[]) => {
    const totalCount = groupAssessments.length
    if (totalCount === 0) {
      return { concentration: 0, motivation: 0, success: 0, constraints: 0, social: 0, overall: 0 }
    }

    const sums = groupAssessments.reduce((acc, assessment) => {
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

      acc.concentration += concentrationScore
      acc.motivation += motivationScore
      acc.success += successScore
      acc.constraints += constraintsScore
      acc.social += socialScore
      acc.overall += (concentrationScore + motivationScore + successScore + constraintsScore + socialScore) / 5

      return acc
    }, { concentration: 0, motivation: 0, success: 0, constraints: 0, social: 0, overall: 0 })

    return {
      concentration: sums.concentration / totalCount,
      motivation: sums.motivation / totalCount,
      success: sums.success / totalCount,
      constraints: sums.constraints / totalCount,
      social: sums.social / totalCount,
      overall: sums.overall / totalCount
    }
  }

  // 설정 변경 시 자동 재실행
  useEffect(() => {
    if (assessments.length > 0) {
      executeComparison()
    }
  }, [comparisonMode, settings, filters, assessments])

  // 비교 모드별 아이콘
  const getModeIcon = (mode: ComparisonMode) => {
    switch (mode) {
      case 'time': return Calendar
      case 'patient': return Users
      case 'group': return BarChart3
      case 'progress': return TrendingUp
    }
  }

  // 비교 모드별 라벨
  const getModeLabel = (mode: ComparisonMode) => {
    switch (mode) {
      case 'time': return '시간 비교'
      case 'patient': return '환자 비교'
      case 'group': return '그룹 비교'
      case 'progress': return '진전도 분석'
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* 헤더 및 컨트롤 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          {/* 제목 및 모드 선택 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Compare className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">비교 분석</h2>
            </div>
            
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {(['time', 'patient', 'group', 'progress'] as ComparisonMode[]).map((mode) => {
                const Icon = getModeIcon(mode)
                const isActive = comparisonMode === mode
                
                return (
                  <button
                    key={mode}
                    onClick={() => setComparisonMode(mode)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{getModeLabel(mode)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                showFilters
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>필터</span>
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                showSettings
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>설정</span>
            </button>

            <button
              onClick={() => setShowExport(!showExport)}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>내보내기</span>
            </button>

            <button
              onClick={executeComparison}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
          </div>
        </div>

        {/* 뷰 모드 선택 */}
        <div className="mt-4 flex items-center space-x-1 bg-gray-50 rounded-lg p-1 w-fit">
          {(['overview', 'detailed', 'charts', 'summary'] as ViewMode[]).map((mode) => {
            const isActive = viewMode === mode
            const labels = {
              overview: '개요',
              detailed: '상세',
              charts: '차트',
              summary: '요약'
            }
            
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {labels[mode]}
              </button>
            )
          })}
        </div>
      </div>

      {/* 설정 및 필터 패널 */}
      <div className="border-b border-gray-200">
        {showSettings && (
          <div className="p-4 bg-gray-50">
            <ComparisonSettings
              settings={settings}
              onSettingsChange={setSettings}
              patients={patients}
              comparisonMode={comparisonMode}
            />
          </div>
        )}

        {showFilters && (
          <div className="p-4 bg-gray-50">
            <ComparisonFilters
              filters={filters}
              onFiltersChange={setFilters}
              patients={patients}
              assessments={assessments}
            />
          </div>
        )}

        {showExport && (
          <div className="p-4 bg-gray-50">
            <ComparisonExport
              data={comparisonResults}
              comparisonMode={comparisonMode}
              settings={settings}
            />
          </div>
        )}
      </div>

      {/* 비교 결과 표시 */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-gray-600">비교 분석 중...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 시간 비교 결과 */}
            {comparisonMode === 'time' && comparisonResults.timeComparison && (
              <div className="space-y-4">
                {viewMode === 'overview' || viewMode === 'charts' ? (
                  <DifferenceChart
                    data={[
                      {
                        dimension: 'concentration',
                        current: 0, // TODO: 실제 데이터 연결
                        previous: 0,
                        difference: 0,
                        changeRate: 0
                      }
                    ]}
                    title="시간별 변화 분석"
                    size="large"
                  />
                ) : (
                  <div className="text-gray-600">시간 비교 상세 데이터를 표시합니다.</div>
                )}
              </div>
            )}

            {/* 환자 비교 결과 */}
            {comparisonMode === 'patient' && comparisonResults.patientComparison && (
              <div className="space-y-4">
                {viewMode === 'overview' || viewMode === 'charts' ? (
                  <PerformanceMatrix
                    data={comparisonResults.patientComparison.map(p => ({
                      patientId: p.patientId,
                      patientName: p.patientName,
                      ...p.averageScores,
                      rank: p.rank,
                      improvement: 0 // TODO: 개선률 계산
                    }))}
                    title="환자별 성과 매트릭스"
                    size="large"
                  />
                ) : (
                  <div className="text-gray-600">환자 비교 상세 데이터를 표시합니다.</div>
                )}
              </div>
            )}

            {/* 요약 뷰 */}
            {viewMode === 'summary' && (
              <ComparisonSummary
                data={comparisonResults.summaryData || []}
                comparisonType={comparisonMode}
                title={`${getModeLabel(comparisonMode)} 요약`}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
} 