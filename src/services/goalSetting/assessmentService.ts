import { supabase } from '@/lib/supabase';
import { PAST_SUCCESS_MAPPING, CONSTRAINT_MAPPING } from '@/utils/GoalSetting/constants';
import type { AssessmentFormData } from '@/utils/GoalSetting/types';

export interface AssessmentData {
  patient_id: string;
  focus_time: string;
  motivation_level: number;
  past_successes: string[];
  constraints: string[];
  social_preference: string;
  notes?: string | null;
  assessed_by: string;
}

export class AssessmentService {
  /**
   * 평가 데이터를 DB에 저장
   */
  static async saveAssessment(
    assessmentData: AssessmentFormData,
    patientId: string,
    userId: string
  ): Promise<any> {
    const dataToInsert: AssessmentData = {
      patient_id: patientId,
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
  }

  /**
   * RLS 에러인지 확인
   */
  static isRLSError(error: any): boolean {
    return error.code === '42501' || 
           error.message.includes('row-level security') ||
           error.message.includes('policy') ||
           error.message.includes('permission') ||
           error.details?.includes('policy') ||
           error.hint?.includes('policy');
  }

  /**
   * Admin 계정으로 로그인
   */
  static async loginAsAdmin(): Promise<void> {
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
  }

  /**
   * 현재 사용자 ID 가져오기
   */
  static async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || crypto.randomUUID();
  }
}
