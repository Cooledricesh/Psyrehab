import React from 'react';
import { LucideIcon, CheckCircle, AlertTriangle, XCircle, HardDrive } from 'lucide-react';

interface SystemStatusItem {
  name: string;
  status: 'good' | 'warning' | 'error';
  lastCheck: string;
  icon: LucideIcon;
}

interface AdminSystemStatusProps {
  items: SystemStatusItem[];
  storageUsed: number;
  storageTotal: number;
}

export const AdminSystemStatus: React.FC<AdminSystemStatusProps> = ({
  items,
  storageUsed,
  storageTotal,
}) => {
  const getStatusIcon = (status: SystemStatusItem['status']) => {
    switch (status) {
      case 'good':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'error':
        return XCircle;
      default:
        return CheckCircle;
    }
  };

  const getStatusColor = (status: SystemStatusItem['status']) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: SystemStatusItem['status']) => {
    switch (status) {
      case 'good':
        return '정상';
      case 'warning':
        return '주의';
      case 'error':
        return '오류';
      default:
        return '알 수 없음';
    }
  };

  const storagePercentage = (storageUsed / storageTotal) * 100;

  const getStorageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* 시스템 상태 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">시스템 상태</h3>
          <div className="space-y-4">
            {items.map((item, index) => {
              const StatusIcon = getStatusIcon(item.status);
              const ItemIcon = item.icon;
              const statusColor = getStatusColor(item.status);

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <ItemIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        마지막 확인: {item.lastCheck}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {getStatusText(item.status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 전체 시스템 상태 요약 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">전체 시스템 상태</span>
              <div className="flex items-center space-x-2">
                {items.every(item => item.status === 'good') ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">모든 시스템 정상</span>
                  </>
                ) : items.some(item => item.status === 'error') ? (
                  <>
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600 font-medium">시스템 오류 감지</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-600 font-medium">주의 필요</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 스토리지 사용량 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">스토리지 사용량</h3>
            <HardDrive className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">사용량</span>
              <span className="font-medium text-gray-900">
                {storageUsed.toFixed(1)}GB / {storageTotal}GB
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getStorageColor(storagePercentage)}`}
                style={{ width: `${storagePercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{storagePercentage.toFixed(1)}% 사용 중</span>
              <span>{(storageTotal - storageUsed).toFixed(1)}GB 여유 공간</span>
            </div>

            {storagePercentage >= 80 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    {storagePercentage >= 90
                      ? '스토리지 공간이 부족합니다. 즉시 정리가 필요합니다.'
                      : '스토리지 공간이 부족해지고 있습니다. 정리를 권장합니다.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors">
              스토리지 관리 →
            </button>
          </div>
        </div>
      </div>

      {/* 시스템 리소스 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">시스템 리소스</h3>
          
          <div className="space-y-4">
            {/* CPU 사용률 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">CPU 사용률</span>
                <span className="text-sm font-medium text-gray-900">23%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: '23%' }} />
              </div>
            </div>

            {/* 메모리 사용률 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">메모리 사용률</span>
                <span className="text-sm font-medium text-gray-900">67%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 bg-green-500 rounded-full" style={{ width: '67%' }} />
              </div>
            </div>

            {/* 네트워크 트래픽 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">네트워크 사용률</span>
                <span className="text-sm font-medium text-gray-900">12%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 bg-purple-500 rounded-full" style={{ width: '12%' }} />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p>마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemStatus; 