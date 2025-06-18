-- 초기 관리자 계정 생성을 위한 SQL
-- 주의: 이 SQL은 Supabase Dashboard에서 직접 실행해야 합니다.

-- 1. 먼저 관리자가 있는지 확인
SELECT 
    u.email,
    a.full_name,
    a.employee_id,
    ur.created_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
LEFT JOIN administrators a ON a.user_id = ur.user_id
WHERE ur.role_id = 'd7fcf425-85bc-42b4-8806-917ef6939a40';

-- 2. 만약 관리자가 없다면, 첫 번째 사용자를 관리자로 설정
-- 아래 쿼리에서 이메일을 실제 관리자로 지정할 이메일로 변경하세요
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'admin@psyrehab.com'; -- 여기에 관리자 이메일 입력
BEGIN
    -- 해당 이메일의 사용자 찾기
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email
    LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- 기존 역할 삭제
        DELETE FROM user_roles WHERE user_id = v_user_id;
        
        -- 관리자 역할 할당
        INSERT INTO user_roles (user_id, role_id)
        VALUES (v_user_id, 'd7fcf425-85bc-42b4-8806-917ef6939a40');
        
        -- 관리자 프로필 생성 또는 업데이트
        INSERT INTO administrators (
            user_id, 
            full_name, 
            employee_id, 
            department, 
            is_active
        )
        VALUES (
            v_user_id, 
            '시스템 관리자', 
            'ADMIN001', 
            '시스템관리부', 
            true
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            is_active = true,
            updated_at = now();
        
        RAISE NOTICE '% 사용자가 관리자로 설정되었습니다.', v_email;
    ELSE
        RAISE NOTICE '% 이메일을 가진 사용자를 찾을 수 없습니다. 먼저 해당 이메일로 회원가입을 진행해주세요.', v_email;
    END IF;
END $$;

-- 3. 결과 확인
SELECT 
    u.email,
    a.full_name,
    a.employee_id,
    a.is_active,
    ur.created_at as role_assigned_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
JOIN administrators a ON a.user_id = ur.user_id
WHERE ur.role_id = 'd7fcf425-85bc-42b4-8806-917ef6939a40';
