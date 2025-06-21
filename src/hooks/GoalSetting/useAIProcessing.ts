import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ENV } from '@/lib/env';
import { formatAssessmentData } from '@/utils/GoalSetting/helpers';
import { eventBus, EVENTS } from '@/lib/eventBus';

interface UseAIProcessingParams {
  selectedPatient: string | null;
  formData: unknown;
  maxPollingAttempts?: number;
  pollingInterval?: number;
}

export const useAIProcessing = ({
  selectedPatient,
  formData,
  maxPollingAttempts = 30,
  pollingInterval = 2000
}: UseAIProcessingParams) => {
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // AI 추천 생성 mutation
  const createAIMutation = useMutation({
    mutationFn: async () => {
      console.log('🤖 AI 추천 생성 시작');
      console.log('Mutation 시작 - selectedPatient:', selectedPatient);
      
      if (!selectedPatient) {
        throw new Error('환자가 선택되지 않았습니다.');
      }

      // 평가 데이터 포맷팅
      const formattedData = formatAssessmentData(formData);
      console.log('포맷된 평가 데이터:', formattedData);

      // 1. 평가 저장
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          patient_id: selectedPatient,
          ...formattedData,
          assessment_date: new Date().toISOString(),
          ai_recommendation_status: 'pending',
          ai_processing_started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (assessmentError) {
        console.error('평가 저장 실패:', assessmentError);
        throw assessmentError;
      }

      console.log('평가 저장 완료:', assessmentData);
      setCurrentAssessmentId(assessmentData.id);

      // 2. AI 추천 요청 (n8n webhook 직접 호출)
      console.log('🌐 AI 추천 요청 시작');
      
      if (!ENV.N8N_WEBHOOK_URL) {
        throw new Error('N8N webhook URL이 설정되지 않았습니다');
      }
      
      console.log('n8n webhook URL:', ENV.N8N_WEBHOOK_URL);

      // n8n으로 전송할 데이터 구성
      const aiPayload = {
        assessmentId: assessmentData.id,
        patientId: selectedPatient,
        assessmentData: formattedData,
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch(ENV.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiPayload),
      });

      console.log('n8n webhook 응답 상태:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("n8n webhook 오류:", errorText);
        throw new Error(`n8n webhook 오류: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('n8n webhook 응답 데이터:', result);

      return { assessmentId: assessmentData.id };
    },
    onSuccess: (data) => {
      console.log('✅ AI 추천 요청 성공, 평가 ID:', data.assessmentId);
      startPolling(data.assessmentId);
    },
    onError: (error) => {
      console.error("Error occurred");
      setIsProcessing(false);
    }
  });

  // 폴링 시작
  const startPolling = useCallback((assessmentId: string) => {
    console.log('🔄 폴링 시작 - 평가 ID:', assessmentId);
    setPollingAttempts(0);

    const pollForResults = async () => {
      console.log(`🔍 폴링 시도 ${pollingAttempts + 1}/${maxPollingAttempts}`);

      const { data, error } = await supabase
        .from('ai_goal_recommendations')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error occurred");
        return;
      }

      if (data && data.n8n_processing_status === 'completed') {
        console.log('✅ AI 추천 완료:', data);
        setIsProcessing(false);
        eventBus.emit(EVENTS.AI_RECOMMENDATION_READY, {
          assessmentId,
          recommendationId: data.id,
          data: data.recommendations
        });
        return;
      }

      if (pollingAttempts < maxPollingAttempts - 1) {
        setPollingAttempts(prev => prev + 1);
        setTimeout(pollForResults, pollingInterval);
      } else {
        console.error('❌ 폴링 타임아웃');
        setIsProcessing(false);
        alert('AI 추천 생성에 시간이 오래 걸리고 있습니다. 잠시 후 다시 시도해주세요.');
      }
    };

    pollForResults();
  }, [pollingAttempts, maxPollingAttempts, pollingInterval]);

  // AI 처리 시작
  const startAIProcessing = useCallback(() => {
    setIsProcessing(true);
    createAIMutation.mutate();
  }, [createAIMutation]);

  return {
    startAIProcessing,
    isProcessing,
    currentAssessmentId,
    pollingAttempts
  };
};
