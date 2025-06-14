import React from 'react';

const ColorPicker: React.FC<any> = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="color"
      value={value || '#000000'}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block h-10 w-20"
    />
  </div>
);

export default ColorPicker;
