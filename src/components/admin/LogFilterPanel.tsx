import React from 'react'
import type { LogFilter } from '@/types/logs'
import { LogLevel, LogCategory, LOG_CATEGORY_LABELS, DEFAULT_LOG_FILTER } from '@/types/logs'

interface LogFilterPanelProps {
  filter: LogFilter
  onFilterChange: (filter: LogFilter) => void
  onReset: () => void
}

export const LogFilterPanel: React.FC<LogFilterPanelProps> = ({
  filter,
  onFilterChange,
  onReset
}) => {
  const handleLevelChange = (level: LogLevel, checked: boolean) => {
    const newLevels = checked 
      ? [...filter.levels, level]
      : filter.levels.filter(l => l !== level)
    
    onFilterChange({ ...filter, levels: newLevels })
  }

  const handleCategoryChange = (category: LogCategory, checked: boolean) => {
    const newCategories = checked
      ? [...filter.categories, category]
      : filter.categories.filter(c => c !== category)
    
    onFilterChange({ ...filter, categories: newCategories })
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFilterChange({ ...filter, [field]: value || undefined })
  }

  const handleInputChange = (field: keyof LogFilter, value: string | boolean | number) => {
    onFilterChange({ 
      ...filter, 
      [field]: value === '' ? undefined : value 
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filter.levels.length < Object.values(LogLevel).length) count++
    if (filter.categories.length < Object.values(LogCategory).length) count++
    if (filter.startDate || filter.endDate) count++
    if (filter.userId) count++
    if (filter.source) count++
    if (filter.ipAddress) count++
    if (filter.correlationId) count++
    if (filter.errorOnly) count++
    if (filter.minDuration || filter.maxDuration) count++
    return count
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            필터
          </h3>
          <div className="flex items-center space-x-2">
            {getActiveFilterCount() > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {getActiveFilterCount()}개 활성
              </span>
            )}
            <button
              onClick={onReset}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 로그 레벨 필터 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            로그 레벨
          </h4>
          <div className="space-y-2">
            {Object.values(LogLevel).map(level => (
              <label key={level} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filter.levels.includes(level)}
                  onChange={(e) => handleLevelChange(level, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {level}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            카테고리
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.values(LogCategory).map(category => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filter.categories.includes(category)}
                  onChange={(e) => handleCategoryChange(category, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {LOG_CATEGORY_LABELS[category]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 날짜 범위 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            날짜 범위
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                시작 날짜
              </label>
              <input
                type="datetime-local"
                value={filter.startDate ? filter.startDate.slice(0, 16) : ''}
                onChange={(e) => handleDateChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                종료 날짜
              </label>
              <input
                type="datetime-local"
                value={filter.endDate ? filter.endDate.slice(0, 16) : ''}
                onChange={(e) => handleDateChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 고급 필터 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            고급 필터
          </h4>
          <div className="space-y-3">
            {/* 사용자 ID */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                사용자 ID
              </label>
              <input
                type="text"
                value={filter.userId || ''}
                onChange={(e) => handleInputChange('userId', e.target.value)}
                placeholder="usr_12345"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* 소스 */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                소스
              </label>
              <input
                type="text"
                value={filter.source || ''}
                onChange={(e) => handleInputChange('source', e.target.value)}
                placeholder="auth-service"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* IP 주소 */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                IP 주소
              </label>
              <input
                type="text"
                value={filter.ipAddress || ''}
                onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                placeholder="192.168.1.1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* 상관관계 ID */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                상관관계 ID
              </label>
              <input
                type="text"
                value={filter.correlationId || ''}
                onChange={(e) => handleInputChange('correlationId', e.target.value)}
                placeholder="corr_abc123"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* 성능 필터 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            성능 필터
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  최소 소요시간 (ms)
                </label>
                <input
                  type="number"
                  value={filter.minDuration || ''}
                  onChange={(e) => handleInputChange('minDuration', e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  최대 소요시간 (ms)
                </label>
                <input
                  type="number"
                  value={filter.maxDuration || ''}
                  onChange={(e) => handleInputChange('maxDuration', e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 에러 전용 */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filter.errorOnly}
              onChange={(e) => handleInputChange('errorOnly', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              에러만 표시
            </span>
          </label>
        </div>
      </div>
    </div>
  )
} 