import { supabase } from '@/lib/supabase'
import type { 
  AssessmentData, 
  AssessmentSummary, 
  AssessmentCreateRequest,
  AssessmentUpdateRequest,
  AssessmentListParams,
  AssessmentFilters,
  AssessmentStats,
  AssessmentComparison,
  AssessmentVisualizationData,
  AssessmentHistory,
  AssessmentHistoryParams,
  AssessmentVersionInfo,
  AssessmentTimeline,
  AssessmentMilestone,
  ProgressInsight,
  CreateHistoryEntryRequest
} from '@/types/assessment'

export class AssessmentService {
  // 평가 목록 조회
  static async getAssessments(params: AssessmentListParams = {}) {
    const {
      page = 1,
      limit = 10,
      sort_by = 'assessment_date',
      sort_order = 'desc',
      filters = {}
    } = params

    let query = supabase
      .from('detailed_assessments')
      .select(`
        id,
        patient_id,
        assessor_id,
        assessment_date,
        status,
        overall_notes,
        concentration_time,
        motivation_level,
        past_successes,
        constraints,
        social_preference,
        created_at,
        updated_at,
        patients(id, name, identifier),
        social_workers(id, name, employee_id)
      `)

    // 필터 적용
    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id)
    }
    if (filters.assessor_id) {
      query = query.eq('assessor_id', filters.assessor_id)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.date_from) {
      query = query.gte('assessment_date', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('assessment_date', filters.date_to)
    }
    if (filters.search) {
      query = query.or(`patients.name.ilike.%${filters.search}%,overall_notes.ilike.%${filters.search}%`)
    }

    // 정렬
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // 페이지네이션
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`평가 목록 조회 실패: ${error.message}`)
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    }
  }

  // 특정 평가 조회
  static async getAssessment(id: string): Promise<AssessmentData> {
    const { data, error } = await supabase
      .from('detailed_assessments')
      .select(`
        *,
        patients(id, name, identifier, birth_date, gender, contact_info),
        social_workers(id, name, employee_id, department, contact_info)
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`평가 조회 실패: ${error.message}`)
    }

    if (!data) {
      throw new Error('평가를 찾을 수 없습니다')
    }

    return data
  }

  // 평가 생성
  static async createAssessment(request: AssessmentCreateRequest): Promise<AssessmentData> {
    const assessmentData = {
      patient_id: request.patient_id,
      assessor_id: request.assessment_data.assessor_id,
      assessment_date: request.assessment_data.assessment_date,
      concentration_time: request.assessment_data.concentration_time || null,
      motivation_level: request.assessment_data.motivation_level || null,
      past_successes: request.assessment_data.past_successes || null,
      constraints: request.assessment_data.constraints || null,
      social_preference: request.assessment_data.social_preference || null,
      overall_notes: request.assessment_data.overall_notes || '',
      status: request.assessment_data.status || 'draft'
    }

    const { data, error } = await supabase
      .from('detailed_assessments')
      .insert([assessmentData])
      .select(`
        *,
        patients(id, name, identifier),
        social_workers(id, name, employee_id)
      `)
      .single()

    if (error) {
      throw new Error(`평가 생성 실패: ${error.message}`)
    }

    return data
  }

  // 평가 수정
  static async updateAssessment(id: string, request: AssessmentUpdateRequest): Promise<AssessmentData> {
    const updateData = {
      ...request.assessment_data,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('detailed_assessments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        patients(id, name, identifier),
        social_workers(id, name, employee_id)
      `)
      .single()

    if (error) {
      throw new Error(`평가 수정 실패: ${error.message}`)
    }

    return data
  }

  // 평가 삭제
  static async deleteAssessment(id: string): Promise<void> {
    const { error } = await supabase
      .from('detailed_assessments')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`평가 삭제 실패: ${error.message}`)
    }
  }

  // 환자별 평가 통계
  static async getPatientAssessmentStats(patientId: string): Promise<AssessmentStats> {
    const { data, error } = await supabase
      .from('detailed_assessments')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'completed')
      .order('assessment_date', { ascending: false })

    if (error) {
      throw new Error(`평가 통계 조회 실패: ${error.message}`)
    }

    const assessments = data || []
    const totalAssessments = assessments.length

    if (totalAssessments === 0) {
      return {
        total_assessments: 0,
        completed_assessments: 0,
        average_scores: {
          concentration: 0,
          motivation: 0,
          social_comfort: 0
        },
        progress_trend: 'stable'
      }
    }

    // 평균 점수 계산 (JSONB 필드에서 데이터 추출)
    let totalConcentration = 0
    let totalMotivation = 0
    let totalSocialComfort = 0
    let validConcentrationCount = 0
    let validMotivationCount = 0
    let validSocialCount = 0

    assessments.forEach(assessment => {
      // 집중력 점수 (지속시간을 점수로 변환)
      if (assessment.concentration_time?.duration) {
        const duration = assessment.concentration_time.duration
        let concentrationScore = 0
        if (duration >= 60) concentrationScore = 5
        else if (duration >= 45) concentrationScore = 4
        else if (duration >= 30) concentrationScore = 3
        else if (duration >= 15) concentrationScore = 2
        else concentrationScore = 1
        
        totalConcentration += concentrationScore
        validConcentrationCount++
      }

      // 동기 수준 점수
      if (assessment.motivation_level) {
        const motivationData = assessment.motivation_level
        const motivationScores = [
          motivationData.goal_clarity || 0,
          motivationData.effort_willingness || 0,
          motivationData.confidence_level || 0,
          motivationData.external_support || 0
        ].filter(score => score > 0)
        
        if (motivationScores.length > 0) {
          totalMotivation += motivationScores.reduce((sum, score) => sum + score, 0) / motivationScores.length
          validMotivationCount++
        }
      }

      // 사회적 편안함 점수
      if (assessment.social_preference) {
        const socialData = assessment.social_preference
        let socialScore = 0
        
        // 선호 그룹 크기에 따른 점수 (더 큰 그룹 선호 = 더 높은 사회적 편안함)
        if (socialData.preferred_group_size === 'large') socialScore += 2
        else if (socialData.preferred_group_size === 'medium') socialScore += 1.5
        else if (socialData.preferred_group_size === 'small') socialScore += 1
        
        // 상호작용 스타일에 따른 점수
        if (socialData.interaction_style === 'active') socialScore += 2
        else if (socialData.interaction_style === 'moderate') socialScore += 1.5
        else socialScore += 1
        
        totalSocialComfort += Math.min(socialScore, 5) // 최대 5점으로 제한
        validSocialCount++
      }
    })

    const avgConcentration = validConcentrationCount > 0 ? totalConcentration / validConcentrationCount : 0
    const avgMotivation = validMotivationCount > 0 ? totalMotivation / validMotivationCount : 0
    const avgSocialComfort = validSocialCount > 0 ? totalSocialComfort / validSocialCount : 0

    // 진행 추세 계산 (최근 3개 평가와 이전 3개 평가 비교)
    let progressTrend: 'improving' | 'stable' | 'declining' = 'stable'
    
    if (totalAssessments >= 6) {
      const recentAssessments = assessments.slice(0, 3)
      const olderAssessments = assessments.slice(3, 6)
      
      const recentAvg = this.calculateAverageScore(recentAssessments)
      const olderAvg = this.calculateAverageScore(olderAssessments)
      
      const difference = recentAvg - olderAvg
      if (difference > 0.3) progressTrend = 'improving'
      else if (difference < -0.3) progressTrend = 'declining'
    }

    return {
      total_assessments: totalAssessments,
      completed_assessments: totalAssessments,
      average_scores: {
        concentration: Math.round(avgConcentration * 10) / 10,
        motivation: Math.round(avgMotivation * 10) / 10,
        social_comfort: Math.round(avgSocialComfort * 10) / 10
      },
      progress_trend: progressTrend
    }
  }

  // 평가 비교
  static async compareAssessments(currentId: string, previousId?: string): Promise<AssessmentComparison> {
    // 현재 평가 조회
    const currentAssessment = await this.getAssessment(currentId)
    
    let previousAssessment = null
    
    if (previousId) {
      previousAssessment = await this.getAssessment(previousId)
    } else {
      // 이전 평가 자동 찾기 (같은 환자의 가장 최근 완료된 평가)
      const { data, error } = await supabase
        .from('detailed_assessments')
        .select('*')
        .eq('patient_id', currentAssessment.patient_id)
        .eq('status', 'completed')
        .lt('assessment_date', currentAssessment.assessment_date)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .single()
      
      if (!error && data) {
        previousAssessment = data
      }
    }

    if (!previousAssessment) {
      return {
        current: currentAssessment,
        previous: null,
        changes: {
          concentration: { change: 'no_data', difference: 0 },
          motivation: { change: 'no_data', difference: 0 },
          social_preference: { change: 'no_data', difference: 0 },
          overall_progress: 'no_data'
        }
      }
    }

    // 변화 계산
    const currentScores = this.extractScoresFromAssessment(currentAssessment)
    const previousScores = this.extractScoresFromAssessment(previousAssessment)

    const concentrationChange = this.calculateChange(currentScores.concentration, previousScores.concentration)
    const motivationChange = this.calculateChange(currentScores.motivation, previousScores.motivation)
    const socialChange = this.calculateChange(currentScores.social, previousScores.social)

    // 전체 진행 상황 계산
    const overallScore = (currentScores.concentration + currentScores.motivation + currentScores.social) / 3
    const previousOverallScore = (previousScores.concentration + previousScores.motivation + previousScores.social) / 3
    const overallProgress = this.calculateChange(overallScore, previousOverallScore).change

    return {
      current: currentAssessment,
      previous: previousAssessment,
      changes: {
        concentration: concentrationChange,
        motivation: motivationChange,
        social_preference: socialChange,
        overall_progress: overallProgress
      }
    }
  }

  // 시각화 데이터 생성
  static async getVisualizationData(patientId: string): Promise<AssessmentVisualizationData> {
    const { data, error } = await supabase
      .from('detailed_assessments')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'completed')
      .order('assessment_date', { ascending: true })

    if (error) {
      throw new Error(`시각화 데이터 조회 실패: ${error.message}`)
    }

    const assessments = data || []

    if (assessments.length === 0) {
      return {
        timeline: [],
        score_trends: {
          concentration: [],
          motivation: [],
          social_comfort: []
        },
        category_breakdown: {
          concentration_environments: {},
          motivation_factors: {},
          social_preferences: {}
        }
      }
    }

    // 타임라인 데이터
    const timeline = assessments.map(assessment => ({
      date: assessment.assessment_date,
      overall_score: this.calculateOverallScore(assessment),
      status: assessment.status,
      notes: assessment.overall_notes || ''
    }))

    // 점수 추세 데이터
    const scoreTrends = {
      concentration: assessments.map(assessment => ({
        date: assessment.assessment_date,
        score: this.extractConcentrationScore(assessment)
      })),
      motivation: assessments.map(assessment => ({
        date: assessment.assessment_date,
        score: this.extractMotivationScore(assessment)
      })),
      social_comfort: assessments.map(assessment => ({
        date: assessment.assessment_date,
        score: this.extractSocialScore(assessment)
      }))
    }

    // 카테고리별 분석
    const categoryBreakdown = this.analyzeCategoryBreakdown(assessments)

    return {
      timeline,
      score_trends: scoreTrends,
      category_breakdown: categoryBreakdown
    }
  }

  // 평가 상태 업데이트
  static async updateAssessmentStatus(id: string, status: AssessmentData['status']): Promise<AssessmentData> {
    const { data, error } = await supabase
      .from('detailed_assessments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        patients(id, name, identifier),
        social_workers(id, name, employee_id)
      `)
      .single()

    if (error) {
      throw new Error(`평가 상태 업데이트 실패: ${error.message}`)
    }

    return data
  }

  // 평가 복제
  static async duplicateAssessment(id: string, newPatientId?: string): Promise<AssessmentData> {
    const originalAssessment = await this.getAssessment(id)
    
    const duplicateData = {
      patient_id: newPatientId || originalAssessment.patient_id,
      assessor_id: originalAssessment.assessor_id,
      assessment_date: new Date().toISOString().split('T')[0],
      concentration_time: originalAssessment.concentration_time,
      motivation_level: originalAssessment.motivation_level,
      past_successes: originalAssessment.past_successes,
      constraints: originalAssessment.constraints,
      social_preference: originalAssessment.social_preference,
      overall_notes: `복제된 평가 (원본: ${originalAssessment.id})`,
      status: 'draft' as const
    }

    const { data, error } = await supabase
      .from('detailed_assessments')
      .insert([duplicateData])
      .select(`
        *,
        patients(id, name, identifier),
        social_workers(id, name, employee_id)
      `)
      .single()

    if (error) {
      throw new Error(`평가 복제 실패: ${error.message}`)
    }

    return data
  }

  // 헬퍼 메서드들
  private static calculateAverageScore(assessments: any[]): number {
    if (assessments.length === 0) return 0
    
    const scores = assessments.map(assessment => this.calculateOverallScore(assessment))
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  private static calculateOverallScore(assessment: any): number {
    const concentrationScore = this.extractConcentrationScore(assessment)
    const motivationScore = this.extractMotivationScore(assessment)
    const socialScore = this.extractSocialScore(assessment)
    
    return (concentrationScore + motivationScore + socialScore) / 3
  }

  private static extractConcentrationScore(assessment: any): number {
    if (!assessment.concentration_time?.duration) return 0
    
    const duration = assessment.concentration_time.duration
    if (duration >= 60) return 5
    if (duration >= 45) return 4
    if (duration >= 30) return 3
    if (duration >= 15) return 2
    return 1
  }

  private static extractMotivationScore(assessment: any): number {
    if (!assessment.motivation_level) return 0
    
    const motivationData = assessment.motivation_level
    const scores = [
      motivationData.goal_clarity || 0,
      motivationData.effort_willingness || 0,
      motivationData.confidence_level || 0,
      motivationData.external_support || 0
    ].filter(score => score > 0)
    
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
  }

  private static extractSocialScore(assessment: any): number {
    if (!assessment.social_preference) return 0
    
    const socialData = assessment.social_preference
    let score = 0
    
    // 선호 그룹 크기에 따른 점수
    if (socialData.preferred_group_size === 'large') score += 2
    else if (socialData.preferred_group_size === 'medium') score += 1.5
    else if (socialData.preferred_group_size === 'small') score += 1
    
    // 상호작용 스타일에 따른 점수
    if (socialData.interaction_style === 'active') score += 2
    else if (socialData.interaction_style === 'moderate') score += 1.5
    else score += 1
    
    return Math.min(score, 5)
  }

  private static extractScoresFromAssessment(assessment: any) {
    return {
      concentration: this.extractConcentrationScore(assessment),
      motivation: this.extractMotivationScore(assessment),
      social: this.extractSocialScore(assessment)
    }
  }

  private static calculateChange(current: number, previous: number) {
    const difference = current - previous
    const percentageChange = previous > 0 ? (difference / previous) * 100 : 0
    
    let change: 'improved' | 'declined' | 'stable' | 'no_data' = 'stable'
    
    if (Math.abs(percentageChange) < 5) {
      change = 'stable'
    } else if (difference > 0) {
      change = 'improved'
    } else {
      change = 'declined'
    }
    
    return {
      change,
      difference: Math.round(difference * 10) / 10
    }
  }

  private static analyzeCategoryBreakdown(assessments: any[]) {
    const concentrationEnvironments: Record<string, number> = {}
    const motivationFactors: Record<string, number> = {}
    const socialPreferences: Record<string, number> = {}

    assessments.forEach(assessment => {
      // 집중력 환경 분석
      if (assessment.concentration_time?.preferred_environment) {
        const env = assessment.concentration_time.preferred_environment
        concentrationEnvironments[env] = (concentrationEnvironments[env] || 0) + 1
      }

      // 동기 요인 분석
      if (assessment.motivation_level) {
        const motivation = assessment.motivation_level
        if (motivation.goal_clarity >= 4) {
          motivationFactors['목표 명확성'] = (motivationFactors['목표 명확성'] || 0) + 1
        }
        if (motivation.effort_willingness >= 4) {
          motivationFactors['노력 의지'] = (motivationFactors['노력 의지'] || 0) + 1
        }
        if (motivation.confidence_level >= 4) {
          motivationFactors['자신감'] = (motivationFactors['자신감'] || 0) + 1
        }
        if (motivation.external_support >= 4) {
          motivationFactors['외부 지원'] = (motivationFactors['외부 지원'] || 0) + 1
        }
      }

      // 사회적 선호도 분석
      if (assessment.social_preference) {
        const social = assessment.social_preference
        const groupSize = social.preferred_group_size
        const interactionStyle = social.interaction_style
        
        socialPreferences[`${groupSize} 그룹`] = (socialPreferences[`${groupSize} 그룹`] || 0) + 1
        socialPreferences[`${interactionStyle} 상호작용`] = (socialPreferences[`${interactionStyle} 상호작용`] || 0) + 1
      }
    })

    return {
      concentration_environments: concentrationEnvironments,
      motivation_factors: motivationFactors,
      social_preferences: socialPreferences
    }
  }

  // === 히스토리 추적 메서드들 ===

  // 평가 히스토리 조회
  static async getAssessmentHistory(params: AssessmentHistoryParams): Promise<AssessmentHistory[]> {
    const {
      assessment_id,
      patient_id,
      change_type,
      start_date,
      end_date,
      limit = 50,
      page = 1
    } = params

    let query = supabase
      .from('assessment_history')
      .select(`
        *,
        detailed_assessments(id, status),
        social_workers(id, name, employee_id)
      `)

    // 필터 적용
    if (assessment_id) {
      query = query.eq('assessment_id', assessment_id)
    }
    if (patient_id) {
      query = query.eq('patient_id', patient_id)
    }
    if (change_type) {
      query = query.eq('change_type', change_type)
    }
    if (start_date) {
      query = query.gte('changed_at', start_date)
    }
    if (end_date) {
      query = query.lte('changed_at', end_date)
    }

    // 정렬 및 페이지네이션
    query = query.order('changed_at', { ascending: false })
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      throw new Error(`평가 히스토리 조회 실패: ${error.message}`)
    }

    return data || []
  }

  // 평가 버전 정보 조회
  static async getAssessmentVersionInfo(assessmentId: string): Promise<AssessmentVersionInfo> {
    const { data, error } = await supabase
      .from('assessment_history')
      .select('version_number, changed_at, change_type, social_workers(name)')
      .eq('assessment_id', assessmentId)
      .order('version_number', { ascending: false })

    if (error) {
      throw new Error(`평가 버전 정보 조회 실패: ${error.message}`)
    }

    const versions = data || []
    const currentVersion = versions.length > 0 ? versions[0].version_number : 1

    return {
      current_version: currentVersion,
      total_versions: versions.length,
      versions: versions.map(v => ({
        version_number: v.version_number,
        changed_at: v.changed_at,
        change_type: v.change_type,
        changed_by: v.social_workers?.name || '알 수 없음'
      }))
    }
  }

  // 히스토리 엔트리 생성
  static async createHistoryEntry(request: CreateHistoryEntryRequest): Promise<AssessmentHistory> {
    const {
      assessment_id,
      patient_id,
      change_type,
      changes,
      snapshot,
      changed_by,
      notes
    } = request

    // 최신 버전 번호 조회
    const { data: latestVersion } = await supabase
      .from('assessment_history')
      .select('version_number')
      .eq('assessment_id', assessment_id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = latestVersion ? latestVersion.version_number + 1 : 1

    const historyData = {
      assessment_id,
      patient_id,
      change_type,
      changes,
      snapshot,
      changed_by,
      changed_at: new Date().toISOString(),
      version_number: nextVersion,
      notes
    }

    const { data, error } = await supabase
      .from('assessment_history')
      .insert([historyData])
      .select(`
        *,
        detailed_assessments(id, status),
        social_workers(id, name, employee_id)
      `)
      .single()

    if (error) {
      throw new Error(`히스토리 엔트리 생성 실패: ${error.message}`)
    }

    return data
  }

  // 환자별 평가 타임라인 조회
  static async getAssessmentTimeline(patientId: string, limit: number = 100): Promise<AssessmentTimeline> {
    // 평가 히스토리 조회
    const historyData = await this.getAssessmentHistory({
      patient_id: patientId,
      limit
    })

    // 마일스톤 조회
    const { data: milestones, error: milestonesError } = await supabase
      .from('assessment_milestones')
      .select('*')
      .eq('patient_id', patientId)
      .order('milestone_date', { ascending: false })

    if (milestonesError) {
      throw new Error(`마일스톤 조회 실패: ${milestonesError.message}`)
    }

    // 인사이트 조회
    const { data: insights, error: insightsError } = await supabase
      .from('progress_insights')
      .select('*')
      .eq('patient_id', patientId)
      .order('generated_at', { ascending: false })
      .limit(10)

    if (insightsError) {
      throw new Error(`인사이트 조회 실패: ${insightsError.message}`)
    }

    // 진행률 계산 (최근 평가들의 완료 상태 기반)
    const recentAssessments = historyData
      .filter(h => h.change_type === 'completed')
      .slice(0, 10)

    const progressPercentage = recentAssessments.length > 0 
      ? (recentAssessments.length / 10) * 100 
      : 0

    // 추세 분석
    const trends = this.calculateProgressTrends(historyData)

    return {
      history: historyData,
      milestones: milestones || [],
      insights: insights || [],
      progress_percentage: Math.min(progressPercentage, 100),
      trends
    }
  }

  // 마일스톤 생성
  static async createMilestone(milestone: Omit<AssessmentMilestone, 'id' | 'created_at'>): Promise<AssessmentMilestone> {
    const { data, error } = await supabase
      .from('assessment_milestones')
      .insert([{
        ...milestone,
        created_at: new Date().toISOString()
      }])
      .select('*')
      .single()

    if (error) {
      throw new Error(`마일스톤 생성 실패: ${error.message}`)
    }

    return data
  }

  // 인사이트 생성
  static async createInsight(insight: Omit<ProgressInsight, 'id' | 'generated_at'>): Promise<ProgressInsight> {
    const { data, error } = await supabase
      .from('progress_insights')
      .insert([{
        ...insight,
        generated_at: new Date().toISOString()
      }])
      .select('*')
      .single()

    if (error) {
      throw new Error(`인사이트 생성 실패: ${error.message}`)
    }

    return data
  }

  // 환자별 마일스톤 조회
  static async getPatientMilestones(patientId: string): Promise<AssessmentMilestone[]> {
    const { data, error } = await supabase
      .from('assessment_milestones')
      .select('*')
      .eq('patient_id', patientId)
      .order('milestone_date', { ascending: false })

    if (error) {
      throw new Error(`마일스톤 조회 실패: ${error.message}`)
    }

    return data || []
  }

  // 환자별 인사이트 조회
  static async getPatientInsights(patientId: string, limit: number = 10): Promise<ProgressInsight[]> {
    const { data, error } = await supabase
      .from('progress_insights')
      .select('*')
      .eq('patient_id', patientId)
      .order('generated_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`인사이트 조회 실패: ${error.message}`)
    }

    return data || []
  }

  // 진행률 추세 계산 (헬퍼 메서드)
  private static calculateProgressTrends(historyData: AssessmentHistory[]) {
    const monthlyData: Record<string, number> = {}

    historyData.forEach(history => {
      const month = history.changed_at.substring(0, 7) // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + 1
    })

    const months = Object.keys(monthlyData).sort()
    const values = months.map(month => monthlyData[month])

    // 간단한 추세 계산 (최근 3개월 기준)
    const recentValues = values.slice(-3)
    const trend = recentValues.length > 1 
      ? recentValues[recentValues.length - 1] > recentValues[0] ? 'increasing' : 'decreasing'
      : 'stable'

    // 일관성 점수 (변동성이 낮을수록 높은 점수)
    const variance = values.length > 1 
      ? values.reduce((acc, val, i, arr) => {
          const mean = arr.reduce((sum, v) => sum + v, 0) / arr.length
          return acc + Math.pow(val - mean, 2)
        }, 0) / values.length
      : 0

    const consistency = Math.max(0, 100 - variance * 10) // 0-100 스케일

    // 신뢰도 점수 (데이터 포인트가 많을수록 높은 신뢰도)
    const confidence = Math.min(100, (values.length / 12) * 100) // 12개월 기준 100%

    return {
      trend,
      consistency: Math.round(consistency),
      confidence: Math.round(confidence),
      monthly_activity: monthlyData
    }
  }
} 