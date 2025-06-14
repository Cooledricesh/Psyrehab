import React from 'react';
import { Check } from 'lucide-react';

interface GoalDetailViewProps {
  detailedGoals: any;
  viewMode: 'monthly' | 'weekly';
  onViewModeChange: (mode: 'monthly' | 'weekly') => void;
}

const GoalDetailView: React.FC<GoalDetailViewProps> = ({
  detailedGoals,
  viewMode,
  onViewModeChange
}) => {
  if (!detailedGoals) return null;

  return (
    <>
      {/* 6개월 목표 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <div className="bg-blue-500 p-2 rounded-lg mr-4">
            <Check className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">6개월 목표</h3>
            <p className="text-gray-700">
              {detailedGoals.sixMonthGoal?.goal || '목표 없음'}
            </p>
            {detailedGoals.sixMonthGoal?.details && (
              <p className="text-sm text-gray-600 mt-2">
                {detailedGoals.sixMonthGoal.details}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 월간/주간 목표 뷰 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">세부 목표</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              월간 목표
            </button>
            <button
              onClick={() => onViewModeChange('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              주간 목표
            </button>
          </div>
        </div>

        {/* 월간 목표 뷰 */}
        {viewMode === 'monthly' && (
          <div className="space-y-4">
            {detailedGoals.monthlyGoals?.map((monthly: any, index: number) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{index + 1}개월차</h4>
                <p className="text-gray-700">{monthly.goal}</p>
                {monthly.activities && monthly.activities.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-600 mb-1">주요 활동:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {monthly.activities.map((activity: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 주간 목표 뷰 */}
        {viewMode === 'weekly' && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {detailedGoals.weeklyGoals?.map((weekly: any, index: number) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{weekly.week}주차</h4>
                <p className="text-gray-700">{weekly.plan}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default GoalDetailView;
