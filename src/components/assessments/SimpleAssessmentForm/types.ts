export interface AssessmentFormData {
  focusTime: string
  motivationLevel: number
  pastSuccesses: string[]
  pastSuccessesOther: string
  constraints: string[]
  constraintsOther: string
  socialPreference: string
}

export interface Patient {
  id: number
  full_name: string
  birth_date: string
  gender: string
  diagnosis: string
  diagnosis_date: string
  created_at: string
}

export interface SimpleAssessmentFormProps {
  patientId?: string
  onAssessmentComplete?: (assessmentId: string) => void
  onBack?: () => void
  className?: string
}

export interface PollingProgress {
  current: number
  max: number
}
