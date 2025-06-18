-- 테스트 관리자 계정 완전 삭제 스크립트
-- 주의: 이 스크립트는 Supabase Dashboard의 SQL Editor에서 실행해야 합니다

-- 1. 삭제할 사용자 ID 확인
WITH test_users AS (
  SELECT 
    a.user_id,
    a.full_name,
    u.email
  FROM administrators a
  INNER JOIN auth.users u ON u.id = a.user_id
  WHERE a.full_name IN ('박사회', '개발 관리자')
)
SELECT * FROM test_users;

-- 2. 관련 데이터 삭제 (위에서 확인한 user_id를 사용)
-- 예시: user_id가 '8b08cf58-13e9-4a45-9b97-4455fa466d62'와 '0c8deaa8-64d5-47bb-9b00-60ea9c6d5421'인 경우

DO $$
DECLARE
  user_ids UUID[] := ARRAY[
    '8b08cf58-13e9-4a45-9b97-4455fa466d62'::UUID,
    '0c8deaa8-64d5-47bb-9b00-60ea9c6d5421'::UUID
  ];
  user_id UUID;
BEGIN
  FOREACH user_id IN ARRAY user_ids
  LOOP
    -- administrators 테이블에서 삭제
    DELETE FROM administrators WHERE user_id = user_id;
    
    -- user_roles 테이블에서 삭제
    DELETE FROM user_roles WHERE user_id = user_id;
    
    -- signup_requests 테이블에서 삭제
    DELETE FROM signup_requests WHERE user_id = user_id;
    
    -- auth.users에서 삭제 (관리자 권한 필요)
    -- 주의: 이 부분은 Supabase Dashboard > Authentication > Users에서 수동으로 삭제해야 할 수 있습니다
    DELETE FROM auth.users WHERE id = user_id;
  END LOOP;
END $$;

-- 3. 삭제 확인
SELECT 
  'administrators' as table_name,
  COUNT(*) as count
FROM administrators
WHERE user_id IN (
  '8b08cf58-13e9-4a45-9b97-4455fa466d62',
  '0c8deaa8-64d5-47bb-9b00-60ea9c6d5421'
)
UNION ALL
SELECT 
  'user_roles' as table_name,
  COUNT(*) as count
FROM user_roles
WHERE user_id IN (
  '8b08cf58-13e9-4a45-9b97-4455fa466d62',
  '0c8deaa8-64d5-47bb-9b00-60ea9c6d5421'
)
UNION ALL
SELECT 
  'auth.users' as table_name,
  COUNT(*) as count
FROM auth.users
WHERE id IN (
  '8b08cf58-13e9-4a45-9b97-4455fa466d62',
  '0c8deaa8-64d5-47bb-9b00-60ea9c6d5421'
);
