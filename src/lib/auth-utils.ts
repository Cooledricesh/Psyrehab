import { supabase } from './supabase'

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * 현재 사용자가 관리자인지 확인
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', user.id)
      .eq('role_id', 'd7fcf425-85bc-42b4-8806-917ef6939a40') // administrator role
      .maybeSingle()

    return !!data && !error
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * 현재 사용자가 특정 환자의 담당 사회복지사인지 확인
 */
export const isAssignedWorker = async (patientId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('patients')
      .select('primary_social_worker_id')
      .eq('id', patientId)
      .single()

    if (error || !data) return false

    return data.primary_social_worker_id === user.id
  } catch (error) {
    console.error('Error checking assigned worker:', error)
    return false
  }
}

/**
 * 현재 사용자가 환자를 수정할 수 있는지 확인
 */
export const canEditPatient = async (patientId: string): Promise<boolean> => {
  const [isAdmin, isAssigned] = await Promise.all([
    isCurrentUserAdmin(),
    isAssignedWorker(patientId)
  ])

  return isAdmin || isAssigned
}

/**
 * 환자 이관 권한 확인 (관리자만 가능)
 */
export const canTransferPatient = async (): Promise<boolean> => {
  return await isCurrentUserAdmin()
}
