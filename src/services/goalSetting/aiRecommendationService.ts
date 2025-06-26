import { supabase } from '@/lib/supabase';
import { ENV } from '@/lib/env';

export interface AIRecommendationRequest {
  assessmentId: string;
}

export interface AIRecommendationResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface AIGoalRecommendation {
  id: string;
  assessment_id: string;
  patient_id: string;
  recommendations: Record<string, unknown>[];
  n8n_processing_status: string;
  patient_analysis?: Record<string, unknown>;
  created_at: string;
}

export class AIRecommendationService {
  /**
   * AI 추천 요청을 n8n webhook으로 직접 전송
   */
  static async requestRecommendation(
    assessmentId: string
  ): Promise<AIRecommendationResponse> {
    console.log('🔗 AI 추천 요청 시작:', assessmentId);
    
    if (!ENV.N8N_WEBHOOK_URL) {
      console.error('❌ N8N webhook URL이 설정되지 않았습니다');
      throw new Error('N8N webhook URL이 설정되지 않았습니다');
    }
    
    console.log('📍 n8n webhook URL:', ENV.N8N_WEBHOOK_URL);
    console.log('🔍 전달받은 assessmentId:', assessmentId, 'typeof:', typeof assessmentId);
    
    // 평가 데이터 조회
    const { data: assessment, error: fetchError } = await supabase
      .from('assessments')
      .select(`
        *,
        patient:patients!inner(
          id,
          full_name,
          date_of_birth,
          gender,
          additional_info
        )
      `)
      .eq('id', assessmentId)
      .single();

    if (fetchError || !assessment) {
      console.error('❌ Assessment 조회 실패:', fetchError);
      throw new Error('Assessment를 찾을 수 없습니다');
    }

    // UUID 유효성 검사 및 로깅
    console.log('🔍 assessment 데이터 확인:', {
      assessmentId: assessment.id,
      assessmentIdType: typeof assessment.id,
      patientId: assessment.patient_id,
      patientIdType: typeof assessment.patient_id,
      patientData: assessment.patient
    });

    // n8n으로 전송할 데이터 구성
    const aiPayload = {
      assessmentId: assessment.id,
      patientId: assessment.patient_id,
      patientInfo: {
        age: assessment.patient.date_of_birth ? 
          Math.floor((new Date().getTime() - new Date(assessment.patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        gender: assessment.patient.gender || null,
        diagnosis: assessment.patient.additional_info?.primary_diagnosis || 
                   assessment.patient.additional_info?.diagnosis || 
                   null
      },
      assessmentData: {
        focusTime: assessment.focus_time,
        motivationLevel: assessment.motivation_level,
        pastSuccesses: assessment.past_successes || [],
        constraints: assessment.constraints || [],
        socialPreference: assessment.social_preference
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('📦 n8n으로 전송할 최종 데이터:', JSON.stringify(aiPayload, null, 2));
    
    const response = await fetch(ENV.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiPayload),
    });

    console.log('📡 n8n Webhook Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ n8n Webhook Error Response:', errorText);
      throw new Error(`AI 추천 요청 실패: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ n8n Webhook Success Response:', result);
    return {
      success: true,
      message: 'AI 추천 요청이 성공적으로 전송되었습니다',
      data: result
    };
  }

  /**
   * AI 추천 상태를 확인 (폴링용)
   */
  static async checkRecommendationStatus(
    assessmentId: string
  ): Promise<AIGoalRecommendation | null> {
    console.log('📊 AI 추천 상태 확인:', assessmentId);
    
    const { data, error } = await supabase
      .from('ai_goal_recommendations')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ AI 추천 상태 조회 실패:', error);
      throw error;
    }

    console.log('📋 AI 처리 상태:', data);
    return data;
  }

  /**
   * AI 추천 상태 업데이트
   */
  static async updateRecommendationStatus(
    recommendationId: string,
    updates: {
      is_active?: boolean;
      applied_at?: string;
      applied_by?: string;
      selected_plan_number?: number;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('ai_goal_recommendations')
      .update(updates)
      .eq('id', recommendationId);

    if (error) {
      console.error('AI 추천 상태 업데이트 실패:', error);
      // 실패해도 계속 진행하도록 에러를 throw하지 않음
    }
  }

  /**
   * 평가 ID로 최신 AI 추천 ID 조회
   */
  static async getRecommendationIdByAssessment(
    assessmentId: string
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('ai_goal_recommendations')
      .select('id')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) {
      console.error('AI 추천 ID 조회 실패:', error);
      return null;
    }
    
    console.log('AI 추천 ID 조회됨:', data?.id);
    return data?.id || null;
  }
}
