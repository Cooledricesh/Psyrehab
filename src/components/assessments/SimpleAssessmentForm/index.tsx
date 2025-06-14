import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAssessmentForm } from './hooks/useAssessmentForm'
import { usePolling } from './hooks/usePolling'
import { createFormHandlers } from './hooks/useFormHandlers'
import {
  FocusTimeCard,
  MotivationCard,
  PastSuccessCard,
  ConstraintsCard,
  SocialPreferenceCard,
  PollingProgress,
} from './cards'
import { SimpleAssessmentFormProps } from './types'

export function SimpleAssessmentForm({ 
  patientId, 
  onAssessmentComplete,
  onBack,
  className 
}: SimpleAssessmentFormProps) {
  const {
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
  } = useAssessmentForm(patientId)

  const formHandlers = createFormHandlers(formData, setFormData)

  usePolling({
    shouldPoll,
    hasSubmittedAssessment,
    patientId,
    onComplete: (id) => {
      setShouldPoll(false)
      onAssessmentComplete?.(id)
    },
    onProgressUpdate: (current, max) => {
      setPollingProgress({ current, max })
    },
  })

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
        <FocusTimeCard 
          value={formData.focusTime}
          onChange={formHandlers.handleFocusTimeChange}
        />

        <MotivationCard
          value={formData.motivationLevel}
          onChange={formHandlers.handleMotivationChange}
        />

        <PastSuccessCard
          selectedValues={formData.pastSuccesses}
          otherValue={formData.pastSuccessesOther}
          onSelectedChange={formHandlers.handlePastSuccessChange}
          onOtherChange={formHandlers.handlePastSuccessOtherChange}
        />

        <ConstraintsCard
          selectedValues={formData.constraints}
          otherValue={formData.constraintsOther}
          onSelectedChange={formHandlers.handleConstraintChange}
          onOtherChange={formHandlers.handleConstraintOtherChange}
        />

        <SocialPreferenceCard
          value={formData.socialPreference}
          onChange={formHandlers.handleSocialPreferenceChange}
        />

        {shouldPoll && (
          <PollingProgress 
            current={pollingProgress.current}
            max={pollingProgress.max}
          />
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
