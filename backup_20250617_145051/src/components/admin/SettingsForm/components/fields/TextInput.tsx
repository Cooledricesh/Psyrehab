import React from 'react';
import { HelpCircle } from 'lucide-react';

interface TextInputProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  required?: boolean;
  help?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const TextInput: React.FC<TextInputProps> = ({
  name,
  label,
  value,
  onChange,
  placeholder,
  description,
  required,
  help,
  icon: Icon
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-4 w-4 text-gray-500" />}
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
          {help && (
            <div className="group relative inline-block">
              <HelpCircle className="h-3 w-3 text-gray-400" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-black text-white text-xs rounded shadow-lg">
                {help}
              </div>
            </div>
          )}
        </div>
      </label>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      <input
        type="text"
        id={name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        required={required}
      />
    </div>
  );
};

export default TextInput;
