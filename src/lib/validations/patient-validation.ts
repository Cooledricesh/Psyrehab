import { z } from 'zod'

// 한국 전화번호 정규식
const phoneRegex = /^(\+82-?)?0?1[0-9]-?\d{3,4}-?\d{4}$/

// 이메일 검증
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 환자 식별번호 정규식 (숫자만 허용: 101860)
const patientIdRegex = /^\d+$/

// 기본 환자 정보 스키마
export const patientBaseSchema = z.object({
  full_name: z
    .string()
    .min(2, '이름은 최소 2자 이상이어야 합니다')
    .max(50, '이름은 50자를 초과할 수 없습니다')
    .regex(/^[가-힣a-zA-Z\s]+$/, '이름은 한글, 영문, 공백만 포함할 수 있습니다'),
  
  patient_identifier: z
    .string()
    .min(1, '환자 식별번호는 필수입니다')
    .max(20, '환자 식별번호는 20자를 초과할 수 없습니다')
    .regex(patientIdRegex, '환자 식별번호는 숫자만 입력할 수 있습니다 (예: 101860)'),
  
  date_of_birth: z
    .string()
    .refine((date) => {
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 0 && age <= 120
    }, '올바른 생년월일을 입력하세요'),
  
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: '성별을 선택하세요' })
  }),
})

// 연락처 정보 스키마
export const contactInfoSchema = z.object({
  phone: z
    .string()
    .optional()
    .refine((phone) => !phone || phoneRegex.test(phone), '올바른 전화번호 형식이 아닙니다'),
  
  email: z
    .string()
    .optional()
    .refine((email) => !email || emailRegex.test(email), '올바른 이메일 형식이 아닙니다'),
  
  address: z
    .string()
    .max(200, '주소는 200자를 초과할 수 없습니다')
    .optional(),
})

// 응급연락처 스키마
export const emergencyContactSchema = z.object({
  emergency_contact_name: z
    .string()
    .max(50, '응급연락처 이름은 50자를 초과할 수 없습니다')
    .optional(),
  
  emergency_contact_phone: z
    .string()
    .optional()
    .refine((phone) => !phone || phoneRegex.test(phone), '올바른 전화번호 형식이 아닙니다'),
  
  emergency_contact_relationship: z
    .string()
    .max(20, '관계는 20자를 초과할 수 없습니다')
    .optional(),
})

// 의료 정보 스키마
export const medicalInfoSchema = z.object({
  medical_history: z
    .string()
    .max(1000, '병력은 1000자를 초과할 수 없습니다')
    .optional(),
  
  allergies: z
    .array(z.string().max(50, '알레르기 항목은 50자를 초과할 수 없습니다'))
    .max(20, '알레르기 항목은 20개를 초과할 수 없습니다')
    .optional(),
  
  medications: z
    .array(z.string().max(100, '약물 항목은 100자를 초과할 수 없습니다'))
    .max(50, '약물 항목은 50개를 초과할 수 없습니다')
    .optional(),
  
  special_requirements: z
    .string()
    .max(500, '특별 요구사항은 500자를 초과할 수 없습니다')
    .optional(),
  
  notes: z
    .string()
    .max(1000, '메모는 1000자를 초과할 수 없습니다')
    .optional(),
})

// 환자 생성 스키마
export const patientCreateSchema = patientBaseSchema
  .merge(contactInfoSchema)
  .merge(emergencyContactSchema)
  .merge(medicalInfoSchema)
  .extend({
    admission_date: z
      .string()
      .refine((date) => {
        const admissionDate = new Date(date)
        const today = new Date()
        return admissionDate <= today
      }, '입원일은 오늘 날짜보다 이후일 수 없습니다'),
  })

// 환자 업데이트 스키마 (모든 필드가 선택적)
export const patientUpdateSchema = patientCreateSchema.partial()

// 환자 상태 스키마
export const patientStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'discharged', 'on_hold', 'transferred'], {
    errorMap: () => ({ message: '올바른 상태를 선택하세요' })
  }),
  status_notes: z
    .string()
    .max(500, '상태 메모는 500자를 초과할 수 없습니다')
    .optional(),
  discharge_date: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true
      const dischargeDate = new Date(date)
      const today = new Date()
      return dischargeDate <= today
    }, '퇴원일은 오늘 날짜보다 이후일 수 없습니다'),
})

// 사회복지사 배정 스키마
export const socialWorkerAssignmentSchema = z.object({
  patient_id: z.string().uuid('올바른 환자 ID가 아닙니다'),
  social_worker_id: z.string().uuid('올바른 사회복지사 ID가 아닙니다'),
})

// 검색 및 필터 스키마
export const patientSearchSchema = z.object({
  search: z.string().max(100, '검색어는 100자를 초과할 수 없습니다').optional(),
  status: z.enum(['active', 'inactive', 'discharged', 'on_hold', 'transferred']).optional(),
  social_worker_id: z.string().uuid().optional(),
  admission_date_from: z.string().optional(),
  admission_date_to: z.string().optional(),
  sort_by: z.enum(['created_at', 'full_name', 'admission_date', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// 타입 export
export type PatientCreateData = z.infer<typeof patientCreateSchema>
export type PatientUpdateData = z.infer<typeof patientUpdateSchema>
export type PatientStatusData = z.infer<typeof patientStatusSchema>
export type SocialWorkerAssignmentData = z.infer<typeof socialWorkerAssignmentSchema>
export type PatientSearchParams = z.infer<typeof patientSearchSchema>

// 검증 유틸리티 함수들
export const validatePatientData = {
  create: (data: unknown) => patientCreateSchema.parse(data),
  update: (data: unknown) => patientUpdateSchema.parse(data),
  status: (data: unknown) => patientStatusSchema.parse(data),
  assignment: (data: unknown) => socialWorkerAssignmentSchema.parse(data),
  search: (data: unknown) => patientSearchSchema.parse(data),
}

// 안전한 검증 함수들 (에러를 던지지 않고 result를 반환)
export const safeValidatePatientData = {
  create: (data: unknown) => patientCreateSchema.safeParse(data),
  update: (data: unknown) => patientUpdateSchema.safeParse(data),
  status: (data: unknown) => patientStatusSchema.safeParse(data),
  assignment: (data: unknown) => socialWorkerAssignmentSchema.safeParse(data),
  search: (data: unknown) => patientSearchSchema.safeParse(data),
}

// 커스텀 검증 함수들
export const customValidations = {
  // 환자 식별번호 중복 검사 (실제 구현에서는 서버에서 확인)
  isPatientIdUnique: async (): Promise<boolean> => {
    // 이것은 예시입니다. 실제로는 API 호출이 필요합니다.
    return true
  },
  
  // 나이 계산
  calculateAge: (dateOfBirth: string): number => {
    const birth = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  },
  
  // 입원 기간 계산
  calculateStayDuration: (admissionDate: string, dischargeDate?: string): number => {
    const admission = new Date(admissionDate)
    const end = dischargeDate ? new Date(dischargeDate) : new Date()
    const diffTime = Math.abs(end.getTime() - admission.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  },
  
  // 전화번호 포맷팅
  formatPhoneNumber: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
    }
    return phone
  },
  
  // 환자 식별번호 생성
  generatePatientId: (year: number = new Date().getFullYear()): string => {
    const randomNum = Math.floor(Math.random() * 999999) + 1
    return `P${year}${randomNum.toString().padStart(6, '0')}`
  }
} 