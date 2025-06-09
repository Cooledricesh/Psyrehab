import React from 'react'
import type { BackupStats } from '@/types/backup'
import { formatFileSize, formatDuration } from '@/types/backup'

interface BackupStatsPanelProps {
  stats: BackupStats
  isLoading?: boolean
}

export const BackupStatsPanel: React.FC<BackupStatsPanelProps> = ({
  stats,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const storagePercent = Math.round((stats.storageUsed / stats.storageLimit) * 100)
  const systemStatus = stats.successRate >= 90 ? 'healthy' : stats.successRate >= 70 ? 'warning' : 'critical'

  const statusColors = {
    healthy: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400', 
    critical: 'text-red-600 dark:text-red-400'
  }

  const statusBgColors = {
    healthy: 'bg-green-50 dark:bg-green-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    critical: 'bg-red-50 dark:bg-red-900/20'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          백업 시스템 통계
        </h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusBgColors[systemStatus]} ${statusColors[systemStatus]}`}>
          {systemStatus === 'healthy' && '정상'}
          {systemStatus === 'warning' && '주의'}
          {systemStatus === 'critical' && '위험'}
        </div>
      </div>

      {/* 주요 지표 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 총 백업 수 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-sm">📦</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">총 백업</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{stats.totalBackups}</p>
            </div>
          </div>
        </div>

        {/* 성공률 */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-sm">✅</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">성공률</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">{stats.successRate}%</p>
            </div>
          </div>
        </div>

        {/* 평균 소요시간 */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-sm">⏱️</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">평균 시간</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {formatDuration(Math.round(stats.averageDuration))}
              </p>
            </div>
          </div>
        </div>

        {/* 총 크기 */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-800 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 text-sm">💾</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">총 크기</p>
              <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                {formatFileSize(stats.totalSize)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 스토리지 사용량 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            스토리지 사용량
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatFileSize(stats.storageUsed)} / {formatFileSize(stats.storageLimit)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              storagePercent >= 90 ? 'bg-red-500' : 
              storagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(storagePercent, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>0%</span>
          <span className="font-medium">{storagePercent}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* 성공/실패 백업 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.successfulBackups}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">성공한 백업</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.failedBackups}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">실패한 백업</div>
        </div>
      </div>
    </div>
  )
} 