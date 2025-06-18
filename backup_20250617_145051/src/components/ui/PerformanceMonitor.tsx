import React, { useState, useEffect } from 'react';
import { Monitor, Cpu, HardDrive, Zap, X } from 'lucide-react';
import { useMemoryMonitor, useCacheManager } from '@/hooks/useOptimizedData';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  cacheSize: number;
  fps: number;
  loadTime: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    cacheSize: 0,
    fps: 0,
    loadTime: 0,
  });

  const memoryInfo = useMemoryMonitor();
  const cacheManager = useCacheManager();

  // FPS monitoring
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
        }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    if (isVisible) {
      animationId = requestAnimationFrame(measureFPS);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isVisible]);

  // Update metrics
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memoryInfo?.usedJSHeapSize || 0,
          cacheSize: cacheManager.getCacheSize(),
          loadTime: performance.now(),
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isVisible, memoryInfo, cacheManager]);

  // Show only in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="성능 모니터"
      >
        <Monitor size={20} />
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Monitor size={16} />
              성능 모니터
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* FPS */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-blue-500" />
                <span className="text-sm font-medium">FPS</span>
              </div>
              <span className={`text-sm font-mono ${getPerformanceColor(60 - metrics.fps, { good: 10, warning: 20 })}`}>
                {metrics.fps}
              </span>
            </div>

            {/* Memory Usage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-purple-500" />
                <span className="text-sm font-medium">메모리</span>
              </div>
              <span className={`text-sm font-mono ${getPerformanceColor(metrics.memoryUsage / (1024 * 1024), { good: 50, warning: 100 })}`}>
                {formatBytes(metrics.memoryUsage)}
              </span>
            </div>

            {/* Cache Size */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-green-500" />
                <span className="text-sm font-medium">캐시</span>
              </div>
              <span className="text-sm font-mono text-gray-600">
                {metrics.cacheSize} 항목
              </span>
            </div>

            {/* Load Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor size={16} className="text-orange-500" />
                <span className="text-sm font-medium">로드 시간</span>
              </div>
              <span className="text-sm font-mono text-gray-600">
                {Math.round(metrics.loadTime)}ms
              </span>
            </div>

            {/* Memory Details */}
            {memoryInfo && (
              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>사용됨:</span>
                    <span>{formatBytes(memoryInfo.usedJSHeapSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>총 크기:</span>
                    <span>{formatBytes(memoryInfo.totalJSHeapSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>한계:</span>
                    <span>{formatBytes(memoryInfo.jsHeapSizeLimit)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <button
                onClick={() => cacheManager.clearAll()}
                className="w-full px-3 py-2 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
              >
                캐시 전체 삭제
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PerformanceMonitor; 