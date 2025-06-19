import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '../SearchBar';
import '@testing-library/jest-dom';

describe('SearchBar', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  const mockSuggestions = [
    { id: '1', title: '김영희', subtitle: '환자', category: '환자' },
    { id: '2', title: '인지 훈련', subtitle: '목표 유형', category: '목표' },
    { id: '3', title: '사회 기술', subtitle: '목표 유형', category: '목표' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input correctly', () => {
    render(<SearchBar {...defaultProps} />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('검색...')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    
    render(<SearchBar {...defaultProps} onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test');
    
    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('shows suggestions when focused and has value', async () => {
    const user = userEvent.setup();
    
    render(
      <SearchBar 
        {...defaultProps}
        value="김"
        suggestions={mockSuggestions}
      />
    );
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    expect(screen.getByText('김영희')).toBeInTheDocument();
    expect(screen.getByText('환자')).toBeInTheDocument();
  });

  it('filters suggestions based on input value', async () => {
    const user = userEvent.setup();
    
    render(
      <SearchBar 
        {...defaultProps}
        value="인지"
        suggestions={mockSuggestions}
      />
    );
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    expect(screen.getByText('인지 훈련')).toBeInTheDocument();
    expect(screen.queryByText('김영희')).not.toBeInTheDocument();
  });

  it('calls onSearch when suggestion is clicked', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    
    render(
      <SearchBar 
        {...defaultProps}
        value="김"
        suggestions={mockSuggestions}
        onSearch={onSearch}
      />
    );
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    const suggestion = screen.getByText('김영희');
    await user.click(suggestion);
    
    expect(onSearch).toHaveBeenCalledWith('김영희');
  });

  it('shows clear button when has value', () => {
    render(<SearchBar {...defaultProps} value="test" />);
    
    expect(screen.getByLabelText('검색어 지우기')).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    
    render(<SearchBar {...defaultProps} value="test" onChange={onChange} />);
    
    const clearButton = screen.getByLabelText('검색어 지우기');
    await user.click(clearButton);
    
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('calls onSearch when Enter is pressed', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    
    render(<SearchBar {...defaultProps} value="test" onSearch={onSearch} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, '{Enter}');
    
    expect(onSearch).toHaveBeenCalledWith('test');
  });

  it('closes suggestions when Escape is pressed', async () => {
    const user = userEvent.setup();
    
    render(
      <SearchBar 
        {...defaultProps}
        value="김"
        suggestions={mockSuggestions}
      />
    );
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    expect(screen.getByText('김영희')).toBeInTheDocument();
    
    await user.type(input, '{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByText('김영희')).not.toBeInTheDocument();
    });
  });

  it('debounces onSearch calls', async () => {
    const onSearch = jest.fn();
    
    render(
      <SearchBar 
        {...defaultProps}
        value="test"
        onSearch={onSearch}
        debounceMs={100}
      />
    );
    
    // onSearch should be called after debounce delay
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('test');
    }, { timeout: 200 });
  });

  it('disables input when disabled prop is true', () => {
    render(<SearchBar {...defaultProps} disabled={true} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(screen.queryByLabelText('검색어 지우기')).not.toBeInTheDocument();
  });
}); 