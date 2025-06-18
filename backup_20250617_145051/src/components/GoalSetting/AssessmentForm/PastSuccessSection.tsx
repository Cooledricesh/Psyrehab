import React from 'react';
import { History } from 'lucide-react';
import { PAST_SUCCESS_OPTIONS } from '@/utils/GoalSetting/constants';

interface PastSuccessSectionProps {
  selectedValues: string[];
  otherValue: string;
  onValueChange: (value: string, checked: boolean) => void;
  onOtherChange: (value: string) => void;
}

const PastSuccessSection: React.FC<PastSuccessSectionProps> = ({
  selectedValues,
  otherValue,
  onValueChange,
  onOtherChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
        <div className="flex items-center">
          <div className="bg-purple-500 p-2 rounded-lg mr-3">
            <History className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-purple-900">3. 과거 성공 경험 탐색</h3>
        </div>
      </div>
      <div className="p-6">
        <label className="block text-base font-medium text-gray-900 mb-4">
          예전에 꾸준히 잘 했던 일이나 좋아했던 활동이 있나요? (복수 선택 가능)
        </label>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PAST_SUCCESS_OPTIONS.map((item) => (
              <label key={item.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(item.value)}
                  onChange={(e) => onValueChange(item.value, e.target.checked)}
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-3 text-gray-900">{item.label}</span>
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-gray-600">
              기타 성공 경험이 있다면 적어주세요
            </label>
            <textarea
              placeholder="예: 특별한 취미나 활동, 자격증 취득 등"
              value={otherValue}
              onChange={(e) => onOtherChange(e.target.value)}
              className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PastSuccessSection;