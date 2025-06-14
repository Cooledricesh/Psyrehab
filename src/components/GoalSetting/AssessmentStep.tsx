import React from 'react';
import { Brain, Target, History, AlertTriangle, Users } from 'lucide-react';
import {
  FOCUS_TIME_OPTIONS,
  PAST_SUCCESS_OPTIONS,
  CONSTRAINT_OPTIONS,
  SOCIAL_PREFERENCE_OPTIONS
} from '@/utils/GoalSetting/constants';
import { getMotivationText } from '@/utils/GoalSetting/helpers';
import { AssessmentFormData, Patient } from '@/utils/GoalSetting/types';

interface AssessmentStepProps {
  formData: AssessmentFormData;
  selectedPatient: string | null;
  patients: Patient[];
  onFocusTimeChange: (value: string) => void;
  onMotivationChange: (value: number) => void;
  onPastSuccessChange: (value: string, checked: boolean) => void;
  onConstraintChange: (value: string, checked: boolean) => void;
  onSocialPreferenceChange: (value: string) => void;
  onFormDataChange: (updates: Partial<AssessmentFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

const AssessmentStep: React.FC<AssessmentStepProps> = ({
  formData,
  selectedPatient,
  patients,
  onFocusTimeChange,
  onMotivationChange,
  onPastSuccessChange,
  onConstraintChange,
  onSocialPreferenceChange,
  onFormDataChange,
  onNext,
  onBack,
  isProcessing
}) => {
  const handleNext = () => {
    onNext();
  };

  return (
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
            {FOCUS_TIME_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="focusTime"
                  value={option.value}
                  checked={formData.focusTime === option.value}
                  onChange={(e) => onFocusTimeChange(e.target.value)}
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
              onChange={(e) => onMotivationChange(parseInt(e.target.value))}
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
              {PAST_SUCCESS_OPTIONS.map((item) => (
                <label key={item.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pastSuccesses.includes(item.value)}
                    onChange={(e) => onPastSuccessChange(item.value, e.target.checked)}
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
                onChange={(e) => onFormDataChange({ pastSuccessesOther: e.target.value })}
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
              {CONSTRAINT_OPTIONS.map((item) => (
                <label key={item.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.constraints.includes(item.value)}
                    onChange={(e) => onConstraintChange(item.value, e.target.checked)}
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
                onChange={(e) => onFormDataChange({ constraintsOther: e.target.value })}
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
            다른 사람들과 함께하는 활동을 어떻게 생각하나요?
          </label>
          <div className="space-y-3">
            {SOCIAL_PREFERENCE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="socialPreference"
                  value={option.value}
                  checked={formData.socialPreference === option.value}
                  onChange={(e) => onSocialPreferenceChange(e.target.value)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-3 text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 버튼 그룹 */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          이전 단계
        </button>
        <button
          onClick={handleNext}
          disabled={isProcessing}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
        >
          다음 단계
          <ChevronRight className="h-5 w-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default AssessmentStep;
