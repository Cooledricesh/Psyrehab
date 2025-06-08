# Filter Components

PsyRehab 플랫폼의 데이터 필터링 및 검색을 위한 컴포넌트 라이브러리입니다.

## 컴포넌트 목록

### SearchBar
자동완성 기능이 있는 검색 입력 컴포넌트입니다.

```tsx
import { SearchBar } from '@/components/filters';

const suggestions = [
  { id: '1', title: '김영희', subtitle: '환자', category: '환자' },
  { id: '2', title: '인지 훈련', subtitle: '목표 유형', category: '목표' },
];

<SearchBar
  placeholder="환자, 목표, 세션 검색..."
  value={searchQuery}
  onChange={setSearchQuery}
  onSearch={handleSearch}
  suggestions={suggestions}
  debounceMs={300}
/>
```

**Props:**
- `value` (required): 현재 검색 값
- `onChange` (required): 값 변경 핸들러
- `placeholder`: 플레이스홀더 텍스트
- `onSearch`: 검색 실행 핸들러
- `suggestions`: 자동완성 제안 목록
- `showSuggestions`: 제안 표시 여부 (기본값: true)
- `debounceMs`: 디바운스 지연 시간 (기본값: 300ms)
- `disabled`: 비활성화 상태

**SearchSuggestion 인터페이스:**
```tsx
interface SearchSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
}
```

### FilterPanel
다양한 필터 옵션을 제공하는 패널 컴포넌트입니다.

```tsx
import { FilterPanel } from '@/components/filters';

const filterGroups = [
  {
    id: 'status',
    label: '상태',
    type: 'checkbox',
    options: [
      { value: 'active', label: '활성', count: 45 },
      { value: 'inactive', label: '비활성', count: 12 },
    ],
  },
  {
    id: 'dateRange',
    label: '기간',
    type: 'date',
  },
  {
    id: 'ageRange',
    label: '연령대',
    type: 'range',
    min: 18,
    max: 80,
  },
];

<FilterPanel
  groups={filterGroups}
  values={filterValues}
  onChange={handleFilterChange}
  onReset={handleFilterReset}
  title="고급 필터"
  collapsible={true}
/>
```

**Props:**
- `groups` (required): 필터 그룹 배열
- `values` (required): 현재 필터 값들
- `onChange` (required): 값 변경 핸들러
- `onReset` (required): 초기화 핸들러
- `title`: 패널 제목 (기본값: '필터')
- `collapsible`: 접기/펼치기 가능 여부
- `defaultExpanded`: 기본 펼침 상태
- `showActiveCount`: 활성 필터 수 표시 여부

**필터 타입:**

#### Checkbox
```tsx
{
  id: 'categories',
  label: '카테고리',
  type: 'checkbox',
  options: [
    { value: 'option1', label: '옵션 1', count: 10 },
    { value: 'option2', label: '옵션 2', count: 5 },
  ],
}
```

#### Radio
```tsx
{
  id: 'priority',
  label: '우선순위',
  type: 'radio',
  options: [
    { value: 'high', label: '높음' },
    { value: 'medium', label: '보통' },
    { value: 'low', label: '낮음' },
  ],
}
```

#### Select
```tsx
{
  id: 'department',
  label: '부서',
  type: 'select',
  placeholder: '부서를 선택하세요',
  options: [
    { value: 'dept1', label: '부서 1' },
    { value: 'dept2', label: '부서 2' },
  ],
}
```

#### Date Range
```tsx
{
  id: 'period',
  label: '기간',
  type: 'date',
}
// 값: { start: '2024-01-01', end: '2024-12-31' }
```

#### Number Range
```tsx
{
  id: 'age',
  label: '연령',
  type: 'range',
  min: 0,
  max: 100,
}
// 값: { min: 20, max: 65 }
```

### QuickFilters
빠른 필터링을 위한 버튼 컴포넌트입니다.

```tsx
import { QuickFilters } from '@/components/filters';

const quickFilters = [
  {
    id: 'active-patients',
    label: '활성 환자',
    color: 'green',
    count: 45,
    filters: { status: ['active'] },
  },
  {
    id: 'high-priority',
    label: '높은 우선순위',
    color: 'red',
    count: 12,
    filters: { priority: ['high'] },
  },
];

<QuickFilters
  filters={quickFilters}
  activeFilters={activeQuickFilters}
  onFilterToggle={handleQuickFilterToggle}
  onClearAll={handleClearAll}
  title="빠른 필터"
/>
```

**Props:**
- `filters` (required): 빠른 필터 배열
- `activeFilters`: 활성화된 필터 ID 배열
- `onFilterToggle` (required): 필터 토글 핸들러
- `onClearAll`: 전체 해제 핸들러
- `title`: 제목 (기본값: '빠른 필터')
- `showClearAll`: 전체 해제 버튼 표시 여부

**QuickFilter 인터페이스:**
```tsx
interface QuickFilter {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  filters: Record<string, any>;
}
```

## 사용 패턴

### 기본 필터링 시스템 구성

```tsx
import React, { useState } from 'react';
import { SearchBar, FilterPanel, QuickFilters } from '@/components/filters';

const FilterExample = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [activeQuickFilters, setActiveQuickFilters] = useState([]);

  const handleFilterChange = (filterId, value) => {
    setFilterValues(prev => ({ ...prev, [filterId]: value }));
  };

  const handleFilterReset = () => {
    setFilterValues({});
    setActiveQuickFilters([]);
  };

  const handleQuickFilterToggle = (filterId, filters) => {
    if (activeQuickFilters.includes(filterId)) {
      // 필터 제거
      setActiveQuickFilters(prev => prev.filter(id => id !== filterId));
      const newValues = { ...filterValues };
      Object.keys(filters).forEach(key => {
        delete newValues[key];
      });
      setFilterValues(newValues);
    } else {
      // 필터 적용
      setActiveQuickFilters(prev => [...prev, filterId]);
      setFilterValues(prev => ({ ...prev, ...filters }));
    }
  };

  return (
    <div className="space-y-6">
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="검색..."
      />
      
      <QuickFilters
        filters={quickFilters}
        activeFilters={activeQuickFilters}
        onFilterToggle={handleQuickFilterToggle}
        onClearAll={() => {
          setActiveQuickFilters([]);
          setFilterValues({});
        }}
      />
      
      <FilterPanel
        groups={filterGroups}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
      />
    </div>
  );
};
```

## 접근성

모든 필터 컴포넌트는 웹 접근성을 고려하여 설계되었습니다:

- 키보드 네비게이션 지원
- ARIA 라벨 및 속성 적용
- 스크린 리더 호환성
- 적절한 색상 대비
- 포커스 관리

## 성능 최적화

- 검색 입력 디바운싱
- 메모이제이션을 통한 재렌더링 최소화
- 가상화를 통한 대량 옵션 처리
- 지연 로딩

## 테스트

```bash
npm test src/components/filters
```

각 컴포넌트는 포괄적인 단위 테스트를 포함합니다. 