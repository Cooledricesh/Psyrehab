import React from 'react';
import { Calendar, Check, ChevronDown, ChevronRight, User } from 'lucide-react';
import { formatText } from '@/utils/GoalSetting/helpers';

interface GoalDetailDisplayProps {
  detailedGoals: unknown;
  selectedGoal: string;
  viewMode: 'monthly' | 'weekly';
  onViewModeChange: (mode: 'monthly' | 'weekly') => void;
  onGoalSelect: (goalId: string) => void;
  onSave: () => void;
  isProcessing: boolean;
  patients: unknown[];
  selectedPatient: string | null;
}

const GoalDetailDisplay: React.FC<GoalDetailDisplayProps> = ({
  detailedGoals,
  selectedGoal,
  viewMode,
  onViewModeChange,
  onGoalSelect,
  onSave,
  isProcessing,
  patients,
  selectedPatient
}) => {
  const [expandedMonths, setExpandedMonths] = React.useState<Record<string, boolean>>({});

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  if (!detailedGoals) return null;

  return (
    <div className="space-y-8">
      {/* 환자 정보 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <User className="h-6 w-6 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            {patients?.find(p => p.id === selectedPatient)?.full_name}님의 재활 계획
          </h3>
        </div>
        
        {/* 뷰 모드 선택 */}
        <div className="flex space-x-2">
          <button
            onClick={() => onViewModeChange('monthly')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'monthly' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            월간 계획
          </button>
          <button
            onClick={() => onViewModeChange('weekly')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'weekly' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            주간 계획
          </button>
        </div>
      </div>

      {/* 목표 선택 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">목표를 선택하세요:</h3>
        <div className="grid grid-cols-1 gap-4">
          {detailedGoals.options?.map((option: unknown, index: number) => (
            <div
              key={option.plan_id || index}
              onClick={() => onGoalSelect(index.toString())}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                selectedGoal === index.toString()
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {option.title}
                  </h4>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {formatText(option.description)}
                  </p>
                </div>
                {selectedGoal === index.toString() && (
                  <Check className="h-6 w-6 text-blue-500 flex-shrink-0 ml-4" />
                )}
              </div>

              {/* 선택된 목표의 상세 내용 표시 */}
              {selectedGoal === index.toString() && (
                <div className="mt-6 space-y-4">
                  <div className="border-t pt-4">
                    <h5 className="font-medium text-gray-900 mb-3">6개월 목표</h5>
                    <div className="space-y-3">
                      {option.sixMonthGoals?.map((goal: unknown, gIdx: number) => (
                        <div key={gIdx} className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-blue-600">{gIdx + 1}</span>
                          </div>
                          <p className="text-gray-700">{goal.goal || goal}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 월간/주간 계획 표시 */}
                  {viewMode === 'monthly' && (
                    <div className="border-t pt-4">
                      <h5 className="font-medium text-gray-900 mb-3">월간 계획</h5>
                      <div className="space-y-3">
                        {option.sixMonthGoals?.map((goal: unknown, gIdx: number) => 
                          goal.monthlyPlans?.map((monthPlan: unknown, mIdx: number) => (
                            <div key={`${gIdx}-${mIdx}`} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h6 className="font-medium text-gray-800">
                                  {monthPlan.month || mIdx + 1}개월차
                                </h6>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMonth(`${gIdx}-${mIdx}`);
                                  }}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  {expandedMonths[`${gIdx}-${mIdx}`] ? 
                                    <ChevronDown className="h-5 w-5" /> : 
                                    <ChevronRight className="h-5 w-5" />
                                  }
                                </button>
                              </div>
                              <ul className="space-y-1">
                                {monthPlan.activities?.map((activity: string, aIdx: number) => (
                                  <li key={aIdx} className="flex items-start">
                                    <span className="text-gray-400 mr-2">•</span>
                                    <span className="text-gray-600">{activity}</span>
                                  </li>
                                ))}
                              </ul>
                              
                              {/* 주간 계획 (확장 시) */}
                              {expandedMonths[`${gIdx}-${mIdx}`] && monthPlan.weeklyPlans && (
                                <div className="mt-3 pl-4 space-y-2">
                                  {monthPlan.weeklyPlans.map((weekPlan: unknown, wIdx: number) => (
                                    <div key={wIdx} className="bg-gray-50 rounded p-3">
                                      <h7 className="text-sm font-medium text-gray-700 mb-1">
                                        {weekPlan.week || `${wIdx + 1}`}주차
                                      </h7>
                                      <ul className="space-y-1">
                                        {weekPlan.tasks?.map((task: string, tIdx: number) => (
                                          <li key={tIdx} className="text-sm text-gray-600">
                                            • {task}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {viewMode === 'weekly' && (
                    <div className="border-t pt-4">
                      <h5 className="font-medium text-gray-900 mb-3">주간 계획</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {option.sixMonthGoals?.map((goal: unknown) => 
                          goal.monthlyPlans?.map((monthPlan: unknown) => 
                            monthPlan.weeklyPlans?.map((weekPlan: unknown, wIdx: number) => (
                              <div key={wIdx} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                  <h6 className="font-medium text-gray-800">
                                    {weekPlan.week || `${wIdx + 1}`}주차
                                  </h6>
                                </div>
                                <ul className="space-y-1">
                                  {weekPlan.tasks?.map((task: string, tIdx: number) => (
                                    <li key={tIdx} className="text-sm text-gray-600">
                                      • {task}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-center">
        <button
          onClick={onSave}
          disabled={!selectedGoal || isProcessing}
          className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              저장 중...
            </>
          ) : (
            <>
              <Check className="h-5 w-5 mr-2" />
              목표 저장하기
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GoalDetailDisplay;
