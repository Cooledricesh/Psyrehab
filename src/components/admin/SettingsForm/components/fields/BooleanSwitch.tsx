import React from 'react';

interface BooleanSwitchProps {
  name: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const BooleanSwitch: React.FC<BooleanSwitchProps> = ({
  name,
  label,
  value,
  onChange,
  description,
  icon: Icon
}) => {
  return (
    <div className="flex items-center justify-between space-x-3">
      <div className="flex-1">
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          <div className="flex items-center space-x-2">
            {Icon && <Icon className="h-4 w-4 text-gray-500" />}
            <span>{label}</span>
          </div>
        </label>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
          border-2 border-transparent transition-colors duration-200 ease-in-out 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${value ? 'bg-blue-600' : 'bg-gray-200'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full 
            bg-white shadow ring-0 transition duration-200 ease-in-out
            ${value ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

export default BooleanSwitch;
