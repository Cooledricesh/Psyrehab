import { AssessmentService } from '@/services/assessments'
import { supabase } from '@/lib/supabase'
import { AssessmentHistoryParams, CreateHistoryEntryRequest } from '@/types/assessment'

// Supabase 모킹
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('Assessment History Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockHistoryData = [
    {
      id: '1',
      assessment_id: 'assessment-1',
      patient_id: 'patient-1',
      change_type: 'created',
      changes: { status: 'draft' },
      snapshot: { overall_notes: '초기 평가' },
      changed_by: 'social-worker-1',
      changed_at: '2024-01-15T10:00:00Z',
      version_number: 1,
      notes: '평가 생성',
      detailed_assessments: { id: 'assessment-1', status: 'draft' },
      social_workers: { id: 'social-worker-1', name: '김사회복지사', employee_id: 'SW001' }
    },
    {
      id: '2',
      assessment_id: 'assessment-1',
      patient_id: 'patient-1',
      change_type: 'updated',
      changes: { overall_notes: '상세 내용 추가' },
      snapshot: { overall_notes: '초기 평가 - 상세 내용 추가' },
      changed_by: 'social-worker-1',
      changed_at: '2024-01-15T11:00:00Z',
      version_number: 2,
      notes: '평가 내용 수정',
      detailed_assessments: { id: 'assessment-1', status: 'draft' },
      social_workers: { id: 'social-worker-1', name: '김사회복지사', employee_id: 'SW001' }
    }
  ]

  const mockMilestones = [
    {
      id: '1',
      patient_id: 'patient-1',
      milestone_type: 'assessment_completion',
      title: '첫 번째 평가 완료',
      description: '환자의 첫 번째 평가가 성공적으로 완료되었습니다.',
      milestone_date: '2024-01-15T12:00:00Z',
      significance_level: 'medium',
      metadata: { assessment_count: 1 },
      created_at: '2024-01-15T12:00:00Z'
    }
  ]

  const mockInsights = [
    {
      id: '1',
      patient_id: 'patient-1',
      insight_type: 'progress',
      title: '집중력 향상 관찰',
      content: '최근 평가에서 환자의 집중 시간이 이전 대비 30% 향상되었습니다.',
      confidence_score: 85,
      source_data: { assessment_ids: ['assessment-1'] },
      generated_at: '2024-01-15T13:00:00Z'
    }
  ]

  describe('getAssessmentHistory', () => {
    it('평가 히스토리를 성공적으로 조회해야 함', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis()
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)
      mockQuery.range.mockResolvedValue({
        data: mockHistoryData,
        error: null
      })

      const params: AssessmentHistoryParams = {
        patient_id: 'patient-1',
        limit: 10,
        page: 1
      }

      const result = await AssessmentService.getAssessmentHistory(params)

      expect(mockSupabase.from).toHaveBeenCalledWith('assessment_history')
      expect(result).toEqual(mockHistoryData)
    })

    it('에러 발생 시 예외를 던져야 함', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis()
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)
      mockQuery.range.mockResolvedValue({
        data: null,
        error: { message: '데이터베이스 연결 실패' }
      })

      const params: AssessmentHistoryParams = {
        patient_id: 'patient-1'
      }

      await expect(AssessmentService.getAssessmentHistory(params))
        .rejects.toThrow('평가 히스토리 조회 실패: 데이터베이스 연결 실패')
    })
  })

  describe('getAssessmentVersionInfo', () => {
    it('평가 버전 정보를 성공적으로 조회해야 함', async () => {
      const mockVersionData = [
        {
          version_number: 2,
          changed_at: '2024-01-15T11:00:00Z',
          change_type: 'updated',
          social_workers: { name: '김사회복지사' }
        },
        {
          version_number: 1,
          changed_at: '2024-01-15T10:00:00Z',
          change_type: 'created',
          social_workers: { name: '김사회복지사' }
        }
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis()
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)
      mockQuery.order.mockResolvedValue({
        data: mockVersionData,
        error: null
      })

      const result = await AssessmentService.getAssessmentVersionInfo('assessment-1')

      expect(result.current_version).toBe(2)
      expect(result.total_versions).toBe(2)
      expect(result.versions).toHaveLength(2)
      expect(result.versions[0].version_number).toBe(2)
    })
  })

  describe('createHistoryEntry', () => {
    it('히스토리 엔트리를 성공적으로 생성해야 함', async () => {
      // 최신 버전 조회 모킹
      const mockVersionQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { version_number: 1 },
          error: null
        })
      }

      // 히스토리 생성 모킹
      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            ...mockHistoryData[1],
            version_number: 2
          },
          error: null
        })
      }

      mockSupabase.from
        .mockReturnValueOnce(mockVersionQuery as any)
        .mockReturnValueOnce(mockInsertQuery as any)

      const request: CreateHistoryEntryRequest = {
        assessment_id: 'assessment-1',
        patient_id: 'patient-1',
        change_type: 'updated',
        changes: { overall_notes: '상세 내용 추가' },
        snapshot: { overall_notes: '초기 평가 - 상세 내용 추가' },
        changed_by: 'social-worker-1',
        notes: '평가 내용 수정'
      }

      const result = await AssessmentService.createHistoryEntry(request)

      expect(mockInsertQuery.insert).toHaveBeenCalled()
      expect(result.version_number).toBe(2)
      expect(result.change_type).toBe('updated')
    })
  })

  describe('getAssessmentTimeline', () => {
    it('환자별 평가 타임라인을 성공적으로 조회해야 함', async () => {
      // getAssessmentHistory 메서드 모킹
      jest.spyOn(AssessmentService, 'getAssessmentHistory')
        .mockResolvedValue(mockHistoryData)

      // 마일스톤 조회 모킹
      const mockMilestoneQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis()
      }

      // 인사이트 조회 모킹
      const mockInsightQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis()
      }

      mockSupabase.from
        .mockReturnValueOnce(mockMilestoneQuery as any)
        .mockReturnValueOnce(mockInsightQuery as any)

      mockMilestoneQuery.order.mockResolvedValue({
        data: mockMilestones,
        error: null
      })

      mockInsightQuery.limit.mockResolvedValue({
        data: mockInsights,
        error: null
      })

      const result = await AssessmentService.getAssessmentTimeline('patient-1')

      expect(result.history).toEqual(mockHistoryData)
      expect(result.milestones).toEqual(mockMilestones)
      expect(result.insights).toEqual(mockInsights)
      expect(result.progress_percentage).toBeDefined()
      expect(result.trends).toBeDefined()
    })
  })

  describe('createMilestone', () => {
    it('마일스톤을 성공적으로 생성해야 함', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockMilestones[0],
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const milestone = {
        patient_id: 'patient-1',
        milestone_type: 'assessment_completion' as const,
        title: '첫 번째 평가 완료',
        description: '환자의 첫 번째 평가가 성공적으로 완료되었습니다.',
        milestone_date: '2024-01-15T12:00:00Z',
        significance_level: 'medium' as const,
        metadata: { assessment_count: 1 }
      }

      const result = await AssessmentService.createMilestone(milestone)

      expect(mockQuery.insert).toHaveBeenCalled()
      expect(result.title).toBe('첫 번째 평가 완료')
    })
  })

  describe('createInsight', () => {
    it('인사이트를 성공적으로 생성해야 함', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockInsights[0],
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const insight = {
        patient_id: 'patient-1',
        insight_type: 'progress' as const,
        title: '집중력 향상 관찰',
        content: '최근 평가에서 환자의 집중 시간이 이전 대비 30% 향상되었습니다.',
        confidence_score: 85,
        source_data: { assessment_ids: ['assessment-1'] }
      }

      const result = await AssessmentService.createInsight(insight)

      expect(mockQuery.insert).toHaveBeenCalled()
      expect(result.title).toBe('집중력 향상 관찰')
      expect(result.confidence_score).toBe(85)
    })
  })

  describe('getPatientMilestones', () => {
    it('환자별 마일스톤을 성공적으로 조회해야 함', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis()
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)
      mockQuery.order.mockResolvedValue({
        data: mockMilestones,
        error: null
      })

      const result = await AssessmentService.getPatientMilestones('patient-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('assessment_milestones')
      expect(mockQuery.eq).toHaveBeenCalledWith('patient_id', 'patient-1')
      expect(result).toEqual(mockMilestones)
    })
  })

  describe('getPatientInsights', () => {
    it('환자별 인사이트를 성공적으로 조회해야 함', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis()
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)
      mockQuery.limit.mockResolvedValue({
        data: mockInsights,
        error: null
      })

      const result = await AssessmentService.getPatientInsights('patient-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('progress_insights')
      expect(mockQuery.eq).toHaveBeenCalledWith('patient_id', 'patient-1')
      expect(mockQuery.limit).toHaveBeenCalledWith(10)
      expect(result).toEqual(mockInsights)
    })
  })
}) 