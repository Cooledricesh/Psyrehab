// 통계 분석 유틸리티

export interface StatisticalResult {
  mean: number
  median: number
  standardDeviation: number
  variance: number
  min: number
  max: number
  range: number
  quartiles: {
    q1: number
    q2: number
    q3: number
  }
  outliers: number[]
}

export interface TTestResult {
  tStatistic: number
  pValue: number
  degreesOfFreedom: number
  isSignificant: boolean
  confidenceInterval: {
    lower: number
    upper: number
  }
  effectSize: number // Cohen's d
}

export interface CorrelationResult {
  coefficient: number
  pValue: number
  isSignificant: boolean
  strength: 'very weak' | 'weak' | 'moderate' | 'strong' | 'very strong'
}

// 기본 통계 계산
export const calculateBasicStatistics = (values: number[]): StatisticalResult => {
  if (values.length === 0) {
    throw new Error('빈 배열에는 통계를 계산할 수 없습니다')
  }

  const sorted = [...values].sort((a, b) => a - b)
  const n = values.length
  
  // 평균
  const mean = values.reduce((sum, val) => sum + val, 0) / n
  
  // 중앙값
  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)]
  
  // 분산과 표준편차
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1)
  const standardDeviation = Math.sqrt(variance)
  
  // 최소값, 최대값, 범위
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  
  // 사분위수
  const q1Index = Math.floor(n * 0.25)
  const q3Index = Math.floor(n * 0.75)
  const quartiles = {
    q1: sorted[q1Index],
    q2: median,
    q3: sorted[q3Index]
  }
  
  // 이상값 감지 (IQR 방법)
  const iqr = quartiles.q3 - quartiles.q1
  const lowerBound = quartiles.q1 - 1.5 * iqr
  const upperBound = quartiles.q3 + 1.5 * iqr
  const outliers = values.filter(val => val < lowerBound || val > upperBound)
  
  return {
    mean: Math.round(mean * 1000) / 1000,
    median: Math.round(median * 1000) / 1000,
    standardDeviation: Math.round(standardDeviation * 1000) / 1000,
    variance: Math.round(variance * 1000) / 1000,
    min,
    max,
    range: Math.round(range * 1000) / 1000,
    quartiles: {
      q1: Math.round(quartiles.q1 * 1000) / 1000,
      q2: Math.round(quartiles.q2 * 1000) / 1000,
      q3: Math.round(quartiles.q3 * 1000) / 1000
    },
    outliers
  }
}

// 독립 표본 t-검정
export const performTTest = (group1: number[], group2: number[], alpha: number = 0.05): TTestResult => {
  if (group1.length < 2 || group2.length < 2) {
    throw new Error('각 그룹은 최소 2개의 값이 필요합니다')
  }

  const n1 = group1.length
  const n2 = group2.length
  
  // 평균과 분산 계산
  const mean1 = group1.reduce((sum, val) => sum + val, 0) / n1
  const mean2 = group2.reduce((sum, val) => sum + val, 0) / n2
  
  const variance1 = group1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1)
  const variance2 = group2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1)
  
  // 합동 분산 (pooled variance)
  const pooledVariance = ((n1 - 1) * variance1 + (n2 - 1) * variance2) / (n1 + n2 - 2)
  
  // 표준 오차
  const standardError = Math.sqrt(pooledVariance * (1/n1 + 1/n2))
  
  // t-통계량
  const tStatistic = (mean1 - mean2) / standardError
  
  // 자유도
  const degreesOfFreedom = n1 + n2 - 2
  
  // p-값 근사 (간단한 근사법 사용)
  const pValue = calculatePValueApproximation(Math.abs(tStatistic), degreesOfFreedom)
  
  // 유의성 검정
  const isSignificant = pValue < alpha
  
  // 효과 크기 (Cohen's d)
  const pooledStandardDeviation = Math.sqrt(pooledVariance)
  const effectSize = (mean1 - mean2) / pooledStandardDeviation
  
  // 신뢰구간 (95%)
  const tCritical = getTCriticalValue(degreesOfFreedom, alpha)
  const marginOfError = tCritical * standardError
  const confidenceInterval = {
    lower: (mean1 - mean2) - marginOfError,
    upper: (mean1 - mean2) + marginOfError
  }
  
  return {
    tStatistic: Math.round(tStatistic * 1000) / 1000,
    pValue: Math.round(pValue * 1000) / 1000,
    degreesOfFreedom,
    isSignificant,
    confidenceInterval: {
      lower: Math.round(confidenceInterval.lower * 1000) / 1000,
      upper: Math.round(confidenceInterval.upper * 1000) / 1000
    },
    effectSize: Math.round(effectSize * 1000) / 1000
  }
}

// 피어슨 상관계수
export const calculateCorrelation = (x: number[], y: number[], alpha: number = 0.05): CorrelationResult => {
  if (x.length !== y.length || x.length < 3) {
    throw new Error('두 배열의 길이가 같아야 하며, 최소 3개의 값이 필요합니다')
  }

  const n = x.length
  
  // 평균 계산
  const meanX = x.reduce((sum, val) => sum + val, 0) / n
  const meanY = y.reduce((sum, val) => sum + val, 0) / n
  
  // 편차 계산
  const deviationsX = x.map(val => val - meanX)
  const deviationsY = y.map(val => val - meanY)
  
  // 공분산
  const covariance = deviationsX.reduce((sum, devX, i) => sum + devX * deviationsY[i], 0) / (n - 1)
  
  // 표준편차
  const stdX = Math.sqrt(deviationsX.reduce((sum, dev) => sum + dev * dev, 0) / (n - 1))
  const stdY = Math.sqrt(deviationsY.reduce((sum, dev) => sum + dev * dev, 0) / (n - 1))
  
  // 피어슨 상관계수
  const coefficient = covariance / (stdX * stdY)
  
  // t-통계량과 p-값 (상관계수의 유의성 검정)
  const tStatistic = coefficient * Math.sqrt((n - 2) / (1 - coefficient * coefficient))
  const pValue = calculatePValueApproximation(Math.abs(tStatistic), n - 2)
  const isSignificant = pValue < alpha
  
  // 상관의 강도 해석
  const absCoeff = Math.abs(coefficient)
  let strength: CorrelationResult['strength']
  if (absCoeff < 0.1) strength = 'very weak'
  else if (absCoeff < 0.3) strength = 'weak'
  else if (absCoeff < 0.5) strength = 'moderate'
  else if (absCoeff < 0.7) strength = 'strong'
  else strength = 'very strong'
  
  return {
    coefficient: Math.round(coefficient * 1000) / 1000,
    pValue: Math.round(pValue * 1000) / 1000,
    isSignificant,
    strength
  }
}

// 분산분석 (ANOVA) - 일원분산분석
export interface ANOVAResult {
  fStatistic: number
  pValue: number
  isSignificant: boolean
  betweenGroupVariance: number
  withinGroupVariance: number
  totalVariance: number
  degreesOfFreedomBetween: number
  degreesOfFreedomWithin: number
  etaSquared: number // 효과 크기
}

export const performANOVA = (groups: number[][], alpha: number = 0.05): ANOVAResult => {
  if (groups.length < 2) {
    throw new Error('최소 2개의 그룹이 필요합니다')
  }

  const k = groups.length // 그룹 수
  const n = groups.reduce((sum, group) => sum + group.length, 0) // 전체 관측값 수
  
  // 전체 평균
  const allValues = groups.flat()
  const grandMean = allValues.reduce((sum, val) => sum + val, 0) / n
  
  // 그룹별 평균과 크기
  const groupStats = groups.map(group => ({
    mean: group.reduce((sum, val) => sum + val, 0) / group.length,
    size: group.length,
    values: group
  }))
  
  // 집단 간 변동 (Between Groups)
  const betweenSumSquares = groupStats.reduce((sum, group) => 
    sum + group.size * Math.pow(group.mean - grandMean, 2), 0
  )
  
  // 집단 내 변동 (Within Groups)
  const withinSumSquares = groupStats.reduce((sum, group) => 
    sum + group.values.reduce((groupSum, val) => 
      groupSum + Math.pow(val - group.mean, 2), 0
    ), 0
  )
  
  // 자유도
  const dfBetween = k - 1
  const dfWithin = n - k
  
  // 평균 제곱
  const betweenMeanSquare = betweenSumSquares / dfBetween
  const withinMeanSquare = withinSumSquares / dfWithin
  
  // F-통계량
  const fStatistic = betweenMeanSquare / withinMeanSquare
  
  // p-값 근사
  const pValue = calculateFPValueApproximation(fStatistic, dfBetween, dfWithin)
  const isSignificant = pValue < alpha
  
  // 효과 크기 (에타 제곱)
  const totalSumSquares = betweenSumSquares + withinSumSquares
  const etaSquared = betweenSumSquares / totalSumSquares
  
  return {
    fStatistic: Math.round(fStatistic * 1000) / 1000,
    pValue: Math.round(pValue * 1000) / 1000,
    isSignificant,
    betweenGroupVariance: Math.round(betweenMeanSquare * 1000) / 1000,
    withinGroupVariance: Math.round(withinMeanSquare * 1000) / 1000,
    totalVariance: Math.round(totalSumSquares * 1000) / 1000,
    degreesOfFreedomBetween: dfBetween,
    degreesOfFreedomWithin: dfWithin,
    etaSquared: Math.round(etaSquared * 1000) / 1000
  }
}

// 보조 함수들

// p-값 근사 (간단한 근사법)
const calculatePValueApproximation = (t: number, df: number): number => {
  // t-분포의 근사 p-값 계산 (양측 검정)
  // 간단한 근사식 사용
  if (df >= 30) {
    // 자유도가 클 때는 정규분포 근사
    return 2 * (1 - normalCDF(t))
  } else {
    // 작은 자유도에 대한 간단한 근사
    const factor = 1 + (t * t) / df
    const approxP = Math.pow(factor, -(df + 1) / 2)
    return Math.min(2 * approxP, 1)
  }
}

// F-분포 p-값 근사
const calculateFPValueApproximation = (f: number, df1: number, df2: number): number => {
  // 간단한 F-분포 p-값 근사
  if (f < 1) return 1
  
  // Beta 함수를 이용한 근사
  const x = df2 / (df2 + df1 * f)
  const alpha = df2 / 2
  const beta = df1 / 2
  
  // 불완전 베타함수의 간단한 근사
  return Math.max(0.001, Math.min(0.999, Math.pow(x, alpha)))
}

// 정규분포 누적분포함수 근사
const normalCDF = (x: number): number => {
  // Abramowitz and Stegun 근사
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989423 * Math.exp(-x * x / 2)
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  
  if (x > 0) prob = 1 - prob
  
  return prob
}

// t-분포 임계값 근사
const getTCriticalValue = (df: number, alpha: number): number => {
  // 간단한 t-분포 임계값 근사 (95% 신뢰구간용)
  if (df >= 30) return 1.96 // 정규분포 근사
  
  const tTable: { [key: number]: number } = {
    1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
    6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
    15: 2.131, 20: 2.086, 25: 2.060, 30: 2.042
  }
  
  // 가장 가까운 자유도 값 찾기
  const availableDF = Object.keys(tTable).map(Number).sort((a, b) => a - b)
  const closestDF = availableDF.reduce((prev, curr) => 
    Math.abs(curr - df) < Math.abs(prev - df) ? curr : prev
  )
  
  return tTable[closestDF] || 2.0
} 