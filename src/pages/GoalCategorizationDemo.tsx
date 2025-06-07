import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Target, Sparkles } from 'lucide-react'

export default function GoalCategorizationDemo() {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center space-x-2">
            <Target className="h-8 w-8 text-blue-600" />
            <span>목표 분류 시스템 데모</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            AI 추천, 태그 시스템, 고급 필터링을 포함한 포괄적인 목표 분류 시스템을 체험해보세요.
          </p>
        </div>

        {/* 간단한 데모 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <span>카테고리 시스템</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">목표를 8가지 주요 카테고리로 분류합니다:</p>
              <div className="grid grid-cols-2 gap-2">
                <Badge variant="outline">정신건강 관리</Badge>
                <Badge variant="outline">사회적 관계</Badge>
                <Badge variant="outline">일상생활 기능</Badge>
                <Badge variant="outline">직업재활</Badge>
                <Badge variant="outline">교육 및 학습</Badge>
                <Badge variant="outline">신체건강</Badge>
                <Badge variant="outline">여가활동</Badge>
                <Badge variant="outline">주거 안정</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>태그 시스템</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">목표에 다양한 태그를 적용할 수 있습니다:</p>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">난이도:</span>
                  <div className="flex space-x-1 mt-1">
                    <Badge className="bg-green-100 text-green-800">쉬움</Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">보통</Badge>
                    <Badge className="bg-red-100 text-red-800">어려움</Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">기간:</span>
                  <div className="flex space-x-1 mt-1">
                    <Badge className="bg-blue-100 text-blue-800">단기</Badge>
                    <Badge className="bg-purple-100 text-purple-800">장기</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI 추천 시스템</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">목표 내용을 분석하여 적절한 카테고리와 태그를 추천합니다.</p>
              <Button className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                AI 추천 받기
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>고급 필터링</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">카테고리, 태그, 상태, 우선순위 등으로 목표를 필터링할 수 있습니다.</p>
              <div className="space-y-2">
                <Button variant="outline" size="sm">상태별 필터</Button>
                <Button variant="outline" size="sm">우선순위별 필터</Button>
                <Button variant="outline" size="sm">날짜별 필터</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 상태 표시 */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-green-800 font-medium">목표 분류 시스템이 성공적으로 구현되었습니다!</span>
            </div>
            <p className="text-green-700 text-sm mt-2">
              Task 7.5 완료: 포괄적인 목표 분류 및 태그 시스템 구현
            </p>
          </CardContent>
        </Card>

        {/* 컴포넌트 상태 정보 */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            구현된 컴포넌트: GoalCategorySelector, GoalTagSelector, GoalFilters
          </p>
        </div>
      </div>
    </div>
  )
} 