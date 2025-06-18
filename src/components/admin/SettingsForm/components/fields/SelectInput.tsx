import React from 'react';

interface SelectInputProps {
  name: string;
  label: string;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  options: { label: string; value: string | number | boolean }[];
  description?: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

const SelectInput: React.FC<SelectInputProps> = ({
  name,
  label,
  value,
  onChange,
  options,
  description,
  required,
  icon: Icon
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-4 w-4 text-gray-500" />}
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </div>
      </label>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      <select
        id={name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        required={required}
      >
        <option value="">선택하세요</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectInput;
