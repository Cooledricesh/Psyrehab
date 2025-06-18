import React, { useMemo } from 'react'
import { Filter, X, Users, Calendar, BarChart, AlertTriangle } from 'lucide-react'
import { AssessmentData } from '@/types/assessment'
import { ComparisonFilters as FiltersType } from './utils/comparisonUtils'

interface ComparisonFiltersProps {
  filters: FiltersType
  onFiltersChange: (filters: FiltersType) => void
  patients: Array<{ id: string; name: string }>
  assessments: AssessmentData[]
}

export const ComparisonFilters: React.FC<ComparisonFiltersProps> = ({
  filters,
  onFiltersChange,
  patients,
  assessments
}) => {
  // 필터 통계 계산
  const filterStats = useMemo(() => {
    let filteredAssessments = assessments

    // 날짜 범위 필터
    if (filters.dateRange) {
      filteredAssessments = filteredAssessments.filter(assessment => {
        const date = new Date(assessment.created_at)
        return date >= filters.dateRange!.start && date <= filters.dateRange!.end
      })
    }

    // 환자 필터
    if (filters.patientIds && filters.patientIds.length > 0) {
      filteredAssessments = filteredAssessments.filter(assessment =>
        filters.patientIds!.includes(assessment.patient_id)
      )
    }

    // 최소 평가 수 필터
    const patientAssessmentCounts = filteredAssessments.reduce((acc, assessment) => {
      acc[assessment.patient_id] = (acc[assessment.patient_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const eligiblePatients = Object.keys(patientAssessmentCounts).filter(
      patientId => patientAssessmentCounts[patientId] >= (filters.minAssessments || 1)
    )

    const finalFilteredAssessments = filteredAssessments.filter(assessment =>
      eligiblePatients.includes(assessment.patient_id)
    )

    return {
      totalAssessments: assessments.length,
      filteredAssessments: finalFilteredAssessments.length,
      totalPatients: new Set(assessments.map(a => a.patient_id)).size,
      filteredPatients: new Set(finalFilteredAssessments.map(a => a.patient_id)).size,
      patientAssessmentCounts
    }
  }, [filters, assessments])

  const updateFilters = (updates: Partial<FiltersType>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: undefined,
      patientIds: [],
      minAssessments: 1,
      excludeOutliers: false
    })
  }

  const hasActiveFilters = !!(
    filters.dateRange ||
    (filters.patientIds && filters.patientIds.length > 0) ||
    (filters.minAssessments && filters.minAssessments > 1) ||
    filters.excludeOutliers
  )

  const togglePatientFilter = (patientId: string) => {
    const currentIds = filters.patientIds || []
    const newIds = currentIds.includes(patientId)
      ? currentIds.filter(id => id !== patientId)
      : [...currentIds, patientId]
    
    updateFilters({ patientIds: newIds })
  }

  const selectAllPatients = () => {
    const currentIds = filters.patientIds || []
    const allPatientIds = patients.map(p => p.id)
    
    updateFilters({
      patientIds: currentIds.length === allPatientIds.length ? [] : allPatientIds
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">데이터 필터</h3>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            <X className="h-4 w-4" />
            <span>전체 초기화</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 날짜 범위 필터 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>날짜 범위</span>
          </h4>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시작 날짜
                </label>
                <input
                  type="date"
                  value={filters.dateRange?.start.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    const startDate = e.target.value ? new Date(e.target.value) : undefined
                    const endDate = filters.dateRange?.end || new Date()
                    
                    updateFilters({
                      dateRange: startDate ? { start: startDate, end: endDate } : undefined
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  종료 날짜
                </label>
                <input
                  type="date"
                  value={filters.dateRange?.end.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    const endDate = e.target.value ? new Date(e.target.value) : undefined
                    const startDate = filters.dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    
                    updateFilters({
                      dateRange: endDate ? { start: startDate, end: endDate } : undefined
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {filters.dateRange && (
              <div className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 p-2 rounded">
                <span>
                  {filters.dateRange.start.toLocaleDateString('ko-KR')} ~ {filters.dateRange.end.toLocaleDateString('ko-KR')}
                </span>
                <button
                  onClick={() => updateFilters({ dateRange: undefined })}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  제거
                </button>
              </div>
            )}
          </div>

          {/* 빠른 날짜 선택 */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: '최근 7일', days: 7 },
              { label: '최근 30일', days: 30 },
              { label: '최근 90일', days: 90 },
              { label: '최근 1년', days: 365 }
            ].map(({ label, days }) => (
              <button
                key={days}
                onClick={() => {
                  const endDate = new Date()
                  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
                  updateFilters({ dateRange: { start: startDate, end: endDate } })
                }}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 환자 선택 필터 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>환자 선택</span>
            </h4>
            <button
              onClick={selectAllPatients}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {(filters.patientIds?.length || 0) === patients.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-3">
            {patients.map((patient) => {
              const assessmentCount = filterStats.patientAssessmentCounts[patient.id] || 0
              const isSelected = filters.patientIds?.includes(patient.id) || false
              
              return (
                <label key={patient.id} className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePatientFilter(patient.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{patient.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {assessmentCount}건
                  </span>
                </label>
              )
            })}
          </div>

          {(filters.patientIds?.length || 0) === 0 && (
            <p className="text-sm text-gray-500">모든 환자가 포함됩니다.</p>
          )}
        </div>

        {/* 데이터 품질 필터 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
            <BarChart className="h-4 w-4" />
            <span>데이터 품질</span>
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 평가 수 (환자별)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={filters.minAssessments || 1}
                onChange={(e) => updateFilters({ minAssessments: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                설정된 수보다 적은 평가를 받은 환자는 제외됩니다.
              </p>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.excludeOutliers || false}
                onChange={(e) => updateFilters({ excludeOutliers: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">이상치 제외</span>
            </label>
            
            {filters.excludeOutliers && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded flex items-start space-x-1">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  통계적 이상치(Q1-1.5*IQR 미만, Q3+1.5*IQR 초과)가 분석에서 제외됩니다.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 고급 필터 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">고급 옵션</h4>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={false} // 추후 구현
                onChange={() => {}} // 추후 구현
                disabled
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700">불완전한 평가 제외</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={false} // 추후 구현
                onChange={() => {}} // 추후 구현
                disabled
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700">테스트 데이터 제외</span>
            </label>
          </div>
        </div>
      </div>

      {/* 필터 결과 요약 */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-medium text-gray-900 mb-2">필터링 결과</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">총 평가:</span>
            <div className="font-medium">
              {filterStats.filteredAssessments.toLocaleString()} / {filterStats.totalAssessments.toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-gray-600">총 환자:</span>
            <div className="font-medium">
              {filterStats.filteredPatients} / {filterStats.totalPatients}
            </div>
          </div>
          <div>
            <span className="text-gray-600">제외율:</span>
            <div className="font-medium">
              {filterStats.totalAssessments > 0 
                ? Math.round((1 - filterStats.filteredAssessments / filterStats.totalAssessments) * 100)
                : 0}%
            </div>
          </div>
          <div>
            <span className="text-gray-600">데이터 품질:</span>
            <div className={`font-medium ${
              filterStats.filteredAssessments >= filterStats.totalAssessments * 0.8 
                ? 'text-green-600' 
                : filterStats.filteredAssessments >= filterStats.totalAssessments * 0.5
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}>
              {filterStats.filteredAssessments >= filterStats.totalAssessments * 0.8 
                ? '우수' 
                : filterStats.filteredAssessments >= filterStats.totalAssessments * 0.5
                ? '보통'
                : '주의'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 