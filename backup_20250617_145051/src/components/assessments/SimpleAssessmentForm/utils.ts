export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export const calculateDurationYears = (diagnosisDate: string): number => {
  const diagnosis = new Date(diagnosisDate)
  const today = new Date()
  return today.getFullYear() - diagnosis.getFullYear()
}

export const getPollingStatus = (attempts: number, maxAttempts: number) => {
  const remainingTime = Math.ceil((maxAttempts - attempts) * 3)
  const totalMinutes = Math.ceil((maxAttempts * 3) / 60)
  
  return {
    remainingTime,
    totalMinutes,
    progressPercentage: (attempts / maxAttempts) * 100,
  }
}
