-- 초강력 삭제 방법
-- 주의: 이 방법은 데이터베이스 무결성을 무시합니다

-- 1. RLS 정책 임시 비활성화
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- 2. 트리거 임시 비활성화
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- 3. 강제 삭제
DELETE FROM auth.users 
WHERE email IN ('test@psyrehab.com', 'test@psyrehab.local')
   OR id IN (
       '706cb795-1766-403d-ab8c-d69e8920a823',
       '11111111-1111-1111-1111-111111111111'
   );

-- 4. 트리거 다시 활성화
ALTER TABLE auth.users ENABLE TRIGGER ALL;

-- 5. RLS 다시 활성화
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- 6. 확인
SELECT COUNT(*) as remaining_test_accounts
FROM auth.users 
WHERE email IN ('test@psyrehab.com', 'test@psyrehab.local');
