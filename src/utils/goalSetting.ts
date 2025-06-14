// 목표 설정 관련 유틸리티 함수들

export const getMotivationText = (level: number): string => {
  if (level <= 2) return '현재 상태 유지가 우선';
  if (level <= 4) return '작은 변화라면 시도해볼 만함';
  if (level <= 6) return '적당한 도전 가능';
  if (level <= 8) return '새로운 도전 원함';
  return '큰 변화도 감당할 준비됨';
};

export const formatAssessmentData = (formData: any) => {
  const pastSuccessesList = [
    ...formData.pastSuccesses,
    ...(formData.pastSuccessesOther ? [formData.pastSuccessesOther] : [])
  ];
  
  const constraintsList = [
    ...formData.constraints,
    ...(formData.constraintsOther ? [formData.constraintsOther] : [])
  ];

  return {
    focus_time: formData.focusTime,
    motivation_level: formData.motivationLevel,
    past_successes: pastSuccessesList,
    constraints: constraintsList,
    social_preference: formData.socialPreference,
  };
};
