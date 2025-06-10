import { supabase } from '@/lib/supabase'
import { 
  safeValidatePatientData,
  customValidations
} from '@/lib/validations/patient-validation'
import { parseError, logError } from '@/lib/error-handling'
import type { Patient, TablesInsert, TablesUpdate } from '@/types/database'

export interface PatientCreateData {
  full_name: string
  patient_identifier: string
  date_of_birth?: string
  gender?: string
  contact_info?: {
    phone?: string
    email?: string
    address?: string
    emergency_contact?: {
      name: string
      relationship: string
      phone: string
    }
  }
  additional_info?: {
    medical_history?: string
    allergies?: string[]
    medications?: string[]
    special_needs?: string
    notes?: string
  }
  primary_social_worker_id?: string
  admission_date?: string
  status?: string
}

export interface PatientUpdateData {
  full_name?: string
  patient_identifier?: string
  date_of_birth?: string
  gender?: string
  contact_info?: object
  additional_info?: object
  primary_social_worker_id?: string
  admission_date?: string
  status?: string
}

export interface PatientSearchFilters {
  search?: string
  status?: string
  social_worker_id?: string
  date_from?: string
  date_to?: string
}

export interface PatientListParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  filters?: PatientSearchFilters
}

export class PatientService {
  // 환자 목록 조회
  static async getPatients(params: PatientListParams = {}) {
    const {
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc',
      filters = {}
    } = params

    let query = supabase
      .from('patients')
      .select('*')

    // 검색 필터 적용
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,patient_identifier.ilike.%${filters.search}%`)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.social_worker_id) {
      query = query.eq('primary_social_worker_id', filters.social_worker_id)
    }

    if (filters.date_from) {
      query = query.gte('admission_date', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('admission_date', filters.date_to)
    }

    // 정렬 및 페이지네이션
    query = query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range((page - 1) * limit, page * limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`환자 목록을 가져오는 중 오류가 발생했습니다: ${error.message}`)
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    }
  }

  // 환자 상세 조회
  static async getPatient(id: string) {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        primary_social_worker:social_workers!primary_social_worker_id(
          id,
          full_name,
          employee_id,
          department,
          contact_number
        ),
        assessments(
          id,
          assessment_date,
          motivation_level,
          focus_time,
          social_preference
        ),
        rehabilitation_goals(
          id,
          title,
          goal_type,
          status,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`환자 정보를 가져오는 중 오류가 발생했습니다: ${error.message}`)
    }

    return data
  }

  // 환자 등록
  static async createPatient(patientData: PatientCreateData) {
    try {
      // 데이터 검증
      const validationResult = safeValidatePatientData.create(patientData)
      if (!validationResult.success) {
        const appError = parseError(validationResult.error)
        logError(appError, 'PatientService.createPatient - validation')
        throw validationResult.error
      }

      // 환자 식별번호 중복 확인
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('patient_identifier', patientData.patient_identifier)
        .single()

      if (existingPatient) {
        const error = new Error('이미 존재하는 환자 식별번호입니다.')
        const appError = parseError(error)
        logError(appError, 'PatientService.createPatient - duplicate identifier')
        throw error
      }

      const insertData: TablesInsert<'patients'> = {
        full_name: patientData.full_name,
        patient_identifier: patientData.patient_identifier,
        date_of_birth: patientData.date_of_birth || null,
        gender: patientData.gender || null,
        contact_info: patientData.contact_info || null,
        additional_info: patientData.additional_info || null,
        primary_social_worker_id: patientData.primary_social_worker_id || null,
        admission_date: patientData.admission_date || null,
        status: patientData.status || 'active'
      }

      const { data, error } = await supabase
        .from('patients')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        const appError = parseError(error)
        logError(appError, 'PatientService.createPatient - database insert')
        throw new Error(`환자 등록 중 오류가 발생했습니다: ${error.message}`)
      }

      return data
    } catch (error) {
      const appError = parseError(error)
      logError(appError, 'PatientService.createPatient')
      throw error
    }
  }

  // 환자 정보 수정
  static async updatePatient(id: string, updateData: PatientUpdateData) {
    try {
      // 데이터 검증
      const validationResult = safeValidatePatientData.update(updateData)
      if (!validationResult.success) {
        const appError = parseError(validationResult.error)
        logError(appError, 'PatientService.updatePatient - validation')
        throw validationResult.error
      }

      // 환자 식별번호 중복 확인 (자신 제외)
      if (updateData.patient_identifier) {
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id')
          .eq('patient_identifier', updateData.patient_identifier)
          .neq('id', id)
          .single()

        if (existingPatient) {
          const error = new Error('이미 존재하는 환자 식별번호입니다.')
          const appError = parseError(error)
          logError(appError, 'PatientService.updatePatient - duplicate identifier')
          throw error
        }
      }

      const updatePayload: TablesUpdate<'patients'> = {
        ...updateData,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('patients')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        const appError = parseError(error)
        logError(appError, 'PatientService.updatePatient - database update')
        throw new Error(`환자 정보 수정 중 오류가 발생했습니다: ${error.message}`)
      }

      return data
    } catch (error) {
      const appError = parseError(error)
      logError(appError, 'PatientService.updatePatient')
      throw error
    }
  }

  // 환자 삭제 (소프트 삭제 - 상태를 inactive로 변경)
  static async deletePatient(id: string) {
    const { data, error } = await supabase
      .from('patients')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`환자 삭제 중 오류가 발생했습니다: ${error.message}`)
    }

    return data
  }

  // 사회복지사 배정
  static async assignSocialWorker(patientId: string, socialWorkerId: string) {
    const { data, error } = await supabase
      .from('patients')
      .update({ 
        primary_social_worker_id: socialWorkerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)
      .select()
      .single()

    if (error) {
      throw new Error(`사회복지사 배정 중 오류가 발생했습니다: ${error.message}`)
    }

    return data
  }

  // 환자 상태 변경
  static async updatePatientStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('patients')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`환자 상태 변경 중 오류가 발생했습니다: ${error.message}`)
    }

    return data
  }

  // 환자 통계 조회
  static async getPatientStats() {
    const { data, error } = await supabase
      .from('patients')
      .select('status')

    if (error) {
      throw new Error(`환자 통계를 가져오는 중 오류가 발생했습니다: ${error.message}`)
    }

    const stats = data.reduce((acc, patient) => {
      acc[patient.status] = (acc[patient.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: data.length,
      active: stats.active || 0,
      inactive: stats.inactive || 0,
      discharged: stats.discharged || 0
    }
  }
} 