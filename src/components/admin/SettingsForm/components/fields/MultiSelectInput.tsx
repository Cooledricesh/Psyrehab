import React from 'react';

const MultiSelectInput: React.FC<any> = ({ label, value = [], onChange, options = [] }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="space-y-2">
      {options.map((option: any) => (
        <label key={option.value} className="flex items-center">
          <input
            type="checkbox"
            checked={value.includes(option.value)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...value, option.value]);
              } else {
                onChange(value.filter((v: any) => v !== option.value));
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
