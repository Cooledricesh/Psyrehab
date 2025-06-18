import { describe, it, expect } from 'vitest'
import type { AssessmentData, CreateAssessmentData } from '@/types/assessment'

// Test data that should satisfy the AssessmentData interface
const validAssessmentData: AssessmentData = {
  id: 'test-assessment-1',
  patient_id: 'patient123',
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:00:00Z',
  concentration_time: {
    duration: 45,
    activity: '독서'
  },
  motivation_level: {
    goal_clarity: 4,
    effort_willingness: 3,
    confidence_level: 4,
    external_support: 5
  },
  past_successes: {
    achievement_areas: ['학업', '운동'],
    most_significant_achievement: '학업 성과 향상',
    learning_from_success: true,
    transferable_strategies: true
  },
  constraints: {
    primary_factors: ['시간 부족', '환경적 요인'],
    severity_rating: 3,
    management_strategies: ['시간 관리', '환경 개선']
  },
  social_preference: {
    comfort_with_strangers: 3,
    collaboration_willingness: 4,
    preferred_group_size: '소그룹 (3-5명)'
  }
}

const validCreateAssessmentData: CreateAssessmentData = {
  patient_id: 'patient123',
  concentration_time: {
    duration: 45,
    activity: '독서'
  },
  motivation_level: {
    goal_clarity: 4,
    effort_willingness: 3,
    confidence_level: 4,
    external_support: 5
  },
  past_successes: {
    achievement_areas: ['학업', '운동'],
    most_significant_achievement: '학업 성과 향상',
    learning_from_success: true,
    transferable_strategies: true
  },
  constraints: {
    primary_factors: ['시간 부족'],
    severity_rating: 3,
    management_strategies: ['시간 관리']
  },
  social_preference: {
    comfort_with_strangers: 3,
    collaboration_willingness: 4,
    preferred_group_size: '소그룹 (3-5명)'
  }
}

describe('Assessment Type Definitions', () => {
  it('validates AssessmentData interface structure', () => {
    // Test that our valid data satisfies the interface
    const assessment: AssessmentData = validAssessmentData
    
    expect(typeof assessment.id).toBe('string')
    expect(typeof assessment.patient_id).toBe('string')
    expect(typeof assessment.created_at).toBe('string')
    expect(typeof assessment.updated_at).toBe('string')
    expect(typeof assessment.concentration_time).toBe('object')
    expect(typeof assessment.motivation_level).toBe('object')
    expect(typeof assessment.past_successes).toBe('object')
    expect(typeof assessment.constraints).toBe('object')
    expect(typeof assessment.social_preference).toBe('object')
  })

  it('validates CreateAssessmentData interface structure', () => {
    // Test that our create data satisfies the interface
    const createData: CreateAssessmentData = validCreateAssessmentData
    
    expect(typeof createData.patient_id).toBe('string')
    expect(typeof createData.concentration_time).toBe('object')
    expect(typeof createData.motivation_level).toBe('object')
    expect(typeof createData.past_successes).toBe('object')
    expect(typeof createData.constraints).toBe('object')
    expect(typeof createData.social_preference).toBe('object')
    
    // CreateAssessmentData should not have id, created_at, updated_at
    expect('id' in createData).toBe(false)
    expect('created_at' in createData).toBe(false)
    expect('updated_at' in createData).toBe(false)
  })

  it('validates concentration_time structure', () => {
    const { concentration_time } = validAssessmentData
    
    expect(typeof concentration_time.duration).toBe('number')
    expect(typeof concentration_time.activity).toBe('string')
    expect(concentration_time.duration).toBeGreaterThan(0)
  })

  it('validates motivation_level structure', () => {
    const { motivation_level } = validAssessmentData
    
    expect(typeof motivation_level.goal_clarity).toBe('number')
    expect(typeof motivation_level.effort_willingness).toBe('number')
    expect(typeof motivation_level.confidence_level).toBe('number')
    expect(typeof motivation_level.external_support).toBe('number')
    
    // All motivation scores should be between 1-5
    expect(motivation_level.goal_clarity).toBeGreaterThanOrEqual(1)
    expect(motivation_level.goal_clarity).toBeLessThanOrEqual(5)
    expect(motivation_level.effort_willingness).toBeGreaterThanOrEqual(1)
    expect(motivation_level.effort_willingness).toBeLessThanOrEqual(5)
    expect(motivation_level.confidence_level).toBeGreaterThanOrEqual(1)
    expect(motivation_level.confidence_level).toBeLessThanOrEqual(5)
    expect(motivation_level.external_support).toBeGreaterThanOrEqual(1)
    expect(motivation_level.external_support).toBeLessThanOrEqual(5)
  })

  it('validates past_successes structure', () => {
    const { past_successes } = validAssessmentData
    
    expect(Array.isArray(past_successes.achievement_areas)).toBe(true)
    expect(typeof past_successes.most_significant_achievement).toBe('string')
    expect(typeof past_successes.learning_from_success).toBe('boolean')
    expect(typeof past_successes.transferable_strategies).toBe('boolean')
    
    // Achievement areas should contain strings
    past_successes.achievement_areas?.forEach(area => {
      expect(typeof area).toBe('string')
    })
  })

  it('validates constraints structure', () => {
    const { constraints } = validAssessmentData
    
    expect(Array.isArray(constraints.primary_factors)).toBe(true)
    expect(typeof constraints.severity_rating).toBe('number')
    expect(Array.isArray(constraints.management_strategies)).toBe(true)
    
    // Severity rating should be between 1-5
    expect(constraints.severity_rating).toBeGreaterThanOrEqual(1)
    expect(constraints.severity_rating).toBeLessThanOrEqual(5)
    
    // Arrays should contain strings
    constraints.primary_factors.forEach(factor => {
      expect(typeof factor).toBe('string')
    })
    constraints.management_strategies.forEach(strategy => {
      expect(typeof strategy).toBe('string')
    })
  })

  it('validates social_preference structure', () => {
    const { social_preference } = validAssessmentData
    
    expect(typeof social_preference.comfort_with_strangers).toBe('number')
    expect(typeof social_preference.collaboration_willingness).toBe('number')
    expect(typeof social_preference.preferred_group_size).toBe('string')
    
    // Social scores should be between 1-5
    expect(social_preference.comfort_with_strangers).toBeGreaterThanOrEqual(1)
    expect(social_preference.comfort_with_strangers).toBeLessThanOrEqual(5)
    expect(social_preference.collaboration_willingness).toBeGreaterThanOrEqual(1)
    expect(social_preference.collaboration_willingness).toBeLessThanOrEqual(5)
  })

  it('validates optional fields are handled correctly', () => {
    // Test with minimal required data
    const minimalAssessment: AssessmentData = {
      id: 'minimal-test',
      patient_id: 'patient456',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
      concentration_time: {
        duration: 30,
        activity: '공부'
      },
      motivation_level: {
        goal_clarity: 3,
        effort_willingness: 3,
        confidence_level: 3,
        external_support: 3
      },
      past_successes: {
        achievement_areas: [],
        most_significant_achievement: '',
        learning_from_success: false,
        transferable_strategies: false
      },
      constraints: {
        primary_factors: [],
        severity_rating: 1,
        management_strategies: []
      },
      social_preference: {
        comfort_with_strangers: 1,
        collaboration_willingness: 1,
        preferred_group_size: '개별 작업'
      }
    }
    
    expect(minimalAssessment).toBeDefined()
    expect(typeof minimalAssessment.id).toBe('string')
  })

  it('validates data transformation compatibility', () => {
    // Test that CreateAssessmentData can be extended to AssessmentData
    const createData: CreateAssessmentData = validCreateAssessmentData
    
    const fullAssessment: AssessmentData = {
      id: 'generated-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...createData
    }
    
    expect(fullAssessment.id).toBe('generated-id')
    expect(fullAssessment.patient_id).toBe(createData.patient_id)
    expect(fullAssessment.concentration_time).toEqual(createData.concentration_time)
  })

  it('validates array field types', () => {
    const assessment = validAssessmentData
    
    // Achievement areas should be string array
    const achievementAreas: string[] = assessment.past_successes.achievement_areas || []
    achievementAreas.forEach(area => {
      expect(typeof area).toBe('string')
    })
    
    // Primary factors should be string array
    const primaryFactors: string[] = assessment.constraints.primary_factors
    primaryFactors.forEach(factor => {
      expect(typeof factor).toBe('string')
    })
    
    // Management strategies should be string array
    const strategies: string[] = assessment.constraints.management_strategies
    strategies.forEach(strategy => {
      expect(typeof strategy).toBe('string')
    })
  })

  it('validates numeric range constraints', () => {
    const assessment = validAssessmentData
    
    // Duration should be positive
    expect(assessment.concentration_time.duration).toBeGreaterThan(0)
    
    // All 1-5 scale ratings should be in valid range
    const motivationScores = [
      assessment.motivation_level.goal_clarity,
      assessment.motivation_level.effort_willingness,
      assessment.motivation_level.confidence_level,
      assessment.motivation_level.external_support
    ]
    
    motivationScores.forEach(score => {
      expect(score).toBeGreaterThanOrEqual(1)
      expect(score).toBeLessThanOrEqual(5)
    })
    
    expect(assessment.constraints.severity_rating).toBeGreaterThanOrEqual(1)
    expect(assessment.constraints.severity_rating).toBeLessThanOrEqual(5)
    
    expect(assessment.social_preference.comfort_with_strangers).toBeGreaterThanOrEqual(1)
    expect(assessment.social_preference.comfort_with_strangers).toBeLessThanOrEqual(5)
    expect(assessment.social_preference.collaboration_willingness).toBeGreaterThanOrEqual(1)
    expect(assessment.social_preference.collaboration_willingness).toBeLessThanOrEqual(5)
  })

  it('validates date string formats', () => {
    const assessment = validAssessmentData
    
    // Should be valid ISO date strings
    expect(new Date(assessment.created_at).toISOString()).toBe(assessment.created_at)
    expect(new Date(assessment.updated_at).toISOString()).toBe(assessment.updated_at)
    
    // Should be parseable as dates
    expect(new Date(assessment.created_at).getTime()).not.toBeNaN()
    expect(new Date(assessment.updated_at).getTime()).not.toBeNaN()
  })
}) 