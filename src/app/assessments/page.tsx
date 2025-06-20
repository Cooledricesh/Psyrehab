'use client'

import React, { useState } from 'react'
import { 
  ClipboardList, 
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimpleAssessmentForm } from '@/components/assessments/SimpleAssessmentForm'
import { usePatients } from '@/hooks/usePatients'

export default function AssessmentsPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [showAssessmentForm, setShowAssessmentForm] = useState(false)

  // 환자 목록 가져오기
  const { data: patientsData, isLoading: patientsLoading, error: patientsError } = usePatients({
    page: 1,
    limit: 100,
    sort_by: 'full_name',
    sort_order: 'asc',
    filters: {
      status: 'active'
    }
  })

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId)
  }

  const handleStartAssessment = () => {
    if (selectedPatientId) {
      setShowAssessmentForm(true)
    }
  }

  // const handleCancelAssessment = () => {
  //   setShowAssessmentForm(false)
  //   setSelectedPatientId(null)
  // }

  const handleAssessmentComplete = (assessmentId: string) => {
    console.log('Assessment completed:', assessmentId)
    // 평가 완료 후 처리 로직
    setShowAssessmentForm(false)
    setSelectedPatientId(null)
  }

  // 평가 폼이 표시되는 경우
  if (showAssessmentForm && selectedPatientId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleAssessmentForm
          patientId={selectedPatientId}
          onAssessmentComplete={handleAssessmentComplete}
          onBack={handleBackToSelection}
          className="max-w-none"
        />
      </div>
    )
  }

  // 환자 선택 화면
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
            <div>
            <h1 className="text-2xl font-display font-bold text-neutral-800">
              AI 목표 추천 평가
            </h1>
            <p className="text-neutral-600">
              환자를 선택하고 5가지 질문에 답변하여 AI 기반 맞춤형 재활 목표를 생성합니다.
            </p>
          </div>
            </div>
            
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 환자 선택 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                환자 선택
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patientsLoading ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">환자 목록을 불러오는 중...</p>
              </div>
              ) : patientsError ? (
                <div className="text-center py-4">
                  <p className="text-red-500">환자 목록을 불러오는 중 오류가 발생했습니다.</p>
              </div>
              ) : patients.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">등록된 활성 환자가 없습니다.</p>
            </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      평가할 환자를 선택해주세요
                    </label>
                    <Select value={selectedPatientId || ''} onValueChange={handlePatientSelect}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="환자를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.full_name} ({patient.patient_identifier})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
          </div>

                  {selectedPatientId && (
                    <div className="pt-4 border-t">
                      {(() => {
                        if (!selectedPatient) return null
              
              return (
                          <div className="space-y-3">
                            <h3 className="font-medium text-gray-900">선택된 환자 정보</h3>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                              <p><span className="font-medium">이름:</span> {selectedPatient.full_name}</p>
                              <p><span className="font-medium">환자번호:</span> {selectedPatient.patient_identifier}</p>
                              <p><span className="font-medium">성별:</span> {selectedPatient.gender}</p>
                              <p><span className="font-medium">진단:</span> {selectedPatient.diagnosis}</p>
                              <p><span className="font-medium">생년월일:</span> {new Date(selectedPatient.birth_date).toLocaleDateString('ko-KR')}</p>
                            </div>
                            <Button 
                              onClick={handleStartAssessment}
                              className="w-full"
                              size="lg"
                            >
                              <ClipboardList className="h-4 w-4 mr-2" />
                              평가 시작하기
                            </Button>
                          </div>
              )
                      })()}
          </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* 평가 안내 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-green-600" />
                평가 프로세스 안내
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                  <p><strong>집중력 측정:</strong> 환자의 집중 가능 시간을 파악합니다.</p>
        </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                  <p><strong>동기 수준 평가:</strong> 변화에 대한 의지와 동기를 측정합니다.</p>
      </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                  <p><strong>성공 경험 탐색:</strong> 과거 성공했던 활동들을 확인합니다.</p>
            </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                  <p><strong>제약사항 파악:</strong> 목표 실행을 방해할 수 있는 요소들을 확인합니다.</p>
          </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">5</span>
                  <p><strong>사회적 선호도:</strong> 개인 활동 vs 집단 활동에 대한 선호를 파악합니다.</p>
      </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>📊 AI 분석:</strong> 평가 완료 후 AI가 환자 특성에 맞는 6개월 재활 목표를 자동으로 생성합니다.
            </p>
          </div>
        </div>
            </CardContent>
          </Card>
      </div>
      </main>
    </div>
  )
} 