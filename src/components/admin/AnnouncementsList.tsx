import React, { useState, useMemo } from 'react';
import type { 
  Announcement, 
  AnnouncementFilter, 
  AnnouncementType,
  AnnouncementStatus,
  AnnouncementPriority,
  UserGroupType
} from '../../types/announcement';
import { 
  ANNOUNCEMENT_TYPE_CONFIG, 
  ANNOUNCEMENT_STATUS_CONFIG, 
  ANNOUNCEMENT_PRIORITY_CONFIG,
  USER_GROUP_CONFIG,
  formatAnnouncementDate 
} from '../../types/announcement';

interface AnnouncementsListProps {
  announcements: Announcement[];
  isLoading?: boolean;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: AnnouncementStatus) => void;
  onDuplicate?: (announcement: Announcement) => void;
}

const AnnouncementsList: React.FC<AnnouncementsListProps> = ({
  announcements,
  isLoading = false,
  onEdit,
  onDelete,
  onStatusChange,
  onDuplicate
}) => {
  // 필터 및 정렬 상태
  const [filter, setFilter] = useState<AnnouncementFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sort] = useState<{
    field: 'title' | 'createdAt' | 'publishAt' | 'readCount' | 'priority' | 'status';
    direction: 'asc' | 'desc';
  }>({
    field: 'createdAt',
    direction: 'desc'
  });
  const itemsPerPage = 10;

  // 필터링 및 정렬된 공지사항
  const filteredAndSortedAnnouncements = useMemo(() => {
    const filtered = announcements.filter(announcement => {
      // 검색어 필터
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!announcement.title.toLowerCase().includes(searchLower) &&
            !announcement.content.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // 유형 필터
      if (filter.type && announcement.type !== filter.type) {
        return false;
      }

      // 상태 필터
      if (filter.status && announcement.status !== filter.status) {
        return false;
      }

      // 우선순위 필터
      if (filter.priority && announcement.priority !== filter.priority) {
        return false;
      }

      // 타겟 그룹 필터
      if (filter.targetGroup && !announcement.targeting.userGroups.includes(filter.targetGroup)) {
        return false;
      }

      // 생성일 필터
      if (filter.createdDateRange) {
        const createdAt = new Date(announcement.createdAt);
        if (createdAt < filter.createdDateRange.start || createdAt > filter.createdDateRange.end) {
          return false;
        }
      }

      return true;
    });

    // 정렬
    filtered.sort((a, b) => {
      let aValue: unknown, bValue: unknown;

      switch (sort.field) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'publishAt':
          aValue = new Date(a.schedule.publishAt || a.createdAt);
          bValue = new Date(b.schedule.publishAt || b.createdAt);
          break;
        case 'readCount':
          aValue = a.metadata.readCount;
          bValue = b.metadata.readCount;
          break;
        case 'priority': {
          const priorityOrder = ['low', 'medium', 'high', 'urgent'];
          aValue = priorityOrder.indexOf(a.priority);
          bValue = priorityOrder.indexOf(b.priority);
          break;
        }
        case 'status': {
          const statusOrder = ['draft', 'scheduled', 'published', 'expired', 'cancelled'];
          aValue = statusOrder.indexOf(a.status);
          bValue = statusOrder.indexOf(b.status);
          break;
        }
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [announcements, filter, searchTerm, sort.field, sort.direction]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredAndSortedAnnouncements.length / itemsPerPage);
  const paginatedAnnouncements = filteredAndSortedAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* 필터 섹션 스켈레톤 */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        
        {/* 테이블 스켈레톤 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="space-y-4 p-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="space-y-4">
          {/* 검색 */}
          <div>
            <input
              type="text"
              placeholder="제목 또는 내용으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 필터 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 유형 필터 */}
            <select
              value={filter.type || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as AnnouncementType || undefined }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 유형</option>
              {Object.entries(ANNOUNCEMENT_TYPE_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>

            {/* 상태 필터 */}
            <select
              value={filter.status || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as AnnouncementStatus || undefined }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 상태</option>
              {Object.entries(ANNOUNCEMENT_STATUS_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>

            {/* 우선순위 필터 */}
            <select
              value={filter.priority || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value as AnnouncementPriority || undefined }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 우선순위</option>
              {Object.entries(ANNOUNCEMENT_PRIORITY_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>

            {/* 타겟 그룹 필터 */}
            <select
              value={filter.targetGroup || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, targetGroup: e.target.value as UserGroupType || undefined }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 대상</option>
              {Object.entries(USER_GROUP_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* 일괄 작업 */}
          {selectedItems.size > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {selectedItems.size}개 선택됨
              </span>
              <button
                onClick={() => {
                  // 일괄 삭제 처리
                  if (onDelete && window.confirm('선택된 공지사항을 삭제하시겠습니까?')) {
                    selectedItems.forEach(id => onDelete(id));
                    setSelectedItems(new Set());
                  }
                }}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                일괄 삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 공지사항 목록 */}
      <div className="space-y-4">
        {paginatedAnnouncements.map((announcement) => {
          const typeConfig = ANNOUNCEMENT_TYPE_CONFIG[announcement.type];
          const statusConfig = ANNOUNCEMENT_STATUS_CONFIG[announcement.status];
          const priorityConfig = ANNOUNCEMENT_PRIORITY_CONFIG[announcement.priority];

          return (
            <div key={announcement.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{typeConfig.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {announcement.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusConfig.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      statusConfig.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      statusConfig.color === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      statusConfig.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      <span className="mr-1">{statusConfig.icon}</span>
                      {statusConfig.label}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      priorityConfig.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      priorityConfig.color === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      priorityConfig.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      <span className="mr-1">{priorityConfig.icon}</span>
                      {priorityConfig.label}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {announcement.content.length > 200 
                      ? `${announcement.content.substring(0, 200)}...` 
                      : announcement.content}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>👀 {announcement.metadata.readCount.toLocaleString()}</span>
                    <span>✅ {announcement.metadata.confirmationCount}</span>
                    <span>📅 {formatAnnouncementDate(new Date(announcement.createdAt))}</span>
                  </div>

                  {announcement.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {announcement.metadata.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(announcement)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                      title="편집"
                    >
                      ✏️
                    </button>
                  )}
                  
                  {onDuplicate && (
                    <button
                      onClick={() => onDuplicate(announcement)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors"
                      title="복제"
                    >
                      📋
                    </button>
                  )}
                  
                  {onStatusChange && (
                    <select
                      value={announcement.status}
                      onChange={(e) => onStatusChange(announcement.id, e.target.value as AnnouncementStatus)}
                      className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {Object.entries(ANNOUNCEMENT_STATUS_CONFIG).map(([value, config]) => (
                        <option key={value} value={value}>{config.label}</option>
                      ))}
                    </select>
                  )}
                  
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (window.confirm('이 공지사항을 삭제하시겠습니까?')) {
                          onDelete(announcement.id);
                        }
                      }}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                      title="삭제"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            이전
          </button>
          
          <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
            {currentPage} / {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}

      {/* 결과 없음 */}
      {filteredAndSortedAnnouncements.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            공지사항이 없습니다
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || Object.keys(filter).length > 0
              ? '검색 조건에 맞는 공지사항이 없습니다.'
              : '새로운 공지사항을 생성해보세요.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsList; 