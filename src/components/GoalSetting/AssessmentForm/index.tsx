import React from 'react';
import { Loader2 } from 'lucide-react';
import FocusTimeSection from './FocusTimeSection';
import MotivationSection from './MotivationSection';
import PastSuccessSection from './PastSuccessSection';
import ConstraintsSection from './ConstraintsSection';
import SocialPreferenceSection from './SocialPreferenceSection';

interface AssessmentFormData {
  focusTime: string;
  motivationLevel: number;
  pastSuccesses: string[];
  pastSuccessesOther: string;
  constraints: string[];
  constraintsOther: string;
  socialPreference: string;
}

interface Patient {
  id: string;
  full_name: string;
}

interface AssessmentFormProps {
  formData: AssessmentFormData;
  selectedPatient: string | null;
  patients: Patient[];
  isProcessing: boolean;
  onFormDataChange: (updates: Partial<AssessmentFormData>) => void;
  onSubmit: () => void;
  isFormValid: () => boolean;
  handleFocusTimeChange: (value: string) => void;
  handleMotivationChange: (value: number) => void;
  handlePastSuccessChange: (value: string, checked: boolean) => void;
  handleConstraintChange: (value: string, checked: boolean) => void;
  handleSocialPreferenceChange: (value: string) => void;
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({
  formData,
  selectedPatient,
  patients,
  isProcessing,
  onFormDataChange,
  onSubmit,
  isFormValid,
  handleFocusTimeChange,
  handleMotivationChange,
  handlePastSuccessChange,
  handleConstraintChange,
  handleSocialPreferenceChange
}) => {
  const selectedPatientName = patients?.find(p => p.id === selectedPatient)?.full_name;

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">맞춤형 목표 설정 질문지</h2>
        <p className="text-gray-600">
          {selectedPatientName}님의 개인별 특성을 파악하여 최적의 재활 목표를 추천해드립니다.
        </p>
      </div>

      <FocusTimeSection 
        value={formData.focusTime}
        onChange={handleFocusTimeChange}
      />
      
      <MotivationSection
        value={formData.motivationLevel}
        onChange={handleMotivationChange}
      />
      
      <PastSuccessSection
        selectedValues={formData.pastSuccesses}
        otherValue={formData.pastSuccessesOther}
        onValueChange={handlePastSuccessChange}
        onOtherChange={(value) => onFormDataChange({ pastSuccessesOther: value })}
      />
      
      <ConstraintsSection
        selectedValues={formData.constraints}
        otherValue={formData.constraintsOther}
        onValueChange={handleConstraintChange}
        onOtherChange={(value) => onFormDataChange({ constraintsOther: value })}
      />
      
      <SocialPreferenceSection
        value={formData.socialPreference}
        onChange={handleSocialPreferenceChange}
      />

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={onSubmit}
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
  );
};

export default AssessmentForm;