// Assessment service functions
import { supabase } from '@/lib/supabase'
import type { AssessmentWithRecommendations } from '@/types/database'

// Temporary types until Supabase types are properly generated
type TablesInsert<T extends string> = any
type TablesUpdate<T extends string> = any

// Get all assessments for a patient
export async function getPatientAssessments(patientId: string) {
  const { data, error } = await supabase
    .from('assessments')
    .select(`
      *,
      assessed_by_social_worker:social_workers!assessments_assessed_by_fkey(
        full_name,
        employee_id
      )
    `)
    .eq('patient_id', patientId)
    .order('assessment_date', { ascending: false })

  if (error) throw error
  return data
}

// Get a specific assessment with AI recommendations
export async function getAssessmentWithRecommendations(assessmentId: string): Promise<AssessmentWithRecommendations | null> {
  const { data, error } = await supabase
    .from('assessments')
    .select(`
      *,
      assessed_by_social_worker:social_workers!assessments_assessed_by_fkey(
        full_name,
        employee_id
      ),
      ai_recommendations:ai_goal_recommendations(
        id,
        recommendation_date,
        patient_analysis,
        six_month_goals,
        monthly_plans,
        weekly_plans,
        execution_strategy,
        success_indicators,
        is_active,
        applied_at,
        applied_by
      )
    `)
    .eq('id', assessmentId)
    .single()

  if (error) throw error
  return data
}

// Create a new assessment
export async function createAssessment(assessment: TablesInsert<'assessments'>) {
  const { data, error } = await supabase
    .from('assessments')
    .insert(assessment)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update an assessment
export async function updateAssessment(id: string, updates: TablesUpdate<'assessments'>) {
  const { data, error } = await supabase
    .from('assessments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete an assessment
export async function deleteAssessment(id: string) {
  const { error } = await supabase
    .from('assessments')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get assessment options by type
export async function getAssessmentOptions(optionType?: string) {
  let query = supabase
    .from('assessment_options')
    .select('*')
    .order('option_order')

  if (optionType) {
    query = query.eq('option_type', optionType)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// Get assessment statistics for a patient
export async function getPatientAssessmentStats(patientId: string) {
  const { data, error } = await supabase
    .from('assessment_statistics')
    .select('*')
    .eq('patient_id', patientId)
    .single()

  if (error) throw error
  return data
}

// Create assessment and get AI recommendations (using database function)
export async function createAssessmentAndGetRecommendations(params: {
  patient_id: string
  focus_time: string
  motivation_level: number
  past_successes: string[]
  constraints: string[]
  social_preference: string
  notes: string
  assessed_by: string
}) {
  const { data, error } = await supabase.rpc('create_assessment_and_get_recommendations', {
    p_patient_id: params.patient_id,
    p_focus_time: params.focus_time,
    p_motivation_level: params.motivation_level,
    p_past_successes: params.past_successes,
    p_constraints: params.constraints,
    p_social_preference: params.social_preference,
    p_notes: params.notes,
    p_assessed_by: params.assessed_by,
  })

  if (error) throw error
  return data
}

// Get latest assessment for a patient
export async function getLatestAssessment(patientId: string) {
  const { data, error } = await supabase
    .from('assessments')
    .select(`
      *,
      assessed_by_social_worker:social_workers!assessments_assessed_by_fkey(
        full_name,
        employee_id
      )
    `)
    .eq('patient_id', patientId)
    .order('assessment_date', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data
}

// Check if patient needs assessment (based on last assessment date)
export async function checkAssessmentDue(patientId: string, daysSinceLastAssessment = 30) {
  const latest = await getLatestAssessment(patientId)
  
  if (!latest) return true // No assessment exists
  
  const lastAssessmentDate = new Date(latest.assessment_date)
  const daysSince = Math.floor((Date.now() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24))
  
  return daysSince >= daysSinceLastAssessment
} 