import React from 'react';
import { Target } from 'lucide-react';
import { getMotivationText } from '@/utils/GoalSetting/helpers';

interface MotivationSectionProps {
  value: number;
  onChange: (value: number) => void;
}

const MotivationSection: React.FC<MotivationSectionProps> = ({ value, onChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-green-50 px-6 py-4 border-b border-green-100">
        <div className="flex items-center">
          <div className="bg-green-500 p-2 rounded-lg mr-3">
            <Target className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-green-900">2. 변화 동기 & 의지 수준</h3>
        </div>
      </div>
      <div className="p-6">
        <label className="block text-base font-medium text-gray-900 mb-4">
          지금 새로운 것을 시작하고 싶은 마음이 얼마나 되나요?
        </label>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">별로 없음</span>
            <span className="font-medium text-lg">{value}점</span>
            <span className="text-sm text-gray-600">매우 많음</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
          <p className="text-center text-gray-600 italic">
            "{getMotivationText(value)}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default MotivationSection;