import React, { useState } from 'react'
import type { LogEntry, LogPagination } from '@/types/logs'
import { LOG_LEVEL_COLORS, LOG_LEVEL_ICONS, LOG_CATEGORY_LABELS, PAGE_SIZE_OPTIONS } from '@/types/logs'

interface LogEntriesListProps {
  logs: LogEntry[]
  isLoading: boolean
  pagination: LogPagination
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export const LogEntriesList: React.FC<LogEntriesListProps> = ({
  logs,
  isLoading,
  pagination,
  onPageChange,
  onPageSizeChange
}) => {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR')
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <div className="text-gray-400 text-4xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          로그가 없습니다
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          현재 필터 조건에 맞는 로그가 없습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            로그 엔트리 ({pagination.total}개)
          </h3>
          <select
            value={pagination.pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 로그 목록 */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {logs.map((log) => (
          <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* 로그 레벨과 메시지 */}
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${LOG_LEVEL_COLORS[log.level]}`}>
                    {LOG_LEVEL_ICONS[log.level]} {log.level.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-900 dark:text-white mb-2">
                  {log.message}
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {log.source && `소스: ${log.source}`}
                  {log.userId && ` | 사용자: ${log.userId}`}
                </div>
              </div>

              <button
                onClick={() => toggleExpanded(log.id)}
                className="ml-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg 
                  className={`w-4 h-4 transform transition-transform ${expandedLogs.has(log.id) ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* 확장된 정보 */}
            {expandedLogs.has(log.id) && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs space-y-1">
                  <div><strong>ID:</strong> {log.id}</div>
                  <div><strong>카테고리:</strong> {LOG_CATEGORY_LABELS[log.category]}</div>
                  {log.sessionId && <div><strong>세션:</strong> {log.sessionId}</div>}
                  {log.ipAddress && <div><strong>IP:</strong> {log.ipAddress}</div>}
                  {log.duration && <div><strong>소요시간:</strong> {log.duration}ms</div>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 간단한 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            페이지 {pagination.page} / {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              이전
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 