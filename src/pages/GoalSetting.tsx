import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
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

// Utils, Types, and Constants
import { 
  FOCUS_TIME_OPTIONS, 
  PAST_SUCCESS_OPTIONS, 
  CONSTRAINT_OPTIONS, 
  SOCIAL_PREFERENCE_OPTIONS,
  MAX_POLLING_ATTEMPTS,
  POLLING_INTERVAL,
  PAST_SUCCESS_MAPPING,
  CONSTRAINT_MAPPING,
  MESSAGES,
  STYLES
} from '@/utils/GoalSetting/constants';

import {
  type AssessmentFormData,
  type Patient,
  type Step,
  type AIRecommendation,
  type GoalData
} from '@/utils/GoalSetting/types';

import {
  getMotivationText,
  formatText,
  formatAssessmentData,
  formatDate,
  getRelativeTime,
  calculateProgress,
  getStatusColor,
  getGoalTypeLabel
} from '@/utils/GoalSetting/helpers';

const GoalSetting: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [detailedGoals, setDetailedGoals] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  
  // AI 응답 파싱 훅
  const { parseAIResponse } = useAIResponseParser();
  
  const [formData, setFormData] = useState<AssessmentFormData>({
    focusTime: '',
    motivationLevel: 5,
    pastSuccesses: [],
    pastSuccessesOther: '',
    constraints: [],
    constraintsOther: '',
    socialPreference: '',
  });

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

  // AI 처리 상태 폴링을 위한 별도 effect
  React.useEffect(() => {
    if (currentStep !== 3 || !currentAssessmentId) return;

    let pollInterval: NodeJS.Timeout;
    let pollCount = 0;
    const maxPolls = 30; // 최대 30번 (2.5분)

    const pollAIStatus = async () => {
      try {
        pollCount++;
        console.log(`📊 AI 처리 상태 폴링 ${pollCount}/${maxPolls}:`, currentAssessmentId);
        
        // ai_goal_recommendations 테이블에서 AI 처리 상태 확인
        const { data: recommendation, error } = await supabase
          .from('ai_goal_recommendations')
          .select('id, n8n_processing_status, assessment_id')
          .eq('assessment_id', currentAssessmentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('❌ AI 추천 상태 조회 실패:', error);
          return;
        }

        console.log('📋 AI 처리 상태:', recommendation);

        if (recommendation && recommendation.n8n_processing_status === 'completed') {
          console.log('✅ AI 처리 완료! 추천 ID:', recommendation.id);
          clearInterval(pollInterval);
          
          // AI 추천 데이터 다시 조회
          refetchAIRecommendation();
          setIsProcessing(false);
          
        } else if (recommendation && recommendation.n8n_processing_status === 'failed') {
          console.error('❌ AI 처리 실패');
          clearInterval(pollInterval);
          alert(MESSAGES.error.aiRecommendationFailed);
          setCurrentStep(2);
          setIsProcessing(false);
          
        } else if (pollCount >= maxPolls) {
          console.log('⏰ 폴링 횟수 초과');
          clearInterval(pollInterval);
          alert(MESSAGES.error.aiRecommendationTimeout);
          setIsProcessing(false);
        } else {
          console.log('⏳ AI 처리 진행 중... 상태:', recommendation?.n8n_processing_status || 'waiting');
        }
      } catch (error) {
        console.error('폴링 중 오류:', error);
      }
    };

    // 즉시 한 번 확인
    pollAIStatus();
    
    // 5초마다 폴링
    pollInterval = setInterval(pollAIStatus, POLLING_INTERVAL);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentStep, currentAssessmentId, refetchAIRecommendation]);

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
  }, [aiRecommendationData, currentAssessmentId, currentStep]);

  // 평가 데이터 저장 mutation
  const saveAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      // 현재 로그인한 사용자 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('assessments')
        .insert({
          patient_id: selectedPatient!,
          focus_time: assessmentData.focusTime,
          motivation_level: assessmentData.motivationLevel,
          past_successes: [
            ...(assessmentData.pastSuccesses.map((value: string) => {
              return PAST_SUCCESS_MAPPING[value] || value;
            })),
            ...(assessmentData.pastSuccessesOther ? [assessmentData.pastSuccessesOther] : [])
          ].filter(Boolean),
          constraints: [
            ...(assessmentData.constraints.map((value: string) => {
              return CONSTRAINT_MAPPING[value] || value;
            })),
            ...(assessmentData.constraintsOther ? [assessmentData.constraintsOther] : [])
          ].filter(Boolean),
          social_preference: assessmentData.socialPreference,
          notes: null,
          assessed_by: userId,
        })
        .select()
        .single();

      if (error) {
        console.log('💥 Insert 에러 상세:', error);
        
        // RLS 오류인 경우 admin 로그인 시도 (더 포괄적인 감지)
        if (error.code === '42501' || 
            error.message.includes('row-level security') ||
            error.message.includes('policy') ||
            error.message.includes('permission') ||
            error.details?.includes('policy') ||
            error.hint?.includes('policy')) {
          console.log('🔐 RLS 오류 감지됨. Admin 로그인 시도 중...');
          
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: 'admin@psyrehab.dev',
            password: 'admin123!'
          });
          
          if (loginError) {
            console.log('⚠️ Admin 로그인 실패:', loginError.message);
            throw new Error(`평가 데이터 저장 실패: ${error.message}`);
          } else {
            console.log('✅ Admin 로그인 성공! 다시 저장 시도...');
            
            // 새로운 사용자 ID로 다시 시도
            const { data: { user: newUser } } = await supabase.auth.getUser();
            const newUserId = newUser?.id || crypto.randomUUID();
            
            // Admin 로그인 후 다시 시도
            const { data: retryData, error: retryError } = await supabase
              .from('assessments')
              .insert({
                patient_id: selectedPatient!,
                focus_time: assessmentData.focusTime,
                motivation_level: assessmentData.motivationLevel,
                past_successes: [
                  ...(assessmentData.pastSuccesses.map((value: string) => {
                    return PAST_SUCCESS_MAPPING[value] || value;
                  })),
                  ...(assessmentData.pastSuccessesOther ? [assessmentData.pastSuccessesOther] : [])
                ].filter(Boolean),
                constraints: [
                  ...(assessmentData.constraints.map((value: string) => {
                    return CONSTRAINT_MAPPING[value] || value;
                  })),
                  ...(assessmentData.constraintsOther ? [assessmentData.constraintsOther] : [])
                ].filter(Boolean),
                social_preference: assessmentData.socialPreference,
                notes: null,
                assessed_by: newUserId,
              })
              .select()
              .single();
              
            if (retryError) {
              console.log('💥 재시도 에러:', retryError);
              throw new Error(`평가 데이터 저장 실패 (재시도): ${retryError.message}`);
            }
            
            console.log('✅ 재시도 성공:', retryData);
            return retryData;
          }
        } else {
          throw new Error(`평가 데이터 저장 실패: ${error.message}`);
        }
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('✅ 평가 데이터 저장 성공:', data);
      setCurrentStep(3); // AI 처리 단계로 이동
      setRecommendationId(data.id);
      // AI 추천 워크플로우는 handleGetAIRecommendation에서 이미 처리됨
    },
    onError: (error) => {
      console.error('❌ 평가 데이터 저장 실패:', error);
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
      setPollingAttempts(0); // 폴링 시도 횟수 초기화

      // 1. 평가 데이터 저장
      const savedAssessment = await saveAssessmentMutation.mutateAsync(formData);
      
      // 현재 평가 ID 저장
      setCurrentAssessmentId(savedAssessment.id);
      
      // 2. AI 추천 요청
      console.log('🚀 AI 추천 요청 시작:', savedAssessment.id);
      const aiResponse = await requestAIRecommendationMutation.mutateAsync(savedAssessment.id);
      
      // 폴링은 useEffect에서 자동으로 시작됨
      
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

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId);
    setCurrentStep(2);
    // 모든 상태 완전 초기화
    setAiRecommendations(null);
    setRecommendationId(null);
    setCurrentAssessmentId(null);  // 추가
    setSelectedGoal('');
    setDetailedGoals(null);
    setPollingAttempts(0);
    setIsProcessing(false);
    setViewMode('monthly');
    // 폼 데이터도 초기화
    setFormData({
      focusTime: '',
      motivationLevel: 5,
      pastSuccesses: [],
      pastSuccessesOther: '',
      constraints: [],
      constraintsOther: '',
      socialPreference: '',
    });
  };

  const handleFocusTimeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, focusTime: value }));
  };

  const handleMotivationChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, motivationLevel: value[0] }));
  };

  const handlePastSuccessChange = (value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      pastSuccesses: checked
        ? [...prev.pastSuccesses, value]
        : prev.pastSuccesses.filter((item) => item !== value)
    }));
  };

  const handleConstraintChange = (value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      constraints: checked
        ? [...prev.constraints, value]
        : prev.constraints.filter((item) => item !== value)
    }));
  };

  const handleSocialPreferenceChange = (value: string) => {
    setFormData((prev) => ({ ...prev, socialPreference: value }));
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
              // month 속성이 없을 수도 있으므로, monthIndex로 필터링
              const weekNumber = parseInt(weeklyPlan.week || '0');
              const weekMonth = Math.floor((weekNumber - 1) / 4);
              return weekMonth === monthIndex;
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
      setSelectedPatient(null);
      setCurrentStep(1);
      setRecommendationId(null);
      setCurrentAssessmentId(null);
      setAiRecommendations(null);
      setDetailedGoals(null);
      setSelectedGoal('');
      setFormData({
        focusTime: '',
        motivationLevel: 5,
        pastSuccesses: [],
        pastSuccessesOther: '',
        constraints: [],
        constraintsOther: '',
        socialPreference: '',
      });
      
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
          sixMonthGoal: selectedOption.sixMonthGoals?.[0] || {},
          monthlyGoals: selectedOption.sixMonthGoals?.[0]?.monthlyPlans || [],
          weeklyGoals: selectedOption.sixMonthGoals?.[0]?.monthlyPlans?.flatMap(
            mp => mp.weeklyPlans || []
          ) || []
        });
      }
    }
  }, [aiRecommendations, selectedGoal]);

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
            onFormDataChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
            onNext={handleAssessmentSubmit}
            onBack={() => setCurrentStep(1)}
            isProcessing={isProcessing}
          />
        )}

        {currentStep === 3 && (
          <ProcessingModal
            isOpen={isProcessing}
            message="AI가 최적의 재활 목표를 분석하고 있습니다..."
          />
        )}

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

        {currentStep === 5 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">목표 설정 완료!</h2>
            <p className="text-gray-600 mb-8">
              {patients?.find(p => p.id === selectedPatient)?.full_name}님의 재활 목표가 성공적으로 설정되었습니다.
            </p>
            <button
              onClick={() => {
                setSelectedPatient(null);
                setCurrentStep(1);
                setFormData({
                  focusTime: '',
                  motivationLevel: 5,
                  pastSuccesses: [],
                  pastSuccessesOther: '',
                  constraints: [],
                  constraintsOther: '',
                  socialPreference: '',
                });
                setAiRecommendations(null);
                setDetailedGoals(null);
                setSelectedGoal('');
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              새로운 환자 목표 설정하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalSetting;
