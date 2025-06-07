import { useState, useEffect } from 'react'
import {
  Brain,
  Target,
  History,
  AlertTriangle,
  Users,
  ArrowLeft,
  Send,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface AssessmentFormData {
  focusTime: string
  motivationLevel: number
  pastSuccesses: string[]
  pastSuccessesOther: string
  constraints: string[]
  constraintsOther: string
  socialPreference: string
}

interface Patient {
  id: number
  full_name: string
  birth_date: string
  gender: string
  diagnosis: string
  diagnosis_date: string
  created_at: string
}

interface SimpleAssessmentFormProps {
  patientId?: string
  onAssessmentComplete?: (assessmentId: string) => void
  onBack?: () => void
  className?: string
}

export function SimpleAssessmentForm({ 
  patientId, 
  onAssessmentComplete,
  onBack,
  className 
}: SimpleAssessmentFormProps) {
  const { toast } = useToast()
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [patientLoading, setPatientLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shouldPoll, setShouldPoll] = useState(false)
  const [hasSubmittedAssessment, setHasSubmittedAssessment] = useState(false)
  const [pollingProgress, setPollingProgress] = useState({ current: 0, max: 0 })

  const [formData, setFormData] = useState<AssessmentFormData>({
    focusTime: '',
    motivationLevel: 5,
    pastSuccesses: [],
    pastSuccessesOther: '',
    constraints: [],
    constraintsOther: '',
    socialPreference: '',
  })

  // 환자 데이터 로드
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
    } catch (error) {
      console.error('Error loading patient:', error)
      toast({
        title: '환자 정보 로딩 실패',
        description: '환자 정보를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setPatientLoading(false)
    }
  }

  // AI 응답 폴링
  useEffect(() => {
    if (!shouldPoll || !hasSubmittedAssessment || !patientId) return

    let attempts = 0
    const maxAttempts = 20
    let intervalId: number
    let isMounted = true

    console.log(`Starting polling for patient ${patientId}...`)

    const poll = async () => {
      try {
        console.log(`AI 응답 폴링... (attempt ${attempts + 1}/${maxAttempts})`)

        // 실제 환경에서는 API 엔드포인트를 사용
        // const response = await fetch(`/api/patients/${patientId}/ai-response`)
        // const aiResponse = await response.json()

        // 임시로 Supabase에서 직접 확인
        const { data: aiResponse, error } = await supabase
          .from('ai_goal_recommendations')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        console.log('AI 응답 폴링 결과:', aiResponse)

        if (aiResponse && aiResponse.goals && aiResponse.goals.length > 0) {
          console.log(`✅ AI 응답 발견! Goals: ${aiResponse.goals.length}개`)
          setShouldPoll(false)
          clearInterval(intervalId)
          if (isMounted) {
            toast({
              title: 'AI 분석 완료!',
              description: '목표 추천이 완료되었습니다.',
              variant: 'success',
            })
            onAssessmentComplete?.(aiResponse.id)
          }
          return
        }

        attempts++

        if (attempts <= maxAttempts) {
          const remainingTime = Math.ceil((maxAttempts - attempts) * 3)
          console.log(
            `AI 분석 진행 중... (${attempts}/${maxAttempts}), 예상 대기시간: ${remainingTime}초`
          )

          if (isMounted) {
            setPollingProgress({ current: attempts, max: maxAttempts })
          }
        }

        if (attempts >= maxAttempts) {
          console.log('Max polling attempts reached')
          setShouldPoll(false)
          clearInterval(intervalId)
          if (isMounted) {
            toast({
              title: '분석 시간 초과',
              description: `AI 분석이 예상보다 오래 걸리고 있습니다. 총 ${Math.ceil((maxAttempts * 3) / 60)}분 대기했습니다. 잠시 후 새로고침해서 확인해보세요.`,
              variant: 'destructive',
            })
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
        attempts++
        if (attempts >= maxAttempts) {
          setShouldPoll(false)
          clearInterval(intervalId)
        }
      }
    }

    poll()
    intervalId = window.setInterval(poll, 3000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
      console.log('Assessment polling cleanup executed')
    }
  }, [shouldPoll, hasSubmittedAssessment, patientId, toast, onAssessmentComplete])

  const handleFocusTimeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, focusTime: value }))
  }

  const handleMotivationChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, motivationLevel: value[0] }))
  }

  const handlePastSuccessChange = (value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      pastSuccesses: checked
        ? [...prev.pastSuccesses, value]
        : prev.pastSuccesses.filter((item) => item !== value),
    }))
  }

  const handleConstraintChange = (value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      constraints: checked
        ? [...prev.constraints, value]
        : prev.constraints.filter((item) => item !== value),
    }))
  }

  const handleSocialPreferenceChange = (value: string) => {
    setFormData((prev) => ({ ...prev, socialPreference: value }))
  }

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const calculateDurationYears = (diagnosisDate: string) => {
    const diagnosis = new Date(diagnosisDate)
    const today = new Date()
    return today.getFullYear() - diagnosis.getFullYear()
  }

  const handleSubmit = async () => {
    // 유효성 검사
    const missingFields = []
    if (!formData.focusTime) missingFields.push('집중 시간')
    if (!formData.socialPreference) missingFields.push('사회적 활동 선호도')

    if (missingFields.length > 0) {
      toast({
        title: '필수 항목 미입력',
        description: `다음 항목을 입력해주세요: ${missingFields.join(', ')}`,
        variant: 'destructive',
      })
      return
    }

    if (!patient) {
      toast({
        title: '오류',
        description: '환자 정보가 없습니다.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 1. 평가 데이터를 Supabase에 저장
      const assessmentData = {
        patient_id: patient.id,
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

      const { data: savedAssessment, error: saveError } = await supabase
        .from('assessments')
        .insert(assessmentData)
        .select()
        .single()

      if (saveError) throw saveError

      // 2. 웹훅에 전달할 데이터 준비
      const webhookData = {
        patientId: patient.id,
        patientInfo: {
          age: calculateAge(patient.birth_date),
          gender: patient.gender,
          diagnosis: patient.diagnosis,
          diagnosisDate: patient.diagnosis_date,
          diseaseDurationYears: calculateDurationYears(patient.diagnosis_date),
        },
        assessmentData: {
          patientId: patient.id,
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

      // 3. N8N 웹훅에 데이터 전송
      const webhookResponse = await fetch('https://baclava.uk/webhook/91396e70-644f-4e36-be02-5b8ae847e273', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      })

      if (!webhookResponse.ok) {
        throw new Error('웹훅 전송 실패')
      }

      console.log('Webhook data sent:', webhookData)

      toast({
        title: '질문지 제출 완료',
        description: 'AI 분석을 시작했습니다. 잠시만 기다려 주세요.',
      })

      // 평가 제출 후 폴링 시작
      setHasSubmittedAssessment(true)
      setShouldPoll(true)
      setPollingProgress({ current: 0, max: 20 })

    } catch (error) {
      console.error('Error submitting assessment:', error)
      toast({
        title: '제출 실패',
        description: '질문지 제출 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (patientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">환자를 선택해주세요.</p>
      </div>
    )
  }

  return (
    <main className={`flex-1 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-800">
            맞춤형 목표 설정 질문지
          </h1>
          <p className="text-neutral-600">
            {patient.full_name}님의 개인별 특성을 파악하여 최적의 재활 목표를
            추천해드립니다.
          </p>
        </div>
      </div>

      <div className="max-w-4xl space-y-8">
        {/* 1. 집중력 & 인지 부담 측정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              1. 집중력 & 인지 부담 측정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-base font-medium mb-4 block">
              한 가지 일에 집중할 수 있는 시간은 얼마나 되나요?
            </Label>
            <RadioGroup
              value={formData.focusTime}
              onValueChange={handleFocusTimeChange}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="5min" id="5min" />
                <Label htmlFor="5min">5분 정도</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="15min" id="15min" />
                <Label htmlFor="15min">15분 정도</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30min" id="30min" />
                <Label htmlFor="30min">30분 정도</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1hour+" id="1hour+" />
                <Label htmlFor="1hour+">1시간 이상</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* 2. 변화 동기 & 의지 수준 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              2. 변화 동기 & 의지 수준
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-base font-medium mb-4 block">
              지금 새로운 것을 시작하고 싶은 마음이 얼마나 되나요?
            </Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>별로 없음</span>
                <span className="font-medium">
                  {formData.motivationLevel}점
                </span>
                <span>매우 많음</span>
              </div>
              <Slider
                value={[formData.motivationLevel]}
                onValueChange={handleMotivationChange}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="text-sm text-neutral-600">
                {formData.motivationLevel <= 2 && '현재 상태 유지가 우선'}
                {formData.motivationLevel >= 3 &&
                  formData.motivationLevel <= 4 &&
                  '작은 변화라면 시도해볼 만함'}
                {formData.motivationLevel >= 5 &&
                  formData.motivationLevel <= 6 &&
                  '적당한 도전 가능'}
                {formData.motivationLevel >= 7 &&
                  formData.motivationLevel <= 8 &&
                  '새로운 도전 원함'}
                {formData.motivationLevel >= 9 && '큰 변화도 감당할 준비됨'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. 과거 성공 경험 탐색 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-purple-600" />
              3. 과거 성공 경험 탐색
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-base font-medium mb-4 block">
              예전에 꾸준히 잘 했던 일이나 좋아했던 활동이 있나요? (복수 선택
              가능)
            </Label>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: 'cooking', label: '요리/베이킹' },
                  { value: 'exercise', label: '운동/산책' },
                  { value: 'reading', label: '독서/공부' },
                  { value: 'crafting', label: '만들기/그리기' },
                  { value: 'socializing', label: '사람 만나기/대화' },
                  { value: 'entertainment', label: '음악/영화 감상' },
                  { value: 'organizing', label: '정리/청소' },
                  { value: 'none', label: '특별히 없음' },
                ].map((item) => (
                  <div key={item.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={item.value}
                      checked={formData.pastSuccesses.includes(item.value)}
                      onCheckedChange={(checked) =>
                        handlePastSuccessChange(item.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={item.value}>{item.label}</Label>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-neutral-600">
                  기타 성공 경험이 있다면 적어주세요
                </Label>
                <Textarea
                  placeholder="예: 특별한 취미나 활동, 자격증 취득 등"
                  value={formData.pastSuccessesOther}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pastSuccessesOther: e.target.value,
                    }))
                  }
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. 환경적 제약 사항 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              4. 환경적 제약 사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-base font-medium mb-4 block">
              다음 중 목표 실행에 어려움이 될 수 있는 것은? (복수 선택 가능)
            </Label>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    value: 'transport',
                    label: '교통편 문제 (대중교통 이용 어려움)',
                  },
                  {
                    value: 'financial',
                    label: '경제적 부담 (비용 지출 어려움)',
                  },
                  { value: 'time', label: '시간 제약 (다른 일정으로 바쁨)' },
                  {
                    value: 'physical',
                    label: '신체적 제약 (거동 불편, 체력 부족)',
                  },
                  { value: 'family', label: '가족 반대 (가족이 활동 반대)' },
                  { value: 'none', label: '별다른 제약 없음' },
                ].map((item) => (
                  <div key={item.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`constraint-${item.value}`}
                      checked={formData.constraints.includes(item.value)}
                      onCheckedChange={(checked) =>
                        handleConstraintChange(item.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`constraint-${item.value}`}>
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="constraintsOther">
                  기타 제약사항 (직접 입력)
                </Label>
                <Textarea
                  id="constraintsOther"
                  placeholder="예: 약물 부작용, 집중력 부족, 기타 개인적 제약사항"
                  value={formData.constraintsOther}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      constraintsOther: e.target.value,
                    }))
                  }
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. 사회적 활동 선호도 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              5. 사회적 활동 선호도
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-base font-medium mb-4 block">
              사람들과 함께 하는 활동에 대해 어떻게 생각하세요?
            </Label>
            <RadioGroup
              value={formData.socialPreference}
              onValueChange={handleSocialPreferenceChange}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alone" id="alone" />
                <Label htmlFor="alone">혼자 하는 게 훨씬 편함</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="close_family" id="close_family" />
                <Label htmlFor="close_family">
                  가족이나 아주 가까운 사람과만 괜찮음
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="small_group" id="small_group" />
                <Label htmlFor="small_group">
                  소수의 사람들과는 괜찮음 (2-3명)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium_group" id="medium_group" />
                <Label htmlFor="medium_group">
                  어느 정도 사람들과도 괜찮음 (5-10명)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="large_group" id="large_group" />
                <Label htmlFor="large_group">
                  많은 사람과도 괜찮음 (10명 이상)
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* AI 분석 진행 상황 표시 */}
        {shouldPoll && (
          <div className="w-full mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="font-medium text-blue-800">
                AI 분석 진행 중...
              </span>
            </div>
            <div className="text-sm text-blue-600 mb-2">
              개인맞춤형 목표를 생성하고 있습니다.
              {pollingProgress.max > 0 && (
                <span>
                  ({pollingProgress.current}/{pollingProgress.max} - 예상
                  대기시간:{' '}
                  {Math.ceil(
                    ((pollingProgress.max - pollingProgress.current) * 3) / 60
                  )}
                  분)
                </span>
              )}
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width:
                    pollingProgress.max > 0
                      ? `${(pollingProgress.current / pollingProgress.max) * 100}%`
                      : '20%',
                }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || shouldPoll}
            size="lg"
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                제출 중...
              </>
            ) : shouldPoll ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                질문지 제출
              </>
            )}
          </Button>
        </div>
      </div>
    </main>
  )
} 