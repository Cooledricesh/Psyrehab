import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// n8n에서 받을 AI 추천 데이터 타입
interface AIRecommendation {
  assessmentId: string
  patientId: string
  recommendations: {
    plan1: {
      title: string
      description: string
      duration: string
      goals: Array<{
        category: string
        objective: string
        timeline: string
        methods: string[]
      }>
      priority: 'high' | 'medium' | 'low'
      success_metrics: string[]
    }
    plan2: {
      title: string
      description: string
      duration: string
      goals: Array<{
        category: string
        objective: string
        timeline: string
        methods: string[]
      }>
      priority: 'high' | 'medium' | 'low'
      success_metrics: string[]
    }
    plan3: {
      title: string
      description: string
      duration: string
      goals: Array<{
        category: string
        objective: string
        timeline: string
        methods: string[]
      }>
      priority: 'high' | 'medium' | 'low'
      success_metrics: string[]
    }
  }
  confidence_score: number
  reasoning: string
  generated_at: string
}

// POST: n8n에서 AI 추천 결과를 받는 웹훅 엔드포인트
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 요청 본문 파싱
    const data: AIRecommendation = await request.json()
    
    // 데이터 유효성 검증
    if (!data.assessmentId || !data.patientId || !data.recommendations) {
      return NextResponse.json(
        { error: 'Missing required fields: assessmentId, patientId, or recommendations' },
        { status: 400 }
      )
    }

    // AI 추천 결과를 데이터베이스에 저장
    const { data: savedRecommendation, error: saveError } = await supabase
      .from('ai_goal_recommendations')
      .insert({
        assessment_id: data.assessmentId,
        patient_id: data.patientId,
        recommendation_data: data.recommendations,
        confidence_score: data.confidence_score,
        reasoning: data.reasoning,
        status: 'pending_review',
        generated_at: data.generated_at || new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving AI recommendation:', saveError)
      return NextResponse.json(
        { error: 'Failed to save recommendation', details: saveError.message },
        { status: 500 }
      )
    }

    // 관련된 평가 상태를 업데이트 (AI 추천 완료됨)
    const { error: updateError } = await supabase
      .from('assessments')
      .update({ 
        ai_recommendation_status: 'completed',
        ai_recommendation_id: savedRecommendation.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.assessmentId)

    if (updateError) {
      console.error('Error updating assessment status:', updateError)
      // 이미 추천 데이터는 저장되었으므로, 에러를 로그만 하고 성공 응답
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: 'AI recommendation received and saved successfully',
      recommendationId: savedRecommendation.id,
      data: {
        assessmentId: data.assessmentId,
        patientId: data.patientId,
        confidence_score: data.confidence_score
      }
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET: 웹훅 엔드포인트 상태 확인용
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhook/n8n',
    message: 'N8N AI recommendation webhook endpoint is ready',
    timestamp: new Date().toISOString()
  })
} 