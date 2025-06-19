import React, { useState, useMemo } from 'react';
import { 
  FolderTree, 
  Folder, 
  FolderOpen, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Grip,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { AssessmentCategory } from '../../types/assessment';

interface CategoryTreeProps {
  categories: AssessmentCategory[];
  searchTerm: string;
  onAction: (action: string, categoryId?: string) => void;
}

interface CategoryNodeProps {
  category: AssessmentCategory;
  level: number;
  isExpanded: boolean;
  onToggle: (categoryId: string) => void;
  onAction: (action: string, categoryId: string) => void;
  searchTerm: string;
}

function CategoryNode({ 
  category, 
  level, 
  isExpanded, 
  onToggle, 
  onAction, 
  searchTerm 
}: CategoryNodeProps) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);

  const hasChildren = category.children && category.children.length > 0;
  
  // 검색어 하이라이트
  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== category.name) {
      // TODO: 실제 저장 로직
      console.log('Saving category name:', editName);
    }
    setIsEditing(false);
    setEditName(category.name);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(category.name);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="select-none">
      {/* 카테고리 노드 */}
      <div
        className={`group flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 ${
          showActions ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
        }`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* 드래그 핸들 */}
        <div className={`opacity-0 group-hover:opacity-100 transition-opacity cursor-grab ${showActions ? 'opacity-100' : ''}`}>
          <Grip className="h-4 w-4 text-gray-400" />
        </div>

        {/* 펼치기/접기 버튼 */}
        <button
          onClick={() => onToggle(category.id)}
          className={`flex-shrink-0 p-1 rounded transition-colors ${
            hasChildren 
              ? 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400' 
              : 'text-transparent cursor-default'
          }`}
          disabled={!hasChildren}
        >
          {hasChildren && (
            isExpanded ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* 폴더 아이콘 */}
        <div className="flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-5 w-5 text-blue-500" />
            ) : (
              <Folder className="h-5 w-5 text-blue-500" />
            )
          ) : (
            <div 
              className="w-5 h-5 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: category.color + '20' }}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
            </div>
          )}
        </div>

        {/* 카테고리 이름 */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyPress={handleKeyPress}
              className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-blue-500 rounded focus:outline-none"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {highlightText(category.name, searchTerm)}
              </span>
              {!category.isActive && (
                <EyeOff className="h-4 w-4 text-gray-400" title="비활성화됨" />
              )}
            </div>
          )}
          
          {category.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
              {highlightText(category.description, searchTerm)}
            </p>
          )}
        </div>

        {/* 통계 정보 */}
        <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
          {/* TODO: 실제 통계 데이터 */}
          <span>12개 항목</span>
        </div>

        {/* 액션 버튼들 */}
        <div className={`flex items-center gap-1 transition-opacity ${
          showActions ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={() => onAction('add-child', category.id)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
            title="하위 카테고리 추가"
          >
            <Plus className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
            title="이름 수정"
          >
            <Edit className="h-4 w-4" />
          </button>

          <button
            onClick={() => onAction('duplicate', category.id)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
            title="복사"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={() => onAction('toggle-active', category.id)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
            title={category.isActive ? '비활성화' : '활성화'}
          >
            {category.isActive ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={() => onAction('delete', category.id)}
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400"
            title="삭제"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 하위 카테고리들 */}
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              level={level + 1}
              isExpanded={isExpanded}
              onToggle={onToggle}
              onAction={onAction}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryTree({ categories, searchTerm, onAction }: CategoryTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // 검색어가 있을 때 자동으로 모든 노드 펼치기
  const shouldAutoExpand = searchTerm.length > 0;

  // 펼쳐진 상태 토글
  const handleToggle = (categoryId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  // 검색 필터링
  const filterCategories = (categories: AssessmentCategory[]): AssessmentCategory[] => {
    if (!searchTerm) return categories;

    return categories.filter(category => {
      const matchesSearch = 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 하위 카테고리 중에 매치되는 것이 있는지 확인
      const hasMatchingChildren = category.children && 
        filterCategories(category.children).length > 0;

      return matchesSearch || hasMatchingChildren;
    }).map(category => ({
      ...category,
      children: category.children ? filterCategories(category.children) : undefined
    }));
  };

  const filteredCategories = useMemo(() => filterCategories(categories), [categories, searchTerm]);


  // 모두 펼치기/접기
  const handleExpandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (categories: AssessmentCategory[]) => {
      categories.forEach(category => {
        if (category.children && category.children.length > 0) {
          allIds.add(category.id);
          collectIds(category.children);
        }
      });
    };
    collectIds(categories);
    setExpandedNodes(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">
            카테고리 트리
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({filteredCategories.length}개)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExpandAll}
            className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            모두 펼치기
          </button>
          <button
            onClick={handleCollapseAll}
            className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            모두 접기
          </button>
          <button
            onClick={() => onAction('create')}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            새 카테고리
          </button>
        </div>
      </div>

      {/* 트리 내용 */}
      <div className="p-4">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8">
            <FolderTree className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              카테고리가 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm 
                ? '검색 조건에 맞는 카테고리가 없습니다.'
                : '첫 번째 카테고리를 만들어보세요.'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => onAction('create')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                새 카테고리 만들기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredCategories.map((category) => (
              <CategoryNode
                key={category.id}
                category={category}
                level={0}
                isExpanded={shouldAutoExpand || expandedNodes.has(category.id)}
                onToggle={handleToggle}
                onAction={onAction}
                searchTerm={searchTerm}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 