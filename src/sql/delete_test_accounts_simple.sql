-- 테스트 관리자 계정 삭제 (간단 버전)
-- Supabase Dashboard > SQL Editor에서 실행

-- 1단계: 삭제할 사용자 확인
SELECT 
  a.user_id,
  a.full_name,
  u.email
FROM administrators a
LEFT JOIN auth.users u ON u.id = a.user_id
WHERE a.full_name IN ('박사회', '개발 관리자');

-- 2단계: 각 테이블에서 순서대로 삭제
-- 주의: user_id를 위에서 확인한 값으로 변경하세요

-- administrators 테이블에서 삭제
DELETE FROM administrators 
WHERE full_name IN ('박사회', '개발 관리자');

-- user_roles 테이블에서 삭제
DELETE FROM user_roles 
WHERE user_id IN (
  '8b08cf58-13e9-4a45-9b97-4455fa466d62',
  '0c8deaa8-64d5-47bb-9b00-60ea9c6d5421'
);

-- signup_requests 테이블에서 삭제 (있다면)
DELETE FROM signup_requests 
WHERE user_id IN (
  '8b08cf58-13e9-4a45-9b97-4455fa466d62',
  '0c8deaa8-64d5-47bb-9b00-60ea9c6d5421'
);

-- 3단계: auth.users에서 삭제
-- 방법 1: SQL로 시도 (권한이 있다면)
DELETE FROM auth.users 
WHERE id IN (
  '8b08cf58-13e9-4a45-9b97-4455fa466d62',
  '0c8deaa8-64d5-47bb-9b00-60ea9c6d5421'
);

-- 방법 2: 위 SQL이 실패하면
-- Supabase Dashboard > Authentication > Users 탭에서
-- 해당 사용자를 찾아서 수동으로 삭제
