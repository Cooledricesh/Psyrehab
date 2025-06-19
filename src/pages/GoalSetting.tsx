import React, { useState, useEffect } from 'react';
import { Check, ChevronRight, Target, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PatientService } from '@/services/patients';
import { supabase } from '@/lib/supabase';
import useAIResponseParser from '@/hooks/useAIResponseParser';
import { useAIRecommendationByAssessment } from '@/hooks/useAIRecommendations';
import { ENV } from '@/lib/env';
import { eventBus, EVENTS } from '@/lib/eventBus';

// Components
import PatientSelection from '@/components/GoalSetting/PatientSelection';
import StepIndicator from '@/components/GoalSetting/StepIndicator';
import ProcessingModal from '@/components/GoalSetting/ProcessingModal';
import AssessmentStep from '@/components/GoalSetting/AssessmentStep';
import GoalDetailDisplay from '@/components/GoalSetting/GoalDetailDisplay';
import PageHeader from '@/components/GoalSetting/PageHeader';
import AIRecommendationSelection from '@/components/GoalSetting/AIRecommendationSelection';
import GoalDetailView from '@/components/GoalSetting/GoalDetailView';

// Custom Hooks
import { useGoalSettingFlow, useAIPolling, useAssessmentSave } from '@/hooks/GoalSetting';

// Services
import { AssessmentService, AIRecommendationService, GoalService } from '@/services/goalSetting';

// Utils and Constants
import { MESSAGES } from '@/utils/GoalSetting/constants';

const GoalSetting: React.FC = () => {
  // 전체 플로우 상태 관리 훅
  const {
    selectedPatient,
    currentStep,
    currentAssessmentId,
    recommendationId,
    selectedGoal,
    detailedGoals,
    viewMode,
    formData,
    handlePatientSelect,
    setCurrentStep,
    setCurrentAssessmentId,
    setRecommendationId,
    setSelectedGoal,
    setDetailedGoals,
    setViewMode,
    updateFormData,
    resetFlow,
  } = useGoalSettingFlow();

  // 추가 상태 (훅으로 옮기지 않은 것들)
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  
  // AI 응답 파싱 훅
  const { parseAIResponse } = useAIResponseParser();

  // 개발용 자동 admin 로그인
  React.useEffect(() => {
    const autoLogin = async () => {
      try {
        console.log(MESSAGES.info.autoLoginAttempt);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log(MESSAGES.info.noSession);
          const { data, error } = await supabase.auth.signInWithPassword({
            email: 'admin@psyrehab.dev',
            password: 'admin123!'
          });
          
          if (error) {
            console.log('⚠️ 자동 로그인 실패:', error.message);
          } else {
            console.log(MESSAGES.info.loginSuccess, data);
          }
        } else {
          console.log(MESSAGES.info.alreadyLoggedIn, session.user?.email);
        }
      } catch {
        console.error("Error occurred");
        // 오류가 발생해도 강제로 로그인 시도
        try {
          const { error: forceError } = await supabase.auth.signInWithPassword({
            email: 'admin@psyrehab.dev',
            password: 'admin123!'
          });
          if (!forceError) {
            console.log(MESSAGES.info.forceLoginSuccess);
          }
        } catch (e) {
          console.error('강제 로그인도 실패:', e);
        }
      }
    };
    
    autoLogin();
  }, []);

  // 환자 데이터 가져오기 - inactive 상태의 환자만
  const { data: patientsResponse, isLoading: patientsLoading, error, refetch } = useQuery({
    queryKey: ['patients', 'inactive'],
    queryFn: () => PatientService.getPatients({
      filters: { status: 'inactive' }
    }),
  });

  // 환자 상태 변경 이벤트 리스너
  useEffect(() => {
    const handlePatientStatusChanged = (data: { patientId: string; newStatus: string }) => {
      console.log('환자 상태 변경 감지:', data);
      // 모든 상태 변경에 대해 목록 새로고침
      refetch();
    };

    eventBus.on(EVENTS.PATIENT_STATUS_CHANGED, handlePatientStatusChanged);

    return () => {
      eventBus.off(EVENTS.PATIENT_STATUS_CHANGED, handlePatientStatusChanged);
    };
  }, [refetch]);

  const patients = patientsResponse?.data || [];

  // AI 추천 결과 조회 (평가 ID 기반으로 수정)
  const { data: aiRecommendationData, refetch: refetchAIRecommendation } = useAIRecommendationByAssessment(
    currentAssessmentId,  // currentAssessmentId 사용
    null  // 환자 ID를 null로 설정
  );

  // AI 폴링 훅 사용
  const { isPolling, pollingStatus } = useAIPolling({
    currentStep,
    currentAssessmentId,
    onSuccess: () => {
      console.log('✅ AI 폴링 성공 콜백');
      refetchAIRecommendation();
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error("Error occurred");
      alert(error);
      setCurrentStep(2);
      setIsProcessing(false);
    },
    onComplete: () => {
      console.log('🏁 AI 폴링 완료 콜백');
    }
  });

  // AI 추천 결과 변화 감지 (구조화된 데이터 사용)
  React.useEffect(() => {
    if (!aiRecommendationData || !currentAssessmentId) return;

    console.log('📊 AI 추천 데이터 수신:', aiRecommendationData);

    // 현재 평가 ID와 일치하는 추천인지 확인
    if (aiRecommendationData.assessment_id !== currentAssessmentId) {
      console.log('⚠️ 다른 평가의 추천 데이터입니다.');
      return;
    }

    // 추천 ID 저장
    setRecommendationId(aiRecommendationData.id);

    // 구조화된 데이터 처리
    if (aiRecommendationData.recommendations && Array.isArray(aiRecommendationData.recommendations)) {
      console.log('✅ AI 추천 데이터 처리 성공!', aiRecommendationData.recommendations.length, '개 계획');
      setAiRecommendations({
        goals: aiRecommendationData.recommendations,
        reasoning: aiRecommendationData.patient_analysis?.insights || 'AI가 생성한 맞춤형 재활 계획입니다.',
        patient_analysis: aiRecommendationData.patient_analysis
      });
      
      // AI 처리 단계에서 추천 단계로 이동
      if (currentStep === 3) {
        setCurrentStep(4);
        setIsProcessing(false);
      }
    }
  }, [aiRecommendationData, currentAssessmentId, currentStep, setRecommendationId, setCurrentStep]);

  // 평가 저장 훅 사용
  const saveAssessmentMutation = useAssessmentSave({
    selectedPatient,
    onSuccess: (data) => {
      console.log('✅ 평가 데이터 저장 성공:', data);
      setCurrentStep(3); // AI 처리 단계로 이동
      setRecommendationId(data.id);
      setCurrentAssessmentId(data.id);
    },
    onError: (error) => {
      console.error("Error occurred");
      alert(error.message);
    }
  });

  // AI 추천 요청 mutation
  const requestAIRecommendationMutation = useMutation({
    mutationFn: AIRecommendationService.requestRecommendation,
  });

  // AI 추천 받기 함수
  const handleGetAIRecommendation = async () => {
    if (!selectedPatient) return;

    try {
      setIsProcessing(true);
      
      // 기존 AI 추천 데이터 초기화
      setAiRecommendations(null);
      setRecommendationId(null);
      setCurrentAssessmentId(null);
      
      setCurrentStep(3); // AI 처리 단계로 이동

      // 1. 평가 데이터 저장
      const savedAssessment = await saveAssessmentMutation.mutateAsync({ formData });
      
      // 2. AI 추천 요청
      console.log('🚀 AI 추천 요청 시작:', savedAssessment.id);
      const aiResponse = await requestAIRecommendationMutation.mutateAsync(savedAssessment.id);
      
      // 폴링은 useAIPolling 훅에서 자동으로 시작됨
      
    } catch {
      console.error("Error occurred");
      alert(MESSAGES.error.aiRequestFailed);
      setCurrentStep(2); // 평가 단계로 되돌리기
      setIsProcessing(false);
    }
  };

  const steps = [
    { id: 1, title: '환자 선택', completed: currentStep > 1 },
    { id: 2, title: '평가 수행', completed: currentStep > 2 },
    { id: 3, title: 'AI 분석', completed: currentStep > 3 },
    { id: 4, title: '목표 추천', completed: currentStep > 4 },
    { id: 5, title: '완료', completed: currentStep > 5 }
  ];

  const handleFocusTimeChange = (value: string) => {
    updateFormData({ focusTime: value });
  };

  const handleMotivationChange = (value: number[]) => {
    updateFormData({ motivationLevel: value[0] });
  };

  const handlePastSuccessChange = (value: string, checked: boolean) => {
    updateFormData({
      pastSuccesses: checked
        ? [...formData.pastSuccesses, value]
        : formData.pastSuccesses.filter((item) => item !== value)
    });
  };

  const handleConstraintChange = (value: string, checked: boolean) => {
    updateFormData({
      constraints: checked
        ? [...formData.constraints, value]
        : formData.constraints.filter((item) => item !== value)
    });
  };

  const handleSocialPreferenceChange = (value: string) => {
    updateFormData({ socialPreference: value });
  };

  const isFormValid = () => {
    return formData.focusTime && formData.socialPreference;
  };

  const handleAssessmentSubmit = () => {
    if (isFormValid()) {
      handleGetAIRecommendation();
    }
  };

  // 목표 저장 함수
  const handleSaveGoals = async () => {
    console.log('🎯 목표 저장 시작!');
    console.log('선택된 환자:', selectedPatient);
    console.log('상세 목표:', detailedGoals);
    console.log('현재 평가 ID:', currentAssessmentId);
    console.log('AI 추천 ID:', recommendationId);
    
    if (!selectedPatient || !detailedGoals || !currentAssessmentId) {
      alert(MESSAGES.error.missingData);
      return;
    }

    try {
      setIsProcessing(true);
      
      const currentUserId = await AssessmentService.getCurrentUserId();

      // 1. 기존 active 계획을 inactive로 변경
      await GoalService.deactivateExistingGoals(selectedPatient);

      // 2. AI 추천 ID 가져오기
      let aiRecommendationId = recommendationId;
      if (!aiRecommendationId && currentAssessmentId) {
        aiRecommendationId = await AIRecommendationService.getRecommendationIdByAssessment(currentAssessmentId);
      }

      // 3. AI 추천 상태 업데이트
      if (aiRecommendationId) {
        await AIRecommendationService.updateRecommendationStatus(aiRecommendationId, {
          is_active: true,
          applied_at: new Date().toISOString(),
          applied_by: currentUserId,
          selected_plan_number: detailedGoals.selectedIndex + 1
        });
      }

      // 4. 계층적 목표 생성 및 저장
      const goalsToInsert = GoalService.createHierarchicalGoals(
        detailedGoals,
        selectedPatient,
        aiRecommendationId,
        currentUserId
      );
      
      await GoalService.saveGoals(goalsToInsert);

      // 5. 환자 상태를 active로 변경
      await GoalService.activatePatient(selectedPatient);

      // 성공 메시지
      alert(MESSAGES.success.goalsSaved);
      
      // 초기 상태로 리셋
      resetFlow();
      
      // 환자 목록 새로고침
      refetch();

    } catch (error: unknown) {
      console.error("Error occurred");
      
      let errorMessage = MESSAGES.error.default;
      if (error.message) {
        errorMessage = MESSAGES.error.goalSaveFailed(error.message);
      }
      
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // AI 추천이 있을 때 detailedGoals 업데이트
  React.useEffect(() => {
    if (aiRecommendations && selectedGoal !== '') {
      const goalIndex = parseInt(selectedGoal);
      const selectedOption = aiRecommendations.goals[goalIndex];
      
      if (selectedOption) {
        setDetailedGoals({
          selectedIndex: goalIndex,
          sixMonthGoal: {
            title: selectedOption.title,
            goal: selectedOption.sixMonthGoal,
            purpose: selectedOption.purpose,
            details: selectedOption.purpose
          },
          monthlyGoals: selectedOption.monthlyGoals || [],
          weeklyGoals: selectedOption.weeklyPlans || []
        });
      }
    }
  }, [aiRecommendations, selectedGoal, setDetailedGoals]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <PageHeader 
        title="맞춤형 목표 설정"
        onBack={() => window.history.back()}
      />

      {/* Progress Steps */}
      <StepIndicator currentStep={currentStep} steps={steps} />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentStep === 1 && (
          <PatientSelection
            patients={patients}
            patientsLoading={patientsLoading}
            onSelectPatient={handlePatientSelect}
          />
        )}

        {currentStep === 2 && (
          <AssessmentStep
            formData={formData}
            selectedPatient={selectedPatient}
            patients={patients}
            onFocusTimeChange={handleFocusTimeChange}
            onMotivationChange={(value) => handleMotivationChange([value])}
            onPastSuccessChange={handlePastSuccessChange}
            onConstraintChange={handleConstraintChange}
            onSocialPreferenceChange={handleSocialPreferenceChange}
            onFormDataChange={(updates) => updateFormData(updates)}
            onNext={handleAssessmentSubmit}
            onBack={() => setCurrentStep(1)}
            isProcessing={isProcessing}
          />
        )}

        {currentStep === 3 && (
          <ProcessingModal
            isOpen={isProcessing || isPolling}
            message="AI가 최적의 재활 목표를 분석하고 있습니다..."
          />
        )}

        {currentStep === 4 && aiRecommendations && (
          <AIRecommendationSelection
            aiRecommendations={aiRecommendations}
            selectedGoal={selectedGoal}
            onSelectGoal={setSelectedGoal}
            onBack={() => {
              setCurrentStep(2);
              setAiRecommendations(null);
              setSelectedGoal('');
            }}
            onNext={() => {
              const selectedGoalData = aiRecommendations.goals[parseInt(selectedGoal)];
              const detailed = {
                selectedIndex: parseInt(selectedGoal),
                sixMonthGoal: selectedGoalData,
                monthlyGoals: selectedGoalData.monthlyGoals || [],
                weeklyGoals: selectedGoalData.weeklyPlans || []
              };
              setDetailedGoals(detailed);
              setCurrentStep(5);
            }}
          />
        )}

        {/* Step 4에서 목표 선택 후 상세 보기 */}
        {currentStep === 4 && detailedGoals && (
          <GoalDetailDisplay
            detailedGoals={detailedGoals}
            selectedGoal={selectedGoal}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onGoalSelect={setSelectedGoal}
            onSave={handleSaveGoals}
            isProcessing={isProcessing}
            patients={patients}
            selectedPatient={selectedPatient}
          />
        )}

        {currentStep === 5 && detailedGoals && (
          <GoalDetailView
            detailedGoals={detailedGoals}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onBack={() => {
              setCurrentStep(4);
              setDetailedGoals(null);
            }}
            onSave={handleSaveGoals}
            onReset={resetFlow}
            isProcessing={isProcessing}
          />
        )}

      </div>
    </div>
  );
};

export default GoalSetting;
