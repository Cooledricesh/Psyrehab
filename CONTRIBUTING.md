# Contributing to PsyRehab

PsyRehab 프로젝트에 기여해주셔서 감사합니다! 이 문서는 프로젝트 기여를 위한 가이드라인을 제공합니다.

## 📋 목차

- [행동 강령](#행동-강령)
- [기여 방법](#기여-방법)
- [개발 환경 설정](#개발-환경-설정)
- [브랜치 전략](#브랜치-전략)
- [커밋 규칙](#커밋-규칙)
- [코드 스타일](#코드-스타일)
- [Pull Request 프로세스](#pull-request-프로세스)
- [코드 리뷰](#코드-리뷰)
- [테스트](#테스트)
- [문서화](#문서화)

## 행동 강령

- 모든 참여자를 존중하고 포용적인 환경을 만들어주세요
- 건설적인 피드백을 제공하고 받아들여주세요
- 커뮤니티의 이익을 우선시해주세요

## 기여 방법

1. **이슈 확인**: 기존 이슈를 확인하거나 새로운 이슈를 생성합니다
2. **포크**: 저장소를 포크합니다
3. **브랜치 생성**: 기능별로 브랜치를 생성합니다
4. **개발**: 코드를 작성하고 테스트합니다
5. **커밋**: 규칙에 따라 커밋합니다
6. **PR 생성**: Pull Request를 생성합니다
7. **리뷰**: 코드 리뷰를 진행합니다

## 개발 환경 설정

### 필수 요구사항

- Node.js 18.20.0 이상 (권장: 18.20.0)
- npm 9.0.0 이상

### 환경 설정

```bash
# 저장소 클론
git clone https://github.com/[your-username]/PsyRehab.git
cd PsyRehab

# Node 버전 설정 (nvm 사용 시)
nvm use

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 필요한 값 설정

# 개발 서버 실행
npm run dev
```

## 브랜치 전략

### 브랜치 타입

- `main`: 프로덕션 배포 브랜치
- `develop`: 개발 통합 브랜치
- `feature/*`: 새로운 기능 개발
- `fix/*`: 버그 수정
- `hotfix/*`: 긴급 수정
- `docs/*`: 문서 업데이트
- `refactor/*`: 코드 리팩토링
- `test/*`: 테스트 추가/수정
- `chore/*`: 빌드, 설정 등

### 브랜치 명명 규칙

```
<type>/<issue-number>-<short-description>

예시:
feature/123-add-patient-export
fix/456-login-error
docs/789-update-readme
```

## 커밋 규칙

### Conventional Commits 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 리팩토링
- `perf`: 성능 개선
- `test`: 테스트 추가/수정
- `chore`: 빌드, 패키지 매니저 설정 등
- `revert`: 커밋 되돌리기

### Scope (선택사항)

- `auth`: 인증 관련
- `patient`: 환자 관리
- `goal`: 목표 관리
- `assessment`: 평가 관련
- `ui`: UI 컴포넌트
- `api`: API 서비스
- `deps`: 의존성

### 예시

```bash
feat(auth): 소셜 로그인 기능 추가

Google OAuth를 사용한 소셜 로그인 기능을 구현했습니다.
- Google OAuth 2.0 설정
- 로그인 버튼 UI 추가
- 사용자 프로필 동기화

Closes #123
```

### 커밋 메시지 규칙

1. 제목은 50자 이내로 작성
2. 제목 끝에 마침표 사용하지 않음
3. 제목은 명령문으로 작성 (예: "추가한다" not "추가했다")
4. 본문은 72자마다 줄바꿈
5. 본문에는 '무엇을', '왜' 설명
6. 이슈 번호가 있으면 footer에 참조

## 코드 스타일

### TypeScript/JavaScript

- ESLint와 Prettier 설정을 따릅니다
- 타입 안전성을 최우선으로 합니다
- `any` 타입 사용을 피합니다

### 일반 규칙

1. **명명 규칙**
   - 컴포넌트: PascalCase (예: `PatientList`)
   - 함수/변수: camelCase (예: `getUserData`)
   - 상수: UPPER_SNAKE_CASE (예: `MAX_RETRY_COUNT`)
   - 파일명: 컴포넌트는 PascalCase, 그 외는 kebab-case

2. **Import 순서**
   ```typescript
   // 1. React
   import React from 'react'
   
   // 2. 외부 라이브러리
   import { useQuery } from '@tanstack/react-query'
   
   // 3. 내부 모듈
   import { Button } from '@/components/ui/button'
   import { authService } from '@/services'
   
   // 4. 타입
   import type { User } from '@/types/auth'
   
   // 5. 스타일
   import './styles.css'
   ```

3. **코드 품질**
   - 함수는 단일 책임 원칙을 따릅니다
   - 복잡한 로직은 주석으로 설명합니다
   - 매직 넘버는 상수로 정의합니다

### 코드 검증

```bash
# 린트 검사
npm run lint

# 린트 자동 수정
npm run lint:fix

# 타입 체크
npm run type-check

# 포맷팅
npm run format

# 전체 검증 (CI와 동일)
npm run ci
```

## Pull Request 프로세스

### PR 생성 전 체크리스트

- [ ] 코드가 프로젝트 스타일 가이드를 따르는가?
- [ ] 모든 테스트가 통과하는가?
- [ ] 린트 에러가 없는가?
- [ ] 타입 체크가 통과하는가?
- [ ] 관련 문서를 업데이트했는가?
- [ ] CLAUDE.md를 검토했는가?

### PR 템플릿

```markdown
## 개요
이 PR이 해결하는 문제나 추가하는 기능을 간단히 설명해주세요.

## 변경 사항
- 주요 변경 사항 1
- 주요 변경 사항 2

## 테스트
어떻게 테스트했는지 설명해주세요.

## 체크리스트
- [ ] 코드 스타일 가이드를 따랐습니다
- [ ] 셀프 리뷰를 완료했습니다
- [ ] 코드에 주석을 추가했습니다 (필요한 경우)
- [ ] 문서를 업데이트했습니다
- [ ] 테스트를 추가했습니다
- [ ] 모든 테스트가 통과합니다
- [ ] 보안 영향을 검토했습니다

## 관련 이슈
Closes #이슈번호
```

### PR 제목 형식

```
<type>: <description> (#issue-number)

예시:
feat: 환자 데이터 내보내기 기능 추가 (#123)
fix: 로그인 시 발생하는 타입 에러 수정 (#456)
```

## 코드 리뷰

### 리뷰어 가이드

1. **기능성**: 코드가 의도한 대로 동작하는가?
2. **가독성**: 코드가 이해하기 쉬운가?
3. **유지보수성**: 향후 수정이 용이한가?
4. **성능**: 성능 문제는 없는가?
5. **보안**: 보안 취약점은 없는가?
6. **테스트**: 적절한 테스트가 있는가?

### 리뷰 코멘트 예시

```markdown
# 제안
```suggestion
// 더 명확한 변수명 사용
const userData = await fetchUserData(userId);
```

# 질문
이 로직이 필요한 이유를 설명해주실 수 있나요?

# 칭찬
깔끔한 에러 처리 👍
```

### 리뷰 응답

- 모든 코멘트에 응답합니다
- 수정 사항은 별도 커밋으로 추가합니다
- 의견 불일치는 건설적으로 논의합니다

## 테스트

### 테스트 작성 가이드

1. **단위 테스트**: 개별 함수/컴포넌트
2. **통합 테스트**: 여러 모듈 간 상호작용
3. **E2E 테스트**: 사용자 시나리오

### 테스트 명명 규칙

```typescript
describe('ComponentName', () => {
  it('should do something when condition', () => {
    // 테스트 코드
  });
  
  it('should handle error when invalid input', () => {
    // 에러 처리 테스트
  });
});
```

### 테스트 실행

```bash
# 단위 테스트
npm test

# 테스트 watch 모드
npm run test:watch

# 커버리지 확인
npm run test:coverage

# E2E 테스트 (추가 예정)
npm run test:e2e
```

## 문서화

### 코드 주석

```typescript
/**
 * 사용자 정보를 가져옵니다
 * @param userId - 사용자 ID
 * @returns 사용자 정보 객체
 * @throws {AuthError} 인증 실패 시
 */
async function getUser(userId: string): Promise<User> {
  // 구현
}
```

### README 업데이트

- 새로운 기능 추가 시 README 업데이트
- 설치/설정 방법 변경 시 반영
- 스크린샷 추가 (UI 변경 시)

### API 문서

- 새로운 서비스/훅 추가 시 문서화
- 파라미터, 반환값, 에러 설명 포함

## 릴리스 프로세스

1. `develop` → `main` PR 생성
2. 모든 테스트 통과 확인
3. 코드 리뷰 완료
4. 버전 태그 생성
5. 배포

## 도움 요청

- 기술적 질문: GitHub Issues 사용
- 보안 문제: 비공개로 메인테이너에게 연락
- 일반 토론: GitHub Discussions 사용

## 라이선스

기여하신 코드는 프로젝트와 동일한 라이선스를 따릅니다.

---

감사합니다! 여러분의 기여가 PsyRehab을 더 나은 프로젝트로 만듭니다. 🎉