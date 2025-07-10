import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Play, 
  CheckCircle, 
  X, 
  AlertCircle 
} from 'lucide-react';
import { AccessibleIcon } from '@/components/ui/accessible-icon';
import { cn } from '@/lib/utils';
import { GoalStatus } from '@/types/goals';

interface GoalStatusBadgeProps {
  status: GoalStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const GoalStatusBadge: React.FC<GoalStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className
}) => {
  const getStatusConfig = (status: GoalStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: '대기',
          icon: Clock,
          iconLabel: '대기 중인 목표',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        };
      case 'active':
        return {
          label: '진행 중',
          icon: Play,
          iconLabel: '진행 중인 목표',
          variant: 'default' as const,
          className: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        };
      case 'completed':
        return {
          label: '완료',
          icon: CheckCircle,
          iconLabel: '완료된 목표',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-700 hover:bg-green-200'
        };
      case 'deleted':
        return {
          label: '삭제됨',
          icon: X,
          iconLabel: '삭제된 목표',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-700 hover:bg-red-200'
        };
      default:
        return {
          label: '알 수 없음',
          icon: AlertCircle,
          iconLabel: '알 수 없는 상태',
          variant: 'outline' as const,
          className: 'bg-gray-50 text-gray-500'
        };
    }
  };

  const config = getStatusConfig(status);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        config.className,
        sizeClasses[size],
        'inline-flex items-center gap-1.5 font-medium transition-colors',
        className
      )}
      role="status"
      aria-label={`목표 상태: ${config.label}`}
    >
      {showIcon && (
        <AccessibleIcon 
          icon={config.icon} 
          label={config.iconLabel}
          size={iconSizes[size]}
          decorative={true} // Icon is decorative since the text provides the same information
        />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}; 