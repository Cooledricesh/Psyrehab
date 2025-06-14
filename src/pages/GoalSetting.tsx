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

// Custom Hooks
import { useGoalSettingFlow, useAIPolling, useAssessmentSave } from '@/hooks/GoalSetting';

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
      } catch (error) {
        console.error('자동 로그인 중 오류:', error);
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
      console.error('❌ AI 폴링 에러 콜백:', error);
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
      console.error('❌ 평가 데이터 저장 실패:', error);
      alert(error.message);
    }
  });

  // AI 추천 요청 mutation (새로운 API 엔드포인트 사용)
  const requestAIRecommendationMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      console.log('🔗 AI 추천 요청 시작:', assessmentId);
      console.log('🌐 API URL:', ENV.API_URL);
      console.log('📍 전체 URL:', `${ENV.API_URL}/api/ai/recommend`);
      
      const response = await fetch(`${ENV.API_URL}/api/ai/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: assessmentId,
        }),
      });

      console.log('📡 AI API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI API Error Response:', errorText);
        throw new Error(`AI 추천 요청 실패: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ AI API Success Response:', result);
      return result;
    },
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
      console.error('AI 추천 처리 중 오류:', error);
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
      // 저장 중임을 표시
      setIsProcessing(true);
      
      // 디버깅을 위한 로그
      console.log('detailedGoals 전체 구조:', detailedGoals);
      console.log('monthlyGoals:', detailedGoals.monthlyGoals);
      console.log('weeklyGoals:', detailedGoals.weeklyGoals);

      // 현재 사용자 ID 가져오기
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      // 1. 기존 active 계획을 inactive로 변경
      const { error: deactivateError } = await supabase
        .from('rehabilitation_goals')
        .update({ plan_status: 'inactive' })
        .eq('patient_id', selectedPatient)
        .eq('plan_status', 'active');

      if (deactivateError) {
        console.error('기존 계획 비활성화 실패:', deactivateError);
        throw deactivateError;
      }

      // 2. AI 추천 ID 가져오기 (평가 ID로 조회)
      let aiRecommendationId = recommendationId;
      
      if (!aiRecommendationId && currentAssessmentId) {
        // recommendationId가 없으면 평가 ID로 AI 추천 조회
        const { data: aiRec, error: aiError } = await supabase
          .from('ai_goal_recommendations')
          .select('id')
          .eq('assessment_id', currentAssessmentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (aiRec) {
          aiRecommendationId = aiRec.id;
          console.log('AI 추천 ID 조회됨:', aiRecommendationId);
        }
      }

      // 3. AI 추천 상태 업데이트
      if (aiRecommendationId) {
        const { error: updateError } = await supabase
          .from('ai_goal_recommendations')
          .update({
            is_active: true,
            applied_at: new Date().toISOString(),
            applied_by: currentUserId,
            selected_plan_number: detailedGoals.selectedIndex + 1
          })
          .eq('id', aiRecommendationId);

        if (updateError) {
          console.error('AI 추천 상태 업데이트 실패:', updateError);
          // 실패해도 계속 진행
        }
      }

      // 3. 목표들을 데이터베이스에 저장
      const goalsToInsert = [];
      
      // 6개월 목표
      const sixMonthGoalId = crypto.randomUUID();
      const sixMonthGoal = detailedGoals.sixMonthGoal;
      
      console.log('💾 저장할 6개월 목표:', sixMonthGoal);
      console.log('💾 사용할 AI 추천 ID:', aiRecommendationId);
      
      // 6개월 목표 저장
      goalsToInsert.push({
        id: sixMonthGoalId,
        patient_id: selectedPatient,
        parent_goal_id: null,
        title: sixMonthGoal.goal || sixMonthGoal.title || '6개월 목표',
        description: sixMonthGoal.details || sixMonthGoal.description || '',
        goal_type: 'six_month',
        sequence_number: 1,
        start_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
        status: 'active',
        plan_status: 'active',
        is_ai_suggested: true,
        source_recommendation_id: aiRecommendationId || null, // AI 추천 ID 사용
        is_from_ai_recommendation: true,
        created_by_social_worker_id: currentUserId
      });

      // 월간 목표들
      console.log('💾 저장할 월간 목표들:', detailedGoals.monthlyGoals);
      
      detailedGoals.monthlyGoals?.forEach((monthlyPlan, monthIndex) => {
          const monthlyGoalId = crypto.randomUUID();
          
          goalsToInsert.push({
            id: monthlyGoalId,
            patient_id: selectedPatient,
            parent_goal_id: sixMonthGoalId,
            title: monthlyPlan.goal || monthlyPlan.title || `${monthIndex + 1}개월차 목표`,
            description: monthlyPlan.activities?.join(', ') || monthlyPlan.description || '',
            goal_type: 'monthly',
            sequence_number: monthIndex + 1,
            start_date: new Date(new Date().setMonth(new Date().getMonth() + monthIndex)).toISOString().split('T')[0],
            end_date: new Date(new Date().setMonth(new Date().getMonth() + monthIndex + 1)).toISOString().split('T')[0],
            status: monthIndex === 0 ? 'active' : 'pending',
            plan_status: 'active',
            is_ai_suggested: true,
            source_recommendation_id: aiRecommendationId || null,
            is_from_ai_recommendation: true,
            created_by_social_worker_id: currentUserId
          });

          // 주간 목표들
          console.log('💾 저장할 주간 목표들:', detailedGoals.weeklyGoals);
          
          detailedGoals.weeklyGoals
            ?.filter(weeklyPlan => {
              // weeklyPlan.month 필드를 직접 사용
              return (weeklyPlan.month - 1) === monthIndex;
            })
            ?.forEach((weeklyPlan, weekIndex) => {
              goalsToInsert.push({
                id: crypto.randomUUID(),
                patient_id: selectedPatient,
                parent_goal_id: monthlyGoalId,
                title: weeklyPlan.plan || weeklyPlan.title || `${weeklyPlan.week}주차 목표`,
                description: weeklyPlan.description || '',
                goal_type: 'weekly',
                sequence_number: parseInt(weeklyPlan.week || `${weekIndex + 1}`),
                start_date: new Date(new Date().setMonth(new Date().getMonth() + monthIndex)).toISOString().split('T')[0],
                end_date: new Date(new Date().setMonth(new Date().getMonth() + monthIndex)).toISOString().split('T')[0],
                status: monthIndex === 0 && weekIndex === 0 ? 'active' : 'pending',
                plan_status: 'active',
                is_ai_suggested: true,
                source_recommendation_id: aiRecommendationId || null,
                is_from_ai_recommendation: true,
                created_by_social_worker_id: currentUserId
              });
            });
        });

      // 목표들을 DB에 저장
      console.log('💾 저장할 목표 개수:', goalsToInsert.length);
      console.log('💾 저장할 목표 데이터:', goalsToInsert);
      
      const { error: goalsError } = await supabase
        .from('rehabilitation_goals')
        .insert(goalsToInsert);

      if (goalsError) {
        console.error('목표 저장 실패:', goalsError);
        throw goalsError;
      }

      // 3. 환자 상태를 active로 변경
      const { error: patientError } = await supabase
        .from('patients')
        .update({ status: 'active' })
        .eq('id', selectedPatient);

      if (patientError) {
        console.error('환자 상태 업데이트 실패:', patientError);
        throw patientError;
      }

      // 성공 메시지
      alert(MESSAGES.success.goalsSaved);
      
      // 초기 상태로 리셋
      resetFlow();
      
      // 환자 목록 새로고침
      refetch();

    } catch (error: any) {
      console.error('목표 저장 중 오류:', error);
      
      // 구체적인 오류 메시지 표시
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
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                3개의 맞춤형 목표가 생성되었습니다.
              </h3>
            </div>

            {/* AI 분석 요약 - 접이식 */}
            {(aiRecommendations.reasoning || aiRecommendations.patient_analysis) && (
              <div className="bg-white rounded-lg shadow-sm">
                <details className="group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-sm">📋</span>
                      </div>
                      <span className="font-medium text-gray-900">환자 분석</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mt-3">
                      {aiRecommendations.reasoning || aiRecommendations.patient_analysis?.insights || '분석 정보를 불러오는 중...'}
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* 추천 목표 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                  <Target className="h-4 w-4 text-red-600" />
                </div>
                <h4 className="font-semibold text-gray-900">추천 목표 (3개)</h4>
              </div>

              <div className="space-y-3">
                {(aiRecommendations.goals || []).map((goal: any, index: number) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedGoal === index.toString()
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedGoal(index.toString())}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="goal"
                        value={index.toString()}
                        checked={selectedGoal === index.toString()}
                        onChange={() => setSelectedGoal(index.toString())}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-600">목표 {index + 1}</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {goal.title?.replace(/^목표\s*\d+[:\.]?\s*/, '') || `목표 ${index + 1}`}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-yellow-600 mt-0.5">🎯</span>
                            <div>
                              <span className="font-medium text-gray-700">목적:</span>
                              <span className="text-gray-600 ml-1">
                                {goal.purpose || '목적 설명'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">⭕</span>
                            <div>
                              <span className="font-medium text-gray-700">6개월 목표:</span>
                              <span className="text-gray-600 ml-1">
                                {goal.sixMonthGoal || '목표 설정 중'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setCurrentStep(2);
                  setAiRecommendations(null);
                  setSelectedGoal('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                평가 다시하기
              </button>
              <button
                onClick={() => {
                  console.log('🔥 목표 설정하기 버튼 클릭됨!');
                  console.log('선택된 목표:', selectedGoal);
                  console.log('AI 추천 데이터:', aiRecommendations);
                  
                  if (!selectedGoal) {
                    alert('하나의 목표를 선택해주세요.');
                    return;
                  }
                  
                  const selectedGoalData = aiRecommendations.goals[parseInt(selectedGoal)];
                  console.log('선택된 목표 데이터:', selectedGoalData);
                  
                  // 선택한 목표만 상세 구조 생성
                  const detailed = {
                    selectedIndex: parseInt(selectedGoal),
                    sixMonthGoal: selectedGoalData,
                    monthlyGoals: selectedGoalData.monthlyGoals || [],
                    weeklyGoals: selectedGoalData.weeklyPlans || []
                  };
                  
                  console.log('생성된 상세 목표:', detailed);
                  setDetailedGoals(detailed);
                  console.log('Step 5로 이동 중...');
                  setCurrentStep(5);
                }}
                disabled={!selectedGoal}
                className={`px-6 py-2 rounded-lg font-medium ${
                  selectedGoal
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                목표 설정하기
              </button>
            </div>
          </div>
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
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                선택한 목표의 계층적 구조가 생성되었습니다.
              </h3>
              <p className="text-center text-gray-600 text-sm">
                목표 {(detailedGoals.selectedIndex || 0) + 1}: {detailedGoals.sixMonthGoal.title}
              </p>
            </div>

            {/* 6개월 전체 목표 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">6개월 전체 목표</h4>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
                <h5 className="font-semibold text-blue-900 mb-2">{detailedGoals.sixMonthGoal.title}</h5>
                <div className="text-blue-800 text-sm">
                  <p className="font-medium mb-1">6개월 목표:</p>
                  <p>{detailedGoals.sixMonthGoal.sixMonthGoal || detailedGoals.sixMonthGoal.goal}</p>
                  <p className="mt-2">목적: {detailedGoals.sixMonthGoal.purpose}</p>
                </div>
              </div>
            </div>

            {/* 탭 형태의 월간/주간 목표 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setViewMode('monthly')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 ${
                      viewMode === 'monthly' 
                        ? 'border-green-500 text-green-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    월간 목표 ({detailedGoals.monthlyGoals.length}개)
                  </button>
                  <button
                    onClick={() => setViewMode('weekly')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 ${
                      viewMode === 'weekly' 
                        ? 'border-orange-500 text-orange-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    주간 목표 ({detailedGoals.weeklyGoals.length}주)
                  </button>
                </div>
              </div>

              <div className="p-4">
                {/* 월간 목표 뷰 */}
                {(!viewMode || viewMode === 'monthly') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {detailedGoals.monthlyGoals.map((goal: any, index: number) => (
                      <div key={goal.month || index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-green-900 text-sm">{goal.month || index + 1}개월차</h5>
                        </div>
                        <p className="text-green-800 text-xs">{goal.goal}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 주간 목표 뷰 */}
                {viewMode === 'weekly' && (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map(month => (
                      <div key={month}>
                        <h5 className="font-semibold text-orange-900 mb-2 text-sm">
                          {month}개월차 ({month*4-3}주 ~ {month*4}주)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                          {detailedGoals.weeklyGoals
                            .filter((goal: any) => goal.month === month)
                            .map((goal: any, index: number) => (
                              <div key={goal.week || index} className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <h6 className="font-medium text-orange-900 text-xs">{goal.week}주차</h6>
                                </div>
                                <p className="text-orange-800 text-xs">{goal.plan}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setCurrentStep(4);
                  setDetailedGoals(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                목표 다시 선택
              </button>
              <div className="space-x-3">
                <button
                  onClick={handleSaveGoals}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      저장 중...
                    </>
                  ) : (
                    '목표 저장하기'
                  )}
                </button>
                <button
                  onClick={() => {
                    resetFlow();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  새 목표 설정
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GoalSetting;
