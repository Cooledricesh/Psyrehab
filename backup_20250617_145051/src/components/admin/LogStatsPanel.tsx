import React from 'react'
import type { LogStats } from '@/types/logs'

interface LogStatsPanelProps {
  stats: LogStats
  isLoading: boolean
}

export const LogStatsPanel: React.FC<LogStatsPanelProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'critical':
        return '🔴'
      default:
        return '❓'
    }
  }

  const storagePercentage = (stats.storageUsed / stats.storageTotal) * 100

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* 시스템 상태 헤더 */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            시스템 상태
          </h3>
          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(stats.systemStatus)}`}>
            {getStatusIcon(stats.systemStatus)} {stats.systemStatus.toUpperCase()}
          </div>
        </div>
      </div>

      {/* 통계 카드들 */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* 총 로그 수 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalLogs.toLocaleString()}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">총 로그</div>
          </div>

          {/* 오늘 로그 수 */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.todayLogs.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">오늘 로그</div>
          </div>

          {/* 에러 수 */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.errorCount.toLocaleString()}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">에러</div>
          </div>

          {/* 경고 수 */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.warningCount.toLocaleString()}
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">경고</div>
          </div>
        </div>

        {/* 평균 응답 시간 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              평균 응답 시간
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {stats.avgResponseTime}ms
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min((stats.avgResponseTime / 1000) * 100, 100)}%` 
              }}
            ></div>
          </div>
        </div>

        {/* 스토리지 사용량 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              스토리지 사용량
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {stats.storageUsed}MB / {stats.storageTotal}MB
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                storagePercentage > 90 ? 'bg-red-500' : 
                storagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {storagePercentage.toFixed(1)}% 사용 중
          </div>
        </div>

        {/* 상위 에러 목록 */}
        {stats.topErrors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              상위 에러 (최근 발생)
            </h4>
            <div className="space-y-2">
              {stats.topErrors.map((error, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {error.message}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      최근 발생: {new Date(error.lastOccurrence).toLocaleString()}
                    </div>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      {error.count}회
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 