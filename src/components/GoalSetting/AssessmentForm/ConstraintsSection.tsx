import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CONSTRAINT_OPTIONS } from '@/utils/GoalSetting/constants';

interface ConstraintsSectionProps {
  selectedValues: string[];
  otherValue: string;
  onValueChange: (value: string, checked: boolean) => void;
  onOtherChange: (value: string) => void;
}

const ConstraintsSection: React.FC<ConstraintsSectionProps> = ({
  selectedValues,
  otherValue,
  onValueChange,
  onOtherChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
        <div className="flex items-center">
          <div className="bg-orange-500 p-2 rounded-lg mr-3">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-orange-900">4. 환경적 제약 사항</h3>
        </div>
      </div>
      <div className="p-6">
        <label className="block text-base font-medium text-gray-900 mb-4">
          다음 중 목표 실행에 어려움이 될 수 있는 것은? (복수 선택 가능)
        </label>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CONSTRAINT_OPTIONS.map((item) => (
              <label key={item.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(item.value)}
                  onChange={(e) => onValueChange(item.value, e.target.checked)}
                  className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="ml-3 text-gray-900">{item.label}</span>
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <label htmlFor="constraintsOther" className="block text-sm text-gray-600">
              기타 제약사항 (직접 입력)
            </label>
            <input
              id="constraintsOther"
              type="text"
              placeholder="예: 수면 장애, 약물 부작용 등"
              value={otherValue}
              onChange={(e) => onOtherChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstraintsSection;