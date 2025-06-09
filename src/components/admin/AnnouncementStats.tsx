import React from 'react';
import type { AnnouncementStats } from '../../types/announcement';
import { ANNOUNCEMENT_TYPE_CONFIG, ANNOUNCEMENT_PRIORITY_CONFIG } from '../../types/announcement';

interface AnnouncementStatsProps {
  stats: AnnouncementStats;
  isLoading?: boolean;
}

const AnnouncementStatsComponent: React.FC<AnnouncementStatsProps> = ({ 
  stats, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* 주요 지표 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 시스템 상태 색상
  const getHealthStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getHealthStatusIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 총 공지사항 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                총 공지사항
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.totalAnnouncements)}
              </p>
            </div>
            <div className="text-3xl">📢</div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            전체 공지사항 수
          </p>
        </div>

        {/* 활성 공지사항 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                활성 공지사항
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(stats.activeAnnouncements)}
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            현재 게시 중인 공지
          </p>
        </div>

        {/* 총 조회수 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                총 조회수
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(stats.totalViews)}
              </p>
            </div>
            <div className="text-3xl">👀</div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            평균 읽기 시간: {stats.averageReadTime}초
          </p>
        </div>

        {/* 확인률 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                확인률
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatPercentage(stats.confirmationRate)}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            총 확인: {formatNumber(stats.totalConfirmations)}
          </p>
        </div>
      </div>

      {/* 시스템 상태 및 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시스템 상태 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            시스템 상태
          </h3>
          
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${getHealthStatusColor(stats.systemHealth.status)}`}>
            <span className="mr-2">{getHealthStatusIcon(stats.systemHealth.status)}</span>
            {stats.systemHealth.status === 'healthy' ? '정상' :
             stats.systemHealth.status === 'warning' ? '주의' : '위험'}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">대기 중</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stats.systemHealth.pendingCount}개
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">만료됨</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stats.systemHealth.expiredCount}개
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">오류</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stats.systemHealth.errorCount}개
              </span>
            </div>
          </div>
        </div>

        {/* 최근 활동 (간단한 차트) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            최근 활동 (15일)
          </h3>
          
          <div className="space-y-2">
            {stats.recentActivity.slice(-5).map((activity, index) => {
              const maxCount = Math.max(...stats.recentActivity.map(a => a.count));
              const barWidth = maxCount > 0 ? (activity.count / maxCount) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-16">
                    {new Date(activity.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white w-8">
                    {activity.count}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            총 조회수: {formatNumber(stats.recentActivity.reduce((sum, a) => sum + a.views, 0))}
          </div>
        </div>
      </div>

      {/* 유형별 분포 및 우선순위별 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 유형별 분포 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            유형별 분포
          </h3>
          
          <div className="space-y-3">
            {stats.typeDistribution
              .filter(item => item.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((item, index) => {
                const config = ANNOUNCEMENT_TYPE_CONFIG[item.type];
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{config.icon}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.count}개
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({formatPercentage(item.percentage)})
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 우선순위별 분포 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            우선순위별 분포
          </h3>
          
          <div className="space-y-3">
            {stats.priorityDistribution
              .filter(item => item.count > 0)
              .sort((a, b) => {
                const priorityOrder = ['urgent', 'high', 'medium', 'low'];
                return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
              })
              .map((item, index) => {
                const config = ANNOUNCEMENT_PRIORITY_CONFIG[item.priority];
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{config.icon}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.count}개
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({formatPercentage(item.percentage)})
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementStatsComponent; 