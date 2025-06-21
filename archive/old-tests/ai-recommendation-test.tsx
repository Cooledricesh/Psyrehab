import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AIRecommendationDisplay } from '@/components/ai/AIRecommendationDisplay'

// TanStack Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
    },
  },
})

export default function AIRecommendationTestPage() {
  // 테스트용 데이터 - 실제 저장된 데이터 ID 사용
  const testPatientId = "0f720b89-a47d-4ed9-8364-e493f6624442" // 홍길동
  const testAssessmentId = "test-assessment-id" // 실제로는 평가 ID가 필요하지만 테스트용으로 사용

  const handleGoalsGenerated = () => {
    console.log('목표가 생성되었습니다!')
    alert('목표가 성공적으로 생성되었습니다!')
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">AI 추천 시스템 테스트</h1>
            <p className="mt-2 text-gray-600">
              AI가 생성한 재활 목표 추천을 확인하고 선택할 수 있습니다.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">환자: 홍길동</h2>
              <p className="text-sm text-gray-600">65세 남성, 우울증 진단</p>
            </div>

            <div className="p-6">
              <AIRecommendationDisplay
                assessmentId={testAssessmentId}
                patientId={testPatientId}
                onGoalsGenerated={handleGoalsGenerated}
              />
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-blue-800 font-medium mb-2">테스트 정보</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• 환자 ID: {testPatientId}</li>
              <li>• 평가 ID: {testAssessmentId} (테스트용)</li>
              <li>• 이 페이지는 실제 저장된 AI 추천 데이터를 표시합니다</li>
              <li>• 목표 선택 후 "목표 생성" 버튼을 클릭하면 재활 목표가 생성됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  )
} 