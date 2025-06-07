// Service Records service functions
import { supabase } from '@/lib/supabase'
import type { ServiceRecordWithDetails } from '@/types/database'

// Temporary types until Supabase types are properly generated
type TablesInsert<T extends string> = any
type TablesUpdate<T extends string> = any

// Get service records for a patient
export async function getPatientServiceRecords(patientId: string) {
  const { data, error } = await supabase
    .from('service_records')
    .select(`
      *,
      patient:patients!service_records_patient_id_fkey(
        id,
        patient_identifier,
        full_name
      ),
      social_worker:social_workers!service_records_social_worker_id_fkey(
        user_id,
        full_name,
        employee_id,
        department
      )
    `)
    .eq('patient_id', patientId)
    .order('service_date_time', { ascending: false })

  if (error) throw error
  return data
}

// Get service records for a social worker
export async function getSocialWorkerServiceRecords(socialWorkerId: string) {
  const { data, error } = await supabase
    .from('service_records')
    .select(`
      *,
      patient:patients!service_records_patient_id_fkey(
        id,
        patient_identifier,
        full_name
      )
    `)
    .eq('social_worker_id', socialWorkerId)
    .order('service_date_time', { ascending: false })

  if (error) throw error
  return data
}

// Get service records with filters
export async function getServiceRecords(filters: {
  patientId?: string
  socialWorkerId?: string
  serviceType?: string
  serviceCategory?: string
  isGroupSession?: boolean
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}) {
  let query = supabase
    .from('service_records')
    .select(`
      *,
      patient:patients!service_records_patient_id_fkey(
        id,
        patient_identifier,
        full_name
      ),
      social_worker:social_workers!service_records_social_worker_id_fkey(
        user_id,
        full_name,
        employee_id,
        department
      )
    `)

  // Apply filters
  if (filters.patientId) {
    query = query.eq('patient_id', filters.patientId)
  }
  if (filters.socialWorkerId) {
    query = query.eq('social_worker_id', filters.socialWorkerId)
  }
  if (filters.serviceType) {
    query = query.eq('service_type', filters.serviceType)
  }
  if (filters.serviceCategory) {
    query = query.eq('service_category', filters.serviceCategory)
  }
  if (filters.isGroupSession !== undefined) {
    query = query.eq('is_group_session', filters.isGroupSession)
  }
  if (filters.dateFrom) {
    query = query.gte('service_date_time', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('service_date_time', filters.dateTo)
  }

  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit)
  }
  if (filters.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
  }

  query = query.order('service_date_time', { ascending: false })

  const { data, error } = await query

  if (error) throw error
  return data
}

// Get a specific service record with details
export async function getServiceRecordWithDetails(serviceRecordId: string): Promise<ServiceRecordWithDetails | null> {
  const { data, error } = await supabase
    .from('service_records')
    .select(`
      *,
      patient:patients!service_records_patient_id_fkey(
        id,
        patient_identifier,
        full_name,
        date_of_birth,
        gender,
        status
      ),
      social_worker:social_workers!service_records_social_worker_id_fkey(
        user_id,
        full_name,
        employee_id,
        department,
        contact_number
      )
    `)
    .eq('id', serviceRecordId)
    .single()

  if (error) throw error
  return data
}

// Create a new service record
export async function createServiceRecord(serviceRecord: TablesInsert<'service_records'>) {
  const { data, error } = await supabase
    .from('service_records')
    .insert(serviceRecord)
    .select(`
      *,
      patient:patients!service_records_patient_id_fkey(
        id,
        patient_identifier,
        full_name
      ),
      social_worker:social_workers!service_records_social_worker_id_fkey(
        user_id,
        full_name,
        employee_id
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Update a service record
export async function updateServiceRecord(id: string, updates: TablesUpdate<'service_records'>) {
  const { data, error } = await supabase
    .from('service_records')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      patient:patients!service_records_patient_id_fkey(
        id,
        patient_identifier,
        full_name
      ),
      social_worker:social_workers!service_records_social_worker_id_fkey(
        user_id,
        full_name,
        employee_id
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Delete a service record
export async function deleteServiceRecord(id: string) {
  const { error } = await supabase
    .from('service_records')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get service statistics for a patient
export async function getPatientServiceStatistics(patientId: string) {
  const { data, error } = await supabase
    .from('service_records')
    .select('id, service_type, service_category, duration_minutes, is_group_session, service_date_time')
    .eq('patient_id', patientId)

  if (error) throw error

  if (!data || data.length === 0) {
    return {
      total_services: 0,
      total_duration: 0,
      average_duration: 0,
      service_types: {},
      service_categories: {},
      individual_sessions: 0,
      group_sessions: 0,
      last_service_date: null,
    }
  }

  const stats = {
    total_services: data.length,
    total_duration: data.reduce((sum, record) => sum + (record.duration_minutes || 0), 0),
    average_duration: Math.round(
      data.reduce((sum, record) => sum + (record.duration_minutes || 0), 0) / data.length
    ),
    service_types: data.reduce((acc, record) => {
      acc[record.service_type] = (acc[record.service_type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    service_categories: data.reduce((acc, record) => {
      if (record.service_category) {
        acc[record.service_category] = (acc[record.service_category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>),
    individual_sessions: data.filter(record => !record.is_group_session).length,
    group_sessions: data.filter(record => record.is_group_session).length,
    last_service_date: data.sort((a, b) => 
      new Date(b.service_date_time).getTime() - new Date(a.service_date_time).getTime()
    )[0]?.service_date_time || null,
  }

  return stats
}

// Get service statistics for a social worker
export async function getSocialWorkerServiceStatistics(socialWorkerId: string, dateFrom?: string, dateTo?: string) {
  let query = supabase
    .from('service_records')
    .select('id, patient_id, service_type, service_category, duration_minutes, is_group_session, service_date_time')
    .eq('social_worker_id', socialWorkerId)

  if (dateFrom) {
    query = query.gte('service_date_time', dateFrom)
  }
  if (dateTo) {
    query = query.lte('service_date_time', dateTo)
  }

  const { data, error } = await query

  if (error) throw error

  if (!data || data.length === 0) {
    return {
      total_services: 0,
      unique_patients: 0,
      total_duration: 0,
      average_duration: 0,
      service_types: {},
      service_categories: {},
      individual_sessions: 0,
      group_sessions: 0,
    }
  }

  const uniquePatients = new Set(data.map(record => record.patient_id)).size

  const stats = {
    total_services: data.length,
    unique_patients: uniquePatients,
    total_duration: data.reduce((sum, record) => sum + (record.duration_minutes || 0), 0),
    average_duration: Math.round(
      data.reduce((sum, record) => sum + (record.duration_minutes || 0), 0) / data.length
    ),
    service_types: data.reduce((acc, record) => {
      acc[record.service_type] = (acc[record.service_type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    service_categories: data.reduce((acc, record) => {
      if (record.service_category) {
        acc[record.service_category] = (acc[record.service_category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>),
    individual_sessions: data.filter(record => !record.is_group_session).length,
    group_sessions: data.filter(record => record.is_group_session).length,
  }

  return stats
}

// Get recent service records (for dashboard)
export async function getRecentServiceRecords(limit = 10) {
  const { data, error } = await supabase
    .from('service_records')
    .select(`
      *,
      patient:patients!service_records_patient_id_fkey(
        patient_identifier,
        full_name
      ),
      social_worker:social_workers!service_records_social_worker_id_fkey(
        full_name,
        employee_id
      )
    `)
    .order('service_date_time', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
} 