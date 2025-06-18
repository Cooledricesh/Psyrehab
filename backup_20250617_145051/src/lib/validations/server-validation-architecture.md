# Server-Side Validation Architecture

## 개요
PsyRehab 프로젝트의 서버 사이드 데이터 검증 아키텍처 설계 문서

## 기본 원칙

### 1. Defense in Depth (다층 방어)
- 클라이언트 검증과 독립적으로 모든 데이터 검증
- 클라이언트 검증은 UX 향상을 위한 것, 서버 검증은 보안을 위한 것
- 모든 API 엔드포인트에서 입력 데이터 검증 필수

### 2. Fail-Fast Principle
- 잘못된 데이터는 가능한 한 빠르게 거부
- 비즈니스 로직 실행 전에 모든 검증 완료
- 명확한 에러 응답으로 빠른 피드백 제공

### 3. Consistent Error Handling
- 표준화된 에러 응답 형식
- 일관된 HTTP 상태 코드 사용
- 사용자 친화적 에러 메시지

## 아키텍처 컴포넌트

### 1. Validation Middleware Layer
```
Request → Authentication → Validation Middleware → Business Logic → Response
```

#### 검증 미들웨어 역할:
- 요청 데이터 파싱 및 초기 검증
- 스키마 기반 검증 실행
- 에러 발생 시 표준화된 응답 반환
- 검증된 데이터를 비즈니스 로직으로 전달

### 2. Schema Definition Layer
```
src/lib/validations/
├── schemas/
│   ├── patient-schemas.ts      # 환자 관련 스키마
│   ├── service-schemas.ts      # 서비스 관련 스키마
│   ├── goal-schemas.ts         # 목표 관련 스키마
│   ├── auth-schemas.ts         # 인증 관련 스키마
│   └── common-schemas.ts       # 공통 스키마
├── middleware/
│   ├── validation-middleware.ts
│   ├── sanitization-middleware.ts
│   └── rate-limiting-middleware.ts
└── utils/
    ├── validation-helpers.ts
    ├── error-mappers.ts
    └── sanitization-utils.ts
```

### 3. Error Response Layer
```typescript
// 표준 에러 응답 형식
interface ValidationErrorResponse {
  success: false
  error: {
    type: 'VALIDATION_ERROR'
    message: string
    details: ValidationError[]
    timestamp: string
    requestId: string
  }
}

interface ValidationError {
  field: string
  value: any
  message: string
  code: string
}
```

## 검증 전략

### 1. Input Validation
```typescript
// 1단계: 타입 및 형식 검증
const basicValidation = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120)
})

// 2단계: 비즈니스 규칙 검증
const businessValidation = {
  checkEmailUniqueness: async (email: string) => {...},
  validatePatientAge: (age: number, serviceType: string) => {...},
  checkServiceCapacity: async (serviceId: string, participantCount: number) => {...}
}

// 3단계: 권한 검증
const authorizationValidation = {
  canAccessPatient: (userId: string, patientId: string) => {...},
  canCreateService: (userId: string, serviceType: string) => {...}
}
```

### 2. Data Sanitization
```typescript
// XSS 방지
const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
}

// SQL Injection 방지 (Supabase RLS 정책과 함께)
const sanitizeSqlInput = (input: string): string => {
  return input.replace(/['"\\;]/g, '')
}

// 파일명 sanitization
const sanitizeFileName = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_')
}
```

### 3. Rate Limiting
```typescript
// API별 rate limiting 정책
const rateLimitConfig = {
  auth: {
    login: { windowMs: 15 * 60 * 1000, max: 5 }, // 15분에 5회
    signup: { windowMs: 60 * 60 * 1000, max: 3 }, // 1시간에 3회
  },
  api: {
    general: { windowMs: 15 * 60 * 1000, max: 100 }, // 15분에 100회
    upload: { windowMs: 60 * 60 * 1000, max: 10 }, // 1시간에 10회
  }
}
```

## Supabase 통합 검증

### 1. Row Level Security (RLS) 정책
```sql
-- 환자 데이터 접근 제어
CREATE POLICY "Users can only access their assigned patients"
ON patients FOR ALL
USING (
  auth.uid()::text IN (
    SELECT user_id FROM patient_assignments 
    WHERE patient_id = patients.id
  )
);

-- 서비스 레코드 접근 제어
CREATE POLICY "Social workers can only access their services"
ON service_records FOR ALL
USING (
  auth.uid()::text = social_worker_id
  OR 
  auth.uid()::text IN (
    SELECT user_id FROM admins WHERE role = 'admin'
  )
);
```

### 2. Database Constraints
```sql
-- 환자 식별번호 유일성
ALTER TABLE patients 
ADD CONSTRAINT unique_patient_identifier 
UNIQUE (patient_identifier);

-- 서비스 날짜 검증
ALTER TABLE service_records 
ADD CONSTRAINT valid_service_date 
CHECK (service_date_time <= NOW());

-- 나이 범위 검증
ALTER TABLE patients 
ADD CONSTRAINT valid_age 
CHECK (EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 0 AND 120);
```

### 3. Database Functions for Complex Validation
```sql
-- 서비스 용량 검증 함수
CREATE OR REPLACE FUNCTION validate_service_capacity(
  service_id UUID,
  participant_count INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN participant_count <= (
    SELECT max_capacity 
    FROM service_types 
    WHERE id = service_id
  );
END;
$$ LANGUAGE plpgsql;

-- 중복 예약 검증 함수
CREATE OR REPLACE FUNCTION check_booking_conflict(
  social_worker_id UUID,
  service_datetime TIMESTAMP,
  duration_minutes INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM service_records 
    WHERE social_worker_id = check_booking_conflict.social_worker_id
    AND (
      service_date_time BETWEEN 
      service_datetime AND 
      service_datetime + INTERVAL '1 minute' * duration_minutes
    )
  );
END;
$$ LANGUAGE plpgsql;
```

## API 엔드포인트별 검증 전략

### 1. 환자 관리 API
```typescript
// POST /api/patients
const createPatientValidation = [
  validateSchema(patientCreateSchema),
  validateBusinessRules([
    'checkPatientIdentifierUniqueness',
    'validateEmergencyContact',
    'checkSocialWorkerAssignment'
  ]),
  validateAuthorization(['create:patient'])
]

// PUT /api/patients/:id
const updatePatientValidation = [
  validateSchema(patientUpdateSchema),
  validateBusinessRules([
    'checkPatientExists',
    'validateStatusTransition',
    'checkUpdatePermissions'
  ]),
  validateAuthorization(['update:patient'])
]
```

### 2. 서비스 레코드 API
```typescript
// POST /api/service-records
const createServiceValidation = [
  validateSchema(serviceRecordCreateSchema),
  validateBusinessRules([
    'checkServiceCapacity',
    'validateTimeSlot',
    'checkPatientStatus',
    'validateSocialWorkerAvailability'
  ]),
  validateAuthorization(['create:service-record'])
]
```

### 3. 인증 API
```typescript
// POST /api/auth/login
const loginValidation = [
  rateLimitMiddleware('auth.login'),
  validateSchema(loginSchema),
  validateBusinessRules([
    'checkAccountLockout',
    'validateCredentials'
  ])
]

// POST /api/auth/signup
const signupValidation = [
  rateLimitMiddleware('auth.signup'),
  validateSchema(signupSchema),
  validateBusinessRules([
    'checkEmailUniqueness',
    'validateInvitationCode',
    'checkDomainWhitelist'
  ])
]
```

## 에러 처리 및 로깅

### 1. Error Classification
```typescript
enum ValidationErrorType {
  SCHEMA_VALIDATION = 'SCHEMA_VALIDATION',      // Zod 스키마 검증 실패
  BUSINESS_RULE = 'BUSINESS_RULE',              // 비즈니스 규칙 위반
  AUTHORIZATION = 'AUTHORIZATION',              // 권한 부족
  RATE_LIMIT = 'RATE_LIMIT',                   // 요청 한도 초과
  DEPENDENCY = 'DEPENDENCY',                   // 의존성 검증 실패
  CONSTRAINT = 'CONSTRAINT'                    // 데이터베이스 제약 조건 위반
}
```

### 2. Structured Logging
```typescript
interface ValidationLog {
  timestamp: string
  requestId: string
  userId?: string
  endpoint: string
  validationType: ValidationErrorType
  errorDetails: {
    field?: string
    value?: any
    rule?: string
    message: string
  }
  clientIp: string
  userAgent: string
}
```

### 3. Monitoring and Alerting
```typescript
// 검증 실패 모니터링 메트릭
const validationMetrics = {
  // 높은 검증 실패율 알림
  highFailureRate: {
    threshold: 0.1, // 10% 이상
    window: '5m',
    alert: 'slack-security-channel'
  },
  
  // 반복적인 검증 실패 패턴 감지
  repeatedFailures: {
    threshold: 5, // 5회 이상
    window: '1m',
    sameIp: true,
    alert: 'security-team'
  },
  
  // 새로운 검증 실패 패턴 감지
  anomalyDetection: {
    enabled: true,
    sensitivity: 'medium',
    alert: 'development-team'
  }
}
```

## 성능 최적화

### 1. Validation Caching
```typescript
// 비용이 큰 검증 결과 캐싱
const validationCache = new LRUCache<string, boolean>({
  max: 1000,
  ttl: 5 * 60 * 1000 // 5분
})

// 이메일 중복 검사 캐싱
const checkEmailUniqueness = async (email: string): Promise<boolean> => {
  const cacheKey = `email:${email}`
  const cached = validationCache.get(cacheKey)
  
  if (cached !== undefined) {
    return cached
  }
  
  const isUnique = await database.checkEmailExists(email)
  validationCache.set(cacheKey, isUnique)
  
  return isUnique
}
```

### 2. Batch Validation
```typescript
// 여러 항목 일괄 검증
const validateBatch = async (items: ValidationItem[]) => {
  const validationPromises = items.map(item => 
    validateSingle(item).catch(error => ({ item, error }))
  )
  
  const results = await Promise.allSettled(validationPromises)
  
  return {
    successful: results.filter(r => r.status === 'fulfilled'),
    failed: results.filter(r => r.status === 'rejected')
  }
}
```

### 3. Async Validation for Non-Critical Checks
```typescript
// 중요하지 않은 검증은 비동기로 처리
const processRequest = async (data: RequestData) => {
  // 즉시 처리되어야 하는 검증
  await validateCritical(data)
  
  // 응답 후 백그라운드에서 처리
  setImmediate(() => {
    validateNonCritical(data).catch(error => {
      logger.warn('Non-critical validation failed', { error, data })
    })
  })
  
  return processBusinessLogic(data)
}
```

## 테스트 전략

### 1. Unit Tests
```typescript
describe('Patient Validation', () => {
  test('should reject invalid patient identifier', async () => {
    const invalidData = { patient_identifier: 'INVALID' }
    
    const result = await validatePatientSchema(invalidData)
    
    expect(result.success).toBe(false)
    expect(result.errors[0].field).toBe('patient_identifier')
  })
})
```

### 2. Integration Tests
```typescript
describe('Patient API Validation', () => {
  test('should prevent duplicate patient creation', async () => {
    await createPatient({ patient_identifier: 'P2024001' })
    
    const response = await request(app)
      .post('/api/patients')
      .send({ patient_identifier: 'P2024001' })
      .expect(409)
      
    expect(response.body.error.type).toBe('CONFLICT_ERROR')
  })
})
```

### 3. Security Tests
```typescript
describe('Security Validation', () => {
  test('should prevent XSS attacks', async () => {
    const maliciousData = {
      notes: '<script>alert("xss")</script>'
    }
    
    const response = await request(app)
      .post('/api/service-records')
      .send(maliciousData)
      .expect(400)
      
    expect(response.body.error.type).toBe('VALIDATION_ERROR')
  })
})
```

## 구현 체크리스트

### ✅ 설계 완료
- [x] 검증 아키텍처 구조 정의
- [x] 에러 처리 표준화
- [x] Supabase 통합 방안
- [x] 성능 최적화 전략
- [x] 테스트 전략 수립

### 🔄 구현 예정
- [ ] 검증 미들웨어 구현
- [ ] 스키마 정의 및 등록
- [ ] 에러 응답 표준화
- [ ] 로깅 및 모니터링 설정
- [ ] 보안 강화 기능

### 📋 향후 개선사항
- [ ] 동적 검증 규칙 엔진
- [ ] A/B 테스트를 위한 검증 규칙 변경
- [ ] 머신러닝 기반 이상 탐지
- [ ] 실시간 검증 규칙 업데이트 