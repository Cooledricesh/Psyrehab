# 정신장애인 재활 목표 관리 플랫폼

정신과 사회복지사가 환자의 재활 목표를 체계적으로 관리하는 웹 플랫폼입니다. AI 기반 목표 추천과 계층적 목표 관리 시스템을 제공합니다.

## 🎯 핵심 기능

- **5단계 평가 시스템**: 환자의 현재 상태를 다각도로 평가
- **AI 기반 목표 추천**: N8N 웹훅을 통한 맞춤형 재활 계획 생성
- **계층적 목표 관리**: 6개월 → 월간 → 주간 목표의 체계적 관리
- **실시간 진행 추적**: 주간 체크인 시스템과 자동 진행률 계산
- **목표 완료 확인 시스템**: 사용자 확인 기반의 목표 달성 처리
- **대시보드 분석**: 환자별, 사회복지사별 성과 모니터링

## 🛠 기술 스택

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v7
- **Charts**: Chart.js + Recharts
- **Forms**: React Hook Form + 커스텀 컴포넌트

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT 기반)
- **Real-time**: Supabase Realtime
- **AI Integration**: N8N Workflow Webhook
- **Security**: Row Level Security (RLS)

### Development Tools
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint + Prettier
- **Build Tool**: Vite
- **Type Checking**: TypeScript
- **Package Manager**: npm

## 🚀 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd PsyRehab
npm install
```

### 2. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경변수를 설정하세요:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://jsilzrsiieswiskzcriy.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# n8n Webhook (for AI features)
VITE_N8N_WEBHOOK_URL=your-n8n-webhook-url-here

# API URL (optional, defaults to http://localhost:3001)
VITE_API_URL=http://localhost:3001
```

**환경변수 설명:**
- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase 익명 키 (공개 키)
- `VITE_N8N_WEBHOOK_URL`: AI 기능을 위한 n8n 웹훅 URL
- `VITE_API_URL`: 백엔드 API 서버 URL (선택사항)

### 3. 개발 서버 실행

```bash
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:5173`으로 접속할 수 있습니다.

### 4. HTTPS 개발 서버 (선택사항)

```bash
npm run dev:https
```

### 5. 빌드

```bash
npm run build
```

## 📝 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run dev:https` - HTTPS 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run preview` - 빌드된 앱 미리보기
- `npm run test` - 테스트 실행
- `npm run test:watch` - 테스트 감시 모드
- `npm run test:coverage` - 테스트 커버리지 확인
- `npm run lint` - ESLint 검사
- `npm run lint:fix` - ESLint 자동 수정
- `npm run format` - Prettier 포맷팅
- `npm run type-check` - TypeScript 타입 검사
- `npm run security:audit` - 보안 감사

## 🏗 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── ui/             # shadcn/ui 컴포넌트
│   ├── auth/           # 인증 관련 컴포넌트
│   ├── dashboard/      # 대시보드 컴포넌트
│   ├── goals/          # 목표 관리 컴포넌트
│   ├── progress/       # 진행 추적 컴포넌트
│   ├── patients/       # 환자 관리 컴포넌트
│   └── ai/             # AI 추천 관련 컴포넌트
├── contexts/           # React Context Providers
│   ├── AuthContext.tsx # 인증 컨텍스트
│   └── DashboardContext.tsx # 대시보드 상태 관리
├── hooks/              # 커스텀 React 훅
├── lib/                # 유틸리티 및 설정
│   ├── env.ts          # 환경변수 헬퍼
│   ├── queryClient.ts  # TanStack Query 설정
│   ├── supabase.ts     # Supabase 클라이언트
│   ├── eventBus.ts     # 이벤트 버스 시스템
│   └── utils.ts        # 공통 유틸리티
├── pages/              # 페이지 컴포넌트
│   ├── Dashboard.tsx   # 메인 대시보드
│   ├── GoalSetting.tsx # 목표 설정
│   ├── ProgressTracking.tsx # 진행 추적
│   ├── PatientManagement.tsx # 환자 관리
│   └── Reports.tsx     # 보고서 및 통계
├── services/           # API 서비스 레이어
├── types/              # TypeScript 타입 정의
└── utils/              # 유틸리티 함수
```

## 💡 주요 기능 상세

### 1. 목표 완료 시스템

목표 완료는 사용자 확인 기반으로 작동합니다:

1. **주간 목표 체크**: 
   - 달성/미달성 선택
   - 모든 주간 목표 완료 시 월간 목표 완료 확인 대화상자 표시

2. **월간 목표 완료**:
   - 사용자가 확인하면 status를 'completed'로 변경
   - 모든 월간 목표 완료 시 6개월 목표 완료 확인 대화상자 표시

3. **6개월 목표 완료**:
   - 모든 목표 완료 시 축하 메시지 표시
   - 환자 status를 'inactive'로 변경

### 2. 달성률 계산

- 'completed' 상태의 목표만 달성률에 반영
- 'cancelled' (미달성) 목표는 0%로 계산
- 상위 목표의 진행률은 하위 목표의 평균으로 자동 계산

### 3. AI 목표 추천

- 5가지 평가 항목 기반 분석
- N8N 웹훅을 통한 외부 AI 서비스 연동
- 3가지 맞춤형 재활 계획 제시
- 선택된 계획으로 목표 자동 생성

## 🔧 데이터베이스 구조

### 주요 테이블
- `users` - 사용자 정보 (Supabase Auth)
- `social_workers` - 사회복지사 프로필
- `patients` - 환자 정보
- `assessments` - 평가 기록
- `rehabilitation_goals` - 재활 목표 (계층 구조)
- `weekly_check_ins` - 주간 체크인 기록
- `goal_evaluations` - 목표 평가
- `ai_goal_recommendations` - AI 추천 기록

### 주요 트리거
- `calculate_goal_progress_and_status` - 진행률 자동 계산
- `update_goal_completion` - 상위 목표 진행률 업데이트
- `record_goal_history` - 목표 변경 이력 기록

## 🔒 보안

### Row Level Security (RLS)
- 모든 테이블에 RLS 정책 적용
- 역할 기반 접근 제어 (RBAC)
- 관리자/사회복지사/환자별 권한 분리

### 인증 및 세션 관리
- Supabase Auth JWT 기반 인증
- 세션 자동 갱신
- 보안 쿠키 사용

## 🚨 환경변수 확인

개발 환경에서는 앱 상단에 환경변수 상태가 표시됩니다:
- ✅ 연결됨: 모든 환경변수가 올바르게 설정됨
- ❌ 연결 실패: 환경변수 확인 필요

## 🐛 알려진 이슈 및 해결방법

### 1. 목표 완료 대화상자가 표시되지 않는 경우
- DB 트리거가 자동으로 status를 변경하지 않도록 수정됨
- 사용자 확인 후에만 status가 변경되도록 설계

### 2. 페이지 새로고침 시 6개월 목표 완료 확인
- 현재 페이지 로드 시에만 확인
- 향후 실시간 감지 기능 추가 예정

### 3. UI 투명도 문제
- AlertDialog에 `className="bg-white"` 추가 필요

## 📚 추가 정보

- [Supabase 문서](https://supabase.com/docs)
- [TanStack Query 문서](https://tanstack.com/query/latest)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com/)
- [N8N 문서](https://docs.n8n.io/)

## 🤝 기여 가이드

1. 이슈를 먼저 생성하여 문제나 기능을 논의하세요
2. 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'feat: Add amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

## 📄 라이선스

이 프로젝트는 비공개 프로젝트입니다. 무단 복제 및 배포를 금지합니다.

---

**프로젝트 버전**: v0.1.0  
**최종 업데이트**: 2025-06-17  
**작성자**: 박승현
