# 브랜치 보호 규칙 설정 가이드

## GitHub 브랜치 보호 규칙 설정 방법

### 1. GitHub 저장소로 이동
- https://github.com/Cooledricesh/Psyrehab 접속

### 2. Settings → Branches 메뉴로 이동

### 3. "Add rule" 클릭

### 4. 다음 설정 적용:

#### Branch name pattern
- `main` 입력

#### Protect matching branches 설정

✅ **Require a pull request before merging**
- ✅ Require approvals: 1
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from CODEOWNERS (선택사항)

✅ **Require status checks to pass before merging**
- ✅ Require branches to be up to date before merging
- Status checks 검색창에서 다음 항목들 추가:
  - `Type Check`
  - `Lint`
  - `Run Tests`
  - `Build`

✅ **Require conversation resolution before merging**

✅ **Require linear history** (선택사항)

✅ **Include administrators**
- 관리자도 같은 규칙을 따르도록 설정

### 5. "Create" 클릭하여 규칙 생성

## 효과

이 설정을 적용하면:
- main 브랜치에 직접 푸시 불가
- 모든 변경사항은 Pull Request를 통해서만 가능
- PR 머지 전 최소 1명의 리뷰어 승인 필요
- 모든 CI 체크(타입체크, 린트, 테스트, 빌드)가 통과해야 머지 가능
- PR의 모든 대화가 해결되어야 머지 가능

## 추가 권장사항

### CODEOWNERS 파일 생성 (선택사항)
`.github/CODEOWNERS` 파일을 생성하여 특정 파일/디렉토리의 필수 리뷰어 지정:

```
# 전체 코드베이스의 기본 소유자
* @Cooledricesh

# 특정 디렉토리의 소유자 예시
/src/components/ @frontend-team
/src/services/ @backend-team
```

### 자동 병합 설정 (선택사항)
- Settings → General → Pull Requests에서 "Allow auto-merge" 활성화
- 모든 체크가 통과하면 자동으로 머지되도록 설정 가능