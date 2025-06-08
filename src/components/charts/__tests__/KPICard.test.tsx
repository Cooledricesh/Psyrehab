import { render, screen } from '@testing-library/react';
import { KPICard } from '../KPICard';
import '@testing-library/jest-dom';

describe('KPICard', () => {
  const defaultProps = {
    title: 'Test Metric',
    value: 100,
  };

  it('renders basic KPI card correctly', () => {
    render(<KPICard {...defaultProps} />);
    
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders with prefix and suffix', () => {
    render(
      <KPICard 
        {...defaultProps} 
        prefix="$" 
        suffix=" USD" 
      />
    );
    
    expect(screen.getByText('$100 USD')).toBeInTheDocument();
  });

  it('shows trend indicators correctly', () => {
    const { rerender } = render(
      <KPICard 
        {...defaultProps} 
        trend="up"
        trendValue={15}
      />
    );
    
    expect(screen.getByText('15%')).toBeInTheDocument();
    
    // Test down trend
    rerender(
      <KPICard 
        {...defaultProps} 
        trend="down"
        trendValue={8}
      />
    );
    
    expect(screen.getByText('8%')).toBeInTheDocument();
  });

  it('calculates trend from previous value', () => {
    render(
      <KPICard 
        {...defaultProps} 
        value={120}
        previousValue={100}
      />
    );
    
    // Should calculate 20% increase
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('applies different color themes', () => {
    const { container } = render(
      <KPICard 
        {...defaultProps} 
        color="green"
      />
    );
    
    expect(container.firstChild).toHaveClass('border-green-200');
  });

  it('applies different sizes', () => {
    const { container } = render(
      <KPICard 
        {...defaultProps} 
        size="lg"
      />
    );
    
    expect(container.querySelector('h3')).toHaveClass('text-base');
  });

  it('shows loading state', () => {
    render(
      <KPICard 
        {...defaultProps} 
        loading={true}
      />
    );
    
    expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
  });

  it('uses custom format function', () => {
    const formatValue = (value: number | string) => `Custom: ${value}`;
    
    render(
      <KPICard 
        {...defaultProps} 
        formatValue={formatValue}
      />
    );
    
    expect(screen.getByText('Custom: 100')).toBeInTheDocument();
  });

  it('handles string values', () => {
    render(
      <KPICard 
        {...defaultProps} 
        value="Active"
      />
    );
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">📊</span>;
    
    render(
      <KPICard 
        {...defaultProps} 
        icon={<TestIcon />}
      />
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
}); 