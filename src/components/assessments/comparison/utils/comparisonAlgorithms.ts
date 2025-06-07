import { AssessmentData } from '@/types/assessment'

// 점수 계산 함수 (5.5에서 사용한 것과 동일)
export const calculateAssessmentScore = (assessment: AssessmentData) => {
  const concentrationScore = Math.min(5, Math.max(1, assessment.concentration_time.duration / 60))
  const motivationScore = (
    (assessment.motivation_level.goal_clarity || 0) +
    (assessment.motivation_level.effort_willingness || 0) +
    (assessment.motivation_level.confidence_level || 0) +
    (assessment.motivation_level.external_support || 0)
  ) / 4
  const successScore = Math.min(5, Math.max(1, 
    (assessment.past_successes.achievement_areas?.length || 0) * 0.5 +
    (assessment.past_successes.most_significant_achievement ? 2 : 0) +
    (assessment.past_successes.learning_from_success ? 1 : 0) +
    (assessment.past_successes.transferable_strategies ? 1 : 0)
  ))
  const constraintsScore = 6 - (assessment.constraints.severity_rating || 3)
  const socialScore = (
    (assessment.social_preference.comfort_with_strangers || 0) +
    (assessment.social_preference.collaboration_willingness || 0)
  ) / 2

  return {
    concentration: concentrationScore,
    motivation: motivationScore,
    success: successScore,
    constraints: constraintsScore,
    social: socialScore,
    overall: (concentrationScore + motivationScore + successScore + constraintsScore + socialScore) / 5
  }
}

// 영역별 점수 배열 반환
export const getScoresByDimension = (assessments: AssessmentData[]) => {
  return assessments.map(assessment => calculateAssessmentScore(assessment))
}

// 시간 기간별 비교
export interface TimeComparison {
  current: AssessmentData[]
  previous: AssessmentData[]
  improvement: {
    concentration: number
    motivation: number
    success: number
    constraints: number
    social: number
    overall: number
  }
  improvementPercentage: {
    concentration: number
    motivation: number
    success: number
    constraints: number
    social: number
    overall: number
  }
  significance: {
    concentration: boolean
    motivation: boolean
    success: boolean
    constraints: boolean
    social: boolean
    overall: boolean
  }
}

export const compareTimeRanges = (
  currentPeriod: AssessmentData[],
  previousPeriod: AssessmentData[]
): TimeComparison => {
  const currentScores = getScoresByDimension(currentPeriod)
  const previousScores = getScoresByDimension(previousPeriod)

  // 평균 계산
  const currentAvg = calculateAverageScores(currentScores)
  const previousAvg = calculateAverageScores(previousScores)

  // 개선도 계산
  const improvement = {
    concentration: currentAvg.concentration - previousAvg.concentration,
    motivation: currentAvg.motivation - previousAvg.motivation,
    success: currentAvg.success - previousAvg.success,
    constraints: currentAvg.constraints - previousAvg.constraints,
    social: currentAvg.social - previousAvg.social,
    overall: currentAvg.overall - previousAvg.overall
  }

  // 개선 백분율
  const improvementPercentage = {
    concentration: (improvement.concentration / previousAvg.concentration) * 100,
    motivation: (improvement.motivation / previousAvg.motivation) * 100,
    success: (improvement.success / previousAvg.success) * 100,
    constraints: (improvement.constraints / previousAvg.constraints) * 100,
    social: (improvement.social / previousAvg.social) * 100,
    overall: (improvement.overall / previousAvg.overall) * 100
  }

  // 통계적 유의성 (간단한 t-test 근사)
  const significance = {
    concentration: Math.abs(improvement.concentration) > 0.5,
    motivation: Math.abs(improvement.motivation) > 0.5,
    success: Math.abs(improvement.success) > 0.5,
    constraints: Math.abs(improvement.constraints) > 0.5,
    social: Math.abs(improvement.social) > 0.5,
    overall: Math.abs(improvement.overall) > 0.3
  }

  return {
    current: currentPeriod,
    previous: previousPeriod,
    improvement,
    improvementPercentage,
    significance
  }
}

// 환자간 비교
export interface PatientComparison {
  patientId: string
  patientName: string
  assessments: AssessmentData[]
  averageScores: {
    concentration: number
    motivation: number
    success: number
    constraints: number
    social: number
    overall: number
  }
  rank: number
  percentile: number
  deviationFromGroup: {
    concentration: number
    motivation: number
    success: number
    constraints: number
    social: number
    overall: number
  }
}

export const comparePatients = (
  patientData: Array<{
    patientId: string
    patientName: string
    assessments: AssessmentData[]
  }>
): PatientComparison[] => {
  // 각 환자의 평균 점수 계산
  const patientScores = patientData.map(patient => {
    const scores = getScoresByDimension(patient.assessments)
    const averageScores = calculateAverageScores(scores)
    
    return {
      ...patient,
      averageScores
    }
  })

  // 전체 그룹 평균 계산
  const groupAverages = calculateGroupAverages(patientScores.map(p => p.averageScores))

  // 순위 매기기 (overall 점수 기준)
  const sortedByOverall = [...patientScores].sort((a, b) => b.averageScores.overall - a.averageScores.overall)

  // 결과 구성
  return sortedByOverall.map((patient, index) => {
    const rank = index + 1
    const percentile = ((patientScores.length - rank + 1) / patientScores.length) * 100

    const deviationFromGroup = {
      concentration: patient.averageScores.concentration - groupAverages.concentration,
      motivation: patient.averageScores.motivation - groupAverages.motivation,
      success: patient.averageScores.success - groupAverages.success,
      constraints: patient.averageScores.constraints - groupAverages.constraints,
      social: patient.averageScores.social - groupAverages.social,
      overall: patient.averageScores.overall - groupAverages.overall
    }

    return {
      patientId: patient.patientId,
      patientName: patient.patientName,
      assessments: patient.assessments,
      averageScores: patient.averageScores,
      rank,
      percentile: Math.round(percentile),
      deviationFromGroup
    }
  })
}

// 진전도 분석
export interface ProgressAnalysis {
  patientId: string
  timeRange: {
    start: Date
    end: Date
  }
  assessmentCount: number
  trends: {
    concentration: 'improving' | 'declining' | 'stable'
    motivation: 'improving' | 'declining' | 'stable'
    success: 'improving' | 'declining' | 'stable'
    constraints: 'improving' | 'declining' | 'stable'
    social: 'improving' | 'declining' | 'stable'
    overall: 'improving' | 'declining' | 'stable'
  }
  slopes: {
    concentration: number
    motivation: number
    success: number
    constraints: number
    social: number
    overall: number
  }
  reliability: number // 0-1, 데이터 신뢰성
}

export const analyzeProgress = (assessments: AssessmentData[], patientId: string): ProgressAnalysis => {
  if (assessments.length < 2) {
    throw new Error('최소 2개의 평가가 필요합니다')
  }

  const sortedAssessments = [...assessments].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const scores = getScoresByDimension(sortedAssessments)
  const timeRange = {
    start: new Date(sortedAssessments[0].created_at),
    end: new Date(sortedAssessments[sortedAssessments.length - 1].created_at)
  }

  // 선형 회귀를 이용한 기울기 계산
  const slopes = calculateLinearRegressionSlopes(scores)
  
  // 추세 판정 (임계값: 0.05)
  const trendThreshold = 0.05
  const trends = {
    concentration: slopes.concentration > trendThreshold ? 'improving' : 
                  slopes.concentration < -trendThreshold ? 'declining' : 'stable',
    motivation: slopes.motivation > trendThreshold ? 'improving' : 
               slopes.motivation < -trendThreshold ? 'declining' : 'stable',
    success: slopes.success > trendThreshold ? 'improving' : 
            slopes.success < -trendThreshold ? 'declining' : 'stable',
    constraints: slopes.constraints > trendThreshold ? 'improving' : 
                slopes.constraints < -trendThreshold ? 'declining' : 'stable',
    social: slopes.social > trendThreshold ? 'improving' : 
           slopes.social < -trendThreshold ? 'declining' : 'stable',
    overall: slopes.overall > trendThreshold ? 'improving' : 
            slopes.overall < -trendThreshold ? 'declining' : 'stable'
  } as const

  // 신뢰성 계산 (평가 횟수와 시간 간격 기반)
  const daysDiff = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24)
  const reliability = Math.min(1, (assessments.length / 5) * (daysDiff / 30))

  return {
    patientId,
    timeRange,
    assessmentCount: assessments.length,
    trends,
    slopes,
    reliability
  }
}

// 유틸리티 함수들
const calculateAverageScores = (scores: ReturnType<typeof calculateAssessmentScore>[]) => {
  if (scores.length === 0) {
    return { concentration: 0, motivation: 0, success: 0, constraints: 0, social: 0, overall: 0 }
  }

  const sums = scores.reduce((acc, score) => ({
    concentration: acc.concentration + score.concentration,
    motivation: acc.motivation + score.motivation,
    success: acc.success + score.success,
    constraints: acc.constraints + score.constraints,
    social: acc.social + score.social,
    overall: acc.overall + score.overall
  }), { concentration: 0, motivation: 0, success: 0, constraints: 0, social: 0, overall: 0 })

  return {
    concentration: sums.concentration / scores.length,
    motivation: sums.motivation / scores.length,
    success: sums.success / scores.length,
    constraints: sums.constraints / scores.length,
    social: sums.social / scores.length,
    overall: sums.overall / scores.length
  }
}

const calculateGroupAverages = (patientAverages: ReturnType<typeof calculateAverageScores>[]) => {
  return calculateAverageScores(patientAverages)
}

const calculateLinearRegressionSlopes = (scores: ReturnType<typeof calculateAssessmentScore>[]) => {
  const n = scores.length
  const xValues = Array.from({ length: n }, (_, i) => i) // 0, 1, 2, ...

  const calculateSlope = (yValues: number[]) => {
    const sumX = xValues.reduce((a, b) => a + b, 0)
    const sumY = yValues.reduce((a, b) => a + b, 0)
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  }

  return {
    concentration: calculateSlope(scores.map(s => s.concentration)),
    motivation: calculateSlope(scores.map(s => s.motivation)),
    success: calculateSlope(scores.map(s => s.success)),
    constraints: calculateSlope(scores.map(s => s.constraints)),
    social: calculateSlope(scores.map(s => s.social)),
    overall: calculateSlope(scores.map(s => s.overall))
  }
} 