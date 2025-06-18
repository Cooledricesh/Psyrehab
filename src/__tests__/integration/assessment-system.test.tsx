import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import AssessmentsPage from '@/app/assessments/page'
import { AssessmentData } from '@/types/assessment'
import { Patient } from '@/types/database'

// Mock data
const mockAssessments: AssessmentData[] = [
  {
    id: 'assessment-1',
    patient_id: 'patient1',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    concentration_time: { duration: 45, activity: '독서' },
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
  },
  {
    id: 'assessment-2',
    patient_id: 'patient2',
    created_at: '2024-01-15T14:30:00Z',
    updated_at: '2024-01-15T14:30:00Z',
    concentration_time: { duration: 60, activity: '프로젝트 작업' },
    motivation_level: {
      goal_clarity: 5,
      effort_willingness: 4,
      confidence_level: 3,
      external_support: 4
    },
    past_successes: {
      achievement_areas: ['창의성', '문제해결'],
      most_significant_achievement: '혁신적 프로젝트 완성',
      learning_from_success: true,
      transferable_strategies: false
    },
    constraints: {
      primary_factors: ['기술적 한계'],
      severity_rating: 2,
      management_strategies: ['기술 학습', '멘토링']
    },
    social_preference: {
      comfort_with_strangers: 4,
      collaboration_willingness: 5,
      preferred_group_size: '중그룹 (6-10명)'
    }
  }
]


// Mock the hooks
vi.mock('@/hooks/useAssessments', () => ({
  useAssessments: () => ({
    data: mockAssessments,
    isLoading: false,
    error: null
  }),
  useAssessment: (id: string) => ({
    data: mockAssessments.find(a => a.id === id) || null,
    isLoading: false,
    error: null
  }),
  useCreateAssessment: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null
  })
}))

// Mock the visualization components to avoid canvas/chart rendering issues
interface MockDashboardProps {
  assessments: AssessmentData[]
  patients: Patient[]
  className?: string
}

vi.mock('@/components/assessments/visualization/AssessmentDashboard', () => ({
  AssessmentDashboard: ({ assessments, patients, className }: MockDashboardProps) => (
    <div className={className} data-testid="assessment-dashboard">
      <h2>Assessment Dashboard</h2>
      <p>Assessments: {assessments.length}</p>
      <p>Patients: {patients.length}</p>
    </div>
  )
}))

interface MockComparisonProps {
  assessments: AssessmentData[]
  patients: Patient[]
  className?: string
}

vi.mock('@/components/assessments/comparison/ComparisonManager', () => ({
  ComparisonManager: ({ assessments, patients, className }: MockComparisonProps) => (
    <div className={className} data-testid="comparison-manager">
      <h2>Comparison Manager</h2>
      <p>Assessments: {assessments.length}</p>
      <p>Patients: {patients.length}</p>
    </div>
  )
}))

interface MockAssessmentFormProps {
  onAssessmentComplete: (assessmentId: string) => void
  className?: string
}

vi.mock('@/components/assessments/AssessmentForm', () => ({
  AssessmentForm: ({ onAssessmentComplete, className }: MockAssessmentFormProps) => (
    <div className={className} data-testid="assessment-form">
      <h2>Assessment Form</h2>
      <button 
        onClick={() => onAssessmentComplete('new-assessment-id')}
        data-testid="submit-assessment"
      >
        Submit Assessment
      </button>
    </div>
  )
}))

interface MockAssessmentResultsProps {
  assessmentId: string
  onNavigateToHistory: () => void
  className?: string
}

vi.mock('@/components/assessments/AssessmentResults', () => ({
  AssessmentResults: ({ assessmentId, onNavigateToHistory, className }: MockAssessmentResultsProps) => (
    <div className={className} data-testid="assessment-results">
      <h2>Assessment Results</h2>
      <p>Assessment ID: {assessmentId}</p>
      <button 
        onClick={onNavigateToHistory}
        data-testid="navigate-to-history"
      >
        View History
      </button>
    </div>
  )
}))

interface MockAssessmentHistoryProps {
  onAssessmentSelect: (assessmentId: string) => void
  className?: string
}

vi.mock('@/components/assessments/AssessmentHistory', () => ({
  AssessmentHistory: ({ onAssessmentSelect, className }: MockAssessmentHistoryProps) => (
    <div className={className} data-testid="assessment-history">
      <h2>Assessment History</h2>
      {mockAssessments.map(assessment => (
        <button
          key={assessment.id}
          onClick={() => onAssessmentSelect(assessment.id!)}
          data-testid={`select-assessment-${assessment.id}`}
        >
          Assessment {assessment.id}
        </button>
      ))}
    </div>
  )
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

describe('Assessment System Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  it('renders the main assessment page with all tabs', async () => {
    render(
      <TestWrapper>
        <AssessmentsPage />
      </TestWrapper>
    )

    // Check main header
    expect(screen.getByText('평가 시스템')).toBeInTheDocument()
    expect(screen.getByText('종합적인 평가 관리 및 분석 도구')).toBeInTheDocument()

    // Check statistics in header
    expect(screen.getByText('총 평가:')).toBeInTheDocument()
    expect(screen.getByText('2개')).toBeInTheDocument()
    expect(screen.getByText('환자:')).toBeInTheDocument()
    expect(screen.getByText('4명')).toBeInTheDocument()

    // Check all tabs are present
    expect(screen.getByText('평가 작성')).toBeInTheDocument()
    expect(screen.getByText('결과 확인')).toBeInTheDocument()
    expect(screen.getByText('평가 이력')).toBeInTheDocument()
    expect(screen.getByText('대시보드')).toBeInTheDocument()
    expect(screen.getByText('비교 분석')).toBeInTheDocument()

    // Check initial tab description
    expect(screen.getByText('새로운 평가를 작성합니다')).toBeInTheDocument()

    // Check assessment form is rendered by default
    expect(screen.getByTestId('assessment-form')).toBeInTheDocument()
  })

  it('navigates between tabs correctly', async () => {
    render(
      <TestWrapper>
        <AssessmentsPage />
      </TestWrapper>
    )

    // Initially on assessment tab
    expect(screen.getByTestId('assessment-form')).toBeInTheDocument()
    expect(screen.getByText('새로운 평가를 작성합니다')).toBeInTheDocument()

    // Navigate to history tab
    await user.click(screen.getByText('평가 이력'))
    await waitFor(() => {
      expect(screen.getByTestId('assessment-history')).toBeInTheDocument()
      expect(screen.getByText('과거 평가 기록을 관리합니다')).toBeInTheDocument()
    })

    // Navigate to dashboard tab
    await user.click(screen.getByText('대시보드'))
    await waitFor(() => {
      expect(screen.getByTestId('assessment-dashboard')).toBeInTheDocument()
      expect(screen.getByText('종합 분석 및 시각화')).toBeInTheDocument()
    })

    // Navigate to comparison tab
    await user.click(screen.getByText('비교 분석'))
    await waitFor(() => {
      expect(screen.getByTestId('comparison-manager')).toBeInTheDocument()
      expect(screen.getByText('평가 결과 비교 및 통계 분석')).toBeInTheDocument()
    })

    // Navigate to results tab (should show empty state initially)
    await user.click(screen.getByText('결과 확인'))
    await waitFor(() => {
      expect(screen.getByText('평가 결과를 확인하려면')).toBeInTheDocument()
      expect(screen.getByText('새로운 평가를 작성하거나 이력에서 기존 평가를 선택해주세요.')).toBeInTheDocument()
    })
  })

  it('handles assessment workflow correctly', async () => {
    render(
      <TestWrapper>
        <AssessmentsPage />
      </TestWrapper>
    )

    // Start on assessment form
    expect(screen.getByTestId('assessment-form')).toBeInTheDocument()

    // Submit assessment (mock)
    await user.click(screen.getByTestId('submit-assessment'))

    // Should navigate to results tab
    await waitFor(() => {
      expect(screen.getByTestId('assessment-results')).toBeInTheDocument()
      expect(screen.getByText('Assessment ID: new-assessment-id')).toBeInTheDocument()
    })

    // Navigate to history from results
    await user.click(screen.getByTestId('navigate-to-history'))
    await waitFor(() => {
      expect(screen.getByTestId('assessment-history')).toBeInTheDocument()
    })
  })

  it('handles assessment selection from history', async () => {
    render(
      <TestWrapper>
        <AssessmentsPage />
      </TestWrapper>
    )

    // Navigate to history
    await user.click(screen.getByText('평가 이력'))
    await waitFor(() => {
      expect(screen.getByTestId('assessment-history')).toBeInTheDocument()
    })

    // Select an assessment
    await user.click(screen.getByTestId('select-assessment-assessment-1'))

    // Should navigate to results tab with selected assessment
    await waitFor(() => {
      expect(screen.getByTestId('assessment-results')).toBeInTheDocument()
      expect(screen.getByText('Assessment ID: assessment-1')).toBeInTheDocument()
    })
  })

  it('displays correct data in dashboard and comparison components', async () => {
    render(
      <TestWrapper>
        <AssessmentsPage />
      </TestWrapper>
    )

    // Check dashboard
    await user.click(screen.getByText('대시보드'))
    await waitFor(() => {
      const dashboard = screen.getByTestId('assessment-dashboard')
      expect(within(dashboard).getByText('Assessments: 2')).toBeInTheDocument()
      expect(within(dashboard).getByText('Patients: 4')).toBeInTheDocument()
    })

    // Check comparison manager
    await user.click(screen.getByText('비교 분석'))
    await waitFor(() => {
      const comparison = screen.getByTestId('comparison-manager')
      expect(within(comparison).getByText('Assessments: 2')).toBeInTheDocument()
      expect(within(comparison).getByText('Patients: 4')).toBeInTheDocument()
    })
  })

  it('shows empty state correctly when no assessment is selected', async () => {
    render(
      <TestWrapper>
        <AssessmentsPage />
      </TestWrapper>
    )

    // Navigate to results tab
    await user.click(screen.getByText('결과 확인'))

    // Should show empty state
    expect(screen.getByText('평가 결과를 확인하려면')).toBeInTheDocument()
    expect(screen.getByText('새로운 평가를 작성하거나 이력에서 기존 평가를 선택해주세요.')).toBeInTheDocument()

    // Test navigation buttons in empty state
    const newAssessmentButton = screen.getByText('새 평가 작성')
    const historyButton = screen.getByText('평가 이력 보기')

    expect(newAssessmentButton).toBeInTheDocument()
    expect(historyButton).toBeInTheDocument()

    // Test new assessment button
    await user.click(newAssessmentButton)
    await waitFor(() => {
      expect(screen.getByTestId('assessment-form')).toBeInTheDocument()
    })

    // Navigate back to results and test history button
    await user.click(screen.getByText('결과 확인'))
    await user.click(historyButton)
    await waitFor(() => {
      expect(screen.getByTestId('assessment-history')).toBeInTheDocument()
    })
  })

  it('maintains active tab state correctly', async () => {
    render(
      <TestWrapper>
        <AssessmentsPage />
      </TestWrapper>
    )

    // Check initial active state
    const assessmentTab = screen.getByText('평가 작성')
    expect(assessmentTab.closest('button')).toHaveClass('border-blue-500', 'text-blue-600', 'bg-blue-50')

    // Navigate to dashboard
    const dashboardTab = screen.getByText('대시보드')
    await user.click(dashboardTab)

    await waitFor(() => {
      expect(dashboardTab.closest('button')).toHaveClass('border-blue-500', 'text-blue-600', 'bg-blue-50')
      expect(assessmentTab.closest('button')).not.toHaveClass('border-blue-500', 'text-blue-600', 'bg-blue-50')
    })
  })

  it('displays help footer correctly', () => {
    render(
      <TestWrapper>
        <AssessmentsPage />
      </TestWrapper>
    )

    expect(screen.getByText('도움이 필요하신가요?')).toBeInTheDocument()
    expect(screen.getByText(/각 탭을 선택하여 다양한 기능을 이용하실 수 있습니다/)).toBeInTheDocument()
  })
})

describe('Assessment System Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles loading state correctly', () => {
    // Mock loading state
    vi.doMock('@/hooks/useAssessments', () => ({
      useAssessments: () => ({
        data: [],
        isLoading: true,
        error: null
      })
    }))

    render(
      <TestWrapper>
        <AssessmentsPage />
      </TestWrapper>
    )

    expect(screen.getByText('데이터를 불러오는 중...')).toBeInTheDocument()
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument() // Loading spinner
  })

  it('handles error state correctly', () => {
    // Mock error state
    vi.doMock('@/hooks/useAssessments', () => ({
      useAssessments: () => ({
        data: [],
        isLoading: false,
        error: new Error('Failed to load data')
      })
    }))

    render(
      <TestWrapper>
        <AssessmentsPage />
      </TestWrapper>
    )

    expect(screen.getByText('데이터 로딩 오류')).toBeInTheDocument()
    expect(screen.getByText('평가 데이터를 불러오는 중 문제가 발생했습니다.')).toBeInTheDocument()
    expect(screen.getByText('다시 시도')).toBeInTheDocument()
  })
}) 