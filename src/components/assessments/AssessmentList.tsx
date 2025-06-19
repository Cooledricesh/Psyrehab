import React, { useState } from 'react'
import { 
  Trash2, 
  Calendar,
  User,
  FileText,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle
} from 'lucide-react'
import type { AssessmentListParams } from '@/types/assessment'
import { formatDate } from '@/utils/date'
import { useAssessments, useDeleteAssessment, useUpdateAssessmentStatus } from '@/hooks/assessments/useAssessments'
import { toast } from 'react-hot-toast'

interface AssessmentListProps {
  patientId?: string
  searchQuery?: string
  statusFilter?: string
  limit?: number
}

export function AssessmentList({ 
  patientId, 
  searchQuery = '', 
  statusFilter = '',
  limit = 10 
}: AssessmentListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'assessment_date' | 'status'>('assessment_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Build query parameters
  const queryParams: AssessmentListParams = {
    page: currentPage,
    limit,
    sort_by: sortBy,
    sort_order: sortOrder,
    filters: {
      ...(patientId && { patient_id: patientId }),
      ...(statusFilter && { status: statusFilter as any }),
      ...(searchQuery && { search: searchQuery })
    }
  }

  const { 
    data: assessmentData, 
    isLoading, 
    isError, 
    error 
  } = useAssessments(queryParams)

  const deleteAssessmentMutation = useDeleteAssessment()
  const updateStatusMutation = useUpdateAssessmentStatus()

  const handleDelete = async (id: string) => {
    if (window.confirm('이 평가를 삭제하시겠습니까?')) {
      try {
        await deleteAssessmentMutation.mutateAsync(id)
        toast.success('평가가 삭제되었습니다')
      } catch {
        toast.error('평가 삭제에 실패했습니다')
      }
    }
  }

  const handleStatusChange = async (id: string, status: 'draft' | 'completed' | 'reviewed') => {
    try {
      await updateStatusMutation.mutateAsync({ id, status })
      toast.success('평가 상태가 변경되었습니다')
    } catch {
      toast.error('상태 변경에 실패했습니다')
    }
  }

  const handleSort = (field: 'assessment_date' | 'status') => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-medium">데이터 로딩 오류</h3>
        </div>
        <p className="mt-2 text-sm text-red-700">
          {error?.message || '평가 목록을 불러오는데 실패했습니다.'}
        </p>
      </div>
    )
  }

  const assessments = assessmentData?.data || []
  const totalPages = assessmentData?.total_pages || 1

  if (assessments.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">평가 기록이 없습니다</h3>
        <p className="text-gray-600">
          {patientId ? '이 환자의 평가 기록이 없습니다.' : '아직 생성된 평가가 없습니다.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with sorting options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">
            평가 목록 ({assessmentData?.count || 0}개)
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleSort('assessment_date')}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              sortBy === 'assessment_date'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            평가일
            {sortBy === 'assessment_date' && (
              sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
            )}
          </button>
          
          <button
            onClick={() => handleSort('status')}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              sortBy === 'status'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            상태
            {sortBy === 'status' && (
              sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Assessment Cards */}
      <div className="space-y-4">
        {assessments.map((assessment) => (
          <div key={assessment.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h4 className="text-lg font-medium text-gray-900">
                    {assessment.patients?.name || '환자 이름 없음'}
                  </h4>
                  
                  {/* Status Badge */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    assessment.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : assessment.status === 'reviewed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {assessment.status === 'completed' ? '완료' : 
                     assessment.status === 'reviewed' ? '검토됨' : '임시저장'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      평가일: {formatDate(assessment.assessment_date)}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-1" />
                      평가자: {assessment.social_workers?.name || '정보 없음'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      작성일: {formatDate(assessment.created_at)}
                    </div>
                    
                    {assessment.updated_at !== assessment.created_at && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        수정일: {formatDate(assessment.updated_at)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Assessment Steps Preview */}
                <div className="flex items-center space-x-4 mb-4">
                  {[
                    { key: 'concentration_time', label: '집중력', icon: '🎯' },
                    { key: 'motivation_level', label: '동기', icon: '💪' },
                    { key: 'past_successes', label: '성공경험', icon: '🏆' },
                    { key: 'constraints', label: '제약사항', icon: '⚠️' },
                    { key: 'social_preference', label: '사회성', icon: '👥' }
                  ].map(step => (
                    <div key={step.key} className="flex items-center space-x-1">
                      <span className="text-sm">{step.icon}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        assessment[step.key as keyof typeof assessment] 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Notes Preview */}
                {assessment.overall_notes && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {assessment.overall_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleDelete(assessment.id)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-500"
                  disabled={deleteAssessmentMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {assessmentData?.count || 0}개 중 {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, assessmentData?.count || 0)}개 표시
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              이전
            </button>
            
            <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700">
              {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssessmentList 