import { useState, useCallback } from 'react';
import type { AssessmentFormData } from '@/utils/GoalSetting/types';

interface UseGoalSettingFlowReturn {
  // State
  selectedPatient: string | null;
  currentStep: number;
  currentAssessmentId: string | null;
  recommendationId: string | null;
  selectedGoal: string;
  detailedGoals: unknown;
  viewMode: 'monthly' | 'weekly';
  formData: AssessmentFormData;
  
  // Actions
  handlePatientSelect: (patientId: string) => void;
  setCurrentStep: (step: number) => void;
  setCurrentAssessmentId: (id: string | null) => void;
  setRecommendationId: (id: string | null) => void;
  setSelectedGoal: (goal: string) => void;
  setDetailedGoals: (goals: unknown) => void;
  setViewMode: (mode: 'monthly' | 'weekly') => void;
  updateFormData: (updates: Partial<AssessmentFormData>) => void;
  resetFlow: () => void;
  moveToNextStep: () => void;
  moveToPreviousStep: () => void;
}

const initialFormData: AssessmentFormData = {
  focusTime: '',
  motivationLevel: 5,
  pastSuccesses: [],
  pastSuccessesOther: '',
  constraints: [],
  constraintsOther: '',
  socialPreference: '',
};

export const useGoalSettingFlow = (): UseGoalSettingFlowReturn => {
  // 전체 플로우 상태 관리
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [detailedGoals, setDetailedGoals] = useState<unknown>(null);
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [formData, setFormData] = useState<AssessmentFormData>(initialFormData);

  // 환자 선택 핸들러
  const handlePatientSelect = useCallback((patientId: string) => {
    setSelectedPatient(patientId);
    setCurrentStep(2);
    // 모든 상태 초기화
    resetPartialState();
  }, []);

  // 폼 데이터 업데이트
  const updateFormData = useCallback((updates: Partial<AssessmentFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // 부분 상태 초기화 (환자 선택은 유지)
  const resetPartialState = useCallback(() => {
    setCurrentAssessmentId(null);
    setRecommendationId(null);
    setSelectedGoal('');
    setDetailedGoals(null);
    setViewMode('monthly');
    setFormData(initialFormData);
  }, []);

  // 전체 플로우 초기화
  const resetFlow = useCallback(() => {
    setSelectedPatient(null);
    setCurrentStep(1);
    resetPartialState();
  }, [resetPartialState]);

  // 다음 단계로 이동
  const moveToNextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  }, []);

  // 이전 단계로 이동
  const moveToPreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  return {
    // State
    selectedPatient,
    currentStep,
    currentAssessmentId,
    recommendationId,
    selectedGoal,
    detailedGoals,
    viewMode,
    formData,
    
    // Actions
    handlePatientSelect,
    setCurrentStep,
    setCurrentAssessmentId,
    setRecommendationId,
    setSelectedGoal,
    setDetailedGoals,
    setViewMode,
    updateFormData,
    resetFlow,
    moveToNextStep,
    moveToPreviousStep,
  };
};
