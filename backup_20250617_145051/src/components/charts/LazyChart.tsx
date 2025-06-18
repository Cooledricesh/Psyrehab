import React, { Suspense, lazy, memo } from 'react';

// Lazy load chart components
const LazyLineChart = lazy(() => import('./LineChart').then(module => ({ default: module.LineChart })));
const LazyBarChart = lazy(() => import('./BarChart').then(module => ({ default: module.BarChart })));
const LazyPieChart = lazy(() => import('./PieChart').then(module => ({ default: module.PieChart })));

// Loading skeleton component
const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-lg" style={{ height: `${height}px` }}>
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">차트 로딩 중...</div>
      </div>
    </div>
  </div>
);

// Memoized chart wrapper
interface LazyChartWrapperProps {
  children: React.ReactNode;
  height?: number;
  fallback?: React.ReactNode;
}

const LazyChartWrapper: React.FC<LazyChartWrapperProps> = memo(({ 
  children, 
  height = 300, 
  fallback 
}) => (
  <Suspense fallback={fallback || <ChartSkeleton height={height} />}>
    {children}
  </Suspense>
));

LazyChartWrapper.displayName = 'LazyChartWrapper';

// Optimized chart components with memoization
export const OptimizedLineChart = memo<React.ComponentProps<typeof LazyLineChart>>((props) => (
  <LazyChartWrapper height={props.height}>
    <LazyLineChart {...props} />
  </LazyChartWrapper>
));

OptimizedLineChart.displayName = 'OptimizedLineChart';

export const OptimizedBarChart = memo<React.ComponentProps<typeof LazyBarChart>>((props) => (
  <LazyChartWrapper height={props.height}>
    <LazyBarChart {...props} />
  </LazyChartWrapper>
));

OptimizedBarChart.displayName = 'OptimizedBarChart';

export const OptimizedPieChart = memo<React.ComponentProps<typeof LazyPieChart>>((props) => (
  <LazyChartWrapper height={props.height}>
    <LazyPieChart {...props} />
  </LazyChartWrapper>
));

OptimizedPieChart.displayName = 'OptimizedPieChart';

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options, hasIntersected]);

  return { isIntersecting, hasIntersected };
};

// Viewport-aware chart component
interface ViewportAwareChartProps {
  children: React.ReactNode;
  height?: number;
  className?: string;
}

export const ViewportAwareChart: React.FC<ViewportAwareChartProps> = memo(({ 
  children, 
  height = 300, 
  className = '' 
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const { hasIntersected } = useIntersectionObserver(ref, { threshold: 0.1 });

  return (
    <div ref={ref} className={className} style={{ minHeight: height }}>
      {hasIntersected ? children : <ChartSkeleton height={height} />}
    </div>
  );
});

ViewportAwareChart.displayName = 'ViewportAwareChart';

export default LazyChartWrapper; 