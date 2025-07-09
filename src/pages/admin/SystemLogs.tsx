import React, { useState, useEffect, useMemo } from 'react'
import type { LogEntry, LogFilter, LogPagination } from '@/types/logs'
import { DEFAULT_LOG_FILTER, DEFAULT_PAGINATION } from '@/types/logs'
import { LogStatsPanel } from '@/components/admin/LogStatsPanel'
import { LogFilterPanel } from '@/components/admin/LogFilterPanel'
import { LogEntriesList } from '@/components/admin/LogEntriesList'
import { mockLogs, generateLogStats } from '@/utils/mockLogData'

export const SystemLogs: React.FC = () => {
  const [logs] = useState<LogEntry[]>(mockLogs)
  const [filter, setFilter] = useState<LogFilter>(DEFAULT_LOG_FILTER)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState<LogPagination>(DEFAULT_PAGINATION)
  const [isLoading] = useState(false)

  // 필터링된 로그 계산
  const filteredLogs = useMemo(() => {
    let result = logs

    // 기본 필터 적용
    result = result.filter(log => {
      if (!filter.levels.includes(log.level)) return false
      if (!filter.categories.includes(log.category)) return false
      if (filter.errorOnly && log.level !== 'error') return false
      return true
    })

    // 검색 쿼리 적용
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(log => 
        log.message.toLowerCase().includes(query) ||
        log.source?.toLowerCase().includes(query) ||
        log.userId?.toLowerCase().includes(query)
      )
    }

    return result
  }, [logs, filter, searchQuery])

  // 페이지네이션된 로그
  const paginatedLogs = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize
    return filteredLogs.slice(startIndex, endIndex)
  }, [filteredLogs, pagination])

  // 통계 계산
  const stats = useMemo(() => generateLogStats(filteredLogs), [filteredLogs])

  // 페이지네이션 업데이트
  useEffect(() => {
    const totalPages = Math.ceil(filteredLogs.length / pagination.pageSize)
    setPagination(prev => ({
      ...prev,
      total: filteredLogs.length,
      totalPages,
      page: Math.min(prev.page, Math.max(1, totalPages))
    }))
  }, [filteredLogs.length, pagination.pageSize])

  const handleFilterChange = (newFilter: LogFilter) => {
    setFilter(newFilter)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterReset = () => {
    setFilter(DEFAULT_LOG_FILTER)
    setSearchQuery('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize, 
      page: 1 
    }))
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          시스템 로그
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          시스템 활동과 오류를 모니터링하고 분석합니다
        </p>

        {/* 검색 바 */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="로그 검색..."
              className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 왼쪽: 필터 패널 */}
        <div className="lg:col-span-1">
          <LogFilterPanel
            filter={filter}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
          />
        </div>

        {/* 오른쪽: 통계 및 로그 목록 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 통계 패널 */}
          <LogStatsPanel
            stats={stats}
            isLoading={isLoading}
          />

          {/* 로그 엔트리 목록 */}
          <LogEntriesList
            logs={paginatedLogs}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>
    </div>
  )
} 