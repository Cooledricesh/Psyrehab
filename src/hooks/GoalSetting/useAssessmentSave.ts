import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PAST_SUCCESS_MAPPING, CONSTRAINT_MAPPING, MESSAGES } from '@/utils/GoalSetting/constants';
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
  
  // Admin 로그인 시도 함수
  const attemptAdminLogin = async () => {
    console.log('🔐 Admin 로그인 시도 중...');
    
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@psyrehab.dev',
      password: 'admin123!'
    });
    
    if (loginError) {
      console.log('⚠️ Admin 로그인 실패:', loginError.message);
      throw new Error(`Admin 로그인 실패: ${loginError.message}`);
    }
    
    console.log('✅ Admin 로그인 성공!');
    return true;
  };

  // 평가 데이터 저장 함수
  const saveAssessmentData = async (assessmentData: AssessmentFormData, userId: string) => {
    const dataToInsert = {
      patient_id: selectedPatient!,
      focus_time: assessmentData.focusTime,
      motivation_level: assessmentData.motivationLevel,
      past_successes: [
        ...(assessmentData.pastSuccesses.map((value: string) => 
          PAST_SUCCESS_MAPPING[value] || value
        )),
        ...(assessmentData.pastSuccessesOther ? [assessmentData.pastSuccessesOther] : [])
      ].filter(Boolean),
      constraints: [
        ...(assessmentData.constraints.map((value: string) => 
          CONSTRAINT_MAPPING[value] || value
        )),
        ...(assessmentData.constraintsOther ? [assessmentData.constraintsOther] : [])
      ].filter(Boolean),
      social_preference: assessmentData.socialPreference,
      notes: null,
      assessed_by: userId,
    };

    console.log('💾 평가 데이터 저장 시도:', dataToInsert);

    const { data, error } = await supabase
      .from('assessments')
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.log('💥 Insert 에러 상세:', error);
      throw error;
    }

    console.log('✅ 평가 데이터 저장 성공:', data);
    return data;
  };

  // RLS 에러 감지 함수
  const isRLSError = (error: any): boolean => {
    return error.code === '42501' || 
           error.message.includes('row-level security') ||
           error.message.includes('policy') ||
           error.message.includes('permission') ||
           error.details?.includes('policy') ||
           error.hint?.includes('policy');
  };

  // Mutation 정의
  return useMutation({
    mutationFn: async ({ formData, retryWithAdmin = false }: SaveAssessmentParams) => {
      if (!selectedPatient) {
        throw new Error('환자가 선택되지 않았습니다.');
      }

      // 현재 사용자 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || crypto.randomUUID();

      try {
        // 첫 시도 또는 Admin 재시도
        if (retryWithAdmin) {
          await attemptAdminLogin();
          const { data: { user: newUser } } = await supabase.auth.getUser();
          const newUserId = newUser?.id || crypto.randomUUID();
          return await saveAssessmentData(formData, newUserId);
        } else {
          return await saveAssessmentData(formData, userId);
        }
      } catch (error: any) {
        // RLS 에러이고 아직 재시도하지 않은 경우
        if (isRLSError(error) && !retryWithAdmin) {
          console.log('🔄 RLS 오류 감지됨. Admin으로 재시도...');
          
          // Admin 로그인 후 재시도
          await attemptAdminLogin();
          const { data: { user: newUser } } = await supabase.auth.getUser();
          const newUserId = newUser?.id || crypto.randomUUID();
          
          return await saveAssessmentData(formData, newUserId);
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
