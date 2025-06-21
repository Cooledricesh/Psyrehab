# 🎯 ESLint 오류 개선 계획 (300개 → 150개)

> **현재 상태**: 302개 errors + 51개 warnings = 353개 총 오류  
> **목표**: 150개 이하 달성 (43% 추가 감소)  
> **생성일**: 2025-06-20  
> **업데이트**: 2025-06-21 (고급 대시보드 기능 추가 후)  
> **프로젝트**: PsyRehab (신규 프로젝트, 16일차)

---

## 📊 **현재 오류 분포**

| 오류 유형 | 개수 | 우선순위 | 예상 작업시간 |
|-----------|------|----------|---------------|
| `@typescript-eslint/no-unused-vars` | 215개 | 🔶 MEDIUM | 4-6시간 |
| `@typescript-eslint/no-explicit-any` | 49개 | 🚨 HIGH | 3-4시간 |
| Parsing errors | 10개 | 🚨 HIGH | 1-2시간 |
| `no-case-declarations` | 12개 | 🔶 MEDIUM | 30분 |
| React Hooks warnings | ~20개 | 🔵 LOW | 1-2시간 |
| React Fast Refresh warnings | ~15개 | 🔵 LOW | 1시간 |
| 기타 스타일 오류 | 6개 | 🔵 LOW | 30분 |

---

## 🚀 **Phase 1: 심각도 높은 오류 해결 (59개 감소)**

### ✅ **Task 1.1: 파싱 오류 수정 (10개) - COMPLETED**
**우선순위**: 🚨 CRITICAL  
**실제 소요시간**: 2시간  
**결과**: 10개 → 0개 ✅

#### ✅ 수정 완료된 파일들:
- [x] ~~`src/app/auth/login/page.tsx`~~ - **삭제됨** (Next.js 레거시)
- [x] ~~`src/contexts/AdminAuthContext.tsx`~~ - **삭제됨** (사용되지 않음)
- [x] ~~`src/contexts/AuthContext.tsx`~~ - **삭제됨** (레거시 방식)
- [x] ~~`src/contexts/AuthQueryContext.tsx`~~ - **삭제됨** (레거시 방식)
- [x] `src/contexts/DashboardContext.tsx` - **수정 완료**
- [x] ~~`src/contexts/__tests__/AuthQueryContext.test.tsx`~~ - **삭제됨**
- [x] `src/services/goalBreakdownService.ts` - **수정 완료**
- [x] ~~`src/test/auth.integration.test.tsx`~~ - **정리됨**
- [x] ~~`src/test/auth.simple.test.ts`~~ - **정리됨**
- [x] `src/test/testUtils.tsx` - **수정 완료**

**✅ 완료**: `npm run lint`에서 "Parsing error" 0개 달성

---

### 🔄 **Task 1.2: any 타입 개선 (49개) - IN PROGRESS**
**우선순위**: 🚨 HIGH  
**예상시간**: 3-4시간  
**목표**: 49개 → 10개 이하  
**현재 상태**: 🔄 다음 단계 진행 예정

#### 전략:
1. **API 응답 타입 정의**: Supabase 자동 생성 타입 활용
2. **차트 라이브러리 타입**: recharts, chart.js 타입 정의
3. **이벤트 핸들러 타입**: React 이벤트 타입 사용
4. **AI 관련 any**: 최소한의 interface 정의 (기능 보호)

#### 주요 수정 영역:
- [ ] 평가 폼 컴포넌트들 (`AssessmentForm.tsx`, `DynamicField.tsx`)
- [ ] 차트 컴포넌트들 (`charts/` 디렉토리)
- [ ] API 서비스들 (`services/` 디렉토리)
- [ ] AI 관련 컴포넌트들 (최소 개입)

**완료 기준**: `@typescript-eslint/no-explicit-any` 10개 이하

---

## 🔶 **Phase 2: 대량 정리 (103개 감소)**

### ✅ **Task 2.1: 미사용 변수 대량 정리 (91개 감소)**
**우선순위**: 🔶 MEDIUM  
**예상시간**: 4-6시간  
**목표**: 215개 → 124개

#### 카테고리별 정리:
1. **_prefix 변수들** (50개)
   - [ ] 완전 제거 또는 실제 사용으로 변경
   - [ ] ESLint ignore 주석 추가 고려

2. **미사용 함수들** (40개)
   - [ ] 실제 미사용: 완전 삭제
   - [ ] 미래 사용 예정: 주석 처리

3. **미사용 임포트들** (30개)
   - [ ] 사용되지 않는 컴포넌트/함수 임포트 제거
   - [ ] 자동 임포트 정리 스크립트 실행

4. **미사용 매개변수들** (40개)
   - [ ] 콜백에서 불필요한 매개변수 제거
   - [ ] 구조분해할당에서 필요한 것만 추출

5. **할당 후 미사용 변수들** (55개)
   - [ ] 실제 미사용: 할당 제거
   - [ ] 디버깅용: 조건부 사용 또는 제거

#### 자동화 도구 활용:
- [ ] `eslint --fix` 자동 수정 가능한 것들
- [ ] VS Code 자동 임포트 정리
- [ ] TypeScript unused locals 검사

**완료 기준**: `@typescript-eslint/no-unused-vars` 124개 이하

---

### ✅ **Task 2.2: Switch case 블록 수정 (12개)**
**우선순위**: 🔶 MEDIUM  
**예상시간**: 30분  
**목표**: 12개 → 0개

#### 수정 방법:
- [ ] 각 case 블록에 중괄호 `{}` 추가
- [ ] lexical declaration 스코프 분리

#### 대상 파일들:
- [ ] `src/components/profile/ProfileManager.tsx`
- [ ] `src/lib/supabase.ts`
- [ ] `src/services/auth.ts`
- [ ] 기타 switch 문 포함 파일들

**완료 기준**: `no-case-declarations` 0개

---

## 🔵 **Phase 3: 품질 개선 (35개 감소)**

### ✅ **Task 3.1: React Hooks 최적화 (20개)**
**우선순위**: 🔵 LOW  
**예상시간**: 1-2시간

#### 수정 유형:
- [ ] **누락된 의존성 추가**: useEffect 의존성 배열 보완
- [ ] **불필요한 의존성 제거**: 성능 최적화
- [ ] **useCallback/useMemo 추가**: 리렌더링 최적화

#### 주요 파일들:
- [ ] `src/components/PatientDetailModal.tsx`
- [ ] `src/components/admin/AdminRecentActivity.tsx`
- [ ] `src/components/assessments/comparison/ComparisonManager.tsx`

**완료 기준**: `react-hooks/exhaustive-deps` 경고 최소화

---

### ✅ **Task 3.2: Fast Refresh 경고 해결 (15개)**
**우선순위**: 🔵 LOW  
**예상시간**: 1시간

#### 해결 방법:
- [ ] 상수들을 별도 파일로 분리
- [ ] 유틸리티 함수들을 별도 파일로 분리
- [ ] 컴포넌트 파일에서는 컴포넌트만 export

**완료 기준**: `react-refresh/only-export-components` 경고 최소화

---

### ✅ **Task 3.3: 기타 스타일 오류 (6개)**
**우선순위**: 🔵 LOW  
**예상시간**: 30분

- [ ] `no-useless-escape` (5개): 불필요한 이스케이프 문자 제거
- [ ] `prefer-const` (1개): let → const 변경
- [ ] `no-control-regex` (1개): 정규식 개선

---

## 📅 **마일스톤 및 체크포인트**

### **Checkpoint 1: Critical Issues (1-2일) - 부분 완료**
- [x] 파싱 오류 0개 ✅
- [ ] any 타입 10개 이하 🔄
- **진행상황**: 353개 → 302개 (51개 감소) - 레거시 파일 정리 효과
- **추가 작업**: 고급 대시보드 기능 추가로 일부 오류 증가

### **Checkpoint 2: Major Cleanup (3-4일)**
- [ ] 미사용 변수 124개 이하
- [ ] Switch case 오류 0개
- **목표**: 302개 → 189개 (113개 감소)

### **Checkpoint 3: Quality Polish (1일)**
- [ ] React Hooks 경고 최소화
- [ ] Fast Refresh 경고 최소화
- [ ] 스타일 오류 0개
- **목표**: 189개 → 150개 (39개 감소)

### **최종 목표**
- [ ] **총 오류 150개 이하**
- [x] **파싱 오류 0개** ✅
- [ ] **any 타입 10개 이하**
- [ ] **코드 품질 A급 달성**

---

## 🛡️ **AI 기능 보호 정책**

### **절대 수정 금지 파일들**:
- `src/services/goalSetting/aiRecommendationService.ts`
- `src/pages/GoalSetting.tsx`
- `src/components/GoalSetting/AIRecommendationSelection.tsx`
- `src/hooks/ai-recommendations/useAIRecommendations.ts`
- `src/hooks/GoalSetting/useAIPolling.ts`

### **최소 개입 파일들** (any 타입 개선시):
- AI 관련 타입은 간단한 interface만 정의
- 기능 동작에 영향 없는 선에서만 수정
- 수정 후 반드시 AI 기능 테스트

### **새로 추가된 대시보드 컴포넌트들**:
- `src/components/dashboard/AdvancedDashboard.tsx` - 새 파일
- `src/components/dashboard/DashboardTabs.tsx` - 새 파일  
- `src/components/dashboard/RehabStatsCards.tsx` - 새 파일
- `src/components/dashboard/ProgressChart.tsx` - 새 파일 (recharts 타입 이슈)
- `src/components/dashboard/QuickActions.tsx` - 새 파일
- `src/components/dashboard/PatientsDataTable.tsx` - 새 파일

**참고**: 새 컴포넌트들은 개선 대상에 포함하여 처음부터 타입 안전성 확보

---

## 🔧 **권장 도구 및 명령어**

### **개발 도구**:
```bash
# 전체 린트 검사
npm run lint

# 자동 수정 가능한 것들 처리
npm run lint:fix

# 타입 체크
npm run type-check

# 빌드 테스트
npm run build
```

### **VS Code 확장**:
- ESLint
- TypeScript Hero (자동 임포트 정리)
- TypeScript Importer
- Error Lens

### **정기 체크**:
- [ ] 매일 린트 오류 수 확인
- [ ] 주요 변경 후 AI 기능 테스트
- [ ] 단계별 커밋으로 진행상황 추적

---

## 📈 **진행 상황 트래킹**

| 날짜 | 총 오류수 | 완료된 Task | 비고 |
|------|-----------|-------------|------|
| 2025-06-20 | 351개 | 계획 수립 | 시작점 |
| 2025-06-21 | 302개 | Task 1.1 완료 | 파싱 오류 0개, 레거시 파일 정리 |
| 2025-06-21 | 353개 | 고급 대시보드 추가 | 6개 새 컴포넌트 추가로 일부 증가 |
| | | 다음: Task 1.2 | any 타입 개선 예정 |

---

**✨ 완료 후 예상 효과**:
- 코드 품질 B+ → A급 상승
- 타입 안전성 대폭 향상  
- 개발 생산성 향상
- 유지보수성 개선
- 신규 개발자 온보딩 용이성 증대