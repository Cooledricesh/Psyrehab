import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// n8n 웹훅 URL (환경변수로 관리)

// 평가 데이터를 AI 분석용으로 변환하는 유틸리티 함수 (GoalSetting.tsx 구조에 맞게 수정)
function transformAssessmentForAI(assessment: unknown) {
  // focus_time을 분 단위 duration으로 변환
    switch (focusTime) {
      case '5min': return 5
      case '15min': return 15
      case '30min': return 30
      case '1hour': return 60
      default: return 30
    }
  }

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
        duration: getDurationFromFocusTime(assessment.focus_time),
        focusTimeCategory: assessment.focus_time,
        preferredEnvironment: 'quiet' // 기본값
      },
      motivationLevel: {
        overallLevel: assessment.motivation_level,
        intrinsicMotivation: Math.min(5, Math.max(1, Math.ceil(assessment.motivation_level / 2))),
        externalInfluence: Math.min(5, Math.max(1, Math.floor(assessment.motivation_level / 2))),
        goalOrientation: Math.min(5, Math.max(1, Math.round(assessment.motivation_level / 2))),
        selfEfficacy: Math.min(5, Math.max(1, Math.round(assessment.motivation_level / 2)))
      },
      pastSuccesses: {
        categories: assessment.past_successes || [],
        keyFactors: assessment.past_successes || [],
        otherDetails: assessment.notes || ''
      },
      constraints: {
        primaryConstraints: assessment.constraints || [],
        severityRating: assessment.constraints?.length > 0 ? Math.min(5, assessment.constraints.length) : 1,
        otherDetails: assessment.notes || ''
      },
      socialPreference: {
        preferenceType: assessment.social_preference,
        groupSizePreference: assessment.social_preference === 'individual' ? 'individual' : 
                           assessment.social_preference === 'small_group' ? 'small' : 'large',
        interactionStyle: assessment.social_preference === 'individual' ? 'independent' : 'collaborative'
      }
    },
    contextInfo: {
      assessmentDate: assessment.created_at,
      assessorId: assessment.assessed_by,
      notes: assessment.notes || '',
      previousAssessments: 0,
      urgencyLevel: 'medium'
    },
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://606a-119-201-55-170.ngrok-free.app'}/api/webhook/n8n`
  }
}

export async function POST(request: NextRequest) {
  try {
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
      console.error("Error occurred")
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

    try {
      // n8n 웹훅으로 데이터 전송
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiPayload)
      })

      if (!n8nResponse.ok) {
        throw new Error(`N8N webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`)
      }


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
      console.error("Error occurred")
      
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

  } catch {
    console.error("Error occurred")
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }


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

  } catch {
    console.error("Error occurred")
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: 'Unknown error'
      },
      { status: 500 }
    )
  }
} 