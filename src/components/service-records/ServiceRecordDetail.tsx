import React from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  User,
  Users,
  // MapPin,
  FileText,
  Target,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Edit,
  Print,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
// import { Separator } from '@/components/ui/separator'
import {
  getServiceTypeLabel,
  getServiceCategoryLabel,
  getLocationLabel,
  getDurationLabel
} from '@/utils/service-constants'
import type { ServiceRecordWithDetails } from '@/types/database'

interface ServiceRecordDetailProps {
  record: ServiceRecordWithDetails
  onEdit?: (record: ServiceRecordWithDetails) => void
  onPrint?: () => void
  onExport?: () => void
  className?: string
}

export function ServiceRecordDetail({
  record,
  onEdit,
  onPrint,
  onExport,
  className = ''
}: ServiceRecordDetailProps) {
  const getSessionTypeBadge = () => {
    return record.is_group_session ? (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        그룹 세션 ({record.participants_count}명)
      </Badge>
    ) : (
      <Badge variant="outline" className="flex items-center gap-1">
        <User className="h-3 w-3" />
        개별 세션
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      fullDate: format(date, 'yyyy년 M월 d일 (E)', { locale: ko }),
      time: format(date, 'HH:mm'),
      dayOfWeek: format(date, 'EEEE', { locale: ko })
    }
  }

  const serviceDate = formatDate(record.service_date_time)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            서비스 레코드 상세
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {serviceDate.fullDate}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {serviceDate.time}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {onPrint && (
            <Button variant="outline" onClick={onPrint}>
              <Print className="h-4 w-4 mr-2" />
              인쇄
            </Button>
          )}
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
          )}
          {onEdit && (
            <Button onClick={() => onEdit(record)}>
              <Edit className="h-4 w-4 mr-2" />
              수정
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                서비스 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">서비스 유형</label>
                  <p className="mt-1 text-base font-medium">
                    {getServiceTypeLabel(record.service_type)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">카테고리</label>
                  <p className="mt-1 text-base">
                    {getServiceCategoryLabel(record.service_category)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">소요 시간</label>
                  <p className="mt-1 text-base">
                    {getDurationLabel(record.duration_minutes)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">장소</label>
                  <p className="mt-1 text-base">
                    {getLocationLabel(record.location)}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">세션 유형</label>
                  <div className="mt-1">
                    {getSessionTypeBadge()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                세션 내용
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {record.objectives && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    목표 및 계획
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{record.objectives}</p>
                  </div>
                </div>
              )}

              {record.session_notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    세션 노트
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{record.session_notes}</p>
                  </div>
                </div>
              )}

              {record.outcomes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    결과 및 성과
                  </h3>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{record.outcomes}</p>
                  </div>
                </div>
              )}

              {record.next_steps && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    다음 단계
                  </h3>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{record.next_steps}</p>
                  </div>
                </div>
              )}

              {!record.objectives && !record.session_notes && !record.outcomes && !record.next_steps && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>세션 내용이 기록되지 않았습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Follow-up Information */}
          {record.follow_up_needed && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  후속 조치
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">후속 조치가 필요합니다</p>
                    {record.follow_up_date && (
                      <p className="text-sm text-amber-700 mt-1">
                        예정일: {format(new Date(record.follow_up_date), 'yyyy년 M월 d일', { locale: ko })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Information */}
          {record.patient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  환자 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">이름</label>
                  <p className="mt-1 font-medium">{record.patient.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">환자 번호</label>
                  <p className="mt-1 text-sm text-gray-600">{record.patient.patient_identifier}</p>
                </div>
                {record.patient.date_of_birth && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">생년월일</label>
                    <p className="mt-1 text-sm text-gray-600">
                      {format(new Date(record.patient.date_of_birth), 'yyyy년 M월 d일', { locale: ko })}
                    </p>
                  </div>
                )}
                {record.patient.gender && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">성별</label>
                    <p className="mt-1 text-sm text-gray-600">
                      {record.patient.gender === 'male' ? '남성' : '여성'}
                    </p>
                  </div>
                )}
                {record.patient.status && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">상태</label>
                    <div className="mt-1">
                      <Badge variant={record.patient.status === 'active' ? 'default' : 'secondary'}>
                        {record.patient.status === 'active' ? '활성' : '비활성'}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Social Worker Information */}
          {record.social_worker && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  담당 사회복지사
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">이름</label>
                  <p className="mt-1 font-medium">{record.social_worker.full_name}</p>
                </div>
                {record.social_worker.employee_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">직원 번호</label>
                    <p className="mt-1 text-sm text-gray-600">{record.social_worker.employee_id}</p>
                  </div>
                )}
                {record.social_worker.department && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">부서</label>
                    <p className="mt-1 text-sm text-gray-600">{record.social_worker.department}</p>
                  </div>
                )}
                {record.social_worker.contact_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">연락처</label>
                    <p className="mt-1 text-sm text-gray-600">{record.social_worker.contact_number}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">레코드 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-medium text-gray-500">생성일</label>
                <p className="mt-1 text-gray-600">
                  {record.created_at && format(new Date(record.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">수정일</label>
                <p className="mt-1 text-gray-600">
                  {record.updated_at && format(new Date(record.updated_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">레코드 ID</label>
                <p className="mt-1 text-gray-600 font-mono text-xs">{record.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 