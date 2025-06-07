import React, { useState, useMemo } from 'react'
import { usePatients } from '@/hooks/usePatients'
import { Button, Input, Select } from '@/components/ui'
import type { PatientListParams } from '@/services/patients'

interface PatientListProps {
  onPatientSelect?: (patientId: string) => void
  onPatientEdit?: (patientId: string) => void
  onPatientDelete?: (patientId: string) => void
}

export function PatientList({ onPatientSelect, onPatientEdit, onPatientDelete }: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const queryParams: PatientListParams = useMemo(() => ({
    page: currentPage,
    limit: 20,
    sort_by: sortBy,
    sort_order: sortOrder,
    filters: {
      search: searchTerm || undefined,
      status: statusFilter || undefined,
    }
  }), [currentPage, sortBy, sortOrder, searchTerm, statusFilter])

  const { data, isLoading, error, refetch } = usePatients(queryParams)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // 검색 시 첫 페이지로 리셋
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1) // 필터 변경 시 첫 페이지로 리셋
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: '활성', className: 'bg-green-100 text-green-800' },
      inactive: { label: '비활성', className: 'bg-gray-100 text-gray-800' },
      discharged: { label: '퇴원', className: 'bg-blue-100 text-blue-800' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, className: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex justify-between items-center">
          <p className="text-red-800">환자 목록을 불러오는 중 오류가 발생했습니다.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* 헤더 및 검색/필터 영역 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">환자 목록</h2>
          <div className="text-sm text-gray-600">
            총 {data?.count || 0}명의 환자
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 검색 */}
          <div>
            <Input
              type="text"
              placeholder="환자 이름 또는 식별번호로 검색..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
          </div>

          {/* 상태 필터 */}
          <div>
            <Select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full"
            >
              <option value="">모든 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="discharged">퇴원</option>
            </Select>
          </div>

          {/* 정렬 */}
          <div>
            <Select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('_')
                setSortBy(field)
                setSortOrder(order as 'asc' | 'desc')
                setCurrentPage(1)
              }}
              className="w-full"
            >
              <option value="created_at_desc">등록일 (최신순)</option>
              <option value="created_at_asc">등록일 (오래된순)</option>
              <option value="full_name_asc">이름 (가나다순)</option>
              <option value="full_name_desc">이름 (역순)</option>
              <option value="admission_date_desc">입원일 (최신순)</option>
              <option value="admission_date_asc">입원일 (오래된순)</option>
            </Select>
          </div>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">환자 목록을 불러오는 중...</span>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">등록된 환자가 없습니다.</p>
            {searchTerm || statusFilter ? (
              <p className="text-gray-400 text-sm mt-2">
                검색 조건을 변경하거나 새로운 환자를 등록해보세요.
              </p>
            ) : null}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('patient_identifier')}
                >
                  식별번호 {getSortIcon('patient_identifier')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('full_name')}
                >
                  환자명 {getSortIcon('full_name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  생년월일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  성별
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('admission_date')}
                >
                  입원일 {getSortIcon('admission_date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  담당 사회복지사
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  상태 {getSortIcon('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {patient.patient_identifier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {patient.full_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.date_of_birth ? formatDate(patient.date_of_birth) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.gender === 'male' ? '남성' : 
                     patient.gender === 'female' ? '여성' : 
                     patient.gender === 'other' ? '기타' : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.admission_date ? formatDate(patient.admission_date) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.primary_social_worker?.full_name || '미배정'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(patient.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {onPatientSelect && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPatientSelect(patient.id)}
                        >
                          보기
                        </Button>
                      )}
                      {onPatientEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPatientEdit(patient.id)}
                        >
                          편집
                        </Button>
                      )}
                      {onPatientDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPatientDelete(patient.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          삭제
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {data && data.total_pages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {data.count > 0 && (
                <>
                  {((currentPage - 1) * (data.limit || 20)) + 1}~
                  {Math.min(currentPage * (data.limit || 20), data.count)}번째 
                  (총 {data.count}개)
                </>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                이전
              </Button>
              
              {/* 페이지 번호 */}
              {Array.from({ length: Math.min(5, data.total_pages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(
                  data.total_pages - 4,
                  currentPage - 2
                )) + i
                
                if (pageNum > data.total_pages) return null
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= data.total_pages}
              >
                다음
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 