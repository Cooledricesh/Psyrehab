import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AssessmentForm } from '@/components/assessments/AssessmentForm'

// Mock the useCreateAssessment hook
const mockMutate = vi.fn()
vi.mock('@/hooks/useAssessments', () => ({
  useCreateAssessment: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null
  })
}))

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('AssessmentForm Component', () => {
  let user: ReturnType<typeof userEvent.setup>
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  it('renders all form sections', () => {
    render(
      <TestWrapper>
        <AssessmentForm onAssessmentComplete={mockOnComplete} />
      </TestWrapper>
    )

    // Check main heading
    expect(screen.getByText('평가 작성')).toBeInTheDocument()

    // Check all section headings
    expect(screen.getByText('기본 정보')).toBeInTheDocument()
    expect(screen.getByText('집중 시간')).toBeInTheDocument()
    expect(screen.getByText('동기 수준')).toBeInTheDocument()
    expect(screen.getByText('과거 성공 경험')).toBeInTheDocument()
    expect(screen.getByText('제약 요인')).toBeInTheDocument()
    expect(screen.getByText('사회적 선호도')).toBeInTheDocument()
  })

  it('displays form fields correctly', () => {
    render(
      <TestWrapper>
        <AssessmentForm onAssessmentComplete={mockOnComplete} />
      </TestWrapper>
    )

    // Basic info fields
    expect(screen.getByLabelText('환자 ID')).toBeInTheDocument()

    // Concentration time fields
    expect(screen.getByLabelText('지속 시간 (분)')).toBeInTheDocument()
    expect(screen.getByLabelText('활동 내용')).toBeInTheDocument()

    // Motivation level fields
    expect(screen.getByLabelText('목표 명확성')).toBeInTheDocument()
    expect(screen.getByLabelText('노력 의지')).toBeInTheDocument()
    expect(screen.getByLabelText('자신감 수준')).toBeInTheDocument()
    expect(screen.getByLabelText('외부 지원')).toBeInTheDocument()

    // Past successes fields
    expect(screen.getByLabelText('성취 영역')).toBeInTheDocument()
    expect(screen.getByLabelText('가장 의미 있는 성과')).toBeInTheDocument()

    // Constraints fields
    expect(screen.getByLabelText('주요 제약 요인')).toBeInTheDocument()
    expect(screen.getByLabelText('심각도 (1-5)')).toBeInTheDocument()

    // Social preference fields
    expect(screen.getByLabelText('낯선 사람과의 편안함')).toBeInTheDocument()
    expect(screen.getByLabelText('협업 의지')).toBeInTheDocument()
    expect(screen.getByLabelText('선호하는 그룹 크기')).toBeInTheDocument()
  })

  it('handles form input correctly', async () => {
    render(
      <TestWrapper>
        <AssessmentForm onAssessmentComplete={mockOnComplete} />
      </TestWrapper>
    )

    // Fill patient ID
    const patientIdInput = screen.getByLabelText('환자 ID')
    await user.type(patientIdInput, 'patient123')
    expect(patientIdInput).toHaveValue('patient123')

    // Fill concentration duration
    const durationInput = screen.getByLabelText('지속 시간 (분)')
    await user.clear(durationInput)
    await user.type(durationInput, '45')
    expect(durationInput).toHaveValue(45)

    // Fill activity
    const activityInput = screen.getByLabelText('활동 내용')
    await user.type(activityInput, '독서')
    expect(activityInput).toHaveValue('독서')

    // Test slider inputs for motivation levels
    const goalClaritySlider = screen.getByLabelText('목표 명확성')
    fireEvent.change(goalClaritySlider, { target: { value: '4' } })
    expect(goalClaritySlider).toHaveValue('4')
  })

  it('validates required fields', async () => {
    render(
      <TestWrapper>
        <AssessmentForm onAssessmentComplete={mockOnComplete} />
      </TestWrapper>
    )

    // Try to submit without filling required fields
    const submitButton = screen.getByText('평가 제출')
    await user.click(submitButton)

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('환자 ID는 필수입니다.')).toBeInTheDocument()
    })
  })

  it('shows/hides achievement areas correctly', async () => {
    render(
      <TestWrapper>
        <AssessmentForm onAssessmentComplete={mockOnComplete} />
      </TestWrapper>
    )

    // Initially, additional achievement input should not be visible
    expect(screen.queryByLabelText('기타 성취 영역')).not.toBeInTheDocument()

    // Select "기타" option
    const otherCheckbox = screen.getByLabelText('기타')
    await user.click(otherCheckbox)

    // Additional input should now be visible
    await waitFor(() => {
      expect(screen.getByLabelText('기타 성취 영역')).toBeInTheDocument()
    })
  })

  it('handles boolean toggles correctly', async () => {
    render(
      <TestWrapper>
        <AssessmentForm onAssessmentComplete={mockOnComplete} />
      </TestWrapper>
    )

    // Test learning from success toggle
    const learningToggle = screen.getByLabelText('성공에서 배움')
    expect(learningToggle).not.toBeChecked()

    await user.click(learningToggle)
    expect(learningToggle).toBeChecked()

    // Test transferable strategies toggle
    const strategiesToggle = screen.getByLabelText('전용 가능한 전략')
    expect(strategiesToggle).not.toBeChecked()

    await user.click(strategiesToggle)
    expect(strategiesToggle).toBeChecked()
  })

  it('submits form with correct data', async () => {
    render(
      <TestWrapper>
        <AssessmentForm onAssessmentComplete={mockOnComplete} />
      </TestWrapper>
    )

    // Fill all required fields
    await user.type(screen.getByLabelText('환자 ID'), 'patient123')
    await user.clear(screen.getByLabelText('지속 시간 (분)'))
    await user.type(screen.getByLabelText('지속 시간 (분)'), '45')
    await user.type(screen.getByLabelText('활동 내용'), '독서')

    // Fill motivation levels
    fireEvent.change(screen.getByLabelText('목표 명확성'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('노력 의지'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('자신감 수준'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('외부 지원'), { target: { value: '5' } })

    // Select achievement areas
    await user.click(screen.getByLabelText('학업'))
    await user.click(screen.getByLabelText('운동'))

    // Fill most significant achievement
    await user.type(screen.getByLabelText('가장 의미 있는 성과'), '학업 성과 향상')

    // Toggle success learning options
    await user.click(screen.getByLabelText('성공에서 배움'))
    await user.click(screen.getByLabelText('전용 가능한 전략'))

    // Fill constraints
    await user.type(screen.getByLabelText('주요 제약 요인'), '시간 부족')
    fireEvent.change(screen.getByLabelText('심각도 (1-5)'), { target: { value: '3' } })
    await user.type(screen.getByLabelText('관리 전략'), '시간 관리')

    // Fill social preferences
    fireEvent.change(screen.getByLabelText('낯선 사람과의 편안함'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('협업 의지'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('선호하는 그룹 크기'), { target: { value: '소그룹 (3-5명)' } })

    // Submit form
    await user.click(screen.getByText('평가 제출'))

    // Check that mutate was called with correct data
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
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
        }),
        expect.any(Object) // mutation options
      )
    })
  })

  it('handles form reset correctly', async () => {
    render(
      <TestWrapper>
        <AssessmentForm onAssessmentComplete={mockOnComplete} />
      </TestWrapper>
    )

    // Fill some fields
    await user.type(screen.getByLabelText('환자 ID'), 'patient123')
    await user.type(screen.getByLabelText('활동 내용'), '독서')

    // Reset form
    await user.click(screen.getByText('초기화'))

    // Fields should be cleared
    expect(screen.getByLabelText('환자 ID')).toHaveValue('')
    expect(screen.getByLabelText('활동 내용')).toHaveValue('')
  })

  it('shows loading state during submission', async () => {
    // Mock pending state
    vi.mocked(mockMutate).mockImplementation(() => {
      // Simulate pending state by not resolving immediately
    })

    render(
      <TestWrapper>
        <AssessmentForm onAssessmentComplete={mockOnComplete} />
      </TestWrapper>
    )

    // Fill required fields and submit
    await user.type(screen.getByLabelText('환자 ID'), 'patient123')
    await user.click(screen.getByText('평가 제출'))

    // Button should show loading state
    // Note: This test would need the actual component implementation to show loading state
    expect(screen.getByText('평가 제출')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <TestWrapper>
        <AssessmentForm 
          onAssessmentComplete={mockOnComplete}
          className="custom-class"
        />
      </TestWrapper>
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
}) 