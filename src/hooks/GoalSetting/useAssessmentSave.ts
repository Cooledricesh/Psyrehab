import { useMutation } from '@tanstack/react-query';
import { AssessmentService } from '@/services/goalSetting';
import type { AssessmentFormData } from '@/utils/GoalSetting/types';

interface UseAssessmentSaveProps {
  selectedPatient: string | null;
  onSuccess: (data: any) => void;
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
    mutationFn: async ({ formData, retryWithAdmin = false }: SaveAssessmentParams) => {
      if (!selectedPatient) {
        throw new Error('환자가 선택되지 않았습니다.');
      }

      try {
        // 현재 사용자 ID 가져오기
        const userId = await AssessmentService.getCurrentUserId();
        
        // 평가 데이터 저장 시도
        return await AssessmentService.saveAssessment(formData, selectedPatient, userId);
      } catch (error: any) {
        // RLS 에러이고 아직 재시도하지 않은 경우
        if (AssessmentService.isRLSError(error) && !retryWithAdmin) {
          console.log('🔄 RLS 오류 감지됨. Admin으로 재시도...');
          
          // Admin 로그인 후 재시도
          await AssessmentService.loginAsAdmin();
          const newUserId = await AssessmentService.getCurrentUserId();
          
          return await AssessmentService.saveAssessment(formData, selectedPatient, newUserId);
        }
        
        // 다른 에러이거나 재시도 후에도 실패한 경우
        throw new Error(`평가 데이터 저장 실패: ${error.message}`);
      }
    },
    onSuccess: (data) => {
      console.log('✅ 평가 저장 mutation 성공:', data);
      onSuccess(data);
    },
    onError: (error: Error) => {
      console.error('❌ 평가 저장 mutation 실패:', error);
      onError(error);
    },
  });
};
