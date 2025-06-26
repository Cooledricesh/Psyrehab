import React from 'react';
import { Target, Loader2 } from 'lucide-react';

interface GoalDetailViewProps {
  detailedGoals: unknown;
  viewMode: 'monthly' | 'weekly';
  onViewModeChange: (mode: 'monthly' | 'weekly') => void;
  onBack: () => void;
  onSave: () => void;
  onReset: () => void;
  onNewGoal?: () => void;
  isProcessing: boolean;
}

const GoalDetailView: React.FC<GoalDetailViewProps> = ({
  detailedGoals,
  viewMode,
  onViewModeChange,
  onBack,
  onSave,
  onReset,
  onNewGoal,
  isProcessing,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          선택한 목표의 계층적 구조가 생성되었습니다.
        </h3>
        <p className="text-center text-gray-600 text-sm">
          목표 {(detailedGoals.selectedIndex || 0) + 1}: {detailedGoals.sixMonthGoal.title}
        </p>
      </div>

      {/* 6개월 전체 목표 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
            <Target className="h-4 w-4 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900">6개월 전체 목표</h4>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 mb-2">{detailedGoals.sixMonthGoal.title}</h5>
          <div className="text-blue-800 text-sm">
            <p className="font-medium mb-1">6개월 목표:</p>
            <p>{detailedGoals.sixMonthGoal.sixMonthGoal || detailedGoals.sixMonthGoal.goal}</p>
            <p className="mt-2">목적: {detailedGoals.sixMonthGoal.purpose}</p>
          </div>
        </div>
      </div>

      {/* 탭 형태의 월간/주간 목표 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => onViewModeChange('monthly')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                viewMode === 'monthly' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              월간 목표 ({detailedGoals.monthlyGoals.length}개)
            </button>
            <button
              onClick={() => onViewModeChange('weekly')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                viewMode === 'weekly' 
                  ? 'border-orange-500 text-orange-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              주간 목표 ({detailedGoals.weeklyGoals.length}주)
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* 월간 목표 뷰 */}
          {(!viewMode || viewMode === 'monthly') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {detailedGoals.monthlyGoals.map((goal: unknown, index: number) => (
                <div key={goal.month || index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-green-900 text-sm">{goal.month || index + 1}개월차</h5>
                  </div>
                  <p className="text-green-800 text-xs">{goal.goal}</p>
                </div>
              ))}
            </div>
          )}

          {/* 주간 목표 뷰 */}
          {viewMode === 'weekly' && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map(month => (
                <div key={month}>
                  <h5 className="font-semibold text-orange-900 mb-2 text-sm">
                    {month}개월차 ({month*4-3}주 ~ {month*4}주)
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    {detailedGoals.weeklyGoals
                      .filter((goal: unknown) => goal.month === month)
                      .map((goal: unknown, index: number) => (
                        <div key={goal.week || index} className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <h6 className="font-medium text-orange-900 text-xs">{goal.week}주차</h6>
                          </div>
                          <p className="text-orange-800 text-xs">{goal.plan}</p>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          환자 다시 선택
        </button>
        <div className="space-x-3">
          <button
            onClick={onSave}
            disabled={isProcessing}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                저장 중...
              </>
            ) : (
              '목표 저장하기'
            )}
          </button>
          <button
            onClick={onNewGoal || onReset}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            새 목표 설정
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalDetailView;
