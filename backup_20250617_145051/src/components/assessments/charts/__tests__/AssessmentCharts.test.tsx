import { render, screen } from '@testing-library/react'
import { AssessmentScoreChart } from '../AssessmentScoreChart'
import { AssessmentTrendChart } from '../AssessmentTrendChart'
import { AssessmentComparisonChart } from '../AssessmentComparisonChart'
import { AssessmentDashboard } from '../AssessmentDashboard'
import { AssessmentData } from '@/types/assessment'

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Radar: () => <div data-testid="radar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
}))

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="trending-up" />,
  TrendingDown: () => <div data-testid="trending-down" />,
  Award: () => <div data-testid="award" />,
  Users: () => <div data-testid="users" />,
  Calendar: () => <div data-testid="calendar" />,
  BarChart3: () => <div data-testid="bar-chart3" />,
  Target: () => <div data-testid="target" />,
  ArrowUpDown: () => <div data-testid="arrow-up-down" />,
  ChevronDown: () => <div data-testid="chevron-down" />,
}))

// Sample test data
const mockAssessmentData: AssessmentData = {
  id: '1',
  patient_id: 'patient-1',
  session_id: 'session-1',
  concentration_time: { duration: 120, interruptions: 2 },
  motivation_level: {
    goal_clarity: 4,
    effort_willingness: 3,
    confidence_level: 4,
    external_support: 5
  },
  past_successes: {
    achievement_areas: ['학습', '관계'],
    most_significant_achievement: '프로젝트 완성',
    learning_from_success: true,
    transferable_strategies: true
  },
  constraints: { severity_rating: 2 },
  social_preference: {
    comfort_with_strangers: 3,
    collaboration_willingness: 4
  },
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
}

const mockPreviousAssessment: AssessmentData = {
  ...mockAssessmentData,
  id: '2',
  concentration_time: { duration: 90, interruptions: 3 },
  motivation_level: {
    goal_clarity: 3,
    effort_willingness: 3,
    confidence_level: 3,
    external_support: 4
  },
  created_at: '2024-01-10T10:00:00Z'
}

describe('AssessmentScoreChart', () => {
  it('renders radar chart with assessment data', () => {
    render(<AssessmentScoreChart data={mockAssessmentData} />)
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
    expect(screen.getByText('평가 점수')).toBeInTheDocument()
  })

  it('renders comparison with previous assessment', () => {
    render(
      <AssessmentScoreChart 
        data={mockAssessmentData} 
        previousData={mockPreviousAssessment}
      />
    )
    
    expect(screen.getByText('평가 점수 비교')).toBeInTheDocument()
    expect(screen.getByText('현재')).toBeInTheDocument()
    expect(screen.getByText('이전')).toBeInTheDocument()
  })

  it('displays score range indicators', () => {
    render(<AssessmentScoreChart data={mockAssessmentData} />)
    
    expect(screen.getByText('우수 (4.0-5.0)')).toBeInTheDocument()
    expect(screen.getByText('좋음 (3.0-3.9)')).toBeInTheDocument()
    expect(screen.getByText('보통 (2.0-2.9)')).toBeInTheDocument()
    expect(screen.getByText('개선필요 (1.0-1.9)')).toBeInTheDocument()
  })

  it('handles different chart sizes', () => {
    const { rerender } = render(<AssessmentScoreChart data={mockAssessmentData} size="small" />)
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    
    rerender(<AssessmentScoreChart data={mockAssessmentData} size="large" />)
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
})

describe('AssessmentTrendChart', () => {
  const mockTrendData = [mockPreviousAssessment, mockAssessmentData]

  it('renders line chart with trend data', () => {
    render(<AssessmentTrendChart data={mockTrendData} />)
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByText('평가 점수 추이')).toBeInTheDocument()
  })

  it('displays summary statistics', () => {
    render(<AssessmentTrendChart data={mockTrendData} />)
    
    expect(screen.getByText('평가 횟수')).toBeInTheDocument()
    expect(screen.getByText('최고 점수')).toBeInTheDocument()
    expect(screen.getByText('평균 점수')).toBeInTheDocument()
    expect(screen.getByText('최근 점수')).toBeInTheDocument()
  })

  it('shows improvement indicators', () => {
    render(<AssessmentTrendChart data={mockTrendData} />)
    
    // Should show trending up or down icons based on data
    expect(screen.getByTestId('trending-up') || screen.getByTestId('trending-down')).toBeInTheDocument()
  })

  it('handles empty data', () => {
    render(<AssessmentTrendChart data={[]} />)
    
    expect(screen.getByText('평가 데이터가 없습니다')).toBeInTheDocument()
  })
})

describe('AssessmentComparisonChart', () => {
  const mockComparisonData = [
    { name: '환자 A', assessments: [mockAssessmentData] },
    { name: '환자 B', assessments: [mockPreviousAssessment] }
  ]

  it('renders bar chart with comparison data', () => {
    render(<AssessmentComparisonChart data={mockComparisonData} />)
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByText('환자별 평가 점수 비교')).toBeInTheDocument()
  })

  it('displays ranking indicators', () => {
    render(<AssessmentComparisonChart data={mockComparisonData} />)
    
    expect(screen.getByText('순위')).toBeInTheDocument()
    // Should show medal icons for top performers
    expect(screen.getByTestId('award')).toBeInTheDocument()
  })

  it('shows patient statistics', () => {
    render(<AssessmentComparisonChart data={mockComparisonData} />)
    
    expect(screen.getByText('환자 수')).toBeInTheDocument()
    expect(screen.getByText('평균 대비')).toBeInTheDocument()
  })

  it('handles empty comparison data', () => {
    render(<AssessmentComparisonChart data={[]} />)
    
    expect(screen.getByText('비교할 데이터가 없습니다')).toBeInTheDocument()
  })
})

describe('AssessmentDashboard', () => {
  it('renders overview mode by default', () => {
    render(<AssessmentDashboard patientId="patient-1" />)
    
    expect(screen.getByText('평가 대시보드')).toBeInTheDocument()
    expect(screen.getByText('개요')).toBeInTheDocument()
  })

  it('switches between view modes', () => {
    render(<AssessmentDashboard patientId="patient-1" />)
    
    // View mode buttons should be present
    expect(screen.getByText('개요')).toBeInTheDocument()
    expect(screen.getByText('추이')).toBeInTheDocument()
    expect(screen.getByText('비교')).toBeInTheDocument()
    expect(screen.getByText('상세')).toBeInTheDocument()
  })

  it('provides chart size controls', () => {
    render(<AssessmentDashboard patientId="patient-1" />)
    
    expect(screen.getByTestId('arrow-up-down')).toBeInTheDocument()
    expect(screen.getByTestId('chevron-down')).toBeInTheDocument()
  })

  it('handles patient statistics display', () => {
    render(<AssessmentDashboard patientId="patient-1" />)
    
    expect(screen.getByText('환자 통계')).toBeInTheDocument()
  })

  it('shows improvement recommendations section', () => {
    render(<AssessmentDashboard patientId="patient-1" />)
    
    expect(screen.getByText('개선 제안')).toBeInTheDocument()
  })
}) 