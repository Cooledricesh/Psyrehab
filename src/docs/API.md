# PsyRehab API Documentation

정신장애인 재활 목표 관리 플랫폼의 API 서비스 문서입니다.

## 목차

1. [개요](#개요)
2. [인증](#인증)
3. [공통 응답 형식](#공통-응답-형식)
4. [오류 처리](#오류-처리)
5. [인증 서비스 (AuthService)](#인증-서비스-authservice)
6. [환자 관리 서비스 (PatientService)](#환자-관리-서비스-patientservice)
7. [평가 서비스 (AssessmentService)](#평가-서비스-assessmentservice)
8. [목표 설정 서비스 (RehabilitationGoalService)](#목표-설정-서비스-rehabilitationgoalservice)
9. [AI 추천 서비스 (AIRecommendationService)](#ai-추천-서비스-airecommendationservice)
10. [진행 추적 서비스 (ProgressTrackingService)](#진행-추적-서비스-progresstrackingservice)
11. [주간 체크인 서비스 (WeeklyCheckInService)](#주간-체크인-서비스-weeklycheckinservice)
12. [서비스 기록 서비스 (ServiceRecordService)](#서비스-기록-서비스-servicerecordservice)
13. [목표 카테고리 서비스 (GoalCategoryService)](#목표-카테고리-서비스-goalcategoryservice)
14. [목표 평가 서비스 (GoalEvaluationService)](#목표-평가-서비스-goalevaluationservice)
15. [사회복지사 서비스 (SocialWorkerService)](#사회복지사-서비스-socialworkerservice)
16. [대시보드 서비스 (DashboardService)](#대시보드-서비스-dashboardservice)

## 개요

이 시스템은 Supabase를 백엔드로 사용하는 TypeScript 기반의 서비스 레이어를 제공합니다. 모든 API 호출은 Supabase 클라이언트를 통해 이루어지며, Row Level Security (RLS)를 통해 보안이 관리됩니다.

### 기술 스택
- **백엔드**: Supabase (PostgreSQL + Real-time subscriptions)
- **프론트엔드**: React + TypeScript + TanStack Query
- **인증**: Supabase Auth (PKCE flow)
- **데이터 검증**: Zod를 통한 런타임 검증

### 아키텍처 특징
- 서비스 클래스 기반 구조
- 타입 안전성 보장 (TypeScript)
- 실시간 데이터 동기화 지원
- 캐싱 및 최적화 (TanStack Query)

## 인증

### 인증 방식
시스템은 Supabase의 JWT 기반 인증을 사용합니다.

#### 지원하는 인증 방법
- **이메일/비밀번호 인증**
- **OAuth 인증** (Google, GitHub, Azure, Facebook)
- **비밀번호 재설정**
- **이메일 확인**

#### 사용자 역할 (UserRole)
```typescript
type UserRole = 'administrator' | 'social_worker' | 'patient' | 'super_admin'
```

#### 권한 시스템
각 역할은 특정 권한을 가지며, API 호출 시 권한이 자동으로 확인됩니다.

```typescript
// 관리자 권한
'manage_users', 'manage_patients', 'view_all_data', 'manage_system_settings'

// 사회복지사 권한  
'manage_assigned_patients', 'create_goals', 'view_patient_data', 'create_assessments'

// 환자 권한
'view_own_data', 'update_own_profile', 'view_own_goals', 'submit_check_ins'
```

## 공통 응답 형식

### 성공 응답
```typescript
interface SuccessResponse<T> {
  success: true
  data: T
  message?: string
}
```

### 실패 응답
```typescript
interface ErrorResponse {
  success: false
  error: string
  details?: {
    code?: string
    field?: string
    validationErrors?: Record<string, string[]>
  }
}
```

### 페이지네이션 응답
```typescript
interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}
```

## 오류 처리

### 일반적인 HTTP 상태 코드
- `200`: 성공
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스 없음
- `422`: 유효성 검사 실패
- `500`: 서버 오류

### 에러 메시지 다국어화
한국어 에러 메시지가 기본으로 제공됩니다.

---

## 인증 서비스 (AuthService)

### 로그인
이메일과 비밀번호로 로그인합니다.

```typescript
static async signIn(credentials: SignInForm): Promise<{
  success: boolean
  user?: User
  session?: Session
  profile?: AnyUserProfile
  error?: string
}>
```

**매개변수:**
```typescript
interface SignInForm {
  email: string
  password: string
}
```

**예시:**
```typescript
const result = await AuthService.signIn({
  email: "user@example.com",
  password: "securePassword123"
})

if (result.success) {
  console.log("로그인 성공:", result.user)
} else {
  console.error("로그인 실패:", result.error)
}
```

**권한 요구사항:** 없음 (public)

---

### 회원가입
새 사용자 계정을 생성합니다.

```typescript
static async signUp(formData: SignUpForm): Promise<{
  success: boolean
  user?: User
  error?: string
  requiresEmailConfirmation?: boolean
}>
```

**매개변수:**
```typescript
interface SignUpForm {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  role: UserRole
  // 역할별 추가 필드
  employee_id?: string
  department?: string
  contact_number?: string
  admin_level?: number
  patient_identifier?: string
  date_of_birth?: string
  gender?: string
}
```

**예시:**
```typescript
const result = await AuthService.signUp({
  email: "socialworker@example.com",
  password: "securePassword123",
  confirmPassword: "securePassword123",
  full_name: "김사회복지사",
  role: "social_worker",
  employee_id: "SW001",
  department: "재활상담팀",
  contact_number: "010-1234-5678"
})
```

**권한 요구사항:** 없음 (public)

---

### 로그아웃
현재 세션을 종료합니다.

```typescript
static async signOut(): Promise<{ success: boolean; error?: string }>
```

**예시:**
```typescript
const result = await AuthService.signOut()
```

**권한 요구사항:** 인증된 사용자

---

### 비밀번호 재설정
비밀번호 재설정 이메일을 발송합니다.

```typescript
static async resetPassword(email: string): Promise<{ success: boolean; error?: string }>
```

**예시:**
```typescript
const result = await AuthService.resetPassword("user@example.com")
```

**권한 요구사항:** 없음 (public)

---

### 현재 사용자 정보 조회
현재 로그인한 사용자의 정보를 반환합니다.

```typescript
static async getCurrentUser(): Promise<User | null>
```

**예시:**
```typescript
const user = await AuthService.getCurrentUser()
```

**권한 요구사항:** 인증된 사용자

---

### 프로필 업데이트
사용자 프로필 정보를 업데이트합니다.

```typescript
static async updateProfile(userId: string, updates: Partial<AnyUserProfile>): Promise<{
  success: boolean
  profile?: AnyUserProfile
  error?: string
}>
```

**예시:**
```typescript
const result = await AuthService.updateProfile("user-id", {
  full_name: "새로운이름",
  contact_number: "010-9876-5432"
})
```

**권한 요구사항:** `update_own_profile` 또는 `manage_users`

---

## 환자 관리 서비스 (PatientService)

### 환자 목록 조회
필터와 페이지네이션을 지원하는 환자 목록을 조회합니다.

```typescript
static async getPatients(params: PatientListParams = {}): Promise<PatientListResponse>
```

**매개변수:**
```typescript
interface PatientListParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  filters?: PatientSearchFilters
}

interface PatientSearchFilters {
  search?: string
  status?: string
  social_worker_id?: string
  date_from?: string
  date_to?: string
}
```

**반환값:**
```typescript
interface PatientListResponse {
  data: Patient[]
  count: number
  page: number
  limit: number
  total_pages: number
}
```

**예시:**
```typescript
const patients = await PatientService.getPatients({
  page: 1,
  limit: 20,
  sort_by: 'created_at',
  sort_order: 'desc',
  filters: {
    status: 'active',
    search: '김'
  }
})
```

**권한 요구사항:** `view_patient_data` 또는 `manage_patients`

---

### 환자 상세 조회
특정 환자의 상세 정보를 조회합니다.

```typescript
static async getPatient(id: string): Promise<Patient>
```

**반환값:** 환자 정보와 관련된 평가, 목표, 담당 사회복지사 정보 포함

**예시:**
```typescript
const patient = await PatientService.getPatient("patient-id")
```

**권한 요구사항:** `view_patient_data` 또는 해당 환자 담당

---

### 환자 등록
새로운 환자를 등록합니다.

```typescript
static async createPatient(patientData: PatientCreateData): Promise<Patient>
```

**매개변수:**
```typescript
interface PatientCreateData {
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
```

**예시:**
```typescript
const newPatient = await PatientService.createPatient({
  full_name: "홍길동",
  patient_identifier: "P-2024-001",
  date_of_birth: "1990-01-01",
  gender: "male",
  contact_info: {
    phone: "010-1234-5678",
    emergency_contact: {
      name: "홍어머니",
      relationship: "mother",
      phone: "010-8765-4321"
    }
  },
  status: "active"
})
```

**권한 요구사항:** `patient:create` 또는 `manage_patients`

---

### 환자 정보 수정
기존 환자의 정보를 수정합니다.

```typescript
static async updatePatient(id: string, updateData: PatientUpdateData): Promise<Patient>
```

**예시:**
```typescript
const updatedPatient = await PatientService.updatePatient("patient-id", {
  status: "discharged",
  additional_info: {
    notes: "치료 완료로 퇴원"
  }
})
```

**권한 요구사항:** `patient:update` 또는 해당 환자 담당

---

### 사회복지사 배정
환자에게 담당 사회복지사를 배정합니다.

```typescript
static async assignSocialWorker(patientId: string, socialWorkerId: string): Promise<Patient>
```

**예시:**
```typescript
const patient = await PatientService.assignSocialWorker("patient-id", "social-worker-id")
```

**권한 요구사항:** `manage_patients`

---

### 환자 통계 조회
전체 환자의 통계 정보를 조회합니다.

```typescript
static async getPatientStats(): Promise<{
  total: number
  active: number
  inactive: number
  discharged: number
}>
```

**예시:**
```typescript
const stats = await PatientService.getPatientStats()
// { total: 150, active: 120, inactive: 20, discharged: 10 }
```

**권한 요구사항:** `view_analytics` 또는 `manage_patients`

---

## 평가 서비스 (AssessmentService)

### 평가 목록 조회
필터링과 페이지네이션을 지원하는 평가 목록을 조회합니다.

```typescript
static async getAssessments(params: AssessmentListParams = {}): Promise<AssessmentListResponse>
```

**매개변수:**
```typescript
interface AssessmentListParams {
  page?: number
  limit?: number
  sort_by?: 'assessment_date' | 'created_at' | 'patient_name' | 'status'
  sort_order?: 'asc' | 'desc'
  filters?: AssessmentFilters
}

interface AssessmentFilters {
  patient_id?: string
  assessor_id?: string
  date_from?: string
  date_to?: string
  status?: 'draft' | 'completed' | 'reviewed'
  search?: string
}
```

**예시:**
```typescript
const assessments = await AssessmentService.getAssessments({
  page: 1,
  limit: 10,
  filters: {
    patient_id: "patient-id",
    status: "completed"
  }
})
```

**권한 요구사항:** `assessment:read`

---

### 평가 상세 조회
특정 평가의 상세 정보를 조회합니다.

```typescript
static async getAssessment(id: string): Promise<AssessmentData>
```

**반환값:**
```typescript
interface AssessmentData {
  id: string
  patient_id: string
  assessor_id: string
  assessment_date: string
  concentration_time: ConcentrationTimeOptions
  motivation_level: MotivationLevelOptions
  past_successes: PastSuccessesOptions
  constraints: ConstraintsOptions
  social_preference: SocialPreferenceOptions
  overall_notes?: string
  status: 'draft' | 'completed' | 'reviewed'
  created_at: string
  updated_at: string
}
```

**예시:**
```typescript
const assessment = await AssessmentService.getAssessment("assessment-id")
```

**권한 요구사항:** `assessment:read`

---

### 평가 생성
새로운 평가를 생성합니다.

```typescript
static async createAssessment(request: AssessmentCreateRequest): Promise<AssessmentData>
```

**매개변수:**
```typescript
interface AssessmentCreateRequest {
  patient_id: string
  assessment_data: {
    assessor_id: string
    assessment_date: string
    concentration_time?: ConcentrationTimeOptions
    motivation_level?: MotivationLevelOptions
    past_successes?: PastSuccessesOptions
    constraints?: ConstraintsOptions
    social_preference?: SocialPreferenceOptions
    overall_notes?: string
    status?: 'draft' | 'completed'
  }
}
```

**예시:**
```typescript
const newAssessment = await AssessmentService.createAssessment({
  patient_id: "patient-id",
  assessment_data: {
    assessor_id: "assessor-id",
    assessment_date: "2024-01-15",
    concentration_time: {
      duration: 30,
      environment: "quiet",
      time_of_day: "morning"
    },
    motivation_level: {
      self_motivation: 4,
      external_motivation: 3,
      goal_clarity: 4,
      confidence_level: 3
    },
    status: "completed"
  }
})
```

**권한 요구사항:** `assessment:create`

---

### 평가 수정
기존 평가를 수정합니다.

```typescript
static async updateAssessment(id: string, request: AssessmentUpdateRequest): Promise<AssessmentData>
```

**예시:**
```typescript
const updatedAssessment = await AssessmentService.updateAssessment("assessment-id", {
  assessment_data: {
    overall_notes: "추가 관찰 내용",
    status: "reviewed"
  }
})
```

**권한 요구사항:** `assessment:update`

---

### 환자별 평가 통계
특정 환자의 평가 통계를 조회합니다.

```typescript
static async getPatientAssessmentStats(patientId: string): Promise<AssessmentStats>
```

**반환값:**
```typescript
interface AssessmentStats {
  total_assessments: number
  completed_assessments: number
  average_scores: {
    concentration: number
    motivation: number
    social_comfort: number
  }
  progress_trend: 'improving' | 'declining' | 'stable'
}
```

**예시:**
```typescript
const stats = await AssessmentService.getPatientAssessmentStats("patient-id")
```

**권한 요구사항:** `assessment:read`

---

### 평가 비교
현재 평가와 이전 평가를 비교합니다.

```typescript
static async compareAssessments(currentId: string, previousId?: string): Promise<AssessmentComparison>
```

**예시:**
```typescript
const comparison = await AssessmentService.compareAssessments("current-id", "previous-id")
```

**권한 요구사항:** `assessment:read`

---

## 목표 설정 서비스 (RehabilitationGoalService)

### 환자별 목표 조회
특정 환자의 재활 목표를 조회합니다.

```typescript
export async function getPatientRehabilitationGoals(patientId: string): Promise<RehabilitationGoal[]>
```

**예시:**
```typescript
const goals = await getPatientRehabilitationGoals("patient-id")
```

**권한 요구사항:** `view_patient_data` 또는 해당 환자 담당

---

### 목표 상세 조회
특정 목표의 상세 정보를 조회합니다.

```typescript
export async function getRehabilitationGoalWithDetails(goalId: string): Promise<RehabilitationGoalWithDetails>
```

**반환값:** 목표와 관련된 환자, 생성자, 상위/하위 목표, AI 추천 정보 포함

**예시:**
```typescript
const goalDetails = await getRehabilitationGoalWithDetails("goal-id")
```

**권한 요구사항:** `view_patient_data`

---

### 목표 생성
새로운 재활 목표를 생성합니다.

```typescript
export async function createRehabilitationGoal(goal: RehabilitationGoalCreateData): Promise<RehabilitationGoal>
```

**매개변수:**
```typescript
interface RehabilitationGoalCreateData {
  patient_id: string
  created_by_social_worker_id: string
  title: string
  description?: string
  goal_type: 'six_month' | 'monthly' | 'weekly' | 'other'
  status: 'pending' | 'active' | 'completed' | 'on_hold' | 'cancelled'
  priority: number
  target_completion_rate: number
  parent_goal_id?: string
  category_id?: string
  start_date?: string
  end_date?: string
  week_number?: number
  month_number?: number
  sequence_number?: number
  evaluation_criteria?: object
  ai_suggestion_details?: object
}
```

**예시:**
```typescript
const newGoal = await createRehabilitationGoal({
  patient_id: "patient-id",
  created_by_social_worker_id: "social-worker-id",
  title: "사회적 기능 향상",
  description: "대인관계 기술 개발 및 사회적 참여 증대",
  goal_type: "six_month",
  status: "pending",
  priority: 3,
  target_completion_rate: 100,
  evaluation_criteria: {
    type: "behavioral_observation",
    measurement_method: "monthly_assessment"
  }
})
```

**권한 요구사항:** `create_goals`

---

### 목표 수정
기존 목표를 수정합니다.

```typescript
export async function updateRehabilitationGoal(id: string, updates: RehabilitationGoalUpdateData): Promise<RehabilitationGoal>
```

**예시:**
```typescript
const updatedGoal = await updateRehabilitationGoal("goal-id", {
  status: "active",
  actual_completion_rate: 25
})
```

**권한 요구사항:** `update_goals`

---

### 목표 완료율 업데이트
목표의 완료율을 업데이트하고 상태를 자동 조정합니다.

```typescript
export async function updateGoalCompletion(goalId: string, completionRate: number, notes?: string): Promise<RehabilitationGoal>
```

**예시:**
```typescript
const goal = await updateGoalCompletion("goal-id", 100, "목표 완료됨")
```

**권한 요구사항:** `update_goals`

---

### 필터링된 목표 조회
다양한 필터 조건으로 목표를 조회합니다.

```typescript
export async function getRehabilitationGoals(filters: GoalFilters): Promise<RehabilitationGoal[]>
```

**매개변수:**
```typescript
interface GoalFilters {
  patientId?: string
  socialWorkerId?: string
  status?: string
  goalType?: string
  parentGoalId?: string | null
  isAiSuggested?: boolean
  priorityMin?: number
  priorityMax?: number
  dateFrom?: string
  dateTo?: string
  weekNumber?: number
  monthNumber?: number
  limit?: number
  offset?: number
}
```

**예시:**
```typescript
const activeGoals = await getRehabilitationGoals({
  patientId: "patient-id",
  status: "active",
  goalType: "monthly"
})
```

**권한 요구사항:** `view_patient_data`

---

### AI 추천으로부터 목표 생성
AI 추천을 기반으로 목표 계층을 생성합니다.

```typescript
export async function createGoalsFromAIRecommendation(
  recommendationId: string,
  socialWorkerId: string,
  selectedPlanNumbers?: number[]
): Promise<RehabilitationGoal[]>
```

**예시:**
```typescript
const createdGoals = await createGoalsFromAIRecommendation(
  "recommendation-id",
  "social-worker-id",
  [1, 2] // 특정 계획만 선택
)
```

**권한 요구사항:** `create_goals`

---

### 목표 통계
목표 관련 통계를 조회합니다.

```typescript
export async function getGoalStatistics(filters?: GoalStatsFilters): Promise<GoalStatistics>
```

**반환값:**
```typescript
interface GoalStatistics {
  total_goals: number
  completed_goals: number
  in_progress_goals: number
  pending_goals: number
  average_completion_rate: number
  ai_suggested_count: number
  completion_rate: number
  goals_by_type: Record<string, number>
  goals_by_priority: Record<number, number>
  unique_patients: number
}
```

**예시:**
```typescript
const stats = await getGoalStatistics({
  dateFrom: "2024-01-01",
  dateTo: "2024-12-31"
})
```

**권한 요구사항:** `view_analytics`

---

## AI 추천 서비스 (AIRecommendationService)

### 환자별 AI 추천 조회
특정 환자의 AI 추천 목록을 조회합니다.

```typescript
export async function getPatientAIRecommendations(patientId: string): Promise<AIGoalRecommendation[]>
```

**예시:**
```typescript
const recommendations = await getPatientAIRecommendations("patient-id")
```

**권한 요구사항:** `view_patient_data`

---

### AI 추천 상세 조회
특정 AI 추천의 상세 정보를 조회합니다.

```typescript
export async function getAIRecommendationWithDetails(recommendationId: string): Promise<AIGoalRecommendationWithDetails>
```

**반환값:** AI 추천과 관련된 환자, 평가, 적용자 정보 포함

**예시:**
```typescript
const recommendation = await getAIRecommendationWithDetails("recommendation-id")
```

**권한 요구사항:** `view_patient_data`

---

### 활성 AI 추천 조회
환자의 현재 활성 AI 추천을 조회합니다.

```typescript
export async function getActivePatientRecommendation(patientId: string): Promise<AIGoalRecommendation | null>
```

**예시:**
```typescript
const activeRec = await getActivePatientRecommendation("patient-id")
```

**권한 요구사항:** `view_patient_data`

---

### 평가 기반 AI 추천 조회
특정 평가를 기반으로 한 AI 추천을 조회합니다.

```typescript
export async function getAIRecommendationByAssessment(
  assessmentId: string,
  patientId: string
): Promise<StructuredAIRecommendation | null>
```

**반환값:**
```typescript
interface StructuredAIRecommendation {
  id: string
  patient_id: string
  assessment_id: string
  recommendation_date: string
  recommendations: AIRecommendationPlan[]
  patient_analysis?: object
  success_indicators?: object
  execution_strategy?: object
  is_active: boolean
  applied_at: string | null
  applied_by: string | null
}

interface AIRecommendationPlan {
  plan_number: number
  title: string
  purpose: string
  sixMonthGoal: string
  monthlyGoals: Array<{
    month: number
    goal: string
  }>
  weeklyPlans: Array<{
    week: number
    month: number
    plan: string
  }>
}
```

**예시:**
```typescript
const recommendation = await getAIRecommendationByAssessment("assessment-id", "patient-id")
```

**권한 요구사항:** `view_patient_data`

---

### AI 추천 생성
새로운 AI 추천을 생성합니다.

```typescript
export async function createAIRecommendation(recommendation: AIRecommendationCreateData): Promise<AIGoalRecommendation>
```

**예시:**
```typescript
const newRecommendation = await createAIRecommendation({
  patient_id: "patient-id",
  assessment_id: "assessment-id",
  recommendation_date: "2024-01-15",
  recommendations: [
    {
      plan_number: 1,
      title: "사회적 기능 향상 계획",
      purpose: "대인관계 기술 개발",
      sixMonthGoal: "주 2회 이상 사회적 활동 참여",
      monthlyGoals: [
        { month: 1, goal: "기본 사회적 기술 습득" },
        { month: 2, goal: "소규모 그룹 활동 참여" }
      ],
      weeklyPlans: [
        { week: 1, month: 1, plan: "개별 상담 진행" },
        { week: 2, month: 1, plan: "사회적 불안 관리 기법 학습" }
      ]
    }
  ],
  is_active: false
})
```

**권한 요구사항:** `create_assessments`

---

### AI 추천 적용
AI 추천을 적용 상태로 변경합니다.

```typescript
export async function applyAIRecommendation(recommendationId: string, appliedBy: string): Promise<AIGoalRecommendation>
```

**예시:**
```typescript
const appliedRec = await applyAIRecommendation("recommendation-id", "social-worker-id")
```

**권한 요구사항:** `create_goals`

---

### 평가 기반 AI 추천 자동 생성
평가를 기반으로 AI 추천을 자동 생성합니다.

```typescript
export async function generateAIRecommendationFromAssessment(
  patientId: string,
  assessmentId: string,
  socialWorkerId?: string
): Promise<AIGoalRecommendation>
```

**예시:**
```typescript
const generatedRec = await generateAIRecommendationFromAssessment(
  "patient-id",
  "assessment-id",
  "social-worker-id"
)
```

**권한 요구사항:** `create_assessments`

---

### AI 추천 통계
AI 추천 관련 통계를 조회합니다.

```typescript
export async function getAIRecommendationStatistics(filters?: AIRecommendationStatsFilters): Promise<AIRecommendationStatistics>
```

**반환값:**
```typescript
interface AIRecommendationStatistics {
  total_recommendations: number
  active_recommendations: number
  applied_recommendations: number
  unique_patients: number
  application_rate: number
}
```

**예시:**
```typescript
const stats = await getAIRecommendationStatistics({
  dateFrom: "2024-01-01",
  socialWorkerId: "social-worker-id"
})
```

**권한 요구사항:** `view_analytics`

---

## 진행 추적 서비스 (ProgressTrackingService)

### 전체 진행률 통계 조회
시스템 전체의 진행률 통계를 조회합니다.

```typescript
export const getProgressStats = async (): Promise<ProgressStats>
```

**반환값:**
```typescript
interface ProgressStats {
  averageProgress: number
  achievementRate: number
  participationRate: number
  trend: 'up' | 'down' | 'stable'
}
```

**예시:**
```typescript
const stats = await getProgressStats()
// { averageProgress: 75, achievementRate: 60, participationRate: 85, trend: 'up' }
```

**권한 요구사항:** `view_analytics`

---

### 개별 환자 진행 현황 조회
모든 환자의 진행 현황을 조회합니다.

```typescript
export const getPatientProgress = async (): Promise<PatientProgress[]>
```

**반환값:**
```typescript
interface PatientProgress {
  patientId: string
  patientName: string
  goalId: string
  goalTitle: string
  goalDescription: string
  targetValue: string
  currentValue: string
  progressPercentage: number
  trend: 'up' | 'down' | 'stable'
  lastUpdated: string
  status: string
}
```

**예시:**
```typescript
const progress = await getPatientProgress()
```

**권한 요구사항:** `view_patient_data`

---

### 주간 활동 요약 조회
이번 주의 활동 요약을 조회합니다.

```typescript
export const getWeeklyActivities = async (): Promise<WeeklyActivity[]>
```

**반환값:**
```typescript
interface WeeklyActivity {
  date: string
  activities: {
    patientName: string
    activityType: string
    status: 'completed' | 'in-progress' | 'scheduled'
  }[]
}
```

**예시:**
```typescript
const activities = await getWeeklyActivities()
```

**권한 요구사항:** `view_patient_data`

---

### 진행 알림 조회
주의가 필요한 진행 상황에 대한 알림을 조회합니다.

```typescript
export const getProgressAlerts = async (): Promise<ProgressAlert[]>
```

**반환값:**
```typescript
interface ProgressAlert {
  id: string
  type: 'warning' | 'info' | 'success'
  message: string
  patientName: string
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
}
```

**예시:**
```typescript
const alerts = await getProgressAlerts()
```

**권한 요구사항:** `view_patient_data`

---

### 전체 진행 추적 데이터 조회
모든 진행 추적 데이터를 한 번에 조회합니다.

```typescript
export const getAllProgressData = async (): Promise<{
  stats: ProgressStats
  patientProgress: PatientProgress[]
  weeklyActivities: WeeklyActivity[]
  alerts: ProgressAlert[]
}>
```

**예시:**
```typescript
const allData = await getAllProgressData()
```

**권한 요구사항:** `view_patient_data`

---

## 주간 체크인 서비스 (WeeklyCheckInService)

### 목표별 주간 체크인 조회
특정 목표의 모든 주간 체크인을 조회합니다.

```typescript
export async function getGoalWeeklyCheckIns(goalId: string): Promise<WeeklyCheckIn[]>
```

**예시:**
```typescript
const checkIns = await getGoalWeeklyCheckIns("goal-id")
```

**권한 요구사항:** `view_patient_data`

---

### 주간 체크인 상세 조회
특정 주간 체크인의 상세 정보를 조회합니다.

```typescript
export async function getWeeklyCheckInWithDetails(checkInId: string): Promise<WeeklyCheckInWithDetails>
```

**예시:**
```typescript
const checkIn = await getWeeklyCheckInWithDetails("checkin-id")
```

**권한 요구사항:** `view_patient_data`

---

### 주간 체크인 생성
새로운 주간 체크인을 생성합니다.

```typescript
export async function createWeeklyCheckIn(checkIn: WeeklyCheckInCreateData): Promise<WeeklyCheckIn>
```

**매개변수:**
```typescript
interface WeeklyCheckInCreateData {
  goal_id: string
  week_number: number
  check_in_date: string
  is_completed: boolean
  mood_rating?: number // 1-5
  completion_notes?: string
  challenges_faced?: string
  achievements?: string
  checked_by: string
}
```

**예시:**
```typescript
const newCheckIn = await createWeeklyCheckIn({
  goal_id: "goal-id",
  week_number: 3,
  check_in_date: "2024-01-15",
  is_completed: true,
  mood_rating: 4,
  completion_notes: "목표 달성함",
  achievements: "소그룹 활동 2회 참여",
  checked_by: "social-worker-id"
})
```

**권한 요구사항:** `create_assessments` 또는 `submit_check_ins`

---

### 주간 체크인 수정
기존 주간 체크인을 수정합니다.

```typescript
export async function updateWeeklyCheckIn(id: string, updates: WeeklyCheckInUpdateData): Promise<WeeklyCheckIn>
```

**예시:**
```typescript
const updated = await updateWeeklyCheckIn("checkin-id", {
  is_completed: true,
  mood_rating: 5,
  completion_notes: "목표 초과 달성"
})
```

**권한 요구사항:** `update_goals` 또는 본인 체크인

---

### 필터링된 주간 체크인 조회
다양한 필터 조건으로 주간 체크인을 조회합니다.

```typescript
export async function getWeeklyCheckInsWithFilters(filters: WeeklyCheckInFilters): Promise<WeeklyCheckIn[]>
```

**매개변수:**
```typescript
interface WeeklyCheckInFilters {
  goalId?: string
  patientId?: string
  checkerId?: string
  weekNumber?: number
  dateFrom?: string
  dateTo?: string
  isCompleted?: boolean
  moodRatingMin?: number
  moodRatingMax?: number
  limit?: number
  offset?: number
}
```

**예시:**
```typescript
const completedCheckIns = await getWeeklyCheckInsWithFilters({
  patientId: "patient-id",
  isCompleted: true,
  dateFrom: "2024-01-01"
})
```

**권한 요구사항:** `view_patient_data`

---

### 주간 체크인 통계
주간 체크인 관련 통계를 조회합니다.

```typescript
export async function getWeeklyCheckInStatistics(filters?: WeeklyCheckInStatsFilters): Promise<WeeklyCheckInStats>
```

**반환값:**
```typescript
interface WeeklyCheckInStats {
  total_check_ins: number
  completed_check_ins: number
  completion_rate: number
  average_mood_rating: number
  weekly_trends: Record<string, any>
  goal_types: Record<string, any>
  categories: Record<string, any>
  mood_distribution: Record<number, number>
}
```

**예시:**
```typescript
const stats = await getWeeklyCheckInStatistics({
  patientId: "patient-id",
  dateFrom: "2024-01-01"
})
```

**권한 요구사항:** `view_analytics`

---

### 목표별 주간 진행률
특정 목표의 주간 진행률을 조회합니다.

```typescript
export async function getGoalWeeklyProgress(goalId: string): Promise<{
  check_ins: WeeklyCheckIn[]
  total_weeks: number
  completed_weeks: number
  completion_rate: number
  average_mood: number
  trend: string
}>
```

**예시:**
```typescript
const progress = await getGoalWeeklyProgress("goal-id")
```

**권한 요구사항:** `view_patient_data`

---

### 목표별 주간 체크인 일괄 생성
목표의 전체 기간에 대한 주간 체크인을 일괄 생성합니다.

```typescript
export async function generateWeeklyCheckInsForGoal(
  goalId: string,
  startDate: string,
  endDate: string,
  checkerId: string
): Promise<WeeklyCheckIn[]>
```

**예시:**
```typescript
const checkIns = await generateWeeklyCheckInsForGoal(
  "goal-id",
  "2024-01-01",
  "2024-06-30",
  "social-worker-id"
)
```

**권한 요구사항:** `create_goals`

---

## 서비스 기록 서비스 (ServiceRecordService)

서비스 기록 관련 기능은 다른 서비스들과 유사한 패턴을 따릅니다.

### 주요 기능
- 서비스 기록 생성, 조회, 수정, 삭제
- 환자별/사회복지사별 서비스 기록 필터링
- 서비스 유형별 통계
- 서비스 시간 추적

**권한 요구사항:** 주로 `session:create`, `session:read`, `session:update`

---

## 목표 카테고리 서비스 (GoalCategoryService)

목표 분류를 위한 카테고리 관리 기능을 제공합니다.

### 주요 기능
- 카테고리 계층 관리
- 카테고리별 목표 통계
- 색상 및 아이콘 설정

**권한 요구사항:** 주로 `manage_system_settings`, `view_patient_data`

---

## 목표 평가 서비스 (GoalEvaluationService)

목표 달성도 평가 관련 기능을 제공합니다.

### 주요 기능
- 목표 평가 기록 생성 및 관리
- 평가 지표 정의
- 진행률 추적

**권한 요구사항:** 주로 `create_assessments`, `view_patient_data`

---

## 사회복지사 서비스 (SocialWorkerService)

사회복지사 관리 및 업무 관련 기능을 제공합니다.

### 주요 기능
- 사회복지사 목록 조회
- 담당 환자 관리
- 업무량 통계

**권한 요구사항:** 주로 `manage_social_workers`, `view_all_data`

---

## 대시보드 서비스 (DashboardService)

대시보드 화면을 위한 통합 데이터 제공 기능입니다.

### 주요 기능
- 요약 통계 제공
- 최근 활동 내역
- 알림 및 알람
- 차트 데이터

**권한 요구사항:** 역할별 다름 (`view_analytics`, `view_own_analytics`)

---

## 실시간 데이터 동기화

Supabase의 실시간 구독 기능을 활용하여 데이터 변경사항을 실시간으로 동기화할 수 있습니다.

### 예시: 환자 데이터 실시간 구독
```typescript
const subscription = supabase
  .channel('patients')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'patients'
  }, (payload) => {
    console.log('Patient data changed:', payload)
    // 데이터 업데이트 처리
  })
  .subscribe()

// 구독 해제
subscription.unsubscribe()
```

---

## 성능 최적화

### 캐싱 전략
- TanStack Query를 통한 자동 캐싱
- 적절한 캐시 무효화
- 백그라운드 데이터 갱신

### 페이지네이션
모든 목록 조회 API는 페이지네이션을 지원합니다.

### 필터링
복잡한 검색 조건을 지원하여 필요한 데이터만 조회합니다.

---

## 보안

### Row Level Security (RLS)
Supabase의 RLS를 통해 데이터 접근을 제어합니다.

### 권한 기반 접근 제어
각 API 호출 시 사용자의 역할과 권한을 확인합니다.

### 데이터 검증
모든 입력 데이터는 서버 사이드에서 검증됩니다.

---

## 개발 가이드라인

### 에러 처리
```typescript
try {
  const result = await SomeService.someMethod()
  return result
} catch (error) {
  console.error('Service error:', error)
  throw new Error('사용자 친화적인 에러 메시지')
}
```

### 타입 안전성
모든 함수는 TypeScript 타입을 정의하고 사용합니다.

### 로깅
중요한 작업에 대해서는 적절한 로깅을 수행합니다.

---

## 변경 이력

### v1.0.0 (2024-01-15)
- 초기 API 문서 작성
- 모든 주요 서비스 문서화
- 타입 정의 및 예시 코드 추가

---

이 문서는 지속적으로 업데이트되며, API 변경사항이 있을 때마다 새로운 버전이 릴리스됩니다.