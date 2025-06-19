import React from 'react';
import { Brain, Check } from 'lucide-react';

interface RecommendationCardProps {
  plan: unknown;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  parseAIResponse: (response: string) => any;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  plan,
  index,
  isSelected,
  onSelect,
  parseAIResponse
}) => {
  const parsedPlan = parseAIResponse(plan);

  return (
    <div
      className={`border rounded-lg p-6 cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg mr-3 ${
            isSelected ? 'bg-blue-500' : 'bg-gray-400'
          }`}>
            <Brain className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            추천 계획 {index + 1}
          </h3>
        </div>
        {isSelected && (
          <div className="bg-blue-500 p-1 rounded-full">
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* 6개월 목표 */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">6개월 목표</h4>
        <div className="space-y-2">
          {parsedPlan.sixMonthGoals?.map((goal: unknown, idx: number) => (
            <div key={idx} className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span className="text-sm text-gray-600">{goal.goal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 핵심 전략 */}
      {parsedPlan.coreStrategy && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">핵심 전략</h4>
          <p className="text-sm text-gray-600">{parsedPlan.coreStrategy}</p>
        </div>
      )}

      {/* 월간 계획 미리보기 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">월간 계획 미리보기</h4>
        <div className="space-y-1">
          {parsedPlan.monthlyPlans?.slice(0, 3).map((month: unknown, idx: number) => (
            <div key={idx} className="text-sm text-gray-600">
              <span className="font-medium">{idx + 1}개월차:</span> {month.goal}
            </div>
          ))}
          {parsedPlan.monthlyPlans?.length > 3 && (
            <p className="text-sm text-gray-500 italic">... 외 {parsedPlan.monthlyPlans.length - 3}개 더</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
