import React, { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Users,
  MapPin,
  FileText,
  Edit,
  Trash2,
  Eye,
  Plus,
  Download,
  RefreshCw,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  getServiceTypeLabel,
  getServiceCategoryLabel,
  getLocationLabel,
  getDurationLabel,
  SERVICE_TYPES,
  SERVICE_CATEGORIES,
  SERVICE_LOCATIONS
} from '@/utils/service-constants'
import {
  useServiceRecords,
  useDeleteServiceRecord
} from '@/hooks/service-records/useServiceRecords'
import { ServiceRecordForm } from './ServiceRecordForm'
import type { ServiceRecordWithDetails } from '@/types/database'

interface ServiceRecordsListProps {
  patientId?: string
  socialWorkerId?: string
  showPatientInfo?: boolean
  showSocialWorkerInfo?: boolean
  onRecordSelect?: (record: ServiceRecordWithDetails) => void
  className?: string
}

interface Filters {
  search: string
  serviceType: string
  serviceCategory: string
  location: string
  isGroupSession: string
  dateFrom: string
  dateTo: string
}

const initialFilters: Filters = {
  search: '',
  serviceType: '',
  serviceCategory: '',
  location: '',
  isGroupSession: '',
  dateFrom: '',
  dateTo: ''
}

export function ServiceRecordsList({
  patientId,
  socialWorkerId,
  showPatientInfo = true,
  showSocialWorkerInfo = true,
  onRecordSelect,
  className = ''
}: ServiceRecordsListProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecordWithDetails | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ServiceRecordWithDetails | null>(null)

  const deleteMutation = useDeleteServiceRecord()

  // Calculate query filters
  const queryFilters = useMemo(() => {
    return {
      patientId,
      socialWorkerId,
      serviceType: filters.serviceType || undefined,
      serviceCategory: filters.serviceCategory || undefined,
      isGroupSession: filters.isGroupSession ? filters.isGroupSession === 'true' : undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize
    }
  }, [patientId, socialWorkerId, filters, currentPage, pageSize])

  const { data: serviceRecords, isLoading, error, refetch } = useServiceRecords(queryFilters)

  // Filter records by search term (client-side)
  const filteredRecords = useMemo(() => {
    if (!serviceRecords) return []
    
    if (!filters.search) return serviceRecords

    const searchTerm = filters.search.toLowerCase()
    return serviceRecords.filter(record => 
      record.patient?.full_name?.toLowerCase().includes(searchTerm) ||
      record.social_worker?.full_name?.toLowerCase().includes(searchTerm) ||
      getServiceTypeLabel(record.service_type).toLowerCase().includes(searchTerm) ||
      record.session_notes?.toLowerCase().includes(searchTerm) ||
      record.objectives?.toLowerCase().includes(searchTerm)
    )
  }, [serviceRecords, filters.search])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    setCurrentPage(1)
  }

  const handleEdit = (record: ServiceRecordWithDetails) => {
    setEditingRecord(record)
    setShowForm(true)
  }

  const handleDelete = async (recordId: string) => {
    try {
      await deleteMutation.mutateAsync(recordId)
    } catch (error) {
      console.error('서비스 레코드 삭제 실패:', error)
    }
  }

  const handleView = (record: ServiceRecordWithDetails) => {
    setSelectedRecord(record)
    onRecordSelect?.(record)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingRecord(null)
    refetch()
  }

  const getSessionTypeBadge = (record: ServiceRecordWithDetails) => {
    return record.is_group_session ? (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        그룹 ({record.participants_count}명)
      </Badge>
    ) : (
      <Badge variant="outline" className="flex items-center gap-1">
        <User className="h-3 w-3" />
        개별
      </Badge>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-700">
          서비스 레코드를 불러오는 중 오류가 발생했습니다.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">서비스 레코드</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredRecords.length}개의 레코드
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            새 레코드
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            필터 및 검색
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="환자명, 사회복지사명, 내용 검색..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Service Type */}
            <Select
              value={filters.serviceType}
              onValueChange={(value) => handleFilterChange('serviceType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="서비스 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {Object.values(SERVICE_TYPES).map((type) => (
                  <SelectItem key={type} value={type}>
                    {getServiceTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Service Category */}
            <Select
              value={filters.serviceCategory}
              onValueChange={(value) => handleFilterChange('serviceCategory', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {Object.values(SERVICE_CATEGORIES).map((category) => (
                  <SelectItem key={category} value={category}>
                    {getServiceCategoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location */}
            <Select
              value={filters.location}
              onValueChange={(value) => handleFilterChange('location', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="장소" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {SERVICE_LOCATIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Session Type */}
            <Select
              value={filters.isGroupSession}
              onValueChange={(value) => handleFilterChange('isGroupSession', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="세션 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                <SelectItem value="false">개별 세션</SelectItem>
                <SelectItem value="true">그룹 세션</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <Input
              type="date"
              placeholder="시작일"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />

            {/* Date To */}
            <Input
              type="date"
              placeholder="종료일"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              필터 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">로딩 중...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                서비스 레코드가 없습니다
              </h3>
              <p className="text-gray-600">
                새로운 서비스 레코드를 등록해보세요.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>일시</TableHead>
                  {showPatientInfo && <TableHead>환자</TableHead>}
                  {showSocialWorkerInfo && <TableHead>사회복지사</TableHead>}
                  <TableHead>서비스 유형</TableHead>
                  <TableHead>세션 유형</TableHead>
                  <TableHead>소요 시간</TableHead>
                  <TableHead>장소</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(record.service_date_time), 'M월 d일', { locale: ko })}
                          </div>
                          <div className="text-gray-500">
                            {format(new Date(record.service_date_time), 'HH:mm')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    {showPatientInfo && (
                      <TableCell>
                        <div className="font-medium">{record.patient?.full_name}</div>
                        <div className="text-sm text-gray-500">
                          {record.patient?.patient_identifier}
                        </div>
                      </TableCell>
                    )}
                    
                    {showSocialWorkerInfo && (
                      <TableCell>
                        <div className="font-medium">{record.social_worker?.full_name}</div>
                        <div className="text-sm text-gray-500">
                          {record.social_worker?.employee_id}
                        </div>
                      </TableCell>
                    )}
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {getServiceTypeLabel(record.service_type)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getServiceCategoryLabel(record.service_category)}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getSessionTypeBadge(record)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {getDurationLabel(record.duration_minutes)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {getLocationLabel(record.location)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(record)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(record)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>레코드 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                이 서비스 레코드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(record.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Service Record Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? '서비스 레코드 수정' : '새 서비스 레코드 등록'}
            </DialogTitle>
          </DialogHeader>
          <ServiceRecordForm
            existingRecord={editingRecord || undefined}
            patientId={patientId}
            socialWorkerId={socialWorkerId}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingRecord(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 