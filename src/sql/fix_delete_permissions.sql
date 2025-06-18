-- administrators 테이블의 RLS 정책 확인 및 수정

-- 1. 현재 RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'administrators';

-- 2. 관리자가 administrators 삭제할 수 있는 정책 추가
CREATE POLICY "Admins can delete administrators"
ON administrators
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role_id = 'd7fcf425-85bc-42b4-8806-917ef6939a40'
    )
);

-- 3. social_workers 테이블에도 동일한 정책 추가
CREATE POLICY "Admins can delete social_workers"
ON social_workers
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role_id = 'd7fcf425-85bc-42b4-8806-917ef6939a40'
    )
);

-- 4. 특정 테스트 계정 강제 삭제 (RLS 우회)
-- 주의: 이 방법은 보안을 우회하므로 주의해서 사용
ALTER TABLE administrators DISABLE ROW LEVEL SECURITY;

DELETE FROM administrators 
WHERE user_id IN (
    '8b08cf58-13e9-4a45-9b97-4455fa466d62',
    '0c8deaa8-64d5-47bb-9b00-60ea9c6d5421'
);

ALTER TABLE administrators ENABLE ROW LEVEL SECURITY;

-- 5. user_roles에서도 삭제
DELETE FROM user_roles 
WHERE user_id IN (
    '8b08cf58-13e9-4a45-9b97-4455fa466d62',
    '0c8deaa8-64d5-47bb-9b00-60ea9c6d5421'
);

-- 6. 결과 확인
SELECT 
    'administrators' as table_name,
    COUNT(*) as remaining_count
FROM administrators
WHERE user_id IN (
    '8b08cf58-13e9-4a45-9b97-4455fa466d62',
    '0c8deaa8-64d5-47bb-9b00-60ea9c6d5421'
)
UNION ALL
SELECT 
    'user_roles' as table_name,
    COUNT(*) as remaining_count
FROM user_roles
WHERE user_id IN (
    '8b08cf58-13e9-4a45-9b97-4455fa466d62',
    '0c8deaa8-64d5-47bb-9b00-60ea9c6d5421'
);
