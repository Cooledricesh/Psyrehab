import { supabase } from '@/lib/supabase'
import { 
  safeValidatePatientData
} from '@/lib/validations/patient-validation'
import { parseError, logError } from '@/lib/error-handling'
import type { TablesInsert, TablesUpdate } from '@/types/database'

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
    // 먼저 환자 정보만 가져오기
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    if (patientError) {
      throw new Error(`환자 정보를 가져오는 중 오류가 발생했습니다: ${patientError.message}`)
    }

    // 담당 사회복지사 정보가 있으면 별도로 조회
    if (patientData?.primary_social_worker_id) {
      const { data: socialWorkerData, error: socialWorkerError } = await supabase
        .from('social_workers')
        .select('user_id, full_name, employee_id, department, contact_number')
        .eq('user_id', patientData.primary_social_worker_id)
        .single()

      if (!socialWorkerError && socialWorkerData) {
        patientData.primary_social_worker = socialWorkerData
      }
    }

    return patientData
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

  // 환자 삭제 (실제 삭제)
  static async deletePatient(id: string, forceDelete: boolean = false) {
    try {
      // 1. 연관된 데이터 확인
      const relatedData = await this.checkPatientRelatedData(id)

      // 2. 연관된 데이터가 있고 강제 삭제가 아닌 경우 에러
      if (relatedData.length > 0 && !forceDelete) {
        const dataList = relatedData.map(item => `${item.count}개의 ${item.name}`).join(', ')
        throw new Error(`이 환자와 연결된 데이터가 있어 삭제할 수 없습니다: ${dataList}`)
      }

      // 3. 강제 삭제인 경우 연관 데이터부터 삭제
      if (forceDelete && relatedData.length > 0) {
        for (const { table } of relatedData) {
          if (table === 'ai_recommendation_archive') {
            // AI 추천 아카이빙은 assessment_id로 연결됨
            const { error } = await supabase
              .from(table)
              .delete()
              .eq('original_assessment_id', id)

            if (error) {
              throw new Error(`연관 데이터 삭제 실패: ${table}`)
            }
          } else if (table === 'rehabilitation_goals') {
            // 재활 목표는 진행 중인 것만 삭제 (완료된 목표는 보존)
            const { error } = await supabase
              .from(table)
              .delete()
              .eq('patient_id', id)
              .neq('status', 'completed')

            if (error) {
              throw new Error(`진행 중인 재활 목표 삭제 실패`)
            }
          } else {
            // 다른 테이블들은 patient_id로 연결됨
            const { error } = await supabase
              .from(table)
              .delete()
              .eq('patient_id', id)

            if (error) {
              throw new Error(`연관 데이터 삭제 실패: ${table}`)
            }
          }
        }
      }

      // 4. 환자 삭제
      const { error: deleteError } = await supabase
        .from('patients')
        .delete()
        .eq('id', id)

      if (deleteError) {
        // 외래키 제약 조건 오류 처리
        if (deleteError.code === '23503' || deleteError.message.includes('violates foreign key constraint')) {
          throw new Error('연결된 데이터로 인해 환자를 삭제할 수 없습니다. 먼저 관련 데이터를 정리해주세요.')
        }
        
        throw new Error(deleteError.message)
      }

      return { success: true }
    } catch (error) {
      throw error
    }
  }

  // 환자와 연관된 모든 데이터 확인
  static async checkPatientRelatedData(patientId: string) {
    const relatedTables = [
      { table: 'ai_goal_recommendations', name: 'AI 목표 추천' },
      { table: 'assessment_milestones', name: '평가 마일스톤' },
      { table: 'assessments', name: '평가 기록' },
      { table: 'detailed_assessments', name: '상세 평가' },
      { table: 'patient_transfer_log', name: '환자 이관 로그' },
      { table: 'progress_insights', name: '진행 인사이트' },
      { table: 'service_records', name: '서비스 기록' }
    ]

    const relatedData = []
    
    for (const { table, name } of relatedTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId)

      if (error) {
        console.error(`${table} 조회 실패:`, error)
        continue
      }

      if (count && count > 0) {
        relatedData.push({ table, name, count })
      }
    }

    // 진행 중인 재활 목표만 확인 (완료된 목표는 보존)
    const { count: activeGoalCount, error: goalError } = await supabase
      .from('rehabilitation_goals')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .neq('status', 'completed')

    if (!goalError && activeGoalCount && activeGoalCount > 0) {
      relatedData.push({ 
        table: 'rehabilitation_goals', 
        name: '진행 중인 재활 목표', 
        count: activeGoalCount 
      })
    }

    // AI 추천 아카이빙 데이터도 확인 (간접 연관)
    const { count: archiveCount, error: archiveError } = await supabase
      .from('ai_recommendation_archive')
      .select('*', { count: 'exact', head: true })
      .eq('original_assessment_id', patientId)

    if (!archiveError && archiveCount && archiveCount > 0) {
      relatedData.push({ 
        table: 'ai_recommendation_archive', 
        name: 'AI 추천 아카이빙', 
        count: archiveCount 
      })
    }

    return relatedData
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
    try {
      // 퇴원 처리인 경우, 활성 목표들을 완전 삭제
      if (status === 'discharged') {
        // 해당 환자의 모든 미완료 목표를 조회
        const { data: activeGoals, error: goalsError } = await supabase
          .from('rehabilitation_goals')
          .select('id, goal_type, status')
          .eq('patient_id', id)
          .in('status', ['active', 'pending'])

        if (goalsError) {
          console.error('활성 목표 조회 중 오류:', goalsError)
        } else if (activeGoals && activeGoals.length > 0) {
          // 모든 미완료 목표를 삭제
          const { error: deleteError } = await supabase
            .from('rehabilitation_goals')
            .delete()
            .in('id', activeGoals.map(goal => goal.id))

          if (deleteError) {
            console.error('목표 삭제 중 오류:', deleteError)
            throw new Error('퇴원 처리 중 목표 정리에 실패했습니다.')
          }

        }
      }

      // 환자 상태 변경
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
    } catch (err) {
      console.error('updatePatientStatus 오류:', err)
      throw err
    }
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
      pending: stats.pending || 0,
      discharged: stats.discharged || 0
    }
  }

  // 활성 목표가 없는 환자 목록 조회
  static async getPatientsWithoutActiveGoals() {
    try {
      // 먼저 모든 환자를 가져옵니다
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (patientsError) {
        throw new Error(`환자 목록을 가져오는 중 오류가 발생했습니다: ${patientsError.message}`)
      }

      if (!patients || patients.length === 0) {
        return []
      }

      // 각 환자의 활성 목표 여부를 확인합니다
      const patientsWithGoalStatus = await Promise.all(
        patients.map(async (patient) => {
          const { data: activeGoals, error: goalsError } = await supabase
            .from('rehabilitation_goals')
            .select('id')
            .eq('patient_id', patient.id)
            .eq('goal_type', 'six_month')
            .in('status', ['active', 'pending'])
            .limit(1)

          if (goalsError) {
            console.error(`환자 ${patient.id}의 목표 조회 오류:`, goalsError)
            return null
          }

          // 활성 목표가 없는 환자만 반환
          return activeGoals && activeGoals.length === 0 ? patient : null
        })
      )

      // null이 아닌 환자들만 필터링하여 반환
      return patientsWithGoalStatus.filter((patient) => patient !== null)
    } catch (error) {
      console.error("Error occurred:", error)
      throw error
    }
  }
} 