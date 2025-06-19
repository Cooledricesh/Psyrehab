import React from 'react';

// 목표 설정 관련 유틸리티 함수들

export const getMotivationText = (level: number): string => {
  if (level <= 2) return '현재 상태 유지가 우선';
  if (level <= 4) return '작은 변화라면 시도해볼 만함';
  if (level <= 6) return '적당한 도전 가능';
  if (level <= 8) return '새로운 도전 원함';
  return '큰 변화도 감당할 준비됨';
};

export const formatText = (text: string) => {
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

export const formatAssessmentData = (formData: unknown) => {
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
