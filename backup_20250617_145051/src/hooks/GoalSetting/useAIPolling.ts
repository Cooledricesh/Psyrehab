import { useEffect, useState, useCallback, useRef } from 'react';
import { AIRecommendationService } from '@/services/goalSetting';
import { POLLING_INTERVAL, MAX_POLLING_ATTEMPTS, MESSAGES } from '@/utils/GoalSetting/constants';

interface UseAIPollingProps {
  currentStep: number;
  currentAssessmentId: string | null;
  onSuccess: () => void;
  onError: (error: string) => void;
  onComplete: () => void;
}

interface UseAIPollingReturn {
  isPolling: boolean;
  pollingAttempts: number;
  pollingStatus: 'idle' | 'polling' | 'success' | 'error' | 'timeout';
  startPolling: () => void;
  stopPolling: () => void;
}

export const useAIPolling = ({
  currentStep,
  currentAssessmentId,
  onSuccess,
  onError,
  onComplete,
}: UseAIPollingProps): UseAIPollingReturn => {
  const [isPolling, setIsPolling] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'polling' | 'success' | 'error' | 'timeout'>('idle');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // AI 상태 확인 함수
  const checkAIStatus = useCallback(async () => {
    if (!currentAssessmentId) return;

    try {
      console.log(`📊 AI 처리 상태 확인 중... (시도 ${pollingAttempts + 1}/${MAX_POLLING_ATTEMPTS})`);
      
      const recommendation = await AIRecommendationService.checkRecommendationStatus(currentAssessmentId);

      if (recommendation && recommendation.n8n_processing_status === 'completed') {
        console.log('✅ AI 처리 완료! 추천 ID:', recommendation.id);
        setPollingStatus('success');
        onSuccess();
        stopPolling();
        
      } else if (recommendation && recommendation.n8n_processing_status === 'failed') {
        console.error('❌ AI 처리 실패');
        setPollingStatus('error');
        onError(MESSAGES.error.aiRecommendationFailed);
        stopPolling();
        
      } else if (pollingAttempts >= MAX_POLLING_ATTEMPTS - 1) {
        console.log('⏰ 폴링 횟수 초과');
        setPollingStatus('timeout');
        onError(MESSAGES.error.aiRecommendationTimeout);
        stopPolling();
        
      } else {
        console.log('⏳ AI 처리 진행 중... 상태:', recommendation?.n8n_processing_status || 'waiting');
        setPollingAttempts(prev => prev + 1);
      }
    } catch (error) {
      console.error('폴링 중 오류:', error);
      setPollingStatus('error');
      onError('폴링 중 오류가 발생했습니다.');
    }
  }, [currentAssessmentId, pollingAttempts, onSuccess, onError]);

  // 폴링 시작
  const startPolling = useCallback(() => {
    if (isPolling) return;
    
    console.log('🔄 AI 폴링 시작');
    setIsPolling(true);
    setPollingStatus('polling');
    setPollingAttempts(0);
    
    // 즉시 한 번 확인
    checkAIStatus();
    
    // 주기적 폴링 설정
    intervalRef.current = setInterval(checkAIStatus, POLLING_INTERVAL);
  }, [isPolling, checkAIStatus]);

  // 폴링 중지
  const stopPolling = useCallback(() => {
    console.log('⏹️ AI 폴링 중지');
    setIsPolling(false);
    onComplete();
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [onComplete]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // currentStep이 3이고 currentAssessmentId가 있을 때 자동 시작
  useEffect(() => {
    if (currentStep === 3 && currentAssessmentId && !isPolling) {
      startPolling();
    } else if (currentStep !== 3 && isPolling) {
      stopPolling();
    }
  }, [currentStep, currentAssessmentId, isPolling, startPolling, stopPolling]);

  return {
    isPolling,
    pollingAttempts,
    pollingStatus,
    startPolling,
    stopPolling,
  };
};
