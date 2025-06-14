import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Target, Calendar, CheckCircle2 } from 'lucide-react';

interface AIRecommendation {
  recommendationId: string;
  planNumber: number;
  planName: string;
  description: string;
  sixMonthGoals: Array<{
    title: string;
    description: string;
    monthlyBreakdown?: Array<{
      month: number;
      goals: string[];
    }>;
  }>;
}

interface AIRecommendationDisplayProps {
  recommendations: AIRecommendation[];
  selectedGoal: string;
  onSelectGoal: (goalId: string) => void;
  viewMode: 'monthly' | 'weekly';
  onViewModeChange: (mode: 'monthly' | 'weekly') => void;
}

const AIRecommendationDisplay: React.FC<AIRecommendationDisplayProps> = ({
  recommendations,
  selectedGoal,
  onSelectGoal,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">AI 추천 재활 계획</h2>
          <p className="text-sm text-gray-600 mt-1">
            회원의 평가 결과를 바탕으로 생성된 맞춤형 재활 계획입니다.
          </p>
        </div>
        <Brain className="h-8 w-8 text-blue-600" />
      </div>

      <div className="space-y-4">
        {recommendations.map((plan) => (
          <Card
            key={plan.recommendationId}
            className={`cursor-pointer transition-all ${
              selectedGoal === plan.recommendationId
                ? 'border-blue-500 shadow-md'
                : 'hover:border-gray-300'
            }`}
            onClick={() => onSelectGoal(plan.recommendationId)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{plan.planName}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                </div>
                {selectedGoal === plan.recommendationId && (
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  6개월 목표
                </h4>
                {plan.sixMonthGoals.map((goal, index) => (
                  <div key={index} className="ml-6 p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{goal.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedGoal && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-blue-900 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              세부 계획 보기
            </h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === 'monthly' ? 'default' : 'outline'}
                onClick={() => onViewModeChange('monthly')}
              >
                월간
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'weekly' ? 'default' : 'outline'}
                onClick={() => onViewModeChange('weekly')}
              >
                주간
              </Button>
            </div>
          </div>
          <p className="text-sm text-blue-800">
            선택한 계획의 {viewMode === 'monthly' ? '월간' : '주간'} 세부 목표를 확인할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIRecommendationDisplay;
