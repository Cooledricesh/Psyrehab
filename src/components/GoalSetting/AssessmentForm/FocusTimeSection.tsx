import React from 'react';
import { Brain } from 'lucide-react';
import { FOCUS_TIME_OPTIONS } from '@/utils/GoalSetting/constants';

interface FocusTimeSectionProps {
  value: string;
  onChange: (value: string) => void;
}

const FocusTimeSection: React.FC<FocusTimeSectionProps> = ({ value, onChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
        <div className="flex items-center">
          <div className="bg-blue-500 p-2 rounded-lg mr-3">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900">1. 집중력 & 인지 부담 측정</h3>
        </div>
      </div>
      <div className="p-6">
        <label className="block text-base font-medium text-gray-900 mb-4">
          한 가지 일에 집중할 수 있는 시간은 얼마나 되나요?
        </label>
        <div className="space-y-3">
          {FOCUS_TIME_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="focusTime"
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-900">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FocusTimeSection;