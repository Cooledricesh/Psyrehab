import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// n8n 웹훅 URL (환경변수로 관리)
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://baclava.uk/webhook/09b18ab5-1bdb-4e04-88e4-63babb1f4b46'

// 평가 데이터를 AI 분석용으로 변환하는 유틸리티 함수
function transformAssessmentForAI(assessment: any) {
  return {
    assessmentId: assessment.id,
    patientId: assessment.patient_id,
    patientInfo: {
      age: assessment.patient?.age || null,
      gender: assessment.patient?.gender || null,
      diagnosis: assessment.patient?.diagnosis || null,
      medicalHistory: assessment.patient?.medical_history || null
    },
    assessmentData: {
      concentrationTime: {
        duration: assessment.concentration_time?.duration || 0,
        distractionLevel: assessment.concentration_time?.distraction_level || 1,
        preferredEnvironment: assessment.concentration_time?.preferred_environment || 'quiet'
      },
      motivationLevel: {
        intrinsicMotivation: assessment.motivation_level?.intrinsic_motivation || 1,
        externalInfluence: assessment.motivation_level?.external_influence || 1,
        goalOrientation: assessment.motivation_level?.goal_orientation || 1,
        selfEfficacy: assessment.motivation_level?.self_efficacy || 1
      },
      pastSuccesses: {
        categories: assessment.past_successes?.categories || [],
        keyFactors: assessment.past_successes?.key_factors || [],
        sustainabilityFactors: assessment.past_successes?.sustainability_factors || [],
        applicableStrategies: assessment.past_successes?.applicable_strategies || []
      },
      constraints: {
        physicalLimitations: assessment.constraints?.physical_limitations || [],
        cognitiveChallenges: assessment.constraints?.cognitive_challenges || [],
        emotionalBarriers: assessment.constraints?.emotional_barriers || [],
        socialObstacles: assessment.constraints?.social_obstacles || [],
        environmentalFactors: assessment.constraints?.environmental_factors || [],
        resourceLimitations: assessment.constraints?.resource_limitations || [],
        severityRating: assessment.constraints?.severity_rating || 1
      },
      socialPreference: {
        groupSizePreference: assessment.social_preference?.group_size_preference || 'small',
        interactionStyle: assessment.social_preference?.interaction_style || 'collaborative',
        communicationPreference: assessment.social_preference?.communication_preference || 'verbal',
        supportTypeNeeded: assessment.social_preference?.support_type_needed || 'emotional'
      }
    },
    contextInfo: {
      assessmentDate: assessment.created_at,
      assessorId: assessment.created_by,
      previousAssessments: assessment.previous_assessments_count || 0,
      urgencyLevel: assessment.urgency_level || 'medium'
    },
    // AI 모델이 응답을 보낼 웹훅 URL
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/n8n`
  }
}

// POST: 평가 데이터를 기반으로 AI 목표 추천 요청
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { assessmentId } = await request.json()

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    // 평가 데이터 조회 (환자 정보 포함)
    const { data: assessment, error: fetchError } = await supabase
      .from('assessments')
      .select(`
        *,
        patient:patients!inner(
          id,
          name,
          age,
          gender,
          diagnosis,
          medical_history,
          emergency_contact
        )
      `)
      .eq('id', assessmentId)
      .single()

    if (fetchError || !assessment) {
      console.error('Assessment fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Assessment not found', details: fetchError?.message },
        { status: 404 }
      )
    }

    // 이미 AI 추천이 진행 중이거나 완료된 경우 확인
    if (assessment.ai_recommendation_status === 'processing') {
      return NextResponse.json(
        { error: 'AI recommendation is already in progress for this assessment' },
        { status: 409 }
      )
    }

    if (assessment.ai_recommendation_status === 'completed') {
      return NextResponse.json(
        { error: 'AI recommendation has already been completed for this assessment' },
        { status: 409 }
      )
    }

    // 평가 상태를 'processing'으로 업데이트
    const { error: updateError } = await supabase
      .from('assessments')
      .update({ 
        ai_recommendation_status: 'processing',
        ai_processing_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', assessmentId)

    if (updateError) {
      console.error('Error updating assessment status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update assessment status', details: updateError.message },
        { status: 500 }
      )
    }

    // 평가 데이터를 AI 분석용으로 변환
    const aiPayload = transformAssessmentForAI(assessment)

    try {
      // n8n 웹훅으로 데이터 전송
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiPayload)
      })

      if (!n8nResponse.ok) {
        throw new Error(`N8N webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`)
      }

      const n8nResult = await n8nResponse.json()

      return NextResponse.json({
        success: true,
        message: 'Assessment data sent to AI processing successfully',
        data: {
          assessmentId: assessmentId,
          patientId: assessment.patient_id,
          status: 'processing',
          n8nResponse: n8nResult
        }
      })

    } catch (n8nError) {
      console.error('N8N webhook error:', n8nError)
      
      // 실패 시 상태를 다시 되돌림
      await supabase
        .from('assessments')
        .update({ 
          ai_recommendation_status: 'failed',
          ai_error_message: n8nError instanceof Error ? n8nError.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', assessmentId)

      return NextResponse.json(
        { 
          error: 'Failed to send data to AI processing', 
          details: n8nError instanceof Error ? n8nError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API processing error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET: AI 추천 상태 확인
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('assessmentId')

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('id, ai_recommendation_status, ai_processing_started_at, ai_error_message, ai_recommendation_id')
      .eq('id', assessmentId)
      .single()

    if (error || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      assessmentId: assessment.id,
      status: assessment.ai_recommendation_status,
      processingStarted: assessment.ai_processing_started_at,
      errorMessage: assessment.ai_error_message,
      recommendationId: assessment.ai_recommendation_id
    })

  } catch (error) {
    console.error('Status check error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 