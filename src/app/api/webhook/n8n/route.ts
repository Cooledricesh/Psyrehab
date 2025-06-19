import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// n8n에서 받을 완료 신호 데이터 타입
interface WebhookCompletionData {
  status: 'completed' | 'failed'
  assessmentId: string
  recommendationId?: string
  error?: string
}

// POST: n8n에서 AI 추천 완료 신호를 받는 웹훅 엔드포인트
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 요청 본문 파싱
    const data: WebhookCompletionData = await request.json()
    
    // 데이터 유효성 검증
    if (!data.status || !data.assessmentId) {
      return NextResponse.json(
        { error: 'Missing required fields: status, assessmentId' },
        { status: 400 }
      )
    }

    if (data.status === 'completed' && data.recommendationId) {
      // assessments 테이블의 ai_recommendation_status를 'completed'로 업데이트
      const { error: updateError } = await supabase
        .from('assessments')
        .update({ 
          ai_recommendation_status: 'completed',
          ai_recommendation_id: data.recommendationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.assessmentId)

      if (updateError) {
        console.error('Error updating assessment status:', updateError)
        return NextResponse.json(
          { error: 'Failed to update assessment status', details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'AI recommendation completed successfully',
        recommendationId: data.recommendationId
      })
    }

    if (data.status === 'failed') {
      // 실패 상태 업데이트
      const { error: updateError } = await supabase
        .from('assessments')
        .update({ 
          ai_recommendation_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.assessmentId)

      if (updateError) {
        console.error('Error updating assessment status:', updateError)
      }

      return NextResponse.json({
        success: false,
        message: 'AI recommendation failed',
        error: data.error
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid webhook data'
    }, { status: 400 })

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

// GET: 웹훅 엔드포인트 상태 확인용
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhook/n8n',
    message: 'N8N AI recommendation webhook endpoint is ready',
    timestamp: new Date().toISOString()
  })
} 