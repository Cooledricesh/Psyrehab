import React from 'react';
import { Loader2 } from 'lucide-react';
import { MAX_POLLING_ATTEMPTS } from '@/utils/GoalSetting/constants';

interface ProcessingModalProps {
  pollingAttempts: number;
  onRetry: () => void;
  isExtendedPolling?: boolean;
}

const ProcessingModal: React.FC<ProcessingModalProps> = ({
  pollingAttempts,
  onRetry,
  isExtendedPolling = false
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <Loader2 className={`animate-spin h-12 w-12 mx-auto mb-4 ${
        isExtendedPolling ? 'text-amber-600' : 'text-blue-600'
      }`} />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {isExtendedPolling ? 'AI 분석 연장 중' : 'AI 분석 진행 중'}
      </h3>
      <p className="text-gray-600">
        {isExtendedPolling 
          ? '최적의 목표를 찾기 위해 추가 분석을 수행하고 있습니다...'
          : '개인맞춤형 목표를 생성하고 있습니다...'
        }
      </p>
      <div className="mt-6 text-sm text-gray-500">
        {isExtendedPolling
          ? 'n8n에서 여러 가지 목표 옵션을 검토 중입니다. 조금 더 기다려주세요.'
          : '평가 데이터를 저장하고 AI 분석을 요청 중입니다. 잠시만 기다려주세요.'
        }
      </div>

      
      {pollingAttempts >= MAX_POLLING_ATTEMPTS && (
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-800 text-sm">
            AI 분석이 예상보다 오래 걸리고 있습니다. 
            잠시 후 다시 시도하거나 관리자에게 문의해주세요.
          </p>
          <button
            onClick={onRetry}
            className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
};

export default ProcessingModal;