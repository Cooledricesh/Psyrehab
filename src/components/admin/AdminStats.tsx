import React from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Permission } from '@/types/auth';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  permission: Permission;
}

interface AdminStatsProps {
  cards: StatCard[];
  isLoading?: boolean;
}

export const AdminStats: React.FC<AdminStatsProps> = ({ cards, isLoading = false }) => {
  const { checkPermission } = useAdminAuth();

  const getColorClasses = (color: StatCard['color']) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50',
          icon: 'text-blue-600',
          ring: 'ring-blue-600/20',
        };
      case 'green':
        return {
          bg: 'bg-green-50',
          icon: 'text-green-600',
          ring: 'ring-green-600/20',
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          icon: 'text-purple-600',
          ring: 'ring-purple-600/20',
        };
      case 'orange':
        return {
          bg: 'bg-orange-50',
          icon: 'text-orange-600',
          ring: 'ring-orange-600/20',
        };
      case 'red':
        return {
          bg: 'bg-red-50',
          icon: 'text-red-600',
          ring: 'ring-red-600/20',
        };
      default:
        return {
          bg: 'bg-gray-50',
          icon: 'text-gray-600',
          ring: 'ring-gray-600/20',
        };
    }
  };

  const getChangeClasses = (changeType: StatCard['changeType']) => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'negative':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const StatCardSkeleton = () => (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const visibleCards = cards.filter(card => checkPermission(card.permission));

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {visibleCards.map((card, index) => {
        const colorClasses = getColorClasses(card.color);
        const Icon = card.icon;

        return (
          <div
            key={index}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${colorClasses.bg} rounded-lg flex items-center justify-center ring-8 ${colorClasses.ring}`}>
                    <Icon className={`w-5 h-5 ${colorClasses.icon}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {card.value}
                      </div>
                      {card.change && (
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${getChangeClasses(card.changeType)}`}>
                          {card.changeType === 'positive' && (
                            <TrendingUp className="self-center flex-shrink-0 h-3 w-3 mr-1" />
                          )}
                          {card.changeType === 'negative' && (
                            <TrendingDown className="self-center flex-shrink-0 h-3 w-3 mr-1" />
                          )}
                          <span className="sr-only">
                            {card.changeType === 'positive' ? '증가' : '감소'}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs">
                            {card.change}
                          </span>
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStats; 