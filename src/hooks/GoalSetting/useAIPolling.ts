import { useEffect, useState, useCallback, useRef } from 'react';
import { AIRecommendationService } from '@/services/goalSetting';
import { AIRecommendationArchiveService } from '@/services/ai-recommendation-archive';
import { supabase } from '@/lib/supabase';
import { POLLING_INTERVAL, MAX_POLLING_ATTEMPTS, MESSAGES } from '@/utils/GoalSetting/constants';
import { handleApiError } from '@/utils/error-handler';

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
  pollingStatus: 'idle' | 'polling' | 'success' | 'error' | 'timeout' | 'extending';
  startPolling: () => void;
  stopPolling: () => void;
  isExtendedPolling: boolean;
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
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'polling' | 'success' | 'error' | 'timeout' | 'extending'>('idle');
  const [isExtendedPolling, setIsExtendedPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);
  const isExtendedRef = useRef(false);

  // AI 상태 확인 함수
  const checkAIStatus = useCallback(async () => {
    if (!currentAssessmentId) return;

    try {
      attemptsRef.current += 1;
      const currentAttempts = attemptsRef.current;
      const maxAttempts = isExtendedRef.current ? MAX_POLLING_ATTEMPTS * 2 : MAX_POLLING_ATTEMPTS;
      
      console.log(`📊 AI 처리 상태 확인 중... (시도 ${currentAttempts}/${maxAttempts})`);
      
      const recommendation = await AIRecommendationService.checkRecommendationStatus(currentAssessmentId);

      if (recommendation && recommendation.n8n_processing_status === 'completed') {
        console.log('✅ AI 처리 완료! 추천 ID:', recommendation.id);
        
        // AI 추천 생성 직후 모든 목표 아카이빙
        try {
          console.log('🗄️ AI 추천 목표 3개 모두 아카이빙 시작');
          
          // 이미 아카이빙된 목표가 있는지 확인
          const { data: existingArchives } = await supabase
            .from('ai_recommendation_archive')
            .select('id')
            .eq('original_recommendation_id', recommendation.id)
            .eq('archived_reason', 'initial_generation');
          
          if (existingArchives && existingArchives.length > 0) {
            console.log('⚠️ 이미 아카이빙된 목표가 있어 중복 아카이빙 건너뛰기');
          } else {
            // 환자 정보 조회
            const { data: assessmentData } = await supabase
              .from('assessments')
              .select('patient_id')
              .eq('id', currentAssessmentId)
              .single();
              
            let patient = null;
            if (assessmentData?.patient_id) {
              const { data: patientResult } = await supabase
                .from('patients')
                .select('date_of_birth, gender, additional_info')
                .eq('id', assessmentData.patient_id)
                .single();
              patient = patientResult;
            }
              

            if (recommendation.recommendations && Array.isArray(recommendation.recommendations)) {
              const allGoals = recommendation.recommendations.map((goal: any, index: number) => {
                // 목표 제목에서 불필요한 말머리 제거
                const cleanTitle = goal.title?.replace(/^목표\s*\d+[:.]?\s*/i, '').trim() || goal.title;
                
                return {
                  plan_number: index + 1,
                  title: cleanTitle || `목표 ${index + 1}`,
                  purpose: goal.purpose || '',
                  sixMonthGoal: goal.sixMonthGoal || '',
                  monthlyGoals: goal.monthlyGoals || [],
                  weeklyPlans: goal.weeklyPlans || []
                };
              });

              // patient 변수는 위에서 이미 정의됨
              const patientAge = patient?.date_of_birth 
                ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
                : undefined;
                

              // 3개 목표 모두 아카이빙
              await AIRecommendationArchiveService.archiveUnselectedGoals({
                originalRecommendationId: recommendation.id,
                originalAssessmentId: currentAssessmentId,
                unselectedGoals: allGoals,
                patientAge,
                patientGender: patient?.gender,
                diagnosisCategory: patient?.additional_info?.primary_diagnosis ? simplifyDiagnosis(patient.additional_info.primary_diagnosis) : undefined,
                archivedReason: 'initial_generation' // 생성 직후 아카이빙
              });
              
              console.log('✅ AI 추천 목표 3개 모두 아카이빙 완료');
            }
          }
        } catch (archiveError) {
          console.warn('⚠️ AI 추천 아카이빙 실패 (메인 플로우는 계속):', archiveError);
        }
        
        setPollingStatus('success');
        onSuccess();
        stopPolling();
        
      } else if (recommendation && recommendation.n8n_processing_status === 'failed') {
        handleApiError(new Error('AI 처리 실패'), 'useAIPolling.checkAIStatus.failed');
        setPollingStatus('error');
        onError(MESSAGES.error.aiRecommendationFailed);
        stopPolling();
        
      } else if (currentAttempts >= MAX_POLLING_ATTEMPTS && !isExtendedRef.current) {
        // 첫 번째 타임아웃 (45초): 연장 시도
        console.log('⏰ 45초 경과. 조금만 더 기다려주세요...');
        setPollingStatus('extending');
        setIsExtendedPolling(true);
        isExtendedRef.current = true;
        // 상태 업데이트를 위해 pollingAttempts도 업데이트
        setPollingAttempts(currentAttempts);
        
      } else if (currentAttempts >= MAX_POLLING_ATTEMPTS * 2) {
        // 최종 타임아웃 (90초): 실패 처리
        console.log('❌ 90초 경과. AI 처리 시간 초과');
        setPollingStatus('timeout');
        onError(MESSAGES.error.aiRecommendationTimeout);
        stopPolling();
        
      } else {
        // 계속 폴링
        const statusText = isExtendedRef.current ? '조금만 더 기다려주세요' : 'AI 처리 중';
        console.log(`⏳ ${statusText}... 상태: ${recommendation?.n8n_processing_status || 'waiting'} (${currentAttempts}/${maxAttempts})`);
        setPollingAttempts(currentAttempts);
      }
    } catch (error) {
      handleApiError(error, 'useAIPolling.checkAIStatus');
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
    setIsExtendedPolling(false);
    
    // ref 초기화
    attemptsRef.current = 0;
    isExtendedRef.current = false;
    
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
    isExtendedPolling,
  };
};

/**
 * 진단명을 간소화된 카테고리로 변환
 */
function simplifyDiagnosis(diagnosis: string): string {
  const lowerDiagnosis = diagnosis.toLowerCase();
  
  const categoryMap: Record<string, string[]> = {
    'cognitive_disorder': ['치매', '인지', '기억', '알츠하이머', 'dementia', 'cognitive'],
    'mood_disorder': ['우울', '조울', '기분', 'depression', 'bipolar', 'mood'],
    'anxiety_disorder': ['불안', '공황', 'anxiety', 'panic'],
    'psychotic_disorder': ['조현병', '정신분열', 'schizophrenia', 'psychotic'],
    'substance_disorder': ['중독', '알코올', '약물', 'addiction', 'substance'],
    'developmental_disorder': ['자폐', '발달', 'autism', 'developmental'],
    'neurological_disorder': ['뇌졸중', '파킨슨', '뇌손상', 'stroke', 'parkinson', 'neurological'],
    'personality_disorder': ['성격', '인격', 'personality'],
    'eating_disorder': ['섭식', '식이', 'eating'],
    'trauma_disorder': ['외상', '트라우마', 'trauma', 'ptsd']
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => lowerDiagnosis.includes(keyword))) {
      return category;
    }
  }

  return 'other_disorder';
}
