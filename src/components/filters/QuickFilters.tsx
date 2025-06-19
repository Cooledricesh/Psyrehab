import React from 'react';
import { X } from 'lucide-react';

export interface QuickFilter {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  filters: Record<string, unknown>;
}

export interface QuickFiltersProps {
  title?: string;
  filters: QuickFilter[];
  activeFilters?: string[];
  onFilterToggle: (filterId: string, filters: Record<string, unknown>) => void;
  onClearAll?: () => void;
  className?: string;
  showClearAll?: boolean;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  title = '빠른 필터',
  filters,
  activeFilters = [],
  onFilterToggle,
  onClearAll,
  className = '',
  showClearAll = true,
}) => {
  const colorClasses = {
    blue: {
      active: 'bg-blue-100 text-blue-800 border-blue-300',
      inactive: 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50',
    },
    green: {
      active: 'bg-green-100 text-green-800 border-green-300',
      inactive: 'bg-white text-green-600 border-green-200 hover:bg-green-50',
    },
    yellow: {
      active: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      inactive: 'bg-white text-yellow-600 border-yellow-200 hover:bg-yellow-50',
    },
    red: {
      active: 'bg-red-100 text-red-800 border-red-300',
      inactive: 'bg-white text-red-600 border-red-200 hover:bg-red-50',
    },
    purple: {
      active: 'bg-purple-100 text-purple-800 border-purple-300',
      inactive: 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50',
    },
    gray: {
      active: 'bg-gray-100 text-gray-800 border-gray-300',
      inactive: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
    },
  };

  const handleFilterClick = (filter: QuickFilter) => {
    onFilterToggle(filter.id, filter.filters);
  };

  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {showClearAll && activeFilters.length > 0 && onClearAll && (
          <button
            onClick={onClearAll}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
          >
            <X size={14} />
            <span>전체 해제</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = activeFilters.includes(filter.id);
          const colors = colorClasses[filter.color || 'blue'];
          const classes = isActive ? colors.active : colors.inactive;

          return (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter)}
              className={`
                inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium
                transition-all duration-200
                ${classes}
              `}
            >
              {filter.icon && (
                <span className="mr-2 flex-shrink-0">
                  {filter.icon}
                </span>
              )}
              <span>{filter.label}</span>
              {filter.count !== undefined && (
                <span className="ml-2 px-2 py-1 text-xs bg-current bg-opacity-20 rounded-full">
                  {filter.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickFilters; 