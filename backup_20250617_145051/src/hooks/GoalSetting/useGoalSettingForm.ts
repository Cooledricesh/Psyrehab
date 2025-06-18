import { useState } from 'react';

interface AssessmentFormData {
  focusTime: string;
  motivationLevel: number;
  pastSuccesses: string[];
  pastSuccessesOther: string;
  constraints: string[];
  constraintsOther: string;
  socialPreference: string;
}

export const useGoalSettingForm = () => {
  const [formData, setFormData] = useState<AssessmentFormData>({
    focusTime: '',
    motivationLevel: 5,
    pastSuccesses: [],
    pastSuccessesOther: '',
    constraints: [],
    constraintsOther: '',
    socialPreference: '',
  });

  const handleFocusTimeChange = (value: string) => {
    setFormData(prev => ({ ...prev, focusTime: value }));
  };

  const handleMotivationChange = (value: number[]) => {
    setFormData(prev => ({ ...prev, motivationLevel: value[0] }));
  };

  const handlePastSuccessChange = (value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      pastSuccesses: checked
        ? [...prev.pastSuccesses, value]
        : prev.pastSuccesses.filter(item => item !== value),
    }));
  };

  const handleConstraintChange = (value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      constraints: checked
        ? [...prev.constraints, value]
        : prev.constraints.filter(item => item !== value),
    }));
  };

  const handleSocialPreferenceChange = (value: string) => {
    setFormData(prev => ({ ...prev, socialPreference: value }));
  };

  const isFormValid = () => {
    return formData.focusTime && formData.socialPreference && 
           (formData.pastSuccesses.length > 0 || formData.pastSuccessesOther);
  };

  const resetForm = () => {
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

  return {
    formData,
    setFormData,
    handleFocusTimeChange,
    handleMotivationChange,
    handlePastSuccessChange,
    handleConstraintChange,
    handleSocialPreferenceChange,
    isFormValid,
    resetForm,
  };
};
