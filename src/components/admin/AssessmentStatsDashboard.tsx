import React, { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  AssessmentStatistics, 
  AssessmentCategory, 
  AssessmentOption,
  AssessmentType 
} from '../../types/assessment';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  FileText,
  Activity,
  Zap,
  Percent,
  Download,
  Filter,
  RefreshCw,
  ChevronDown,
  Eye,
  Star,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';

interface AssessmentStatsDashboardProps {
  statistics: AssessmentStatistics;
  categories: AssessmentCategory[];
  options: AssessmentOption[];
  dateRange: {
    start: Date;
    end: Date;
  };
  onDateRangeChange: (start: Date, end: Date) => void;
  onRefresh: () => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ title, value, change, changeLabel, icon: Icon, color, trend }: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{Math.abs(change)}%</span>
              {changeLabel && <span className="text-gray-500 dark:text-gray-400">{changeLabel}</span>}
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

interface TopPerformersProps {
  title: string;
  items: Array<{
    id: string;
    name: string;
    value: number;
    change?: number;
    category?: string;
    color?: string;
  }>;
  metric: string;
}

function TopPerformers({ title, items, metric }: TopPerformersProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        <Award className="h-5 w-5 text-yellow-500" />
      </div>
      
      <div className="space-y-4">
        {items.slice(0, 5).map((item, index) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.name}
                </p>
                {item.category && (
                  <div className="flex items-center gap-1 mt-1">
                    {item.color && (
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.category}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {item.value.toLocaleString()}{metric}
              </p>
              {item.change !== undefined && (
                <div className={`flex items-center gap-1 text-xs ${
                  item.change >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {item.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{Math.abs(item.change)}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChartProps {
  title: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  type: 'bar' | 'line' | 'pie';
}

function SimpleChart({ title, data, type }: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h3>
      
      {type === 'bar' && (
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-20 text-sm text-gray-600 dark:text-gray-400 truncate">
                {item.label}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: item.color || '#3B82F6'
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {type === 'pie' && (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)` }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {item.value} ({Math.round((item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssessmentStatsDashboard({ 
  statistics, 
  categories, 
  options, 
  dateRange, 
  onDateRangeChange, 
  onRefresh 
}: AssessmentStatsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [isLoading, setIsLoading] = useState(false);

  // 기간 변경 핸들러
  const handlePeriodChange = (period: typeof selectedPeriod) => {
    setSelectedPeriod(period);
    
    if (period !== 'custom') {
      const days = parseInt(period);
      const end = endOfDay(new Date());
      const start = startOfDay(subDays(end, days));
      onDateRangeChange(start, end);
    }
  };

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await onRefresh();
    } finally {
      setIsLoading(false);
    }
  };

  // 카테고리별 통계 계산
  const categoryStats = useMemo(() => {
    return categories.map(category => {
      const categoryOptions = options.filter(o => o.categoryId === category.id);
      const totalUsage = categoryOptions.reduce((sum, o) => sum + o.usageCount, 0);
      
      return {
        id: category.id,
        name: category.name,
        value: totalUsage,
        change: Math.random() > 0.5 ? Math.floor(Math.random() * 20) : -Math.floor(Math.random() * 20),
        category: '카테고리',
        color: category.color
      };
    }).sort((a, b) => b.value - a.value);
  }, [categories, options]);

  // 타입별 분포 계산
  const typeDistribution = useMemo(() => {
    const distribution = new Map<AssessmentType, number>();
    
    options.forEach(option => {
      distribution.set(option.type, (distribution.get(option.type) || 0) + 1);
    });

    return Array.from(distribution.entries()).map(([type, count]) => ({
      label: type.replace('_', ' '),
      value: count,
      color: `hsl(${Array.from(distribution.keys()).indexOf(type) * 60}, 70%, 50%)`
    }));
  }, [options]);

  // 사용률 높은 옵션들
  const topOptions = useMemo(() => {
    return options
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(option => {
        const category = categories.find(c => c.id === option.categoryId);
        return {
          id: option.id,
          name: option.name,
          value: option.usageCount,
          change: Math.random() > 0.5 ? Math.floor(Math.random() * 30) : -Math.floor(Math.random() * 30),
          category: category?.name,
          color: category?.color
        };
      });
  }, [options, categories]);

  return (
    <div className="space-y-6">
      {/* 상단 컨트롤 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">평가 통계</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {format(dateRange.start, 'yyyy.MM.dd', { locale: ko })} - {format(dateRange.end, 'yyyy.MM.dd', { locale: ko })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 기간 선택 */}
          <div className="flex items-center gap-2">
            {[
              { value: '7d', label: '7일' },
              { value: '30d', label: '30일' },
              { value: '90d', label: '90일' },
            ].map(period => (
              <button
                key={period.value}
                onClick={() => handlePeriodChange(period.value as typeof selectedPeriod)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  selectedPeriod === period.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* 새로고침 */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>

          {/* 내보내기 */}
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            내보내기
          </button>
        </div>
      </div>

      {/* 주요 지표 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="총 평가 완료"
          value={statistics.totalAssessments.toLocaleString()}
          change={12}
          changeLabel="vs 지난 기간"
          icon={CheckCircle}
          color="bg-green-500"
          trend="up"
        />
        
        <StatCard
          title="활성 사용자"
          value={statistics.activeUsers.toLocaleString()}
          change={8}
          changeLabel="vs 지난 기간"
          icon={Users}
          color="bg-blue-500"
          trend="up"
        />
        
        <StatCard
          title="평균 완료율"
          value={`${Math.round(statistics.completionRate * 100)}%`}
          change={-3}
          changeLabel="vs 지난 기간"
          icon={Target}
          color="bg-purple-500"
          trend="down"
        />
        
        <StatCard
          title="평균 소요시간"
          value={`${Math.round(statistics.avgDuration / 60)}분`}
          change={5}
          changeLabel="vs 지난 기간"
          icon={Clock}
          color="bg-orange-500"
          trend="neutral"
        />
      </div>

      {/* 차트 및 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 사용률 */}
        <SimpleChart
          title="카테고리별 사용률"
          data={categoryStats.slice(0, 8)}
          type="bar"
        />

        {/* 질문 타입 분포 */}
        <SimpleChart
          title="질문 타입 분포"
          data={typeDistribution}
          type="pie"
        />
      </div>

      {/* 상위 성과 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 인기 카테고리 */}
        <TopPerformers
          title="인기 카테고리"
          items={categoryStats}
          metric="회"
        />

        {/* 자주 사용되는 옵션 */}
        <TopPerformers
          title="자주 사용되는 옵션"
          items={topOptions}
          metric="회"
        />
      </div>

      {/* 상세 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">응답 품질</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">완전한 응답</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">87%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">부분 응답</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">10%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">무응답</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">3%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">성능 지표</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">페이지 로드 시간</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">1.2초</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">응답 저장 속도</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">0.3초</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">오류율</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">0.1%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ThumbsUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">사용자 만족도</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">평균 평점</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">4.6</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">피드백 수</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">124개</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">추천율</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">92%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 