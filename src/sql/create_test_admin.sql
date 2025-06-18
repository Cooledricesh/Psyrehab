-- 테스트를 위한 관리자 계정 생성
-- 이미 관리자가 있는지 확인

-- 현재 관리자 목록 확인
SELECT 
    a.user_id,
    a.full_name,
    a.employee_id,
    u.email,
    a.is_active
FROM administrators a
JOIN auth.users u ON u.id = a.user_id
JOIN user_roles ur ON ur.user_id = a.user_id
WHERE ur.role_id = 'd7fcf425-85bc-42b4-8806-917ef6939a40';

-- 만약 관리자가 없다면, 기존 사용자를 관리자로 승격
-- test@psyrehab.com 사용자를 관리자로 설정
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- test@psyrehab.com 사용자의 ID 찾기
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'test@psyrehab.com'
    LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- 기존 역할 삭제
        DELETE FROM user_roles WHERE user_id = v_user_id;
        
        -- 관리자 역할 할당
        INSERT INTO user_roles (user_id, role_id)
        VALUES (v_user_id, 'd7fcf425-85bc-42b4-8806-917ef6939a40')
        ON CONFLICT DO NOTHING;
        
        -- 관리자 프로필 생성 (없으면)
        INSERT INTO administrators (user_id, full_name, employee_id, department, is_active)
        VALUES (v_user_id, '테스트 관리자', 'ADMIN001', '시스템관리부', true)
        ON CONFLICT (user_id) DO UPDATE
        SET is_active = true;
        
        RAISE NOTICE 'test@psyrehab.com 사용자가 관리자로 설정되었습니다.';
    ELSE
        RAISE NOTICE 'test@psyrehab.com 사용자를 찾을 수 없습니다.';
    END IF;
END $$;
