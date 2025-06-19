import React, { useState, useMemo } from 'react'
import type { BackupItem, BackupFilter } from '@/types/backup'
import { BackupType, BackupStatus, BACKUP_TYPE_LABELS, BACKUP_STATUS_LABELS, formatFileSize, formatDuration } from '@/types/backup'

interface BackupsListProps {
  backups: BackupItem[]
  isLoading?: boolean
  onDownload?: (backup: BackupItem) => void
  onRestore?: (backup: BackupItem) => void
  onDelete?: (backup: BackupItem) => void
  onCancel?: (backup: BackupItem) => void
}

export const BackupsList: React.FC<BackupsListProps> = ({
  backups,
  isLoading = false,
  onDownload,
  onRestore,
  onDelete,
  onCancel
}) => {
  const [filter, setFilter] = useState<BackupFilter>({})
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'size' | 'status'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 필터링된 백업 목록
  const filteredBackups = useMemo(() => {
    return backups.filter(backup => {
      if (filter.type && backup.type !== filter.type) return false
      if (filter.status && backup.status !== filter.status) return false
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase()
        if (!backup.name.toLowerCase().includes(query) && 
            !backup.metadata.description?.toLowerCase().includes(query)) {
          return false
        }
      }
      if (filter.dateRange) {
        const backupDate = new Date(backup.createdAt)
        if (backupDate < filter.dateRange.start || backupDate > filter.dateRange.end) {
          return false
        }
      }
      if (filter.sizeRange) {
        if (backup.size < filter.sizeRange.min || backup.size > filter.sizeRange.max) {
          return false
        }
      }
      return true
    })
  }, [backups, filter])

  // 정렬된 백업 목록
  const sortedBackups = useMemo(() => {
    return [...filteredBackups].sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [filteredBackups, sortBy, sortOrder])

  // 페이지네이션
  const totalPages = Math.ceil(sortedBackups.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedBackups = sortedBackups.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: typeof sortBy) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getStatusColor = (status: BackupStatus) => {
    const colorMap = {
      [BackupStatus.PENDING]: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700',
      [BackupStatus.IN_PROGRESS]: 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/20',
      [BackupStatus.COMPLETED]: 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/20',
      [BackupStatus.FAILED]: 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/20',
      [BackupStatus.CANCELLED]: 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/20',
      [BackupStatus.EXPIRED]: 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/20'
    }
    return colorMap[status]
  }

  const getTypeColor = (type: BackupType) => {
    const colorMap = {
      [BackupType.FULL]: 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/20',
      [BackupType.INCREMENTAL]: 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/20',
      [BackupType.DIFFERENTIAL]: 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/20',
      [BackupType.USER_DATA]: 'text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/20',
      [BackupType.SETTINGS]: 'text-indigo-600 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/20',
      [BackupType.LOGS]: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700'
    }
    return colorMap[type]
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* 필터 컨트롤 */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 타입 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              백업 타입
            </label>
            <select
              value={filter.type || ''}
              onChange={(e) => setFilter({...filter, type: e.target.value as BackupType || undefined})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">전체</option>
              {Object.values(BackupType).map(type => (
                <option key={type} value={type}>{BACKUP_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>

          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              상태
            </label>
            <select
              value={filter.status || ''}
              onChange={(e) => setFilter({...filter, status: e.target.value as BackupStatus || undefined})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">전체</option>
              {Object.values(BackupStatus).map(status => (
                <option key={status} value={status}>{BACKUP_STATUS_LABELS[status]}</option>
              ))}
            </select>
          </div>

          {/* 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              검색
            </label>
            <input
              type="text"
              placeholder="백업 이름 또는 설명 검색..."
              value={filter.searchQuery || ''}
              onChange={(e) => setFilter({...filter, searchQuery: e.target.value || undefined})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* 정렬 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              정렬
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field as typeof sortBy)
                setSortOrder(order as 'asc' | 'desc')
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="createdAt-desc">생성일 (최신)</option>
              <option value="createdAt-asc">생성일 (오래된)</option>
              <option value="name-asc">이름 (가나다순)</option>
              <option value="name-desc">이름 (역순)</option>
              <option value="size-desc">크기 (큰 순)</option>
              <option value="size-asc">크기 (작은 순)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 백업 목록 */}
      <div className="p-6">
        <div className="space-y-4">
          {paginatedBackups.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                백업이 없습니다
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                필터 조건을 변경하거나 새 백업을 생성해보세요.
              </p>
            </div>
          ) : (
            paginatedBackups.map(backup => (
              <div
                key={backup.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {backup.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(backup.type)}`}>
                        {BACKUP_TYPE_LABELS[backup.type]}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(backup.status)}`}>
                        {BACKUP_STATUS_LABELS[backup.status]}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <span>📅 {new Date(backup.createdAt).toLocaleString()}</span>
                      <span>💾 {formatFileSize(backup.size)}</span>
                      {backup.duration && (
                        <span>⏱️ {formatDuration(backup.duration)}</span>
                      )}
                      {backup.isEncrypted && <span>🔒 암호화</span>}
                      {backup.isCompressed && <span>🗜️ 압축</span>}
                    </div>

                    {backup.status === BackupStatus.IN_PROGRESS && backup.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">진행률</span>
                          <span className="text-gray-600 dark:text-gray-400">{backup.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${backup.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {backup.error && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <div className="text-sm text-red-700 dark:text-red-300">
                          ❌ {backup.error}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex items-center gap-2">
                    {backup.status === BackupStatus.COMPLETED && onDownload && (
                      <button
                        onClick={() => onDownload(backup)}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        다운로드
                      </button>
                    )}
                    
                    {backup.status === BackupStatus.COMPLETED && onRestore && (
                      <button
                        onClick={() => onRestore(backup)}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-sm hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                      >
                        복원
                      </button>
                    )}
                    
                    {backup.status === BackupStatus.IN_PROGRESS && onCancel && (
                      <button
                        onClick={() => onCancel(backup)}
                        className="px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded text-sm hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-colors"
                      >
                        취소
                      </button>
                    )}
                    
                    {onDelete && backup.status !== BackupStatus.IN_PROGRESS && (
                      <button
                        onClick={() => onDelete(backup)}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-sm hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedBackups.length)} / {sortedBackups.length}개 항목
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                이전
              </button>
              
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1
                if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm transition-colors ${
                        page === currentPage
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  )
                } else if (page === currentPage - 3 || page === currentPage + 3) {
                  return <span key={page} className="text-gray-400">...</span>
                }
                return null
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 