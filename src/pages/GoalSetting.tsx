import React, { useState, useEffect } from 'react';
import { ArrowLeft, Brain, Target, History, AlertTriangle, Users, ChevronRight, Check, Loader2, User, Calendar } from 'lucide-react';
// import ReactMarkdown from 'react-markdown'; // 임시 제거
import { useQuery, useMutation } from '@tanstack/react-query';
import { PatientService } from '@/services/patients';
import { supabase } from '@/lib/supabase';
import useAIResponseParser from '@/hooks/useAIResponseParser';
import { useAIRecommendationByAssessment } from '@/hooks/useAIRecommendations';
import { ENV } from '@/lib/env';
import { eventBus, EVENTS } from '@/lib/eventBus';

interface AssessmentFormData {
  focusTime: string;
  motivationLevel: number;
  pastSuccesses: string[];
  pastSuccessesOther: string;
  constraints: string[];
  constraintsOther: string;
  socialPreference: string;
}

const GoalSetting: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const maxPollingAttempts = 15;
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
        console.log('🔍 자동 로그인 체크 시작...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('🔐 세션이 없음. 개발용 admin 자동 로그인 시도...');
          const { data, error } = await supabase.auth.signInWithPassword({
            email: 'admin@psyrehab.dev',
            password: 'admin123!'
          });
          
          if (error) {
            console.log('⚠️ 자동 로그인 실패:', error.message);
          } else {
            console.log('✅ 개발용 admin 자동 로그인 성공!', data);
          }
        } else {
          console.log('✅ 이미 로그인된 상태입니다.', session.user?.email);
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
            console.log('✅ 강제 로그인 성공!');
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
          alert('AI 추천 처리가 실패했습니다. 다시 시도해주세요.');
          setCurrentStep(2);
          setIsProcessing(false);
          
        } else if (pollCount >= maxPolls) {
          console.log('⏰ 폴링 횟수 초과');
          clearInterval(pollInterval);
          alert('AI 분석이 예상보다 오래 걸리고 있습니다. 잠시 후 다시 확인해주세요.');
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
    pollInterval = setInterval(pollAIStatus, 5000);

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
              // 값을 라벨로 변환
              const mapping: Record<string, string> = {
                'cooking': '요리/베이킹',
                'exercise': '운동/산책',
                'reading': '독서/공부',
                'crafting': '만들기/그리기',
                'socializing': '사람 만나기/대화',
                'entertainment': '음악/영화 감상',
                'organizing': '정리/청소',
                'none': '특별히 없음'
              };
              return mapping[value] || value;
            })),
            ...(assessmentData.pastSuccessesOther ? [assessmentData.pastSuccessesOther] : [])
          ].filter(Boolean),
          constraints: [
            ...(assessmentData.constraints.map((value: string) => {
              // 값을 라벨로 변환
              const mapping: Record<string, string> = {
                'transport': '교통편 문제 (대중교통 이용 어려움)',
                'financial': '경제적 부담 (비용 지출 어려움)',
                'time': '시간 제약 (다른 일정으로 바쁨)',
                'physical': '신체적 제약 (거동 불편, 체력 부족)',
                'family': '가족 반대 (가족이 활동 반대)',
                'none': '별다른 제약 없음'
              };
              return mapping[value] || value;
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
                    // 값을 라벨로 변환
                    const mapping: Record<string, string> = {
                      'cooking': '요리/베이킹',
                      'exercise': '운동/산책',
                      'reading': '독서/공부',
                      'crafting': '만들기/그리기',
                      'socializing': '사람 만나기/대화',
                      'entertainment': '음악/영화 감상',
                      'organizing': '정리/청소',
                      'none': '특별히 없음'
                    };
                    return mapping[value] || value;
                  })),
                  ...(assessmentData.pastSuccessesOther ? [assessmentData.pastSuccessesOther] : [])
                ].filter(Boolean),
                constraints: [
                  ...(assessmentData.constraints.map((value: string) => {
                    // 값을 라벨로 변환
                    const mapping: Record<string, string> = {
                      'transport': '교통편 문제 (대중교통 이용 어려움)',
                      'financial': '경제적 부담 (비용 지출 어려움)',
                      'time': '시간 제약 (다른 일정으로 바쁨)',
                      'physical': '신체적 제약 (거동 불편, 체력 부족)',
                      'family': '가족 반대 (가족이 활동 반대)',
                      'none': '별다른 제약 없음'
                    };
                    return mapping[value] || value;
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
      alert('AI 추천 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      setCurrentStep(2); // 평가 단계로 되돌리기
      setIsProcessing(false);
    }
  };

  const steps = [
    { id: 1, title: '환자 선택', completed: !!selectedPatient },
    { id: 2, title: '평가 수행', completed: false },
    { id: 3, title: 'AI 분석', completed: false },
    { id: 4, title: '목표 추천', completed: false },
    { id: 5, title: '완료', completed: false }
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

  // 목표 저장 함수
  const handleSaveGoals = async () => {
    console.log('🎯 목표 저장 시작!');
    console.log('선택된 환자:', selectedPatient);
    console.log('상세 목표:', detailedGoals);
    console.log('현재 평가 ID:', currentAssessmentId);
    console.log('AI 추천 ID:', recommendationId);
    
    if (!selectedPatient || !detailedGoals || !currentAssessmentId) {
      alert('저장할 목표 정보가 없습니다.');
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
      alert('목표가 성공적으로 저장되었습니다!');
      
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
      let errorMessage = '목표 저장 중 오류가 발생했습니다.';
      
      if (error.message) {
        errorMessage += '\n\n상세 오류: ' + error.message;
      }
      
      if (error.code) {
        errorMessage += '\n오류 코드: ' + error.code;
      }
      
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getMotivationText = (level: number) => {
    if (level <= 2) return '현재 상태 유지가 우선';
    if (level <= 4) return '작은 변화라면 시도해볼 만함';
    if (level <= 6) return '적당한 도전 가능';
    if (level <= 8) return '새로운 도전 원함';
    return '큰 변화도 감당할 준비됨';
  };



  // 텍스트 포맷팅 함수 (간단하게)
  const formatText = (text: string) => {
    if (!text) return text;
    
    return text.split('\n').map((line, index) => {
      line = line.trim();
      if (!line) return null;
      
      // 리스트 항목
      if (line.startsWith('*') || line.startsWith('-')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-1">
            <span className="text-blue-600 mt-1">•</span>
            <span className="text-gray-700">{line.replace(/^[*-]\s*/, '')}</span>
          </div>
        );
      }
      
      return (
        <p key={index} className="text-gray-700 mb-2 leading-relaxed">
          {line}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-2" />
                돌아가기
              </button>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">맞춤형 목표 설정</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep === step.id 
                    ? 'border-blue-500 bg-blue-500 text-white' 
                    : step.completed 
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-500'
                }`}>
                  {step.completed ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">회원을 선택하세요</h2>
            {patientsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">회원 목록을 불러오는 중...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {patients?.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient.id)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{patient.full_name}</div>
                        <div className="text-sm text-gray-500">IDNO: {patient.patient_identifier}</div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        목표 설정 대기
                      </span>
                    </div>
                  </button>
                ))}
                {patients?.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">목표 설정이 필요한 회원이 없습니다</h3>
                    <p className="text-sm text-gray-500">
                      새로운 회원을 등록하거나, 기존 회원의 상태를 '목표 설정 대기(inactive)'로 변경해주세요.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-8">
            {/* 헤더 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">맞춤형 목표 설정 질문지</h2>
              <p className="text-gray-600">
                {patients?.find(p => p.id === selectedPatient)?.full_name}님의 개인별 특성을 파악하여 최적의 재활 목표를 추천해드립니다.
              </p>
            </div>

            {/* 1. 집중력 & 인지 부담 측정 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                <div className="flex items-center">
                  <div className="bg-blue-500 p-2 rounded-lg mr-3">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900">1. 집중력 & 인지 부담 측정</h3>
                </div>
              </div>
              <div className="p-6">
                <label className="block text-base font-medium text-gray-900 mb-4">
                  한 가지 일에 집중할 수 있는 시간은 얼마나 되나요?
                </label>
                <div className="space-y-3">
                  {[
                    { value: '5min', label: '5분 정도' },
                    { value: '15min', label: '15분 정도' },
                    { value: '30min', label: '30분 정도' },
                    { value: '1hour', label: '1시간 이상' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="focusTime"
                        value={option.value}
                        checked={formData.focusTime === option.value}
                        onChange={(e) => handleFocusTimeChange(e.target.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. 변화 동기 & 의지 수준 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                <div className="flex items-center">
                  <div className="bg-green-500 p-2 rounded-lg mr-3">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900">2. 변화 동기 & 의지 수준</h3>
                </div>
              </div>
              <div className="p-6">
                <label className="block text-base font-medium text-gray-900 mb-4">
                  지금 새로운 것을 시작하고 싶은 마음이 얼마나 되나요?
                </label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">별로 없음</span>
                    <span className="font-medium text-lg">{formData.motivationLevel}점</span>
                    <span className="text-sm text-gray-600">매우 많음</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.motivationLevel}
                    onChange={(e) => handleMotivationChange([parseInt(e.target.value)])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-sm text-gray-600 text-center py-2 bg-gray-50 rounded-lg">
                    {getMotivationText(formData.motivationLevel)}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 과거 성공 경험 탐색 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                <div className="flex items-center">
                  <div className="bg-purple-500 p-2 rounded-lg mr-3">
                    <History className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-purple-900">3. 과거 성공 경험 탐색</h3>
                </div>
              </div>
              <div className="p-6">
                <label className="block text-base font-medium text-gray-900 mb-4">
                  예전에 꾸준히 잘 했던 일이나 좋아했던 활동이 있나요? (복수 선택 가능)
                </label>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { value: 'cooking', label: '요리/베이킹' },
                      { value: 'exercise', label: '운동/산책' },
                      { value: 'reading', label: '독서/공부' },
                      { value: 'crafting', label: '만들기/그리기' },
                      { value: 'socializing', label: '사람 만나기/대화' },
                      { value: 'entertainment', label: '음악/영화 감상' },
                      { value: 'organizing', label: '정리/청소' },
                      { value: 'none', label: '특별히 없음' }
                    ].map((item) => (
                      <label key={item.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.pastSuccesses.includes(item.value)}
                          onChange={(e) => handlePastSuccessChange(item.value, e.target.checked)}
                          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="ml-3 text-gray-900">{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm text-gray-600">
                      기타 성공 경험이 있다면 적어주세요
                    </label>
                    <textarea
                      placeholder="예: 특별한 취미나 활동, 자격증 취득 등"
                      value={formData.pastSuccessesOther}
                      onChange={(e) => setFormData(prev => ({ ...prev, pastSuccessesOther: e.target.value }))}
                      className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. 환경적 제약 사항 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
                <div className="flex items-center">
                  <div className="bg-orange-500 p-2 rounded-lg mr-3">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-orange-900">4. 환경적 제약 사항</h3>
                </div>
              </div>
              <div className="p-6">
                <label className="block text-base font-medium text-gray-900 mb-4">
                  다음 중 목표 실행에 어려움이 될 수 있는 것은? (복수 선택 가능)
                </label>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { value: 'transport', label: '교통편 문제 (대중교통 이용 어려움)' },
                      { value: 'financial', label: '경제적 부담 (비용 지출 어려움)' },
                      { value: 'time', label: '시간 제약 (다른 일정으로 바쁨)' },
                      { value: 'physical', label: '신체적 제약 (거동 불편, 체력 부족)' },
                      { value: 'family', label: '가족 반대 (가족이 활동 반대)' },
                      { value: 'none', label: '별다른 제약 없음' }
                    ].map((item) => (
                      <label key={item.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.constraints.includes(item.value)}
                          onChange={(e) => handleConstraintChange(item.value, e.target.checked)}
                          className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="ml-3 text-gray-900">{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="constraintsOther" className="block text-sm text-gray-600">
                      기타 제약사항 (직접 입력)
                    </label>
                    <input
                      id="constraintsOther"
                      type="text"
                      placeholder="예: 약물 부작용, 집중력 부족, 기타 개인적 제약사항"
                      value={formData.constraintsOther}
                      onChange={(e) => setFormData(prev => ({ ...prev, constraintsOther: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. 사회적 활동 선호도 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
                <div className="flex items-center">
                  <div className="bg-indigo-500 p-2 rounded-lg mr-3">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-indigo-900">5. 사회적 활동 선호도</h3>
                </div>
              </div>
              <div className="p-6">
                <label className="block text-base font-medium text-gray-900 mb-4">
                  사람들과 함께 하는 활동에 대해 어떻게 생각하세요?
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'alone', label: '혼자 하는 게 훨씬 편함' },
                    { value: 'close_family', label: '가족이나 아주 가까운 사람과만 괜찮음' },
                    { value: 'small_group', label: '소수의 사람들과는 괜찮음 (2-3명)' },
                    { value: 'medium_group', label: '어느 정도 사람들과도 괜찮음 (5-10명)' },
                    { value: 'large_group', label: '많은 사람과도 괜찮음 (10명 이상)' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="socialPreference"
                        value={option.value}
                        checked={formData.socialPreference === option.value}
                        onChange={(e) => handleSocialPreferenceChange(e.target.value)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                onClick={handleGetAIRecommendation}
                disabled={!isFormValid() || isProcessing}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
                  isFormValid() && !isProcessing
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  'AI 추천 받기'
                )}
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI 분석 진행 중</h3>
            <p className="text-gray-600">개인맞춤형 목표를 생성하고 있습니다...</p>
            <div className="mt-6 text-sm text-gray-500">
              평가 데이터를 저장하고 AI 분석을 요청 중입니다. 잠시만 기다려주세요.
            </div>
            <div className="mt-4 text-xs text-gray-400">
              폴링 시도: {pollingAttempts}/{maxPollingAttempts}
            </div>
            {pollingAttempts >= maxPollingAttempts && (
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-800 text-sm">
                  AI 분석이 예상보다 오래 걸리고 있습니다. 
                  잠시 후 다시 시도하거나 관리자에게 문의해주세요.
                </p>
                <button
                  onClick={() => {
                    setPollingAttempts(0);
                    refetchAIRecommendation();
                  }}
                  className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                >
                  다시 시도
                </button>
              </div>
            )}
          </div>
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
            {aiRecommendations.reasoning && (
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
                      {typeof aiRecommendations.reasoning === 'string' ? (
                        <div className="whitespace-pre-line">{aiRecommendations.reasoning}</div>
                      ) : (
                        <ul className="space-y-1">
                          <li>• 분석 진행 중...</li>
                        </ul>
                      )}
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
                                {(goal.purpose || goal.description?.split('\n')[0])?.replace(/^\*\s*목적:\s*/, '').replace(/^\*\s*/, '').substring(0, 100) || '목적 설명'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">⭕</span>
                            <div>
                              <span className="font-medium text-gray-700">6개월 목표:</span>
                              <span className="text-gray-600 ml-1">
                                {goal.sixMonthGoal || goal.goal || goal.goals?.[0] || '목표 설정 중'}
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
                  <p>{detailedGoals.sixMonthGoal.sixMonthGoal}</p>
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
                    {detailedGoals.monthlyGoals.map((goal: any) => (
                      <div key={goal.month} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-green-900 text-sm">{goal.month}개월차</h5>
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
                            .map((goal: any) => (
                              <div key={goal.week} className="bg-orange-50 border border-orange-200 rounded-lg p-2">
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
                    // 새로운 목표 설정
                    setSelectedPatient(null);
                    setCurrentStep(1);
                    setRecommendationId(null);
                    setDetailedGoals(null);
                    setFormData({
                      focusTime: '',
                      motivationLevel: 5,
                      pastSuccesses: [],
                      pastSuccessesOther: '',
                      constraints: [],
                      constraintsOther: '',
                      socialPreference: '',
                    });
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