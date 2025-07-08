# Error Handling Migration Guide

## 개요

이 문서는 `console.error`를 토스트 알림 기반 에러 처리로 마이그레이션하는 가이드입니다.

## 진행 상황

- **시작 시점**: 304개 console.error
- **현재 상태**: 0개 console.error (304개 마이그레이션 완료)
- **완료율**: 100%
- **최종 완료일**: 2025-07-09

## 새로운 에러 처리 유틸리티

### 기본 사용법

```typescript
import { handleError, handleApiError, showSuccess } from '@/utils/error-handler'

// 기본 에러 처리
handleError(error, '작업 중 오류가 발생했습니다.')

// API 에러 처리
handleApiError(error, 'PatientService.create')

// 성공 메시지
showSuccess('환자 정보가 저장되었습니다.')
```

## 마이그레이션 패턴

### 1. 서비스 클래스에서

**변경 전:**
```typescript
try {
  const result = await supabase.from('patients').insert(data)
  if (result.error) {
    console.error('환자 생성 실패:', result.error)
    return { success: false, error: '환자 생성에 실패했습니다.' }
  }
} catch (error) {
  console.error('예외 발생:', error)
  return { success: false, error: '오류가 발생했습니다.' }
}
```

**변경 후:**
```typescript
import { handleApiError } from '@/utils/error-handler'

try {
  const result = await supabase.from('patients').insert(data)
  if (result.error) {
    handleApiError(result.error, 'PatientService.create')
    return { success: false, error: '환자 생성에 실패했습니다.' }
  }
} catch (error) {
  handleApiError(error, 'PatientService.create')
  return { success: false, error: '오류가 발생했습니다.' }
}
```

### 2. React 컴포넌트에서

**변경 전:**
```typescript
const handleSubmit = async (data: FormData) => {
  try {
    const result = await saveData(data)
    if (!result.success) {
      console.error('저장 실패')
      setError('저장에 실패했습니다.')
    }
  } catch (error) {
    console.error('오류:', error)
    setError('오류가 발생했습니다.')
  }
}
```

**변경 후:**
```typescript
import { handleError, showSuccess } from '@/utils/error-handler'

const handleSubmit = async (data: FormData) => {
  try {
    const result = await saveData(data)
    if (!result.success) {
      handleError(null, '저장에 실패했습니다.')
    } else {
      showSuccess('저장되었습니다.')
    }
  } catch (error) {
    handleError(error, '저장 중 오류가 발생했습니다.')
  }
}
```

### 3. 비동기 작업에서

**변경 전:**
```typescript
async function fetchData() {
  try {
    const data = await api.getData()
    return data
  } catch (error) {
    console.error('데이터 로드 실패:', error)
    return null
  }
}
```

**변경 후:**
```typescript
import { tryCatch } from '@/utils/error-handler'

async function fetchData() {
  return await tryCatch(
    () => api.getData(),
    '데이터를 불러올 수 없습니다.',
    { context: 'fetchData' }
  )
}
```

### 4. 폼 검증에서

**변경 전:**
```typescript
const errors = validateForm(data)
if (Object.keys(errors).length > 0) {
  console.error('폼 검증 실패:', errors)
  setFormErrors(errors)
}
```

**변경 후:**
```typescript
import { handleValidationError } from '@/utils/error-handler'

const errors = validateForm(data)
if (Object.keys(errors).length > 0) {
  handleValidationError(errors, 'UserForm')
  setFormErrors(errors)
}
```

## 에러 처리 옵션

### handleError 옵션

```typescript
interface ErrorHandlerOptions {
  showToast?: boolean      // 토스트 표시 여부 (기본: true)
  logToConsole?: boolean   // 콘솔 로그 여부 (기본: 개발 환경에서만)
  context?: string         // 에러 발생 위치 (디버깅용)
}

// 예시
handleError(error, '메시지', {
  showToast: false,      // 사용자에게 알리지 않음
  logToConsole: true,    // 콘솔에는 로그
  context: 'BackgroundSync'
})
```

### Phase 2.5: 추가 주요 컴포넌트 및 훅
- [x] ApprovedSignUpPage ✅ (2025-07-09) - 5개 console.error 마이그레이션 완료
- [x] AnnouncementsManagement ✅ (2025-07-09) - 5개 console.error 마이그레이션 완료
- [x] usePatients hook ✅ (2025-07-09) - 5개 console.error 마이그레이션 완료
- [x] useGoalSave hook ✅ (2025-07-09) - 5개 console.error 마이그레이션 완료
- [x] useAIProcessing hook ✅ (2025-07-09) - 5개 console.error 마이그레이션 완료
- [x] PatientUnifiedModal ✅ (2025-07-09) - 5개 console.error 마이그레이션 완료
- [x] useValidatedForm hook ✅ (2025-07-09) - 4개 console.error 마이그레이션 완료
- [x] useAssessments hook ✅ (2025-07-09) - 4개 console.error 마이그레이션 완료
- [x] SimpleWeeklyCheckbox ✅ (2025-07-09) - 4개 console.error 마이그레이션 완료
- [x] Header component ✅ (2025-07-09) - 4개 console.error 마이그레이션 완료
- [x] userManagement service ✅ (2025-07-09) - 3개 console.error 마이그레이션 완료
- [x] goalService ✅ (2025-07-09) - 3개 console.error 마이그레이션 완료
- [x] fix-goal-dates-simple service ✅ (2025-07-09) - 3개 console.error 마이그레이션 완료
- [x] PatientManagement page ✅ (2025-07-09) - 3개 console.error 마이그레이션 완료
- [x] SignUpPage ✅ (2025-07-09) - 3개 console.error 마이그레이션 완료
- [x] useAIRecommendationArchive hook ✅ (2025-07-09) - 3개 console.error 마이그레이션 완료
- [x] archiveCompletedGoals script ✅ (2025-07-09) - 3개 console.error 마이그레이션 완료
- [x] PatientsDataTable component ✅ (2025-07-09) - 3개 console.error 마이그레이션 완료
- [x] AIRecommendationDisplay component ✅ (2025-07-09) - 2개 console.error 마이그레이션 완료
- [x] ProgressTracking page ✅ (2025-07-09) - 2개 console.error 마이그레이션 완료
- [x] PatientDetailPage ✅ (2025-07-09) - 2개 console.error 마이그레이션 완료
- [x] PatientAssignment page ✅ (2025-07-09) - 2개 console.error 마이그레이션 완료
- [x] useAIPolling hook ✅ (2025-07-09) - 2개 console.error 마이그레이션 완료
- [x] SocialWorkerAssignment component ✅ (2025-07-09) - 2개 console.error 마이그레이션 완료
- [x] PatientEditModal component ✅ (2025-07-09) - 2개 console.error 마이그레이션 완료
- [x] PatientDetailModal component ✅ (2025-07-09) - 2개 console.error 마이그레이션 완료
- [x] ArchivedGoalSelection component ✅ (2025-07-09) - 2개 console.error 마이그레이션 완료
- [x] useAssessmentForm hook ✅ (2025-07-09) - 2개 console.error 마이그레이션 완료

### Phase 2.6: 추가 마이그레이션 (5차~7차 배치)
- [x] ai-recommendations service ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] usePermissions hook ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] useAIRecommendations hook ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] useAssessmentSave hook ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] PatientStatusManager component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] PatientRegistrationForm component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] PatientEditForm component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] SimpleDashboard component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] RehabStatsCards component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] ProgressChart component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] InlineDateEditor component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] PatientRegistrationModal component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] Sidebar component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] GoalForm component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] DevStatus component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료

### Phase 2.7: 추가 마이그레이션 (8차~9차 배치)
- [x] ComparisonManager component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] usePolling hook ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] AdminRecentActivity component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] UserModal component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] AdminProtectedRoute component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] ManagementProtectedRoute component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] SimpleProtectedRoute component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] DashboardTabs component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] SocialWorkerStatsChart component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] auth-utils lib ✅ (2025-07-09) - 2개 console.error 마이그레이션 완료
- [x] queryClient lib ✅ (2025-07-09) - 2개 console.error 마이그레이션 완료
- [x] env lib ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료
- [x] cleanup-duplicate-goals script ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료

### Phase 2.8: 최종 마이그레이션 (10차 배치)
- [x] LoginPage component ✅ (2025-07-09) - 1개 console.error 마이그레이션 완료

## 🎉 마이그레이션 완료

모든 console.error가 성공적으로 handleApiError로 마이그레이션되었습니다!

## 마이그레이션 체크리스트

### Phase 1: 핵심 서비스 (1주차) ✅
- [x] AuthService ✅ (2025-07-08)
  - [x] auth.ts - 7개 console.error 마이그레이션 완료
- [x] PatientService ✅ (2025-07-08)
  - [x] patient-management.ts - 23개 console.error 마이그레이션 완료
- [ ] GoalService
- [ ] AssessmentService
- [x] DashboardService ✅ (2025-07-08)
  - [x] dashboard-stats.ts - 28개 console.error 마이그레이션 완료
- [x] AIRecommendationArchiveService ✅ (2025-07-08)
  - [x] ai-recommendation-archive.ts - 24개 console.error 마이그레이션 완료
- [x] Supabase Lib ✅ (2025-07-08)
  - [x] lib/supabase.ts - 20개 console.error 마이그레이션 완료
- [x] SocialWorkerDashboard ✅ (2025-07-08)
  - [x] socialWorkerDashboard.ts - 11개 console.error 마이그레이션 완료
- [x] ProgressTracking ✅ (2025-07-08)
  - [x] progress-tracking.ts - 8개 console.error 마이그레이션 완료

### Phase 1.5: 추가 핵심 페이지 및 서비스
- [x] UserManagement 페이지 ✅ (2025-07-08)
  - [x] UserManagement.tsx - 11개 console.error 마이그레이션 완료

### Phase 2: 주요 컴포넌트 (2주차)
- [x] 로그인/회원가입 폼 ✅ (2025-07-09)
  - [x] LoginPage - 1개 console.error 마이그레이션 완료
  - [x] ForgotPasswordPage - 1개 console.error 마이그레이션 완료
  - [x] PendingApprovalPage - 1개 console.error 마이그레이션 완료
  - [x] ResetPasswordPage - 1개 console.error 마이그레이션 완료
- [x] 서비스 기록 컴포넌트 ✅ (2025-07-09)
  - [x] ServiceRecordsList - 1개 console.error 마이그레이션 완료
  - [x] ServiceRecordForm - 1개 console.error 마이그레이션 완료
- [x] 환자 관리 컴포넌트 ✅ (2025-07-09)
  - [x] PatientStatusManager - 1개 console.error 마이그레이션 완료
  - [x] PatientRegistrationForm - 1개 console.error 마이그레이션 완료
  - [x] PatientEditForm - 1개 console.error 마이그레이션 완료
  - [x] PatientRegistrationModal - 1개 console.error 마이그레이션 완료
- [x] 목표 관리 컴포넌트 ✅ (2025-07-09)
  - [x] GoalForm - 1개 console.error 마이그레이션 완료
- [ ] 평가 관련 컴포넌트

### Phase 3: 유틸리티 및 훅 (3주차)
- [ ] Custom hooks
- [ ] Utility functions
- [ ] API 통신 레이어

### Phase 4: 나머지 컴포넌트 (4주차)
- [x] 대시보드 컴포넌트 ✅ (2025-07-09)
  - [x] SimpleDashboard - 1개 console.error 마이그레이션 완료
  - [x] RehabStatsCards - 1개 console.error 마이그레이션 완료
  - [x] ProgressChart - 1개 console.error 마이그레이션 완료
- [ ] 설정 관련 컴포넌트
- [x] 기타 UI 컴포넌트 ✅ (2025-07-09)
  - [x] InlineDateEditor - 1개 console.error 마이그레이션 완료
  - [x] Sidebar - 1개 console.error 마이그레이션 완료
  - [x] DevStatus - 1개 console.error 마이그레이션 완료

## 주의사항

1. **민감한 정보 노출 방지**
   - 에러 메시지에 사용자 정보나 시스템 정보 포함 금지
   - 개발/운영 환경 구분하여 메시지 표시

2. **일관된 메시지**
   - 사용자 친화적인 메시지 사용
   - 기술적 용어 피하기

3. **적절한 에러 처리**
   - 모든 에러를 토스트로 표시하지 말 것
   - 백그라운드 작업은 콘솔 로그만 사용

4. **에러 복구**
   - 가능한 경우 에러 복구 방법 제시
   - 재시도 가능한 작업은 재시도 버튼 제공

## 테스트

마이그레이션 후 다음 항목 테스트:

1. 에러 메시지가 토스트로 표시되는지 확인
2. 개발 환경에서 콘솔 로그 출력 확인
3. 운영 환경에서 콘솔 로그 미출력 확인
4. 에러 발생 시 사용자 경험 개선 확인

## 다음 우선순위 작업

### 즉시 처리 필요 (높은 사용 빈도)
1. **AuthService** (src/services/auth.ts) - 7개
   - 인증 관련 핵심 서비스
   - 모든 사용자에게 영향

2. **UserManagement 페이지** (src/pages/admin/UserManagement.tsx) - 11개
   - 관리자 핵심 기능
   - 사용자 관리 시 에러 처리 중요

3. **ProgressTracking 서비스** (src/services/progress-tracking.ts) - 8개
   - 진행 상황 추적 핵심 기능

### 중간 우선순위
4. **DashboardService** (src/services/dashboardService.ts) - 8개 ✅ (2025-07-08)
5. **PermissionService** (src/services/permissionService.ts) - 7개 ✅ (2025-07-08)
6. **GoalSetting 페이지** (src/pages/GoalSetting.tsx) - 7개 ✅ (2025-07-08)
7. **RolePermissions 서비스** (src/services/rolePermissions.ts) - 6개 ✅ (2025-07-08)
8. **Patients 서비스** (src/services/patients.ts) - 6개 ✅ (2025-07-08)
9. **AI Recommendation 서비스** (src/services/goalSetting/aiRecommendationService.ts) - 6개 ✅ (2025-07-08)

## 향후 개선사항

1. **에러 모니터링 통합**
   ```typescript
   // Sentry 통합 예정
   handleError(error, message, {
     reportToSentry: true
   })
   ```

2. **에러 분류 체계**
   - 네트워크 에러
   - 인증 에러
   - 검증 에러
   - 시스템 에러

3. **사용자 피드백 수집**
   - 에러 발생 시 피드백 옵션
   - 자동 에러 리포트