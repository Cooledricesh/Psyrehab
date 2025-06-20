import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Calendar, 
  Clock, 
  /* User, */ 
  Users, 
  MapPin, 
  FileText, 
  Save,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  SERVICE_LOCATIONS,
  DURATION_OPTIONS,
  PARTICIPANTS_COUNT_OPTIONS,
  SERVICE_VALIDATION
} from '@/utils/service-constants'
import { useCreateServiceRecord, useUpdateServiceRecord } from '@/hooks/service-records/useServiceRecords'
import type { ServiceRecordWithDetails } from '@/types/database'

// Form validation schema
const serviceRecordSchema = z.object({
  patient_id: z.string().min(1, '환자를 선택해주세요'),
  social_worker_id: z.string().min(1, '사회복지사를 선택해주세요'),
  service_type: z.enum(Object.values(SERVICE_TYPES) as [string, ...string[]], {
    required_error: '서비스 유형을 선택해주세요'
  }),
  service_category: z.enum(Object.values(SERVICE_CATEGORIES) as [string, ...string[]], {
    required_error: '서비스 카테고리를 선택해주세요'
  }),
  service_date_time: z.string().min(1, '서비스 일시를 입력해주세요'),
  duration_minutes: z.number()
    .min(SERVICE_VALIDATION.duration_minutes.min, '최소 15분 이상이어야 합니다')
    .max(SERVICE_VALIDATION.duration_minutes.max, '최대 8시간까지 가능합니다'),
  location: z.string().min(1, '장소를 선택해주세요'),
  is_group_session: z.boolean(),
  participants_count: z.number()
    .min(1, '최소 1명 이상이어야 합니다')
    .max(50, '최대 50명까지 가능합니다'),
  session_notes: z.string().optional(),
  objectives: z.string().optional(),
  outcomes: z.string().optional(),
  next_steps: z.string().optional(),
  follow_up_needed: z.boolean(),
  follow_up_date: z.string().optional(),
})

type ServiceRecordFormData = z.infer<typeof serviceRecordSchema>

interface ServiceRecordFormProps {
  existingRecord?: ServiceRecordWithDetails
  patientId?: string
  socialWorkerId?: string
  onSuccess?: (record: unknown) => void
  onCancel?: () => void
  className?: string
}

export function ServiceRecordForm({
  existingRecord,
  patientId,
  socialWorkerId,
  onSuccess,
  onCancel,
  className = ''
}: ServiceRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createMutation = useCreateServiceRecord()
  const updateMutation = useUpdateServiceRecord()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset
  } = useForm<ServiceRecordFormData>({
    resolver: zodResolver(serviceRecordSchema),
    defaultValues: existingRecord ? {
      patient_id: existingRecord.patient_id,
      social_worker_id: existingRecord.social_worker_id,
      service_type: existingRecord.service_type,
      service_category: existingRecord.service_category,
      service_date_time: existingRecord.service_date_time,
      duration_minutes: existingRecord.duration_minutes || 60,
      location: existingRecord.location || '',
      is_group_session: existingRecord.is_group_session || false,
      participants_count: existingRecord.participants_count || 1,
      session_notes: existingRecord.session_notes || '',
      objectives: existingRecord.objectives || '',
      outcomes: existingRecord.outcomes || '',
      next_steps: existingRecord.next_steps || '',
      follow_up_needed: existingRecord.follow_up_needed || false,
      follow_up_date: existingRecord.follow_up_date || '',
    } : {
      patient_id: patientId || '',
      social_worker_id: socialWorkerId || '',
      service_type: SERVICE_TYPES.INDIVIDUAL_COUNSELING,
      service_category: SERVICE_CATEGORIES.COUNSELING,
      service_date_time: new Date().toISOString().slice(0, 16),
      duration_minutes: 60,
      location: 'center',
      is_group_session: false,
      participants_count: 1,
      session_notes: '',
      objectives: '',
      outcomes: '',
      next_steps: '',
      follow_up_needed: false,
      follow_up_date: '',
    }
  })

  const isGroupSession = watch('is_group_session')
  const followUpNeeded = watch('follow_up_needed')

  const onSubmit = async (data: ServiceRecordFormData) => {
    setIsSubmitting(true)
    try {
      if (existingRecord) {
        const result = await updateMutation.mutateAsync({
          id: existingRecord.id,
          updates: data
        })
        onSuccess?.(result)
      } else {
        const result = await createMutation.mutateAsync(data)
        onSuccess?.(result)
        reset()
      }
    } catch {
      console.error("Error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {existingRecord ? '서비스 레코드 수정' : '새 서비스 레코드 등록'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service_type">서비스 유형 *</Label>
              <Select
                value={watch('service_type')}
                onValueChange={(value) => setValue('service_type', value as unknown)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="서비스 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service_type && (
                <p className="text-sm text-red-600">{errors.service_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_category">서비스 카테고리 *</Label>
              <Select
                value={watch('service_category')}
                onValueChange={(value) => setValue('service_category', value as unknown)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service_category && (
                <p className="text-sm text-red-600">{errors.service_category.message}</p>
              )}
            </div>
          </div>

          {/* 일시 및 기간 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service_date_time" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                서비스 일시 *
              </Label>
              <Input
                id="service_date_time"
                type="datetime-local"
                {...register('service_date_time')}
              />
              {errors.service_date_time && (
                <p className="text-sm text-red-600">{errors.service_date_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                소요 시간 *
              </Label>
              <Select
                value={watch('duration_minutes')?.toString()}
                onValueChange={(value) => setValue('duration_minutes', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="시간 선택" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value.toString()}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.duration_minutes && (
                <p className="text-sm text-red-600">{errors.duration_minutes.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                장소 *
              </Label>
              <Select
                value={watch('location')}
                onValueChange={(value) => setValue('location', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="장소 선택" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_LOCATIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location && (
                <p className="text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>
          </div>

          {/* 그룹 세션 설정 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_group_session"
                checked={isGroupSession}
                onCheckedChange={(checked) => setValue('is_group_session', checked as boolean)}
              />
              <Label htmlFor="is_group_session" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                그룹 세션
              </Label>
            </div>

            {isGroupSession && (
              <div className="space-y-2">
                <Label htmlFor="participants_count">참여자 수 *</Label>
                <Select
                  value={watch('participants_count')?.toString()}
                  onValueChange={(value) => setValue('participants_count', parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="인원" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTICIPANTS_COUNT_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value.toString()}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.participants_count && (
                  <p className="text-sm text-red-600">{errors.participants_count.message}</p>
                )}
              </div>
            )}
          </div>

          {/* 세션 내용 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="objectives">목표 및 계획</Label>
              <Textarea
                id="objectives"
                placeholder="이번 세션의 목표와 계획을 입력하세요"
                {...register('objectives')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_notes">세션 노트</Label>
              <Textarea
                id="session_notes"
                placeholder="세션 진행 과정과 내용을 기록하세요"
                {...register('session_notes')}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcomes">결과 및 성과</Label>
              <Textarea
                id="outcomes"
                placeholder="세션의 결과와 달성한 성과를 기록하세요"
                {...register('outcomes')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_steps">다음 단계</Label>
              <Textarea
                id="next_steps"
                placeholder="다음에 수행할 활동이나 계획을 입력하세요"
                {...register('next_steps')}
                rows={3}
              />
            </div>
          </div>

          {/* 후속 조치 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="follow_up_needed"
                checked={followUpNeeded}
                onCheckedChange={(checked) => setValue('follow_up_needed', checked as boolean)}
              />
              <Label htmlFor="follow_up_needed">후속 조치 필요</Label>
            </div>

            {followUpNeeded && (
              <div className="space-y-2">
                <Label htmlFor="follow_up_date">후속 조치 예정일</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  {...register('follow_up_date')}
                />
              </div>
            )}
          </div>

          {/* 오류 메시지 */}
          {(createMutation.isError || updateMutation.isError) && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                서비스 레코드 저장 중 오류가 발생했습니다. 다시 시도해주세요.
              </AlertDescription>
            </Alert>
          )}

          {/* 액션 버튼 */}
          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={!isValid || isSubmitting}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? '저장 중...' : existingRecord ? '수정' : '등록'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 