import type { AssessmentFormData, Patient } from './types';

// 목표 설정 페이지에서 사용하는 유틸리티 함수들

/**
 * 동기 수준에 따른 텍스트 반환
 */
export const getMotivationText = (level: number): string => {
  if (level <= 3) return '매우 낮음';
  if (level <= 5) return '낮음';
  if (level <= 7) return '보통';
  if (level <= 9) return '높음';
  return '매우 높음';
};

/**
 * 텍스트 포맷팅 (줄바꿈 처리 등)
 */
export const formatText = (text: string): string => {
  return text.replace(/\\n/g, '\n').trim();
};

/**
 * 평가 데이터를 API 요청 형식으로 변환
 */
export const formatAssessmentData = (formData: AssessmentFormData, patient: Patient) => {
  return {
    patientInfo: {
      name: patient.full_name,
      age: patient.age,
      gender: patient.gender,
      diagnosis: patient.diagnosis,
      diagnosisDuration: patient.diagnosisDuration,
    },
    focusTime: formData.focusTime,
    motivationLevel: formData.motivationLevel,
    pastSuccesses: [
      ...formData.pastSuccesses,
      ...(formData.pastSuccessesOther ? [formData.pastSuccessesOther] : [])
    ],
    constraints: [
      ...formData.constraints,
      ...(formData.constraintsOther ? [formData.constraintsOther] : [])
    ],
    socialPreference: formData.socialPreference,
  };
};

/**
 * 날짜 포맷팅 (YYYY-MM-DD)
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 상대 시간 계산 (예: "5분 전")
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return '방금 전';
};

/**
 * 진행률 계산
 */
export const calculateProgress = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * 목표 상태에 따른 색상 클래스 반환
 */
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-700';
};

/**
 * 목표 타입 한글 변환
 */
export const getGoalTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    six_month: '6개월 목표',
    monthly: '월간 목표',
    weekly: '주간 목표'
  };
  return labels[type] || type;
};
