import React from 'react';

export interface KPICardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  formatValue?: (value: number | string) => string;
  prefix?: string;
  suffix?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  previousValue,
  formatValue,
  prefix = '',
  suffix = '',
  trend,
  trendValue,
  icon,
  color = 'blue',
  size = 'md',
  loading = false,
  className = '',
}) => {
  // Format the main value
  const formattedValue = formatValue ? formatValue(value) : value.toString();
  
  // Calculate trend if not provided but previousValue exists
  const calculatedTrend = trend || (
    previousValue !== undefined && typeof value === 'number'
      ? value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral'
      : undefined
  );
  
  // Calculate trend percentage if not provided
  const calculatedTrendValue = trendValue || (
    previousValue !== undefined && typeof value === 'number' && previousValue !== 0
      ? Math.abs(((value - previousValue) / previousValue) * 100)
      : undefined
  );

  // Color classes
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      accent: 'text-blue-600',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      accent: 'text-green-600',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      accent: 'text-red-600',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      accent: 'text-yellow-600',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      accent: 'text-purple-600',
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: 'text-gray-600',
      accent: 'text-gray-600',
    },
  };

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'p-4',
      title: 'text-sm',
      value: 'text-xl',
      icon: 'w-6 h-6',
      trend: 'text-xs',
    },
    md: {
      container: 'p-6',
      title: 'text-sm',
      value: 'text-2xl',
      icon: 'w-8 h-8',
      trend: 'text-sm',
    },
    lg: {
      container: 'p-8',
      title: 'text-base',
      value: 'text-3xl',
      icon: 'w-10 h-10',
      trend: 'text-base',
    },
  };

  // Trend classes
  const trendClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  const currentColorClasses = colorClasses[color];
  const currentSizeClasses = sizeClasses[size];

  if (loading) {
    return (
      <div className={`
        bg-white rounded-lg border ${currentColorClasses.border} 
        ${currentSizeClasses.container} ${className}
        animate-pulse
      `}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          {icon && <div className={`${currentSizeClasses.icon} bg-gray-200 rounded`}></div>}
        </div>
        <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
      </div>
    );
  }

  return (
    <div className={`
      bg-white rounded-lg border ${currentColorClasses.border} 
      ${currentSizeClasses.container} ${className}
      hover:shadow-md transition-shadow duration-200
    `}>
      {/* Header with title and icon */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`
          font-medium text-gray-700 
          ${currentSizeClasses.title}
        `}>
          {title}
        </h3>
        {icon && (
          <div className={`
            ${currentColorClasses.icon} 
            ${currentSizeClasses.icon}
          `}>
            {icon}
          </div>
        )}
      </div>

      {/* Main value */}
      <div className={`
        font-bold text-gray-900 mb-2
        ${currentSizeClasses.value}
      `}>
        {prefix}{formattedValue}{suffix}
      </div>

      {/* Trend indicator */}
      {calculatedTrend && (
        <div className={`
          flex items-center gap-1
          ${currentSizeClasses.trend}
          ${trendClasses[calculatedTrend]}
        `}>
          {/* Trend arrow */}
          <span className="inline-flex items-center">
            {calculatedTrend === 'up' && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {calculatedTrend === 'down' && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {calculatedTrend === 'neutral' && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </span>
          
          {/* Trend value */}
          {calculatedTrendValue !== undefined && (
            <span>
              {calculatedTrendValue.toFixed(1)}%
            </span>
          )}
          
          {/* Trend text */}
          <span className="text-gray-600">
            {calculatedTrend === 'up' ? 'increase' : 
             calculatedTrend === 'down' ? 'decrease' : 
             'no change'}
          </span>
        </div>
      )}
    </div>
  );
};

// Helper function to format numbers with commas
export const formatNumber = (value: number | string): string => {
  if (typeof value === 'string') return value;
  return new Intl.NumberFormat().format(value);
};

// Helper function to format currency
export const formatCurrency = (value: number | string, currency = 'USD'): string => {
  if (typeof value === 'string') return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
};

// Helper function to format percentage
export const formatPercentage = (value: number | string): string => {
  if (typeof value === 'string') return value;
  return `${value.toFixed(1)}%`;
};

export default KPICard; 