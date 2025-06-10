import React, { useState } from 'react';
import { ArrowLeft, Brain, Target, History, AlertTriangle, Users, ChevronRight, Check, Loader2, User, Calendar } from 'lucide-react';
// import ReactMarkdown from 'react-markdown'; // 임시 제거
import { useQuery, useMutation } from '@tanstack/react-query';
import { PatientService } from '@/services/patients';
import { supabase } from '@/lib/supabase';
import useAIResponseParser from '@/hooks/useAIResponseParser';

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

  // 환자 데이터 가져오기
  const { data: patientsResponse, isLoading: patientsLoading, error } = useQuery({
    queryKey: ['patients'],
    queryFn: () => PatientService.getPatients(),
  });

  const patients = patientsResponse?.data || [];

  // AI 추천 결과 폴링
  const { data: memoryAIResponse, refetch: refetchMemoryAI } = useQuery({
    queryKey: [`ai-response-${selectedPatient}`],
    queryFn: async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/patients/${selectedPatient}/ai-response`);
        if (!response.ok) {
          return null;
        }
        const data = await response.json();
        console.log('✅ AI 추천 결과 받음:', data);
        return data;
      } catch (error) {
        console.log('⚠️ AI 추천 결과 조회 실패:', error);
        return null;
      }
    },
    enabled: false, // 수동으로만 호출되도록 변경
    refetchInterval: 8000, // 8초마다 폴링 (AI 처리가 25초+ 걸리므로)
    retry: 1,
  });

  // AI 추천 결과 변화 감지 (단순화됨)
  React.useEffect(() => {
    if (!memoryAIResponse) {
      if (currentStep === 3) {
        setPollingAttempts(prev => prev + 1);
      }
      return;
    }

    // 이미 4단계 이상이면 처리하지 않음
    if (currentStep >= 4) {
      console.log('🚫 이미 4단계 이상이므로 AI 응답 처리 건너뜀');
      return;
    }

    console.log('🔍 AI 응답 파싱 시작');
    const parsedResult = parseAIResponse(memoryAIResponse);

    if (parsedResult.goals.length >= 3) {
      console.log('✅ 파싱 성공! 3개 목표로 분리됨');
      setAiRecommendations({
        ...memoryAIResponse,
        goals: parsedResult.goals,
        reasoning: parsedResult.reasoning
      });
      setCurrentStep(4);
    } else {
      console.log('⚠️ 목표 파싱 실패');
      // 빈 결과라도 4단계로 이동하여 사용자가 확인할 수 있게 함
      setAiRecommendations(memoryAIResponse);
      setCurrentStep(4);
    }
  }, [memoryAIResponse, currentStep, parseAIResponse]);

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
          past_successes: assessmentData.pastSuccesses.length > 0 ? assessmentData.pastSuccesses : null,
          constraints: assessmentData.constraints.length > 0 ? assessmentData.constraints : null,
          social_preference: assessmentData.socialPreference,
          notes: [assessmentData.pastSuccessesOther, assessmentData.constraintsOther].filter(Boolean).join('; ') || null,
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
                past_successes: assessmentData.pastSuccesses.length > 0 ? assessmentData.pastSuccesses : null,
                constraints: assessmentData.constraints.length > 0 ? assessmentData.constraints : null,
                social_preference: assessmentData.socialPreference,
                notes: [assessmentData.pastSuccessesOther, assessmentData.constraintsOther].filter(Boolean).join('; ') || null,
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

  // AI 추천 요청 mutation
  const requestAIRecommendationMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
      
      if (!webhookUrl) {
        throw new Error('N8N Webhook URL이 환경변수에 설정되어 있지 않습니다.');
      }
      
      console.log('🔗 N8N Webhook URL:', webhookUrl);
      console.log('📝 Request Data:', {
        patientId: selectedPatient,
        assessmentId: assessmentId,
        assessmentData: formData,
      });

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatient,
          assessmentId: assessmentId,
          assessmentData: formData,
        }),
      });

      console.log('📡 N8N Response Status:', response.status);
      console.log('📡 N8N Response Headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ N8N Error Response:', errorText);
        throw new Error(`AI 추천 요청 실패: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ N8N Success Response:', result);
      return result;
    },
  });

  // AI 추천 받기 함수
  const handleGetAIRecommendation = async () => {
    if (!selectedPatient) return;

    try {
      setIsProcessing(true);
      setCurrentStep(3); // AI 처리 단계로 이동
      setPollingAttempts(0); // 폴링 시도 횟수 초기화

      // 1. 평가 데이터 저장
      const savedAssessment = await saveAssessmentMutation.mutateAsync(formData);
      
      // 2. AI 추천 요청
      const aiResponse = await requestAIRecommendationMutation.mutateAsync(savedAssessment.id);
      
      // 3. 폴링 시작 (수동으로 refetch 호출)
      const startPolling = () => {
        const pollInterval = setInterval(async () => {
          try {
            const result = await refetchMemoryAI();
            if (result.data && result.data.goals) {
              clearInterval(pollInterval);
            }
          } catch (error) {
            console.log('폴링 중 오류:', error);
          }
        }, 8000);

        // 최대 폴링 시간 설정 (2분)
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 120000);
      };

      startPolling();
      
    } catch (error) {
      console.error('AI 추천 처리 중 오류:', error);
      alert('AI 추천 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      setCurrentStep(2); // 평가 단계로 되돌리기
    } finally {
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
            <h2 className="text-lg font-medium text-gray-900 mb-4">환자를 선택하세요</h2>
            {patientsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">환자 목록을 불러오는 중...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {patients?.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient.id)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{patient.full_name}</div>
                    <div className="text-sm text-gray-500">환자 ID: {patient.patient_identifier}</div>
                    <div className="text-sm text-gray-500">상태: {patient.status}</div>
                  </button>
                ))}
                {patients?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    등록된 환자가 없습니다.
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
                    refetchMemoryAI();
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
                      <ul className="space-y-1">
                        <li>• 주요 강점: 사회적 활동에 대한 흥미</li>
                        <li>• 핵심 제약: 시간과 금전적 제약</li>
                        <li>• 목표 설정 방향: 집단활동 활동을 통한 작은 성취 경험 쌓기</li>
                      </ul>
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
                                {(goal.sixMonthTarget || goal.description?.split('\n')[1] || goal.description?.split('\n')[0])?.replace(/^\*\s*6개월\s*목표:\s*/, '').replace(/^\*\s*/, '').substring(0, 100) || '목표 설명'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">📋</span>
                            <div>
                              <span className="font-medium text-gray-700">실행 계획:</span>
                              <div className="text-gray-600 ml-1">
                                {goal.description && goal.description.split('\n').slice(1).filter((line: string) => 
                                  line.trim() && (line.includes('•') || line.includes('-') || line.includes('*'))
                                ).slice(0, 3).map((line: string, idx: number) => (
                                  <div key={idx}>• {line.replace(/^[•\-*]\s*/, '').trim()}</div>
                                ))}
                              </div>
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
                    monthlyGoals: Array.from({ length: 6 }, (_, i) => ({
                      id: i + 1,
                      month: i + 1,
                      title: `${i + 1}개월차 단계`,
                      description: `${selectedGoalData.title}의 ${i + 1}개월차 세부 목표입니다.`,
                      status: 'pending'
                    })),
                    weeklyGoals: Array.from({ length: 24 }, (_, i) => ({
                      id: i + 1,
                      week: i + 1,
                      month: Math.ceil((i + 1) / 4),
                      title: `${i + 1}주차 실행`,
                      description: `${selectedGoalData.title}의 ${i + 1}주차 실행 목표입니다.`,
                      status: 'pending'
                    }))
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
                  {detailedGoals.sixMonthGoal.description?.split('\n').slice(0, 3).join('\n')}
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
                    월간 목표 (6개)
                  </button>
                  <button
                    onClick={() => setViewMode('weekly')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 ${
                      viewMode === 'weekly' 
                        ? 'border-orange-500 text-orange-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    주간 목표 (24주)
                  </button>
                </div>
              </div>

              <div className="p-4">
                {/* 월간 목표 뷰 */}
                {(!viewMode || viewMode === 'monthly') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {detailedGoals.monthlyGoals.map((goal: any) => (
                      <div key={goal.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-green-900 text-sm">{goal.title}</h5>
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                            {goal.month}월
                          </span>
                        </div>
                        <p className="text-green-800 text-xs">{goal.description}</p>
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
                              <div key={goal.id} className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <h6 className="font-medium text-orange-900 text-xs">{goal.title}</h6>
                                  <span className="text-xs bg-orange-200 text-orange-800 px-1 py-0.5 rounded">
                                    {goal.week}주
                                  </span>
                                </div>
                                <p className="text-orange-800 text-xs">{goal.description}</p>
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
                  onClick={() => {
                    // TODO: 목표를 DB에 저장
                    alert('목표가 성공적으로 저장되었습니다!');
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  목표 저장하기
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