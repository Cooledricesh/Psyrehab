import React from 'react'
import { Calendar, Users, Brain, TrendingUp, Settings2 } from 'lucide-react'
import { ComparisonMode } from './ComparisonManager'
import { ComparisonPeriod, TimeRangeConfig, createTimeRanges } from './utils/comparisonUtils'

interface ComparisonSettingsProps {
  settings: {
    period: ComparisonPeriod
    selectedPatients: string[]
    selectedDimensions: string[]
    timeRange: TimeRangeConfig
    showStatistics: boolean
    showTrends: boolean
    confidenceLevel: number
  }
  onSettingsChange: (settings: any) => void
  patients: Array<{ id: string; name: string }>
  comparisonMode: ComparisonMode
}

export const ComparisonSettings: React.FC<ComparisonSettingsProps> = ({
  settings,
  onSettingsChange,
  patients,
  comparisonMode
}) => {
  const dimensions = [
    { id: 'concentration', label: '집중력', icon: Brain },
    { id: 'motivation', label: '동기', icon: TrendingUp },
    { id: 'success', label: '성공경험', icon: Calendar },
    { id: 'constraints', label: '제약요인', icon: Settings2 },
    { id: 'social', label: '사회성', icon: Users }
  ]

  const periods: Array<{ value: ComparisonPeriod; label: string }> = [
    { value: 'week', label: '주간' },
    { value: 'month', label: '월간' },
    { value: 'quarter', label: '분기' },
    { value: 'year', label: '연간' },
    { value: 'custom', label: '사용자 정의' }
  ]

  const confidenceLevels = [
    { value: 0.90, label: '90%' },
    { value: 0.95, label: '95%' },
    { value: 0.99, label: '99%' }
  ]

  const updateSettings = (updates: Partial<typeof settings>) => {
    const newSettings = { ...settings, ...updates }
    
    // 기간이 변경되면 시간 범위도 업데이트
    if (updates.period && updates.period !== 'custom') {
      newSettings.timeRange = createTimeRanges(updates.period)
    }
    
    onSettingsChange(newSettings)
  }

  const togglePatient = (patientId: string) => {
    const newSelected = settings.selectedPatients.includes(patientId)
      ? settings.selectedPatients.filter(id => id !== patientId)
      : [...settings.selectedPatients, patientId]
    
    updateSettings({ selectedPatients: newSelected })
  }

  const toggleDimension = (dimensionId: string) => {
    const newSelected = settings.selectedDimensions.includes(dimensionId)
      ? settings.selectedDimensions.filter(id => id !== dimensionId)
      : [...settings.selectedDimensions, dimensionId]
    
    updateSettings({ selectedDimensions: newSelected })
  }

  const selectAllPatients = () => {
    updateSettings({ 
      selectedPatients: settings.selectedPatients.length === patients.length 
        ? [] 
        : patients.map(p => p.id) 
    })
  }

  const selectAllDimensions = () => {
    updateSettings({
      selectedDimensions: settings.selectedDimensions.length === dimensions.length
        ? []
        : dimensions.map(d => d.id)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings2 className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">비교 설정</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시간 설정 (시간 비교 모드에서만 표시) */}
        {comparisonMode === 'time' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>시간 범위</span>
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비교 기간
                </label>
                <select
                  value={settings.period}
                  onChange={(e) => updateSettings({ period: e.target.value as ComparisonPeriod })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {periods.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>

              {settings.period === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      현재 기간 시작
                    </label>
                    <input
                      type="date"
                      value={settings.timeRange.current.start.toISOString().split('T')[0]}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value)
                        updateSettings({
                          timeRange: {
                            ...settings.timeRange,
                            current: { ...settings.timeRange.current, start: newDate }
                          }
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      현재 기간 종료
                    </label>
                    <input
                      type="date"
                      value={settings.timeRange.current.end.toISOString().split('T')[0]}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value)
                        updateSettings({
                          timeRange: {
                            ...settings.timeRange,
                            current: { ...settings.timeRange.current, end: newDate }
                          }
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 환자 선택 (환자 비교 또는 진전도 분석 모드에서만 표시) */}
        {(comparisonMode === 'patient' || comparisonMode === 'progress') && patients.length > 0 && (
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
                {settings.selectedPatients.length === patients.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-3">
              {patients.map((patient) => (
                <label key={patient.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.selectedPatients.includes(patient.id)}
                    onChange={() => togglePatient(patient.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{patient.name}</span>
                </label>
              ))}
            </div>

            {settings.selectedPatients.length === 0 && (
              <p className="text-sm text-gray-500">모든 환자가 포함됩니다.</p>
            )}
          </div>
        )}

        {/* 분석 차원 선택 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>분석 차원</span>
            </h4>
            <button
              onClick={selectAllDimensions}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {settings.selectedDimensions.length === dimensions.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {dimensions.map((dimension) => {
              const Icon = dimension.icon
              return (
                <label
                  key={dimension.id}
                  className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={settings.selectedDimensions.includes(dimension.id)}
                    onChange={() => toggleDimension(dimension.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{dimension.label}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* 통계 설정 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>통계 설정</span>
          </h4>

          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showStatistics}
                onChange={(e) => updateSettings({ showStatistics: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">통계적 유의성 표시</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showTrends}
                onChange={(e) => updateSettings({ showTrends: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">트렌드 분석 포함</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신뢰도 수준
              </label>
              <select
                value={settings.confidenceLevel}
                onChange={(e) => updateSettings({ confidenceLevel: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {confidenceLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 설정 요약 */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-medium text-gray-900 mb-2">설정 요약</h5>
        <div className="text-sm text-gray-600 space-y-1">
          {comparisonMode === 'time' && (
            <p>• 비교 기간: {periods.find(p => p.value === settings.period)?.label}</p>
          )}
          {(comparisonMode === 'patient' || comparisonMode === 'progress') && (
            <p>
              • 선택된 환자: {settings.selectedPatients.length === 0 
                ? '전체' 
                : `${settings.selectedPatients.length}명`}
            </p>
          )}
          <p>• 분석 차원: {settings.selectedDimensions.length}개</p>
          <p>• 통계 분석: {settings.showStatistics ? '활성화' : '비활성화'}</p>
          <p>• 신뢰도: {(settings.confidenceLevel * 100).toFixed(0)}%</p>
        </div>
      </div>
    </div>
  )
} 