import { AssessmentFormData } from '../types'

export const createFormHandlers = (
  formData: AssessmentFormData,
  setFormData: React.Dispatch<React.SetStateAction<AssessmentFormData>>
) => {
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

  const handlePastSuccessOtherChange = (value: string) => {
    setFormData((prev) => ({ ...prev, pastSuccessesOther: value }))
  }

  const handleConstraintChange = (value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      constraints: checked
        ? [...prev.constraints, value]
        : prev.constraints.filter((item) => item !== value),
    }))
  }

  const handleConstraintOtherChange = (value: string) => {
    setFormData((prev) => ({ ...prev, constraintsOther: value }))
  }

  const handleSocialPreferenceChange = (value: string) => {
    setFormData((prev) => ({ ...prev, socialPreference: value }))
  }

  return {
    handleFocusTimeChange,
    handleMotivationChange,
    handlePastSuccessChange,
    handlePastSuccessOtherChange,
    handleConstraintChange,
    handleConstraintOtherChange,
    handleSocialPreferenceChange,
  }
}
