import { supabase } from '@/lib/supabase'
import type { SocialWorker } from '@/types/database'

export interface SocialWorkerListParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  filters?: {
    search?: string
    status?: string
    specialization?: string
  }
}

export interface SocialWorkerListResponse {
  data: SocialWorker[]
  count: number
  total_pages: number
  current_page: number
  limit: number
}

export class SocialWorkerService {
  /**
   * 사회복지사 목록 조회 (페이지네이션 지원)
   */
  static async getSocialWorkers(params: SocialWorkerListParams = {}): Promise<SocialWorkerListResponse> {
    const {
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc',
      filters = {}
    } = params

    let query = supabase
      .from('social_workers')
      .select('*', { count: 'exact' })

    // 검색 필터
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    // 상태 필터
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    // 전문 분야 필터
    if (filters.specialization) {
      query = query.contains('specializations', [filters.specialization])
    }

    // 정렬
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`사회복지사 목록 조회 실패: ${error.message}`)
    }

    const total_pages = Math.ceil((count || 0) / limit)

    return {
      data: data || [],
      count: count || 0,
      total_pages,
      current_page: page,
      limit
    }
  }

  /**
   * 단일 사회복지사 조회
   */
  static async getSocialWorker(id: string): Promise<SocialWorker> {
    const { data, error } = await supabase
      .from('social_workers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`사회복지사 조회 실패: ${error.message}`)
    }

    if (!data) {
      throw new Error('사회복지사를 찾을 수 없습니다.')
    }

    return data
  }

  /**
   * 활성 사회복지사 목록 조회 (드롭다운용)
   */
  static async getActiveSocialWorkers(): Promise<SocialWorker[]> {
    const { data, error } = await supabase
      .from('social_workers')
      .select('id, full_name, email, specializations, workload')
      .eq('status', 'active')
      .order('full_name', { ascending: true })

    if (error) {
      throw new Error(`활성 사회복지사 목록 조회 실패: ${error.message}`)
    }

    return data || []
  }

  /**
   * 환자에게 사회복지사 배정
   */
  static async assignSocialWorkerToPatient(patientId: string, socialWorkerId: string): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .update({ 
        primary_social_worker_id: socialWorkerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)

    if (error) {
      throw new Error(`사회복지사 배정 실패: ${error.message}`)
    }
  }

  /**
   * 환자의 사회복지사 배정 해제
   */
  static async unassignSocialWorkerFromPatient(patientId: string): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .update({ 
        primary_social_worker_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)

    if (error) {
      throw new Error(`사회복지사 배정 해제 실패: ${error.message}`)
    }
  }

  /**
   * 사회복지사 업무량 통계 조회
   */
  static async getSocialWorkerWorkloadStats(): Promise<{
    socialWorkerId: string
    fullName: string
    assignedPatients: number
    activeGoals: number
    completedGoals: number
    pendingAssessments: number
  }[]> {
    const { data, error } = await supabase.rpc('get_social_worker_workload_stats')

    if (error) {
      throw new Error(`사회복지사 업무량 통계 조회 실패: ${error.message}`)
    }

    return data || []
  }

  /**
   * 특정 사회복지사의 담당 환자 목록 조회
   */
  static async getPatientsBySocialWorker(socialWorkerId: string): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        id,
        full_name,
        patient_identifier,
        status,
        admission_date,
        created_at
      `)
      .eq('primary_social_worker_id', socialWorkerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`담당 환자 목록 조회 실패: ${error.message}`)
    }

    return data || []
  }

  /**
   * 최적 사회복지사 추천 (업무량 기반)
   */
  static async getRecommendedSocialWorkers(limit: number = 3): Promise<SocialWorker[]> {
    // 활성 사회복지사 중 업무량이 적은 순으로 정렬
    const { data, error } = await supabase
      .from('social_workers')
      .select(`
        *,
        assigned_patients:patients(count)
      `)
      .eq('status', 'active')
      .order('workload', { ascending: true })
      .limit(limit)

    if (error) {
      throw new Error(`추천 사회복지사 조회 실패: ${error.message}`)
    }

    return data || []
  }
} 