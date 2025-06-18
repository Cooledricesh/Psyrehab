import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  AssessmentOption, 
  AssessmentCategory, 
  AssessmentType 
} from '../../types/assessment';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  MoreVertical,
  Calendar,
  User,
  BarChart3,
  Hash,
  Type,
  List,
  ToggleLeft,
  Upload,
  PenTool,
  Grid3x3,
  ArrowUpDown,
  Clock,
  FileText,
  Search,
  Filter,
  ChevronDown,
  CheckCircle,
  Circle,
  AlertCircle
} from 'lucide-react';

interface AssessmentOptionsListProps {
  options: AssessmentOption[];
  categories: AssessmentCategory[];
  searchTerm: string;
  selectedCategory: string;
  onAction: (action: string, optionId?: string) => void;
}

interface OptionCardProps {
  option: AssessmentOption;
  category: AssessmentCategory | undefined;
  onAction: (action: string, optionId: string) => void;
}

// 평가 타입별 아이콘과 라벨
const assessmentTypeConfig = {
  [AssessmentType.MULTIPLE_CHOICE]: {
    icon: CheckCircle,
    label: '객관식 (복수선택)',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  },
  [AssessmentType.SINGLE_CHOICE]: {
    icon: Circle,
    label: '객관식 (단일선택)',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  },
  [AssessmentType.SCALE]: {
    icon: BarChart3,
    label: '척도',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
  },
  [AssessmentType.TEXT]: {
    icon: Type,
    label: '텍스트',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  },
  [AssessmentType.NUMERIC]: {
    icon: Hash,
    label: '숫자',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
  },
  [AssessmentType.BOOLEAN]: {
    icon: ToggleLeft,
    label: '예/아니오',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
  },
  [AssessmentType.DATE]: {
    icon: Calendar,
    label: '날짜',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  },
  [AssessmentType.TIME]: {
    icon: Clock,
    label: '시간',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400'
  },
  [AssessmentType.FILE_UPLOAD]: {
    icon: Upload,
    label: '파일 업로드',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
  },
  [AssessmentType.SIGNATURE]: {
    icon: PenTool,
    label: '서명',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400'
  },
  [AssessmentType.DRAWING]: {
    icon: PenTool,
    label: '그림 그리기',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400'
  },
  [AssessmentType.MATRIX]: {
    icon: Grid3x3,
    label: '매트릭스',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
  },
  [AssessmentType.RANKING]: {
    icon: ArrowUpDown,
    label: '순위 매기기',
    color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400'
  }
};

function OptionCard({ option, category, onAction }: OptionCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const typeConfig = assessmentTypeConfig[option.type];
  const TypeIcon = typeConfig.icon;

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* 카드 헤더 */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* 제목과 상태 */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                {option.name}
              </h3>
              {!option.isActive && (
                <EyeOff className="h-4 w-4 text-gray-400" title="비활성화됨" />
              )}
              {option.isRequired && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded">
                  필수
                </span>
              )}
            </div>

            {/* 설명 */}
            {option.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {option.description}
              </p>
            )}

            {/* 메타 정보 */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <TypeIcon className="h-3 w-3" />
                <span className={`px-2 py-1 rounded-full ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
              </div>
              
              {category && (
                <div className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                <span>{option.usageCount}회 사용</span>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className={`flex items-center gap-1 transition-opacity ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              title="미리보기"
            >
              <Eye className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onAction('edit', option.id)}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              title="수정"
            >
              <Edit className="h-4 w-4" />
            </button>

            <button
              onClick={() => onAction('duplicate', option.id)}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              title="복사"
            >
              <Copy className="h-4 w-4" />
            </button>

            <button
              onClick={() => onAction('delete', option.id)}
              className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400"
              title="삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 설정 미리보기 */}
      {showPreview && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">설정 미리보기</h4>
          
          {/* 기본 설정 */}
          <div className="space-y-2 text-sm">
            {option.config.instructions && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">지시사항:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">{option.config.instructions}</span>
              </div>
            )}

            {/* 타입별 특별 설정 미리보기 */}
            {(option.type === AssessmentType.MULTIPLE_CHOICE || option.type === AssessmentType.SINGLE_CHOICE) && 
             option.config.choices && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">선택지:</span>
                <div className="ml-2 mt-1">
                  {option.config.choices.slice(0, 3).map((choice, index) => (
                    <div key={choice.id} className="text-gray-600 dark:text-gray-400">
                      {index + 1}. {choice.text}
                    </div>
                  ))}
                  {option.config.choices.length > 3 && (
                    <div className="text-gray-500 dark:text-gray-500">
                      ... 외 {option.config.choices.length - 3}개
                    </div>
                  )}
                </div>
              </div>
            )}

            {option.type === AssessmentType.SCALE && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">척도:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {option.config.scaleMin} - {option.config.scaleMax}
                  {option.config.scaleStep && ` (단위: ${option.config.scaleStep})`}
                </span>
              </div>
            )}

            {option.scoring.enabled && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">스코어링:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {option.scoring.type} 방식, 가중치 {option.scoring.weight}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 카드 푸터 */}
      <div className="p-4 pt-3">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{option.createdBy}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(option.createdAt), 'yyyy.MM.dd', { locale: ko })}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span>v{option.version}</span>
            {option.lastUsed && (
              <span>최근 사용: {format(new Date(option.lastUsed), 'MM.dd', { locale: ko })}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentOptionsList({ 
  options, 
  categories, 
  searchTerm, 
  selectedCategory, 
  onAction 
}: AssessmentOptionsListProps) {
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'usage_count' | 'type'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<AssessmentType | ''>('');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | ''>('');

  // 카테고리 ID를 이름으로 매핑
  const categoryMap = useMemo(() => {
    const map = new Map<string, AssessmentCategory>();
    
    const addToMap = (categories: AssessmentCategory[]) => {
      categories.forEach(category => {
        map.set(category.id, category);
        if (category.children) {
          addToMap(category.children);
        }
      });
    };
    
    addToMap(categories);
    return map;
  }, [categories]);

  // 필터링 및 정렬
  const filteredAndSortedOptions = useMemo(() => {
    let filtered = options;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 카테고리 필터링
    if (selectedCategory) {
      filtered = filtered.filter(option => option.categoryId === selectedCategory);
    }

    // 타입 필터링
    if (filterType) {
      filtered = filtered.filter(option => option.type === filterType);
    }

    // 상태 필터링
    if (filterStatus) {
      filtered = filtered.filter(option => 
        filterStatus === 'active' ? option.isActive : !option.isActive
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created_at':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'usage_count':
          comparison = a.usageCount - b.usageCount;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [options, searchTerm, selectedCategory, filterType, filterStatus, sortBy, sortOrder]);

  // 타입별 통계
  const typeStats = useMemo(() => {
    const stats = new Map<AssessmentType, number>();
    options.forEach(option => {
      stats.set(option.type, (stats.get(option.type) || 0) + 1);
    });
    return stats;
  }, [options]);

  return (
    <div className="space-y-6">
      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">전체 옵션</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{options.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">활성 옵션</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {options.filter(o => o.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">필수 옵션</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {options.filter(o => o.isRequired).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">평균 사용</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(options.reduce((sum, o) => sum + o.usageCount, 0) / options.length || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 고급 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 타입 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              질문 타입
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as AssessmentType | '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">모든 타입</option>
              {Object.entries(assessmentTypeConfig).map(([type, config]) => (
                <option key={type} value={type}>
                  {config.label} ({typeStats.get(type as AssessmentType) || 0})
                </option>
              ))}
            </select>
          </div>

          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              상태
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'active' | 'inactive' | '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">모든 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>

          {/* 정렬 기준 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              정렬 기준
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="created_at">생성일</option>
              <option value="name">이름</option>
              <option value="usage_count">사용횟수</option>
              <option value="type">타입</option>
            </select>
          </div>

          {/* 정렬 순서 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              정렬 순서
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="desc">내림차순</option>
              <option value="asc">오름차순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 옵션 목록 */}
      <div className="space-y-4">
        {filteredAndSortedOptions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              평가 옵션이 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              검색 조건에 맞는 평가 옵션이 없습니다.
            </p>
            <button
              onClick={() => onAction('create')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              새 평가 옵션 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSortedOptions.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                category={categoryMap.get(option.categoryId)}
                onAction={onAction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 