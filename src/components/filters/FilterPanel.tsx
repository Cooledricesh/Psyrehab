import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'select' | 'date' | 'range';
  options?: FilterOption[];
  value?: unknown;
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface FilterPanelProps {
  title?: string;
  groups: FilterGroup[];
  values: Record<string, unknown>;
  onChange: (filterId: string, value: unknown) => void;
  onReset: () => void;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showActiveCount?: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  title = '필터',
  groups,
  values,
  onChange,
  onReset,
  className = '',
  collapsible = true,
  defaultExpanded = true,
  showActiveCount = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Calculate active filters count
  const activeFiltersCount = Object.values(values).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') {
      return Object.values(value).some(v => v !== null && v !== undefined && v !== '');
    }
    return value !== null && value !== undefined && value !== '';
  }).length;

  const handleCheckboxChange = (groupId: string, optionValue: string) => {
    const currentValues = values[groupId] || [];
    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter((v: string) => v !== optionValue)
      : [...currentValues, optionValue];
    onChange(groupId, newValues);
  };

  const handleRadioChange = (groupId: string, optionValue: string) => {
    onChange(groupId, optionValue);
  };

  const handleSelectChange = (groupId: string, value: string) => {
    onChange(groupId, value);
  };

  const handleDateChange = (groupId: string, field: string, value: string) => {
    const currentValue = values[groupId] || {};
    onChange(groupId, { ...currentValue, [field]: value });
  };

  const handleRangeChange = (groupId: string, field: string, value: number) => {
    const currentValue = values[groupId] || {};
    onChange(groupId, { ...currentValue, [field]: value });
  };

  const renderFilterGroup = (group: FilterGroup) => {
    const groupValue = values[group.id];

    switch (group.type) {
      case 'checkbox':
        return (
          <div className="space-y-2">
            {group.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(groupValue || []).includes(option.value)}
                  onChange={() => handleCheckboxChange(group.id, option.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {option.count}
                  </span>
                )}
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {group.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={group.id}
                  value={option.value}
                  checked={groupValue === option.value}
                  onChange={() => handleRadioChange(group.id, option.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {option.count}
                  </span>
                )}
              </label>
            ))}
          </div>
        );

      case 'select':
        return (
          <select
            value={groupValue || ''}
            onChange={(e) => handleSelectChange(group.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{group.placeholder || '선택하세요'}</option>
            {group.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
                {option.count !== undefined && ` (${option.count})`}
              </option>
            ))}
          </select>
        );

      case 'date': {
        const dateValue = groupValue || {};
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">시작일</label>
              <div className="relative">
                <input
                  type="date"
                  value={dateValue.start || ''}
                  onChange={(e) => handleDateChange(group.id, 'start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                />
                <Calendar size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">종료일</label>
              <div className="relative">
                <input
                  type="date"
                  value={dateValue.end || ''}
                  onChange={(e) => handleDateChange(group.id, 'end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                />
                <Calendar size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        );
      }

      case 'range': {
        const rangeValue = groupValue || {};
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">최소값</label>
              <input
                type="number"
                value={rangeValue.min || ''}
                onChange={(e) => handleRangeChange(group.id, 'min', Number(e.target.value))}
                min={group.min}
                max={group.max}
                placeholder={group.min?.toString()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">최대값</label>
              <input
                type="number"
                value={rangeValue.max || ''}
                onChange={(e) => handleRangeChange(group.id, 'max', Number(e.target.value))}
                min={group.min}
                max={group.max}
                placeholder={group.max?.toString()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-600" />
            <h3 className="font-medium text-gray-900">{title}</h3>
            {showActiveCount && activeFiltersCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={onReset}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                초기화
              </button>
            )}
            {collapsible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Groups */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {groups.map((group) => (
            <div key={group.id}>
              <h4 className="font-medium text-gray-900 mb-3">{group.label}</h4>
              {renderFilterGroup(group)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterPanel; 