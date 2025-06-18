import React from 'react';
import { Users } from 'lucide-react';
import { SOCIAL_PREFERENCE_OPTIONS } from '@/utils/GoalSetting/constants';

interface SocialPreferenceSectionProps {
  value: string;
  onChange: (value: string) => void;
}

const SocialPreferenceSection: React.FC<SocialPreferenceSectionProps> = ({ value, onChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
        <div className="flex items-center">
          <div className="bg-indigo-500 p-2 rounded-lg mr-3">
            <Users className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-indigo-900">5. 사회적 활동 선호도</h3>
        </div>
      </div>
      <div className="p-6">
        <label className="block text-base font-medium text-gray-900 mb-4">
          사람들과 함께 하는 활동에 대해 어떻게 생각하세요?
        </label>
        <div className="space-y-3">
          {SOCIAL_PREFERENCE_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="socialPreference"
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="ml-3 text-gray-900">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialPreferenceSection;