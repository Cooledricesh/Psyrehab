import React from 'react';

interface Option {
  label: string;
  value: string | number;
}

interface MultiSelectInputProps {
  label: string;
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  options: Option[];
}

const MultiSelectInput: React.FC<MultiSelectInputProps> = ({ label, value = [], onChange, options = [] }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="space-y-2">
      {options.map((option: Option) => (
        <label key={option.value} className="flex items-center">
          <input
            type="checkbox"
            checked={value.includes(option.value)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...value, option.value]);
              } else {
                onChange(value.filter((v: string | number) => v !== option.value));
              }
            }}
            className="mr-2"
          />
          {option.label}
        </label>
      ))}
    </div>
  </div>
);

export default MultiSelectInput;
