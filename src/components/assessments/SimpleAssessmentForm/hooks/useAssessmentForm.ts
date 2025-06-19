import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { 
  AssessmentFormData, 
  Patient, 
  PollingProgress 
} from '../types'
import { WEBHOOK_URL, POLLING_CONFIG } from '../constants'
import { calculateAge, calculateDurationYears } from '../utils'

export function useAssessmentForm(patientId?: string) {
  const { toast } = useToast()
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [patientLoading, setPatientLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shouldPoll, setShouldPoll] = useState(false)
  const [hasSubmittedAssessment, setHasSubmittedAssessment] = useState(false)
  const [pollingProgress, setPollingProgress] = useState<PollingProgress>({ 
    current: 0, 
    max: 0 
  })

  const [formData, setFormData] = useState<AssessmentFormData>({
    focusTime: '',
    motivationLevel: 5,
    pastSuccesses: [],
    pastSuccessesOther: '',
    constraints: [],
    constraintsOther: '',
    socialPreference: '',
  })

  useEffect(() => {
    if (patientId) {
      loadPatientData(patientId)
    }
  }, [patientId])

  const loadPatientData = async (id: string) => {
    setPatientLoading(true)
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setPatient(data)
    } catch {
      console.error("Error occurred")
      toast({
        title: '환자 정보 로딩 실패',
        description: '환자 정보를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setPatientLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const missingFields = []
    if (!formData.focusTime) missingFields.push('집중 시간')
    if (!formData.socialPreference) missingFields.push('사회적 활동 선호도')

    if (missingFields.length > 0) {
      toast({
        title: '필수 항목 미입력',
        description: `다음 항목을 입력해주세요: ${missingFields.join(', ')}`,
        variant: 'destructive',
      })
      return false
    }

    if (!patient) {
      toast({
        title: '오류',
        description: '환자 정보가 없습니다.',
        variant: 'destructive',
      })
      return false
    }

    return true
  }

  const saveAssessment = async () => {
    const assessmentData = {
      patient_id: patient!.id,
      focus_time: formData.focusTime,
      motivation_level: formData.motivationLevel,
      past_successes: formData.pastSuccesses,
      past_successes_other: formData.pastSuccessesOther,
      constraints: formData.constraints,
      constraints_other: formData.constraintsOther,
      social_preference: formData.socialPreference,
      assessment_date: new Date().toISOString().split('T')[0],
      assessed_by: 1, // TODO: 실제 사용자 ID로 변경
    }

    const { data: savedAssessment, error } = await supabase
      .from('assessments')
      .insert(assessmentData)
      .select()
      .single()

    if (error) throw error
    return savedAssessment
  }

  const sendWebhook = async () => {
    const webhookData = {
      patientId: patient!.id,
      patientInfo: {
        age: calculateAge(patient!.birth_date),
        gender: patient!.gender,
        diagnosis: patient!.diagnosis,
        diagnosisDate: patient!.diagnosis_date,
        diseaseDurationYears: calculateDurationYears(patient!.diagnosis_date),
      },
      assessmentData: {
        patientId: patient!.id,
        userId: 1, // TODO: 실제 사용자 ID로 변경
        focusTime: formData.focusTime,
        motivationLevel: formData.motivationLevel,
        pastSuccesses: formData.pastSuccesses,
        pastSuccessesOther: formData.pastSuccessesOther,
        constraints: formData.constraints,
        constraintsOther: formData.constraintsOther,
        socialPreference: formData.socialPreference,
      },
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    })

    if (!response.ok) {
      throw new Error('웹훅 전송 실패')
    }

    console.log('Webhook data sent:', webhookData)
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      await saveAssessment()
      await sendWebhook()

      toast({
        title: '질문지 제출 완료',
        description: 'AI 분석을 시작했습니다. 잠시만 기다려 주세요.',
      })

      setHasSubmittedAssessment(true)
      setShouldPoll(true)
      setPollingProgress({ current: 0, max: POLLING_CONFIG.maxAttempts })

    } catch {
      console.error("Error occurred")
      toast({
        title: '제출 실패',
        description: '질문지 제출 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    patient,
    patientLoading,
    isSubmitting,
    shouldPoll,
    setShouldPoll,
    hasSubmittedAssessment,
    pollingProgress,
    setPollingProgress,
    formData,
    setFormData,
    handleSubmit,
  }
}
