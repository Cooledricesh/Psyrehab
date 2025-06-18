import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export interface RealtimeStatusProps {
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  connectedCount: number;
  totalCount: number;
  lastUpdate: string;
  onReconnect?: () => void;
  className?: string;
  showDetails?: boolean;
}

export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({
  connectionStatus,
  connectedCount,
  totalCount,
  lastUpdate,
  onReconnect,
  className = '',
  showDetails = true,
}) => {
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi size={16} className="text-green-600" />;
      case 'connecting':
        return <RefreshCw size={16} className="text-yellow-600 animate-spin" />;
      case 'disconnected':
        return <WifiOff size={16} className="text-red-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return showDetails ? `실시간 연결됨 (${connectedCount}/${totalCount})` : '실시간 연결됨';
      case 'connecting':
        return '연결 중...';
      case 'disconnected':
        return '연결 끊김';
      default:
        return '알 수 없음';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'connecting':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'disconnected':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffMins > 0) {
      return `${diffMins}분 전`;
    } else if (diffSecs > 5) {
      return `${diffSecs}초 전`;
    } else {
      return '방금 전';
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span className="font-medium">{getStatusText()}</span>
      
      {showDetails && (
        <>
          <span className="text-xs opacity-75">
            마지막 업데이트: {formatLastUpdate(lastUpdate)}
          </span>
          
          {connectionStatus === 'disconnected' && onReconnect && (
            <button
              onClick={onReconnect}
              className="ml-2 text-xs underline hover:no-underline"
            >
              재연결
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default RealtimeStatus; 