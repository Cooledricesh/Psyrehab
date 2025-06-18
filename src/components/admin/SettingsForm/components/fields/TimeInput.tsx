import React from 'react';

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const TimeInput: React.FC<TimeInputProps> = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="time"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
    />
  </div>
);

export default TimeInput;
