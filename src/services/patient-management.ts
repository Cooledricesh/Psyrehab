import { supabase } from '@/lib/supabase'

// 환자 관리 관련 타입 정의
export interface Patient {
  id: string
  name: string
  age?: number
  birth_date?: string
  gender?: string
  diagnosis: string
  doctor?: string
  registration_date: string // 환자 등록일 (시스템 등록 시점)
  status: 'active' | 'inactive' | 'completed'
  contact_info?: string
  emergency_contact?: string
  hasActiveGoal?: boolean  // 활성 목표 유무 추가
  primary_social_worker_id?: string  // 담당 사회복지사 ID 추가
  social_worker?: {  // 담당 사회복지사 정보 추가
    user_id: string
    full_name: string
  }
}

export interface PatientStats {
  totalPatients: number
  activePatients: number
  inactivePatients: number
  completedPatients: number
}

// 환자 생성용 타입
export interface CreatePatientData {
  full_name: string
  patient_identifier?: string
  date_of_birth?: string
  gender?: string
  primary_diagnosis?: string
  doctor?: string
  contact_info?: unknown
  additional_info?: unknown
  status?: string
}

// 환자 목록 조회
export const getPatients = async (): Promise<Patient[]> => {
  try {
    // 환자 정보와 재활 목표를 함께 조회하여 진단 정보를 찾아보자
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        rehabilitation_goals (
          id,
          title,
          description,
          category_id,
          goal_type,
          plan_status,
          status
        ),
        social_worker:primary_social_worker_id (
          user_id,
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error occurred")
      return []
    }

    // 디버깅: 원본 데이터 구조 확인
    console.log('🔍 원본 환자 데이터 (첫 번째 환자):', data?.[0])
    console.log('🔍 모든 환자 데이터:', data)

    return data?.map((patient: unknown) => {
      // 활성 6개월 목표가 있는지 확인
      const hasActiveGoal = patient.rehabilitation_goals?.some((goal: unknown) => 
        goal.goal_type === 'six_month' && 
        goal.plan_status === 'active' && 
        goal.status === 'active'
      )

      // 각 환자별로 매핑 과정 로깅
      console.log(`📝 환자 ${patient.full_name} 매핑:`, {
        원본_성별: patient.gender,
        매핑된_성별: mapGender(patient.gender),
        원본_additional_info: patient.additional_info,
        재활목표들: patient.rehabilitation_goals,
        활성목표여부: hasActiveGoal,
        원본_전체: patient
      })

      return {
        id: patient.id?.toString() || '',
        name: patient.full_name || '이름 없음',
        age: patient.date_of_birth ? calculateAge(patient.date_of_birth) : undefined,
        birth_date: patient.date_of_birth,
        gender: mapGender(patient.gender),
        diagnosis: extractDiagnosis(patient),
        doctor: patient.doctor,
        registration_date: patient.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        status: mapPatientStatus(patient.status),
        contact_info: patient.contact_info,
        emergency_contact: patient.emergency_contact,
        hasActiveGoal: hasActiveGoal,
        primary_social_worker_id: patient.primary_social_worker_id,
        social_worker: patient.social_worker
      }
    }) || []
  } catch {
    console.error("Error occurred")
    return []
  }
}

// 환자 생성
export const createPatient = async (patientData: CreatePatientData): Promise<Patient | null> => {
  try {
    // 환자 식별번호가 없으면 자동 생성
    if (!patientData.patient_identifier) {
      patientData.patient_identifier = await generatePatientIdentifier()
    }

    const { data, error } = await supabase
      .from('patients')
      .insert([{
        full_name: patientData.full_name,
        patient_identifier: patientData.patient_identifier,
        date_of_birth: patientData.date_of_birth || null,
        gender: patientData.gender || null,
        doctor: patientData.doctor || null,
        contact_info: patientData.contact_info || null,
        additional_info: {
          ...patientData.additional_info,
          primary_diagnosis: patientData.primary_diagnosis || null
        },
        status: patientData.status || 'inactive',  // 기본값을 inactive로 변경
        primary_social_worker_id: null, // 나중에 설정 가능
      }])
      .select(`
        *,
        social_worker:primary_social_worker_id (
          user_id,
          full_name
        )
      `)
      .single()

    if (error) {
      console.error("Error occurred")
      throw new Error(error.message)
    }

    console.log('✅ 환자 생성 성공:', data)

    // 생성된 환자 데이터를 표준 형식으로 변환
    return {
      id: data.id?.toString() || '',
      name: data.full_name || '이름 없음',
      age: data.date_of_birth ? calculateAge(data.date_of_birth) : undefined,
      birth_date: data.date_of_birth,
      gender: mapGender(data.gender),
      diagnosis: extractDiagnosis(data),
      doctor: data.doctor,
      registration_date: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      status: mapPatientStatus(data.status),
      contact_info: data.contact_info,
      emergency_contact: data.emergency_contact
    }
  } catch {
    console.error("Error occurred")
    throw error
  }
}

// 환자 식별번호 자동 생성
const generatePatientIdentifier = async (): Promise<string> => {
  const year = new Date().getFullYear()
  const prefix = `P${year}`
  
  // 올해 생성된 환자 수 확인
  const { data, error } = await supabase
    .from('patients')
    .select('patient_identifier')
    .like('patient_identifier', `${prefix}%`)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.log('식별번호 생성 중 오류, 기본값 사용:', error)
    return `${prefix}001`
  }

  if (data && data.length > 0) {
    // 마지막 번호에서 1 증가
    const lastId = data[0].patient_identifier
    const lastNumber = parseInt(lastId.slice(-3)) || 0
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0')
    return `${prefix}${nextNumber}`
  } else {
    // 첫 번째 환자
    return `${prefix}001`
  }
}

// 성별 매핑 함수 - 다양한 형태의 성별 값을 표준화
const mapGender = (gender: unknown): string => {
  if (!gender) {
    console.log('🚫 성별 정보 없음 (null/undefined)')
    return '정보 없음'
  }
  
  const genderStr = String(gender).toLowerCase().trim()
  console.log(`🔍 성별 매핑 시도: "${gender}" -> "${genderStr}"`)
  
  // 남성 패턴들
  if (['male', 'm', '남성', '남', 'man', '1'].includes(genderStr)) {
    console.log(`✅ 남성으로 매핑됨`)
    return 'male'
  }
  
  // 여성 패턴들
  if (['female', 'f', '여성', '여', 'woman', '2'].includes(genderStr)) {
    console.log(`✅ 여성으로 매핑됨`)
    return 'female'
  }
  
  // 기타
  if (['other', '기타', '0'].includes(genderStr)) {
    console.log(`✅ 기타로 매핑됨`)
    return 'other'
  }
  
  console.log(`❌ 알 수 없는 성별 값: "${gender}"`)
  return '정보 없음'
}

// 진단 정보 추출 함수 - 여러 소스에서 진단 정보 찾기
const extractDiagnosis = (patient: unknown): string => {
  console.log(`🔍 진단 정보 추출 시도 - 환자: ${patient.full_name}`)
  
  // 1. 직접 컬럼들 확인
  if (patient.diagnosis) {
    console.log(`✅ patient.diagnosis에서 발견: ${patient.diagnosis}`)
    return patient.diagnosis
  }
  
  if (patient.primary_diagnosis) {
    console.log(`✅ patient.primary_diagnosis에서 발견: ${patient.primary_diagnosis}`)
    return patient.primary_diagnosis
  }
  
  // 2. additional_info JSON에서 찾기
  if (patient.additional_info) {
    const additionalInfo = typeof patient.additional_info === 'string' 
      ? JSON.parse(patient.additional_info) 
      : patient.additional_info
    
    console.log(`🔍 additional_info 내용:`, additionalInfo)
    
    if (additionalInfo?.diagnosis) {
      console.log(`✅ additional_info.diagnosis에서 발견: ${additionalInfo.diagnosis}`)
      return additionalInfo.diagnosis
    }
    
    if (additionalInfo?.primary_diagnosis) {
      console.log(`✅ additional_info.primary_diagnosis에서 발견: ${additionalInfo.primary_diagnosis}`)
      return additionalInfo.primary_diagnosis
    }
    
    if (additionalInfo?.medical_history) {
      console.log(`✅ additional_info.medical_history에서 발견: ${additionalInfo.medical_history}`)
      return additionalInfo.medical_history
    }
    
    if (additionalInfo?.notes) {
      console.log(`✅ additional_info.notes에서 발견: ${additionalInfo.notes}`)
      return additionalInfo.notes
    }
  }
  
  // 3. 재활 목표에서 유추하기
  if (patient.rehabilitation_goals && patient.rehabilitation_goals.length > 0) {
    const goalTitles = patient.rehabilitation_goals.map((g: unknown) => g.title).join(', ')
    console.log(`🎯 재활 목표에서 유추: ${goalTitles}`)
    
    // 일반적인 정신건강 진단명 패턴 찾기
    const commonDiagnoses = ['우울증', '조현병', '양극성', '불안장애', '사회불안', 'PTSD', '강박장애']
    
    for (const diagnosis of commonDiagnoses) {
      if (goalTitles.includes(diagnosis)) {
        console.log(`✅ 재활 목표에서 진단 유추: ${diagnosis}`)
        return `${diagnosis} (목표 기반 추정)`
      }
    }
    
    return `진단명 확인 필요 (재활 목표: ${goalTitles.substring(0, 50)}...)`
  }

  console.log(`❌ 진단 정보를 찾을 수 없음`)
  return '진단 정보 없음'
}

// 환자 통계 조회
export const getPatientStats = async (): Promise<PatientStats> => {
  try {
    // 모든 환자 조회
    const { data: allPatients, error: allPatientsError } = await supabase
      .from('patients')
      .select('id, status, additional_info')

    if (allPatientsError) {
      console.error('Error fetching all patients:', allPatientsError)
      return {
        totalPatients: 0,
        activePatients: 0,
        inactivePatients: 0,
        completedPatients: 0
      }
    }

    // active/inactive 환자만 필터링 (discharged 제외)
    const activeInactivePatients = allPatients?.filter(p => 
      p.status === 'active' || p.status === 'inactive'
    ) || []

    // 활성 목표가 있는 환자 조회
    const { data: activeGoals, error: goalsError } = await supabase
      .from('rehabilitation_goals')
      .select('patient_id')
      .eq('goal_type', 'six_month')
      .eq('plan_status', 'active')
      .eq('status', 'active')

    if (goalsError) {
      console.error('Error fetching active goals:', goalsError)
    }

    // 입원 중인 환자 (status가 discharged인 환자)
    const dischargedPatients = allPatients?.filter(p => p.status === 'discharged') || []

    // 목표가 있는 환자 ID 목록
    const patientsWithGoals = new Set(activeGoals?.map(g => g.patient_id) || [])

    // 통계 계산
    const totalPatients = allPatients?.length || 0
    const activePatients = activeInactivePatients.filter(p => patientsWithGoals.has(p.id)).length  // 목표가 있는 환자
    const inactivePatients = activeInactivePatients.filter(p => !patientsWithGoals.has(p.id)).length  // 목표가 없는 환자
    const completedPatients = dischargedPatients.length  // 입원 중인 환자 (discharged 상태)

    console.log('📊 환자 통계:', {
      전체: totalPatients,
      목표진행중: activePatients,
      목표설정대기: inactivePatients,
      입원중: completedPatients
    })

    return {
      totalPatients,
      activePatients,
      inactivePatients,
      completedPatients
    }
  } catch {
    console.error("Error occurred")
    return {
      totalPatients: 0,
      activePatients: 0,
      inactivePatients: 0,
      completedPatients: 0
    }
  }
}

// 특정 환자 상세 정보 조회
export const getPatientById = async (patientId: string): Promise<Patient | null> => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        rehabilitation_goals (
          title,
          description,
          category_id
        ),
        social_worker:primary_social_worker_id (
          user_id,
          full_name
        )
      `)
      .eq('id', patientId)
      .single()

    if (error || !data) {
      console.error("Error occurred")
      return null
    }

    return {
      id: data.id?.toString() || '',
      name: data.full_name || '이름 없음',
      age: data.date_of_birth ? calculateAge(data.date_of_birth) : undefined,
      birth_date: data.date_of_birth,
      gender: mapGender(data.gender),
      diagnosis: extractDiagnosis(data),
      doctor: data.doctor,
      registration_date: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      status: mapPatientStatus(data.status),
      contact_info: data.contact_info,
      emergency_contact: data.emergency_contact,
      primary_social_worker_id: data.primary_social_worker_id,
      social_worker: data.social_worker
    }
  } catch {
    console.error("Error occurred")
    return null
  }
}

// 유틸리티 함수들
const calculateAge = (birthDate: string): number => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDifference = today.getMonth() - birth.getMonth()
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

const mapPatientStatus = (dbStatus: string): 'active' | 'inactive' | 'completed' => {
  switch (dbStatus) {
    case 'active':
      return 'active'
    case 'inactive':
      return 'inactive'
    case 'discharged':
      return 'completed'  // discharged를 completed로 매핑
    case 'on_hold':
    case 'transferred':
      return 'completed'
    default:
      return 'active'
  }
}

// 환자 정보 수정 (새로 추가되는 함수)
export const updatePatient = async (patientId: string, patientData: CreatePatientData): Promise<Patient | null> => {
  try {
    console.log('🔄 환자 정보 수정 시작:', patientId, patientData)

    // 업데이트할 데이터 준비 (status 제외 - 별도 관리)
    const updateData: unknown = {}
    
    if (patientData.full_name) updateData.full_name = patientData.full_name
    if (patientData.date_of_birth !== undefined) updateData.date_of_birth = patientData.date_of_birth
    if (patientData.gender !== undefined) updateData.gender = patientData.gender
    if (patientData.doctor !== undefined) updateData.doctor = patientData.doctor
    if (patientData.contact_info !== undefined) updateData.contact_info = patientData.contact_info
    // status는 check constraint 문제로 인해 업데이트에서 제외
    // if (patientData.status !== undefined) updateData.status = patientData.status
    
    // additional_info 업데이트 (진단 정보 포함)
    if (patientData.primary_diagnosis || patientData.additional_info) {
      updateData.additional_info = {
        ...patientData.additional_info,
        primary_diagnosis: patientData.primary_diagnosis || null
      }
    }

    console.log('📝 업데이트할 데이터:', updateData)
    console.log('🔍 업데이트 시도 중인 status:', patientData.status)

    const { data, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', patientId)
      .select(`
        *,
        rehabilitation_goals (
          title,
          description,
          category_id
        )
      `)
      .single()

    if (error) {
      console.error("Error occurred")
      throw new Error(error.message)
    }

    console.log('✅ 환자 정보 수정 성공:', data)

    // 수정된 환자 데이터를 표준 형식으로 변환 (기존 로직 재사용)
    return {
      id: data.id?.toString() || '',
      name: data.full_name || '이름 없음',
      age: data.date_of_birth ? calculateAge(data.date_of_birth) : undefined,
      birth_date: data.date_of_birth,
      gender: mapGender(data.gender),
      diagnosis: extractDiagnosis(data),
      doctor: data.doctor,
      registration_date: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      status: mapPatientStatus(data.status),
      contact_info: data.contact_info,
      emergency_contact: data.emergency_contact
    }
  } catch {
    console.error("Error occurred")
    throw error
  }
}

// 환자 상태 변경 (간단한 버전)
export const updatePatientStatus = async (
  patientId: string, 
  newStatus: 'active' | 'inactive' | 'discharged'
): Promise<Patient | null> => {
  try {
    console.log('🔄 환자 상태 변경 시작:', { patientId, newStatus })

    const { data, error } = await supabase
      .from('patients')
      .update({ status: newStatus })
      .eq('id', patientId)
      .select(`
        *,
        rehabilitation_goals (
          title,
          description,
          category_id
        )
      `)
      .single()

    if (error) {
      console.error("Error occurred")
      throw new Error(error.message)
    }

    console.log('✅ 환자 상태 변경 성공:', data)

    // 변경된 환자 데이터를 표준 형식으로 변환
    return {
      id: data.id?.toString() || '',
      name: data.full_name || '이름 없음',
      age: data.date_of_birth ? calculateAge(data.date_of_birth) : undefined,
      birth_date: data.date_of_birth,
      gender: mapGender(data.gender),
      diagnosis: extractDiagnosis(data),
      doctor: data.doctor,
      registration_date: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      status: mapPatientStatus(data.status),
      contact_info: data.contact_info,
      emergency_contact: data.emergency_contact
    }
  } catch {
    console.error("Error occurred")
    throw error
  }
}

// 환자와 연관된 모든 데이터 확인
export const checkPatientRelatedData = async (patientId: string) => {
  try {
    console.log('🔍 환자 연관 데이터 확인 시작:', patientId)

    const relatedTables = [
      { table: 'ai_goal_recommendations', name: 'AI 목표 추천' },
      { table: 'assessment_milestones', name: '평가 마일스톤' },
      { table: 'assessments', name: '평가 기록' },
      { table: 'detailed_assessments', name: '상세 평가' },
      { table: 'patient_transfer_log', name: '환자 이관 로그' },
      { table: 'progress_insights', name: '진행 인사이트' },
      { table: 'rehabilitation_goals', name: '재활 목표' },
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

    // AI 추천 아카이빙 데이터도 확인 (간접 연관)
    const { count: archiveCount, error: archiveError } = await supabase
      .from('ai_recommendation_archive')
      .select('*', { count: 'exact', head: true })
      .eq('original_assessment_id', patientId) // assessment_id로 연결된 아카이빙 데이터

    if (!archiveError && archiveCount && archiveCount > 0) {
      relatedData.push({ 
        table: 'ai_recommendation_archive', 
        name: 'AI 추천 아카이빙', 
        count: archiveCount 
      })
    }

    console.log('📊 연관 데이터 결과:', relatedData)
    return relatedData

  } catch (error) {
    console.error('❌ 연관 데이터 확인 실패:', error)
    throw error
  }
}

// 환자 삭제 (연관 데이터 포함)
export const deletePatient = async (patientId: string, forceDelete: boolean = false): Promise<void> => {
  try {
    console.log('🗑️ 환자 삭제 시작:', { patientId, forceDelete })

    // 1. 연관된 데이터 확인
    const relatedData = await checkPatientRelatedData(patientId)

    // 2. 연관된 데이터가 있고 강제 삭제가 아닌 경우 에러
    if (relatedData.length > 0 && !forceDelete) {
      const dataList = relatedData.map(item => `${item.count}개의 ${item.name}`).join(', ')
      throw new Error(`이 환자와 연결된 데이터가 있어 삭제할 수 없습니다: ${dataList}`)
    }

    // 3. 강제 삭제인 경우 연관 데이터부터 삭제
    if (forceDelete && relatedData.length > 0) {
      console.log('🧹 연관 데이터 삭제 시작...')
      
      for (const { table } of relatedData) {
        if (table === 'ai_recommendation_archive') {
          // AI 추천 아카이빙은 assessment_id로 연결됨
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('original_assessment_id', patientId)

          if (error) {
            console.error(`${table} 삭제 실패:`, error)
            throw new Error(`연관 데이터 삭제 실패: ${table}`)
          }
        } else {
          // 다른 테이블들은 patient_id로 연결됨
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('patient_id', patientId)

          if (error) {
            console.error(`${table} 삭제 실패:`, error)
            throw new Error(`연관 데이터 삭제 실패: ${table}`)
          }
        }
        
        console.log(`✅ ${table} 데이터 삭제 완료`)
      }
    }

    // 4. 환자 삭제
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)

    if (deleteError) {
      console.error('환자 삭제 실패:', deleteError)
      
      // 외래키 제약 조건 오류 처리
      if (deleteError.code === '23503' || deleteError.message.includes('violates foreign key constraint')) {
        throw new Error('연결된 데이터로 인해 환자를 삭제할 수 없습니다. 먼저 관련 데이터를 정리해주세요.')
      }
      
      throw new Error(deleteError.message)
    }

    console.log('✅ 환자 삭제 성공:', patientId)

  } catch (error) {
    console.error('❌ 환자 삭제 실패:', error)
    throw error
  }
}