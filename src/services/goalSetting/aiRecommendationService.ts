import { supabase } from '@/lib/supabase';

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
   * AI 추천 요청을 서버로 전송
   */
  static async requestRecommendation(
    assessmentId: string
  ): Promise<AIRecommendationResponse> {
    console.log('🔗 AI 추천 요청 시작:', assessmentId);
    console.log('📍 전체 URL:', `/api/ai/recommend`);
    
    const response = await fetch(`/api/ai/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessmentId: assessmentId,
      }),
    });

    console.log('📡 AI API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI API Error Response:', errorText);
      throw new Error(`AI 추천 요청 실패: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ AI API Success Response:', result);
    return result;
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
