import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
}

export interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  suggestions?: SearchSuggestion[];
  showSuggestions?: boolean;
  debounceMs?: number;
  disabled?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = '검색...',
  value,
  onChange,
  onSearch,
  suggestions = [],
  showSuggestions = true,
  debounceMs = 300,
  disabled = false,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search value
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      if (onSearch && value !== debouncedValue) {
        onSearch(value);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, debounceMs, onSearch, debouncedValue]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
    if (onSearch) {
      onSearch('');
    }
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.title);
    if (onSearch) {
      onSearch(suggestion.title);
    }
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onSearch) {
        onSearch(value);
      }
      setIsFocused(false);
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.title.toLowerCase().includes(value.toLowerCase()) ||
    (suggestion.subtitle && suggestion.subtitle.toLowerCase().includes(value.toLowerCase()))
  );

  const showSuggestionsDropdown = 
    showSuggestions && 
    isFocused && 
    value.length > 0 && 
    filteredSuggestions.length > 0;

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className={`
        flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2
        transition-all duration-200
        ${isFocused ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' : 'hover:border-gray-400'}
        ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
      `}>
        <Search 
          size={20} 
          className={`mr-3 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} 
        />
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            flex-1 outline-none bg-transparent
            ${disabled ? 'cursor-not-allowed text-gray-400' : 'text-gray-900'}
            placeholder-gray-500
          `}
        />
        
        {value && !disabled && (
          <button
            onClick={handleClear}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="검색어 지우기"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`
                w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors
                ${index > 0 ? 'border-t border-gray-100' : ''}
                focus:bg-gray-50 focus:outline-none
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {suggestion.title}
                  </div>
                  {suggestion.subtitle && (
                    <div className="text-sm text-gray-500 mt-1">
                      {suggestion.subtitle}
                    </div>
                  )}
                </div>
                {suggestion.category && (
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    {suggestion.category}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 