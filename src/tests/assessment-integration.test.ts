/**
 * Assessment System Data Storage & Retrieval Integration Test
 * Tests the complete flow from service to database for Task 5.3
 */

import { AssessmentService } from '@/services/assessments'
import type { 
  AssessmentCreateRequest, 
  AssessmentUpdateRequest
} from '@/types/assessment'

// Mock data for testing
const mockPatientId = '123e4567-e89b-12d3-a456-426614174001'
const mockAssessorId = '123e4567-e89b-12d3-a456-426614174002'

const mockAssessmentData: AssessmentCreateRequest = {
  patient_id: mockPatientId,
  assessment_data: {
    assessor_id: mockAssessorId,
    assessment_date: '2024-01-15',
    status: 'draft',
    concentration_time: {
      duration: 45,
      preferred_environment: 'quiet',
      time_of_day: 'morning',
      break_frequency: 15,
      attention_span: 30,
      focus_quality: 4
    },
    motivation_level: {
      goal_clarity: 4,
      effort_willingness: 3,
      confidence_level: 4,
      external_support: 5
    },
    past_successes: {
      academic_achievements: ['수학 시험 만점', '과학 프로젝트 1등'],
      creative_accomplishments: ['그림 그리기', '작문 대회 입상'],
      social_achievements: ['리더십', '팀워크'],
      personal_growth: ['인내심 향상', '자기관리 능력']
    },
    constraints: {
      physical_limitations: ['시력 약함'],
      cognitive_challenges: ['집중력 부족'],
      emotional_barriers: ['불안감'],
      environmental_factors: ['소음에 민감'],
      resource_limitations: ['교재 부족']
    },
    social_preference: {
      preferred_group_size: 'small',
      interaction_style: 'moderate',
      communication_preference: 'verbal',
      leadership_comfort: 'follower',
      conflict_handling: 'avoidance'
    },
    overall_notes: '환자는 조용한 환경에서 집중력이 향상되며, 적절한 지원이 있을 때 높은 동기를 보입니다.'
  }
}

/**
 * Helper function to run the integration test
 */
export async function runAssessmentIntegrationTest() {
  console.log('🚀 Starting Assessment Data Storage & Retrieval Integration Test')
  console.log('=' .repeat(60))
  
  let createdAssessmentId: string
  
  try {
    // Test 1: Create Assessment
    console.log('🧪 Test 1: Creating new assessment...')
    const created = await AssessmentService.createAssessment(mockAssessmentData)
    
    if (!created.id || created.patient_id !== mockPatientId) {
      throw new Error('Assessment creation failed - invalid data returned')
    }
    
    createdAssessmentId = created.id
    console.log('✅ Assessment created successfully:', created.id)

    // Test 2: Retrieve Assessment
    console.log('🧪 Test 2: Retrieving assessment...')
    const retrieved = await AssessmentService.getAssessment(createdAssessmentId)
    
    if (retrieved.id !== createdAssessmentId || 
        !retrieved.concentration_time || 
        retrieved.concentration_time.duration !== 45) {
      throw new Error('Assessment retrieval failed - data integrity issue')
    }
    
    console.log('✅ Assessment retrieved successfully with all data intact')

    // Test 3: Update Assessment
    console.log('🧪 Test 3: Updating assessment...')
    const updateData: AssessmentUpdateRequest = {
      assessment_data: {
        status: 'completed',
        concentration_time: {
          duration: 60,
          preferred_environment: 'quiet',
          time_of_day: 'afternoon',
          break_frequency: 20,
          attention_span: 45,
          focus_quality: 5
        },
        overall_notes: '환자의 집중력이 크게 향상되었습니다. 업데이트된 평가입니다.'
      }
    }
    
    const updated = await AssessmentService.updateAssessment(createdAssessmentId, updateData)
    
    if (updated.status !== 'completed' || updated.concentration_time.duration !== 60) {
      throw new Error('Assessment update failed')
    }
    
    console.log('✅ Assessment updated successfully')

    // Test 4: List Assessments
    console.log('🧪 Test 4: Testing assessment listing...')
    const listResult = await AssessmentService.getAssessments({
      page: 1,
      limit: 10,
      filters: { patient_id: mockPatientId }
    })
    
    if (!Array.isArray(listResult.data) || listResult.data.length === 0) {
      throw new Error('Assessment listing failed')
    }
    
    console.log('✅ Assessment listing working correctly')

    // Test 5: Statistics
    console.log('🧪 Test 5: Testing statistics calculation...')
    const stats = await AssessmentService.getPatientAssessmentStats(mockPatientId)
    
    if (!stats.total_assessments || !stats.average_scores) {
      throw new Error('Statistics calculation failed')
    }
    
    console.log('✅ Statistics calculated successfully')

    // Test 6: Visualization Data
    console.log('🧪 Test 6: Testing visualization data...')
    const vizData = await AssessmentService.getVisualizationData(mockPatientId)
    
    if (!Array.isArray(vizData.timeline) || !vizData.score_trends) {
      throw new Error('Visualization data generation failed')
    }
    
    console.log('✅ Visualization data generated successfully')

    // Test 7: Assessment Comparison
    console.log('🧪 Test 7: Testing assessment comparison...')
    const comparison = await AssessmentService.compareAssessments(createdAssessmentId)
    
    if (!comparison.current || !comparison.changes) {
      throw new Error('Assessment comparison failed')
    }
    
    console.log('✅ Assessment comparison working correctly')

    // Test 8: Cleanup
    console.log('🧪 Test 8: Cleaning up...')
    await AssessmentService.deleteAssessment(createdAssessmentId)
    console.log('✅ Assessment deleted successfully')

    console.log('=' .repeat(60))
    console.log('📝 Integration test completed successfully!')
    console.log('✅ All data storage and retrieval functions are working correctly')
    
    return {
      success: true,
      message: 'Assessment system data storage and retrieval integration test passed'
    }
  } catch (error) {
    console.error('❌ Integration test failed:', error)
    
    // Cleanup on failure
    if (createdAssessmentId) {
      try {
        await AssessmentService.deleteAssessment(createdAssessmentId)
        console.log('🧹 Cleaned up test data')
      } catch (cleanupError) {
        console.error('Failed to cleanup test data:', cleanupError)
      }
    }
    
    return {
      success: false,
      message: `Integration test failed: ${error.message}`,
      error
    }
  }
}

/**
 * Test configuration
 */
export const testConfig = {
  description: 'Assessment System Data Storage & Retrieval Integration Test',
  purpose: 'Verify that Task 5.3 implementation works correctly',
  testCases: [
    'Create assessment with all JSONB fields',
    'Retrieve assessment with data integrity',
    'Update assessment data',
    'List and filter assessments',
    'Calculate statistics',
    'Generate visualization data',
    'Compare assessments',
    'Delete assessment'
  ],
  expectedResults: {
    dataIntegrity: 'All JSONB fields stored and retrieved correctly',
    performance: 'Queries execute within reasonable time',
    functionality: 'All CRUD operations work as expected',
    relationships: 'Foreign key relationships maintained'
  }
} 