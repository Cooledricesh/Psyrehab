import React from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { UserRole } from '../../types/auth';

export interface UserFilters {
  search: string;
  role: UserRole | '';
  status: 'active' | 'inactive' | '';
  department: string;
  sortBy: 'name' | 'email' | 'created_at' | 'last_active';
  sortOrder: 'asc' | 'desc';
}

interface UserFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  totalUsers: number;
  filteredUsers: number;
}

const departments = [
  'IT',
  '의료진',
  '재활치료팀',
  '행정팀',
  '연구팀',
  '고객지원',
  '마케팅',
  '인사팀'
];

const roleLabels: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: '최고 관리자',
  [UserRole.ADMIN]: '관리자',
  [UserRole.THERAPIST]: '치료사',
  [UserRole.MANAGER]: '매니저',
  [UserRole.USER]: '사용자',
  [UserRole.GUEST]: '게스트'
};

const sortLabels = {
  name: '이름',
  email: '이메일',
  created_at: '생성일',
  last_active: '최근 활동'
};

export default function UserFilters({
  filters,
  onFiltersChange,
  totalUsers,
  filteredUsers
}: UserFiltersProps) {
  const updateFilter = (key: keyof UserFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      role: '',
      status: '',
      department: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const hasActiveFilters = filters.search || filters.role || filters.status || filters.department;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="이름, 이메일로 검색..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Role Filter */}
        <div className="relative">
          <select
            value={filters.role}
            onChange={(e) => updateFilter('role', e.target.value)}
            className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
          >
            <option value="">모든 역할</option>
            {Object.values(UserRole).map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
          >
            <option value="">모든 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Department Filter */}
        <div className="relative">
          <select
            value={filters.department}
            onChange={(e) => updateFilter('department', e.target.value)}
            className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
          >
            <option value="">모든 부서</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
            >
              {Object.entries(sortLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <button
            onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={filters.sortOrder === 'asc' ? '오름차순' : '내림차순'}
          >
            <div className="flex flex-col h-4 w-4">
              <div className={`h-0 w-0 border-l-2 border-r-2 border-transparent border-b-2 ${
                filters.sortOrder === 'asc' ? 'border-b-blue-500' : 'border-b-gray-400'
              }`} />
              <div className={`h-0 w-0 border-l-2 border-r-2 border-transparent border-t-2 ${
                filters.sortOrder === 'desc' ? 'border-t-blue-500' : 'border-t-gray-400'
              }`} />
            </div>
          </button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
            필터 초기화
          </button>
        )}
      </div>

      {/* Results Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>
              전체 {totalUsers}명 중 {filteredUsers}명 표시
            </span>
          </div>
          
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400">필터 적용됨:</span>
              <div className="flex flex-wrap gap-1">
                {filters.search && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs">
                    검색: "{filters.search}"
                    <button
                      onClick={() => updateFilter('search', '')}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.role && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs">
                    역할: {roleLabels[filters.role as UserRole]}
                    <button
                      onClick={() => updateFilter('role', '')}
                      className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.status && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded text-xs">
                    상태: {filters.status === 'active' ? '활성' : '비활성'}
                    <button
                      onClick={() => updateFilter('status', '')}
                      className="hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.department && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs">
                    부서: {filters.department}
                    <button
                      onClick={() => updateFilter('department', '')}
                      className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 