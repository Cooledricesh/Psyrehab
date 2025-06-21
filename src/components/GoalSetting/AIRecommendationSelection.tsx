import React from 'react';
import { ChevronRight, Target } from 'lucide-react';

interface AIGoal {
  title?: string;
  purpose?: string;
  sixMonthGoal?: string;
  [key: string]: unknown;
}

interface AIRecommendations {
  goals?: AIGoal[];
  [key: string]: unknown;
}

interface AIRecommendationSelectionProps {
  aiRecommendations: AIRecommendations;
  selectedGoal: string;
  onSelectGoal: (goalIndex: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const AIRecommendationSelection: React.FC<AIRecommendationSelectionProps> = ({
  aiRecommendations,
  selectedGoal,
  onSelectGoal,
  onBack,
  onNext,
}) => {
  const handleGoalSelect = () => {
    console.log('🔥 목표 설정하기 버튼 클릭됨!');
    console.log('선택된 목표:', selectedGoal);
    console.log('AI 추천 데이터:', aiRecommendations);
    
    if (!selectedGoal) {
      alert('하나의 목표를 선택해주세요.');
      return;
    }
    
    onNext();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          3개의 맞춤형 목표가 생성되었습니다.
        </h3>
      </div>

      {/* AI 분석 요약 - 접이식 */}
      {(aiRecommendations.reasoning || aiRecommendations.patient_analysis) && (
        <div className="bg-white rounded-lg shadow-sm">
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-sm">📋</span>
                </div>
                <span className="font-medium text-gray-900">환자 분석</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mt-3">
                {aiRecommendations.reasoning || aiRecommendations.patient_analysis?.insights || '분석 정보를 불러오는 중...'}
              </div>
            </div>
          </details>
        </div>
      )}

      {/* 추천 목표 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
            <Target className="h-4 w-4 text-red-600" />
          </div>
          <h4 className="font-semibold text-gray-900">추천 목표 (3개)</h4>
        </div>

        <div className="space-y-3">
          {(aiRecommendations.goals || []).map((goal: AIGoal, index: number) => (
            <div
              key={index}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedGoal === index.toString()
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => onSelectGoal(index.toString())}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="goal"
                  value={index.toString()}
                  checked={selectedGoal === index.toString()}
                  onChange={() => onSelectGoal(index.toString())}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-600">목표 {index + 1}</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {goal.title?.replace(/^목표\s*\d+[:\.]?\s*/, '') || `목표 ${index + 1}`}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">🎯</span>
                      <div>
                        <span className="font-medium text-gray-700">목적:</span>
                        <span className="text-gray-600 ml-1">
                          {goal.purpose || '목적 설명'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">⭕</span>
                      <div>
                        <span className="font-medium text-gray-700">6개월 목표:</span>
                        <span className="text-gray-600 ml-1">
                          {goal.sixMonthGoal || '목표 설정 중'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          평가 다시하기
        </button>
        <button
          onClick={handleGoalSelect}
          disabled={!selectedGoal}
          className={`px-6 py-2 rounded-lg font-medium ${
            selectedGoal
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          목표 설정하기
        </button>
      </div>
    </div>
  );
};

export default AIRecommendationSelection;
