'use client'

import React, { useState, useMemo } from 'react'
import { 
  useAIRecommendationByAssessment,
  useUpdateAIRecommendationStatus,
  useGenerateGoalsFromRecommendation,
  type ParsedGoal
} from '@/hooks/useAIRecommendations'

interface AIRecommendationDisplayProps {
  assessmentId: string
  patientId: string
  onGoalsGenerated?: () => void
}

export function AIRecommendationDisplay({
  assessmentId,
  patientId,
  onGoalsGenerated
}: AIRecommendationDisplayProps) {
  const [selectedPlanNumbers, setSelectedPlanNumbers] = useState<number[]>([])
  
  const { data: recommendation, isLoading, error } = useAIRecommendationByAssessment(assessmentId, patientId)
  const updateStatusMutation = useUpdateAIRecommendationStatus()
  const generateGoalsMutation = useGenerateGoalsFromRecommendation()

  // 구조화된 recommendations 배열에서 직접 데이터 사용
  const plans = useMemo(() => {
    if (!recommendation?.recommendations) return []
    return recommendation.recommendations
  }, [recommendation?.recommendations])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">AI 추천을 불러오는 중...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">오류 발생</h3>
        <p className="text-red-600 text-sm mt-1">
          AI 추천 데이터를 불러올 수 없습니다: {error.message}
        </p>
      </div>
    )
  }

  if (!recommendation || !recommendation.recommendations) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <h3 className="text-gray-800 font-medium">AI 추천 없음</h3>
        <p className="text-gray-600 text-sm mt-1">
          이 평가에 대한 AI 추천이 아직 생성되지 않았습니다.
        </p>
      </div>
    )
  }

  const handlePlanToggle = (planNumber: number) => {
    setSelectedPlanNumbers(prev => 
      prev.includes(planNumber) 
        ? prev.filter(id => id !== planNumber)
        : [...prev, planNumber]
    )
  }

  // Approval handler reserved for future implementation
  // const handleApprove = async () => {
  //   if (selectedPlanNumbers.length === 0) {
  //     alert('적어도 하나의 계획을 선택해주세요.')
  //     return
  //   }

  //   try {
  //     await updateStatusMutation.mutateAsync({
  //       recommendationId: recommendation.id,
  //       isActive: true,
  //       appliedBy: patientId // 현재는 환자 ID를 사용, 실제로는 로그인한 사용자 ID
  //     })
  //   } catch (error) {
  //     console.error('Failed to approve recommendation:', error)
  //     alert('추천 승인 중 오류가 발생했습니다.')
  //   }
  // }

  const handleGenerateGoals = async () => {
    if (selectedPlanNumbers.length === 0) {
      alert('적어도 하나의 계획을 선택해주세요.')
      return
    }

    try {
      const result = await generateGoalsMutation.mutateAsync({
        recommendationId: recommendation.id,
        patientId,
        selectedPlanNumbers
      })
      
      onGoalsGenerated?.()
      
      alert(`${result.goals.length}개의 재활 목표가 생성되었습니다!`)
    } catch (error) {
      console.error('Failed to generate goals:', error)
      alert('목표 생성 중 오류가 발생했습니다.')
    }
  }

  const handleReject = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        recommendationId: recommendation.id,
        isActive: false
      })
      alert('AI 추천이 거절되었습니다.')
    } catch (error) {
      console.error('Failed to reject recommendation:', error)
      alert('추천 거절 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="space-y-6">
      {/* 추천 시스템 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-blue-800 font-medium">AI 목표 추천</h3>
            <p className="text-blue-600 text-sm mt-1">
              AI가 평가 결과를 분석하여 6개월 재활 계획을 추천했습니다.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-600">
              추천일: {new Date(recommendation.created_at).toLocaleDateString('ko-KR')}
            </div>
            <div className="text-xs text-blue-500 mt-1">
              {recommendation.is_active ? '활성' : '비활성'} | 
              {recommendation.applied_at ? ` 적용됨 (${new Date(recommendation.applied_at).toLocaleDateString('ko-KR')})` : ' 미적용'}
            </div>
          </div>
        </div>
        
        {/* 환자 분석 요약 표시 */}
        {recommendation.patient_analysis && (
          <div className="mt-3 p-3 bg-blue-25 rounded border-l-4 border-blue-400">
            <h4 className="text-sm font-medium text-blue-800 mb-1">AI 분석 결과</h4>
            <div className="text-sm text-blue-700">
              {typeof recommendation.patient_analysis === 'string' 
                ? recommendation.patient_analysis 
                : JSON.stringify(recommendation.patient_analysis)
              }
            </div>
          </div>
        )}
      </div>

      {/* 3가지 계획 옵션 */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">추천 계획 ({plans.length}개)</h4>
        <p className="text-sm text-gray-600 mb-4">
          원하는 계획을 선택하여 재활 목표에 추가할 수 있습니다. 여러 계획을 동시에 선택 가능합니다.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isSelected = selectedPlanNumbers.includes(plan.plan_number)
            
            return (
              <PlanCard 
                key={plan.plan_number}
                plan={plan}
                isSelected={isSelected}
                onSelect={() => handlePlanToggle(plan.plan_number)}
              />
            )
          })}
        </div>
      </div>

      {/* 실행 전략 */}
      {recommendation.execution_strategy && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-green-800 font-medium mb-3">실행 전략</h4>
          <div className="text-sm text-green-700">
            {typeof recommendation.execution_strategy === 'string' 
              ? recommendation.execution_strategy 
              : JSON.stringify(recommendation.execution_strategy)
            }
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      {!recommendation.applied_at && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            {selectedPlanNumbers.length > 0 ? 
              `${selectedPlanNumbers.length}개 계획이 선택되었습니다.` : 
              '계획을 선택해 주세요.'
            }
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleReject}
              disabled={updateStatusMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              거절
            </button>
            
            <button
              onClick={handleGenerateGoals}
              disabled={selectedPlanNumbers.length === 0 || generateGoalsMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generateGoalsMutation.isPending ? '생성 중...' : '목표 생성'}
            </button>
          </div>
        </div>
      )}

      {/* 목표 생성 완료 */}
      {recommendation.applied_at && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-green-800 font-medium">목표 생성 완료</h4>
          <p className="text-green-600 text-sm mt-1">
            이 AI 추천으로부터 재활 목표가 생성되었습니다. ({new Date(recommendation.applied_at).toLocaleDateString('ko-KR')})
          </p>
        </div>
      )}

      {/* 비활성 상태 */}
      {!recommendation.is_active && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-gray-800 font-medium">거절된 추천</h4>
          <p className="text-gray-600 text-sm mt-1">
            이 AI 추천은 거절되었습니다.
          </p>
        </div>
      )}
    </div>
  )
}

// 개별 계획 카드 컴포넌트
interface PlanCardProps {
  plan: ParsedGoal
  isSelected: boolean
  onSelect: () => void
}

function PlanCard({ plan, isSelected, onSelect }: PlanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div 
      className={`
        border-2 rounded-lg p-6 cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
      onClick={onSelect}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">
            계획 {plan.plan_number}
          </h3>
          <h4 className="text-blue-600 font-medium mt-1">{plan.title}</h4>
        </div>
        {isSelected && (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ml-2">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* 목적 */}
      <div className="mb-4">
        <h5 className="font-medium text-gray-900 text-sm mb-1">목적</h5>
        <p className="text-gray-600 text-sm">{plan.purpose}</p>
      </div>

      {/* 6개월 목표 */}
      <div className="mb-4">
        <h5 className="font-medium text-gray-900 text-sm mb-1">6개월 목표</h5>
        <p className="text-gray-600 text-sm">{plan.sixMonthGoal}</p>
      </div>

      {/* 월간 계획 미리보기 */}
      {plan.monthlyGoals.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium text-gray-900 text-sm mb-2">월간 계획</h5>
          <div className="space-y-1">
            {plan.monthlyGoals.slice(0, 2).map((monthlyGoal) => (
              <div key={monthlyGoal.month} className="bg-gray-50 rounded p-2">
                <div className="text-xs font-medium text-gray-700">{monthlyGoal.month}개월차</div>
                <div className="text-xs text-gray-600">{monthlyGoal.goal}</div>
              </div>
            ))}
            {plan.monthlyGoals.length > 2 && (
              <div className="text-xs text-gray-500 text-center">
                +{plan.monthlyGoals.length - 2}개 계획 더보기
              </div>
            )}
          </div>
        </div>
      )}

      {/* 주간 계획 미리보기 */}
      {plan.weeklyPlans.length > 0 && (
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            주간 계획 {isExpanded ? '접기' : '보기'}
            <svg 
              className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isExpanded && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {plan.weeklyPlans.map((weeklyPlan) => (
                <div key={weeklyPlan.week} className="bg-gray-50 rounded p-2">
                  <div className="text-xs font-medium text-gray-700">{weeklyPlan.week}주차</div>
                  <div className="text-xs text-gray-600">{weeklyPlan.plan}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 