import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AIRecommendationArchiveService } from '@/services/ai-recommendation-archive';

interface SaveGoalsParams {
  selectedPatient: string | null;
  detailedGoals: unknown;
  currentAssessmentId: string | null;
  recommendationId: string | null;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export const useGoalSave = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const saveGoals = async ({
    selectedPatient,
    detailedGoals,
    currentAssessmentId,
    recommendationId,
    onSuccess,
    onError
  }: SaveGoalsParams) => {
    console.log('🎯 목표 저장 시작!');
    console.log('선택된 환자:', selectedPatient);
    console.log('상세 목표:', detailedGoals);
    console.log('현재 평가 ID:', currentAssessmentId);
    console.log('AI 추천 ID:', recommendationId);
    
    if (!selectedPatient || !detailedGoals || !currentAssessmentId) {
      alert('저장할 목표 정보가 없습니다.');
      return;
    }

    try {
      setIsProcessing(true);
      
      // 디버깅을 위한 로그
      console.log('detailedGoals 전체 구조:', detailedGoals);
      console.log('monthlyGoals:', detailedGoals.monthlyGoals);
      console.log('weeklyGoals:', detailedGoals.weeklyGoals);

      // 현재 사용자 ID 가져오기
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      // 1. 기존 active 계획을 inactive로 변경
      const { error: deactivateError } = await supabase
        .from('rehabilitation_goals')
        .update({ plan_status: 'inactive' })
        .eq('patient_id', selectedPatient)
        .eq('plan_status', 'active');

      if (deactivateError) {
        console.error('기존 계획 비활성화 실패:', deactivateError);
        throw deactivateError;
      }

      // 2. AI 추천 ID 가져오기 (평가 ID로 조회)
      let aiRecommendationId = recommendationId;
      
      if (!aiRecommendationId && currentAssessmentId) {
        const { data: aiRec, error: aiError } = await supabase
          .from('ai_goal_recommendations')
          .select('id')
          .eq('assessment_id', currentAssessmentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (aiRec) {
          aiRecommendationId = aiRec.id;
          console.log('AI 추천 ID 조회됨:', aiRecommendationId);
        }
      }

      // 3. AI 추천 상태 업데이트
      if (aiRecommendationId) {
        const { error: updateError } = await supabase
          .from('ai_goal_recommendations')
          .update({
            is_active: true,
            applied_at: new Date().toISOString(),
            applied_by: currentUserId,
            selected_plan_number: detailedGoals.selectedIndex + 1
          })
          .eq('id', aiRecommendationId);

        if (updateError) {
          console.error('AI 추천 상태 업데이트 실패:', updateError);
        }
      }

      // 4. 목표들을 데이터베이스에 저장
      const goalsToInsert = [];
      
      // 6개월 목표
      const sixMonthGoalId = crypto.randomUUID();
      const sixMonthGoal = detailedGoals.sixMonthGoal;
      
      console.log('💾 저장할 6개월 목표:', sixMonthGoal);
      console.log('💾 사용할 AI 추천 ID:', aiRecommendationId);
      
      // 6개월 목표 저장
      goalsToInsert.push({
        id: sixMonthGoalId,
        patient_id: selectedPatient,
        parent_goal_id: null,
        title: sixMonthGoal.goal || sixMonthGoal.title || '6개월 목표',
        description: sixMonthGoal.details || sixMonthGoal.description || '',
        goal_type: 'six_month',
        sequence_number: 1,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
        status: 'active',
        plan_status: 'active',
        is_ai_suggested: true,
        source_recommendation_id: aiRecommendationId || null,
        is_from_ai_recommendation: true,
        created_by_social_worker_id: currentUserId
      });

      // 월간 목표들
      console.log('💾 저장할 월간 목표들:', detailedGoals.monthlyGoals);
      
      detailedGoals.monthlyGoals?.forEach((monthlyPlan, monthIndex) => {
        const monthlyGoalId = crypto.randomUUID();
        
        goalsToInsert.push({
          id: monthlyGoalId,
          patient_id: selectedPatient,
          parent_goal_id: sixMonthGoalId,
          title: monthlyPlan.goal || monthlyPlan.title || `${monthIndex + 1}개월차 목표`,
          description: monthlyPlan.activities?.join(', ') || monthlyPlan.description || '',
          goal_type: 'monthly',
          sequence_number: monthIndex + 1,
          start_date: new Date(new Date().setMonth(new Date().getMonth() + monthIndex)).toISOString().split('T')[0],
          end_date: new Date(new Date().setMonth(new Date().getMonth() + monthIndex + 1)).toISOString().split('T')[0],
          status: monthIndex === 0 ? 'active' : 'pending',
          plan_status: 'active',
          is_ai_suggested: true,
          source_recommendation_id: aiRecommendationId || null,
          is_from_ai_recommendation: true,
          created_by_social_worker_id: currentUserId
        });

        // 주간 목표들
        console.log('💾 저장할 주간 목표들:', detailedGoals.weeklyGoals);
        
        detailedGoals.weeklyGoals
          ?.filter(weeklyPlan => {
            const weekNumber = parseInt(weeklyPlan.week || '0');
            const weekMonth = Math.floor((weekNumber - 1) / 4);
            return weekMonth === monthIndex;
          })
          ?.forEach((weeklyPlan, weekIndex) => {
            goalsToInsert.push({
              id: crypto.randomUUID(),
              patient_id: selectedPatient,
              parent_goal_id: monthlyGoalId,
              title: weeklyPlan.plan || weeklyPlan.title || `${weeklyPlan.week}주차 목표`,
              description: weeklyPlan.description || '',
              goal_type: 'weekly',
              sequence_number: parseInt(weeklyPlan.week || `${weekIndex + 1}`),
              start_date: new Date(new Date().setMonth(new Date().getMonth() + monthIndex)).toISOString().split('T')[0],
              end_date: new Date(new Date().setMonth(new Date().getMonth() + monthIndex)).toISOString().split('T')[0],
              status: monthIndex === 0 && weekIndex === 0 ? 'active' : 'pending',
              plan_status: 'active',
              is_ai_suggested: true,
              source_recommendation_id: aiRecommendationId || null,
              is_from_ai_recommendation: true,
              created_by_social_worker_id: currentUserId
            });
          });
      });

      // 목표들을 DB에 저장
      console.log('💾 저장할 목표 개수:', goalsToInsert.length);
      console.log('💾 저장할 목표 데이터:', goalsToInsert);
      
      const { error: goalsError } = await supabase
        .from('rehabilitation_goals')
        .insert(goalsToInsert);

      if (goalsError) {
        console.error('목표 저장 실패:', goalsError);
        throw goalsError;
      }

      // 5. 환자 상태를 active로 변경
      const { error: patientError } = await supabase
        .from('patients')
        .update({ status: 'active' })
        .eq('id', selectedPatient);

      if (patientError) {
        console.error('환자 상태 업데이트 실패:', patientError);
        throw patientError;
      }

      // 6. 이미 생성 시점에 3개 모두 아카이빙되었으므로, 추가 아카이빙은 필요 없음
      // 선택된 목표만 활성 목표로 저장됨
      console.log('✅ AI 추천 목표는 이미 생성 시점에 아카이빙 완료');
      console.log('✅ 선택된 목표만 활성 목표로 저장됨');
      
      // 선택된 목표를 아카이빙에서 제외하기 위해 archived_reason 업데이트 (옵션)
      if (aiRecommendationId && detailedGoals.selectedIndex !== undefined) {
        try {
          const { error: updateError } = await supabase
            .from('ai_recommendation_archive')
            .update({ archived_reason: 'goal_selected_and_active' })
            .eq('original_recommendation_id', aiRecommendationId)
            .contains('archived_goal_data', [{ plan_number: detailedGoals.selectedIndex + 1 }]);
            
          if (updateError) {
            console.warn('⚠️ 선택된 목표 아카이빙 상태 업데이트 실패:', updateError);
          }
        } catch (error) {
          console.warn('⚠️ 아카이빙 상태 업데이트 오류:', error);
        }
      }

      // 성공 메시지
      alert('목표가 성공적으로 저장되었습니다!');
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: unknown) {
      console.error("Error occurred");
      
      // 구체적인 오류 메시지 표시
      let errorMessage = '목표 저장 중 오류가 발생했습니다.';
      
      if (error.message) {
        errorMessage += '\n\n상세 오류: ' + error.message;
      }
      
      if (error.code) {
        errorMessage += '\n오류 코드: ' + error.code;
      }
      
      alert(errorMessage);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    saveGoals,
    isProcessing
  };
};

/**
 * 진단명을 간소화된 카테고리로 변환
 */
function simplifyDiagnosis(diagnosis: string): string {
  const lowerDiagnosis = diagnosis.toLowerCase();
  
  // 키워드 기반 카테고리 매핑
  const categoryMap = {
    'cognitive_disorder': ['치매', '인지', '기억', '알츠하이머', 'dementia', 'cognitive'],
    'mood_disorder': ['우울', '조울', '기분', 'depression', 'bipolar', 'mood'],
    'anxiety_disorder': ['불안', '공황', 'anxiety', 'panic'],
    'psychotic_disorder': ['조현병', '정신분열', 'schizophrenia', 'psychotic'],
    'substance_disorder': ['중독', '알코올', '약물', 'addiction', 'substance'],
    'developmental_disorder': ['자폐', '발달', 'autism', 'developmental'],
    'neurological_disorder': ['뇌졸중', '파킨슨', '뇌손상', 'stroke', 'parkinson', 'neurological'],
    'personality_disorder': ['성격', '인격', 'personality'],
    'eating_disorder': ['섭식', '식이', 'eating'],
    'trauma_disorder': ['외상', '트라우마', 'trauma', 'ptsd']
  };

  // 매칭되는 카테고리 찾기
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => lowerDiagnosis.includes(keyword))) {
      return category;
    }
  }

  return 'other_disorder';
}
