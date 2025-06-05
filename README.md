# 정신장애인 재활 목표 관리 플랫폼

정신과 사회복지사가 환자의 재활 목표를 체계적으로 관리하는 웹 플랫폼입니다. AI 기반 목표 추천과 계층적 목표 관리 시스템을 제공합니다.

## 🛠 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint + Prettier

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
```

**환경변수 설명:**
- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase 익명 키 (공개 키)
- `VITE_N8N_WEBHOOK_URL`: AI 기능을 위한 n8n 웹훅 URL

### 3. 개발 서버 실행

```bash
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:5173`으로 접속할 수 있습니다.

### 4. 빌드

```bash
npm run build
```

## 📝 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run preview` - 빌드된 앱 미리보기
- `npm run lint` - ESLint 검사
- `npm run lint:fix` - ESLint 자동 수정
- `npm run format` - Prettier 포맷팅
- `npm run format:check` - Prettier 검사

## 🏗 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   └── ui/             # shadcn/ui 컴포넌트
├── lib/                # 유틸리티 및 설정
│   ├── env.ts          # 환경변수 헬퍼
│   ├── queryClient.ts  # TanStack Query 설정
│   ├── supabase.ts     # Supabase 클라이언트
│   └── utils.ts        # 공통 유틸리티
├── hooks/              # 커스텀 React 훅
├── pages/              # 페이지 컴포넌트
└── types/              # TypeScript 타입 정의
```

## 🔧 개발 환경 설정

### ESLint & Prettier

프로젝트는 ESLint와 Prettier가 설정되어 있습니다:
- TypeScript + React 린팅 규칙
- 자동 코드 포맷팅
- Git 커밋 전 자동 검사

### TanStack Query

서버 상태 관리를 위해 TanStack Query가 설정되어 있습니다:
- 5분 staleTime, 10분 gcTime
- 4xx 에러 시 재시도 방지 (429 제외)
- 개발 환경에서 DevTools 사용 가능

### Supabase

백엔드 연결을 위한 Supabase 클라이언트가 설정되어 있습니다:
- 자동 세션 관리
- 토큰 자동 갱신
- URL에서 세션 감지

## 🚨 환경변수 확인

개발 환경에서는 앱 상단에 환경변수 상태가 표시됩니다:
- ✅ 연결됨: 모든 환경변수가 올바르게 설정됨
- ❌ 연결 실패: 환경변수 확인 필요

## 📚 추가 정보

- [Supabase 문서](https://supabase.com/docs)
- [TanStack Query 문서](https://tanstack.com/query/latest)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com/)
