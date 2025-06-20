import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { POLLING_CONFIG } from '../constants'

interface UsePollingProps {
  shouldPoll: boolean
  hasSubmittedAssessment: boolean
  patientId?: string
  onComplete?: (assessmentId: string) => void
  onProgressUpdate?: (current: number, max: number) => void
}

export function usePolling({
  shouldPoll,
  hasSubmittedAssessment,
  patientId,
  onComplete,
  onProgressUpdate,
}: UsePollingProps) {
  const { toast } = useToast()

  useEffect(() => {
    if (!shouldPoll || !hasSubmittedAssessment || !patientId) return

    let attempts = 0
    const maxAttempts = POLLING_CONFIG.maxAttempts
    let intervalId: number
    let isMounted = true

    console.log(`Starting polling for patient ${patientId}...`)

    const poll = async () => {
      try {
        console.log(`AI 응답 폴링... (attempt ${attempts + 1}/${maxAttempts})`)

        const { data: aiResponse } = await supabase
          .from('ai_goal_recommendations')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        console.log('AI 응답 폴링 결과:', aiResponse)

        if (aiResponse && aiResponse.goals && aiResponse.goals.length > 0) {
          console.log(`✅ AI 응답 발견! Goals: ${aiResponse.goals.length}개`)
          
          if (isMounted) {
            toast({
              title: 'AI 분석 완료!',
              description: '목표 추천이 완료되었습니다.',
              variant: 'success',
            })
            onComplete?.(aiResponse.id)
          }
          clearInterval(intervalId)
          return
        }

        attempts++

        if (attempts <= maxAttempts) {
          if (isMounted) {
            onProgressUpdate?.(attempts, maxAttempts)
          }
        }

        if (attempts >= maxAttempts) {
          console.log('Max polling attempts reached')
          clearInterval(intervalId)
          
          if (isMounted) {
            const totalMinutes = Math.ceil((maxAttempts * POLLING_CONFIG.intervalMs) / 60000)
            toast({
              title: '분석 시간 초과',
              description: `AI 분석이 예상보다 오래 걸리고 있습니다. 총 ${totalMinutes}분 대기했습니다. 잠시 후 새로고침해서 확인해보세요.`,
              variant: 'destructive',
            })
          }
        }
      } catch {
        console.error("Error occurred")
        attempts++
        if (attempts >= maxAttempts) {
          clearInterval(intervalId)
        }
      }
    }

    poll()
    intervalId = window.setInterval(poll, POLLING_CONFIG.intervalMs)

    return () => {
      isMounted = false
      clearInterval(intervalId)
      console.log('Assessment polling cleanup executed')
    }
  }, [shouldPoll, hasSubmittedAssessment, patientId, toast, onComplete, onProgressUpdate])
}
