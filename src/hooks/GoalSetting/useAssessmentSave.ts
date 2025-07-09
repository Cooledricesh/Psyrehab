import { useMutation } from '@tanstack/react-query';
import { AssessmentService } from '@/services/goalSetting';
import type { AssessmentFormData } from '@/utils/GoalSetting/types';
import { handleApiError } from '@/utils/error-handler';

interface UseAssessmentSaveProps {
  selectedPatient: string | null;
  onSuccess: (data: unknown) => void;
  onError: (error: Error) => void;
}

interface SaveAssessmentParams {
  formData: AssessmentFormData;
  retryWithAdmin?: boolean;
}

export const useAssessmentSave = ({ 
  selectedPatient, 
  onSuccess, 
  onError 
}: UseAssessmentSaveProps) => {

  // Mutation 정의
  return useMutation({
    mutationFn: async ({ formData }: SaveAssessmentParams) => {
      if (!selectedPatient) {
        throw new Error('환자가 선택되지 않았습니다.');
      }

      try {
        // 현재 사용자 ID 가져오기
        const userId = await AssessmentService.getCurrentUserId();
        
        // 평가 데이터 저장 시도
        return await AssessmentService.saveAssessment(formData, selectedPatient, userId);
      } catch (error: unknown) {
        // RLS 에러인 경우 적절한 에러 메시지 표시
        if (AssessmentService.isRLSError(error)) {
          console.log('❌ RLS 오류: 권한이 없습니다.');
          throw new Error('평가 데이터를 저장할 권한이 없습니다. 관리자에게 문의하세요.');
        }
        
        // 다른 에러인 경우
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        throw new Error(`평가 데이터 저장 실패: ${errorMessage}`);
      }
    },
    onSuccess: (data) => {
      console.log('✅ 평가 저장 mutation 성공:', data);
      onSuccess(data);
    },
    onError: (error: Error) => {
      handleApiError(error, 'useAssessmentSave.onError');
      onError(error);
    },
  });
};
