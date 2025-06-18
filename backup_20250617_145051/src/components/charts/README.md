# Chart Components

PsyRehab 플랫폼의 데이터 시각화를 위한 차트 컴포넌트 라이브러리입니다.

## 컴포넌트 목록

### LineChart
시계열 데이터나 트렌드를 표시하는 선형 차트입니다.

```tsx
import { LineChart } from '@/components/charts';

const data = {
  labels: ['1월', '2월', '3월', '4월', '5월'],
  datasets: [{
    label: '목표 달성률',
    data: [65, 59, 80, 81, 56],
    borderColor: 'rgb(59, 130, 246)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  }]
};

<LineChart 
  data={data}
  title="월별 목표 달성률"
  height={300}
/>
```

**Props:**
- `data` (required): Chart.js 데이터 객체
- `title`: 차트 제목
- `height`: 차트 높이 (기본값: 300)
- `loading`: 로딩 상태 표시

### BarChart
카테고리별 데이터 비교를 위한 막대 차트입니다.

```tsx
import { BarChart } from '@/components/charts';

const data = {
  labels: ['인지 훈련', '사회 기술', '일상 생활', '직업 훈련'],
  datasets: [{
    label: '완료된 목표',
    data: [12, 19, 3, 5],
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
  }]
};

<BarChart 
  data={data}
  title="목표 유형별 완료 현황"
  orientation="vertical"
/>
```

**Props:**
- `data` (required): Chart.js 데이터 객체
- `title`: 차트 제목
- `orientation`: 'vertical' | 'horizontal' (기본값: 'vertical')
- `stacked`: 스택형 차트 여부
- `height`: 차트 높이

### PieChart
비율이나 구성을 보여주는 원형 차트입니다.

```tsx
import { PieChart } from '@/components/charts';

const data = {
  labels: ['완료', '진행중', '보류'],
  datasets: [{
    data: [300, 50, 100],
    backgroundColor: [
      '#10B981',
      '#F59E0B', 
      '#EF4444'
    ],
  }]
};

<PieChart 
  data={data}
  title="목표 상태 분포"
  showPercentages={true}
  donut={false}
/>
```

**Props:**
- `data` (required): Chart.js 데이터 객체
- `title`: 차트 제목
- `donut`: 도넛 차트 형태 여부 (기본값: false)
- `showPercentages`: 퍼센트 표시 여부 (기본값: true)
- `height`: 차트 높이

### KPICard
핵심 성과 지표를 표시하는 카드 컴포넌트입니다.

```tsx
import { KPICard } from '@/components/charts';
import { Users } from 'lucide-react';

<KPICard
  title="총 환자 수"
  value={150}
  previousValue={135}
  suffix=" 명"
  color="blue"
  size="md"
  icon={<Users size={24} />}
/>
```

**Props:**
- `title` (required): 지표 제목
- `value` (required): 현재 값
- `previousValue`: 이전 값 (트렌드 계산용)
- `formatValue`: 값 포맷팅 함수
- `prefix`: 값 앞에 붙는 텍스트
- `suffix`: 값 뒤에 붙는 텍스트
- `trend`: 'up' | 'down' | 'neutral'
- `trendValue`: 트렌드 백분율
- `icon`: 아이콘 컴포넌트
- `color`: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: 로딩 상태

## 유틸리티 함수

### formatNumber
숫자를 읽기 쉬운 형태로 포맷팅합니다.

```tsx
import { formatNumber } from '@/components/charts';

formatNumber(1234567); // "1,234,567"
formatNumber("1234.56"); // "1,234.56"
```

### formatCurrency
통화 형태로 포맷팅합니다.

```tsx
import { formatCurrency } from '@/components/charts';

formatCurrency(1234.56); // "$1,234.56"
formatCurrency(1234.56, 'KRW'); // "₩1,235"
```

### formatPercentage
백분율로 포맷팅합니다.

```tsx
import { formatPercentage } from '@/components/charts';

formatPercentage(0.1234); // "12.34%"
formatPercentage(85); // "85%"
```

## 스타일링

모든 차트 컴포넌트는 Tailwind CSS를 사용하여 스타일링되며, 다크 모드를 지원합니다.

### 색상 팔레트
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Danger: Red (#EF4444)
- Info: Purple (#8B5CF6)
- Neutral: Gray (#6B7280)

## 접근성

모든 컴포넌트는 웹 접근성 가이드라인을 준수합니다:

- ARIA 라벨 및 역할 속성
- 키보드 네비게이션 지원
- 스크린 리더 호환성
- 적절한 색상 대비 (4.5:1 이상)

## 성능 최적화

- Chart.js의 지연 로딩
- 메모이제이션을 통한 불필요한 재렌더링 방지
- 애니메이션 최적화
- 반응형 디자인

## 테스트

각 컴포넌트는 포괄적인 단위 테스트를 포함합니다:

```bash
npm test src/components/charts
```

## 예제

전체 사용 예제는 `src/pages/Dashboard.tsx`에서 확인할 수 있습니다. 