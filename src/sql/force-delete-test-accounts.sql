-- 테스트 계정 강제 삭제 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. 현재 상태 확인
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('test@psyrehab.com', 'test@psyrehab.local');

-- 2. 관련 테이블에서 모두 삭제
DO $$
DECLARE
    test_user_ids UUID[] := ARRAY[
        '706cb795-1766-403d-ab8c-d69e8920a823'::UUID,  -- test@psyrehab.com
        '11111111-1111-1111-1111-111111111111'::UUID   -- test@psyrehab.local
    ];
BEGIN
    -- 외래키 제약을 임시로 비활성화
    SET session_replication_role = 'replica';
    
    -- 모든 관련 테이블에서 삭제
    DELETE FROM administrators WHERE user_id = ANY(test_user_ids);
    DELETE FROM social_workers WHERE user_id = ANY(test_user_ids);
    DELETE FROM patients WHERE user_id = ANY(test_user_ids);
    DELETE FROM user_roles WHERE user_id = ANY(test_user_ids);
    DELETE FROM signup_requests WHERE user_id = ANY(test_user_ids);
    DELETE FROM rehabilitation_goals WHERE created_by_social_worker_id = ANY(test_user_ids);
    DELETE FROM assessments WHERE assessed_by = ANY(test_user_ids);
    DELETE FROM weekly_check_ins WHERE checked_by = ANY(test_user_ids);
    DELETE FROM goal_evaluations WHERE evaluated_by = ANY(test_user_ids);
    DELETE FROM goal_history WHERE changed_by = ANY(test_user_ids);
    DELETE FROM service_records WHERE social_worker_id = ANY(test_user_ids);
    
    -- patients 테이블의 primary_social_worker_id NULL로 변경
    UPDATE patients SET primary_social_worker_id = NULL 
    WHERE primary_social_worker_id = ANY(test_user_ids);
    
    -- auth.users에서 삭제
    DELETE FROM auth.users WHERE id = ANY(test_user_ids);
    
    -- 외래키 제약 다시 활성화
    SET session_replication_role = 'origin';
    
    RAISE NOTICE '삭제 완료!';
END $$;

-- 3. 삭제 확인
SELECT id, email 
FROM auth.users 
WHERE email IN ('test@psyrehab.com', 'test@psyrehab.local');
