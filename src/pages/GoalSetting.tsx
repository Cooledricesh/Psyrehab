import React, { useState, useEffect } from 'react';
import { Check, ChevronRight, Target, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PatientService } from '@/services/patients';
import { supabase } from '@/lib/supabase';
import useAIResponseParser from '@/hooks/useAIResponseParser';
import { useAIRecommendationByAssessment } from '@/hooks/useAIRecommendations';
import { ENV } from '@/lib/env';
import { eventBus, EVENTS } from '@/lib/eventBus';
import { handleApiError } from '@/utils/error-handler';

// Components
import PatientSelection from '@/components/GoalSetting/PatientSelection';
import StepIndicator from '@/components/GoalSetting/StepIndicator';
import ProcessingModal from '@/components/GoalSetting/ProcessingModal';
import AssessmentStep from '@/components/GoalSetting/AssessmentStep';
import GoalDetailDisplay from '@/components/GoalSetting/GoalDetailDisplay';
import PageHeader from '@/components/GoalSetting/PageHeader';
import AIRecommendationSelection from '@/components/GoalSetting/AIRecommendationSelection';
import GoalDetailView from '@/components/GoalSetting/GoalDetailView';
import { ArchivedGoalSelection } from '@/components/GoalSetting/ArchivedGoalSelection';

// Custom Hooks
import { useGoalSettingFlow, useAIPolling, useAssessmentSave } from '@/hooks/GoalSetting';

// Services
import { AssessmentService, AIRecommendationService, GoalService } from '@/services/goalSetting';
import { AIRecommendationArchiveService, type ArchivedRecommendation } from '@/services/ai-recommendation-archive';

// Utils and Constants
import { MESSAGES } from '@/utils/GoalSetting/constants';

const GoalSetting: React.FC = () => {
  const queryClient = useQueryClient();
  
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
  const [aiRecommendations, setAiRecommendations] = useState<Record<string, unknown> | null>(null);
  const [showArchivedSelection, setShowArchivedSelection] = useState<boolean>(false);
  const [selectedArchivedGoal, setSelectedArchivedGoal] = useState<ArchivedRecommendation | null>(null);
  
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
          // 세션이 없는 경우 사용자에게 로그인하도록 안내
          console.log('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동해주세요.');
        } else {
          console.log(MESSAGES.info.alreadyLoggedIn, session.user?.email);
        }
      } catch (error) {
        handleApiError(error, 'GoalSetting.autoLogin.sessionCheck');
      }
    };
    
    autoLogin();
  }, []);

  // 환자 데이터 가져오기 - pending 상태의 환자만
  const { data: patientsResponse, isLoading: patientsLoading, refetch } = useQuery({
    queryKey: ['patients', 'pending'],
    queryFn: () => PatientService.getPatients({
      filters: { status: 'pending' }
    }),
    staleTime: 0, // 항상 최신 데이터를 가져오도록
    refetchOnWindowFocus: true, // 탭 포커스시 리패치
    refetchOnMount: true, // 마운트시 리패치
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
  const { isPolling, pollingStatus, isExtendedPolling } = useAIPolling({
    currentStep,
    currentAssessmentId,
    onSuccess: () => {
      console.log('✅ AI 폴링 성공 콜백');
      refetchAIRecommendation();
      setIsProcessing(false);
    },
    onError: (error) => {
      handleApiError(error, 'GoalSetting.useAIPolling.onError');
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
      handleApiError(error, 'GoalSetting.saveAssessmentMutation.onError');
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
      
    } catch (error) {
      handleApiError(error, 'GoalSetting.handleGetAIRecommendation');
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
      // 평가 완료 후 아카이빙된 목표 선택 화면으로
      setShowArchivedSelection(true);
    }
  };

  // 아카이빙된 목표 선택 핸들러
  const handleSelectArchivedGoal = async (archivedGoal: ArchivedRecommendation) => {
    console.log('📦 아카이빙된 목표 선택:', archivedGoal);
    
    try {
      // 아카이빙된 목표 데이터 검증
      if (!archivedGoal.archived_goal_data || archivedGoal.archived_goal_data.length === 0) {
        alert('선택한 목표에 데이터가 없습니다.');
        return;
      }
      
      const archivedGoalData = archivedGoal.archived_goal_data[0];
      
      // 아카이빙된 목표를 DetailedGoals 형식으로 변환
      const convertedGoals = GoalService.convertArchivedToDetailedGoals(archivedGoalData);
      
      // 아카이빙된 목표를 사용할 때도 평가 데이터 저장
      if (selectedPatient && formData) {
        try {
          const savedAssessment = await saveAssessmentMutation.mutateAsync({ formData });
          setCurrentAssessmentId(savedAssessment.id);
          console.log('✅ 아카이빙 목표용 평가 저장 완료:', savedAssessment.id);
        } catch (error) {
          handleApiError(error, 'GoalSetting.handleSelectArchivedGoal.saveAssessment');
          // 평가 저장이 실패해도 계속 진행 (아카이빙된 목표는 평가 없이도 사용 가능)
        }
      }
      
      setSelectedArchivedGoal(archivedGoal);
      setDetailedGoals(convertedGoals);
      setShowArchivedSelection(false);
      setCurrentStep(5); // 완료 단계로 이동
    } catch (error) {
      handleApiError(error, 'GoalSetting.handleSelectArchivedGoal');
      alert(error instanceof Error ? error.message : '목표 데이터 변환 중 오류가 발생했습니다.');
    }
  };

  // AI 생성 선택 핸들러
  const handleGenerateNewGoals = () => {
    setShowArchivedSelection(false);
    handleGetAIRecommendation();
  };

  // 목표 저장 함수
  const handleSaveGoals = async () => {
    console.log('🎯 목표 저장 시작!');
    console.log('선택된 환자:', selectedPatient);
    console.log('상세 목표:', detailedGoals);
    console.log('현재 평가 ID:', currentAssessmentId);
    console.log('AI 추천 ID:', recommendationId);
    
    if (!selectedPatient || !detailedGoals) {
      alert(MESSAGES.error.missingData);
      return;
    }
    
    // AI 생성 목표일 때만 currentAssessmentId 필요
    if (!selectedArchivedGoal && !currentAssessmentId) {
      alert('AI 생성 목표에는 평가 ID가 필요합니다.');
      return;
    }

    try {
      setIsProcessing(true);
      
      const currentUserId = await AssessmentService.getCurrentUserId();

      // 1. 기존 active 계획을 inactive로 변경
      await GoalService.deactivateExistingGoals(selectedPatient);

      // 아카이빙된 목표 vs AI 생성 목표 처리
      if (selectedArchivedGoal) {
        // 아카이빙된 목표 사용
        console.log('📦 아카이빙된 목표로 저장');
        await GoalService.createGoalsFromArchived(
          selectedArchivedGoal.archived_goal_data[0],
          selectedPatient,
          currentUserId,
          selectedArchivedGoal.id
        );
      } else {
        // AI 생성 목표 사용
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
      }

      // 4.5. 이미 생성 시점에 3개 모두 아카이빙되었으므로, 추가 아카이빙은 필요 없음
      console.log('✅ AI 추천 목표는 이미 생성 시점에 아카이빙 완료');
      console.log('✅ 선택된 목표만 활성 목표로 저장됨');
      
      // 선택된 목표를 아카이빙에서 제외하기 위해 archived_reason 업데이트 (옵션)
      if (recommendationId && detailedGoals.selectedIndex !== undefined && !selectedArchivedGoal) {
        try {
          // 선택된 목표만 찾아서 업데이트
          const { data: archiveToUpdate } = await supabase
            .from('ai_recommendation_archive')
            .select('*')
            .eq('original_recommendation_id', recommendationId)
            .eq('archived_reason', 'initial_generation');
          
          if (archiveToUpdate && archiveToUpdate.length > 0) {
            // 선택된 목표 찾기
            const selectedArchive = archiveToUpdate.find(archive => 
              archive.archived_goal_data?.[0]?.plan_number === detailedGoals.selectedIndex + 1
            );
            
            if (selectedArchive) {
              const { error: updateError } = await supabase
                .from('ai_recommendation_archive')
                .update({ archived_reason: 'goal_selected_and_active' })
                .eq('id', selectedArchive.id);
                
              if (updateError) {
                console.warn('⚠️ 선택된 목표 아카이빙 상태 업데이트 실패:', updateError);
              } else {
                console.log('✅ 선택된 목표 아카이빙 상태 업데이트 성공');
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ 아카이빙 상태 업데이트 오류:', error);
        }
      }

      // 5. 환자 상태를 active로 변경
      await GoalService.activatePatient(selectedPatient);

      // Progress Tracking 쿼리 즉시 무효화
      queryClient.invalidateQueries({ queryKey: ['activePatients'] });
      queryClient.invalidateQueries({ queryKey: ['patientGoals'] });
      queryClient.invalidateQueries({ queryKey: ['progressStats'] });

      // 환자 상태 변경 이벤트 발생
      eventBus.emit(EVENTS.PATIENT_STATUS_CHANGED, {
        patientId: selectedPatient,
        newStatus: 'active'
      });

      // 성공 메시지
      alert(MESSAGES.success.goalsSaved);
      
      // 초기 상태로 리셋
      resetFlow();
      setShowArchivedSelection(false);
      setSelectedArchivedGoal(null);
      
      // 환자 목록 새로고침
      refetch();

    } catch (error: unknown) {
      handleApiError(error, 'GoalSetting.handleSaveGoals');
      
      let errorMessage = MESSAGES.error.default;
      if (error instanceof Error && error.message) {
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
        onBack={currentStep === 1 ? undefined : () => {
          if (currentStep === 2) {
            setCurrentStep(1);
          } else if (currentStep === 3) {
            setCurrentStep(2);
          } else if (currentStep === 4) {
            setCurrentStep(1); // 4단계에서는 1단계(환자 선택)로
          } else if (currentStep === 5) {
            setCurrentStep(1); // 5단계에서는 1단계(환자 선택)로
          }
        }}
      />

      {/* Progress Steps */}
      <StepIndicator currentStep={currentStep} steps={steps} />

      {/* Content */}
      <div className={`mx-auto px-4 py-8 ${showArchivedSelection ? 'max-w-6xl' : 'max-w-4xl'}`}>
        {currentStep === 1 && (
          <PatientSelection
            patients={patients}
            patientsLoading={patientsLoading}
            onSelectPatient={handlePatientSelect}
          />
        )}

        {currentStep === 2 && !showArchivedSelection && (
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

        {currentStep === 2 && showArchivedSelection && selectedPatient && (
          <ArchivedGoalSelection
            patientAge={(() => {
              const patient = patients.find(p => p.id === selectedPatient);
              if (!patient?.birth_date) return undefined;
              return new Date().getFullYear() - new Date(patient.birth_date).getFullYear();
            })()}
            patientGender={patients.find(p => p.id === selectedPatient)?.gender}
            diagnosisCategory={(() => {
              const patient = patients.find(p => p.id === selectedPatient);
              return patient?.diagnosis ? simplifyDiagnosis(patient.diagnosis) : undefined;
            })()}
            // 평가 항목 전달
            focusTime={formData.focusTime}
            motivationLevel={formData.motivationLevel}
            pastSuccesses={formData.pastSuccesses}
            constraints={formData.constraints}
            socialPreference={formData.socialPreference}
            onSelectArchived={handleSelectArchivedGoal}
            onGenerateNew={handleGenerateNewGoals}
            onBack={() => setShowArchivedSelection(false)}
          />
        )}

        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Loader2 className={`animate-spin h-12 w-12 mx-auto mb-4 ${
              isExtendedPolling ? 'text-amber-600' : 'text-blue-600'
            }`} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isExtendedPolling ? 'AI 분석 연장 중' : 'AI 분석 진행 중'}
            </h3>
            <p className="text-gray-600">
              {isExtendedPolling 
                ? '조금만 더 기다려주세요...'
                : 'AI가 최적의 재활 목표를 분석하고 있습니다...'
              }
            </p>
            <div className="mt-6 text-sm text-gray-500">
              {isExtendedPolling
                ? 'AI가 더 나은 목표를 찾기 위해 추가 검토를 진행하고 있습니다. 최대 90초까지 소요될 수 있습니다.'
                : '평가 데이터를 분석하여 개인맞춤형 목표를 생성하고 있습니다.'
              }
            </div>
          </div>
        )}

        {currentStep === 4 && aiRecommendations && (
          <AIRecommendationSelection
            aiRecommendations={aiRecommendations}
            selectedGoal={selectedGoal}
            onSelectGoal={setSelectedGoal}
            onBack={() => {
              setCurrentStep(1); // 1단계(환자 선택)로 이동
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
              setCurrentStep(1); // 1단계(환자 선택)로 이동
              setDetailedGoals(null);
            }}
            onSave={handleSaveGoals}
            onReset={resetFlow}
            onNewGoal={() => {
              // 목표 선택 화면으로 이동 (환자는 유지)
              setCurrentStep(2); // 평가 단계로
              setDetailedGoals(null);
              setSelectedGoal('');
              setAiRecommendations(null);
              setShowArchivedSelection(false);
              setSelectedArchivedGoal(null);
            }}
            isProcessing={isProcessing}
          />
        )}

      </div>
    </div>
  );
};

// 진단명을 간소화된 카테고리로 변환
function simplifyDiagnosis(diagnosis: string): string {
  const lowerDiagnosis = diagnosis.toLowerCase();
  
  const categoryMap = {
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

// 나이를 연령대로 변환
function getAgeRange(age: number): string {
  if (age < 20) return '0-19';
  if (age < 30) return '20-29';
  if (age < 40) return '30-39';
  if (age < 50) return '40-49';
  if (age < 60) return '50-59';
  if (age < 70) return '60-69';
  return '70+';
}

export default GoalSetting;
