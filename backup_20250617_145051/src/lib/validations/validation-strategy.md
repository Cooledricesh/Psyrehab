# Client-Side Validation Strategy

## 개요
PsyRehab 프로젝트의 클라이언트 측 데이터 검증 전략과 구현 가이드라인

## 검증 라이브러리
- **주요 라이브러리**: Zod (스키마 기반 검증)
- **폼 관리**: React Hook Form + Zod Resolver
- **실시간 검증**: React Hook Form의 formState를 활용

## 검증 시점 (Validation Timing)

### 1. 실시간 검증 (Real-time)
```typescript
// onChange 이벤트 시 즉시 검증
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onChange' // 입력 즉시 검증
})
```

### 2. 필드 포커스 아웃 검증 (onBlur)
```typescript
// 필드에서 포커스가 벗어날 때 검증
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur'
})
```

### 3. 제출 시 검증 (onSubmit)
```typescript
// 폼 제출 시에만 검증 (기본값)
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onSubmit'
})
```

## 검증 규칙 정의

### 1. 환자 정보 검증
- **이름**: 2-50자, 한글/영문/공백만 허용
- **환자 식별번호**: 특정 패턴 (P2024001, PAT-2024-001)
- **생년월일**: 0-120세 범위
- **전화번호**: 한국 전화번호 형식
- **이메일**: RFC 표준 이메일 형식

### 2. 서비스 레코드 검증
- **서비스 유형/카테고리**: 미리 정의된 enum 값
- **소요시간**: 15분-8시간 범위
- **참가자 수**: 1-50명 범위
- **일시**: 과거/현재 날짜만 허용

### 3. 목표 설정 검증
- **제목**: 필수 입력
- **기간**: 최소 1개월
- **진행률**: 0-100% 범위
- **우선순위**: 정의된 enum 값

## 에러 메시지 표시 전략

### 1. 인라인 에러 (Inline Errors)
```typescript
// 필드 바로 아래 에러 메시지 표시
<FormMessage>
  {errors.fieldName?.message}
</FormMessage>
```

### 2. 필드 그룹 에러
```typescript
// 관련 필드들의 그룹 에러
<Alert variant="destructive">
  <AlertDescription>
    {groupErrorMessage}
  </AlertDescription>
</Alert>
```

### 3. 전체 폼 에러
```typescript
// 폼 상단에 전체 에러 요약
<Card>
  <CardContent>
    <p className="text-destructive">
      입력 정보를 확인해주세요
    </p>
  </CardContent>
</Card>
```

## 검증 스키마 구조

### 1. 모듈별 스키마 분리
```
src/lib/validations/
├── patient-validation.ts     # 환자 관련 검증
├── service-validation.ts     # 서비스 관련 검증
├── goal-validation.ts        # 목표 관련 검증
├── auth-validation.ts        # 인증 관련 검증
└── common-validation.ts      # 공통 검증 유틸
```

### 2. 재사용 가능한 검증 함수
```typescript
// 공통 검증 패턴
export const phoneValidation = z
  .string()
  .regex(/^(\+82-?)?0?1[0-9]-?\d{3,4}-?\d{4}$/, '올바른 전화번호 형식이 아닙니다')

export const emailValidation = z
  .string()
  .email('올바른 이메일 형식이 아닙니다')
```

## 사용자 경험 고려사항

### 1. 점진적 검증
- 필수 필드부터 우선 검증
- 복잡한 규칙은 마지막에 적용
- 사용자 입력 패턴에 따른 적응형 검증

### 2. 도움말 제공
```typescript
// 필드별 도움말 텍스트
<FormDescription>
  환자 식별번호는 P2024001 형식으로 입력해주세요
</FormDescription>
```

### 3. 자동 완성 및 제안
- 이전 입력값 기반 자동완성
- 유효한 형식 예시 제공
- 오타 수정 제안

## 성능 최적화

### 1. 디바운싱 (Debouncing)
```typescript
// 실시간 검증에 디바운싱 적용
const debouncedValidation = useDebouncedCallback(
  (value) => validateField(value),
  300
)
```

### 2. 조건부 검증
```typescript
// 특정 조건에서만 검증 실행
const schema = z.object({
  field: z.string().refine(
    (value) => condition ? validation(value) : true,
    'Error message'
  )
})
```

### 3. 스키마 캐싱
- 복잡한 스키마는 메모이제이션 적용
- 동적 스키마 생성 최소화

## 접근성 (Accessibility) 고려사항

### 1. ARIA 라벨링
```typescript
// 에러 메시지와 필드 연결
<Input
  aria-describedby={error ? `${fieldName}-error` : undefined}
  aria-invalid={!!error}
/>
<div id={`${fieldName}-error`} role="alert">
  {error?.message}
</div>
```

### 2. 색상에 의존하지 않는 에러 표시
- 아이콘과 텍스트 병행 사용
- 명확한 대비 비율 유지

### 3. 키보드 네비게이션 지원
- 에러 발생 시 해당 필드로 포커스 이동
- 탭 순서 논리적 구성

## 다국어 지원

### 1. 에러 메시지 국제화
```typescript
// i18n을 활용한 에러 메시지
const errorMessages = {
  ko: {
    required: '필수 입력 항목입니다',
    email: '올바른 이메일 형식이 아닙니다'
  },
  en: {
    required: 'This field is required',
    email: 'Invalid email format'
  }
}
```

### 2. 로케일별 검증 규칙
- 전화번호, 우편번호 등 지역별 규칙 적용
- 날짜 형식 지역화

## 테스트 전략

### 1. 단위 테스트
```typescript
// 검증 함수별 단위 테스트
describe('Patient Validation', () => {
  it('should validate Korean phone numbers', () => {
    expect(phoneValidation.parse('010-1234-5678')).toBeTruthy()
  })
})
```

### 2. 통합 테스트
- 폼 제출 플로우 전체 테스트
- 에러 처리 시나리오 테스트

### 3. E2E 테스트
- 사용자 관점에서의 검증 플로우 테스트
- 브라우저별 호환성 테스트

## 구현 체크리스트

### ✅ 완료된 항목
- [x] Zod 스키마 기반 검증 시스템
- [x] React Hook Form 통합
- [x] 환자 정보 검증 스키마
- [x] 서비스 레코드 검증 스키마
- [x] 목표 설정 검증 스키마
- [x] 인증 관련 검증 함수
- [x] 에러 메시지 한국어화

### 🔄 진행 중인 항목
- [ ] 통합 검증 유틸리티 개선
- [ ] 실시간 검증 최적화
- [ ] 접근성 향상

### 📋 향후 개선 사항
- [ ] 동적 스키마 생성 최적화
- [ ] 검증 결과 캐싱
- [ ] 커스텀 검증 규칙 확장성
- [ ] 검증 성능 모니터링 